// 4*4 matrices. For matrix-vector multiplication, see v4.js
define(function () {
    
    var base = function () {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    };

    return {
    
        init : base,

        add : function (ma, mb) {
            var ret = base();
            for (i=0 ; i<16 ; i++) {
                ret[i] = ma[i] + mb[i];
            }
            return ret;
        },

        sub : function (ma, mb) {
            var ret = base();
            for (i=0 ; i<16 ; i++) {
                ret[i] = ma[i] - mb[i];
            }
            return ret;
        },

        mul : function (ma, mb) {
            var ret = base();
            for (i=0 ; i<4 ; i++) {
                for (j=0 ; j<4 ; j++) {
                    sum = 0;
                    for (k=0 ; k<4 ; k++) {
                        sum += ma[j*4 + k] * mb[k*4 + i];
                    }
                    ret[j*4 + i] = sum;
                }
            }
            return ret;
        },

        constmul : function (m, c) {
            var ret = base();
            for (i=0 ; i<16 ; i++) {
                ret[i] = c * m[i];
            }
            return ret;
        }
    };
});

