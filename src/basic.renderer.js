(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.BasicRenderer = {}));
}(this, (function(exports) {
    'use strict';


    /* ------------------------------------------------------------ */

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

    function checkCircle(x, y, circle) {
        // verificação usando equação implícita da circunferência
        if (((x - circle.center[0]) ** 2 + (y - circle.center[1]) ** 2) <= circle.radius ** 2) return true;
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

            // Se a primitiva tem vértices, adiciona uma bounding box a envolvendo paralela aos eixos x e y para otimizar a verificação
            for (var primitive of scene) {
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

