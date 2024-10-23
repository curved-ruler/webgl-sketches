

let noise = {

    // noise from https://iquilezles.org/articles/gradientnoise/
    gradient : `\
let fract = ( x ) => (x - Math.floor(x));
let dot   = (a,b) => (a.x*b.x + a.y*b.y);
let hash  = ( p ) =>
{
    let p2 = { x: dot(p,{ x: 127.1, y: 311.7}),
                y: dot(p,{ x: 269.5, y: 183.3}) };

    return { x: -1.0 + 2.0*fract(Math.sin(p2.x)*43758.5453123),
             y: -1.0 + 2.0*fract(Math.sin(p2.y)*43758.5453123) };
};

let i = { x: Math.floor(x), y: Math.floor(y) };
let f = { x: fract(x), y: fract(y) };

let u = { x: f.x*f.x*f.x*(f.x*(f.x*6.0-15.0)+10.0),
          y: f.y*f.y*f.y*(f.y*(f.y*6.0-15.0)+10.0) };

let ga = hash( {x: i.x+0, y: i.y+0 } );
let gb = hash( {x: i.x+1, y: i.y+0 } );
let gc = hash( {x: i.x+0, y: i.y+1 } );
let gd = hash( {x: i.x+1, y: i.y+1 } );

let va = dot( ga, { x: f.x-0, y: f.y-0 } );
let vb = dot( gb, { x: f.x-1, y: f.y-0 } );
let vc = dot( gc, { x: f.x-0, y: f.y-1 } );
let vd = dot( gd, { x: f.x-1, y: f.y-1 } );

return va + u.x*(vb-va) + u.y*(vc-va) + u.x*u.y*(va-vb-vc+vd);`,

    sin : `\
return Math.sin(x) * Math.sin(y);`

};


export { noise };
