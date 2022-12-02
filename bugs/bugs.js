
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
let draw_pts   = false;
let draw_lines = true;

let step_n = 8000;
let N    = 100;
let dpos = 0.03;
let pos1 = [];
let pos2 = [];

let bcol  = [0.2, 0.2, 0.2];
let tcol  = [0.0, 0.0, 0.0];
let lcol  = [0.5, 0.3, 0.0];
let alpha = 0.3;
let alpha_dom = null;

let menu_hidden = false;

let proj = 0;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 1;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;


let camera = {
    pos   : [0, 0, -20],
    look  : [0, 0,   1],
    up    : [0, 1,   0],
    near  : 0.1,
    median: 1,
    far   : 100,
    fovy  : Math.PI / 3,
    aspect: 1
};
let compute_matrices = function ()
{
    modlmat = tr.rotz(rotation);
    modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis), modlmat);
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


let init_pos_r = function ()
{
    model.lines = [];
    pos1 = [...Array(N*3)];
    pos2 = [...Array(N*3)];
    
    for (let i=0 ; i<N ; ++i)
    {
        let a = Math.random() * 20 - 10;
        let b = Math.random() * 20 - 10;
        pos1[3*i    ] = a;
        pos1[3*i + 1] = b;
        pos1[3*i + 2] = 0;
    }
};
let init_pos_sq = function ()
{
    N = 4;
    
    model.lines = [];
    pos1 = [...Array(N*3)];
    pos2 = [...Array(N*3)];
    
    pos1[0] = 20;
    pos1[1] = 20;
    pos1[2] = 0;
    
    pos1[3] = -20;
    pos1[4] =  20;
    pos1[5] = 0;
    
    pos1[6] = -20;
    pos1[7] = -20;
    pos1[8] = 0;
    
    pos1[9]  =  20;
    pos1[10] = -20;
    pos1[11] = 0;
};
let init_pos = function ()
{
    N = 40;
    
    model.lines = [];
    pos1 = [...Array(N*3)];
    pos2 = [...Array(N*3)];
    
    for (let i=0 ; i<10 ; ++i)
    {
        pos1[i*3 + 0] = 20 - i*4;
        pos1[i*3 + 1] = 20;
        pos1[i*3 + 2] = 0;
    }
    for (let i=0 ; i<10 ; ++i)
    {
        pos1[i*3 + 30] = -20;
        pos1[i*3 + 31] =  20 - i*4;
        pos1[i*3 + 32] = 0;
    }
    for (let i=0 ; i<10 ; ++i)
    {
        pos1[i*3 + 60] = -20 + i*4;
        pos1[i*3 + 61] = -20;
        pos1[i*3 + 62] = 0;
    }
    for (let i=0 ; i<10 ; ++i)
    {
        pos1[i*3 + 90]  =  20;
        pos1[i*3 + 91] = -20 + i*4;
        pos1[i*3 + 92] = 0;
    }
};
let step = function ()
{
    for (let i=0 ; i<N ; ++i)
    {
        pos2[3*i    ] = pos1[3*i    ];
        pos2[3*i + 1] = pos1[3*i + 1];
        pos2[3*i + 2] = pos1[3*i + 2];
    }
    for (let i=0 ; i<N ; ++i)
    {
        let j = (i < N-1) ? i+1 : 0;
        
        let v = [pos2[3*(j)    ] - pos2[3*(i)    ],
                 pos2[3*(j) + 1] - pos2[3*(i) + 1],
                 pos2[3*(j) + 2] - pos2[3*(i) + 2]];
        
        let d = v3.length(v);
        if (d < dpos) continue;
        
        pos1[3*i    ] = pos2[3*i    ] + dpos/d * v[0];
        pos1[3*i + 1] = pos2[3*i + 1] + dpos/d * v[1];
        pos1[3*i + 2] = pos2[3*i + 2] + dpos/d * v[2];
        
        model.lines.push(pos2[3*i    ]);
        model.lines.push(pos2[3*i + 1]);
        model.lines.push(pos2[3*i + 2]);
        
        model.lines.push(pos1[3*i    ]);
        model.lines.push(pos1[3*i + 1]);
        model.lines.push(pos1[3*i + 2]);
    }
};

let make_object = function ()
{
    if (model.verts.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts), gl.STATIC_DRAW);
    }
    
    if (model.lines.length > 0)
    {
        //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
        //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model.lines), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.lines), gl.STATIC_DRAW);
    }
    
    console.log("V", model.verts.length, "L", model.lines.length);
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
        axis -= event.movementY*0.25;
        rotation += rotdir ? event.movementX*0.25 : event.movementX*-0.25;
        
        // Ensure [0,360]
        axis = axis - Math.floor(axis/360.0)*360.0;
        rotation = rotation - Math.floor(rotation/360.0)*360.0;
        
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
    else if (event.key === "h" || event.key === "H")
    {
        draw_coords = !draw_coords;
        draw();
    }
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) { proj = 0; }
        draw();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    else if (event.key === "Enter")
    {
        axis     = 0;
        rotation = 0;
        rotdir   = true;
        scale    = 1;
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
    /*
    alpha_dom = document.getElementById('alpha');
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == 0.5) { opts.selectedIndex = i; }
    }
    */
    
    resize();
    init_pos();
    for (let i=0 ; i<step_n ; ++i) step();
    make_object();
    draw();
};


window.set_alpha = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
