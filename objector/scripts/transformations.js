
import { matrix4 as m4 } from "./matrix4.js";
import { vector3 as v3 } from "./vector3.js";

var transformations = {
    translate : function (v) {
        return [
              1,    0,    0,  0,
              0,    1,    0,  0,
              0,    0,    1,  0,
            v[0], v[1], v[2], 1
        ];
    },

    scale : function (s) {
        return [
            s, 0, 0, 0,
            0, s, 0, 0,
            0, 0, s, 0,
            0, 0, 0, 1
        ];
    },

    rotx : function (a) {
        var c = Math.cos(a/180*Math.PI);
        var s = Math.sin(a/180*Math.PI);
        return [
            1,  0, 0, 0,
            0,  c, s, 0,
            0, -s, c, 0,
            0,  0, 0, 1
        ];
    },

    roty : function (a) {
        var c = Math.cos(a/180*Math.PI);
        var s = Math.sin(a/180*Math.PI);
        return [
            c, 0, -s, 0,
            0, 1,  0, 0,
            s, 0,  c, 0,
            0, 0,  0, 1
        ];
    },

    rotz : function (a) {
        var c = Math.cos(a/180*Math.PI);
        var s = Math.sin(a/180*Math.PI);
        return [
             c, s, 0, 0,
            -s, c, 0, 0,
             0, 0, 1, 0,
             0, 0, 0, 1
        ];
    },

    view : function (cam) {
        var u = v3.vectormul(cam.look, cam.up);

        var trot = [
            u[0], cam.up[0], -cam.look[0], 0,
            u[1], cam.up[1], -cam.look[1], 0,
            u[2], cam.up[2], -cam.look[2], 0,
              0,         0,            0,  1
        ];

        var ttr = [
                1,           0,           0,       0,
                0,           1,           0,       0,
                0,           0,           1,       0,
            -cam.eye[0], -cam.eye[1], -cam.eye[2], 1
        ];

        var r = m4.mul(trot, ttr);
        return r;
    },

    axon : function (cam) {
        var z = 1 / (cam.near - cam.far);
        var y = 1 / (2 * cam.median * Math.tan(cam.fovy / 2));
        var x = y / cam.aspect;
        return [
            2*x,  0,        0,             0,
             0,  2*y,       0,             0,
             0,   0,       2*z,            0,
             0,   0, (cam.near+cam.far)*z, 1
        ];
    },

    persp : function (cam) {
        var f = cam.far;
        var n = cam.near;
        var a = cam.aspect;
        var nf = 1 / (n-f);
        var g  = 1 / Math.tan(cam.fovy / 2);
        return [
            g/a, 0,     0,       0,
             0,  g,     0,       0,
             0,  0,  (f+n)*nf,  -1,
             0,  0, 2.0*f*n*nf,  0
        ];
    }
}

export { transformations };
