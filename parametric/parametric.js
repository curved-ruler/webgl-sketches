
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let Nu = 64;
let Nv = 64;
let Nudom = null;
let Nvdom = null;

let fta = null;
let start_func = shaders['shell'];
let menu_hidden = false;

let model  = { verts:[], faces:[], lines:[] };
let vrtbuf = null;
let tribuf = null;
let linbuf = null;

let bcol  = [0.0, 0.0, 0.0];
let wcol  = [1.0, 1.0, 1.0];

let col  = 0;
let obj  = 0;
let proj = 1;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 1;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;


let a = 1 / Math.sqrt(6);
let camera = {
    pos   : [5, 5, 5],
    look  : v3.normalize([-1, -1, -1]),
    up    : [-a, -a, 2*a],
    near  : 0.1,
    median: 10,
    far   : 1000,
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


let make_object = function ()
{
    model.verts = [...Array((Nu)*(Nv) * 2)];
    model.faces = [...Array(2*(Nu-1)*(Nv-1) * 3)];
    model.lines = [...Array(2*(Nu-1)*(Nv-1) * 2)];
    
    for (let vi = 0 ; vi<Nv ; ++vi)
    {
        for (let ui = 0 ; ui<Nu ; ++ui)
        {
            //model.verts[(vi*Nu + ui)*2 + 0] = ui / (Nu-1);
            //model.verts[(vi*Nu + ui)*2 + 1] = vi / (Nv-1);
            
            model.verts[(vi*Nu + ui)*2 + 0] = ui / (Nu-1);
            model.verts[(vi*Nu + ui)*2 + 1] = vi / (Nv-1);
        }
    }
    
    for (let vi = 0 ; vi<Nv-1 ; ++vi)
    {
        for (let ui = 0 ; ui<Nu-1 ; ++ui)
        {
            model.faces[(vi*Nu + ui)*6 + 0] = vi*Nu     + ui;
            model.faces[(vi*Nu + ui)*6 + 1] = (vi+1)*Nu + ui;
            model.faces[(vi*Nu + ui)*6 + 2] = vi*Nu     + ui+1;
            model.faces[(vi*Nu + ui)*6 + 3] = (vi+1)*Nu + ui;
            model.faces[(vi*Nu + ui)*6 + 4] = (vi+1)*Nu + ui+1;
            model.faces[(vi*Nu + ui)*6 + 5] = vi*Nu     + ui+1;
            
            model.lines[(vi*Nu + ui)*4 + 0] = vi*Nu     + ui;
            model.lines[(vi*Nu + ui)*4 + 1] = vi*Nu     + ui+1;
            model.lines[(vi*Nu + ui)*4 + 2] = vi*Nu     + ui;
            model.lines[(vi*Nu + ui)*4 + 3] = (vi+1)*Nu + ui;
        }
    }
    
    for (let vi = 0 ; vi<Nv-1 ; ++vi)
    {
        model.lines.push(vi*Nu     + Nu-1);
        model.lines.push((vi+1)*Nu + Nu-1);
    }
    for (let ui = 0 ; ui<Nu-1 ; ++ui)
    {
        model.lines.push((Nv-1)*Nu     + ui);
        model.lines.push((Nv-1)*Nu     + ui+1);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tribuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model.faces), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model.lines), gl.STATIC_DRAW);
    
    console.log("V", model.verts.length, "T", model.faces.length);
};

let draw = function ()
{
    if (!gl || !glprog.bin) return;
    if (model.verts.length < 1) return;
    
    gl.useProgram(glprog.bin);
    
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);

    //gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //gl.disable(gl.DEPTH_TEST);
    if (col === 0)
    {
        gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    }
    else
    {
        gl.clearColor(wcol[0], wcol[1], wcol[2], 1.0);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    if (col === 0)
    {
        gl.uniform3fv(glprog.col, wcol);
    }
    else
    {
        gl.uniform3fv(glprog.col, bcol);
    }

    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.vertexAttribPointer(glprog.uv, 2, gl.FLOAT, false, 0*4, 0*4);
    
    if (obj % 2 === 0)
    {
        gl.drawArrays(gl.POINTS, 0, model.verts.length/2);
    }
    else
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
        gl.drawElements(gl.LINES, model.lines.length, gl.UNSIGNED_INT, 0);
    }
    
    if (obj > 1)
    {
        if (col === 0)
        {
            gl.uniform3fv(glprog.col, bcol);
        }
        else
        {
            gl.uniform3fv(glprog.col, wcol);
        }
        
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tribuf);
        gl.drawElements(gl.TRIANGLES, model.faces.length, gl.UNSIGNED_INT, 0);
        gl.disable(gl.POLYGON_OFFSET_FILL);
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
    if (document.activeElement === fta) { return; }
    
    
    
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
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) { proj = 0; }
        draw();
    }
    else if (event.key === "o" || event.key === "O")
    {
        ++obj;
        if (obj > 3) { obj = 0; }
        draw();
    }
    else if (event.key === "c" || event.key === "C")
    {
        ++col;
        if (col > 1) { col = 0; }
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

let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    camera.aspect = cwidth / cheight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let create_shader = function ()
{
    glprog = gl_init.create_glprog(
        gl,
        shaders.version + shaders.vs.replace('$FUNC$', start_func),
        shaders.version + shaders.precision + shaders.fs);
    
    glprog.uv = gl.getAttribLocation(glprog.bin, "uv");
    gl.enableVertexAttribArray(glprog.uv);
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.col     = gl.getUniformLocation(glprog.bin, "col");
};
let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id);
    vrtbuf = gl.createBuffer();
    tribuf = gl.createBuffer();
    linbuf = gl.createBuffer();
    
    create_shader();
};

let set_ui = function ()
{
    fta.value = start_func;
    
    Nudom.value = Nu;
    Nvdom.value = Nv;
};
let set_params = function ()
{
    let nu2 = parseInt(Nudom.value);
    let nv2 = parseInt(Nvdom.value);
    
    if (isNaN(nu2) || nu2 === undefined || nu2 === null) return;
    if (isNaN(nv2) || nv2 === undefined || nv2 === null) return;
    
    if (nu2 < 2 || nu2 > 512 || nv2 < 2 || nv2 > 512) return;
    
    Nu = nu2;
    Nv = nv2;
    make_object();
    draw();
};
let setf  = function ()
{
    start_func = fta.value;
    create_shader();
    draw();
};
let preset = function (opt)
{
    start_func = shaders[opt];
    set_ui();
    create_shader();
    draw();
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    fta    = document.getElementById('func');
    Nudom  = document.getElementById('nuin');
    Nvdom  = document.getElementById('nvin');
    
    document.getElementById('pres').options.selectedIndex = 0;
    
    set_ui();
    gpu_init('canvas');
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    resize();
    make_object();
    draw();
};

window.preset = preset;
window.set_params = set_params;
window.setf   = setf;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
