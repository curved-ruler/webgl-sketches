
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let model  = { verts:[], lines:[] };
let sphere   = [];
let sphere_n = 600;
let disk_n   = 40;
let vrtbuf = null;
let linbuf = null;
let vbase = [0,0,0];

let coordlen = 20;
let coordm   = [];
let coordbuf = null;
let draw_coords = true;

let bcol  = [0.85, 0.85, 0.05];
let dcol  = [0.01, 0.01, 0.85];
let alpha = 1.0;
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

/*
let camera = {
    pos   : [ 0,  0,  10 ],
    look  : [ 0,  0, -10 ],
    up    : [ 0,  1,   0 ],
    near  : 0.1,
    median: 10,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};
*/
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
    modlmat = tr.rotz(rotation / 180*Math.PI);
    modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis / 180*Math.PI), modlmat);
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

let sample_sphere = function ()
{
    sphere = [...Array(sphere_n*3)];

    let phi = Math.PI * (Math.sqrt(5.0) - 1.0);

    for (let i=0 ; i<sphere_n ; ++i)
    {
        let y = 1.0 - (i / (sphere_n - 1.0)) * 2.0; // # y goes from 1 to -1
        let radius = Math.sqrt(1 - y * y); // # radius at y

        let theta = phi * i; // # golden angle increment

        let x = Math.cos(theta) * radius;
        let z = Math.sin(theta) * radius;

        sphere[i*3 + 0] = x;
        sphere[i*3 + 1] = y;
        sphere[i*3 + 2] = z;
    }
};
let make_object = function ()
{
    //model.verts = [];
    model.lines = [];

    let v0 = [0,0,1];
    let rr = 0.2;
    let rrd = 0.07;

    sample_sphere();

    model.lines.push(0, 0, 0);
    model.lines.push(vbase[0], vbase[1], vbase[2]);

    for (let i=0 ; i<sphere_n ; ++i)
    {
        let v = [ sphere[i*3 + 0], sphere[i*3 + 1], sphere[i*3 + 2] ];
        let a = Math.acos(v[2]);
        let mr = m4.init();
        if (v[2] < 0.99)
        {
            if (v[2] > -0.99) mr = tr.rot(v3.normalize(v3.cross(v0, v)), a);
            else              mr = tr.rot([1, 0, 0], a);
        }

        model.lines.push(vbase[0], vbase[1], vbase[2]);
        model.lines.push(v[0]+vbase[0], v[1]+vbase[1], v[2]+vbase[2]);

        for (let j=0 ; j<disk_n ; ++j)
        {
            let vv = [rr*Math.sin(2*Math.PI*j/disk_n), rr*Math.cos(2*Math.PI*j/disk_n), rrd];
            vv = v3.mmul(mr, vv);

            model.lines.push(v[0]+vbase[0], v[1]+vbase[1], v[2]+vbase[2]);
            model.lines.push(vv[0]+v[0]+vbase[0], vv[1]+v[1]+vbase[1], vv[2]+v[2]+vbase[2]);
        }
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
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    else
    {
        gl.disable(gl.BLEND);
    }
    gl.enable(gl.DEPTH_TEST);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    gl.uniform1f(glprog.alpha, alpha);
    
    //gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    //gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 0*4, 0*4);
    //gl.uniform3fv(glprog.col, dcol);
    //gl.drawArrays(gl.POINTS, 0, model.verts.length/3);
    
    if (model.lines.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        //gl.lineWidth(20.0); wtf
        gl.uniform3fv(glprog.col, dcol);
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
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    //gl.clearDepth(1); = default
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    alpha_dom = document.getElementById('alpha');
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == 0.5) { opts.selectedIndex = i; }
    }
    
    resize();
    make_object();
    draw();
    
    console.log("lookup", v3.dot(camera.look, camera.up), v3.length(camera.up));
    
    //let m1 = [1,0,0,0,  1,0,0,0,  1,0,0,0,  0,0,0,1];
    //console.log(m4.mul(m1, m1));
};


window.set_alpha = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
