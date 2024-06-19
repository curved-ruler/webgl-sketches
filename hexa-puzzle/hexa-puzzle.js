
import { vec2 } from "./matvec.js";

import { saveAs } from './FileSaver.js';


let menu_hidden = false;

let grabbed  = -1;
let canvas   = null;
let context  = null;
let scale = 30;
let alpha = 1.0;

let N = 3;
let N_dom = null;
let curve = [];
let cells = [];
let parts = [];

let PL = 0.5;
let PL_dom = null;

let debug = true;

let back_col = [1.0, 1.0, 1.0];
let line_col = [0.0, 0.0, 0.0];
let noli_col = [0.9, 0.6, 0.1];

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
    let sc = scale;
    let pl = [canvas.width / 2, canvas.height/2];
    let cn = curve.length;
        
    for (let i=0 ; i<cn ; ++i)
    {
        if (curve[i][4] === 0)
        {
            objstring += `  <line x1="${curve[i][0]*sc+pl[0]}" y1="${curve[i][1]*sc+pl[1]}" x2="${curve[i][2]*sc+pl[0]}" y2="${curve[i][3]*sc+pl[1]}"\
            stroke="rgb(${noli_col[0]*255}, ${noli_col[1]*255}, ${noli_col[2]*255})" stroke-width="2" />\n`;
        }
        else
        {
            objstring += `  <line x1="${curve[i][0]*sc+pl[0]}" y1="${curve[i][1]*sc+pl[1]}" x2="${curve[i][2]*sc+pl[0]}" y2="${curve[i][3]*sc+pl[1]}"\
            stroke="rgb(${line_col[0]*255}, ${line_col[1]*255}, ${line_col[2]*255})" stroke-width="2" />\n`;
        }
    }

    objstring += "</svg>\n";

    let blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'hexa-puzzle.svg');
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

    context.fillStyle=`rgb(${back_col[0]*255}, ${back_col[1]*255}, ${back_col[2]*255})`;
    context.fillRect(0,0,canvas.width,canvas.height);

    //if (alpha > 0.98) context.strokeStyle =`rgb(${line_col[0]*256}, ${line_col[1]*256}, ${line_col[2]*256})`;
    //else              context.strokeStyle =`rgba(${line_col[0]*256}, ${line_col[1]*256}, ${line_col[2]*256}, ${alpha})`;
    
    for (let i=0 ; i<curve.length; ++i)
    {
        if (curve[i][4] === 0) context.strokeStyle =`rgb(${noli_col[0]*255}, ${noli_col[1]*255}, ${noli_col[2]*255})`;
        else                   context.strokeStyle =`rgb(${line_col[0]*255}, ${line_col[1]*255}, ${line_col[2]*255})`;
        
        let p1 = scaleup([ curve[i][0], curve[i][1] ]);
        let p2 = scaleup([ curve[i][2], curve[i][3] ]);
            
        context.beginPath();
        context.moveTo(p1[0], p1[1]);
        context.lineTo(p2[0], p2[1]);
        context.stroke();
    }
    
    if (debug)
    {
        context.fillStyle=`rgb(${noli_col[0]*255}, ${noli_col[1]*255}, ${noli_col[2]*255})`;
        context.font = "20px Arial";
        let sc = scale;
        let pl = [canvas.width / 2-10, canvas.height/2+10];
        for (let i=0 ; i<cells.length; ++i)
        {
            context.fillText("" + cells[i][0], cells[i][1]*sc+pl[0], cells[i][2]*sc+pl[1]);
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

    for (let i=0 ; i<curve.length ; ++i)
    {
        let len = line_segment_dist([ curve[i][0], curve[i][1] ],
                                    [ curve[i][2], curve[i][3] ],
                                    [ x, y ]);
        
        if (len < pixdiff)
        {
            grabbed = i;
        }
    }
};

let curve_check  = function (la,lb)
{
    if (Math.abs(la[0]-lb[0]) < 0.001 &&
        Math.abs(la[1]-lb[1]) < 0.001 &&
        Math.abs(la[2]-lb[2]) < 0.001 &&
        Math.abs(la[3]-lb[3]) < 0.001) { return true; }
    
    return false;
};
let curve_insert = function (a,b,c,d, cell)
{
    for (let i=0 ; i<curve.length ; ++i)
    {
        if (curve_check(curve[i], [a,b,c,d]) ||
            curve_check(curve[i], [c,d,a,b]))
        {
            curve[i][4] = 1;
            cells[cell].push(i);
            curve[i][5].push([cell])
            return;
        }
    }
    curve.push([a,b,c,d,2, [cell]]);
    cells[cell].push(curve.length-1);
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
    let v  = [0,0];
    let np = 0;
    
    cells.push([-1, 0, 0]);
    curve_insert(...va, ...vb, np);
    curve_insert(...vb, ...vc, np);
    curve_insert(...vc, ...vd, np);
    curve_insert(...vd, ...ve, np);
    curve_insert(...ve, ...vf, np);
    curve_insert(...vf, ...va, np);
    for (let y=1 ; y < N ; ++y)
    {
        v = vec2.cmul(dv[4],y);
        
        for (let dvi=0 ; dvi < 6 ; ++dvi)
        {
            for (let x=0 ; x < y ; ++x)
            {
                ++np;
                cells.push([-1, v[0], v[1]]);
                curve_insert(...vec2.add(v, va), ...vec2.add(v, vb), np);
                curve_insert(...vec2.add(v, vb), ...vec2.add(v, vc), np);
                curve_insert(...vec2.add(v, vc), ...vec2.add(v, vd), np);
                curve_insert(...vec2.add(v, vd), ...vec2.add(v, ve), np);
                curve_insert(...vec2.add(v, ve), ...vec2.add(v, vf), np);
                curve_insert(...vec2.add(v, vf), ...vec2.add(v, va), np);
                
                v = vec2.add(v, dv[dvi]);
            }
        }
    }
};

let randomize_lines = function ()
{
    for (let i=0 ; i<curve.length ; ++i)
    {
        if (curve[i][4] === 2) continue;
        
        let R = Math.random();
        curve[i][4] = (R < PL) ? 1 : 0;
    }
    comp_parts();
};

let part_neighbours = function (celli, nump)
{
    for (let l=3 ; l<cells[celli].length ; ++l)
    {
        let line = curve[cells[celli][l]];
        if (line[4] === 0)
        {
            if (line[5][0] === celli)
            {
                if (cells[line[5][1]][0] < 0)
                {
                    cells[line[5][1]][0] = nump;
                    part_neighbours(line[5][1], nump);
                }
            }
            else
            {
                if (cells[line[5][0]][0] < 0)
                {
                    cells[line[5][0]][0] = nump;
                    part_neighbours(line[5][0], nump);
                }
            }
        }
    }
};
let comp_parts = function ()
{
    for (let i=0 ; i<cells.length ; ++i) { cells[i][0] = -1; }
    
    let nump = 0;
    for (let i=0 ; i<cells.length ; ++i)
    {
        if (cells[i][0] >= 0) continue;
        
        cells[i][0] = nump;
        part_neighbours(i, nump);
        
        ++nump;
    }
};

let cleanup = function ()
{
    comp_parts();
    /*
    for (let i=0 ; i<curve.length ; ++i)
    {
        if (curve[i][4] === 2 || curve[i][4] === 0) continue;
        if ()
    }
    */
};

let scaledn = function (v) { return [(v[0] - (canvas.width/2)) / scale, (v[1] - (canvas.height/2)) / scale]; };
let scaleup = function (v) { return [(v[0] * scale) + (canvas.width/2), (v[1] * scale) + (canvas.height/2)]; };
let zoomin  = function () { scale *= 1.25; draw(); };
let zoomout = function () { scale *= 0.8;  draw(); };

let handleMouseDown = function (event)
{
    //console.log("E", event.clientX, event.clientY);
    
    let p  = scaledn([event.clientX, event.clientY]);
    
    grab( p[0], p[1] );
    if (grabbed >= 0 && curve[grabbed][4] != 2)
    {
        curve[grabbed][4] = (curve[grabbed][4] === 0) ? 1 : 0;
    }
    grabbed = -1;
    draw();
};

let handleMouseUp = function (event)
{
    grabbed = -1;
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
    else if (event.key === 'r' || event.key === 'R')
    {
        randomize_lines();
        draw();
    }
    else if (event.key === 'c' || event.key === 'C')
    {
        cleanup();
        draw();
    }
    else if (event.key === 's' || event.key === 'S')
    {
        save_svg();
    }
};

let handleWheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
};



let set_p = function (strval)
{
    let plval = parseFloat(PL_dom.value);
    
    if (isNaN(plval) || plval < 0 || plval > 1) { return; }
    
    PL = plval;
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
    PL_dom = document.getElementById('pl_in');
    PL_dom.value = "" + PL;
    
    resize();
    
    calc_curve();
    draw();
};

window.set_n = set_n;
window.set_p = set_p;

document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

