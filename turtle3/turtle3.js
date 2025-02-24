
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
let lcol  = [0.243161, 0.887797, 1.000000];
let colmode = 0;
let alpha   = 1.0;
let alpha_dom = null;
let bcol_dom  = null;
let lcol_dom  = null;

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

class aeroplane {
    oldpos = [0, 0, 0];
    pos    = [0, 0, 0];
    orient = [1, 0, 0, 0];
    
    model = { name : '../input/obj3/plane03b-lines.obj', tlen:0, llen:0, plen:0, tbuf:null, lbuf:null, pbuf:null };
    showplane = true;
    
    pen = true;
    path = [];
    pathbuf = null;
    
    constructor () {}
    
    addpath () {
        this.path.push(this.oldpos[0], this.oldpos[1], this.oldpos[2]);
        this.path.push(lcol[0], lcol[1], lcol[2]);
        
        this.path.push(this.pos[0], this.pos[1], this.pos[2]);
        this.path.push(lcol[0], lcol[1], lcol[2]);
    }
    makepath () {
        if (this.pathbuf != null) { gl.deleteBuffer(this.pathbuf); }
        this.pathbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pathbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.path), gl.DYNAMIC_DRAW);
    }
    
    pendown () { this.pen = true;  }
    penup   () { this.pen = false; }
    forward (x) {
        let look = tr.rot_q(this.orient, [1,0,0]);
        this.pos = v3.add(this.pos, v3.cmul(look,x));
        if (this.pen)
        {
            this.addpath();
        }
        this.oldpos[0] = this.pos[0];
        this.oldpos[1] = this.pos[1];
        this.oldpos[2] = this.pos[2];
    }
    
    turn (t,a)
    {
        let tn = v3.normalize(t);
        let a2 = a * (Math.PI / 180) / 2;
        let q  = [Math.cos(a2), tn[0]*Math.sin(a2), tn[1]*Math.sin(a2), tn[2]*Math.sin(a2)];
        this.orient = quat.mul(q, this.orient);
    }
    roll (a)
    {
        let look = tr.rot_q(this.orient, [1,0,0]);
        this.turn(look, a);
    }
    pitch (a)
    {
        let look = tr.rot_q(this.orient, [1,0,0]);
        let up   = tr.rot_q(this.orient, [0,0,1]);
        let p    = v3.cross(look, up);
        this.turn(p, a);
    }
    yaw (a)
    {
        let down  = tr.rot_q(this.orient, [0,0,-1]);
        this.turn(down, a);
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




let fetch_objfile = function (objfile)
{
    let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function()
        {
            if (xhr.readyState === 4 && xhr.status === 200)
            {
                let model_resp = obj.create(xhr.responseText, 0.5, true, lcol);
                //console.log("M", model_resp);
                
                if (model_resp.length > 0)
                {
                    T.model.llen = model_resp.length;
                    T.model.lbuf = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, T.model.lbuf);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_resp), gl.STATIC_DRAW);
                }
                
                draw();
            }
        }
        xhr.open('GET', objfile, true);
        xhr.send(null);
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
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    if (T.showplane)
    {
        let pltr = m4.init();
        pltr = m4.mul(tr.scale(20), pltr);
        pltr = m4.mul(quat.rot_mat(T.orient), pltr);
        pltr = m4.mul(tr.translate(T.pos), pltr);
        
        gl.uniformMatrix4fv(glprog.vm, true, m4.mul(m4.mul(viewmat, modlmat), pltr));
        
        gl.uniform1i (glprog.colmode, 1);
        gl.uniform3fv(glprog.defcol,  lcol);
        gl.uniform1f (glprog.alpha,   alpha);
        
        if (T.model.llen > 0)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, T.model.lbuf);
            gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 6*4, 0*4);
            gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 6*4, 3*4);
            
            gl.drawArrays(gl.LINES, 0, T.model.llen / 6);
        }
    }
    
    if (T.path.length > 0)
    {
        gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
        
        gl.uniform1i (glprog.colmode, colmode);
        gl.uniform3fv(glprog.defcol,  lcol);
        gl.uniform1f (glprog.alpha,   alpha);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, T.pathbuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 6*4, 0*4);
        gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 6*4, 3*4);
            
        gl.drawArrays(gl.LINES, 0, T.path.length / 6);
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
    else if (event.key === "c" || event.key === "C")
    {
        colmode += 1;
        if (colmode > 1) { colmode = 0; }
        draw();
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
    for (let i=0 ; i<programs.length ; ++i)
    {
        if (programs[i].name === progname)
        {
            P_dom.value = programs[i].prog;
            break;
        }
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
        if (T.path.length > 0) { T.makepath(); }
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
    T.path = [];
    T.oldpos = [0, 0, 0];
    T.pos    = [0, 0, 0];
    T.orient = [1, 0, 0, 0];
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
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");
    glprog.colmode = gl.getUniformLocation(glprog.bin, "colmode");
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
    
    alpha_dom = document.getElementById('alphain');
    bcol_dom  = document.getElementById('bcolin');
    lcol_dom  = document.getElementById('lcolin');
    alpha_dom.value = alpha;
    bcol_dom.value  = "" + bcol[0] + ", " + bcol[1] + ", " + bcol[2];
    lcol_dom.value  = "" + lcol[0] + ", " + lcol[1] + ", " + lcol[2];
    
    pres_dom = document.getElementById('presin');
    pres_dom.options.selectedIndex = 0;
    P_dom = document.getElementById('progin');
    handletab(P_dom);
    P_dom.value = programs[0].prog;
    set_prog();
    
    resize();
    
    T = new aeroplane();
    
    fetch_objfile(T.model.name);
};


window.set_alpha = set_alpha;
window.set_prog  = set_prog;
window.set_pres  = set_pres;
window.run_prog  = run_prog;
window.clear_path = clear_path;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });

