
import { gl_init }      from "./gl_init.js";
import { vprog, cprog } from "./programs.js";
import { vec3, mat4 }   from "./matvec.js";
import { tr4 }          from "./geom.js";
import { obj }          from "./obj.js";
import { cconv }        from "./color-conv.js";

let gl3    = null;
let glp3   = null;
let glv    = null;
let glpv   = null;
let canvas = null;

let menu_hidden = false;

let projmat, modlmat, viewmat;
let modinvmat;
let scale    = 1;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let elev     = 0;
let grabbed  = 0;

let points = [];
let quad   = [];
let pntbuf = null;
let quadbuf = null;


let camera = {
    pos   : { x:0, y:0, z:100 },
    look  : { x:0, y:0, z:-1 },
    up    : { x:1, y:0, z:0 },
    near  : 0.01,
    median: 30,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};

let C = null;
let C_dom = null;
let V_dom = null;

let view = 0;


let readp = function ()
{
    let params = document.getElementById("load_p").value;
    let tokens = params.split(',');
    if (tokens.length < 4)
    {
        errorlog("ERROR: obj params: " + params);
    }
    
    return [parseFloat(tokens[0]),
            parseFloat(tokens[1]),
            parseFloat(tokens[2]),
            parseFloat(tokens[3])];
};
let load_obj = function ()
{
    let file_dom = document.getElementById("objfile");
    let reader = new FileReader();
    reader.addEventListener("load", () => {
        
        let params = readp();
        
        let model_resp = obj.create(reader.result, params, false);
        
        for (let i=0 ; i<model_resp.verts.length/3 ; i+=1)
        {
            points.push(model_resp.verts[i*3], model_resp.verts[i*3+1], model_resp.verts[i*3+2]);
            
            //points.push( ...cconv.hsv2rgb([0.1, Math.random()*0.9+0.1, Math.random()*0.9+0.1]) );
            let crnd = Math.random()*0.8 + 0.2;
            points.push(crnd, crnd*0.6, crnd*0.2);
        }
        
        if (pntbuf != null) { gl3.deleteBuffer(pntbuf); }
        pntbuf = gl3.createBuffer();
        gl3.bindBuffer(gl3.ARRAY_BUFFER, pntbuf);
        gl3.bufferData(gl3.ARRAY_BUFFER, new Float32Array(points), gl3.DYNAMIC_DRAW);
        
        draw();
    });
    reader.readAsText(file_dom.files[0]);
};


let compute_matrices = function ()
{
    modlmat = tr4.rot_mat(camera.up, rotation*tr4.dtor);
    modlmat = mat4.mul(tr4.rot_mat(vec3.cross(camera.up, camera.look), axis*tr4.dtor), modlmat);
    modlmat = mat4.mul(tr4.scale(scale), modlmat);
    
    modinvmat = tr4.scale(1/scale);
    modinvmat = mat4.mul(tr4.rot_mat(vec3.cross(camera.up, camera.look), -axis*tr4.dtor), modinvmat);
    modinvmat = mat4.mul(tr4.rot_mat(camera.up, -rotation*tr4.dtor), modinvmat);
    
    viewmat = tr4.view(camera);
    
    projmat = tr4.persp(camera);
};



let draw_voronoi = function ()
{
    if (!glv) return;
    if (points.length < 1) return;
    
    v_create_shader();
    glv.useProgram(glpv.bin);
    
    glv.disable(glv.BLEND);
    glv.disable(glv.DEPTH_TEST);
    
    glv.clearColor(0, 0, 0, 1.0);
    glv.clear(glv.COLOR_BUFFER_BIT | glv.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    
    let vx = { x:1, y:0, z:0 };
    let vy = { x:0, y:1, z:0 };
    let x = vec3.cmul(vec3.mmul4(modinvmat, vx), canvas.width/2);
    let y = vec3.cmul(vec3.mmul4(modinvmat, vy), canvas.height/2);
    let z = vec3.cmul(vec3.normalize(vec3.cross(x,y)), elev);
    
    let a = vec3.add(x,y);
    let b = vec3.add(vec3.cmul(x,-1),y);
    
    quad = [
        -1.0, -1.0, 0,    -a.x+z.x,-a.y+z.y,-a.z+z.z,
         1.0, -1.0, 0,    -b.x+z.x,-b.y+z.y,-b.z+z.z,
         1.0,  1.0, 0,     a.x+z.x, a.y+z.y, a.z+z.z,
        
        -1.0, -1.0, 0,    -a.x+z.x,-a.y+z.y,-a.z+z.z,
         1.0,  1.0, 0,     a.x+z.x, a.y+z.y, a.z+z.z,
        -1.0,  1.0, 0,     b.x+z.x, b.y+z.y, b.z+z.z,
    ];
    
    
    glv.bindBuffer(glv.ARRAY_BUFFER, quadbuf);
    glv.bufferSubData(glv.ARRAY_BUFFER, 0, new Float32Array(quad));
    
    glv.vertexAttribPointer(glpv.pos,  3, glv.FLOAT, false, 6*4, 0*4);
    glv.vertexAttribPointer(glpv.pos3, 3, glv.FLOAT, false, 6*4, 3*4);
    
    glv.uniform1fv(glpv.basedata, new Float32Array(points));
    
    glv.drawArrays(glv.TRIANGLES, 0, 6);
};
let draw3 = function ()
{
    if (!gl3) return;
    
    gl3.useProgram(glp3.bin);
    
    gl3.disable(gl3.BLEND);
    gl3.enable(gl3.DEPTH_TEST);
    
    gl3.clearColor(0, 0, 0, 1.0);
    gl3.clear(gl3.COLOR_BUFFER_BIT | gl3.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    
    gl3.uniformMatrix4fv(glp3.p,  true, projmat);
    gl3.uniformMatrix4fv(glp3.vm, true, mat4.mul(viewmat, modlmat));
    
    if (points.length > 0)
    {
        gl3.bindBuffer(gl3.ARRAY_BUFFER, pntbuf);
        gl3.vertexAttribPointer(glp3.pos,  3, gl3.FLOAT, false, 6*4, 0*4);
        gl3.vertexAttribPointer(glp3.col,  3, gl3.FLOAT, false, 6*4, 3*4);
        gl3.drawArrays(gl3.POINTS, 0, points.length / 6);
    }
};
let draw = function ()
{
    if (view === 0) draw3();
    else            draw_voronoi();
};


let handle_wheel = function (e)
{
    if (e.deltaY < 0) scale *= 1.25;
    else              scale *= 0.8;
    
    draw();
}
let handle_mouse_down = function (e)
{
    grabbed = 1;
    rotdir = (axis < 90) || (axis > 270);
};
let handle_mouse_up = function (e)
{
    grabbed = 0;
};

let handle_mouse_move = function (e)
{
    if (grabbed === 1)
    {
        axis -= e.movementY*0.25;
        rotation += rotdir ? e.movementX*0.25 : e.movementX*-0.25;
        
        // Ensure [0,360]
        axis = axis - Math.floor(axis/360.0)*360.0;
        rotation = rotation - Math.floor(rotation/360.0)*360.0;
        
        draw();
    }
};
let handle_key_down = function (e)
{
    if (document.activeElement === C_dom) { return; }
    if (document.activeElement === V_dom) { return; }
    if (event.ctrlKey) { return; }
    
    
    if (e.key === "m" || e.key === "M")
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
    else if (e.key === "0")
    {
        elev += 0.2;
        draw();
    }
    else if (e.key === "1")
    {
        elev -= 0.2;
        draw();
    }
    else if (e.key === "v" || e.key === "V")
    {
        if (view === 0) view = 1;
        else view = 0;
        draw();
    }
    /*
    else if (e.key === "w" || e.key === "W")
    {
        camera.pos   = [80, 80, 80];
        camera.look  = v3.normalize([-1, -1, -1]);
        camera.up    = v3.normalize([-1, -1,  2]);
        draw();
    }
    else if (e.key === "a" || e.key === "A")
    {
        camera.pos   = [-100, 0, 0];
        camera.look  = [ 1, 0, 0];
        camera.up    = [ 0, 0, 1];
        draw();
    }
    else if (e.key === "x" || e.key === "X")
    {
        camera.pos   = [ 0,100, 0];
        camera.look  = [ 0,-1, 0];
        camera.up    = [ 0, 0, 1];
        draw();
    }
    else if (e.key === "d" || e.key === "D")
    {
        camera.pos   = [ 0, 0,100];
        camera.look  = [ 0, 0,-1];
        camera.up    = [ 1, 0, 0];
        draw();
    }
    */
    else if (e.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    else if (e.key === "Enter")
    {
        axis     = 0;
        rotation = 0;
        rotdir   = true;
        scale    = 1;
        elev     = 0;
        draw();
    }
};

let errorlog = function (str)
{
    console.error('Error: ' + str);
    window.alert('Error:\n' + str);
};

let clearp = function ()
{
    points = [];
    draw();
};

let run_cprog = function ()
{
    let CP = null;
    try
    {
        CP = Function(C_dom.value);
    }
    catch (err)
    {
        errorlog(err.message);
        return;
    }
    
    try
    {
        points = CP();
        if (pntbuf != null) { gl3.deleteBuffer(pntbuf); }
        pntbuf = gl3.createBuffer();
        gl3.bindBuffer(gl3.ARRAY_BUFFER, pntbuf);
        gl3.bufferData(gl3.ARRAY_BUFFER, new Float32Array(points), gl3.DYNAMIC_DRAW);
        draw();
    }
    catch (err)
    {
        errorlog(err.message);
        return;
    }
};


let resize = function ()
{
    if (!canvas) return;
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    
    camera.aspect = canvas.width / canvas.height;
    gl3.viewport(0, 0, canvas.width, canvas.height);
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

let v_create_shader = function ()
{
let vsv = `\
#version 300 es
in      vec3  pos;
in      vec3  pos3;
out     vec3  fpos;

void main ()
{
    gl_Position  = vec4(pos, 1.0);
    fpos = pos3;
}`;

let fsv = `\
#version 300 es
precision highp float;

in      vec3  fpos;
uniform float basedata[$BASEN$ * 6];
out     vec4  fragcolor;

$DISTFUNC$

void main ()
{
    float mind = 1.0e+20;
    int   mini = -1;
    
    for (int i=0 ; i<$BASEN$ ; ++i)
    {
        float di = dist(fpos, vec3(basedata[i*6], basedata[i*6+1], basedata[i*6+2]), i);
        if (di < mind)
        {
            mind = di;
            mini = i;
        }
    }
    
    vec3 fcol = vec3(0.0);
    if (mini >= 0) { fcol = vec3(basedata[mini*6+3], basedata[mini*6+4], basedata[mini*6+5]); }
    
    fragcolor = vec4(fcol, 1.0);
}`.replace('$DISTFUNC$', V_dom.value).replaceAll('$BASEN$', points.length/6);

glpv = gl_init.create_glprog(glv,vsv,fsv);
    
    glpv.pos  = glv.getAttribLocation(glpv.bin, "pos");
    glv.enableVertexAttribArray(glp3.pos);
    glpv.pos3 = glv.getAttribLocation(glpv.bin, "pos3");
    glv.enableVertexAttribArray(glpv.pos3);
    
    glpv.basedata = glv.getUniformLocation(glpv.bin, "basedata");
};
let gpu_init = function (canvas_id)
{
    glv  = gl_init.get_webgl2_context(canvas_id, {preserveDrawingBuffer: true, antialias: false});
    
    gl3  = gl_init.get_webgl2_context(canvas_id, {preserveDrawingBuffer: true, antialias: false});
    glp3 = gl_init.create_glprog(gl3,
`\
#version 300 es
in      vec3  pos;
in      vec3  col;
uniform mat4  p;
uniform mat4  vm;
out     vec3  fcol;

void main ()
{
    gl_Position  = p * vm * vec4(pos, 1.0);
    gl_PointSize = 10.0;
    fcol = col;
}`,
`\
#version 300 es
precision mediump float;
in      vec3  fcol;
out     vec4  fragcolor;

void main ()
{
    fragcolor = vec4(fcol, 1.0);
}`);
    
    glp3.pos  = gl3.getAttribLocation(glp3.bin, "pos");
    gl3.enableVertexAttribArray(glp3.pos);
    glp3.col  = gl3.getAttribLocation(glp3.bin, "col");
    gl3.enableVertexAttribArray(glp3.col);
    
    glp3.p       = gl3.getUniformLocation(glp3.bin, "p");
    glp3.vm      = gl3.getUniformLocation(glp3.bin, "vm");
    glp3.alpha   = gl3.getUniformLocation(glp3.bin, "alpha");
    
    quad = [
        -1.0, -1.0, 0,    0,0,0,
         1.0, -1.0, 0,    0,0,0,
         1.0,  1.0, 0,    0,0,0,
        
        -1.0, -1.0, 0,    0,0,0,
         1.0,  1.0, 0,    0,0,0,
        -1.0,  1.0, 0,    0,0,0
    ];
    quadbuf = glv.createBuffer();
    glv.bindBuffer(glv.ARRAY_BUFFER, quadbuf);
    glv.bufferData(glv.ARRAY_BUFFER, new Float32Array(quad), glv.DYNAMIC_DRAW);
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
    
    C_dom = document.getElementById('center');
    V_dom = document.getElementById('voronoi');
    handletab(C_dom);
    handletab(V_dom);
    
    C_dom.value = cprog.grid;
    run_cprog();
    V_dom.value = vprog.dist_p.replace('$PPP$', '2.0');
    
    document.getElementById("load_p").value = "1, 0,0,0";
    
    resize();
    draw();
};

window.run_cprog = run_cprog;
window.clearpoints = clearp;
window.load_obj  = load_obj;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });

