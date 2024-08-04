
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

import { saveAs } from './FileSaver.js';

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let model  = { verts:[], lines:[] };
let sphere   = [];

let F    = null;
let Fdom = null;
let FS = [
    { PL : 'golden', Fstr: `\
let phi    = Math.PI * (Math.sqrt(5.0) - 1.0);
let y      = 1.0 - (i / (N - 1.0)) * 2.0; // y goes from 1 to -1
let radius = Math.sqrt(1 - y * y); // radius at y
let theta  = phi * i; // golden angle increment

let x = Math.cos(theta) * radius;
let z = Math.sin(theta) * radius;
return [x,y,z];
`
    },
    { PL : 'spiral', Fstr: `\
let rev   = 9;
let theta = i*Math.PI / N;
let phi   = i*(2*rev*Math.PI / N);
let x     = Math.sin(theta) * Math.cos(phi);
let y     = Math.sin(theta) * Math.sin(phi);
let z     = Math.cos(theta);
return [x,y,z];
`
    },
    
    { PL : 'chebysev', Fstr: `\
let a = 0.5;
let rev = 7;

let fi = (u,v) => [Math.cos(v)*Math.cos(u),
                   Math.cos(v)*Math.sin(u),
                   Math.sin(v)];

let fiu = (u,v) => [-Math.cos(v)*Math.sin(u),
                     Math.cos(v)*Math.cos(u),
                     0];

let fiv = (u,v) => [-Math.sin(v)*Math.cos(u),
                    -Math.sin(v)*Math.sin(u),
                     Math.cos(v)];

let i2 = i % Math.floor(N / rev);
let uu =  i * 2*Math.PI / N + i2*2*Math.PI / rev;
let vv =  i * 2*Math.PI / N;

return [(a*fiu(uu,vv)[0] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[0] ) / 2,
        (a*fiu(uu,vv)[1] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[1] ) / 2,
        (a*fiu(uu,vv)[2] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[2] ) / 2];
`
    },
    
    { PL : 'rnd', Fstr: `\
let u = Math.acos(2*Math.random() - 1);
let v = 2*Math.PI*Math.random();
return [Math.sin(u) * Math.cos(v),
        Math.sin(u) * Math.sin(v),
        Math.cos(u)];
`
    }
];

let pl_dom    = null;
let showbase  = true;

let sphere_n = 100;
let n1_dom   = null;
let disk_n   = 40;
let n2_dom   = null;

let vrtbuf = null;
let linbuf = null;
let vbase = [0,0,0];

let view_half = false;

let col   = [0.85, 0.85, 0.05,    0.01, 0.01, 0.85,
             0.01, 0.01, 0.85,    0.85, 0.85, 0.05];
//             0,    0,    0,       1,    1,    1,
//             1,    1,    1,       0,    0,    0];
let col_i = 0;
let alpha = 1.0;
let alpha_dom = null;

let menu_hidden = false;

let proj = 0;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 3;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;


let camera = {
    pos   : [5, 5, 5],
    look  : v3.normalize([-1, -1, -1]),
    up    : v3.normalize([-1, -1,  2]),
    near  : 0.02,
    median: 8,
    far   : 50,
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
    else
    {
        projmat = tr.persp(camera);
    }
};

let rgb2hex = function (r,g,b)
{
    let to_hex = (c) => {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + to_hex(Math.floor(r*255)) + to_hex(Math.floor(g*255)) + to_hex(Math.floor(b*255));
};

let save_obj = function ()
{
    let objstring = "\n";
    let sc = 5.0;
    
    let vn = model.lines.length / 6;
        
    for (let i=0 ; i<vn ; ++i)
    {
        objstring += "v " + model.lines[i*6 + 0] * sc + " " + model.lines[i*6 + 1] * sc + " " + model.lines[i*6 + 2] * sc + "\n";
        objstring += "v " + model.lines[i*6 + 3] * sc + " " + model.lines[i*6 + 4] * sc + " " + model.lines[i*6 + 5] * sc + "\n";
        objstring += "l -1 -2\n";
    }

    objstring += "\n";

    let blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'dandelion.obj');
};
let cputrans = function (v)
{
    compute_matrices();
    let vm = m4.mul(viewmat, modlmat);
    let v2 = v3.mmul(projmat, v3.mmul(vm, v));
    return [v2[0]*cwidth/2 + cwidth/2, v2[1]*cheight/2 + cheight/2, v2[2]];
};
let save_svg = function ()
{
    let bc = rgb2hex(col[col_i],   col[col_i+1], col[col_i+2]);
    let dc = rgb2hex(col[col_i+3], col[col_i+4], col[col_i+5]);
    
    let objstring = `\
<svg width="${cwidth}" height="${cheight}" viewBox="0 0 ${cwidth} ${cheight}" \
stroke="${dc}" stroke-width="1"
xmlns="http://www.w3.org/2000/svg">

  <rect x="0" y="0" width="${cwidth}" height="${cheight}" fill="${bc}" />
`;
    //let dmin = 100; let dmax = -100;
    for (let i=0 ; i<model.lines.length / 6 ; ++i)
    {
        let l1 = cputrans([model.lines[i*6+0], model.lines[i*6+1], model.lines[i*6+2]]);
        let l2 = cputrans([model.lines[i*6+3], model.lines[i*6+4], model.lines[i*6+5]]);
        
        //if (l1[2] > dmax) dmax = l1[2];
        //if (l1[2] < dmin) dmin = l1[2];
        //if (l2[2] > dmax) dmax = l2[2];
        //if (l2[2] < dmin) dmin = l2[2];
        if (view_half)
        {
            if (l1[2] < -1 || l1[2] > 1 || l2[2] < -1 || l2[2] > 1)
            {
                continue;
            }
        }
        
        objstring += `  <line x1="${l1[0]}" y1="${l1[1]}" x2="${l2[0]}" y2="${l2[1]}" />\n`;
    }

    objstring += "</svg>\n";

    //console.log("D", dmin, dmax);
    
    let blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'dandelion.svg');
};

let err = function (str)
{
    console.error('Error: ' + str);
    window.alert('Error:\n' + str);
};

let sample_sphere = function ()
{
    sphere = [...Array(sphere_n*3)];

    for (let i=0 ; i<sphere_n ; ++i)
    {
        let v = [0,0,0];
        try
        {
            v = F(i, sphere_n);
        }
        catch (e)
        {
            err(e.message);
            return;
        }

        sphere[i*3 + 0] = v[0];
        sphere[i*3 + 1] = v[1];
        sphere[i*3 + 2] = v[2];
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

        if (showbase)
        {
            model.lines.push(vbase[0], vbase[1], vbase[2]);
            model.lines.push(v[0]+vbase[0], v[1]+vbase[1], v[2]+vbase[2]);
        }

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
    
    gl.clearColor(col[col_i], col[col_i+1], col[col_i+2], 1.0);
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
        gl.uniform3fv(glprog.col, [ col[col_i+3], col[col_i+4], col[col_i+5] ]);
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
    if (document.activeElement === Fdom) { return; }
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
    else if (event.key === "c" || event.key === "C")
    {
        col_i += 6;
        if ((col_i+5) >= col.length) { col_i = 0; }
        draw();
    }
    else if (event.key === "v" || event.key === "V")
    {
        view_half = !view_half;
        camera.far = view_half ? 9 : 50;
        draw();
    }
    else if (event.key === "s" || event.key === "S")
    {
        save_svg();
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
        axis     = 0;
        rotation = 0;
        rotdir   = true;
        scale    = 3;
        draw();
    }
};

let set_n1 = function (strval)
{
    let nn = parseInt(strval);
    if (nn === Infinity || isNaN(nn) || nn < 1) return;
    sphere_n = nn;
    
    make_object();
    draw();
};
let set_n2 = function (strval)
{
    let nn = parseInt(strval);
    if (nn === Infinity || isNaN(nn) || nn < 1) return;
    disk_n = nn;
    
    make_object();
    draw();
};
let set_base = function (val)
{
    //console.log("B", val);
    showbase = val;
    
    make_object();
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
let set_placement = function (strval)
{
    for (let i=0 ; i<FS.length ; ++i)
    {
        if (FS[i].PL === strval)
        {
            pl_dom.blur();
            Fdom.value = FS[i].Fstr;
            setf();
        }
    }
    pl_dom.blur();
};
let setf = function ()
{
    try
    {
        F = Function('i', 'N', Fdom.value);
    }
    catch (err)
    {
        err(err.message);
        return;
    }
    make_object();
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
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    n1_dom    = document.getElementById('n1');
    n2_dom    = document.getElementById('n2');
    n1_dom.value = "" + sphere_n;
    n2_dom.value = "" + disk_n;
    
    pl_dom = document.getElementById('placement');
    pl_dom.options.selectedIndex = 0;
    
    Fdom = document.getElementById("func");
    Fdom.value = FS[0].Fstr;
    setf();
    
    document.getElementById('showbase').checked = showbase;
    
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


window.setf      = setf;
window.set_n1    = set_n1;
window.set_n2    = set_n2;
window.set_base  = set_base;
window.set_alpha = set_alpha;
window.set_placement = set_placement;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
