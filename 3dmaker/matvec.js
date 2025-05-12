
let eps = 0.000001;

// v3.matrixmul(m,v) :
//
//  - vectors  are column vectors
//  - matrices are row-major ordered
//
//
//                    [v0]
//                v:  [v1]
//                    [v2]
//          m:        [1 ]
// [  0,  1,  2,  3 ]
// [  4,  5,  6,  7 ]
// [  8,  9, 10, 11 ]
// [ 12, 13, 14, 15 ]

let mat3 = {
    // 0, 1, 2,
    // 3, 4, 5,
    // 6, 7, 8
    init : function ()
    {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
    },
    
    mul : function (ma, mb)
    {
        let ret = mat4.init();
        for (let i=0 ; i<3 ; i++)
        {
            for (let j=0 ; j<3 ; j++)
            {
                let sum = 0;
                for (let k=0 ; k<3 ; k++)
                {
                    sum += ma[j*3 + k] * mb[k*3 + i];
                }
                ret[j*3 + i] = sum;
            }
        }
        return ret;
    },
    
    det : function (m) {
        
        return m[0]*(m[4]*m[8] - m[5]*m[7]) -
               m[1]*(m[3]*m[8] - m[5]*m[6]) +
               m[2]*(m[3]*m[7] - m[4]*m[6]);
    }
};

let mat4 = {

    init : function ()
    {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },
    
    mat3 : function (m4)
    {
        return [
            m4[0], m4[1], m4[2],
            m4[4], m4[5], m4[6],
            m4[8], m4[9], m4[10]
        ];
    },

    add : function (ma, mb)
    {
        let ret = base();
        for (let i=0 ; i<16 ; i++)
        {
            ret[i] = ma[i] + mb[i];
        }
        return ret;
    },

    sub : function (ma, mb)
    {
        let ret = base();
        for (let i=0 ; i<16 ; i++)
        {
            ret[i] = ma[i] - mb[i];
        }
        return ret;
    },

    mul : function (ma, mb)
    {
        let ret = mat4.init();
        for (let i=0 ; i<4 ; i++)
        {
            for (let j=0 ; j<4 ; j++)
            {
                let sum = 0;
                for (let k=0 ; k<4 ; k++)
                {
                    sum += ma[j*4 + k] * mb[k*4 + i];
                }
                ret[j*4 + i] = sum;
            }
        }
        return ret;
    },

    cmul : function (m, c)
    {
        let ret = base();
        for (let i=0 ; i<16 ; i++) {
            ret[i] = c * m[i];
        }
        return ret;
    },
    
    transpose : function (m)
    {
        return [
            m[0], m[4],  m[8], m[12],
            m[1], m[5],  m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15]
        ];
    },
    
    det : function (m)
    {
        return (m[3]*m[6]*m[9]*m[12]  - m[2]*m[7]*m[9]*m[12]  - m[3]*m[5]*m[10]*m[12] + m[1]*m[7]*m[10]*m[12] +
                m[2]*m[5]*m[11]*m[12] - m[1]*m[6]*m[11]*m[12] - m[3]*m[6]*m[8]*m[13]  + m[2]*m[7]*m[8]*m[13] +
                m[3]*m[4]*m[10]*m[13] - m[0]*m[7]*m[10]*m[13] - m[2]*m[4]*m[11]*m[13] + m[0]*m[6]*m[11]*m[13] +
                m[3]*m[5]*m[8]*m[14]  - m[1]*m[7]*m[8]*m[14]  - m[3]*m[4]*m[9]*m[14]  + m[0]*m[7]*m[9]*m[14] +
                m[1]*m[4]*m[11]*m[14] - m[0]*m[5]*m[11]*m[14] - m[2]*m[5]*m[8]*m[15]  + m[1]*m[6]*m[8]*m[15] +
                m[2]*m[4]*m[9]*m[15]  - m[0]*m[6]*m[9]*m[15]  - m[1]*m[4]*m[10]*m[15] + m[0]*m[5]*m[10]*m[15]);
    }
};


// mat5
//  0,  1,  2,  3,  4,
//  5,  6,  7,  8,  9,
// 10, 11, 12, 13, 14,
// 15, 16, 17, 18, 19,
// 20, 21, 22, 23, 24
let mat5 = {
    det : function (m) {
        let m0 = [
              m[6],  m[7],  m[8],  m[9],
             m[11], m[12], m[13], m[14],
             m[16], m[17], m[18], m[19],
             m[21], m[22], m[23], m[24]
        ];
        
        let m1 = [
              m[5],  m[7],  m[8],  m[9],
             m[10], m[12], m[13], m[14],
             m[15], m[17], m[18], m[19],
             m[20], m[22], m[23], m[24]
        ];
        
        let m2 = [
              m[5],  m[6],  m[8],  m[9],
             m[10], m[11], m[13], m[14],
             m[15], m[16], m[18], m[19],
             m[20], m[21], m[23], m[24]
        ];
        
        let m3 = [
              m[5],  m[6],  m[7],  m[9],
             m[10], m[11], m[12], m[14],
             m[15], m[16], m[17], m[19],
             m[20], m[21], m[22], m[24]
        ];
        
        let m4 = [
              m[5],  m[6],  m[7],  m[8],
             m[10], m[11], m[12], m[13],
             m[15], m[16], m[17], m[18],
             m[20], m[21], m[22], m[23]
        ];
        
        return m[0]*mat4.det(m0) -
               m[1]*mat4.det(m1) +
               m[2]*mat4.det(m2) -
               m[3]*mat4.det(m3) +
               m[4]*mat4.det(m4);
    }
};




let vec2 = {
    
    init : function ()
    {
        return { x:0, y:0 };
    },
    
    length : function (v)
    {
        return Math.sqrt(v.x*v.x + v.y*v.y);
    },
    lenn   : function (v)
    {
        return v.x*v.x + v.y*v.y;
    },
    
    add    : function (va, vb)
    {
        return {
            x: va.x + vb.x,
            y: va.y + vb.y
        };
    },
    sub    : function (va, vb)
    {
        return {
            x: va.x - vb.x,
            y: va.y - vb.y
        };
    },
    cmul  : function (v, c)
    {
        return {
            x: v.x*c,
            y: v.y*c
        };
    },
    
    dot : function (va, vb)
    {
        return va.x*vb.x + va.y*vb.y;
    },
    
    mmul : function (m, v)
    {
        return {
            x: v.x*m[0]  + v.y*m[1],
            y: v.x*m[2]  + v.y*m[3]
        };
    },
    mmul3 : function (m, v)
    {
        let ret = [
            v.x*m[0]  + v.y*m[1]  + m[2],
            v.x*m[3]  + v.y*m[4]  + m[5],
            v.x*m[6]  + v.y*m[7]  + m[8],
        ];
        
        if (Math.abs(ret[2]) > eps)
        {
            return { x:ret[0]/ret[2], y:ret[1]/ret[2] };
        }
        else
        {
            return { x:0, y:0 };
        }
    },
    
    normalize : function (v)
    {
        let l = Math.sqrt(v.x*v.x + v.y*v.y);
        if (l > eps)
        {
            return { x:v.x/l, y:v.y/l };
        }
        else
        {
            return { x:0,y:0 };
        }
    },
    setlength : function (v, newl)
    {
        let l = Math.sqrt(v.x*v.x + v.y*v.y);
        if (l > eps)
        {
            return { x:v.x*newl/l, y:v.y*newl/l };
        }
        return { x:0,y:0 };
    },
    maximize : function (v, max)
    {
        let l = Math.sqrt(v.x*v.x + v.y*v.y);
        if (l > max)
        {
            return { x:v.x/l*max, y:v.y/l*max };
        }
        return v;
    },
    
    eq : function (v1, v2)
    {
        let x = v1.x - v2.x;
        let y = v1.y - v2.y;
        return ((x*x + y*y) < eps);
    }
};


let vec3 = {
    
    init : function ()
    {
        return { x:0, y:0, z:0 };
    },
    
    length : function (v)
    {
        return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    },
    lenn   : function (v)
    {
        return v.x*v.x + v.y*v.y + v.z*v.z;
    },
    
    add    : function (va, vb)
    {
        return {
            x: va.x + vb.x,
            y: va.y + vb.y,
            z: va.z + vb.z
        };
    },
    sub    : function (va, vb)
    {
        return {
            x: va.x - vb.x,
            y: va.y - vb.y,
            z: va.z - vb.z
        };
    },
    cmul  : function (v, c)
    {
        return {
            x: v.x*c,
            y: v.y*c,
            z: v.z*c
        };
    },
    
    dot : function (va, vb)
    {
        return va.x*vb.x + va.y*vb.y + va.z*vb.z;
    },
    cross : function (va, vb)
    {
        return {
            x: va.y * vb.z - va.z * vb.y,
            y: va.z * vb.x - va.x * vb.z,
            z: va.x * vb.y - va.y * vb.x
        };
    },
    
    mmul : function (m, v)
    {
        return {
            x: v.x*m[0]  + v.y*m[1]  + v.z*m[2],
            y: v.x*m[3]  + v.y*m[4]  + v.z*m[5],
            z: v.x*m[6]  + v.y*m[7]  + v.z*m[8]
        };
    },
    mmul4 : function (m, v)
    {
        let ret = [
            v.x*m[0]  + v.y*m[1]  + v.z*m[2]  + m[3],
            v.x*m[4]  + v.y*m[5]  + v.z*m[6]  + m[7],
            v.x*m[8]  + v.y*m[9]  + v.z*m[10] + m[11],
            v.x*m[12] + v.y*m[13] + v.z*m[14] + m[15]
        ];
        
        if (Math.abs(ret[3]) > eps)
        {
            return { x:ret[0]/ret[3], y:ret[1]/ret[3], z:ret[2]/ret[3] };
        }
        else
        {
            return { x:0, y:0, z:0 };
        }
    },
    
    normalize : function (v)
    {
        let l = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
        if (l > eps)
        {
            return { x:v.x/l, y:v.y/l, z:v.z/l };
        }
        else
        {
            return { x:0,y:0,z:0 };
        }
    },
    setlength : function (v, newl)
    {
        let l = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
        if (l > eps)
        {
            return { x:v.x*newl/l, y:v.y*newl/l, z:v.z*newl/l };
        }
        return { x:0,y:0,z:0 };
    },
    maximize : function (v, max)
    {
        let l = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
        if (l > max)
        {
            return { x:v.x/l*max, y:v.y/l*max, z:v.z/l*max };
        }
        return v;
    },
    
    eq : function (v1, v2)
    {
        let x = v1.x - v2.x;
        let y = v1.y - v2.y;
        let z = v1.z - v2.z;
        return ((x*x + y*y + z*z) < eps);
    }
};


let quat = {
    
    init : function ()
    {
        return [1, 0, 0, 0]; // r, i, j, k
    },
    
    init_rot : function (t, a)
    {
        return [Math.cos(a/2), t.x*Math.sin(a/2), t.y*Math.sin(a/2), t.z*Math.sin(a/2)];
    },
    
    add : function (q, q2)
    {
        return [ q[0] + q2[0], q[1] + q2[1], q[2] + q2[2], q[3] + q2[3] ];
    },
    
    sub : function (q, q2)
    {
        return [ q[0] - q2[0], q[1] - q2[1], q[2] - q2[2], q[3] - q2[3] ];
    },
    
    cmul : function (q, c)
    {
        return [ q[0]*c, q[1]*c, q[2]*c, q[3]*c ];;
    },
    
    mul : function (q, q2)
    {
        return [
                q[0]*q2[0] - q[1]*q2[1] - q[2]*q2[2] - q[3]*q2[3],
                q[0]*q2[1] + q[1]*q2[0] + q[2]*q2[3] - q[3]*q2[2],
                q[0]*q2[2] - q[1]*q2[3] + q[2]*q2[0] + q[3]*q2[1],
                q[0]*q2[3] + q[1]*q2[2] - q[2]*q2[1] + q[3]*q2[0]
        ];
    },
    
    conj : function (q)
    {
        return [ q[0], -q[1], -q[2], -q[3] ];
    },
    
    length : function (q)
    {
        return Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
    },
    
    lenn : function (q)
    {
        return (q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
    },
        
    normalize : function (q)
    {
        let len = Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
        if (len > eps)
        {
            return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
        }
        return [1, 0, 0, 0];
    }
};


export { mat3, mat4, mat5, vec2, vec3, quat };
