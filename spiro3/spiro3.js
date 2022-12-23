
import { saveAs } from './FileSaver.js';

import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let model     = { verts:[], lines:[] };
let modeli    = 0;
let model_dom = null;

let vrtbuf = null;
let linbuf = null;
let draw_pts   = false;
let draw_lines = true;


let N       = 500;
let rev     = 30;
let R       = [9,3];
let dv      = [1,0,1];
let P0      = 0.1;
let N_dom   = null;
let rev_dom = null;
let R_dom   = null;
let dv_dom  = null;
let P0_dom  = null;


let col = [
//      background            drawcol
    [0.07, 0.27, 0.27,    1.0,  1.0,  1.0],
    [0.2,  0.2,  0.2,     0.5,  0.3,  0.0],
    [1.0,  1.0,  1.0,     0.0,  0.0,  0.0]
];
let coli = 0;

let alpha = 0.1;
let alpha_dom = null;

let menu_hidden = false;

let proj = 0;
let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 0.08;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;

/*
let a = 1 / Math.sqrt(6);
let camera = {
    pos   : [5, 5, 5],
    look  : v3.normalize([-1, -1, -1]),
    up    : [-a, -a, 2*a],
    near  : 0.1,
    median: 1,
    far   : 10000,
    fovy  : Math.PI / 3,
    aspect: 1
};
*/
let camera = {
    pos   : [ 5,  0,  0],
    look  : [-1,  0,  0],
    up    : [ 0,  0,  1],
    near  : 0.1,
    median: 1,
    far   : 5,
    fovy  : Math.PI / 3,
    aspect: 1
};
let vhalf = true;

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
let make_model = function ()
{
    let N = 4000;
    
    let R       = [ 8, 4, 8];
    let revolve = [ 20, 10, 30];
    let fi      = [0, 0, 0, 0, 0, 0];
    
    let dfi     = [  -Math.PI / N,
                   2*Math.PI*revolve[0] / N,
                     Math.PI / N,
                   -2*Math.PI*revolve[1] / (N),
                     Math.PI / N,
                   2*Math.PI*revolve[2] / N];
    
    for (let i=0 ; i<N ; ++i)
    {
        model.verts.push(R[0]*Math.sin(fi[0])*Math.cos(fi[1])  +  R[1]*Math.sin(fi[2])*Math.cos(fi[3])  +  R[2]*Math.sin(fi[4])*Math.cos(fi[5]));
        model.verts.push(R[0]*Math.sin(fi[0])*Math.sin(fi[1])  +  R[1]*Math.sin(fi[2])*Math.sin(fi[3])  +  R[2]*Math.sin(fi[4])*Math.sin(fi[5]));
        model.verts.push(R[0]*Math.cos(fi[0])                  +  R[1]*Math.cos(fi[2])                  +  R[2]*Math.cos(fi[4]));
        
        //model.lines.push(0);
        //model.lines.push(0);
        //model.lines.push(0);
        //model.lines.push(R[0]*Math.sin(fi[0])*Math.cos(fi[1]));
        //model.lines.push(R[0]*Math.sin(fi[0])*Math.sin(fi[1]));
        //model.lines.push(R[0]*Math.cos(fi[0]));
        
        //model.lines.push(R[0]*Math.sin(fi[0])*Math.cos(fi[1]));
        //model.lines.push(R[0]*Math.sin(fi[0])*Math.sin(fi[1]));
        //model.lines.push(R[0]*Math.cos(fi[0]));
        model.lines.push(R[0]*Math.cos(fi[0])                  +  R[1]*Math.cos(fi[2]));
        model.lines.push(R[0]*Math.sin(fi[0])*Math.sin(fi[1])  +  R[1]*Math.sin(fi[2])*Math.sin(fi[3]));
        model.lines.push(R[0]*Math.sin(fi[0])*Math.cos(fi[1])  +  R[1]*Math.sin(fi[2])*Math.cos(fi[3]));
        
        model.lines.push(R[0]*Math.cos(fi[0])                  +  R[1]*Math.cos(fi[2])                  +  R[2]*Math.cos(fi[4]));
        model.lines.push(R[0]*Math.sin(fi[0])*Math.sin(fi[1])  +  R[1]*Math.sin(fi[2])*Math.sin(fi[3])  +  R[2]*Math.sin(fi[4])*Math.sin(fi[5]));
        model.lines.push(R[0]*Math.sin(fi[0])*Math.cos(fi[1])  +  R[1]*Math.sin(fi[2])*Math.cos(fi[3])  +  R[2]*Math.sin(fi[4])*Math.cos(fi[5]));
        
        fi[0] += dfi[0];
        fi[1] += dfi[1];
        fi[2] += dfi[2];
        fi[3] += dfi[3];
        fi[4] += dfi[4];
        fi[5] += dfi[5];
    }
};
*/

/*
let make_model = function ()
{
    let N = 2000;
    
    let R   = [4, 3, 3];
    let fi  = [0, 0, 0];
    let dfi = [4*Math.PI / N, 20*Math.PI / N, 10*Math.PI / N];
    
    for (let i=0 ; i<N ; ++i)
    {
        //model.verts.push( R[0]*Math.sin(fi[0] + i*dfi[0]) );
        //model.verts.push( R[0]*Math.cos(fi[0] + i*dfi[0]) );
        //model.verts.push( 0 );
        
        
        model.lines.push( R[0]*Math.sin(fi[0] + i*dfi[0]) );
        model.lines.push( R[0]*Math.cos(fi[0] + i*dfi[0]) );
        model.lines.push( 0 );
        
        model.lines.push( R[0]*Math.sin(fi[0] + i*dfi[0]) + 0 );
        model.lines.push( R[0]*Math.cos(fi[0] + i*dfi[0]) + R[1]*Math.sin(fi[1] + i*dfi[1]) );
        model.lines.push( 0                               + R[1]*Math.cos(fi[1] + i*dfi[1]) );
        
        model.lines.push( R[0]*Math.sin(fi[0] + i*dfi[0]) + 0 );
        model.lines.push( R[0]*Math.cos(fi[0] + i*dfi[0]) + R[1]*Math.sin(fi[1] + i*dfi[1]) );
        model.lines.push( 0                               + R[1]*Math.cos(fi[1] + i*dfi[1]) );
        
        model.lines.push( R[0]*Math.sin(fi[0] + i*dfi[0]) + 0                               + R[2]*Math.sin(fi[2] + i*dfi[2]) );
        model.lines.push( R[0]*Math.cos(fi[0] + i*dfi[0]) + R[1]*Math.sin(fi[1] + i*dfi[1]) + 0 );
        model.lines.push( 0                               + R[1]*Math.cos(fi[1] + i*dfi[1]) + R[2]*Math.cos(fi[2] + i*dfi[2]) );
    }
};
*/


let make_model_0 = function ()
{
    let revolve = [P0];
    let fi      = [0, 0];
    
    let dfi     = [  (Math.PI / N)*10,
                   2*Math.PI*revolve[0] / N];
    
    let v0 = [(R[0] + R[1]) * Math.sin(fi[0])*Math.cos(fi[1]),
              (R[0] + R[1]) * Math.sin(fi[0])*Math.sin(fi[1]),
              (R[0] + R[1]) * Math.cos(fi[0]) ];
    let v1 = v0;
    let v  = dv;
    
    for (let i=1 ; i<N*rev ; ++i)
    {
        model.verts.push(v0[0] + v[0]);
        model.verts.push(v0[1] + v[1]);
        model.verts.push(v0[2] + v[2]);
        
        fi[0] += dfi[0];
        fi[1] += dfi[1];
        
        v1 = [(R[0] + R[1]) * Math.sin(fi[0])*Math.cos(fi[1]),
              (R[0] + R[1]) * Math.sin(fi[0])*Math.sin(fi[1]),
              (R[0] + R[1]) * Math.cos(fi[0]) ];
        
        //mt = tr.translate( v3.sub(v1, v0) );
        let vrot = v3.normalize( v3.cross(v0,v1) );
        let arot = Math.acos( v3.dot(v3.normalize(v0), v3.normalize(v1)) ) * (180/Math.PI) * ( R[0]/R[1] );
        //console.log(arot);
        let mr = tr.rot(vrot, arot);
        
        v = v3.mmul(mr,v);
        model.verts.push(v1[0] + v[0]);
        model.verts.push(v1[1] + v[1]);
        model.verts.push(v1[2] + v[2]);
        
        v0 = v1;
    }
};

let make_model_1 = function ()
{
    let revolve = [P0];
    let fi      = [0, 0];
    
    let dfi     = [  (-Math.PI / N)*10,
                   2*Math.PI*revolve[0] / N];
    
    let v0 = [(R[0] - R[1]) * Math.sin(fi[0])*Math.cos(fi[1]),
              (R[0] - R[1]) * Math.sin(fi[0])*Math.sin(fi[1]),
              (R[0] - R[1]) * Math.cos(fi[0]) ];
    let v1 = v0;
    let v  = dv;
    
    for (let i=1 ; i<N*rev ; ++i)
    {
        model.verts.push(v0[0] + v[0]);
        model.verts.push(v0[1] + v[1]);
        model.verts.push(v0[2] + v[2]);
        
        fi[0] = i * dfi[0];
        fi[1] = i * dfi[1];
        
        v1 = [(R[0] - R[1]) * Math.sin(fi[0])*Math.cos(fi[1]),
              (R[0] - R[1]) * Math.sin(fi[0])*Math.sin(fi[1]),
              (R[0] - R[1]) * Math.cos(fi[0]) ];
        
        let vrot = v3.normalize( v3.cross(v0,v1) );
        let arot = Math.acos( v3.dot(v3.normalize(v0), v3.normalize(v1)) ) * (180/Math.PI) * ( -R[0]/R[1] );
        //console.log(arot);
        let mr = tr.rot(vrot, arot);
        
        v = v3.mmul(mr,v);
        model.verts.push(v1[0] + v[0]);
        model.verts.push(v1[1] + v[1]);
        model.verts.push(v1[2] + v[2]);
        
        v0 = v1;
    }
};

let make_model_2 = function ()
{
    let sinn = P0;
    let A    = 6;
    
    let P2 = Math.PI/2;
    
    let v0 = [(R[0] + R[1]) * Math.sin(P2)*Math.cos(0),
              (R[0] + R[1]) * Math.sin(P2)*Math.sin(0),
              (R[0] + R[1]) * Math.cos(P2) ];
    let v1 = v0;
    let v  = dv;
    
    for (let i=1 ; i<=N*rev ; ++i)
    {
        model.verts.push(v0[0] + v[0]);
        model.verts.push(v0[1] + v[1]);
        model.verts.push(v0[2] + v[2]);
        
        let fi0 = Math.atan2( R[0]+R[1], A*Math.sin(i * sinn *2*Math.PI / N) );
        let fi1 = i * 2*Math.PI / N;
        v1 = [(R[0] + R[1]) * Math.sin(fi0)*Math.cos(fi1),
              (R[0] + R[1]) * Math.sin(fi0)*Math.sin(fi1),
              (R[0] + R[1]) * Math.cos(fi0) ];
        
        //mt = tr.translate( v3.sub(v1, v0) );
        let vrot = v3.normalize( v3.cross(v0,v1) );
        let arot = Math.acos( v3.dot(v3.normalize(v0), v3.normalize(v1)) ) * (180/Math.PI) * ( R[0]/R[1] );
        //console.log(arot);
        let mr = tr.rot(vrot, arot);
        
        v = v3.mmul(mr,v);
        model.verts.push(v1[0] + v[0]);
        model.verts.push(v1[1] + v[1]);
        model.verts.push(v1[2] + v[2]);
        
        v0 = v1;
    }
};

/* ******* 
 * Chebysev net */
let make_model_3 = function ()
{
    let a    = P0;
    
    let P2 = Math.PI/2;
    let N2 = Math.floor(Math.sqrt(N));
    
    let fi = (u,v) => [(R[0] + R[1]) * Math.cos(v)*Math.cos(u),
                       (R[0] + R[1]) * Math.cos(v)*Math.sin(u),
                       (R[0] + R[1]) * Math.sin(v)];
    
    let fiu = (u,v) => [-(R[0] + R[1]) * Math.cos(v)*Math.sin(u),
                         (R[0] + R[1]) * Math.cos(v)*Math.cos(u),
                         0];
    
    let fiv = (u,v) => [-(R[0] + R[1]) * Math.sin(v)*Math.cos(u),
                        -(R[0] + R[1]) * Math.sin(v)*Math.sin(u),
                         (R[0] + R[1]) * Math.cos(v)];
    
    let v0 = [(a*fiu(0,0)[0] + Math.sqrt(4-a*a*Math.cos(0)*Math.cos(-P2))*fiv(0,0)[0] ) / 2,
              (a*fiu(0,0)[1] + Math.sqrt(4-a*a*Math.cos(0)*Math.cos(-P2))*fiv(0,0)[1] ) / 2,
              (a*fiu(0,0)[2] + Math.sqrt(4-a*a*Math.cos(0)*Math.cos(-P2))*fiv(0,0)[2] ) / 2];
    
    let v1 = v0;
    let v  = dv;
    
    
    for (let ri=0 ; ri<rev ; ++ri)
    for (let i=1 ; i<=N ; ++i)
    {
        model.verts.push(v0[0] + v[0]);
        model.verts.push(v0[1] + v[1]);
        model.verts.push(v0[2] + v[2]);
        
        let uu =  i * 2*Math.PI / N + ri * 2*Math.PI / rev;
        let vv =  i * 2*Math.PI / N;
        
        v1 = [(a*fiu(uu,vv)[0] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[0] ) / 2,
              (a*fiu(uu,vv)[1] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[1] ) / 2,
              (a*fiu(uu,vv)[2] + Math.sqrt(4-a*a*Math.cos(vv)*Math.cos(vv))*fiv(uu,vv)[2] ) / 2];
        
        let vrot = v3.normalize( v3.cross(v0,v1) );
        let arot = Math.acos( v3.dot(v3.normalize(v0), v3.normalize(v1)) ) * (180/Math.PI) * ( R[0]/R[1] );
        //console.log(arot);
        let mr = tr.rot(vrot, arot);
        
        v = v3.mmul(mr,v);
        
        model.verts.push(v1[0] + v[0]);
        model.verts.push(v1[1] + v[1]);
        model.verts.push(v1[2] + v[2]);
        
        v0 = v1;
    }
};

let make_model = function ()
{
    model.verts = [];
    //model.lines = [];
    
    switch (modeli)
    {
        case 0:  make_model_0(); break;
        case 1:  make_model_1(); break;
        case 2:  make_model_2(); break;
        case 3:  make_model_3(); break;
        default: console.log("ERROR: modeli: " + modeli);
    }
    
    make_object();
};






let make_object = function ()
{
    vrtbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts), gl.STATIC_DRAW);
    /*
    if (model.lines.length > 0)
    {
        linbuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model.lines), gl.STATIC_DRAW);
    }
    */
    
    console.log("V", model.verts.length, "L", model.lines.length);
};
let save_obj = function ()
{
    let objstring = "";
    let vn = model.verts.length / 3;
    
    for (let i=0 ; i<vn ; ++i)
    {
        objstring += "v " + model.verts[i*3] + " " + model.verts[i*3 + 1] + " " + model.verts[i*3 + 2] + "\n";
    }
    
    objstring += "\n\n";
    
    for (let i=0 ; i<vn-1 ; ++i)
    {
        objstring += "l " + (i+1) + " " + (i+2) + "\n";
    }
    
    var blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'sp3.obj');
    //navigator.clipboard.writeText(objstring);
    //console.log(objstring);
};

let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 0*4, 0*4);
    gl.drawArrays(gl.LINE_STRIP, 0, model.verts.length / 3);
    
    /*
    if (draw_pts)
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
    */
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
    if (event.ctrlKey) return;
    
    
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
    else if (event.key === "v" || event.key === "V")
    {
        toggle_vhalf();
        draw();
    }
    else if (event.key === "c" || event.key === "C")
    {
        ++coli;
        if (coli >= col.length) coli = 0;
        gl.clearColor(           col[coli][0], col[coli][1], col[coli][2], 1.0);
        gl.uniform3f(glprog.col, col[coli][3], col[coli][4], col[coli][5]);
        draw();
    }
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) { proj = 0; }
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
        scale    = 0.08;
        draw();
    }
};
let set_alpha = function (strval)
{
    let ival = Number(strval);
    
    //if (isNaN(ival) || ival === undefined || ival === null) return;
    //if (ival < 0)   ival = 0;
    //if (ival > 1.0) ival = 1.0;
    
    alpha = ival;
    alpha_dom.blur();
    
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
    gl.uniform1f(glprog.alpha, alpha);
    
    draw();
};
let set_model = function (strval)
{
    modeli = Number(strval);
    model_dom.blur();
    make_model();
    draw();
};
let toggle_vhalf = function ()
{
    if (vhalf)
    {
        camera.far = 100;
        vhalf      = false;
    }
    else
    {
        camera.far = 5;
        vhalf      = true;
    }
};
let set_textinputs = function ()
{
    let N2   = Number(N_dom.value);
    let rev2 = Number(rev_dom.value);
    let R2   = Number(R_dom.value);
    let P0_2 = Number(P0_dom.value);
    let dv2  = dv_dom.value.split(',').map(Number);
    
    if (isNaN(N2)   || N2   === undefined || N2   === null) return;
    if (isNaN(rev2) || rev2 === undefined || rev2 === null) return;
    if (isNaN(R2)   || R2   === undefined || R2   === null) return;
    
    if (dv2.length < 3) return;
    if (isNaN(dv2[0]) || dv2[0] === undefined || dv2[0] === null) return;
    if (isNaN(dv2[1]) || dv2[1] === undefined || dv2[1] === null) return;
    if (isNaN(dv2[2]) || dv2[2] === undefined || dv2[2] === null) return;
    
    if (N2   < 5) N2   = 5;
    if (rev2 < 1) rev2 = 1;
    if (R2   < 0.0001) R2 = 0.0001;
    
    N    = N2;   N_dom.value   = N;
    rev  = rev2; rev_dom.value = rev;
    R[1] = R2;   R_dom.value   = R[1];
    P0   = P0_2;
    dv   = dv2;  dv_dom.value  = dv.join(',');
    
    make_model();
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
    gl = gl_init.get_webgl2_context(canvas_id, {preserveDrawingBuffer: true/* , antialias: false*/});
    
    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);
    
    glprog.pos = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.col     = gl.getUniformLocation(glprog.bin, "col");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");
    
    gl.useProgram(glprog.bin);
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    vrtbuf = gl.createBuffer();
    linbuf = gl.createBuffer();
    
    gl.clearColor(           col[coli][0], col[coli][1], col[coli][2], 1.0);
    gl.uniform3f(glprog.col, col[coli][3], col[coli][4], col[coli][5]);
    //gl.clearDepth(1); = default
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    model_dom = document.getElementById('model');
    model_dom.options.selectedIndex = 0;
    
    alpha_dom = document.getElementById('alpha');
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i) { if (opts[i].value == alpha) { opts.selectedIndex = i; break; } }
    set_alpha(alpha);
    
    N_dom   = document.getElementById('n');       N_dom.value   = N;
    rev_dom = document.getElementById('rev');     rev_dom.value = rev;
    R_dom   = document.getElementById('radius');  R_dom.value   = R[1];
    P0_dom  = document.getElementById('par0');    P0_dom.value  = P0;
    dv_dom  = document.getElementById('vp');      dv_dom.value  = dv.join(',');
    
    resize();
    make_model();
    draw();
};


window.set_alpha      = set_alpha;
window.set_model      = set_model;
window.set_textinputs = set_textinputs;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
