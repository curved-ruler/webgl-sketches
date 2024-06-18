
import { vec2 } from "./matvec.js";


let menu_hidden = false;

let grabbed  = -1;
let canvas   = null;
let context  = null;
let scale = 30;
let alpha = 1.0;

let N = 3;
let N_dom = null;
let curve = [];

let back_col = [1.0, 1.0, 1.0];
let line_col = [0.9, 0.5, 0.1];


let err = function (str)
{
    console.error('Error: ' + str);
    window.alert('Error:\n' + str);
};

let resize = function ()
{
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

let draw = function ()
{
    if (!canvas) return;

    context.fillStyle=`rgb(${back_col[0]*256}, ${back_col[1]*256}, ${back_col[2]*256})`;
    context.fillRect(0,0,canvas.width,canvas.height);

    if (alpha > 0.98) context.strokeStyle =`rgb(${line_col[0]*256}, ${line_col[1]*256}, ${line_col[2]*256})`;
    else              context.strokeStyle =`rgba(${line_col[0]*256}, ${line_col[1]*256}, ${line_col[2]*256}, ${alpha})`;
    
    for (let i=0 ; i<curve.length; ++i)
    {
        let p1 = scaleup([ curve[i][0], curve[i][1]   ]);
        let p2 = scaleup([ curve[i][2], curve[i][3] ]);
            
        context.beginPath();
        context.moveTo(p1[0], p1[1]);
        context.lineTo(p2[0], p2[1]);
        context.stroke();
    }
};

let grab = function (x, y)
{
    let pixdiff = bog_size / scale;

    for (let i=0 ; i<controls.length/2 ; ++i)
    {
        if (Math.abs(controls[2*i]   - x) < pixdiff &&
            Math.abs(controls[2*i+1] - y) < pixdiff)
        {
            grabbed = i;
        }
    }
};



let calc_curve = function ()
{
    curve = [];
    
    let A  = 1;
    let S3 = Math.sqrt(3.0)/2.0;
    
    let va = [ A/2.0, -A*S3];
    let vb = [-A/2.0, -A*S3];
    let vc = [-A,       0.0];
    let vd = [-A/2.0,  A*S3];
    let ve = [ A/2.0,  A*S3];
    let vf = [ A,       0.0];
    
    let dv = [[   0.0,  2*A*S3],
              [ A*1.5,    A*S3],
              [ A*1.5,   -A*S3],
              [   0.0, -2*A*S3],
              [-A*1.5,   -A*S3],
              [-A*1.5,    A*S3]];
    
    let vfirst = [0, 0];
    let v = [];
    
    for (let y=1 ; y < N ; ++y)
    {
        v = vec2.cmul(dv[4],y);
        
        for (let dvi=0 ; dvi < 6 ; ++dvi)
        {
            for (let x=0 ; x < y ; ++x)
            {
                curve.push([...vec2.add(v, va), ...vec2.add(v, vb), 1]);
                curve.push([...vec2.add(v, vb), ...vec2.add(v, vc), 1]);
                curve.push([...vec2.add(v, vc), ...vec2.add(v, vd), 1]);
                curve.push([...vec2.add(v, vd), ...vec2.add(v, ve), 1]);
                curve.push([...vec2.add(v, ve), ...vec2.add(v, vf), 1]);
                curve.push([...vec2.add(v, vf), ...vec2.add(v, va), 1]);
                
                v = vec2.add(v, dv[dvi]);
            }
        }
    }
};

let scaledn = function (v) { return [(v[0] - (canvas.width/2)) / scale, (v[1] - (canvas.height/2)) / scale]; };
let scaleup = function (v) { return [(v[0] * scale) + (canvas.width/2), (v[1] * scale) + (canvas.height/2)]; };
let zoomin  = function () { scale *= 1.25; draw(); };
let zoomout = function () { scale *= 0.8;  draw(); };

let handleMouseDown = function (event)
{
    //console.log("E", event.clientX, event.clientY);
    /*
    let p  = scaledn([event.clientX, event.clientY]);
    
    grab( p[0], p[1] );
    if (grabbed >= 0)
    {
        controls.splice(grabbed*2, 2);
    }
    grabbed = -1;
    calc_curve();
    draw();
    */
};

let handleMouseUp = function (event)
{
    grabbed = -1;
};

let handleKeyDown = function (event)
{
    if (event.key === "w")
    {
        zoomin();
    }
    else if (event.key === "s")
    {
        zoomout();
    }
    else if (event.key === 'm' || event.key === 'M')
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
};

let handleWheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
};



let set_n = function (strval)
{
    let ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 1) { return; }
    N = ival;
    
    calc_curve();
    draw();
};


let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    if (!canvas) { err('No <canvas>'); return; }
    context = canvas.getContext('2d');
    if (!context) { err('No 2d context'); return; }
    
    canvas.addEventListener("mousedown", handleMouseDown);
    
    N_dom = document.getElementById('n_in');
    N_dom.value = "" + N;
    
    resize();
    
    calc_curve();
    draw();
};

window.set_n = set_n;

document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

