
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

import { saveAs } from './FileSaver.js';
import { MC }     from "./ModifiedMarchingCubes.js";

let FS = [
    
    { V: 2.0, Fstr: 'let a = 2.0*Math.sin(x/2.0)*Math.cos(y/2.0);\n\
let b = 2.0*Math.sin(y/2.0)*Math.cos(z/2.0);\n\
let c = 2.0*Math.sin(z/2.0)*Math.cos(x/2.0);\n\
return a+b+c;'},

    { V: 10.5, Fstr: 'return Math.sqrt(x*x + y*y + z*z);'},
    
    { V: 5.0,  Fstr: 'return Math.log(x * y * z);'}
    
    { V: 0.0,  Fstr: '// Box Frame by https://iquilezles.org/articles/distfunctions/\n\
let length = (a,b,c)=>{return Math.sqrt(a*a+b*b+c*c);};\n\
let e = 2.2;\n\
let p = {x:Math.abs(x)-20, y:Math.abs(y)-20, z:Math.abs(z)-10};\n\
let q = {x:Math.abs(p.x+e)-e,\n\
         y:Math.abs(p.y+e)-e,\n\
         z:Math.abs(p.z+e)-e};\n\
  return Math.min(\n\
      length(Math.max(p.x, 0.0),Math.max(q.y, 0.0),Math.max(q.z, 0.0)) + Math.min(Math.max(p.x,q.y,q.z),0.0),\n\
      length(Math.max(q.x, 0.0),Math.max(p.y, 0.0),Math.max(q.z, 0.0)) + Math.min(Math.max(q.x,p.y,q.z),0.0),\n\
      length(Math.max(q.x, 0.0),Math.max(q.y, 0.0),Math.max(p.z, 0.0)) + Math.min(Math.max(q.x,q.y,p.z),0.0)\n\
                 );' }

];

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

//let field  = [];
let N      = 100;
let V      = FS[0].V;
let F      = null;
let Vdom   = null;
let Fdom   = null;
let Fstr   = FS[0].Fstr;

let model  = { tris:[], lines:[] };
let vrtbuf = null;
let tribuf = null;
let linbuf = null;

let bcol  = [0.1, 0.1, 0.1];
let tcol  = [0.9, 0.9, 0.9];
let lcol  = [0.0, 1.0, 1.0];
let alpha = 1.0;
let alpha_dom = null;

let menu_hidden = false;

let curse = false;
let curse_dom = null;

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
/*
let noise = function (x,y,z)
{
    let p = [Math.floor(x), Math.floor(y), Math.floor(y)];
    let w = [x-p[0], y-p[1], z-p[2]];

    // quintic interpolant
    let u = [w[0]*w[0]*w[0]*(w[0]*(w[0]*6.0-15.0)+10.0),
             w[1]*w[1]*w[1]*(w[1]*(w[1]*6.0-15.0)+10.0),
             w[2]*w[2]*w[2]*(w[2]*(w[2]*6.0-15.0)+10.0)];

    // gradients
    vec3 ga = hash( p+vec3(0.0,0.0,0.0) );
    vec3 gb = hash( p+vec3(1.0,0.0,0.0) );
    vec3 gc = hash( p+vec3(0.0,1.0,0.0) );
    vec3 gd = hash( p+vec3(1.0,1.0,0.0) );
    vec3 ge = hash( p+vec3(0.0,0.0,1.0) );
    vec3 gf = hash( p+vec3(1.0,0.0,1.0) );
    vec3 gg = hash( p+vec3(0.0,1.0,1.0) );
    vec3 gh = hash( p+vec3(1.0,1.0,1.0) );

    // projections
    let va = v3.dot( ga, v3.sub(w, [0.0,0.0,0.0]) );
    let vb = v3.dot( gb, v3.sub(w, [1.0,0.0,0.0]) );
    let vc = v3.dot( gc, v3.sub(w, [0.0,1.0,0.0]) );
    let vd = v3.dot( gd, v3.sub(w, [1.0,1.0,0.0]) );
    let ve = v3.dot( ge, v3.sub(w, [0.0,0.0,1.0]) );
    let vf = v3.dot( gf, v3.sub(w, [1.0,0.0,1.0]) );
    let vg = v3.dot( gg, v3.sub(w, [0.0,1.0,1.0]) );
    let vh = v3.dot( gh, v3.sub(w, [1.0,1.0,1.0]) );

    // interpolation
    return va +
           u[0]*v3.sub(vb,va) +
           u[1]*v3.sub(vc,va) +
           u[2]*v3.sub(ve,va) +
           u[0]*u[1]*(va-vb-vc+vd) +
           u[1]*u[2]*(va-vc-ve+vg) +
           u[2]*u[0]*(va-vb-ve+vf) +
           u[0]*u[1]*u[2]*(-va+vb+vc-vd+ve-vf-vg+vh);
};
*/

let field_val = function(x)
{
    return (-N/2.0 + x) / 2.0;
};

/*
let make_field = function ()
{
    field = [];

    for (let i=0 ; i<N ; ++i)
    {
        let fi = field_val(i);

        for (let j=0 ; j<N ; ++j)
        {
            let fj = field_val(j);

            for (let k=0 ; k<N ; ++k)
            {
                let fk = field_val(k);

                field.push(Math.sqrt(fi*fi + fj*fj + fk*fk));
            }
        }
    }
};
*/
let fxyz = function (xx,yy,zz)
{
    let x = field_val(xx);
    let y = field_val(yy);
    let z = field_val(zz);
    return F(x,y,z);
};



// Axes are:
//
//      y
//      |     zmo
//      |   /
//      | /
//      +----- x
//
// Vertex and edge layout:
//
//            6             7
//            +-------------+               +-----6-------+
//          / |           / |             / |            /|
//        /   |         /   |          11   7         10   5
//    2 +-----+-------+  3  |         +-----+2------+     |
//      |   4 +-------+-----+ 5       |     +-----4-+-----+
//      |   /         |   /           3   8         1   9
//      | /           | /             | /           | /
//    0 +-------------+ 1             +------0------+
//
// Triangulation cases are generated prioritising rotations over inversions, which can introduce non-manifold geometry.
//
let mc = function ()
{
    model.tris  = [];
    model.lines = [];
    
    for (let i=0 ; i<N-1 ; ++i)
    {
        for (let j=0 ; j<N-1 ; ++j)
        {
            for (let k=0 ; k<N-1 ; ++k)
            {
                let cube = [field_val(i),   field_val(j),   field_val(k),
                            field_val(i+1), field_val(j),   field_val(k),
                            field_val(i),   field_val(j+1), field_val(k),
                            field_val(i+1), field_val(j+1), field_val(k),
                            field_val(i),   field_val(j),   field_val(k+1),
                            field_val(i+1), field_val(j),   field_val(k+1),
                            field_val(i),   field_val(j+1), field_val(k+1),
                            field_val(i+1), field_val(j+1), field_val(k+1)];

                let cubef = [fxyz(i,   j,   k)   >= V ? 1 : 0,
                             fxyz(i+1, j,   k)   >= V ? 1 : 0,
                             fxyz(i,   j+1, k)   >= V ? 1 : 0,
                             fxyz(i+1, j+1, k)   >= V ? 1 : 0,
                             fxyz(i,   j,   k+1) >= V ? 1 : 0,
                             fxyz(i+1, j,   k+1) >= V ? 1 : 0,
                             fxyz(i,   j+1, k+1) >= V ? 1 : 0,
                             fxyz(i+1, j+1, k+1) >= V ? 1 : 0];
                
                let index = 0;
                if (curse) {
                    index = cubef[0]*128 +
                            cubef[1]*64 +
                            cubef[2]*32 +
                            cubef[3]*16 +
                            cubef[4]*8 +
                            cubef[5]*4 +
                            cubef[6]*2 +
                            cubef[7]*1;
                } else {
                    index = cubef[0]*1 +
                            cubef[1]*2 +
                            cubef[2]*4 +
                            cubef[3]*8 +
                            cubef[4]*16 +
                            cubef[5]*32 +
                            cubef[6]*64 +
                            cubef[7]*128;
                }

                let triangles = MC.TriangleTable[index];
                let tn        = Math.floor((triangles.length-1) / 3);
                for (let t=0 ; t<tn ; ++t)
                {
                    let e1 = MC.EdgeVertexIndices[triangles[3*t+0]];
                    let e2 = MC.EdgeVertexIndices[triangles[3*t+1]];
                    let e3 = MC.EdgeVertexIndices[triangles[3*t+2]];

                    let va = v3.cmul(v3.add( [ cube[e1[0]*3], cube[e1[0]*3+1], cube[e1[0]*3+2] ],
                                             [ cube[e1[1]*3], cube[e1[1]*3+1], cube[e1[1]*3+2] ]), 0.5);

                    let vb = v3.cmul(v3.add( [ cube[e2[0]*3], cube[e2[0]*3+1], cube[e2[0]*3+2] ],
                                             [ cube[e2[1]*3], cube[e2[1]*3+1], cube[e2[1]*3+2] ]), 0.5);

                    let vc = v3.cmul(v3.add( [ cube[e3[0]*3], cube[e3[0]*3+1], cube[e3[0]*3+2] ],
                                             [ cube[e3[1]*3], cube[e3[1]*3+1], cube[e3[1]*3+2] ]), 0.5);

                    let norm = v3.cross(v3.sub(vc, va), v3.sub(vc, vb));
                    
                    
                    
                    model.tris.push(va[0],     va[1],   va[2]);
                    model.tris.push(norm[0], norm[1], norm[2]);
                    model.tris.push(vb[0],     vb[1],   vb[2]);
                    model.tris.push(norm[0], norm[1], norm[2]);
                    model.tris.push(vc[0],     vc[1],   vc[2]);
                    model.tris.push(norm[0], norm[1], norm[2]);
                    
                    
                    
                    model.lines.push(va[0], va[1], va[2]);
                    model.lines.push(norm[0], norm[1], norm[2]);
                    model.lines.push(vb[0], vb[1], vb[2]);
                    model.lines.push(norm[0], norm[1], norm[2]);
                    
                    model.lines.push(vb[0], vb[1], vb[2]);
                    model.lines.push(norm[0], norm[1], norm[2]);
                    model.lines.push(vc[0], vc[1], vc[2]);
                    model.lines.push(norm[0], norm[1], norm[2]);
                    
                    model.lines.push(vc[0], vc[1], vc[2]);
                    model.lines.push(norm[0], norm[1], norm[2]);
                    model.lines.push(va[0], va[1], va[2]);
                    model.lines.push(norm[0], norm[1], norm[2]);
                }
            }
        }
    }

    console.log("T", model.tris.length, "L", model.lines.length);
};

let make_object = function ()
{
    if (model.tris.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, tribuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.tris), gl.STATIC_DRAW);
    }

    if (model.lines.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.lines), gl.STATIC_DRAW);
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

    if (obj === 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, tribuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 6*4, 0*4);
        gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 6*4, 3*4);
        gl.drawArrays(gl.TRIANGLES, 0, model.tris.length / 6);
    }
    else
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 6*4, 0*4);
        gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 6*4, 3*4);
        gl.drawArrays(gl.LINES, 0, model.lines.length / 6);
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




let save_obj = function ()
{
    let objstring = "\n";
    let sc = 5.0;
    
    if (obj === 0)
    {
        let vn = model.tris.length / 18;
        
        for (let i=0 ; i<vn ; ++i)
        {
            objstring += "v " + model.tris[i*18 +  0] / sc + " " + model.tris[i*18 +  1] / sc + " " + model.tris[i*18 +  2] / sc + "\n";
            objstring += "v " + model.tris[i*18 +  6] / sc + " " + model.tris[i*18 +  7] / sc + " " + model.tris[i*18 +  8] / sc + "\n";
            objstring += "v " + model.tris[i*18 + 12] / sc + " " + model.tris[i*18 + 13] / sc + " " + model.tris[i*18 + 14] / sc + "\n";
            objstring += "f -1 -2 -3\n";
        }
    }
    else
    {
        let vn = model.lines.length / 12;
        
        for (let i=0 ; i<vn ; ++i)
        {
            objstring += "v " + model.lines[i*12 + 0] / sc + " " + model.lines[i*12 + 1] / sc + " " + model.lines[i*12 + 2] / sc + "\n";
            objstring += "v " + model.lines[i*12 + 6] / sc + " " + model.lines[i*12 + 7] / sc + " " + model.lines[i*12 + 8] / sc + "\n";
            objstring += "l -1 -2\n";
        }
    }

    objstring += "\n";

    var blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'marching_cubes.obj');
};
let handle_key_down = function ()
{
    if (document.activeElement === Fdom) { return; }
    
    
    
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
        if (obj > 1) { obj = 0; }
        draw();
    }
    else if (event.key === "s" || event.key === "S")
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
        console.error("Func error!");
        console.log(err.message);
        alert(err.message);
        return;
    }
    
    mc();
    make_object();
    draw();
};

let set_curse = function (value)
{
    curse = value;
    
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
    
    mc();
    make_object();
    draw();
};

let set_ui = function ()
{
    Vdom.value = V;
    Fdom.value = Fstr;
    F = Function('x', 'y', 'z', Fstr);
    
    curse_dom.checked = curse;
    
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
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.col     = gl.getUniformLocation(glprog.bin, "col");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");

    tribuf = gl.createBuffer();
    linbuf = gl.createBuffer();
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    Vdom      = document.getElementById("levelin");
    Fdom      = document.getElementById("func");
    alpha_dom = document.getElementById('alpha');
    curse_dom = document.getElementById('curse');
    set_ui();


    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    //gl.clearDepth(1); = default
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    resize();

    mc();
    make_object();
    draw();
};


window.set_alpha = set_alpha;
window.set_curse = set_curse;
window.set_pref  = set_pref;
window.setf      = setf;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
