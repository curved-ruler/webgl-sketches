
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






let vec3 = {

    length : function (v)
    {
        return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    },
    lenn   : function (v)
    {
        return v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
    },
    add    : function (va, vb)
    {
        return [
            va[0] + vb[0],
            va[1] + vb[1],
            va[2] + vb[2]
        ];
    },
    sub    : function (va, vb)
    {
        return [
            va[0] - vb[0],
            va[1] - vb[1],
            va[2] - vb[2]
        ];
    },
    cmul  : function (v, c)
    {
        return [v[0]*c, v[1]*c, v[2]*c];
    },
    dot : function (va, vb)
    {
        return va[0]*vb[0] + va[1]*vb[1] + va[2]*vb[2];
    },
    cross : function (va, vb)
    {
        return [
            va[1] * vb[2] - va[2] * vb[1],
            va[2] * vb[0] - va[0] * vb[2],
            va[0] * vb[1] - va[1] * vb[0]
        ];
    },
    mmul : function (m, v)
    {
        return [
            v[0]*m[0]  + v[1]*m[1]  + v[2]*m[2],
            v[0]*m[3]  + v[1]*m[4]  + v[2]*m[5],
            v[0]*m[6]  + v[1]*m[7]  + v[2]*m[8]
        ];
    },
    mmul4 : function (m, v)
    {
        let ret = [
            v[0]*m[0]  + v[1]*m[1]  + v[2]*m[2]  + m[3],
            v[0]*m[4]  + v[1]*m[5]  + v[2]*m[6]  + m[7],
            v[0]*m[8]  + v[1]*m[9]  + v[2]*m[10] + m[11],
            v[0]*m[12] + v[1]*m[13] + v[2]*m[14] + m[15]
        ];
        
        if (Math.abs(ret[3]) > 0.000001)
        {
            return [ret[0]/ret[3], ret[1]/ret[3], ret[2]/ret[3]];
        }
        else
        {
            return [0, 0, 0];
        }
    },
    normalize : function (v)
    {
        let l = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        if (l > 0.00001)
        {
            return [v[0]/l, v[1]/l, v[2]/l];
        }
        else
        {
            return [0,0,0];
        }
    },
    setlength : function (v, newl)
    {
        let len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        if (len > 0.00001)
        {
            return [v[0]*newl/len, v[1]*newl/len, v[2]*newl/len];
        }
        return [0,0,0];
    },
    maximize : function (v, max)
    {
        let l = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        if (l > max)
        {
            return [v[0]/l*max, v[1]/l*max, v[2]/l*max];
        }
        return v;
    },
    eq : function (v1, v2)
    {
        let x = v1[0] - v2[0];
        let y = v1[1] - v2[1];
        let z = v1[2] - v2[2];
        return ((x*x + y*y + z*z) < 0.000001);
    }
};


let quat = {
    
    init : function ()
    {
        return [1, 0, 0, 0]; // r, i, j, k
    },
    
    init_rot : function (t, a)
    {
        return [Math.cos(a/2), t[0]*Math.sin(a/2), t[1]*Math.sin(a/2), t[2]*Math.sin(a/2)];
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
        if (len > 0.00001)
        {
            return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
        }
        return [1, 0, 0, 0];
    }
};



let tr = {
    
    rtod : 180 / Math.PI, // rad to deg
    dtor : Math.PI / 180, // deg to rad
    
    transl : function (v)
    {
        return [
            1,  0,  0, v[0],
            0,  1,  0, v[1],
            0,  0,  1, v[2],
            0,  0,  0,   1
        ];
    },

    scale : function (s)
    {
        return [
            s, 0, 0, 0,
            0, s, 0, 0,
            0, 0, s, 0,
            0, 0, 0, 1
        ];
    },

    rotx : function (a)
    {
        let c = Math.cos(a/180*Math.PI);
        let s = Math.sin(a/180*Math.PI);
        return [
            1,  0,  0, 0,
            0,  c, -s, 0,
            0,  s,  c, 0,
            0,  0,  0, 1
        ];
    },

    roty : function (a)
    {
        let c = Math.cos(a/180*Math.PI);
        let s = Math.sin(a/180*Math.PI);
        return [
             c, 0,  s, 0,
             0, 1,  0, 0,
            -s, 0,  c, 0,
             0, 0,  0, 1
        ];
    },

    rotz : function (a)
    {
        let c = Math.cos(a/180*Math.PI);
        let s = Math.sin(a/180*Math.PI);
        return [
             c, -s, 0, 0,
             s,  c, 0, 0,
             0,  0, 1, 0,
             0,  0, 0, 1
        ];
    },

    rot_mat : function (v, a)
    {
        let c = Math.cos(a);
        let s = Math.sin(a);
        return [
            c*(1 - v[0]*v[0]) + v[0]*v[0],   v[1]*v[0]*(1-c) - s*v[2],      v[2]*v[0]*(1-c) + s*v[1],     0,
              v[0]*v[1]*(1-c) + s*v[2],    c*(1 - v[1]*v[1]) + v[1]*v[1],   v[2]*v[1]*(1-c) - s*v[0],     0,
              v[0]*v[2]*(1-c) - s*v[1],      v[1]*v[2]*(1-c) + s*v[0],    c*(1 - v[2]*v[2]) + v[2]*v[2],  0,
                              0,                             0,                             0,            1
        ];
    },
    
    rot_mat_q : function (q)
    {
        let r = q[0];
        let i = q[1];
        let j = q[2];
        let k = q[3];
            /*return [
                r*r+i*i-j*j-k*k,   2*i*j-2*r*k,    2*i*k+2*r*j,   0,
                 2*i*j + 2*r*k,  r*r-i*i+j*j-k*k,  2*j*k-2*r*i,   0,
                 2*i*k-2*r*j,      2*j*k+2*r*i,  r*r-i*i-j*j+k*k, 0,
                      0,                0,              0,        1
            ];*/
            return [
                1-2*(j*j+k*k),   2*(i*j-k*r),   2*(i*k+j*r), 0,
                  2*(i*j+k*r), 1-2*(i*i+k*k),   2*(j*k-i*r), 0,
                  2*(i*k-j*r),   2*(j*k+i*r), 1-2*(i*i+j*j), 0,
                   0,             0,             0,          1
            ];
    },
    
    rot_q : function (q, v)
    {
        let qq  = quat.conj(q);
        let qv  = [0, v[0], v[1], v[2]];
        let ret = quat.mul(quat.mul(q, qv), qq);
        return [ret[1], ret[2], ret[3]];
    },
    
    view : function (cam)
    {
        let u = v3.cross(cam.look, cam.up);
        
        let trot = [
                    u[0],        u[1],         u[2],  0,
               cam.up[0],   cam.up[1],    cam.up[2],  0,
            -cam.look[0],-cam.look[1], -cam.look[2],  0,
                      0,           0,            0,   1
        ];
        
        let ttr = [
            1,  0,  0, -cam.pos[0],
            0,  1,  0, -cam.pos[1],
            0,  0,  1, -cam.pos[2],
            0,  0,  0,     1
        ];
        
        return mat4.mul(trot, ttr);
    },

    axon : function (cam)
    {
        let z = 1 / (cam.near - cam.far);
        let y = 1 / (2 * cam.median * Math.tan(cam.fovy / 2));
        let x = y / cam.aspect;
        return [
            2*x,  0,   0,           0,
             0,  2*y,  0,           0,
             0,   0,  2*z, (cam.near+cam.far)*z,
             0,   0,   0,           1
        ];
    },

    persp : function (cam)
    {
        let f = cam.far;
        let n = cam.near;
        let a = cam.aspect;
        let nf = 1 / (n-f);
        let g  = 1 / Math.tan(cam.fovy / 2);
        return [
            g/a, 0,       0,      0,
             0,  g,       0,      0,
             0,  0,  (f+n)*nf, 2.0*f*n*nf,
             0,  0,      -1,      0
        ];
    },
    
    // v should be normalized
    // returns a vector (not normalized!) which is orthogonal to v
    norm_ortho : function (v)
    {
        let cosangle = v3.dot(v, [1,0,0]);
        if (Math.abs(cosangle) < 0.9)
        {
            return v3.cross(v, [1,0,0]);
        }
        else
        {
            return v3.cross(v, [0,1,0]);
        }
    }
};


export { mat3, mat4, mat5, vec3, quat, tr };
