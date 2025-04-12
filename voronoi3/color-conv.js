
let readable = function (vec, x, y, z)
{
    return [Math.floor(vec[0]*x), Math.floor(vec[1]*y), Math.floor(vec[2]*z)];
};

let rgb2hex = function (rgb)
{
    let to_hex = (c) => {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    };
    return "#" + to_hex(Math.floor(rgb[0]*255)) + to_hex(Math.floor(rgb[1]*255)) + to_hex(Math.floor(rgb[2]*255));
};

let hex2rgb = function (hex)
{
    let a,b,c;
    if (hex.length == 4)
    {
        a = hex.substr(1,1) + hex.substr(1,1);
        b = hex.substr(2,1) + hex.substr(2,1);
        c = hex.substr(3,1) + hex.substr(3,1);
    }
    else if (hex.length == 7)
    {
        a = hex.substr(1,2);
        b = hex.substr(3,2);
        c = hex.substr(5,2);
    }
    
    return [parseInt(a,16) / 255,
            parseInt(b,16) / 255,
            parseInt(c,16) / 255];
};

let hsv2hsl = function (hsv)
{
    let h = hsv[0];
    let l = hsv[2] * (1 - hsv[1]/2);
    let s = 0;
    if (l>0 && l<1)
    {
        s = (hsv[2]-l) / Math.min(l, 1-l);
    }
    return [h, s, l];
};
let hsl2hsv = function (hsl)
{
    let h = hsl[0];
    let v = hsl[2] + hsl[1] * Math.min(hsl[2], 1-hsl[2]);
    let s = 0;
    if (v>0) { s = 2*(1-hsl[2]/v); }
    
    return [h, s, v];
};

let rgb2hsv = function (rgb)
{
    let k = [ 0.0, -1.0/3.0, 2.0/3.0, -1.0 ];
    
    let mix = (a,b,t) => { return a*(1-t) + b*t; };
    
    let pm = (rgb[2] < rgb[1]) ? 1.0 : 0.0;
    let p = [ mix(rgb[2], rgb[1], pm),
              mix(rgb[1], rgb[2], pm),
              mix(k[3],   k[0],   pm),
              mix(k[2],   k[1],   pm) ];
    
    let qm = (p[0] < rgb[0])   ? 1.0 : 0.0;
    let q  = [ mix(p[0],   rgb[0], qm),
               mix(p[1],   p[1],   qm),
               mix(p[3],   p[2],   qm),
               mix(rgb[0], p[0],   qm) ];
    
    let d = q[0] - Math.min(q[3], q[1]);
    
    return [ Math.abs(q[2] + (q[3] - q[1]) / (6.0*d + 0.0000001)),
                d / (q[0] + 0.0000001),
                q[0] ];
};
let hsv2rgb = function (hsv)
{
    let cx2 = [ hsv[0]*6.0, hsv[0]*6.0 + 4.0, hsv[0]*6.0 + 2.0 ];
    
    let modf = (x,m) => { return x - Math.floor(x / m)*m; };
    cx2[0] = modf(cx2[0], 6.0);
    cx2[1] = modf(cx2[1], 6.0);
    cx2[2] = modf(cx2[2], 6.0);
    
    let rgb = [Math.abs( cx2[0]-3.0 ) - 1.0,
               Math.abs( cx2[1]-3.0 ) - 1.0,
               Math.abs( cx2[2]-3.0 ) - 1.0];
    
    if (rgb[0] < 0) { rgb[0] = 0; }
    if (rgb[0] > 1) { rgb[0] = 1; }
    if (rgb[1] < 0) { rgb[1] = 0; }
    if (rgb[1] > 1) { rgb[1] = 1; }
    if (rgb[2] < 0) { rgb[2] = 0; }
    if (rgb[2] > 1) { rgb[2] = 1; }
    
    return [ (1*(1-hsv[1]) + rgb[0]*hsv[1]) * hsv[2],
             (1*(1-hsv[1]) + rgb[1]*hsv[1]) * hsv[2],
             (1*(1-hsv[1]) + rgb[2]*hsv[1]) * hsv[2] ];
};

let cconv = {
    readable,
    rgb2hex,
    hex2rgb,
    hsv2hsl,
    hsl2hsv,
    hsv2rgb,
    rgb2hsv
};

export { cconv };

