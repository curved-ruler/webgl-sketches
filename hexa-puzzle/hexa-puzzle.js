
import { vec2 } from "./matvec.js";

import { saveAs } from './FileSaver.js';


let menu_hidden = false;

let grabbed  = -1;
let canvas   = null;
let context  = null;
let scale = 30;
let pan   = [0,0];
let start_pan = 0;

let N = 4;
let N_dom = null;
let maxs = 10;
let maxs_dom = null;
let gen_n = 40;
let genn_dom = null;
let sum_lines = 0;
let sum_dom = null;
let lines = [];
let cells = [];
let cellsize = [];

let PL = 0.5;
let PL_dom = null;

let debug = true;

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
        
        if (lines[i].state === 0)
        {
            objstring += `  <line x1="${l1[0]}" y1="${l1[1]}" x2="${l2[0]}" y2="${l2[1]}"\
            stroke="rgb(${noli_col[0]}, ${noli_col[1]}, ${noli_col[2]})" stroke-width="2" />\n`;
        }
        else
        {
            objstring += `  <line x1="${l1[0]}" y1="${l1[1]}" x2="${l2[0]}" y2="${l2[1]}"\
            stroke="rgb(${line_col[0]}, ${line_col[1]}, ${line_col[2]})" stroke-width="2" />\n`;
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

    context.fillStyle=`rgb(${back_col[0]}, ${back_col[1]}, ${back_col[2]})`;
    context.fillRect(0,0,canvas.width,canvas.height);

    for (let i=0 ; i<lines.length; ++i)
    {
        if (lines[i].state === 0) context.strokeStyle =`rgb(${noli_col[0]}, ${noli_col[1]}, ${noli_col[2]})`;
        else                      context.strokeStyle =`rgb(${line_col[0]}, ${line_col[1]}, ${line_col[2]})`;
        
        let p1 = scaleup([ lines[i].pos[0], lines[i].pos[1] ]);
        let p2 = scaleup([ lines[i].pos[2], lines[i].pos[3] ]);
            
        context.beginPath();
        context.moveTo(p1[0], p1[1]);
        context.lineTo(p2[0], p2[1]);
        context.stroke();
    }
    
    if (debug)
    {
        context.fillStyle=`rgb(${noli_col[0]}, ${noli_col[1]}, ${noli_col[2]})`;
        context.font = "20px Arial";
        
        for (let i=0 ; i<cells.length; ++i)
        {
            let p = scaleup([ cells[i][1], cells[i][2] ]);
            //context.fillText("" + cells[i][0] + "(" + cellsize[cells[i][0]] + ")", p[0]-10, p[1]+10);
            context.fillText("" + cells[i][0], p[0]-10, p[1]+10);
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
    for (let i=0 ; i<lines.length ; ++i)
    {
        if (curve_check(lines[i].pos, [a,b,c,d]) ||
            curve_check(lines[i].pos, [c,d,a,b]))
        {
            lines[i].state = 1;
            cells[cell].push(i);
            lines[i].nb.push(cell);
            sum_lines += 1;
            return;
        }
    }
    lines.push( { state:2, pos: [a,b,c,d], nb: [cell] } );
    cells[cell].push(lines.length-1);
};

let calc_curve = function ()
{
    lines = [];
    cells = [];
    sum_lines = 0;
    
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
    
    sum_dom.innerHTML = "" + sum_lines;
};

let randomize_lines = function ()
{
    for (let i=0 ; i<lines.length ; ++i)
    {
        if (lines[i].state === 2) continue;
        
        let R = Math.random();
        lines[i].state = (R < PL) ? 1 : 0;
    }
    comp_parts();
};

let part_neighbours = function (celli, nump)
{
    for (let l=3 ; l<cells[celli].length ; ++l)
    {
        let line = lines[cells[celli][l]];
        if (line.state === 0)
        {
            if (line.nb[0] === celli)
            {
                if (cells[line.nb[1]][0] < 0)
                {
                    cells[line.nb[1]][0] = nump;
                    cellsize[nump] += 1;
                    part_neighbours(line.nb[1], nump);
                }
            }
            else
            {
                if (cells[line.nb[0]][0] < 0)
                {
                    cells[line.nb[0]][0] = nump;
                    cellsize[nump] += 1;
                    part_neighbours(line.nb[0], nump);
                }
            }
        }
    }
};
let comp_parts = function ()
{
    cellsize = [];
    for (let i=0 ; i<cells.length ; ++i) { cells[i][0] = -1; }
    
    let nump = 0;
    for (let i=0 ; i<cells.length ; ++i)
    {
        if (cells[i][0] >= 0) continue;
        
        cells[i][0] = nump;
        cellsize.push(1);
        part_neighbours(i, nump);
        
        ++nump;
    }
};

let cleanup = function ()
{
    comp_parts();
    
    for (let i=0 ; i<lines.length ; ++i)
    {
        if (lines[i].state === 1)
        {
            if (cells[lines[i].nb[0]][0] === cells[lines[i].nb[1]][0])
            {
                lines[i].state = 0;
            }
        }
    }
};

let generate = function ()
{
    for (let i=0 ; i<lines.length ; ++i)
    {
        if (lines[i].state === 0) lines[i].state = 1;
    }
    comp_parts();
    
    for (let x=0 ; x<gen_n ; ++x)
    {
        let rndline = Math.floor(Math.random() * lines.length);
        if (lines[rndline].state === 1)
        {
            let i1 = lines[rndline].nb[0];
            let i2 = lines[rndline].nb[1];
            let s1 = cellsize[cells[i1][0]];
            let s2 = cellsize[cells[i2][0]];
            if (s1+s2 <= maxs)
            {
                lines[rndline].state = 0;
                cleanup();
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
        if (grabbed >= 0 && lines[grabbed].state != 2)
        {
            lines[grabbed].state = (lines[grabbed].state === 0) ? 1 : 0;
        }
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
    else if (event.key === 'g' || event.key === 'G')
    {
        generate();
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
let set_genn = function (strval)
{
    let ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 1) { return; }
    
    gen_n = ival;
};
let set_maxs = function (strval)
{
    let ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 1) { return; }
    
    maxs = ival;
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
let toggle_debug = function ()
{
    debug = !debug;
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
    PL_dom = document.getElementById('pl_in');
    PL_dom.value = "" + PL;
    genn_dom = document.getElementById('genn_in');
    genn_dom.value = "" + gen_n;
    maxs_dom = document.getElementById('maxs_in');
    maxs_dom.value = "" + maxs;
    
    sum_dom = document.getElementById('sum_in');
    
    l1col_dom = document.getElementById('l1col_in');
    l1col_dom.value = "" + line_col[0] + ", " + line_col[1] + ", " + line_col[2];
    l2col_dom = document.getElementById('l2col_in');
    l2col_dom.value = "" + noli_col[0] + ", " + noli_col[1] + ", " + noli_col[2];
    
    document.getElementById('deb_in').checked = debug;
    
    resize();
    
    calc_curve();
    draw();
};

window.set_n = set_n;
window.set_p = set_p;
window.set_maxs = set_maxs;
window.set_genn = set_genn;
window.set_lcol = set_lcol;
window.set_nolcol = set_nolcol;
window.toggle_debug = toggle_debug;

document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

