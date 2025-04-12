
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
    //if (a<6 && b<6)  return;
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
        //console.log("Delaunay: checkflip - adjacent tirangle not found");
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
    
    //if (a>2 && b>2 && d>2 && c<3) return;
    
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

let circum1 = function (x,y,z)
{
    let p1 = { x:(x.x+y.x)/2, y:(x.y+y.y)/2 };
    let p2 = { x:(x.x+z.x)/2, y:(x.y+z.y)/2 };
    let i1 = { x:-(x.y-y.y),  y:(x.x-y.x) };
    let i2 = { x:-(x.y-z.y),  y:(x.x-z.x) };
    
    let a = Math.abs(i1.x-i2.x);
    let t = a < 0.00001 ? (p2.y-p1.y) / (i1.y-i2.y) : (p2.x-p1.x) / (i1.x-i2.x);
    
    return { x:p1.x + t*i1.x, y:p1.y + t*i1.y };
};
let sub = (a,b) => ( {x:a.x-b.x, y:a.y-b.y} );
let dot = (a,b) => ( a.x*b.x + a.y*b.y );
let length = (v) => ( Math.sqrt(v.x*v.x+v.y*v.y) );
let normalize = (v) => {
    let l = length(v);
    if (l < 0.000001) { return {x:0,y:0}; }
    else
    {
        return { x:v.x/l, y:v.y/l };
    }
};
let circum2 = function (x,y,z)
{
    let d1 = dot(sub(z,x),sub(y,x));
    let d2 = dot(sub(z,y),sub(x,y));
    let d3 = dot(sub(x,z),sub(y,z));
    let c1 = d2*d3;
    let c2 = d3*d1;
    let c3 = d1*d2;
    
    return {
        x:( (c2+c3)*x.x + (c3+c1)*y.x + (c1+c2)*z.x ) / ( 2*(c1+c2+c3) ),
        y:( (c2+c3)*x.y + (c3+c1)*y.y + (c1+c2)*z.y ) / ( 2*(c1+c2+c3) ),
    };
};
let angle = (o,p) => {
    return Math.acos( dot(normalize(sub(o,p)), {x:1, y:0}) );
};

let dual = function (dm)
{
    let vm = [];
    
    for (let i=0 ; i<dm.t.length ; i+=1)
    {
        let chk = 0;
        if (dm.t[i].x < 4) chk+=1;
        if (dm.t[i].y < 4) chk+=1;
        if (dm.t[i].z < 4) chk+=1;
        if (chk>1) { continue; }
        
        let x = dm.p[dm.t[i].x];
        let y = dm.p[dm.t[i].y];
        let z = dm.p[dm.t[i].z];
        
        let c = circum2(x,y,z);
        
        let pcenter = { x:c.x, y:c.y, tx:dm.t[i].x, ty:dm.t[i].y, tz:dm.t[i].z };
        vm.push(pcenter);
    }
    
    let voronoi = [];
    
    for (let i=4 ; i<dm.p.length ; i+=1)
    {
        let vi = [];
        for (let v=0 ; v<vm.length ; v+=1)
        {
            if (vm[v].tx === i || vm[v].ty === i || vm[v].tz === i)
            {
                vi.push({ x:vm[v].x, y:vm[v].y });
            }
        }
        voronoi.push( vi.sort( (a,b)=>{
            let av = sub(a,dm.p[i]);
            let bv = sub(b,dm.p[i]);
            return Math.atan2(av.x, av.y) > Math.atan2(bv.x, bv.y) ? 1 : -1;
        }) );
    }
    
    return voronoi;
};

export { delaunay_step, dual };

