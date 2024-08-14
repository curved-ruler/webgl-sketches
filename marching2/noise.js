
// noise from https://iquilezles.org/articles/gradientnoise/
let noise = (x,y,z) =>
{
    let fract = ( x ) => (x - Math.floor(x));
    let dot   = (a,b) => (a.x*b.x + a.y*b.y + a.z*b.z);
    let hash  = ( p ) =>
    {
        let p2 = { x: dot(p,{ x: 127.1, y: 311.7, z:  74.7}),
                   y: dot(p,{ x: 269.5, y: 183.3, z: 246.1}),
                   z: dot(p,{ x: 113.5, y: 271.9, z: 124.6}) };

        return { x: -1.0 + 2.0*fract(Math.sin(p2.x)*43758.5453123),
                 y: -1.0 + 2.0*fract(Math.sin(p2.y)*43758.5453123),
                 z: -1.0 + 2.0*fract(Math.sin(p2.z)*43758.5453123) };
    };

    // grid
    let p = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) };
    let w = { x: fract(x), y: fract(y), z: fract(z) };
    
    // quintic interpolant
    let u = { x: w.x*w.x*w.x*(w.x*(w.x*6.0-15.0)+10.0),
              y: w.y*w.y*w.y*(w.y*(w.y*6.0-15.0)+10.0),
              z: w.z*w.z*w.z*(w.z*(w.z*6.0-15.0)+10.0) };
    
    // gradients
    let ga = hash( {x: p.x+1, y: p.y+0, z: p.z+0 } );
    let gb = hash( {x: p.x+1, y: p.y+0, z: p.z+0 } );
    let gc = hash( {x: p.x+0, y: p.y+1, z: p.z+0 } );
    let gd = hash( {x: p.x+1, y: p.y+1, z: p.z+0 } );
    let ge = hash( {x: p.x+0, y: p.y+0, z: p.z+1 } );
    let gf = hash( {x: p.x+1, y: p.y+0, z: p.z+1 } );
    let gg = hash( {x: p.x+0, y: p.y+1, z: p.z+1 } );
    let gh = hash( {x: p.x+1, y: p.y+1, z: p.z+1 } );
    
    // projections
    let va = dot( ga, { x: w.x-0, y: w.y-0, z:w.z-0 } );
    let vb = dot( gb, { x: w.x-1, y: w.y-0, z:w.z-0 } );
    let vc = dot( gc, { x: w.x-0, y: w.y-1, z:w.z-0 } );
    let vd = dot( gd, { x: w.x-1, y: w.y-1, z:w.z-0 } );
    let ve = dot( ge, { x: w.x-0, y: w.y-0, z:w.z-1 } );
    let vf = dot( gf, { x: w.x-1, y: w.y-0, z:w.z-1 } );
    let vg = dot( gg, { x: w.x-0, y: w.y-1, z:w.z-1 } );
    let vh = dot( gh, { x: w.x-1, y: w.y-1, z:w.z-1 } );
    
    // interpolation
    let v = va + 
            u.x*(vb-va) + 
            u.y*(vc-va) + 
            u.z*(ve-va) + 
            u.x*u.y*(va-vb-vc+vd) + 
            u.y*u.z*(va-vc-ve+vg) + 
            u.z*u.x*(va-vb-ve+vf) + 
            u.x*u.y*u.z*(-va+vb+vc-vd+ve-vf-vg+vh);
    
    return v;
};

export { noise };
