
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

var gl      = null;
var glprog  = null;
var canvas  = null;
var cwidth, cheight;

var model  = { verts:[], lines:[] };
var vrtbuf = null;
var linbuf = null;
var draw_pts   = false;
var draw_lines = true;


var bcol  = [0.2, 0.2, 0.2];
var tcol  = [0.0, 0.0, 0.0];
var lcol  = [0.5, 0.3, 0.0];
var alpha = 0.1;
/*
var bcol  = [1.0, 1.0, 1.0];
var lcol  = [0.0, 0.0, 0.0];
var alpha = 0.4;
*/
var alpha_dom = null;

var menu_hidden = false;

var proj = 0;
var projmat, modlmat, viewmat;
//var modinvmat;
var scale    = 0.1;
var axis     = 0;
var rotation = 0;
var rotdir   = true;
var grabbed  = 0;

/*
var a = 1 / Math.sqrt(6);
var camera = {
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
var camera = {
    pos   : [ 5,  0,  0],
    look  : [-1,  0,  0],
    up    : [ 0,  0,  1],
    near  : 0.1,
    median: 1,
    far   : 10000,
    fovy  : Math.PI / 3,
    aspect: 1
};

var compute_matrices = function ()
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
var make_model = function ()
{
    model.verts = [];
    model.lines = [];
    
    var N = 4000;
    
    var R       = [ 8, 4, 8];
    var revolve = [ 20, 10, 30];
    var fi      = [0, 0, 0, 0, 0, 0];
    
    var dfi     = [  -Math.PI / N,
                   2*Math.PI*revolve[0] / N,
                     Math.PI / N,
                   -2*Math.PI*revolve[1] / (N),
                     Math.PI / N,
                   2*Math.PI*revolve[2] / N];
    
    for (var i=0 ; i<N ; ++i)
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
    
    make_object();
};
*/

/*
var make_model = function ()
{
    model.verts = [];
    model.lines = [];
    
    var N = 2000;
    
    var R   = [4, 3, 3];
    var fi  = [0, 0, 0];
    var dfi = [4*Math.PI / N, 20*Math.PI / N, 10*Math.PI / N];
    
    for (var i=0 ; i<N ; ++i)
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
    
    make_object();
};
*/

/*
var make_model = function ()
{
    model.verts = [];
    model.lines = [];
    
    var N = 500;
    
    var R       = [10, 4];
    var revolve = [ 7];
    var fi      = [0, 0];
    var dv      = [ 7,0,0 ];
    
    var dfi     = [  (-Math.PI / N)*10,
                   2*Math.PI*revolve[0] / N];
    
    var v0 = [(R[0] - R[1]) * Math.sin(fi[0])*Math.cos(fi[1]),
              (R[0] - R[1]) * Math.sin(fi[0])*Math.sin(fi[1]),
              (R[0] - R[1]) * Math.cos(fi[0]) ];
    var v1 = v0;
    var v  = dv;
    
    for (var i=1 ; i<N*70 ; ++i)
    {
        model.lines.push(v0[0] + v[0]);
        model.lines.push(v0[1] + v[1]);
        model.lines.push(v0[2] + v[2]);
        
        fi[0] += dfi[0];
        fi[1] += dfi[1];
        
        v1 = [(R[0] - R[1]) * Math.sin(fi[0])*Math.cos(fi[1]),
              (R[0] - R[1]) * Math.sin(fi[0])*Math.sin(fi[1]),
              (R[0] - R[1]) * Math.cos(fi[0]) ];
        
        //mt = tr.translate( v3.sub(v1, v0) );
        var vrot = v3.normalize( v3.cross(v0,v1) );
        var arot = Math.acos( v3.dot(v3.normalize(v0), v3.normalize(v1)) ) * (180/Math.PI) * ( -R[0]/R[1] );
        //console.log(arot);
        var mr = tr.rot(vrot, arot);
        
        v = v3.mmul(mr,v);
        model.lines.push(v1[0] + v[0]);
        model.lines.push(v1[1] + v[1]);
        model.lines.push(v1[2] + v[2]);
        
        v0 = v1;
    }
    
    make_object();
};
*/
var make_model = function ()
{
    model.verts = [];
    model.lines = [];
    
    var N    = 500;
    var rev  = 300;
    var sinn = 11.1;
    var A    = 6;
    
    var R       = [10, 4];
    var dv      = [11,0,0 ];
    
    var P2 = Math.PI/2;
    
    var v0 = [(R[0] + R[1]) * Math.sin(P2)*Math.cos(0),
              (R[0] + R[1]) * Math.sin(P2)*Math.sin(0),
              (R[0] + R[1]) * Math.cos(P2) ];
    var v1 = v0;
    var v  = dv;
    
    for (var i=1 ; i<=N*rev ; ++i)
    {
        model.lines.push(v0[0] + v[0]);
        model.lines.push(v0[1] + v[1]);
        model.lines.push(v0[2] + v[2]);
        
        var fi0 = Math.atan2( R[0]+R[1], A*Math.sin(i * sinn *2*Math.PI / N) );
        var fi1 = i * 2*Math.PI / N;
        v1 = [(R[0] + R[1]) * Math.sin(fi0)*Math.cos(fi1),
              (R[0] + R[1]) * Math.sin(fi0)*Math.sin(fi1),
              (R[0] + R[1]) * Math.cos(fi0) ];
        
        //mt = tr.translate( v3.sub(v1, v0) );
        var vrot = v3.normalize( v3.cross(v0,v1) );
        var arot = Math.acos( v3.dot(v3.normalize(v0), v3.normalize(v1)) ) * (180/Math.PI) * ( R[0]/R[1] );
        //console.log(arot);
        var mr = tr.rot(vrot, arot);
        
        v = v3.mmul(mr,v);
        model.lines.push(v1[0] + v[0]);
        model.lines.push(v1[1] + v[1]);
        model.lines.push(v1[2] + v[2]);
        
        v0 = v1;
    }
    
    make_object();
};






var make_object = function ()
{
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts), gl.STATIC_DRAW);
    
    if (model.lines.length > 0)
    {
        //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
        //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model.lines), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.lines), gl.STATIC_DRAW);
    }
    
    console.log("V", model.verts.length, "L", model.lines.length);
};

var draw = function ()
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
    gl.uniform3fv(glprog.col, lcol);
    
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
};

var zoomin  = function () { scale *= 1.25; };
var zoomout = function () { scale *= 0.8;  };
var handle_wheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
    
    draw();
}
var handle_mouse_down = function (event)
{
    grabbed = 1;
    rotdir = (axis < 90) || (axis > 270);
};
var handle_mouse_up = function (event)
{
    grabbed = 0;
};

var handle_mouse_move = function (event)
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
var handle_key_down = function ()
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
        var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
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
var set_alpha = function (strval)
{
    var ival = Number(strval);
    
    if (isNaN(ival) || ival === undefined || ival === null) return;
    if (ival < 0)   ival = 0;
    if (ival > 1.0) ival = 1.0;
    
    alpha = ival;
    alpha_dom.blur();
    
    draw();
};

var resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    camera.aspect = cwidth / cheight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

var gpu_init = function (canvas_id)
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
}

var init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    vrtbuf = gl.createBuffer();
    linbuf = gl.createBuffer();
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    //gl.clearDepth(1); = default
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    /*
    alpha_dom = document.getElementById('alpha');
    var opts = alpha_dom.options;
    for (var i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == 0.5) { opts.selectedIndex = i; }
    }
    */
    
    resize();
    make_model();
    draw();
};


window.set_alpha = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
