
import { delaunay_step } from "./delaunay.js";

let canvas  = null;
let context = null;

let pts = [];

let mode  = "ADD";
let bcol = [0,0,0];
let pcol = [1,1,1];

let delaunay_maker = {
    p : [], // first three points are the 'all included' tirangle
    t : []  // first triangle      is the 'all included' triangle
};

let resize = function ()
{
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

var draw = function ()
{
    if (!canvas) return;

    context.fillStyle = `rgb(${bcol[0]*256}, ${bcol[1]*256}, ${bcol[2]*256})`;
    context.fillRect(0,0,canvas.width,canvas.height);
    
    for (let i=0 ; i<delaunay_maker.t.length ; i+=1)
    {
        context.fillStyle = `rgb(${Math.floor(delaunay_maker.t[i].r*256)}, ${Math.floor(delaunay_maker.t[i].g*256)}, ${Math.floor(delaunay_maker.t[i].b*256)})`;
        
        if (delaunay_maker.t[i].x > 2 && delaunay_maker.t[i].y > 2 && delaunay_maker.t[i].z > 2)
        {
            let p1 = scaleup(pts[delaunay_maker.t[i].x-3]);
            let p2 = scaleup(pts[delaunay_maker.t[i].y-3]);
            let p3 = scaleup(pts[delaunay_maker.t[i].z-3]);
            
            context.beginPath();
            context.lineTo(p1.x, p1.y);
            context.lineTo(p2.x, p2.y);
            context.lineTo(p3.x, p3.y);
            context.closePath();
            context.fill();
        }
    }
    
    context.fillStyle = `rgb(${pcol[0]*256}, ${pcol[1]*256}, ${pcol[2]*256})`;
    for (let i=0 ; i<pts.length; i+=1)
    {
        context.beginPath();
        let p1 = scaleup(pts[i]);
        context.arc(p1.x, p1.y, 5, 0, 2 * Math.PI, false);
        context.fill();
    }
};

let scaledn = function (v) { return { x:v.x / canvas.width, y:v.y / canvas.height } };
let scaleup = function (v) { return { x:v.x * canvas.width, y:v.y * canvas.height } };

let handleMouseDown = function (event)
{
    if (mode === "ADD")
    {
        let len = (a,b) => ( Math.sqrt( (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) ) );
        let p  = scaledn({ x:event.clientX, y:event.clientY });
        
        let add = true;
        for (let i=0 ; i<pts.length ; ++i)
        {
            if (len(pts[i], p) < 2/canvas.width)
            {
                add = false;
                break;
            }
        }
        
        if (add)
        {
            pts.push(p);
            delaunay_step(delaunay_maker, p);
            
            for (let i=0 ; i<delaunay_maker.t.length ; i+=1)
            {
                if (delaunay_maker.t[i].r === undefined)
                {
                    delaunay_maker.t[i].r = Math.random()*0.9 + 0.1;
                    delaunay_maker.t[i].g = Math.random()*0.9 + 0.1;
                    delaunay_maker.t[i].b = Math.random()*0.9 + 0.1;
                }
            }
        }
        
        draw();
    }
};

let init_delaunay = function ()
{
    let xmin = 0;
    let xmax = 1;
    let ymin = 0;
    let ymax = 1;
    
    delaunay_maker.p.push( {  x:  xmin-3,      y:ymin-3 } );
    delaunay_maker.p.push( {  x:2*xmax-xmin+3, y:ymin-3 } );
    delaunay_maker.p.push( {  x:  xmin-3,      y:2*ymax-ymin+3 } );
    
    delaunay_maker.t.push( { x:0,y:1,z:2, r:0.1,g:0.1,b:0.1 } );
};
let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    
    init_delaunay();
    
    canvas.addEventListener("mousedown", handleMouseDown);
    
    resize();
    draw();
};


document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

