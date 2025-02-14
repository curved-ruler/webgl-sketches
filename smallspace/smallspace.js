
import { gl_init }          from "./gl_init.js";
import { m4, v3, quat, tr } from "./matvec.js";

let gl = null;
let canvas = null;

let glp_stars = null;
let stars_buf = null;
let NS = 5000;
let stars = [];

let bcol  = [0, 0, 0];

let menu_hidden = true;

let proj    = 1;
let projmat, modlmat, viewmat;


let camera = {
    pos   : [0, 0, 0],
    look  : [1, 0, 0],
    up    : [0, 0, 1],
    near  : 0.1,
    median: 30,
    far   : 100,
    fovy  : Math.PI / 3,
    aspect: 1
};


let compute_matrices = function ()
{
    modlmat = m4.init();
    
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
    draw_stars();
};

let draw_stars = function ()
{
    if (!gl || !glp_stars.bin) return;
    
    gl.useProgram(glp_stars.bin);
    
    //gl.enable(gl.CULL_FACE);
    
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    
    gl.uniformMatrix4fv(glp_stars.p,  true, projmat);
    gl.uniformMatrix4fv(glp_stars.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1f(glp_stars.r, 2.0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, stars_buf);
    gl.vertexAttribPointer(glp_stars.pos,  2, gl.FLOAT, false, 4*4, 0*4);
    gl.vertexAttribPointer(glp_stars.col,  1, gl.FLOAT, false, 4*4, 2*4);
    gl.vertexAttribPointer(glp_stars.size, 1, gl.FLOAT, false, 4*4, 3*4);
    gl.drawArrays(gl.POINTS, 0, stars.length / 4);
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
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    //canvas.addEventListener("mousedown", handle_mouse_down);
    //canvas.addEventListener("mouseup",   handle_mouse_up);
    //canvas.addEventListener("mousemove", handle_mouse_move);
    
    resize();
    
    make_stars();
    draw_stars();
};


//window.set_alpha  = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
document.addEventListener("keyup",   handle_key_up);
window.addEventListener("resize", function() { resize(); draw(); });

//window.requestAnimationFrame(tick);
