// 4*4 matrices. For matrix-vector multiplication, see v4.js

var base = function () {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
};

var m4 = {

    init :function ()
    {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },

    add : function (ma, mb) {
        var ret = base();
        for (var i=0 ; i<16 ; i++) {
            ret[i] = ma[i] + mb[i];
        }
        return ret;
    },

    sub : function (ma, mb) {
        var ret = base();
        for (var i=0 ; i<16 ; i++) {
            ret[i] = ma[i] - mb[i];
        }
        return ret;
    },

    mul : function (ma, mb) {
        var ret = base();
        for (var i=0 ; i<4 ; i++) {
            for (var j=0 ; j<4 ; j++) {
                var sum = 0;
                for (var k=0 ; k<4 ; k++) {
                    sum += ma[j*4 + k] * mb[k*4 + i];
                }
                ret[j*4 + i] = sum;
            }
        }
        return ret;
    },

    constmul : function (m, c) {
        var ret = base();
        for (var i=0 ; i<16 ; i++) {
            ret[i] = c * m[i];
        }
        return ret;
    }
};

export { m4 };


