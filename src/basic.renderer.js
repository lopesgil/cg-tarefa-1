(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.BasicRenderer = {}));
}(this, (function(exports) {
    'use strict';


    /* ------------------------------------------------------------ */

    function checkTriangle(x, y, triangle) {
        return false;
    }

    function checkCircle(x, y, circle) {
        if (((x - circle.center[0]) ** 2 + (y - circle.center[1]) ** 2) <= circle.radius ** 2) return true;
        return false;
    }

    function inside(x, y, primitive) {
        // You should implement your inside test here for all shapes
        // for now, it only returns a false test

        if (primitive.hasOwnProperty('bbox')) {
            if (!(primitive.bbox.x1 < x && primitive.bbox.x2 > x &&
                primitive.bbox.y1 < y && primitive.bbox.y2 > y))
                return false;
        }

        switch (primitive.shape) {
            case 'triangle':
                return checkTriangle(x, y, primitive);
            case 'circle':
                return checkCircle(x, y, primitive);
            default:
                return false;
        }

        return false
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

