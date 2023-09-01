
import { saveAs } from './FileSaver.js';

import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let model  = { verts:[], lines:[] };
let vrtbuf = null;
let linbuf = null;
let draw_pts   = true;
let draw_lines = true;

//let step_n = 1000;
let steptype = "fixed";
let N    = 5;
let dpos = 0.5;
let pos1 = [];
let pos2 = [];

let initpos = "rnd";

let click = "NOP";

let bcol  = [0.2, 0.2, 0.2];
let lcol  = [0.5, 0.3, 0.0];
let alpha = 0.3;
//let alpha_dom = null;
let ip_dom = null;
let cb_dom = null;
let st_dom = null;
let nn_dom = null;
let dd_dom = null;

let menu_hidden = false;

let proj = 0;
let projmat, modlmat, viewmat;
let modinvmat;
let scale    = 0.1;
/*
let axis     = 0;
let rotation = 0;
let rotdir   = true;
*/
let trans = [0,0,0];
let grabbed  = -1;
let drag = 0;


let camera = {
    pos   : [0, 0, -20],
    look  : [0, 0,   1],
    up    : [0, 1,   0],
    near  : 0.1,
    median: 2,
    far   : 100,
    fovy  : Math.PI / 3,
    aspect: 1
};
let compute_matrices = function ()
{
    //modlmat = tr.rotz(rotation);
    //modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis), modlmat);
    modlmat = tr.translate(trans);
    modlmat = m4.mul(tr.scale(scale), modlmat);
    
    modinvmat = tr.scale(1/scale);
    modinvmat = m4.mul(tr.translate([-trans[0], -trans[1], 0]), modinvmat);
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


let init_pos_r = function ()
{
    pos1 = [...Array(N*3)];
    pos2 = [...Array(N*3)];
    
    for (let i=0 ; i<N ; ++i)
    {
        let a = Math.random() * 10 - 5;
        let b = Math.random() * 10 - 5;
        pos1[3*i    ] = a;
        pos1[3*i + 1] = b;
        pos1[3*i + 2] = 0;
    }
};
let init_pos_sq4 = function ()
{
    nn = 4;
    
    pos1 = [...Array(nn*3)];
    pos2 = [...Array(nn*3)];
    
    pos1[0] =  5;
    pos1[1] =  5;
    pos1[2] =  0;
    
    pos1[3] = -5;
    pos1[4] =  5;
    pos1[5] =  0;
    
    pos1[6] = -5;
    pos1[7] = -5;
    pos1[8] =  0;
    
    pos1[9]  =  5;
    pos1[10] = -5;
    pos1[11] =  0;
};
let init_pos_sq = function ()
{
    let nn = Math.floor(N/4);
    let d = 10/nn;

    pos1 = [];
    pos2 = [];

    for (let i=0 ; i<nn ; ++i)
    {
        pos1.push(5 - i*d, 5, 0);
    }
    for (let i=0 ; i<nn ; ++i)
    {
        pos1.push(-5, 5 - i*d, 0);
    }
    for (let i=0 ; i<nn ; ++i)
    {
        pos1.push(-5 + i*d, -5, 0);
    }
    for (let i=0 ; i<nn ; ++i)
    {
        pos1.push(5, -5 + i*d, 0);
    }
};
let init_pos_2sq = function ()
{
    pos1 = [...Array(3*N*6)];
    pos2 = [...Array(3*N*6)];
    
    for (let i=0 ; i<N ; ++i)
    {
        pos1[i*6 + 0] = N/2 - i;
        pos1[i*6 + 1] = N/2;
        pos1[i*6 + 2] = 0;
        
        pos1[i*6 + 3] = -N/4;
        pos1[i*6 + 4] =  N/4 - i/2;
        pos1[i*6 + 5] = 0;
    }
    for (let i=0 ; i<N ; ++i)
    {
        pos1[i*6 + N*6 + 0] = -N/2;
        pos1[i*6 + N*6 + 1] =  N/2 - i;
        pos1[i*6 + N*6 + 2] = 0;
        
        pos1[i*6 + N*6 + 3] = -N/4 + i/2;
        pos1[i*6 + N*6 + 4] = -N/4;
        pos1[i*6 + N*6 + 5] = 0;
    }
    for (let i=0 ; i<N ; ++i)
    {
        pos1[i*6 + 2*N*6 + 0] = -N/2 + i;
        pos1[i*6 + 2*N*6 + 1] = -N/2;
        pos1[i*6 + 2*N*6 + 2] = 0;
        
        pos1[i*6 + 2*N*6 + 3] =  N/4;
        pos1[i*6 + 2*N*6 + 4] = -N/4 + i/2;
        pos1[i*6 + 2*N*6 + 5] = 0;
    }
    /*
    for (let i=0 ; i<N ; ++i)
    {
        pos1[i*6 + 3*N*6 + 0] =  N/2;
        pos1[i*6 + 3*N*6 + 1] = -N/2 + i;
        pos1[i*6 + 3*N*6 + 2] = 0;
        
        pos1[i*6 + 3*N*6 + 3] = N/4 - i/2;
        pos1[i*6 + 3*N*6 + 4] = N/4;
        pos1[i*6 + 3*N*6 + 5] = 0;
    }*/

    console.log("P", pos1);
};
let init_pos_circ = function ()
{
    pos1 = [];
    pos2 = [];

    for (let i=0 ; i<N ; ++i)
    {
        pos1.push(5*Math.cos(2*Math.PI*i/N), 5*Math.sin(2*Math.PI*i/N), 0);
    }
};
let init_pos_circ2 = function ()
{
    pos1 = [];
    pos2 = [];

    pos1.push(0, 0, 0);
    for (let i=0 ; i<N ; ++i)
    {
        pos1.push(5*Math.cos(2*Math.PI*i/N), 5*Math.sin(2*Math.PI*i/N), 0);
    }
};

let init_pos = function()
{
    model.lines = [];
    model.verts = [];
    pos1 = [];
    pos2 = [];

    if      (initpos === "rnd")   { init_pos_r(); }
    else if (initpos === "sq4")   { init_pos_sq4(); }
    else if (initpos === "sq")    { init_pos_sq(); }
    else if (initpos === "circ")  { init_pos_circ(); }
    else if (initpos === "circ2") { init_pos_circ2(); }
    else if (initpos === "2sq")   { init_pos_2sq(); }
}

let step = function ()
{
    let nn = pos1.length/3;
    //console.log("N", nn);
    if (nn < 2) return;

    for (let i=0 ; i<nn ; ++i)
    {
        pos2[3*i    ] = pos1[3*i    ];
        pos2[3*i + 1] = pos1[3*i + 1];
        pos2[3*i + 2] = pos1[3*i + 2];
    }
    for (let i=0 ; i<nn ; ++i)
    {
        let j = (i < nn-1) ? i+1 : 0;
        
        let v = [pos2[3*(j)    ] - pos2[3*(i)    ],
                 pos2[3*(j) + 1] - pos2[3*(i) + 1],
                 pos2[3*(j) + 2] - pos2[3*(i) + 2]];
        
        let v2    = v3.normalize(v);
        let vlen  = v3.length(v);
        let d = 1.0;

        switch (steptype)
        {
            case "fixed":
                pos1[3*i    ] = pos2[3*i    ] + dpos * v2[0];
                pos1[3*i + 1] = pos2[3*i + 1] + dpos * v2[1];
                pos1[3*i + 2] = pos2[3*i + 2] + dpos * v2[2];
                break;

            case "prop":
                pos1[3*i    ] = pos2[3*i    ] + dpos * v[0];
                pos1[3*i + 1] = pos2[3*i + 1] + dpos * v[1];
                pos1[3*i + 2] = pos2[3*i + 2] + dpos * v[2];
                break;

            case "fixm":
                if (dpos >  vlen) d = 1.0/vlen;
                if (dpos < -vlen) d = 1.0/vlen;
                pos1[3*i    ] = pos2[3*i    ] + dpos*d * v2[0];
                pos1[3*i + 1] = pos2[3*i + 1] + dpos*d * v2[1];
                pos1[3*i + 2] = pos2[3*i + 2] + dpos*d * v2[2];
                d = 1.0;
                break;

            case "fixs":
                if (dpos >  vlen || dpos < -vlen) continue;
                pos1[3*i    ] = pos2[3*i    ] + dpos * v2[0];
                pos1[3*i + 1] = pos2[3*i + 1] + dpos * v2[1];
                pos1[3*i + 2] = pos2[3*i + 2] + dpos * v2[2];
                break;

            default:
                console.log("ERR step: " + steptype);
                return;
        }
        
        model.lines.push(pos2[3*i    ]);
        model.lines.push(pos2[3*i + 1]);
        model.lines.push(pos2[3*i + 2]);
        
        model.lines.push(pos1[3*i    ]);
        model.lines.push(pos1[3*i + 1]);
        model.lines.push(pos1[3*i + 2]);
    }

    make_object();
};

let save_obj = function ()
{
    let objstring = "\n";
    let vn = model.lines.length / 6;

    for (let i=0 ; i<vn ; ++i)
    {
        objstring += "v " + model.lines[i*6 + 0] + " " + model.lines[i*6 + 1] + " " + model.lines[i*6 + 2] + "\n";
        objstring += "v " + model.lines[i*6 + 3] + " " + model.lines[i*6 + 4] + " " + model.lines[i*6 + 5] + "\n";
        objstring += "l -1 -2 \n";
    }

    objstring += "\n";

    var blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'bugs.obj');
    //navigator.clipboard.writeText(objstring);
    //console.log(objstring);
};

let make_object = function ()
{
    model.verts = [];
    let nn = pos1.length/3;
    for (let i=0 ; i<nn ; ++i)
    {
        model.verts.push(pos1[3*i], pos1[3*i+1], pos1[3*i+2]);
    }

    if (model.verts.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts), gl.STATIC_DRAW);
    }
    
    if (model.lines.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.lines), gl.STATIC_DRAW);
    }
    
    //console.log("V", model.verts.length, "L", model.lines.length);
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
    gl.uniform3fv(glprog.col, lcol);
    
    if (draw_pts && model.verts.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 0*4, 0*4);
        gl.drawArrays(gl.POINTS, 0, model.verts.length / 3);
    }
    
    if (draw_lines && model.lines.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 0*4, 0*4);
        gl.drawArrays(gl.LINES, 0, model.lines.length / 3);
    }
};

var ray_zero_plane = function (p, v)
{
    //var z = v3.mmul(modlmat, [0,0,1]);
    //var vv = v3.mmul(modlmat, v);
    //var pp = v3.mmul(modlmat, p);
    var lambda = -(p[2]) / (v[2]);

    return v3.mmul(modinvmat, v3.add(p, v3.cmul(v, lambda)));
    //return v3.mmul(modlmat, v3.add(p, v3.cmul(v, lambda)));
}
var mouse_pointer = function (event)
{
    var rect = canvas.getBoundingClientRect();
    var cw2  = cwidth/2;
    var ch2  = cheight/2;

    var x = (           event.clientX - rect.left  - cw2) / ch2; // [-asp,asp] >
    var y = (cheight - (event.clientY - rect.top)  - ch2) / ch2; // [ -1,  1]  ^

    x *= -Math.tan(camera.fovy / 2 ) * camera.median;
    y *=  Math.tan(camera.fovy / 2 ) * camera.median;

    return v3.mmul(modinvmat, [x,y,0]);
};
var grab = function (p, eps)
{
    grabbed = -1;

    let nn = pos1.length/3;
    for (var i=0 ; i<nn ; ++i)
    {
        if (v3.length([pos1[3*i] - p[0], pos1[3*i+1] - p[1], 0]) < eps)
        {
            grabbed = i;
            return;
        }
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
    if (event.button === 1)
    {
        drag = 1;
    }
    else if (event.button === 0)
    {
        let v = mouse_pointer(event);

        if (click === "ADD")
        {
            pos2 = [];
            pos1.push(v[0], v[1], 0);

            make_object();
            draw();
        }
        else if (click === "MOV")
        {
            grab(mouse_pointer(event), 0.02/scale);
        }
        else if (click === "DEL")
        {
            grab(mouse_pointer(event), 0.02/scale);
            if (grabbed >= 0)
            {
                pos2 = [];
                pos1.splice(grabbed*3, 3);
            }
            grabbed = -1;
            make_object();
            draw();
        }
    }


    //rotdir = (axis < 90) || (axis > 270);
};
let handle_mouse_up = function (event)
{
    grabbed = -1;
    drag    =  0;
};

let handle_mouse_move = function (event)
{
    if (drag === 1)
    {
        /*
        axis -= event.movementY*0.25;
        rotation += rotdir ? event.movementX*0.25 : event.movementX*-0.25;
        
        // Ensure [0,360]
        axis = axis - Math.floor(axis/360.0)*360.0;
        rotation = rotation - Math.floor(rotation/360.0)*360.0;
        */
        trans[0] -= event.movementX*0.002/scale;
        trans[1] -= event.movementY*0.002/scale;
        draw();
    }
    else if (grabbed >= 0)
    {
        let x = mouse_pointer(event);
        pos1[grabbed*3 + 0] = x[0];
        pos1[grabbed*3 + 1] = x[1];
        make_object();
        draw();
    }
};
let handle_key_down = function (event)
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
    else if (event.key === "s" || event.key === "S")
    {
        step();
        make_object();
        draw();
    }
    else if (event.key === "o" || event.key === "O")
    {
        save_obj();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    else if (event.key === "Enter")
    {
        scale = 0.1;
        trans = [0,0,0];
        draw();
    }
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
let set_start = function (strval)
{
    initpos = strval;
    ip_dom.blur();
    init_pos();
    make_object();
    draw();
};
let set_step = function (strval)
{
    steptype = strval;
};
let set_stepsz = function (strval)
{
    let d = parseFloat(strval);
    if (d !== Infinity && !isNaN(d))
    {
        dpos = d;
    }
};
let set_n = function (strval)
{
    let nn = parseInt(strval);
    if (nn !== Infinity && !isNaN(nn))
    {
        if (nn > 1) N = nn;
    }
    //console.log("N", N);
};
let toggle_click = function ()
{
    if      (click === "NOP") click = "ADD";
    else if (click === "ADD") click = "MOV";
    else if (click === "MOV") click = "DEL";
    else                      click = "NOP";

    cb_dom.innerHTML = click;
};

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
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.col     = gl.getUniformLocation(glprog.bin, "col");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    vrtbuf = gl.createBuffer();
    linbuf = gl.createBuffer();
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    //gl.clearDepth(1); = default
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);

    ip_dom = document.getElementById('start');
    st_dom = document.getElementById('step');
    nn_dom = document.getElementById('nn');
    dd_dom = document.getElementById('stepsz');
    cb_dom = document.getElementById('clickb');
    //console.log("B", cb_dom);

    ip_dom.options.selectedIndex = 0;
    st_dom.options.selectedIndex = 0;
    nn_dom.value = "" + N;
    dd_dom.value = "" + dpos;
    cb_dom.innerHTML = click;

    
    resize();
    init_pos();
    //for (let i=0 ; i<step_n ; ++i) step();
    make_object();
    draw();
};


window.set_alpha  = set_alpha;
window.set_start  = set_start;
window.set_step   = set_step;
window.set_stepsz = set_stepsz;
window.set_n      = set_n;

window.toggle_click = toggle_click;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
