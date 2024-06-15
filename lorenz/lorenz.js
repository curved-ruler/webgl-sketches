
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

let N    = 30;
let Z    = 0;
let pos1 = [];
let pos2 = [];

let F  = null;
let FS = [
    `\
let dt = 0.02;
let A  = 10;
let B  = 8/3;
let C  = 28;
let dx = A*(y - x);
let dy = x*(C - z) - y;
let dz = x*y - B*z;
return [x+dt*dx, y+dt*dy, z+dt*dz];`,
    
    `\
let dt = 0.02;
let A  = 0.2;
let B  = 0.2;
let C  = 5.7;
let dx = -y - z;
let dy = x + A*y;
let dz = B+z*(x-C);
return [x+dt*dx, y+dt*dy, z+dt*dz];`,
    
    `\
let dt = 0.2;
let B  = 0.2;
let dx = Math.sin(y) - B*x;
let dy = Math.sin(z) - B*y;
let dz = Math.sin(x) - B*z;
return [x+dt*dx, y+dt*dy, z+dt*dz];`,
    
    `\
let dt = 0.02;
let dx = (z-0.7)*x - 3.5*y;
let dy = 3.5*x + (z-0.7)*y;
let dz = 0.6 + 0.95*z - z*z*z/3 -(x*x+y*y)*(1+0.25*z) + 0.1*z*x*x*x;
return [x+dt*dx, y+dt*dy, z+dt*dz];`,
    
    `\
let dt = 0.02;
let dx = y - 3*x + 2.7*y*z;
let dy = 1.7*y - x*z + z;
let dz = 2*x*y - 9*z;
return [x+dt*dx, y+dt*dy, z+dt*dz];`,
    
    `\
let dt = 0.02;
let dx = 5*x - y*z;
let dy = -10*y + x*z;
let dz = -0.38*z + x*y/3;
return [x+dt*dx, y+dt*dy, z+dt*dz];`,
    
    `\
let dt = 0.02;
let A  = 1.89;
let dx = -A*x - 4*y - 4*z - y*y;
let dy = -A*y - 4*z - 4*x - z*z;
let dz = -A*z - 4*x - 4*y - x*x;
return [x+dt*dx, y+dt*dy, z+dt*dz];`,
    
    `\
let dt = 0.02;
let C  = 0.1;
let dx = y*(z-1+x*x) + C*x;
let dy = x*(3*z+1-x*x) + C*y;
let dz = -2*z*(0.14 + x*y);
return [x+dt*dx, y+dt*dy, z+dt*dz];`,

    `\
let dt = 0.02;
let A  = 2.07;
let B  = 1.79;
let dx = y + A*x*y + x*z;
let dy = 1 - B*x*x + y*z;
let dz = x - x*x - y*y;
return [x+dt*dx, y+dt*dy, z+dt*dz];`,

    `\
let dt = 0.02;
let A  = 0.2;
let B  = 0.01;
let C  = -0.4
let dx = A*x + y*z;
let dy = B*x + C*y - x*z;
let dz = -z - x*y;
return [x+dt*dx, y+dt*dy, z+dt*dz];`,
    
    `\
return [x + 1*Math.cos(y)*Math.sin(z),
        y + 1*Math.cos(z)*Math.sin(x),
        z + 1*Math.cos(x)*Math.sin(y)];`
];


let initpos = "rnd";

let bcol  = [0.1, 0.1, 0.1];
let lcol  = [1.0, 1.0, 0.0];
let alpha = 0.3;
//let alpha_dom = null;
let ip_dom = null;
let nn_dom = null;
let zz_dom = null;
let Fdom   = null;
let pr_dom = null;
let alpha_dom = null;
let bcol_dom  = null;
let lcol_dom  = null;

let menu_hidden = false;

let proj = 0;
let projmat, modlmat, viewmat;
let modinvmat;
let scale    = 0.1;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;



let camera = {
    pos   : [50, 50, 50],
    look  : v3.normalize([-1, -1, -1]),
    up    : v3.normalize([-1, -1,  2]),
    near  : 1.0,
    median: 20,
    //far   : 86,
    far   : 200,
    fovy  : Math.PI / 3,
    aspect: 1
};
let compute_matrices = function ()
{
    modlmat = tr.rotz(rotation);
    modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis), modlmat);
    //modlmat = tr.translate(trans);
    modlmat = m4.mul(tr.scale(scale), modlmat);
    /*
    modinvmat = tr.scale(1/scale);
    modinvmat = m4.mul(tr.translate([-trans[0], -trans[1], 0]), modinvmat);
    modinvmat = m4.mul(tr.rotz(-rotation), modinvmat);
    modinvmat = m4.mul(tr.roty(-axis), modinvmat);
    */
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
        pos1[3*i + 2] = Z;
    }
};
let init_pos_sq4 = function ()
{
    nn = 4;
    
    pos1 = [...Array(nn*3)];
    pos2 = [...Array(nn*3)];
    
    pos1[0] =  N;
    pos1[1] =  N;
    pos1[2] =  Z;
    
    pos1[3] = -N;
    pos1[4] =  N;
    pos1[5] =  Z;
    
    pos1[6] = -N;
    pos1[7] = -N;
    pos1[8] =  Z;
    
    pos1[9]  =  N;
    pos1[10] = -N;
    pos1[11] =  Z;
};
let init_pos_sq = function ()
{
    let nn = Math.floor(N/4);
    let d = 10/nn;

    pos1 = [];
    pos2 = [];

    for (let i=0 ; i<nn ; ++i)
    {
        pos1.push(5 - i*d, 5, Z);
    }
    for (let i=0 ; i<nn ; ++i)
    {
        pos1.push(-5, 5 - i*d, Z);
    }
    for (let i=0 ; i<nn ; ++i)
    {
        pos1.push(-5 + i*d, -5, Z);
    }
    for (let i=0 ; i<nn ; ++i)
    {
        pos1.push(5, -5 + i*d, Z);
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
        pos1[i*6 + 2] = Z;
        
        pos1[i*6 + 3] = -N/4;
        pos1[i*6 + 4] =  N/4 - i/2;
        pos1[i*6 + 5] = Z;
    }
    for (let i=0 ; i<N ; ++i)
    {
        pos1[i*6 + N*6 + 0] = -N/2;
        pos1[i*6 + N*6 + 1] =  N/2 - i;
        pos1[i*6 + N*6 + 2] = Z;
        
        pos1[i*6 + N*6 + 3] = -N/4 + i/2;
        pos1[i*6 + N*6 + 4] = -N/4;
        pos1[i*6 + N*6 + 5] = Z;
    }
    for (let i=0 ; i<N ; ++i)
    {
        pos1[i*6 + 2*N*6 + 0] = -N/2 + i;
        pos1[i*6 + 2*N*6 + 1] = -N/2;
        pos1[i*6 + 2*N*6 + 2] = Z;
        
        pos1[i*6 + 2*N*6 + 3] =  N/4;
        pos1[i*6 + 2*N*6 + 4] = -N/4 + i/2;
        pos1[i*6 + 2*N*6 + 5] = Z;
    }
    /*
    for (let i=0 ; i<N ; ++i)
    {
        pos1[i*6 + 3*N*6 + 0] =  N/2;
        pos1[i*6 + 3*N*6 + 1] = -N/2 + i;
        pos1[i*6 + 3*N*6 + 2] = Z;
        
        pos1[i*6 + 3*N*6 + 3] = N/4 - i/2;
        pos1[i*6 + 3*N*6 + 4] = N/4;
        pos1[i*6 + 3*N*6 + 5] = Z;
    }*/
};
let init_pos_circ = function ()
{
    pos1 = [];
    pos2 = [];

    for (let i=0 ; i<N ; ++i)
    {
        pos1.push(5*Math.cos(2*Math.PI*i/N), 5*Math.sin(2*Math.PI*i/N), Z);
    }
};
let init_pos_circ2 = function ()
{
    pos1 = [];
    pos2 = [];

    pos1.push(0, 0, Z);
    for (let i=0 ; i<N ; ++i)
    {
        pos1.push(5*Math.cos(2*Math.PI*i/N), 5*Math.sin(2*Math.PI*i/N), Z);
    }
};
let init_pos_grid = function ()
{
    pos1 = [...Array(N*N*3)];
    pos2 = [...Array(N*N*3)];
    
    for (let i=0 ; i<N ; ++i)
    for (let j=0 ; j<N ; ++j)
    {
        pos1[(i*N + j)*3 + 0] = -N/2 + i;
        pos1[(i*N + j)*3 + 1] = -N/2 + j;
        pos1[(i*N + j)*3 + 2] = Z;
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
    else if (initpos === "grid")  { init_pos_grid(); }
}

let step = function ()
{
    let nn = pos1.length/3;
    if (nn < 2) return;

    for (let i=0 ; i<nn ; ++i)
    {
        pos2[3*i    ] = pos1[3*i    ];
        pos2[3*i + 1] = pos1[3*i + 1];
        pos2[3*i + 2] = pos1[3*i + 2];
    }
    for (let i=0 ; i<nn ; ++i)
    {
        let xyz=[0,0,0];
        try
        {
            xyz = F(pos1[3*i], pos1[3*i+1], pos1[3*i+2]);
        }
        catch (err)
        {
            console.error("Func error!", err.message);
            alert("Error in script:\n" + err.message);
            return;
        }
        
        pos2[3*i    ] = xyz[0];
        pos2[3*i + 1] = xyz[1];
        pos2[3*i + 2] = xyz[2];
        
        
        model.lines.push(pos2[3*i    ]);
        model.lines.push(pos2[3*i + 1]);
        model.lines.push(pos2[3*i + 2]);
        
        model.lines.push(pos1[3*i    ]);
        model.lines.push(pos1[3*i + 1]);
        model.lines.push(pos1[3*i + 2]);
        
        pos1[3*i    ] = pos2[3*i    ];
        pos1[3*i + 1] = pos2[3*i + 1];
        pos1[3*i + 2] = pos2[3*i + 2];
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
    saveAs(blob, 'lorenz.obj');
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
        //gl.blendFunc(gl.DST_ALPHA, gl.ONE_MINUS_DST_ALPHA);
        gl.disable(gl.DEPTH_TEST);
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
let handle_key_down = function (event)
{
    if (document.activeElement === Fdom) { return; }
    if (event.ctrlKey) { return; }
    
    console.log("KEY", event.key);
    
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
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) proj = 0;
        draw();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    else if (event.key === "Enter")
    {
        scale = 0.1;
        axis     = 0;
        rotation = 0;
        rotdir   = true;
        draw();
    }
    else if (event.key === "0")
    {
        camera.pos   = [50, 50, 50];
        camera.look  = v3.normalize([-1, -1, -1]);
        camera.up    = v3.normalize([-1, -1,  2]);
        draw();
    }
    else if (event.key === "1")
    {
        camera.pos   = [70, 0, 0];
        camera.look  = [-1, 0, 0];
        camera.up    = [ 0, 0, 1];
        draw();
    }
    else if (event.key === "2")
    {
        camera.pos   = [ 0,70, 0];
        camera.look  = [ 0,-1, 0];
        camera.up    = [ 0, 0, 1];
        draw();
    }
    else if (event.key === "3")
    {
        camera.pos   = [ 0, 0,70];
        camera.look  = [ 0, 0,-1];
        camera.up    = [ 0, 1, 0];
        draw();
    }
};

let setf = function ()
{
    let Fstr = Fdom.value;
    try
    {
        F = Function('x', 'y', 'z', Fstr);
    }
    catch (err)
    {
        console.error("Func error!", err.message);
        alert(err.message);
        return;
    }
};
let set_pref = function (value)
{
    let i = parseInt(value);
    if (i<0 || i>= FS.length)
    {
        console.error("Preset error!", i);
        return;
    }
    
    Fdom.value = FS[i];
    
    pr_dom.blur();
    
    setf();
};
let set_bcol = function (str)
{
    let bc = str.split(',');
    if (bc.length === 1) bc.push(bc[0], bc[0]);
    if (bc.length === 2) bc.push(bc[1]);
    
    bcol[0] = parseInt(bc[0]) / 255.0;
    bcol[1] = parseInt(bc[1]) / 255.0;
    bcol[2] = parseInt(bc[2]) / 255.0;
    
    draw();
};
let set_lcol = function (str)
{
    let bc = str.split(',');
    if (bc.length === 1) bc.push(bc[0], bc[0]);
    if (bc.length === 2) bc.push(bc[1]);
    
    lcol[0] = parseInt(bc[0]) / 255.0;
    lcol[1] = parseInt(bc[1]) / 255.0;
    lcol[2] = parseInt(bc[2]) / 255.0;
    
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
let set_start = function (strval)
{
    initpos = strval;
    ip_dom.blur();
    init_pos();
    make_object();
    draw();
};
let set_n = function (strval)
{
    let nn = parseInt(strval);
    if (nn !== Infinity && !isNaN(nn))
    {
        if (nn >= 1) N = nn;
    }
};
let set_z = function (strval)
{
    let zz = parseInt(strval);
    if (isNaN(zz) || zz === undefined || zz === null) return;
    Z = zz;
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
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);

    ip_dom = document.getElementById('start');
    nn_dom = document.getElementById('nn');
    zz_dom = document.getElementById('zz');
    Fdom   = document.getElementById("func");
    pr_dom = document.getElementById('presets');
    alpha_dom = document.getElementById('alpha');
    bcol_dom  = document.getElementById('bcolin');
    lcol_dom  = document.getElementById('lcolin');
    
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == alpha) { opts.selectedIndex = i; }
    }

    bcol_dom.value = "" + Math.floor(bcol[0]*255) + "," + Math.floor(bcol[1]*255) + "," + Math.floor(bcol[2]*255);
    lcol_dom.value = "" + Math.floor(lcol[0]*255) + "," + Math.floor(lcol[1]*255) + "," + Math.floor(lcol[2]*255);
    
    ip_dom.options.selectedIndex = 0;
    pr_dom.options.selectedIndex = 0;
    nn_dom.value = "" + N;
    zz_dom.value = "" + Z;
    Fdom.value   = FS[0];
    
    setf();
    
    resize();
    init_pos();
    //for (let i=0 ; i<step_n ; ++i) step();
    make_object();
    draw();
};


window.set_bcol   = set_bcol;
window.set_lcol   = set_lcol;
window.set_alpha  = set_alpha;
window.set_start  = set_start;
window.set_n      = set_n;
window.set_z      = set_z;
window.setf       = setf;
window.set_pref   = set_pref;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
