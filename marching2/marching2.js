
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

import { noise }  from './noise.js';
import { saveAs } from './FileSaver.js';

let FS = [
    
    { V: 2.0, Fstr: `\
let a = 2.0*Math.sin(x/4.0)*Math.cos(y/4.0);
let b = 2.0*Math.sin(y/4.0)*Math.cos(z/4.0);
let c = 2.0*Math.sin(z/4.0)*Math.cos(x/4.0);
return a+b+c;`
    },

    { V: 21,  Fstr: 'return Math.sqrt(x*x + y*y + z*z);'},
    
    { V: 6.1, Fstr: 'return Math.log(x * y * z);'},
    
    { V: 8.0, Fstr: `\
let a = Math.sqrt(Math.abs(x));
let b = Math.sqrt(Math.abs(y));
let c = Math.sqrt(Math.abs(z));
return a+b+c;`
    },
    
    { V: 0.0, Fstr: 'return z*(z*z - 400) - x*(x*x - 3*y*y);' },
    
    { V: 0.0, Fstr : `\
let a = 20.0;
return (x*x + y*y + z*z - a*a)*z - a*(x*x - y*y);`
    },
    
    { V: 0, Fstr: 'return -z;' },
    
    { V: 0.0, Fstr: `\
// Box Frame by https://iquilezles.org/articles/distfunctions/
let length = (a,b,c)=>( Math.sqrt(a*a+b*b+c*c) );
let e = 2.2;
let p = {x:Math.abs(x)-20, y:Math.abs(y)-20, z:Math.abs(z)-10};
let q = {x:Math.abs(p.x+e)-e,
         y:Math.abs(p.y+e)-e,
         z:Math.abs(p.z+e)-e};
  return Math.min(
      length(Math.max(p.x, 0.0),Math.max(q.y, 0.0),Math.max(q.z, 0.0)) + Math.min(Math.max(p.x,q.y,q.z),0.0),
      length(Math.max(q.x, 0.0),Math.max(p.y, 0.0),Math.max(q.z, 0.0)) + Math.min(Math.max(q.x,p.y,q.z),0.0),
      length(Math.max(q.x, 0.0),Math.max(q.y, 0.0),Math.max(p.z, 0.0)) + Math.min(Math.max(q.x,q.y,p.z),0.0)
                 );`
    },
    
    {
        V: 0.0, Fstr:`\
// https://iquilezles.org/articles/distfunctions/

let cross = (a,b) => {
    let p = [a,b];
    let w = 10;
    let r = 1;
    p     = [Math.abs(p[0]), Math.abs(p[1])];
    let m = Math.min(p[0]+p[1],w) * 0.5;
    let l = [p[0]-m, p[1]-m];
    return Math.sqrt(l[0]*l[0]+l[1]*l[1]) - r;
};

let p = [y,z,x];
let o = 13;
let q = [Math.sqrt(p[0]*p[0]+p[2]*p[2])-o, p[1]];
return cross(q[0], q[1]);`
    },
    
    {
        V: 0.0, Fstr:`\
// https://iquilezles.org/articles/distfunctions/

let length = (p)   => { return Math.sqrt(p[0]*p[0]+p[1]*p[1]); };
let moon   = (a,b) => {
    let p  = [a,Math.abs(b)];
    let d  = 3;
    let ra = 10;
    let rb = 8;
    let aa = (ra*ra - rb*rb + d*d)/(2*d);
    let bb = Math.sqrt(Math.max(ra*ra-aa*aa, 0.0));
    
    if (d*(p[0]*bb-p[1]*aa) > d*d*Math.max(bb-p[1],0.0))
    {
        return length([p[0]-aa,p[1]-bb]);
    }
    return Math.max(
         length(p)-ra,
        -(length([p[0]-d, p[1]])-rb)
    );
};

let p = [y,z,x];
let o = 13;
let q = [Math.sqrt(p[0]*p[0]+p[2]*p[2])-o, p[1]];
return moon(q[0], q[1]);`
    }

];

let Pstr = `\
// F - field val
// V - level set
return Math.min(1/(F-V+0.0001), 20);`;

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let field  = [];
let Nx     = 100;
let Ny     = 100;
let Nz     = 100;
let Sx     = 1.0;
let Sy     = 1.0;
let Sz     = 1.0;
let Ndom   = null;
let Sdom   = null;

let V      = FS[0].V;
let F      = null;
let P      = null;
let Vdom   = null;
let Fdom   = null;
let Pdom   = null;
let Fstr   = FS[0].Fstr;

let added_noise = 0;
let warp        = true;
let A_noise     = 30;
let L_noise     = 0.1;
let rnd         = [];
let nAdom       = null;
let nLdom       = null;
let nOdom       = null;

let model  = { points:[] };
let pntbuf = null;
let tribuf = null;
let linbuf = null;

let bcol  = [0.1, 0.1, 0.1];
let tcol  = [0.9, 0.9, 0.9];
let lcol  = [0.0, 1.0, 1.0];
let alpha = 1.0;
let alpha_dom = null;

let menu_hidden = false;

let proj = 0;
let obj  = 0;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 1;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;


let a = 1 / Math.sqrt(6);
let camera = {
    pos   : [50, 50, 50],
    look  : v3.normalize([-1, -1, -1]),
    up    : [-a, -a, 2*a],
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


let field_pos = function(x,y,z)
{
    return [(-(Nx-1)*Sx/2.0 + x*Sx),
            (-(Ny-1)*Sy/2.0 + y*Sy),
            (-(Nz-1)*Sz/2.0 + z*Sz)];
};

let saturate = function (x)
{
    if (x > 1) return 1;
    if (x < 0) return 0;
    return x;
};

let fxyz = function (x,y,z)
{
    let p = field_pos(x,y,z);
    let f = F(p[0], p[1], p[2]);
    
    if (warp)
    {
        let disp = [0.0, 5.2, 1.3,
                    1.7, 9.2, 8.3,
                    2.8, 1.1, 4.5,
                    0.6, 3.9, 4.4,
                    1.1, 5.0, 5.3,
                    2.1, 1.9, 2.2];
        let s = 0.04;
        let p2 = [noise((p[0]+disp[0])*s, (p[1]+disp[1])*s, (p[2]+disp[2])*s)*8,
                  noise((p[0]+disp[3])*s, (p[1]+disp[4])*s, (p[2]+disp[5])*s)*8,
                  noise((p[0]+disp[6])*s, (p[1]+disp[7])*s, (p[2]+disp[8])*s)*8];
        p[0] = p2[0];
        p[1] = p2[1];
        p[2] = p2[2];
    }
    
    //p[2] = saturate( (3-  p[2]) )*10; 
    
    let oct = 1.0;
    for (let i=0 ; i<added_noise ; ++i)
    {
        f   += (A_noise*oct) * noise((p[0]*L_noise/oct) * rnd[(i*3+0)%rnd.length],
                                     (p[1]*L_noise/oct) * rnd[(i*3+0)%rnd.length],
                                     (p[2]*L_noise/oct) * rnd[(i*3+0)%rnd.length]);
        oct /= 2.0;
    }
    
    return f;
};



let make_field = function ()
{
    field = [];

    for (let i=0 ; i<Nx ; ++i)
    {
        for (let j=0 ; j<Ny ; ++j)
        {
            for (let k=0 ; k<Nz ; ++k)
            {
                try
                {
                    field.push(fxyz(i,j,k));
                }
                catch (err) { console.error("Func error!", err.message); alert(err.message); return; }
            }
        }
    }
};


let mc = function ()
{
    model.points = [];
    
    make_field();
    
    for (let i=0 ; i<Nx ; ++i)
    {
        for (let j=0 ; j<Ny ; ++j)
        {
            for (let k=0 ; k<Nz ; ++k)
            {
                let spos = field_pos(i, j, k);
                
                let s = field[i*(Ny*Nz) +  j*(Nz) + k];
                
                try {
                if (s >= V)
                {
                    let u = Math.acos(2*Math.random() - 1);
                    let v = 2*Math.PI*Math.random();
                    let n = [Math.sin(u) * Math.cos(v),
                             Math.sin(u) * Math.sin(v),
                             Math.cos(u)];
                    let r = P(s, V);
                    
                    model.points.push(...spos, ...n, r);
                }
                } catch (err) { console.error("Pointsize func error!", err.message); alert(err.message); return; }
            }
        }
    }

    console.log("P", model.points.length);
};

let make_object = function ()
{
    if (model.points.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, pntbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.points), gl.STATIC_DRAW);
    }
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
    gl.uniform3fv(glprog.col, tcol);

    gl.bindBuffer(gl.ARRAY_BUFFER, pntbuf);
    gl.vertexAttribPointer(glprog.pos,   3, gl.FLOAT, false, 7*4, 0*4);
    gl.vertexAttribPointer(glprog.norm,  3, gl.FLOAT, false, 7*4, 3*4);
    gl.vertexAttribPointer(glprog.psize, 1, gl.FLOAT, false, 7*4, 6*4);
    gl.drawArrays(gl.POINTS, 0, model.points.length / 7);
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




let save_obj = function ()
{
    let objstring = "\n";
    let sc = 5.0;
    
    let pntsize = 7;
    let vn = model.points.length / pntsize;
        
    for (let i=0 ; i<vn ; ++i)
    {
        objstring += "v " + model.points[i*pntsize +  0] / sc + " " + model.points[i*pntsize +  1] / sc + " " + model.points[i*pntsize +  2] / sc + "\n";
    }

    objstring += "\n";

    let blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'marching_cubes.obj');
};
let save_vol = function ()
{
    let buffer = new ArrayBuffer(3*4 + Nx*Ny*Nz*4);
    let view   = new DataView(buffer);
    
    view.setUint32(0, Nx);
    view.setUint32(4, Ny);
    view.setUint32(8, Nz);
    
    for (let i=0 ; i<Nx-1 ; ++i)
    {
        for (let j=0 ; j<Ny-1 ; ++j)
        {
            for (let k=0 ; k<Nz-1 ; ++k)
            {
                view.setFloat32(( i*(Ny*Nz) + j*(Nz) + k )*4, field[ i*(Ny*Nz) + j*(Nz) + k ]);
            }
        }
    }

    let blob = new Blob([buffer], {type: "model/gltf-binary"});
    saveAs(blob, 'marching_cubes.vol');
};


let handle_key_down = function (event)
{
    if (document.activeElement === Fdom) { return; }
    if (document.activeElement === Pdom) { return; }
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
        ++proj;
        if (proj > 2) { proj = 0; }
        draw();
    }
    /*
    else if (event.key === "o" || event.key === "O")
    {
        ++obj;
        if (obj > 1) { obj = 0; }
        draw();
    }
    else if (event.key === "v" || event.key === "V")
    {
        save_vol();
    }
    else if (event.key === "s" || event.key === "S")
    {
        save_obj();
    }
    */
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

let setf = function ()
{
    V = Number(Vdom.value);
    if (isNaN(V) || V   === undefined || V === null)
    {
        console.error("Couldn't parse level");
        return;
    }
    
    Fstr = Fdom.value;
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
    
    Pstr = Pdom.value;
    try
    {
        P = Function('F', 'V', Pstr);
    }
    catch (err)
    {
        console.error("P Func error!", err.message);
        alert(err.message);
        return;
    }
    
    mc();
    make_object();
    draw();
};


let set_pref = function (value)
{
    let i = parseInt(value);
    if (i<0 || i>= FS.length)
    {
        console.error("Preset error!", i);
        return;
    }
    
    V    = FS[i].V;
    Fstr = FS[i].Fstr;
    
    set_ui();
    
    setf();
};

let set_n = function ()
{
    let nxyz = Ndom.value.split(',');
    if (nxyz.length < 3) return;
    
    let n2x = parseInt(nxyz[0]);
    let n2y = parseInt(nxyz[1]);
    let n2z = parseInt(nxyz[2]);
    let nnn = n2x*n2y*n2z;
    
    if (isNaN(nnn)) return;
    if (nnn > 16777216)
    {
        alert("Error: Divx*Divy*Divz > " + 16777216);
        return;
    }
    
    Nx = n2x;
    Ny = n2y;
    Nz = n2z;
};
let set_s = function ()
{
    let sxyz = Sdom.value.split(',');
    if (sxyz.length < 3) return;
    
    let s2x = parseFloat(sxyz[0]);
    let s2y = parseFloat(sxyz[1]);
    let s2z = parseFloat(sxyz[2]);
    let sss = s2x*s2y*s2z;
    
    if (isNaN(sss)) return;
    
    Sx = s2x;
    Sy = s2y;
    Sz = s2z;
};

let set_noise = function ()
{
    A_noise = parseFloat(nAdom.value);
    L_noise = parseFloat(nLdom.value);
    
    let ovi = parseInt(nOdom.options[nOdom.selectedIndex].value);
    if (ovi >= 0 && ovi < 10)
    {
        added_noise = ovi;
    }
};

let set_params = function ()
{
    set_n();
    set_s();
    set_noise();
    
    mc();
    make_object();
    draw();
};


let set_ui = function ()
{
    Ndom.value = "" + Nx + "," + Ny + "," + Nz;
    Sdom.value = "" + Sx + "," + Sy + "," + Sz;
    
    Vdom.value = V;
    Fdom.value = Fstr;
    Pdom.value = Pstr;
    
    nAdom.value = A_noise;
    nLdom.value = L_noise;
    let oO = nOdom.options;
    for (let i=0 ; i<oO.length ; ++i)
    {
        if (oO[i].value == added_noise) { oO.selectedIndex = i; }
    }
    
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == alpha) { opts.selectedIndex = i; }
    }
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id);
    
    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);
    
    glprog.pos  = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    glprog.norm = gl.getAttribLocation(glprog.bin, "norm");
    gl.enableVertexAttribArray(glprog.norm);
    glprog.psize = gl.getAttribLocation(glprog.bin, "pointsize");
    gl.enableVertexAttribArray(glprog.psize);
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.col     = gl.getUniformLocation(glprog.bin, "col");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");

    pntbuf = gl.createBuffer();
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    Vdom          = document.getElementById("levelin");
    Fdom          = document.getElementById("func");
    Pdom          = document.getElementById("psfunc");
    Ndom          = document.getElementById("nxyz");
    Sdom          = document.getElementById("sxyz");
    alpha_dom     = document.getElementById('alpha');
    nAdom         = document.getElementById('noiseA');
    nLdom         = document.getElementById('noiseL');
    nOdom         = document.getElementById('octaves');
    set_ui();


    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    //gl.clearDepth(1); = default
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    for (let i=0 ; i<100 ; ++i) { rnd.push(Math.random()); }
    
    resize();
    
    setf();
};


window.set_alpha  = set_alpha;
window.set_params = set_params;
window.set_pref   = set_pref;
window.setf       = setf;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
