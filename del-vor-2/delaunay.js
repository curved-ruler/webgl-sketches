
import { mat3, mat4, vec3, quat, tr } from "./matvec.js";

let orient = function (a, b, d)
{
    let m = [
        a.x, a.y, 1,
        b.x, b.y, 1,
        d.x, d.y, 1
    ];
    return mat3.det(m);
};

let incircle = function (a, b, c, d)
{
    let m = [];
    if (orient(a,b,c) >= 0)
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
};

let tri_inside = function (a, b, c, d)
{
    let o1 = orient(a, b, d);
    let o2 = orient(b, c, d);
    let o3 = orient(c, a, d);
    
    if (o1 > 0 && o2 > 0 && o3 > 0) return true;
    if (o1 < 0 && o2 < 0 && o3 < 0) return true;
    
    return false;
};


let checkflip = function (dm, i, a, b)
{
    if (a<3 && b<3)  return;
    if (i>=dm.t.length) return;
    
    let i2 =  i;
    let c  = -1;
    for (let ti=0 ; ti<dm.t.length ; ti+=1)
    {
        if (ti == i) continue;
        
        let chk = 0;
        if (dm.t[ti].x == a || dm.t[ti].y == a || dm.t[ti].z == a) chk+=1;
        if (dm.t[ti].x == b || dm.t[ti].y == b || dm.t[ti].z == b) chk+=1;
        if (chk == 2)
        {
            if (dm.t[ti].x != a && dm.t[ti].x != b) c = dm.t[ti].x;
            if (dm.t[ti].y != a && dm.t[ti].y != b) c = dm.t[ti].y;
            if (dm.t[ti].z != a && dm.t[ti].z != b) c = dm.t[ti].z;
            i2 = ti;
            break;
        }
    }
    
    if (c === -1)
    {
        console.log("ERROR: Delaunay: checkflip - adjacent tirangle not found");
        return;
    }
    
    if ( tri_inside(dm.p[ dm.t[i].x ], dm.p[ dm.t[i].y ], dm.p[ dm.t[i].z ], dm.p[c]) ) return;
    if ( tri_inside(dm.p[ dm.t[i].x ], dm.p[ dm.t[i].y ], dm.p[c], dm.p[ dm.t[i].z ]) ) return;
    if ( tri_inside(dm.p[ dm.t[i].x ], dm.p[c], dm.p[ dm.t[i].z ], dm.p[ dm.t[i].y ]) ) return;
    if ( tri_inside(dm.p[c], dm.p[ dm.t[i].z ], dm.p[ dm.t[i].y ], dm.p[ dm.t[i].x ]) ) return;
    
    let d = -1;
    if (dm.t[i].x != a && dm.t[i].x != b) d = dm.t[i].x;
    if (dm.t[i].y != a && dm.t[i].y != b) d = dm.t[i].y;
    if (dm.t[i].z != a && dm.t[i].z != b) d = dm.t[i].z;
    
    if (d === c) { console.log("d = c  " + i + " / " + i2); return;  }
    
    if (a>2 && b>2 && d>2 && c<3) return;
    
    let det = incircle( dm.p[ dm.t[i].x ], dm.p[ dm.t[i].y ], dm.p[ dm.t[i].z ], dm.p[c] );
    
    if ( det > 0 )
    {
        dm.t[i].x = a;
        dm.t[i].y = d;
        dm.t[i].z = c;
        
        dm.t[i2].x = b;
        dm.t[i2].y = c;
        dm.t[i2].z = d;
        
        checkflip(dm, i,  a, c);
        checkflip(dm, i2, b, c);
    }
};


let delaunay_step = function (dm, p)
{
        let a = 0, b = 1, c = 2;
        
        let ts = dm.t.length;
        let tcont = -1;
        for (let ti=0 ; ti<ts ; ti+=1)
        {
            let va = dm.p[ dm.t[ti].x ];
            let vb = dm.p[ dm.t[ti].y ];
            let vc = dm.p[ dm.t[ti].z ];
            
            if ( tri_inside(va, vb, vc, p) )
            {
                a = dm.t[ti].x;
                b = dm.t[ti].y;
                c = dm.t[ti].z;
                tcont = ti;
                break;
            }
        }
        
        if (tcont == -1)
        {
            console.log("ERROR: Delaunay: container tirangle not found");
            return;
        }
        
        dm.p.push(p);
        let pti = dm.p.length-1;
        
        dm.t[tcont].x = pti;
        dm.t[tcont].y = a;
        dm.t[tcont].z = b;
        dm.t.push( { x:pti, y:a, z:c } );
        dm.t.push( { x:pti, y:b, z:c } );
        
        checkflip(dm, tcont, a, b);
        checkflip(dm, ts,    a, c);
        checkflip(dm, ts+1,  b, c);
};

export { delaunay_step };

