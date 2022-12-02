
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let times    = [];
let arr      = [];
let timesbuf = null;
let arrbuf   = null;
let show_arr = false;
let visited  = [];
let vis      = [];
let multiplier = 3131;   // 18
let modulus    = 5041; // 901
let starter    = 1;

let addsub     = 1;
let muldiv     = 1.5;

let multiplier_dom = null;
let modulus_dom    = null;
let addsub_dom     = null;
let muldiv_dom     = null;

let circn = 200;
let circ  = [];
let circbuf  = null;

let coli  = 0;
let bcol  = [[0.2, 0.2, 0.2], [1.0, 1.0, 1.0]];
let ccol  = [[1.0, 1.0, 1.0], [0.0, 0.0, 0.0]];
let lcol  = [[0.0, 1.0, 1.0], [0.0, 0.0, 0.0]];
let alpha = 0.1;
let alpha_dom = null;

let menu_hidden = false;

let proj = 0;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 4;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
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
//let campix = 

let vposx = function (a) { return Math.sin(a); };
let vposy = function (a) { return Math.cos(a); };
let vposz = function (a) { return a*0; };
let arrow = function (a, b)
{
    let va  = (a === b) ? [0,0,0] : [vposx(a), vposy(a), vposz(a)];
    let vb  = [vposx(b), vposy(b), vposz(b)];
    let vab = v3.sub(va, vb);
        vab = v3.normalize(vab);
    let vc  = v3.add(vb, v3.cmul(v3.mmul(tr.rotz( 10), vab), 0.9*Math.PI / modulus));
    let vd  = v3.add(vb, v3.cmul(v3.mmul(tr.rotz(-10), vab), 0.9*Math.PI / modulus));
    
    arr.push(vb[0], vb[1], vb[2], 0, 0, 0);
    arr.push(vc[0], vc[1], vc[2], 0, 0, 0);
    arr.push(vd[0], vd[1], vd[2], 0, 0, 0);
};
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
    modlmat = tr.rotz(rotation);
    modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis), modlmat);
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
    let a = 0;
    let da = 2*Math.PI / circn;
    
    for (let i=0 ; i<circn ; ++i)
    {
        circ.push(vposx(a),    vposy(a),    vposz(a),    0, 0, 0);
        circ.push(vposx(a+da), vposy(a+da), vposz(a+da), 0, 0, 0);
        a += da;
    }
    
    circbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circ), gl.STATIC_DRAW);
};
let make_times = function ()
{
    times = [];
    if (timesbuf) gl.deleteBuffer(timesbuf);
    arr = [];
    if (arrbuf) gl.deleteBuffer(arrbuf);
    
    visited = [...Array(modulus)].map(x => false);
    vis     = [];
    
    let X = starter % modulus;
    vis.push(X);
    let Y = Math.floor((X+10) * multiplier) % modulus;
    
    do
    {
        visited[X] = true;
        visited[Y] = true;
        vis.push(Y);
        
        let a = X*2*Math.PI / modulus;
        let b = Y*2*Math.PI / modulus;
        times.push(vposx(a), vposy(a), vposz(a), 0, 0, 0);
        times.push(vposx(b), vposy(b), vposz(b), 0, 0, 0);
        arrow(a,b);
        
        X = Y;
        Y = Math.floor((X+10) * multiplier) % modulus;
    }
    while (!visited[Y]);
    
    vis.push(Y);
    let a = X*2*Math.PI / modulus;
    let b = Y*2*Math.PI / modulus;
    times.push(vposx(a), vposy(a), vposz(a), 0, 0, 0);
    times.push(vposx(b), vposy(b), vposz(b), 0, 0, 0);
    arrow(a,b);
    
    timesbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, timesbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(times), gl.STATIC_DRAW);
    
    arrbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, arrbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
    
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
        
        for (let i=0 ; i<arr.length / 6 ; ++i)
        {
            arr[i*6 + 3] = lcol[c][0];
            arr[i*6 + 4] = lcol[c][1];
            arr[i*6 + 5] = lcol[c][2];
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
            
            //arr[i*18 +  0] = cc[];
            //arr[i*18 +  1] = cc[];
            //arr[i*18 +  2] = cc[];
            arr[i*18 +  3] = cc[0];
            arr[i*18 +  4] = cc[1];
            arr[i*18 +  5] = cc[2];
            //arr[i*18 +  6] = cc[];
            //arr[i*18 +  7] = cc[];
            //arr[i*18 +  8] = cc[];
            arr[i*18 +  9] = cc[0];
            arr[i*18 + 10] = cc[1];
            arr[i*18 + 11] = cc[2];
            //arr[i*18 + 12] = cc[];
            //arr[i*18 + 13] = cc[];
            //arr[i*18 + 14] = cc[];
            arr[i*18 + 15] = cc[0];
            arr[i*18 + 16] = cc[1];
            arr[i*18 + 17] = cc[2];
        }
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, timesbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(times), 0, times.length);
    gl.bindBuffer(gl.ARRAY_BUFFER, arrbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(arr), 0, arr.length);
};

let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
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
    
    gl.bindBuffer(gl.ARRAY_BUFFER, circbuf);
    gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 2*3*4, 0*3*4);
    gl.vertexAttribPointer(glprog.col, 3, gl.FLOAT, false, 2*3*4, 1*3*4);
    gl.drawArrays(gl.LINES, 0, circ.length / 6);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, timesbuf);
    gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 2*3*4, 0*3*4);
    gl.vertexAttribPointer(glprog.col, 3, gl.FLOAT, false, 2*3*4, 1*3*4);
    gl.drawArrays(gl.LINES, 0, times.length / 6);
    
    if (show_arr)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, arrbuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 2*3*4, 0*3*4);
        gl.vertexAttribPointer(glprog.col, 3, gl.FLOAT, false, 2*3*4, 1*3*4);
        gl.drawArrays(gl.TRIANGLES, 0, arr.length / 6);
    }
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
    rotdir = (axis < 90) || (axis > 270);
};
let handle_mouse_up = function (event)
{
    grabbed = 0;
};

let handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        if (event.ctrlKey)
        {
            axis -= event.movementY*0.25;
            rotation += rotdir ? event.movementX*0.25 : event.movementX*-0.25;
            
            // Ensure [0,360]
            axis = axis - Math.floor(axis/360.0)*360.0;
            rotation = rotation - Math.floor(rotation/360.0)*360.0;
        }
        else
        {
            pan[0] += event.movementX/(scale*60);
            pan[1] -= event.movementY/(scale*60);
        }
        
        draw();
    }
};

let handle_key_down = function ()
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
    else if (event.key === "a" || event.key === "A")
    {
        show_arr = !show_arr;
        draw();
    }
    else if (event.key === "c" || event.key === "C")
    {
        ++coli; if (coli >= 4) { coli = 0; }
        colour();
        draw();
    }
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) { proj = 0; }
        draw();
    }
    else if (event.key === "s" || event.key === "S")
    {
        window.alert("Visits:\n" + vis.join(', '));
    }
    else if (event.key === "F1")
    {
        axis     = 0;
        rotation = 0;
        rotdir   = true;
        scale    = 4;
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
let iclear = function ()
{
    multiplier_dom.value = multiplier;
    modulus_dom.value    = modulus;
    addsub_dom.value     = addsub;
    muldiv_dom.value     = muldiv;
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
    
    alpha_dom = document.getElementById('alpha');
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == alpha) { opts.selectedIndex = i; }
    }
    
    resize();
    make_circ();
    make_times();
    
    draw();
};

window.starter = starter;

window.set_alpha     = set_alpha;

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
