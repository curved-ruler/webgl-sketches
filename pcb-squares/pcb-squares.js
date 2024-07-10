
import { vec2 } from "./matvec.js";

import { saveAs } from './FileSaver.js';


let menu_hidden = false;

let grabbed  = -1;
let canvas   = null;
let context  = null;
let scale = 30;
let pan   = [0,0];
let start_pan = 0;

let N = 8;
let N_dom = null;
let lines = [];
let wires = [];
//let cells = [];

let debug = 0;

let back_col = [255, 255, 255];
let line_col = [  0,   0,   0];
let noli_col = [220, 150,  25];
let l1col_dom = null;
let l2col_dom = null;

let err = function (str)
{
    console.error('Error: ' + str);
    window.alert('Error:\n' + str);
};
let save_svg = function ()
{
    let objstring = `\
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
`;
    for (let i=0 ; i<lines.length ; ++i)
    {
        let l1 = scaleup([lines[i].pos[0], lines[i].pos[1]]);
        let l2 = scaleup([lines[i].pos[2], lines[i].pos[3]]);
        
        objstring += `  <line x1="${l1[0]}" y1="${l1[1]}" x2="${l2[0]}" y2="${l2[1]}"\
        stroke="rgb(${noli_col[0]}, ${noli_col[1]}, ${noli_col[2]})" stroke-width="2" />\n`;
    }

    objstring += "</svg>\n";

    let blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'hexa-puzzle.svg');
};

let resize = function ()
{
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
};

let draw = function ()
{
    if (!canvas) return;

    context.fillStyle=`rgb(${back_col[0]}, ${back_col[1]}, ${back_col[2]})`;
    context.fillRect(0,0,canvas.width,canvas.height);

    for (let i=0 ; i<lines.length; ++i)
    {
        context.strokeStyle =`rgb(${line_col[0]}, ${line_col[1]}, ${line_col[2]})`;
        
        let p1 = scaleup([ lines[i].pos[0], lines[i].pos[1] ]);
        let p2 = scaleup([ lines[i].pos[2], lines[i].pos[3] ]);
            
        context.beginPath();
        context.moveTo(p1[0], p1[1]);
        context.lineTo(p2[0], p2[1]);
        context.stroke();
    }
    
    if (debug > 0)
    {
        context.fillStyle=`rgb(${noli_col[0]}, ${noli_col[1]}, ${noli_col[2]})`;
        context.font = "20px Arial";
        
        for (let i=0 ; i<lines.length; ++i)
        {
            let pa = scaleup([ lines[i].pos[0], lines[i].pos[1] ]);
            let pb = scaleup([ lines[i].pos[2], lines[i].pos[3] ]);
            context.fillText("" + lines[i].N, (pa[0]+pb[0])/2, (pa[1]+pb[1])/2);
        }
    }
    else
    {
        context.strokeStyle=`rgb(${noli_col[0]}, ${noli_col[1]}, ${noli_col[2]})`;
        
        for (let i=0 ; i<wires.length; ++i)
        {
            let p1 = scaleup([ wires[i][0], wires[i][1] ]);
            let p2 = scaleup([ wires[i][2], wires[i][3] ]);
            context.beginPath();
            context.moveTo(p1[0], p1[1]);
            context.lineTo(p2[0], p2[1]);
            context.stroke();
        }
    }
};


let line_segment_dist = function(a, b, p)
{
    let pa = vec2.sub(p, a)
    let ba = vec2.sub(b, a);
    let h  = vec2.dot(pa,ba) / vec2.dot(ba,ba);
    if (h < 0) h = 0;
    if (h > 1) h = 1;
    return vec2.length( vec2.sub(pa, vec2.cmul(ba,h)) );
};
let grab = function (x, y)
{
    let pixdiff = 5.0 / scale;

    for (let i=0 ; i<lines.length ; ++i)
    {
        let len = line_segment_dist([ lines[i].pos[0], lines[i].pos[1] ],
                                    [ lines[i].pos[2], lines[i].pos[3] ],
                                    [ x, y ]);
        
        if (len < pixdiff)
        {
            grabbed = i;
            return;
        }
    }
};

let make_grid = function ()
{
    lines = [];
    wires = [];
    //cells = [];
    
    let A = 1;
    let S = -(N/2)*A;
    
    for (let j=0 ; j < N ; ++j)
    {
        for (let i=0 ; i < N ; ++i)
        {
            let a = j === 0 ? -1 : 0;
            let b = i === 0 ? -1 : 0;
            lines.push({ N: a, pos: [S+i*A, S+j*A, S+(i+1)*A, S+j*A] });
            lines.push({ N: b, pos: [S+i*A, S+j*A, S+i*A, S+(j+1)*A] });
        }
    }
    for (let j=0 ; j < N ; ++j)
    {
        lines.push({ N: -1, pos: [S+N*A, S+j*A, S+N*A, S+(j+1)*A] });
    }
    for (let i=0 ; i < N ; ++i)
    {
        lines.push({ N: -1, pos: [S+i*A, S+N*A, S+(i+1)*A, S+N*A] });
    }
};

let randomize_lines = function ()
{
    for (let i=0 ; i<lines.length ; ++i)
    {
        if (lines[i].N === -1) continue;
        
        let R = Math.random();
        lines[i].N = Math.floor(R*10);
    }
};

let generate = function ()
{
    wires = [];
    randomize_lines();
    
    for (let i=0 ; i<lines.length ; ++i)
    {
        let horizontal = (lines[i].pos[0] === lines[i].pos[2]) ? true : false;
        let S = 0.5-((lines[i].N-1)/2)*0.1;
        
        for (let nn = 0 ; nn<lines[i].N ; ++nn)
        {
            if (horizontal)
            {
                wires.push([lines[i].pos[0]-0.5,
                            lines[i].pos[1] + S+nn*0.1,
                            lines[i].pos[2]+0.5,
                            lines[i].pos[1] + S+nn*0.1]);
            }
            else
            {
                wires.push([lines[i].pos[0] + S+nn*0.1,
                            lines[i].pos[1]-0.5,
                            lines[i].pos[0] + S+nn*0.1,
                            lines[i].pos[3]+0.5]);
            }
        }
    }
}

let scaledn = function (v)
{
    return [(v[0] - (canvas.width/2)  - pan[0]) / scale,
            (v[1] - (canvas.height/2) - pan[1]) / scale];
};
let scaleup = function (v)
{
    return [(v[0] * scale) + (canvas.width/2)  + pan[0],
            (v[1] * scale) + (canvas.height/2) + pan[1]];
};
let zoomin  = function () { scale *= 1.25; draw(); };
let zoomout = function () { scale *= 0.8;  draw(); };

let handleMouseDown = function (event)
{
    if (event.button === 0)
    {
        let p  = scaledn([event.clientX, event.clientY]);
        
        grab( p[0], p[1] );
        //..
        grabbed = -1;
        draw();
    }
    else
    {
        start_pan = 1;
    }
};
let handleMouseUp = function (event)
{
    grabbed = -1;
    start_pan = 0;
};
let handleMouseMove = function (event)
{
    if (start_pan === 1)
    {
        pan[0] += event.movementX;
        pan[1] += event.movementY;
        draw();
    }
};

let handleKeyDown = function (event)
{
    if (event.ctrlKey) { return; }
    
    
    if (event.key === 'm' || event.key === 'M')
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
    else if (event.key === 'g' || event.key === 'G')
    {
        generate();
        draw();
    }
    else if (event.key === 's' || event.key === 'S')
    {
        //save_svg();
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
    
    make_grid();
    draw();
};

let set_lcol = function (str)
{
    let bc = str.split(',');
    if (bc.length === 1) bc.push(bc[0], bc[0]);
    if (bc.length === 2) bc.push(bc[1]);
    
    line_col[0] = parseInt(bc[0]);
    line_col[1] = parseInt(bc[1]);
    line_col[2] = parseInt(bc[2]);
    
    draw();
};
let set_nolcol = function (str)
{
    let bc = str.split(',');
    if (bc.length === 1) bc.push(bc[0], bc[0]);
    if (bc.length === 2) bc.push(bc[1]);
    
    noli_col[0] = parseInt(bc[0]);
    noli_col[1] = parseInt(bc[1]);
    noli_col[2] = parseInt(bc[2]);
    
    draw();
};
let set_deb = function (strval)
{
    let ival = parseInt(strval);
    if (isNaN(ival)) { return; }
    debug = ival;
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
    canvas.addEventListener("mousemove", handleMouseMove);
    
    N_dom = document.getElementById('n_in');
    N_dom.value = "" + N;
    
    l1col_dom = document.getElementById('l1col_in');
    l1col_dom.value = "" + line_col[0] + ", " + line_col[1] + ", " + line_col[2];
    l2col_dom = document.getElementById('l2col_in');
    l2col_dom.value = "" + noli_col[0] + ", " + noli_col[1] + ", " + noli_col[2];
    
    let opts = document.getElementById('debug').options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == debug) { opts.selectedIndex = i; break; }
    }
    
    resize();
    
    make_grid();
    draw();
};

window.set_n = set_n;
window.set_lcol = set_lcol;
window.set_nolcol = set_nolcol;
window.set_deb = set_deb;

document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

