
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

//https://math.stackexchange.com/questions/69303/is-the-maximal-temperature-of-the-curlicue-fractal-acheived-by-e-times-gamma

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let model  = { verts:[], lines:[] };
let spiral = [];
let vrtbuf = null;
let linbuf = null;

let cols  = [0, 0, 0,   1, 1, 1,
             1, 1, 1,   0, 0, 0];
let curr_col = 0;
let alpha    = 1.0;
let alpha_dom = null;

let menu_hidden = false;

let proj = 0;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 1;
let pan      = [0,0];
let grabbed  = 0;

let P_dom = null;
let Presets = [
    `\
return {
    N  : 2000,
    Fi : [ 0, 100],
    dFi: [42,  20],
    R  : (i) => (1)
};`
];

let camera = {
    pos   : [ 0,  0,  10 ],
    look  : [ 0,  0,  -1 ],
    up    : [ 0,  1,   0 ],
    near  : 0.1,
    median: 10,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};


let compute_matrices = function ()
{
    modlmat = m4.init();
    modlmat = m4.mul(tr.translate([pan[0],pan[1],0]), modlmat);
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


let make_object = function ()
{
    //model.verts = [];
    model.lines = [];

    let dtor = Math.PI / 180;

    let v0  = [0,0,0];
    let v1  = [0,0,0];
    
    
    let PF = null;
    let Params = {};
    try
    {
        let Pstr = P_dom.value;
        PF = Function(Pstr);
    }
    catch (err)
    {
        console.error("Func error!", err.message);
        alert(err.message);
        return;
    }
    try
    {
        Params = PF();
    }
    catch (err)
    {
        console.error("Func error!", err.message);
        alert(err.message);
        return;
    }
    

    for (let i=0 ; i<Params.N ; ++i)
    {
        let ii = i % Params.Fi.length;
        let R  = Params.R(i);
        v1[0] = v0[0] + R*Math.cos(Params.Fi[ii]*dtor);
        v1[1] = v0[1] + R*Math.sin(Params.Fi[ii]*dtor);
        //v1[2] =

        model.lines.push(v0[0], v0[1], v0[2]);
        model.lines.push(v1[0], v1[1], v1[2]);

        v0[0] = v1[0];
        v0[1] = v1[1];
        //v0[2] = v1[2];

        Params.Fi[ii] += Params.dFi[ii];
    }
    

    //vrtbuf = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts), gl.STATIC_DRAW);
    
    linbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.lines), gl.STATIC_DRAW);
    
    //console.log("V", model.verts.length, "T", model.faces.length, "L", model.lines.length);
    console.log("V", model.verts.length, "L", model.lines.length);
};

let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    if (alpha < 0.99)
    {
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    else
    {
        gl.disable(gl.BLEND);
        //gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.DEPTH_TEST);
    }
    
    gl.clearColor(cols[curr_col*6], cols[curr_col*6+1], cols[curr_col*6+2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    gl.uniform1f(glprog.alpha, alpha);
    
    if (model.lines.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        //gl.lineWidth(20.0); wtf
        gl.uniform3fv(glprog.col, [ cols[curr_col*6+3], cols[curr_col*6+4], cols[curr_col*6+5] ]);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 0*4, 0*4);
        gl.drawArrays(gl.LINES, 0, model.lines.length/3);
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
    //rotdir = (axis < 90) || (axis > 270);
};
let handle_mouse_up = function (event)
{
    grabbed = 0;
};

let handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        /*
        axis -= event.movementY*0.25;
        rotation += rotdir ? event.movementX*0.25 : event.movementX*-0.25;
        
        // Ensure [0,360]
        axis = axis - Math.floor(axis/360.0)*360.0;
        rotation = rotation - Math.floor(rotation/360.0)*360.0;
        */

        pan[0] += event.movementX*0.02/scale;
        pan[1] -= event.movementY*0.02/scale;

        draw();
    }
};
let handle_key_down = function ()
{
    if (document.activeElement === P_dom) { return; }
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
    if (event.key === "c" || event.key === "C")
    {
        curr_col += 1;
        if (curr_col >= cols.length/6) { curr_col = 0; }
        draw();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    else if (event.key === "Enter")
    {
        scale    = 1;
        pan = [ 0,  0 ];
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
    gl = gl_init.get_webgl2_context(canvas_id, {preserveDrawingBuffer: true, antialias: false});
    
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
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    P_dom       = document.getElementById('params');
    P_dom.value = Presets[0];
    
    alpha_dom = document.getElementById('alpha');
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == alpha) { opts.selectedIndex = i; }
    }
    
    resize();
    make_object();
    draw();
};

window.set_params = function() { make_object();; draw(); }
window.set_alpha  = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
