
import { vec3, mat4, tr } from "./matvec.js";
import { delaunay_step, dual } from "./delaunay.js";

let canvas  = null;
let context = null;

let menu_hidden = false;

let pts = [];

let mode  = "ADD";
let xmin = 0;
let xmax = 0;
let ymin = 0;
let ymax = 0;
let bcol = [0,0,0];
let pcol = [1,1,1];

let scale = 1;
let pan   = [0,0];
let grabbed = 0;
let modlmat   = mat4.init();
let modinvmat = mat4.init();

let disp = 0;

let delaunay_maker = {
    p : [], // first three points are the 'all included' tirangle
    t : []  // first triangle      is the 'all included' triangle
};
let voronoi = [];

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
    
    if (disp === 0)
    {
    for (let i=0 ; i<delaunay_maker.t.length ; i+=1)
    {
        context.fillStyle = `rgb(${Math.floor(delaunay_maker.t[i].r*256)}, ${Math.floor(delaunay_maker.t[i].g*256)}, ${Math.floor(delaunay_maker.t[i].b*256)})`;
        
        //if (delaunay_maker.t[i].x > 5 && delaunay_maker.t[i].y > 5 && delaunay_maker.t[i].z > 5)
        //{
            let p1 = vec3.mmul4(modlmat, [delaunay_maker.p[delaunay_maker.t[i].x].x, delaunay_maker.p[delaunay_maker.t[i].x].y, 0]);
            let p2 = vec3.mmul4(modlmat, [delaunay_maker.p[delaunay_maker.t[i].y].x, delaunay_maker.p[delaunay_maker.t[i].y].y, 0]);
            let p3 = vec3.mmul4(modlmat, [delaunay_maker.p[delaunay_maker.t[i].z].x, delaunay_maker.p[delaunay_maker.t[i].z].y, 0]);
            
            context.beginPath();
            context.lineTo(p1[0], p1[1]);
            context.lineTo(p2[0], p2[1]);
            context.lineTo(p3[0], p3[1]);
            context.closePath();
            context.fill();
        //}
    }
    
    }
    else if (disp === 1)
    {
    
    for (let i=0 ; i<voronoi.length; i+=1)
    {
        context.fillStyle = `rgb(${Math.floor(delaunay_maker.t[i].r*256)}, ${Math.floor(delaunay_maker.t[i].g*256)}, ${Math.floor(delaunay_maker.t[i].b*256)})`;
        
        context.beginPath();
        for (let j=0 ; j<voronoi[i].length ; j+=1)
        {
            let p1 = vec3.mmul4(modlmat, [voronoi[i][j].x, voronoi[i][j].y, 0]);
            context.lineTo(p1[0], p1[1]);
        }
        context.closePath();
        context.fill();
    }
    
    }
    else
    {
        for (let i=0 ; i<delaunay_maker.t.length ; i+=1)
        {
            context.strokeStyle = `rgb(${pcol[0]*256}, ${pcol[1]*256}, ${pcol[2]*256})`;
            
            let p1 = vec3.mmul4(modlmat, [delaunay_maker.p[delaunay_maker.t[i].x].x, delaunay_maker.p[delaunay_maker.t[i].x].y, 0]);
            let p2 = vec3.mmul4(modlmat, [delaunay_maker.p[delaunay_maker.t[i].y].x, delaunay_maker.p[delaunay_maker.t[i].y].y, 0]);
            let p3 = vec3.mmul4(modlmat, [delaunay_maker.p[delaunay_maker.t[i].z].x, delaunay_maker.p[delaunay_maker.t[i].z].y, 0]);
            
            context.beginPath();
            context.lineTo(p1[0], p1[1]);
            context.lineTo(p2[0], p2[1]);
            context.lineTo(p3[0], p3[1]);
            context.closePath();
            context.stroke();
        }
    
        for (let i=0 ; i<voronoi.length; i+=1)
        {
            context.strokeStyle = `rgb(0, 200, 0)`;
            
            context.beginPath();
            for (let j=0 ; j<voronoi[i].length ; j+=1)
            {
                let p1 = vec3.mmul4(modlmat, [voronoi[i][j].x, voronoi[i][j].y, 0]);
                context.lineTo(p1[0], p1[1]);
            }
            context.closePath();
            context.stroke();
        }
    }
    
    context.fillStyle = `rgb(${pcol[0]*256}, ${pcol[1]*256}, ${pcol[2]*256})`;
    for (let i=0 ; i<pts.length; i+=1)
    {
        context.beginPath();
        let p1 = vec3.mmul4(modlmat, [pts[i].x, pts[i].y, 0]);
        context.arc(p1[0], p1[1], 4, 0, 2 * Math.PI, false);
        context.fill();
    }
};

let compute_matrices = function ()
{
    modlmat = mat4.init();
    modlmat = mat4.mul(tr.scale(scale), modlmat);
    modlmat = mat4.mul(tr.transl([pan[0], pan[1], 0]), modlmat);
    
    modinvmat = mat4.init();
    modinvmat = mat4.mul(tr.transl([-pan[0], -pan[1], 0]), modinvmat);
    modinvmat = mat4.mul(tr.scale(1/scale), modinvmat);
};


let handle_wheel = function (e)
{
    if (e.deltaY < 0) scale *= 1.25;
    else              scale *= 0.8;
    
    compute_matrices();
    
    draw();
};
let handle_mouse_down = function (e)
{
    if (e.button === 0 && mode === "ADD")
    {
        let len = (a,b) => ( Math.sqrt( (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) ) );
        let p3  = vec3.mmul4(modinvmat, [e.clientX, e.clientY, 0]);
        let p   = { x:p3[0], y:p3[1] };
        
        if (p.x > xmax || p.x < xmin || p.y > ymax || p.y < ymin) return;
        
        let add = true;
        for (let i=0 ; i<pts.length ; ++i)
        {
            if (len(pts[i], p) < 3)
            {
                add = false;
                break;
            }
        }
        
        if (add)
        {
            pts.push(p);
            delaunay_step(delaunay_maker, p);
            
            voronoi = [];
            voronoi = dual(delaunay_maker);
            
            for (let i=0 ; i<delaunay_maker.t.length ; i+=1)
            {
                if (delaunay_maker.t[i].r === undefined)
                {
                    delaunay_maker.t[i].r = Math.random()*0.9 + 0.1;
                    delaunay_maker.t[i].g = Math.random()*0.9 + 0.1;
                    delaunay_maker.t[i].b = Math.random()*0.9 + 0.1;
                }
            }
            
            draw();
        }
    }
    else if (e.button === 1)
    {
        grabbed = 1;
    }
};
let handle_mouse_up = function (e)
{
    grabbed = 0;
};
let handle_mouse_move = function (e)
{
    if (grabbed === 1)
    {
        //let a = scale/canvas.height;
        pan[0] += e.movementX;
        pan[1] += e.movementY;
        
        compute_matrices();
        draw();
    }
};
let handle_key_down = function (e)
{
    if (event.key === "m" || event.key === "M")
    {
        if (menu_hidden)
        {
            menu_hidden = false;
            document.getElementById("menu").className = "";
        }
        else
        {
            menu_hidden = true;
            document.getElementById("menu").className = "hidden";
        }
    }
    else if (event.key === "d" || event.key === "D")
    {
        disp += 1;
        if (disp > 2) { disp = 0; }
        draw();
    }
    else if (event.key === "Enter")
    {
        pan  = [canvas.width/2, canvas.height/2];
        scale = 1.0;
        draw();
    }
};

let init_delaunay = function ()
{
    delaunay_maker.p.push( {  x:xmin, y:ymin } );
    delaunay_maker.p.push( {  x:xmax, y:ymin } );
    delaunay_maker.p.push( {  x:xmin, y:ymax } );0
    delaunay_maker.p.push( {  x:xmax, y:ymax } );
    
    delaunay_maker.t.push( { x:0,y:1,z:2, r:0.4,g:0.4,b:0.4 } );
    delaunay_maker.t.push( { x:1,y:3,z:2, r:0.4,g:0.4,b:0.4 } );
};
let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    resize();
    xmin = -canvas.width/2 + 10;
    xmax =  canvas.width/2 - 10;
    ymin = -canvas.height/2 + 10;
    ymax =  canvas.height/2 - 10;
    pan  = [canvas.width/2, canvas.height/2];
    compute_matrices();
    init_delaunay();
    draw();
};

document.addEventListener("keydown", handle_key_down);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

