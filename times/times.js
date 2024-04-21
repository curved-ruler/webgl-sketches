
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

import { saveAs } from './FileSaver.js';

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let F    = null;
let Fstr = "return x1 * mul;";
let Fdom = null;

let times    = [];
let timesbuf = null;
let visited  = [];
let vis      = [];
let multiplier = 51;  //4509;  //3152; // 18;
let modulus    = 901; //40319; //5041; // 901;
let starter    = 1;

let flip = false;
let flip_dom = null;

let addsub     = 1;
let muldiv     = 1.5;

let multiplier_dom = null;
let modulus_dom    = null;
let addsub_dom     = null;
let muldiv_dom     = null;

let circn = 5;
let circ     = [];
let circbase = [];
let circbuf  = null;
let shape_dom = null;

let coli  = 0;
let bcol  = [[0.2, 0.2, 0.2], [1.0, 1.0, 1.0]];
let ccol  = [[1.0, 1.0, 1.0], [0.0, 0.0, 0.0]];
let lcol  = [[0.0, 1.0, 1.0], [0.0, 0.0, 0.0]];
let alpha = 0.1;
let alpha_dom = null;

let menu_hidden = false;

let then = 0;
let fpsi = 0;
let fpss = [...Array(1000)];

let proj = 0;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 3;
let grabbed  = 0;
let pan      = [0, 0, 0];


let camera = {
    pos   : [0, 0, 10],
    look  : [0, 0, -1],
    up    : [0, 1,  0],
    near  : 0.01,
    median: 10,
    far   : 200,
    fovy  : Math.PI / 3,
    aspect: 1
};


let vposx = function (a) { return Math.sin(a); };
let vposy = function (a) { return Math.cos(a); };
let vposz = function (a) { return a*0; };


let rainbow = function (t)
{
    let t2 = (t / 2) * 6;
    let v   = [Math.abs(((0.0 + t2) % 6.0) - 3.0) - 1.0,
               Math.abs(((4.0 + t2) % 6.0) - 3.0) - 1.0,
               Math.abs(((2.0 + t2) % 6.0) - 3.0) - 1.0 ];

    let rgb = [Math.min(Math.max(v[0], 0.0), 1.0),
               Math.min(Math.max(v[1], 0.0), 1.0),
               Math.min(Math.max(v[2], 0.0), 1.0) ];

    return [0.9 * 0.1 + rgb[0]*0.9,
            0.9 * 0.1 + rgb[1]*0.9,
            0.9 * 0.1 + rgb[2]*0.9 ];
};

let compute_matrices = function ()
{
    modlmat = m4.init();
    modlmat = m4.mul(tr.translate(pan), modlmat);
    modlmat = m4.mul(tr.scale(scale), modlmat);

    //modinvmat = tr.scale(1/scale);
    //modinvmat = m4.mul(tr.rotz(-rotation), modinvmat);
    //modinvmat = m4.mul(tr.roty(-axis), modinvmat);

    viewmat = tr.view(camera);
    projmat = m4.init();
    if (proj === 0)
    {
        projmat = tr.axon(camera);
    }
    else if (proj === 1)
    {
        projmat = tr.persp(camera);
    }
};

let make_circ = function ()
{
    let delta = 2*Math.PI / circn;

    circbase = [];
    let a  = 0;
    let da = 2*Math.PI / modulus;

    for (let i=0 ; i<modulus ; ++i)
    {
        let j = Math.floor(a/delta);

        let x = [1, 0, Math.sin(a), Math.sin(j*delta), Math.sin((j+1)*delta)];
        let y = [1, 0, Math.cos(a), Math.cos(j*delta), Math.cos((j+1)*delta)];

        let pxn = (x[1]*y[2] - y[1]*x[2])*(x[3]-x[4]) - (x[1]-x[2])*(x[3]*y[4] - y[3]*x[4]);
        let pyn = (x[1]*y[2] - y[1]*x[2])*(y[3]-y[4]) - (y[1]-y[2])*(x[3]*y[4] - y[3]*x[4]);
        let den = (x[1]-x[2])*(y[3]-y[4]) - (y[1]-y[2])*(x[3]-x[4]);

        if (circn > 2 && Math.abs(den) > 0.0001) circbase.push(pxn/den, pyn/den, 0);
        else                                     circbase.push(Math.sin(a), Math.cos(a), 0);
        a += da;
    }
    
    
    if (flip)
    {
        let cbn = circbase.length/3;
        let j = cbn-1;
        for (let i=Math.floor(cbn/2) ; i<cbn ; ++i)
        {
            if (i >= j) break;
            
            let tmp = [circbase[i*3], circbase[i*3+1], circbase[i*3+2]];
            circbase[i*3]   = circbase[(j)*3];
            circbase[i*3+1] = circbase[(j)*3+1];
            circbase[i*3+2] = circbase[(j)*3+2];
            
            circbase[(j)*3]   = tmp[0];
            circbase[(j)*3+1] = tmp[1];
            circbase[(j)*3+2] = tmp[2];
            
            --j;
        }
    }


    circ = [];
    let i=0;
    for ( ; i<modulus-1 ; ++i)
    {
        circ.push(circbase[i*3],     circbase[i*3+1],     circbase[i*3+2],       0, 0, 0);
        circ.push(circbase[(i+1)*3], circbase[(i+1)*3+1], circbase[(i+1)*3+2],   0, 0, 0);
    }
    circ.push(circbase[i*3],     circbase[i*3+1], circbase[i*3+2],  0, 0, 0);
    circ.push(circbase[0],       circbase[0+1],   circbase[0+2],    0, 0, 0);

    if (circbuf) gl.deleteBuffer(circbuf);
    circbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circ), gl.STATIC_DRAW);
};
/*
let make_circ = function ()
{
    if (circn < 0) make_circ_c();
    else           make_circ_n();
};
*/

let make_times = function ()
{
    make_circ();

    times = [];
    if (timesbuf) gl.deleteBuffer(timesbuf);

    visited = [...Array(modulus)].map(x => false);
    vis     = [];

    let X0 = 0;
    let X1 = starter % modulus;
    vis.push(X1);
    let X2 = 0;
    try
    {
        X2 = Math.floor(F(X1, X0, multiplier, modulus)) % modulus;
    }
    catch (err)
    {
        console.error("Func error!", err.message);
        alert(err.message);
        return;
    }

    do
    {
        visited[X1] = true;
        visited[X2] = true;
        vis.push(X2);

        times.push(circbase[X1*3], circbase[X1*3+1], circbase[X1*3+2], 0, 0, 0);
        times.push(circbase[X2*3], circbase[X2*3+1], circbase[X2*3+2], 0, 0, 0);
        //arrow(a,b);

        X0 = X1;
        X1 = X2;
        X2 = Math.floor(F(X1, X0, multiplier, modulus)) % modulus;
    }
    while (!visited[X2]);

    vis.push(X2);
    times.push(circbase[X1*3], circbase[X1*3+1], circbase[X1*3+2], 0, 0, 0);
    times.push(circbase[X2*3], circbase[X2*3+1], circbase[X2*3+2], 0, 0, 0);
    //arrow(a,b);

    console.log("L", times.length/6);

    timesbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, timesbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(times), gl.STATIC_DRAW);

    colour();
};

let colour = function ()
{
    let c  = Math.floor(coli / 2);

    gl.clearColor(bcol[c][0], bcol[c][1], bcol[c][2], 1.0);

    for (let i=0 ; i<circ.length / 6 ; ++i)
    {
        circ[i*6 + 3] = ccol[c][0];
        circ[i*6 + 4] = ccol[c][1];
        circ[i*6 + 5] = ccol[c][2];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, circbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(circ), 0, circ.length);

    if (coli % 2 === 0)
    {
        for (let i=0 ; i<times.length / 6 ; ++i)
        {
            times[i*6 + 3] = lcol[c][0];
            times[i*6 + 4] = lcol[c][1];
            times[i*6 + 5] = lcol[c][2];
        }
    }
    else
    {
        for (let i=0 ; i<times.length / 12 ; ++i)
        {
            let va = [times[i*12 + 0], times[i*12 + 1], times[i*12 + 2]];
            let vb = [times[i*12 + 6], times[i*12 + 7], times[i*12 + 8]];
            let cc = rainbow(v3.length(v3.sub(va, vb)));

            times[i*12 +  3] = cc[0];
            times[i*12 +  4] = cc[1];
            times[i*12 +  5] = cc[2];
            times[i*12 +  9] = cc[0];
            times[i*12 + 10] = cc[1];
            times[i*12 + 11] = cc[2];
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, timesbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(times), 0, times.length);
};

let draw = function (now)
{
    if (!gl || !glprog.bin) return;

    /*
    //let now = Date.now();
    //console.log("N", now);
    now *= 0.001;
    let deltaTime = now - then;          // compute time since last frame
    then = now;                            // remember time for next frame
    let fps = 1 / deltaTime;
    fpss[fpsi] = fps;

    ++fpsi;
    if (fpsi >= 1000)
    {
        fpsi = 0;
        let f = 0;
        for (let i=0 ; i<1000 ; ++i) { f += fpss[i]; }
        f /= 1000;
        console.log("fps", f);
    }
    */

    gl.useProgram(glprog.bin);

    if (alpha < 0.99)
    {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
    }
    else
    {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    compute_matrices();
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);

    gl.uniform1f(glprog.alpha, alpha);

    /*
    gl.bindBuffer(gl.ARRAY_BUFFER, circbuf);
    gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 2*3*4, 0*3*4);
    gl.vertexAttribPointer(glprog.col, 3, gl.FLOAT, false, 2*3*4, 1*3*4);
    gl.drawArrays(gl.LINES, 0, circ.length / 6);
    */

    gl.bindBuffer(gl.ARRAY_BUFFER, timesbuf);
    gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 2*3*4, 0*3*4);
    gl.vertexAttribPointer(glprog.col, 3, gl.FLOAT, false, 2*3*4, 1*3*4);
    gl.drawArrays(gl.LINES, 0, times.length / 6);

    //requestAnimationFrame(draw);
};

let zoomin  = function () { scale *= 1.25; };
let zoomout = function () { scale *= 0.8;  };
let handle_wheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();

    draw();
}
let handle_mouse_down = function (event)
{
    grabbed = 1;
};
let handle_mouse_up = function (event)
{
    grabbed = 0;
};

let handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        pan[0] += event.movementX/(scale*60);
        pan[1] -= event.movementY/(scale*60);
        draw();
    }
};

let handle_key_down = function ()
{
    if (document.activeElement === Fdom) { return; }
    if (event.ctrlKey) { return; }
    
    
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
    else if (event.key === "c" || event.key === "C")
    {
        ++coli; if (coli >= 4) { coli = 0; }
        colour();
        draw();
    }
    /*
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) { proj = 0; }
        draw();
    }
    */
    else if (event.key === "s" || event.key === "S")
    {
        let blob = new Blob([vis.join('\n')], {type: "text/plain"});
        saveAs(blob, 'times.txt');        
    }
    else if (event.key === "F1")
    {
        scale    = 3;
        pan      = [0, 0, 0];
        draw();
    }
    else if (event.key === "1")
    {
        mp_sub();
    }
    else if (event.key === "2")
    {
        mp_add();
    }
    else if (event.key === "3")
    {
        mo_sub();
    }
    else if (event.key === "4")
    {
        mo_add();
    }
};


let setf = function ()
{
    Fstr = Fdom.value;
    console.log("FF", Fstr);
    
    try
    {
        F = Function('x1', 'x0', 'mul', 'mod', Fstr);
    }
    catch (err)
    {
        console.error("Func error!", err.message);
        alert(err.message);
        return;
    }
    
    make_times();
    draw();
};
let set_alpha = function (strval)
{
    let ival = Number(strval);

    if (isNaN(ival) || ival === undefined || ival === null) return;
    if (ival < 0)   ival = 0;
    if (ival > 1.0) ival = 1.0;

    alpha = ival;
    alpha_dom.blur();

    draw();
};
let set_shape = function (strval)
{
    let ival = parseInt(strval);

    if (isNaN(ival) || ival === undefined || ival === null) return;

    //console.log("circn", ival);
    circn = ival;
    shape_dom.blur();
    
    make_times();
    draw();
};
let set_flip = function (strval)
{
    flip = !flip;
    flip_dom.blur();
    
    make_times();
    draw();
};

let iclear = function ()
{
    multiplier_dom.value = multiplier;
    modulus_dom.value    = modulus;
    addsub_dom.value     = addsub;
    muldiv_dom.value     = muldiv;
};
let mp_div = function () { let v2 = Math.floor(multiplier / muldiv); if (v2 > 1)       { multiplier = v2; iclear(); make_times(); draw(); } };
let mp_sub = function () { let v2 =           (multiplier - addsub); if (v2 > 1)       { multiplier = v2; iclear(); make_times(); draw(); } };
let mp_add = function () { let v2 =           (multiplier + addsub); if (v2 < 100000)  { multiplier = v2; iclear(); make_times(); draw(); } };
let mp_mul = function () { let v2 = Math.floor(multiplier * muldiv); if (v2 < 100000)  { multiplier = v2; iclear(); make_times(); draw(); } };
let mo_div = function () { let v2 = Math.floor(modulus / muldiv);    if (v2 > 1)       { modulus = v2;    iclear(); make_times(); draw(); } };
let mo_sub = function () { let v2 =           (modulus - addsub);    if (v2 > 1)       { modulus = v2;    iclear(); make_times(); draw(); } };
let mo_add = function () { let v2 =           (modulus + addsub);    if (v2 < 1000000) { modulus = v2;    iclear(); make_times(); draw(); } };
let mo_mul = function () { let v2 = Math.floor(modulus * muldiv);    if (v2 < 1000000) { modulus = v2;    iclear(); make_times(); draw(); } };

let set_mp     = function (sv) { let v2 = parseInt(sv);   if (v2 !== multiplier && v2 > 1 && v2 < 100000)  { multiplier = v2; iclear(); make_times(); draw(); } multiplier_dom.blur(); };
let set_mo     = function (sv) { let v2 = parseInt(sv);   if (v2 !== modulus    && v2 > 1 && v2 < 1000000) { modulus = v2;    iclear(); make_times(); draw(); } modulus_dom.blur(); };
let set_addsub = function (sv) { let v2 = parseInt(sv);   if (v2 > 0 && v2 < 1000) { addsub = v2; } addsub_dom.blur(); };
let set_muldiv = function (sv) { let v2 = parseFloat(sv); if (v2 > 1 && v2 < 90)   { muldiv = v2; } muldiv_dom.blur() };


let resize = function ()
{
    if (!canvas || !gl) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    camera.aspect = cwidth / cheight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let ui_init = function ()
{
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == alpha) { opts.selectedIndex = i; }
    }
    
    opts = shape_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == circn) { opts.selectedIndex = i; }
    }
    
    flip_dom.checked = flip;
    
    Fdom.value = Fstr;
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id);

    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);

    glprog.pos = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    glprog.col = gl.getAttribLocation(glprog.bin, "col");
    gl.enableVertexAttribArray(glprog.col);

    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");

    multiplier_dom       = document.getElementById('mp');
    modulus_dom          = document.getElementById('mo');
    addsub_dom           = document.getElementById('addsub');
    muldiv_dom           = document.getElementById('muldiv');

    iclear();
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);

    canvas = document.getElementById('canvas');
    gpu_init('canvas');

    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    canvas.addEventListener("keydown", handle_key_down);
    
    Fdom      = document.getElementById("func");
    alpha_dom = document.getElementById('alpha');
    shape_dom = document.getElementById('shape');
    flip_dom  = document.getElementById('flip');
    ui_init();
    
    setf();

    resize();
    make_times();

    requestAnimationFrame(draw);
};

window.starter = starter;

window.set_alpha = set_alpha;
window.set_shape = set_shape;
window.set_flip  = set_flip;

window.setf  = setf;

window.mp_div = mp_div;
window.mp_sub = mp_sub;
window.mp_add = mp_add;
window.mp_mul = mp_mul;
window.mo_div = mo_div;
window.mo_sub = mo_sub;
window.mo_add = mo_add;
window.mo_mul = mo_mul;

window.set_mp     = set_mp;
window.set_mo     = set_mo;
window.set_addsub = set_addsub;
window.set_muldiv = set_muldiv;

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });
