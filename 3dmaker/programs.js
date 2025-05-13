
let programs = {
    sph_spiral: `\
let N   = 1000;
let rev = 9;
let sc  = 8;
for (let i=0; i<N; i+=1) {
    let theta = i*Math.PI / N;
    let phi   = i*(2*rev*Math.PI / N);
    
    T.add_point(sc * Math.sin(theta) * Math.cos(phi),
                sc * Math.sin(theta) * Math.sin(phi),
                sc * Math.cos(theta));
}`,

    chebysev_net: `\
let N   = 4000;
let a = 0.2;
let rev = 9;
let sc2 = 4;

let fi = (u,v) => [Math.cos(v)*Math.cos(u),
                   Math.cos(v)*Math.sin(u),
                   Math.sin(v)];

let fiu = (u,v) => [-Math.cos(v)*Math.sin(u),
                     Math.cos(v)*Math.cos(u),
                     0];

let fiv = (u,v) => [-Math.sin(v)*Math.cos(u),
                    -Math.sin(v)*Math.sin(u),
                     Math.cos(v)];

for (let i=0 ; i<N ; i+=1)
{
    let i2 = i % Math.floor(N / rev);
    let uu =  i * 2*Math.PI / N + i2*2*Math.PI / rev;
    let vv =  i * 2*Math.PI / N;
    
    T.add_point((a*fiu(uu,vv)[0] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[0] ) *sc2,
                (a*fiu(uu,vv)[1] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[1] ) *sc2,
                (a*fiu(uu,vv)[2] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[2] ) *sc2);
}`,

    /*phyllotaxis: `\
let N = 500;
for (let i=0 ; i<N ; i+=1)
{
    let phi    = Math.PI * (Math.sqrt(5.0) - 1.0);
    let y      = 1.0 - (i / (N - 1.0)) * 2.0; // y goes from 1 to -1
    let radius = Math.sqrt(1 - y * y); // radius at y
    let theta  = phi * i; // golden angle increment
    
    let x = Math.cos(theta) * radius;
    let z = Math.sin(theta) * radius;
    T.add_point(x,y,z);
}
`,*/

    rndsphere: `\
let sc  = 8;
for (let i=0 ; i<1000 ; i+=1)
{
    let u = Math.acos(2*Math.random() - 1);
    let v = 2*Math.PI*Math.random();
    T.add_point(sc * Math.sin(u) * Math.cos(v),
                sc * Math.sin(u) * Math.sin(v),
                sc * Math.cos(u));
}`,

    rnd_dotted_circ: `\
let rndp = () => {
    let u = Math.acos(2*Math.random() - 1);
    let v = 2*Math.PI*Math.random();
    return[Math.sin(u) * Math.cos(v),
                Math.sin(u) * Math.sin(v),
                Math.cos(u)];
};
let qmul = (q, q2) => {
    return [
            q[0]*q2[0] - q[1]*q2[1] - q[2]*q2[2] - q[3]*q2[3],
            q[0]*q2[1] + q[1]*q2[0] + q[2]*q2[3] - q[3]*q2[2],
            q[0]*q2[2] - q[1]*q2[3] + q[2]*q2[0] + q[3]*q2[1],
            q[0]*q2[3] + q[1]*q2[2] - q[2]*q2[1] + q[3]*q2[0]
    ];
};
let rotq = (q, v) => {
    let qq  = [ q[0], -q[1], -q[2], -q[3] ];
    let qv  = [0, v[0], v[1], v[2]];
    let ret = qmul(qmul(q, qv), qq);
    return [ret[1], ret[2], ret[3]];
};
let circ = (q, d, a) => {
    let da = 2*Math.PI / a;
    for (let i=0 ; i<a ; i+=1)
    {
        let v = [d*Math.cos(i*da),d*Math.sin(i*da),0];
        let v2 = rotq(q,v);
        T.add_line_point(v2[0], v2[1], v2[2]);
    }
};

for (let i=0 ; i<10 ; i+=1)
{
    let rnd = rndp();
    let ra  = Math.random()*Math.PI;
    let q   = [Math.cos(ra), rnd[0]*Math.sin(ra), rnd[1]*Math.sin(ra), rnd[2]*Math.sin(ra)];
    circ(q, 8, 50);
}`,

    cubefractal: `\
let cube = \`\\
v -8.000000 -8.000000  8.000000
v  8.000000 -8.000000  8.000000
v  8.000000  8.000000  8.000000
v -8.000000  8.000000  8.000000
v -8.000000 -8.000000 -8.000000
v  8.000000 -8.000000 -8.000000
v  8.000000  8.000000 -8.000000
v -8.000000  8.000000 -8.000000

vn 0.000000 0.000000 1.000000
vn -1.000000 0.000000 0.000000
vn 0.000000 0.000000 -1.000000
vn 1.000000 0.000000 0.000000
vn 0.000000 -1.000000 0.000000
vn 0.000000 1.000000 0.000000

f 6//1 7//1 8//1 5//1
f 7//2 6//2 2//2 3//2
f 3//3 2//3 1//3 4//3
f 8//4 4//4 1//4 5//4
f 8//5 7//5 3//5 4//5
f 5//6 1//6 2//6 6//6

l 6 7
l 7 8
l 8 5
l 5 6

l 3 2
l 2 1
l 1 4
l 4 3

l 6 2
l 7 3
l 8 4
l 5 1\`;

let c = (lev, d, pos) => {
    if (lev <= 0) return;
    let dd = 0.5;

    T.obj(cube, pos, d);

    c(lev-1, d*dd, [pos[0] + 8*(d)*(1+dd), pos[1], pos[2]]);
    c(lev-1, d*dd, [pos[0] - 8*(d)*(1+dd), pos[1], pos[2]]);
    c(lev-1, d*dd, [pos[0], pos[1] + 8*(d)*(1+dd), pos[2]]);
    c(lev-1, d*dd, [pos[0], pos[1] - 8*(d)*(1+dd), pos[2]]);
    c(lev-1, d*dd, [pos[0], pos[1], pos[2] + 8*(d)*(1+dd)]);
    c(lev-1, d*dd, [pos[0], pos[1], pos[2] - 8*(d)*(1+dd)]);
};

c(5, 2, [0,0,0]);`,

    cubefractal2: `\
let c = (lev, d, pos, miss) => {
    if (lev <= 0) return;
    let dd = 0.5;
    let dp = (d)*(1+dd);

    let m   = mat4.mul( tr4.transl(pos), tr4.scale(d) );
    let col = [1,1,1];
    //T.cube(m, col);
    T.cube_line(m, col);

    if (miss != 1) c(lev-1, d*dd, {x:pos.x + dp, y:pos.y, z:pos.z}, 2);
    if (miss != 2) c(lev-1, d*dd, {x:pos.x - dp, y:pos.y, z:pos.z}, 1);
    if (miss != 3) c(lev-1, d*dd, {x:pos.x, y:pos.y + dp, z:pos.z}, 4);
    if (miss != 4) c(lev-1, d*dd, {x:pos.x, y:pos.y - dp, z:pos.z}, 3);
    if (miss != 5) c(lev-1, d*dd, {x:pos.x, y:pos.y, z:pos.z + dp}, 6);
    if (miss != 6) c(lev-1, d*dd, {x:pos.x, y:pos.y, z:pos.z - dp}, 5);
};

c(4, 8*4, {x:0,y:0,z:0}, -1);`
};


export { programs };
