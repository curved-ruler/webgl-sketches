
import { mat3, mat4, vec2, vec3, quat } from "./matvec.js";

let tr3 = {
    
    transl : function (v)
    {
        return [
            1, 0, v.x,
            0, 1, v.y,
            0, 0,  1
        ];
    },
    
    scale : function (s)
    {
        return [
            s, 0, 0,
            0, s, 0,
            0, 0, 1
        ];
    },
    
    scale2 : function (s)
    {
        return [
            s.x, 0,  0,
            0,  s.y, 0,
            0,   0,  1
        ];
    },
    
    rot : function (a)
    {
        let c = Math.cos(a);
        let s = Math.sin(a);
        return [
            c, -s, 0,
            s,  c, 0,
            0,  0, 1
        ];
    }
};

let tr4 = {
    
    rtod : 180 / Math.PI, // rad to deg
    dtor : Math.PI / 180, // deg to rad
    
    transl : function (v)
    {
        return [
            1, 0, 0, v.x,
            0, 1, 0, v.y,
            0, 0, 1, v.z,
            0, 0, 0,  1
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
    
    scale3 : function (s)
    {
        return [
            s.x, 0,  0,  0,
            0,  s.y, 0,  0,
            0,   0, s.z, 0,
            0,   0,  0,  1
        ];
    },

    rotx : function (a)
    {
        let c = Math.cos(a);
        let s = Math.sin(a);
        return [
            1,  0,  0, 0,
            0,  c, -s, 0,
            0,  s,  c, 0,
            0,  0,  0, 1
        ];
    },

    roty : function (a)
    {
        let c = Math.cos(a);
        let s = Math.sin(a);
        return [
             c, 0,  s, 0,
             0, 1,  0, 0,
            -s, 0,  c, 0,
             0, 0,  0, 1
        ];
    },

    rotz : function (a)
    {
        let c = Math.cos(a);
        let s = Math.sin(a);
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
            c*(1 - v.x*v.x) + v.x*v.x,   v.y*v.x*(1-c) - s*v.z,     v.z*v.x*(1-c) + s*v.y,    0,
              v.x*v.y*(1-c) + s*v.z,   c*(1 - v.y*v.y) + v.y*v.y,   v.z*v.y*(1-c) - s*v.x,    0,
              v.x*v.z*(1-c) - s*v.y,     v.y*v.z*(1-c) + s*v.x,   c*(1 - v.z*v.z) + v.z*v.z,  0,
                            0,                         0,                         0,          1
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
        let qv  = [0, v.x, v.y, v.z];
        let ret = quat.mul(quat.mul(q, qv), qq);
        return { x:ret[1], y:ret[2], z:ret[3] };
    },
    
    view : function (cam)
    {
        let u = vec3.cross(cam.look, cam.up);
        
        let trot = [
                    u.x,        u.y,         u.z,  0,
               cam.up.x,   cam.up.y,    cam.up.z,  0,
            -cam.look.x,-cam.look.y, -cam.look.z,  0,
                      0,         0,           0,   1
        ];
        
        let ttr = [
            1,  0,  0, -cam.pos.x,
            0,  1,  0, -cam.pos.y,
            0,  0,  1, -cam.pos.z,
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
    // returns a vector (not normalized) which is orthogonal to v
    ortho : function (v)
    {
        let cosangle = vec3.dot(v, {x:1,y:0,z:0});
        if (Math.abs(cosangle) < 0.9)
        {
            return vec3.cross(v, {x:1,y:0,z:0});
        }
        else
        {
            return vec3.cross(v, {x:0,y:1,z:0});
        }
    }
};

let geom2 = {
    
    orient : function (a, b, d)
    {
        let m = [
            a.x, a.y, 1,
            b.x, b.y, 1,
            d.x, d.y, 1
        ];
        return mat3.det(m);
    },

    incircle : function (a, b, c, d)
    {
        let m = [];
        if (geom2.orient(a,b,c) >= 0)
        {
            m = [
                a.x, a.y, a.x*a.x+a.y*a.y, 1,
                b.x, b.y, b.x*b.x+b.y*b.y, 1,
                c.x, c.y, c.x*c.x+c.y*c.y, 1,
                d.x, d.y, d.x*d.x+d.y*d.y, 1,
            ];
        }
        else
        {
            m = [
                a.x, a.y, a.x*a.x+a.y*a.y, 1,
                c.x, c.y, c.x*c.x+c.y*c.y, 1,
                b.x, b.y, b.x*b.x+b.y*b.y, 1,
                d.x, d.y, d.x*d.x+d.y*d.y, 1,
            ];
        }
        return mat4.det(m);
    },

    tri_inside : function (a, b, c, d)
    {
        let o1 = geom2.orient(a, b, d);
        let o2 = geom2.orient(b, c, d);
        let o3 = geom2.orient(c, a, d);
        
        if (o1 > 0 && o2 > 0 && o3 > 0) return true;
        if (o1 < 0 && o2 < 0 && o3 < 0) return true;
        
        return false;
    },
    
    circum1 : function (x,y,z)
    {
        let p1 = { x:(x.x+y.x)/2, y:(x.y+y.y)/2 };
        let p2 = { x:(x.x+z.x)/2, y:(x.y+z.y)/2 };
        let i1 = { x:-(x.y-y.y),  y:(x.x-y.x) };
        let i2 = { x:-(x.y-z.y),  y:(x.x-z.x) };
        
        let a = Math.abs(i1.x-i2.x);
        let t = a < 0.000001 ? (p2.y-p1.y) / (i1.y-i2.y) : (p2.x-p1.x) / (i1.x-i2.x);
        
        return { x:p1.x + t*i1.x, y:p1.y + t*i1.y };
    },
    circum2 : function (x,y,z)
    {
        let d1 = vec2.dot(vec2.sub(z,x),vec2.sub(y,x));
        let d2 = vec2.dot(vec2.sub(z,y),vec2.sub(x,y));
        let d3 = vec2.dot(vec2.sub(x,z),vec2.sub(y,z));
        let c1 = d2*d3;
        let c2 = d3*d1;
        let c3 = d1*d2;
        
        return {
            x:( (c2+c3)*x.x + (c3+c1)*y.x + (c1+c2)*z.x ) / ( 2*(c1+c2+c3) ),
            y:( (c2+c3)*x.y + (c3+c1)*y.y + (c1+c2)*z.y ) / ( 2*(c1+c2+c3) ),
        };
    }
};

export { tr3, tr4, geom2 };
