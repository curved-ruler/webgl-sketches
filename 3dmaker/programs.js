
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
}`

};


export { programs };
