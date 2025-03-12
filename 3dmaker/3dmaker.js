
import { gl_init }          from "./gl_init.js";
import { shaders }          from "./shaders.js";
import { programs }         from "./programs.js";
import { m4, v3, quat, tr } from "./matvec.js";
import { obj }              from "./obj.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;


let bcol  = [0.1, 0.1, 0.1];
let lcol  = [1.0, 1.0, 1.0];
let colmode = 0;
let alpha   = 1.0;

let menu_hidden = false;

let proj = 0;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 2;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;


let camera = {
    pos   : [0, 0, 100],
    look  : [0, 0, -1],
    up    : [1, 0, 0],
    near  : 0.01,
    median: 30,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};


let progs = [
    
];
let P = null;
let P_dom = null;
let pres_dom = null;

let fetch_objfile = function (objfile, pl)
{
    let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function()
        {
            if (xhr.readyState === 4)
            {
                if (xhr.status === 200)
                {
                    let model_resp = obj.create(xhr.responseText, [0,0,0], 1, true, lcol);
                    
                    if (model_resp.tris.length > 0)
                    {
                        pl.tris = pl.tris.concat(model_resp.tris);
                    }
                    
                    if (model_resp.lines.length > 0)
                    {
                        pl.lines = pl.lines.concat(model_resp.lines);
                    }
                    
                    pl.makepath();
                    draw();
                }
                else
                {
                    errorlog("load error " + xhr.status);
                }
            }
        }
        xhr.open('GET', "../input/" + objfile, true);
        xhr.send(null);
};

class aeroplane {
    
    points = [];
    lines  = [];
    tris   = [];
    pbuf = null;
    lbuf = null;
    tbuf = null;
    
    constructor () {}
    
    makepath () {
        if (this.points.length > 0)
        {
            if (this.pbuf != null) { gl.deleteBuffer(this.pbuf); }
            this.pbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.pbuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.points), gl.DYNAMIC_DRAW);
        }
        if (this.lines.length > 0)
        {
            if (this.lbuf != null) { gl.deleteBuffer(this.lbuf); }
            this.lbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.lbuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.lines), gl.DYNAMIC_DRAW);
        }
        if (this.tris.length > 0)
        {
            if (this.tbuf != null) { gl.deleteBuffer(this.tbuf); }
            this.tbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tris), gl.DYNAMIC_DRAW);
        }
    }
    
    add_point (x,y,z) {
        this.points.push(x,y,z);
        this.points.push(lcol[0], lcol[1], lcol[2]);
        this.points.push(0,0,0);
    }
    add_line_point (x,y,z) {
        this.lines.push(x,y,z);
        this.lines.push(lcol[0], lcol[1], lcol[2]);
        this.lines.push(0,0,0);
    }
    add_tri_point (x,y,z, nx,ny,nz) {
        this.tris.push(x,y,z);
        this.tris.push(lcol[0], lcol[1], lcol[2]);
        this.tris.push(nx, ny, nz);
    }
    
    load (obj) {
        fetch_objfile(obj, this);
    }
    obj (str, o, sc) {
        let model_resp = obj.create(str, o, sc, true, lcol);
        
        this.tris  = this.tris.concat(model_resp.tris);
        this.lines = this.lines.concat(model_resp.lines);
    }
    
    setcol(r,g,b)
    {
        lcol[0] = r;
        lcol[1] = g;
        lcol[2] = b;
    }
    background(r,g,b)
    {
        bcol[0] = r;
        bcol[1] = g;
        bcol[2] = b;
    }
}
let T = null;


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



let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    gl.disable(gl.CULL_FACE);
    
    if (alpha < 0.98)
    {
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    else
    {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
    }
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    if (T.tris.length > 0)
    {
        gl.uniform1i (glprog.colmode, 1);
        gl.uniform3fv(glprog.defcol,  [0,0,0]);
        gl.uniform1f (glprog.alpha,   alpha);
    }
    else
    {
        gl.uniform1i (glprog.colmode, 0);
        gl.uniform3fv(glprog.defcol,  [0,0,0]);
        gl.uniform1f (glprog.alpha,   alpha);
    }
    
    if (T.points.length > 0)
    {
        gl.uniform1i(glprog.shaded, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, T.pbuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
        gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
        gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
            
        gl.drawArrays(gl.POINTS, 0, T.points.length / 9);
    }
    if (T.lines.length > 0)
    {
        gl.uniform1i(glprog.shaded, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, T.lbuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
        gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
        gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
            
        gl.drawArrays(gl.LINES, 0, T.lines.length / 9);
    }
    if (T.tris.length > 0)
    {
        gl.uniform1i(glprog.shaded,  1);
        gl.uniform1i(glprog.colmode, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, T.tbuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
        gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
        gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
            
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        gl.drawArrays(gl.TRIANGLES, 0, T.tris.length / 9);
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
let handle_key_down = function (event)
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
    else if (event.key === "i" || event.key === "I")
    {
        proj += 1;
        if (proj > 2) { proj = 0; }
        draw();
    }
    else if (event.key === "p" || event.key === "P")
    {
        T.showplane = !T.showplane;
        draw();
    }
    else if (event.key === "r" || event.key === "R")
    {
        run_prog();
        draw();
    }
    else if (event.key === "s" || event.key === "S")
    {
        save_obj();
    }
    else if (event.key === "w" || event.key === "W")
    {
        camera.pos   = [80, 80, 80];
        camera.look  = v3.normalize([-1, -1, -1]);
        camera.up    = v3.normalize([-1, -1,  2]);
        draw();
    }
    else if (event.key === "a" || event.key === "A")
    {
        camera.pos   = [-100, 0, 0];
        camera.look  = [ 1, 0, 0];
        camera.up    = [ 0, 0, 1];
        draw();
    }
    else if (event.key === "x" || event.key === "X")
    {
        camera.pos   = [ 0,100, 0];
        camera.look  = [ 0,-1, 0];
        camera.up    = [ 0, 0, 1];
        draw();
    }
    else if (event.key === "d" || event.key === "D")
    {
        camera.pos   = [ 0, 0,100];
        camera.look  = [ 0, 0,-1];
        camera.up    = [ 1, 0, 0];
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
        scale    = 2;
        draw();
    }
};

let errorlog = function (str)
{
    console.error('Error: ' + str);
    window.alert('Error:\n' + str);
};
let set_alpha = function (strval)
{
    alpha = parseFloat(strval);
    alpha_dom.blur();
};
let set_prog = function ()
{
    try
    {
        P = Function('T', P_dom.value);
    }
    catch (err)
    {
        errorlog(err.message);
        return false;
    }
    return true;
};
let set_pres = function (progname)
{
    let p = programs[progname];
    if (p !== undefined && p !== null)
    {
        P_dom.value = p;
    }
    pres_dom.blur();
};
let run_prog = function ()
{
    let succ = set_prog();
    if (!succ) return;
    
    try
    {
        P(T);
        T.makepath();
        draw();
    }
    catch (err)
    {
        errorlog(err.message);
        return;
    }
};
let clear_path = function ()
{
    T.points = [];
    T.lines  = [];
    T.tris   = [];
    //pbuf = null;
    //lbuf = null;
    //tbuf = null;
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

let handletab = function (ta_dom)
{
    ta_dom.addEventListener('keydown', (e) => {
        if (e.key === 'Tab')
        {
            e.preventDefault();
            let str = ta_dom.value;
            let start = ta_dom.selectionStart;
            let end   = ta_dom.selectionEnd;
            ta_dom.value = str.substring(0, start) + "    " + str.substring(end);
            ta_dom.selectionEnd = end-(end-start)+4;
        }
    });
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id, {preserveDrawingBuffer: true, antialias: false});
    
    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);
    
    glprog.pos  = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    glprog.col  = gl.getAttribLocation(glprog.bin, "col");
    gl.enableVertexAttribArray(glprog.col);
    glprog.norm = gl.getAttribLocation(glprog.bin, "norm");
    gl.enableVertexAttribArray(glprog.norm);
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");
    glprog.colmode = gl.getUniformLocation(glprog.bin, "colmode");
    glprog.shaded  = gl.getUniformLocation(glprog.bin, "shaded");
    glprog.defcol  = gl.getUniformLocation(glprog.bin, "defcol");
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel", handle_wheel);
    
    pres_dom = document.getElementById('presin');
    pres_dom.options.selectedIndex = 0;
    P_dom = document.getElementById('progin');
    handletab(P_dom);
    P_dom.value = programs["sph_spiral"];
    set_prog();
    
    resize();
    
    T = new aeroplane();
    
    draw();
};


window.set_alpha = set_alpha;
window.set_prog  = set_prog;
window.set_pres  = set_pres;
window.run_prog  = run_prog;
window.clear_path = clear_path;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });

