(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.BasicRenderer = {}));
}(this, (function(exports) {
    'use strict';


    /* ------------------------------------------------------------ */

    // função auxiliar para triangularizar os círculos
    function triangulation(circle, numTriangles) {
        let points = [];
        let triangles = [];

        for ( let i = 0; i < numTriangles; i++) {
            points.push([
                circle.radius * Math.cos(i / numTriangles * 2 * Math.PI) + circle.center[0],
                circle.radius * Math.sin(i / numTriangles * 2 * Math.PI) + circle.center[1]
            ]);
        }
        for ( let i = 0; i < numTriangles; i++ ) {
            triangles.push([
                [ points[i][0], points[i][1] ],
                [ ...points[(i+1) % numTriangles ] ],
                [ circle.center[0], circle.center[1] ]
            ]);
        }

        return triangles;
    }

    // função auxiliar para verificar se um ponto está à esquerda,
    // direita ou sobre uma reta que passa por outros dois pontos
    function isLeft(p0, p1, p2) {
        return ((p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]));
    }

    // verifica se um ponto está num polígono usando o algoritmo
    // de winding number, de modo que funcione também com polígonos
    // não-convexos
    function checkPolygon(x, y, polygon) {
        let wn = 0;

        for (let i = 0; i < polygon.vertices.length; i++) {
            let currentVertex = polygon.vertices[i];
            let nextVertex = i === polygon.vertices.length - 1 ? polygon.vertices[0] : polygon.vertices[i + 1];
            if (currentVertex[1] <= y) {
                if (nextVertex[1] > y) {
                    if (isLeft(currentVertex, nextVertex, [x, y]) > 0) wn++;
                }
            } else {
                if (nextVertex[1] <= y) {
                    if (isLeft(currentVertex, nextVertex, [x, y]) < 0) wn--;
                }
            }
        }

        return wn !== 0;
    }

    function checkTriangle(x, y, triangle) {
        // a função usa o método dos produtos vetoriais para determinar se
        // o ponto está no interior do triângulo

        // calcula os vetores correspondentes às arestas
        let edge0 = [triangle.vertices[1][0] - triangle.vertices[0][0],
                     triangle.vertices[1][1] - triangle.vertices[0][1]];
        let edge1 = [triangle.vertices[2][0] - triangle.vertices[1][0],
                     triangle.vertices[2][1] - triangle.vertices[1][1]];
        let edge2 = [triangle.vertices[0][0] - triangle.vertices[2][0],
                     triangle.vertices[0][1] - triangle.vertices[2][1]];

        // calcula os vetores dos vértices ao ponto q
        let q0 = [x - triangle.vertices[0][0],
                  y - triangle.vertices[0][1]];
        let q1 = [x - triangle.vertices[1][0],
                  y - triangle.vertices[1][1]];
        let q2 = [x - triangle.vertices[2][0],
                  y - triangle.vertices[2][1]];

        // encontra a componente escalar do resultado dos produtos vetoriais
        let k0 = ((edge0[0] * q0[1]) - (edge0[1] * q0[0]));
        let k1 = ((edge1[0] * q1[1]) - (edge1[1] * q1[0]));
        let k2 = ((edge2[0] * q2[1]) - (edge2[1] * q2[0]));

        // se todos os sinais são positivos o ponto está dentro do triângulo
        if ((k1 > 0 && k2 > 0 && k0 > 0) ||
            (k1 < 0 && k2 < 0 && k0 < 0)) return true;
        return false;
    }

    // usa a verificação de triângulos para testar o
    // círculo triangularizado
    function checkCircle(x, y, circle) {
        for ( let trig of circle.trig ) {
            let triangle = {
                vertices: trig,
            }

            if ( checkTriangle(x, y, triangle) === true ) return true;
        }

        return false;
    }

    function inside(x, y, primitive) {
        // You should implement your inside test here for all shapes
        // for now, it only returns a false test

        // se a primitiva possuir uma bounding box e o ponto estiver fora dela, o ponto é desconsiderado
        if (primitive.hasOwnProperty('bbox')) {
            if (!(primitive.bbox.x1 < x && primitive.bbox.x2 > x &&
                   primitive.bbox.y1 < y && primitive.bbox.y2 > y))
                return false;
        }

        // verificação em função do tipo de primitiva
        switch (primitive.shape) {
            case 'triangle':
                return checkTriangle(x, y, primitive);
            case 'circle':
                return checkCircle(x, y, primitive);
            case 'polygon':
                return checkPolygon(x, y, primitive);
            default:
                return false;
        }

    }

    function Screen(width, height, scene) {
        this.width = width;
        this.height = height;
        this.scene = this.preprocess(scene);
        this.createImage();
    }

    Object.assign(Screen.prototype, {

        preprocess: function(scene) {
            // Possible preprocessing with scene primitives, for now we don't change anything
            // You may define bounding boxes, convert shapes, etc

            var preprop_scene = [];

            for (var primitive of scene) {
                // se a primitiva for um círculo, trangulariza para
                // facilitar a aplicação da transformação
                if ( primitive.shape === 'circle' ) {
                    primitive.trig = triangulation(primitive, 100);
                }

                // aplica as transformações às primitivas que as têm
                if (primitive.hasOwnProperty('xform')) {
                    if (primitive.hasOwnProperty('vertices')) {
                        for (let vertice of primitive.vertices) {
                            let x = vertice[0];
                            let y = vertice[1];

                            vertice[0] = primitive.xform[0][0] * x +
                                primitive.xform[0][1] * y +
                                primitive.xform[0][2] * 1;
                            vertice[1] = primitive.xform[1][0] * x +
                                primitive.xform[1][1] * y +
                                primitive.xform[1][2] * 1;
                        }
                    } else {
                        for ( let triangle of primitive.trig ) {
                            for ( let point of triangle ) {
                                let x = point[0];
                                let y = point[1];

                                point[0] = primitive.xform[0][0] * x +
                                    primitive.xform[0][1] * y +
                                    primitive.xform[0][2] * 1;
                                point[1] = primitive.xform[1][0] * x +
                                    primitive.xform[1][1] * y +
                                    primitive.xform[1][2] * 1;
                            }
                        }
                    }
                }

                // Se a primitiva tem vértices, adiciona uma bounding box a envolvendo paralela aos eixos x e y para otimizar a verificação
                if (primitive.hasOwnProperty('vertices')) {
                    let x1 = primitive.vertices[0][0];
                    let x2 = primitive.vertices[0][0];
                    let y1 = primitive.vertices[0][1];
                    let y2 = primitive.vertices[0][1];

                    for (let vertice of primitive.vertices) {
                        if (vertice[0] < x1) x1 = vertice[0];
                        if (vertice[0] > x2) x2 = vertice[0];
                        if (vertice[1] < y1) y1 = vertice[1];
                        if (vertice[1] > y2) y2 = vertice[1];
                    }

                    const bbox = { x1, x2, y1, y2 };
                    primitive.bbox = bbox;
                }

                // método análogo de bounding box para círculos triangularizados
                if (primitive.hasOwnProperty('trig')) {
                    let x1 = primitive.trig[0][0][0];
                    let x2 = primitive.trig[0][0][0];
                    let y1 = primitive.trig[0][0][1];
                    let y2 = primitive.trig[0][0][1];

                    for ( let triangle of primitive.trig ) {
                        for ( let vertice of triangle ) {
                            if (vertice[0] < x1) x1 = vertice[0];
                            if (vertice[0] > x2) x2 = vertice[0];
                            if (vertice[1] < y1) y1 = vertice[1];
                            if (vertice[1] > y2) y2 = vertice[1];
                        }
                    }

                    const bbox = { x1, x2, y1, y2 };
                    primitive.bbox = bbox;
                }

                preprop_scene.push(primitive);

            }


            return preprop_scene;
        },

        createImage: function() {
            this.image = nj.ones([this.height, this.width, 3]).multiply(255);
        },

        rasterize: function() {
            var color;

            // In this loop, the image attribute must be updated after the rasterization procedure.
            for (var primitive of this.scene) {

                // Loop through all pixels
                for (var i = 0; i < this.width; i++) {
                    var x = i + 0.5;
                    for (var j = 0; j < this.height; j++) {
                        var y = j + 0.5;

                        // First, we check if the pixel center is inside the primitive
                        if (inside(x, y, primitive)) {
                            // only solid colors for now
                            color = nj.array(primitive.color);
                            this.set_pixel(i, this.height - (j + 1), color);
                        }

                    }
                }
            }



        },

        set_pixel: function(i, j, colorarr) {
            // We assume that every shape has solid color

            this.image.set(j, i, 0, colorarr.get(0));
            this.image.set(j, i, 1, colorarr.get(1));
            this.image.set(j, i, 2, colorarr.get(2));
        },

        update: function() {
            // Loading HTML element
            var $image = document.getElementById('raster_image');
            $image.width = this.width; $image.height = this.height;

            // Saving the image
            nj.images.save(this.image, $image);
        }
    }
                 );

    exports.Screen = Screen;

})));

