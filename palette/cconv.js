
import { cconv } from "./color-conv.js"

let rgb     = [0,0,0];

let c0r = null;
let c0g = null;
let c0b = null;

let rgb0 = null;
let hsv1 = null;
let rgb2 = null;
let hsv3 = null;
let hsl4 = null;
let hsv5 = null;
let rgb6 = null;
let hex7 = null;
let rgb8 = null;

let rgb0c = null;
let hsv1c = null;
let rgb2c = null;
let hsv3c = null;
let hsl4c = null;
let hsv5c = null;
let rgb6c = null;
let hex7c = null;
let rgb8c = null;

let tostring = function (vec)
{
    let ret = "";
    
    if (vec[0] < 100) ret += " ";
    if (vec[0] < 10)  ret += " ";
    ret += vec[0] + ", ";
    
    if (vec[1] < 100) ret += " ";
    if (vec[1] < 10)  ret += " ";
    ret += vec[1] + ", ";
    
    if (vec[2] < 100) ret += " ";
    if (vec[2] < 10)  ret += " ";
    ret += vec[2];
    
    return ret;
};

let compute = function ()
{
    let rgbr = cconv.readable(rgb, 255,255,255);
    rgb0.innerHTML = tostring(rgbr);
    rgb0c.style.backgroundColor = `rgb(${rgbr[0]} ${rgbr[1]} ${rgbr[2]})`;
    
    let hsv1v = cconv.rgb2hsv(rgb);
    let hsv1r = cconv.readable(hsv1v, 360,100,100);
    hsv1.innerHTML = tostring(hsv1r);
    let hsl1v = cconv.hsv2hsl(hsv1v);
    let hsl1r = cconv.readable(hsl1v, 360,100,100);
    hsv1c.style.backgroundColor = `hsl(${hsl1r[0]} ${hsl1r[1]}% ${hsl1r[2]}%)`;
    
    let rgb2v = cconv.hsv2rgb(hsv1v);
    let rgb2r = cconv.readable(rgb2v, 255,255,255);
    rgb2.innerHTML = tostring(rgb2r);
    rgb2c.style.backgroundColor = `rgb(${rgb2r[0]} ${rgb2r[1]} ${rgb2r[2]})`;
    
    let hsv3v = cconv.rgb2hsv(rgb2v);
    let hsv3r = cconv.readable(hsv3v, 360,100,100);
    hsv3.innerHTML = tostring(hsv3r);
    let hsl3v = cconv.hsv2hsl(hsv3v);
    let hsl3r = cconv.readable(hsl3v, 360,100,100);
    hsv3c.style.backgroundColor = `hsl(${hsl3r[0]} ${hsl3r[1]}% ${hsl3r[2]}%)`;
    
    let hsl4v = cconv.hsv2hsl(hsv3v);
    let hsl4r = cconv.readable(hsl4v, 360,100,100);
    hsl4.innerHTML = tostring(hsl4r);
    hsl4c.style.backgroundColor = `hsl(${hsl4r[0]} ${hsl4r[1]}% ${hsl4r[2]}%)`;
    
    let hsv5v = cconv.hsl2hsv(hsl4v);
    let hsv5r = cconv.readable(hsv5v, 360,100,100);
    hsv5.innerHTML = tostring(hsv5r);
    let hsl5v = cconv.hsv2hsl(hsv5v);
    let hsl5r = cconv.readable(hsl5v, 360,100,100);
    hsv5c.style.backgroundColor = `hsl(${hsl5r[0]} ${hsl5r[1]}% ${hsl5r[2]}%)`;
    
    let rgb6v = cconv.hsv2rgb(hsv5v);
    let rgb6r = cconv.readable(rgb6v, 255,255,255);
    rgb6.innerHTML = tostring(rgb6r);
    rgb6c.style.backgroundColor = `rgb(${rgb6r[0]} ${rgb6r[1]} ${rgb6r[2]})`;
    
    let hex7v = cconv.rgb2hex(rgb6v);
    hex7.innerHTML = hex7v;
    hex7c.style.backgroundColor = hex7v;
    
    let rgb8v = cconv.hex2rgb(hex7v);
    let rgb8r = cconv.readable(rgb8v, 255,255,255);
    rgb8.innerHTML = tostring(rgb8r);
    rgb8c.style.backgroundColor = `rgb(${rgb8r[0]} ${rgb8r[1]} ${rgb8r[2]})`;
    
    //console.log("HEX", cconv.hex2rgb("#abc"));
};

let grad = function ()
{
    let rgbr = cconv.readable(rgb, 255,255,255);
    c0r.style.background = `linear-gradient(to right, rgb(${0} ${rgbr[1]} ${rgbr[2]}), rgb(${255} ${rgbr[1]} ${rgbr[2]}))`;
    c0g.style.background = `linear-gradient(to right, rgb(${rgbr[0]} ${0} ${rgbr[2]}), rgb(${rgbr[0]} ${255} ${rgbr[2]}))`;
    c0b.style.background = `linear-gradient(to right, rgb(${rgbr[0]} ${rgbr[1]} ${0}), rgb(${rgbr[0]} ${rgbr[1]} ${255}))`;
};
let set_r = function (rstr)
{
    rgb[0] = parseFloat(rstr) / 255;
    grad();
    compute();
};
let set_g = function (gstr)
{
    rgb[1] = parseFloat(gstr) / 255;
    grad();
    compute();
};
let set_b = function (bstr)
{
    rgb[2] = parseFloat(bstr) / 255;
    grad();
    compute();
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    c0r = document.getElementById("c0r");
    c0g = document.getElementById("c0g");
    c0b = document.getElementById("c0b");
    
    rgb0 = document.getElementById("rgb0");
    hsv1 = document.getElementById("hsv1");
    rgb2 = document.getElementById("rgb2");
    hsv3 = document.getElementById("hsv3");
    hsl4 = document.getElementById("hsl4");
    hsv5 = document.getElementById("hsv5");
    rgb6 = document.getElementById("rgb6");
    hex7 = document.getElementById("hex7");
    rgb8 = document.getElementById("rgb8");
    
    rgb0c = document.getElementById("rgb0c");
    hsv1c = document.getElementById("hsv1c");
    rgb2c = document.getElementById("rgb2c");
    hsv3c = document.getElementById("hsv3c");
    hsl4c = document.getElementById("hsl4c");
    hsv5c = document.getElementById("hsv5c");
    rgb6c = document.getElementById("rgb6c");
    hex7c = document.getElementById("hex7c");
    rgb8c = document.getElementById("rgb8c");
    
    grad();
    compute();
};

window.set_r = set_r;
window.set_g = set_g;
window.set_b = set_b;

document.addEventListener("DOMContentLoaded", init);
