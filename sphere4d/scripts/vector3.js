// v3.matrixmul(m,v) :
//
//  - vectors are column vectors
//  - matrices are row-major ordered
//
//
//                    [v0]
//                v:  [v1]
//                    [v2]
//          m:        [1]
// [ 00, 04, 08, 12 ]
// [ 01, 05, 09, 13 ]
// [ 02, 06, 10, 14 ]
// [ 03, 07, 11, 15 ]

import { matrix4 as m4 } from "./matrix4.js";

var init = function () {
    return [0, 0, 0];
};

var length = function (v) {
    return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
};

var lenn = function (v) {
    return v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
};

var add = function (va, vb) {
    return [
        va[0] + vb[0],
        va[1] + vb[1],
        va[2] + vb[2]
    ];
};

var sub = function (va, vb) {
    return [
        va[0] - vb[0],
        va[1] - vb[1],
        va[2] - vb[2]
    ];
};

var constmul = function (v, c) {
    return [v[0]*c, v[1]*c, v[2]*c];
};

var scalarmul = function (va, vb) {
    return v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
};

var vectormul = function (va, vb) {
    return [
        va[1] * vb[2] - va[2] * vb[1],
        va[2] * vb[0] - va[0] * vb[2],
        va[0] * vb[1] - va[1] * vb[0]
    ];
};

var matrixmul = function (m, v) {
    var ret = [
        v[0]*m[0] + v[1]*m[4] + v[2]*m[8]  + m[12],
        v[0]*m[1] + v[1]*m[5] + v[2]*m[9]  + m[13],
        v[0]*m[2] + v[1]*m[6] + v[2]*m[10] + m[14],
        v[0]*m[3] + v[1]*m[7] + v[2]*m[11] + m[15]
    ];
    if (Math.abs(ret[3]) > 0.0000001) {
        return [ret[0]/ret[3], ret[1]/ret[3], ret[2]/ret[3]];
    } else {
        return [0, 0, 0];
    }
};

var eq = function (v1, v2) {
    if (length(sub(v1, v2)) < 0.0000001) {
        return true;
    } else {
        return false;
    }
};

var vector3 = {
    init : init,
    length: length,
    lenn : lenn,
    add : add,
    sub : sub,
    constmul : constmul,
    scalarmul : scalarmul,
    vectormul : vectormul,
    matrixmul : matrixmul,
    eq : eq
};

export { vector3 };
