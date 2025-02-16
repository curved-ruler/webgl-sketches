
let programs = {
    sph_spiral: `\
let N   = 1000;
let rev = 9;
for (let i=0; i<N; i+=1) {
    let theta = i*Math.PI / N;
    let phi   = i*(2*rev*Math.PI / N);
    
    T.add_point(Math.sin(theta) * Math.cos(phi),
                Math.sin(theta) * Math.sin(phi),
                Math.cos(theta));
}`,

    chebysev_net: `\
let N   = 2000;
let a = 0.5;
let rev = 7;

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
    
    T.add_point((a*fiu(uu,vv)[0] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[0] ) / 2,
                (a*fiu(uu,vv)[1] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[1] ) / 2,
                (a*fiu(uu,vv)[2] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[2] ) / 2);
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
for (let i=0 ; i<1000 ; i+=1)
{
    let u = Math.acos(2*Math.random() - 1);
    let v = 2*Math.PI*Math.random();
    T.add_point(Math.sin(u) * Math.cos(v),
                Math.sin(u) * Math.sin(v),
                Math.cos(u));
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

for (let i=0 ; i<50 ; i+=1)
{
    let rnd = rndp();
    let ra  = Math.random()*Math.PI;
    let q   = [Math.cos(ra), rnd[0]*Math.sin(ra), rnd[1]*Math.sin(ra), rnd[2]*Math.sin(ra)];
    circ(q, 10, 50);
}`
};


export { programs };
