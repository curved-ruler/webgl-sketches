
import { gl_init }          from "./gl_init.js";
import { m4, v3, quat, tr } from "./matvec.js";
import { obj }              from "./obj.js";

let gl = null;
let canvas = null;

let menu_hidden = true;

let grabbed = 0;

let proj = 1;


let camera = {
    pos   : [0, 0, 0],
    look  : [1, 0, 0],
    up    : [0, 0, 1],
    near  : 0.1,
    median: 30,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1,
    
    rot_k : 0.1
};

let planet_models = [
    "../input/obj1/oktaeder.obj",
    "../input/obj1/kocka.obj",
    "../input/obj1/dodekaeder.obj",
    "../input/obj1/ikozaeder.obj",
];
let glp_planets = null;
let NP = 20;
let planets = [];
let map_size = 100;

let glp_stars = null;
let stars_buf = null;
let NS    = 10000;
let stars = [];
let bcol  = [0, 0, 0];



let fetch_objfile = function (pl)
{
    let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function()
        {
            if (xhr.readyState === 4 && xhr.status === 200)
            {
                let model_resp = obj.create(xhr.responseText, pl.scale, true, pl.col);
                
                if (model_resp.tris.length > 0)
                {
                    pl.tris = model_resp.tris;
                    pl.tbuf = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, pl.tbuf);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_resp.tris), gl.STATIC_DRAW);
                }
                
                if (model_resp.lines.length > 0)
                {
                    pl.lins = model_resp.lines;
                    pl.lbuf = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, pl.lbuf);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_resp.lines), gl.STATIC_DRAW);
                }
                
                draw();
            }
        }
        xhr.open('GET', planet_models[pl.model], true);
        xhr.send(null);
};

let make_planets = function ()
{
    planets = [];
    
    for (let i=0 ; i<NP ; i+=1)
    {
        planets.push({
            model : Math.floor(Math.random() * planet_models.length),
            tris  : [], tbuf : null,
            lins  : [], lbuf : null,
            pos   : [Math.random()*map_size - map_size/2,
                     Math.random()*map_size - map_size/2,
                     Math.random()*map_size - map_size/2],
            col   : [Math.random(), Math.random(), Math.random()],
            scale : Math.random()*0.05
        });
        
        fetch_objfile(planets[i]);
    }
};

let make_stars = function ()
{
    if (stars_buf)
    {
        gl.deleteBuffer(stars_buf);
    }
    
    stars = [];
    
    for (let i=0 ; i<NS ; i+=1)
    {
        let u = Math.acos(2*Math.random() - 1);
        let v = 2*Math.PI*Math.random();
        let s = Math.random();
        
        stars.push(u,v, s, 5*s);
    }
    
    stars_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, stars_buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stars), gl.STATIC_DRAW);
};

let draw = function ()
{
    draw_stars(camera);
    
    for (let i=0 ; i<planets.length ; i+=1)
    {
        draw_planet(planets[i]);
    }
};

let draw_planet = function (pl)
{
    if (!gl || !glp_stars.bin) return;
    
    gl.useProgram(glp_planets.bin);
    
    //gl.enable(gl.CULL_FACE);
    
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    
    gl.clear(gl.DEPTH_BUFFER_BIT);
    
    let pm   = tr.persp(camera);
    let view = tr.view(camera);
    let mod  = tr.translate(pl.pos);
    let vm   = m4.mul(view, mod); 
    
    gl.uniformMatrix4fv(glp_planets.p,  true, pm);
    gl.uniformMatrix4fv(glp_planets.vm, true, vm);
    
    if (pl.lins.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, pl.lbuf);
        gl.vertexAttribPointer(glp_planets.pos,  3, gl.FLOAT, false, 6*4, 0*4);
        gl.vertexAttribPointer(glp_planets.col,  3, gl.FLOAT, false, 6*4, 3*4);
        gl.drawArrays(gl.LINES, 0, pl.lins.length / 6);
    }
    if (pl.tris.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, pl.tbuf);
        gl.vertexAttribPointer(glp_planets.pos,  3, gl.FLOAT, false, 6*4, 0*4);
        gl.vertexAttribPointer(glp_planets.col,  3, gl.FLOAT, false, 6*4, 3*4);
        
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        gl.drawArrays(gl.TRIANGLES, 0, pl.tris.length / 6);
        gl.disable(gl.POLYGON_OFFSET_FILL);
    }
};
let draw_stars = function (cam)
{
    if (!gl || !glp_stars.bin) return;
    
    gl.useProgram(glp_stars.bin);
    
    //gl.enable(gl.CULL_FACE);
    
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    let cam2 = structuredClone(cam);
    cam2.pos = [0,0,0];
    let pm = tr.persp(cam2);
    let vm = tr.view(cam2);
    
    gl.uniformMatrix4fv(glp_stars.p,  true, pm);
    gl.uniformMatrix4fv(glp_stars.vm, true, vm);
    gl.uniform1f(glp_stars.r, 5.0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, stars_buf);
    gl.vertexAttribPointer(glp_stars.pos,  2, gl.FLOAT, false, 4*4, 0*4);
    gl.vertexAttribPointer(glp_stars.col,  1, gl.FLOAT, false, 4*4, 2*4);
    gl.vertexAttribPointer(glp_stars.size, 1, gl.FLOAT, false, 4*4, 3*4);
    gl.drawArrays(gl.POINTS, 0, stars.length / 4);
};


let handle_mouse_down = function (ev)
{
    grabbed = 1;
};
let handle_mouse_up = function (ev)
{
    grabbed = 0;
};

let handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        let left = v3.cross(camera.up, camera.look);
        let qx = tr.rot(camera.up, -camera.rot_k*event.movementX);
        let qy = tr.rot(left,  camera.rot_k*event.movementY);
        
        camera.up   = v3.mmul(qy, camera.up);
        camera.look = v3.mmul(qy, camera.look);
        
        camera.up   = v3.mmul(qx, camera.up);
        camera.look = v3.mmul(qx, camera.look);
        
        //cam_constrain();
        draw();
    }
};

let handle_key_up = function (event)
{
    //plane_controls.control(aeroplane, event, false);
};
let handle_key_down = function (event)
{
    //if (document.activeElement === P_dom) { return; }
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
    }
    else if (event.key === "o" || event.key === "O")
    {
    }
    else if (event.key === "k" || event.key === "K")
    {
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    
    
    //plane_controls.control(aeroplane, event, true);
};

let errorlog = function (str)
{
    console.error('Error: ' + str);
    window.alert('Error:\n' + str);
};

let tick = function (timestamp)
{
    //plane_controls.tick(aeroplane, 0.1); // TODO timestamp
    
    //update_cam();
    draw();
    
    window.requestAnimationFrame(tick);
};

let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id, {preserveDrawingBuffer: true, antialias: false});
    
    glp_stars = gl_init.create_glprog(gl, `\
#version 300 es
in      vec2  pos;
in      float col;
in      float size;

uniform mat4  p;
uniform mat4  vm;
uniform float r;

out float fcol;

void main ()
{
    vec3 pos2 = vec3(r * sin(pos.x) * cos(pos.y),
                     r * sin(pos.x) * sin(pos.y),
                     r * cos(pos.x));
    gl_Position  = p * vm * vec4(pos2, 1.0);
    gl_PointSize = size;
    fcol = col;
}`,
    `\
#version 300 es
precision mediump float;
in      float fcol;
out     vec4  fragcolor;

void main ()
{
    fragcolor = vec4(fcol, fcol, fcol, 1.0);
}
`);
    
    glp_stars.pos  = gl.getAttribLocation(glp_stars.bin, "pos");
    gl.enableVertexAttribArray(glp_stars.pos);
    glp_stars.col  = gl.getAttribLocation(glp_stars.bin, "col");
    gl.enableVertexAttribArray(glp_stars.col);
    glp_stars.size = gl.getAttribLocation(glp_stars.bin, "size");
    gl.enableVertexAttribArray(glp_stars.size);
    
    glp_stars.p  = gl.getUniformLocation(glp_stars.bin, "p");
    glp_stars.vm = gl.getUniformLocation(glp_stars.bin, "vm");
    glp_stars.r  = gl.getUniformLocation(glp_stars.bin, "r");
    
    
    glp_planets = gl_init.create_glprog(gl, `\
#version 300 es
in      vec3  pos;
in      vec3  col;

uniform mat4  p;
uniform mat4  vm;

out vec3 fcol;

void main ()
{
    gl_Position  = p * vm * vec4(pos, 1.0);
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
}
`);
    
    glp_planets.pos  = gl.getAttribLocation(glp_planets.bin, "pos");
    gl.enableVertexAttribArray(glp_planets.pos);
    glp_planets.col  = gl.getAttribLocation(glp_planets.bin, "col");
    gl.enableVertexAttribArray(glp_planets.col);
    
    glp_planets.p  = gl.getUniformLocation(glp_planets.bin, "p");
    glp_planets.vm = gl.getUniformLocation(glp_planets.bin, "vm");
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    
    resize();
    
    make_stars();
    make_planets();
    draw();
};


//window.set_alpha  = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
document.addEventListener("keyup",   handle_key_up);
window.addEventListener("resize", function() { resize(); draw(); });

//window.requestAnimationFrame(tick);
