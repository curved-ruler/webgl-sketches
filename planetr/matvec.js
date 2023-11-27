
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

let m4 = {

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
        let ret = m4.init();
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

    constmul : function (m, c)
    {
        let ret = base();
        for (let i=0 ; i<16 ; i++) {
            ret[i] = c * m[i];
        }
        return ret;
    }
};






let v3 = {

    init   : function ()
    {
        return [0, 0, 0];
    },
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
        let l = 1 / Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        return [v[0]*l, v[1]*l, v[2]*l];
    },
    eq : function (v1, v2)
    {
        let x = v1[0] - v2[0];
        let y = v1[1] - v2[1];
        let z = v1[2] - v2[2];
        return ((x*x + y*y + z*z) < 0.0000001);
    }
};




let tr = {
    translate : function (v)
    {
        /*
        return [
              1,    0,    0,  0,
              0,    1,    0,  0,
              0,    0,    1,  0,
            v[0], v[1], v[2], 1
        ];
        */
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

    rot : function (v, a)
    {
        let c = Math.cos(a/180*Math.PI);
        let s = Math.sin(a/180*Math.PI);
        return [
            c*(1 - v[0]*v[0]) + v[0]*v[0],   v[1]*v[0]*(1-c) - s*v[2],      v[2]*v[0]*(1-c) + s*v[1],     0,
              v[0]*v[1]*(1-c) + s*v[2],    c*(1 - v[1]*v[1]) + v[1]*v[1],   v[2]*v[1]*(1-c) - s*v[0],     0,
              v[0]*v[2]*(1-c) - s*v[1],      v[1]*v[2]*(1-c) + s*v[0],    c*(1 - v[2]*v[2]) + v[2]*v[2],  0,
                              0,                             0,                             0,            1
        ];
    },

    view : function (cam)
    {
        let u = v3.cross(cam.look, cam.up);
        /*
        let trot = [
            u[0], cam.up[0], -cam.look[0], 0,
            u[1], cam.up[1], -cam.look[1], 0,
            u[2], cam.up[2], -cam.look[2], 0,
              0,         0,            0,  1
        ];
        */
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
        
        return m4.mul(trot, ttr);
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
    }
};


export { m4, v3, tr };
