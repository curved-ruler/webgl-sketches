
let vprog = {
    
    dist_p : `\
float dist (in vec3 p1, in vec3 p2, in int i)
{
    float p = $PPP$;
    return pow(pow(abs(p1.x-p2.x), p) +
               pow(abs(p1.y-p2.y), p) +
               pow(abs(p1.z-p2.z), p), 1.0/p);
}`

};

let cprog = {
    
    cube : `\
return [
    -10, -10, 10, 1,0,0,
     10, -10, 10, 0,1,0,
     10,  10, 10, 0,0,1,
    -10,  10, 10, 1,1,0,
    
    -10, -10, -10, 1,0,1,
     10, -10, -10, 0,1,1,
     10,  10, -10, 0.5,0.1,0,
    -10,  10, -10, 0,0.5,0.1
];`,

    grid : `\
let n = 4;
let ret = [];
for (let k=0 ; k<n ; ++k)
for (let j=0 ; j<n ; ++j)
for (let i=0 ; i<n ; ++i)
{
    ret.push((-(n-1)/2+i)*10, (-(n-1)/2+j)*10, (-(n-1)/2+k)*10, Math.random(), Math.random(), Math.random());
}
return ret;
`
    
};

export { vprog, cprog };
