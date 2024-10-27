
let clamp = function (x, a, b)
{
    if (x < a) return a;
    if (x > b) return b;
    return x;
};

let bilinear = function (a,b,c,d, u,v)
{
    return a*(1-u)*(1-v) +
           b*(1-u)*v     +
           c*(u)*(1-v)   +
           d*(u)*(v);
};


let utils = {
    clamp,
    bilinear
};
export { utils };
