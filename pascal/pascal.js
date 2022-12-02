
import { gl_init }  from "./gl_init.js"

let menu_hidden = false;

var gl      = null;
var shader  = null;
let canvas  = null;
let screen_quad_buffer = null;

let N = 2;
let X = 0;
let Y = 0;
let scale = 10;
let grabbed = -1;
/*
let cols = [
    [0.0, 0.0, 0.0], // 0
    [1.0, 0.6, 0.2], // 1
    [1.0, 1.0, 1.0], // 2
    [0.0, 1.0, 1.0], // 3
    [0.0, 1.0, 0.0], // 4
    [1.0, 1.0, 0.0], // 5
    [1.0, 0.0, 0.0], // 6
    [1.0, 0.0, 1.0], // 7
    [0.0, 0.0, 1.0], // 8
];
*/

let field = {
    cpadmin : 5,
    x : 0,
    y : 0,
    padx : 0,
    data : null,
    im   : null,
    texture : null
};



let vertexs = `\
#version 300 es

layout(location = 0) in vec2  pos;
layout(location = 1) in vec2  tex;

out vec2 texc;

void main ()
{
    gl_Position = vec4(pos, 0.0, 1.0);
    texc = tex;
}
`;

let fragments = `\
#version 300 es
precision highp float;

uniform sampler2D sam;

in  vec2 texc;
out vec4 color;

void main()
{
    vec4 c = texture( sam, texc );
    color  = vec4(c.r, c.g, c.b, 1.0);
}
`;

var make_quad = function ()
{
    var screen_quad = [
        -1.0,  1.0,    0.0, 0.0,
        -1.0, -1.0,    0.0, 1.0,
         1.0, -1.0,    1.0, 1.0,
        
        -1.0,  1.0,    0.0, 0.0,
         1.0, -1.0,    1.0, 1.0,
         1.0,  1.0,    1.0, 0.0
    ];
    
    screen_quad_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screen_quad_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screen_quad), gl.STATIC_DRAW);
};

let set_size = function ()
{
    field.padx = 0;
    field.x    = Math.floor((canvas.width  - 2*field.cpadmin) / scale);
    field.y    = Math.floor((canvas.height - 2*field.cpadmin) / scale);
    field.data = [...Array(field.x * field.y)];
    field.im   = new Uint8Array(field.x * field.y * 4);
    
    let xs = Math.floor((canvas.width  - field.x*scale)/2);
    let ys = Math.floor((canvas.height - field.y*scale)/2);
    
    gl.viewport(xs, ys, field.x*scale, field.y*scale);
};
let resize = function ()
{
    if (!canvas) return;
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    
    set_size();
};

let seed_data = function ()
{
    for (let i=0 ; i<field.x*field.y ; ++i)
    {
        field.data[i] = 0;
        field.im[i*4+0] = 0;
        field.im[i*4+1] = 0;
        field.im[i*4+2] = 0;
        field.im[i*4+3] = 255;
    }
    
    //field.data[Math.floor(field.x / 2)] = 1;
    let middle = field.x / 2;
    let gap = 4;
    let sn  = 22;
    let start = Math.floor(middle - (sn/2)*gap);
    for (let i=0 ; i<sn ; ++i)
    {
        field.data[start + i*gap] = 1;
        field.im[(start + i*gap)*4+0] = 255/(N-1);
        field.im[(start + i*gap)*4+1] = 255/(N-1);
        field.im[(start + i*gap)*4+2] = 255/(N-1);
    }
    
};

let calc_data = function ()
{
    if (!canvas) return;
        
    seed_data();
    
    for (let j=1 ; j<field.y-1 ; ++j)
    {
        for (let i=1 ; i<field.x-1 ; ++i)
        {
            field.data[j*field.x + i] = Math.floor( 1.7 * field.data[(j-1)*field.x + (i-1)] +
                                          0 * field.data[(j-1)*field.x + (i)]   +
                                          1.7 * field.data[(j-1)*field.x + (i+1)] ) % N;
                                           
            field.im[(j*field.x + i)*4 + 0] = field.data[j*field.x + i]*255/(N-1);
            field.im[(j*field.x + i)*4 + 1] = field.data[j*field.x + i]*255/(N-1);
            field.im[(j*field.x + i)*4 + 2] = field.data[j*field.x + i]*255/(N-1);
        }
    }
    
    gl.deleteTexture(field.texture);
    field.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, field.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, field.x, field.y, 0, gl.RGBA, gl.UNSIGNED_BYTE, field.im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
};

let draw = function ()
{
    if (!gl) return;

    calc_data();
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, screen_quad_buffer);
    gl.vertexAttribPointer(shader.pos, 2, gl.FLOAT, false, 4*4, 0*4);
    gl.vertexAttribPointer(shader.tex, 2, gl.FLOAT, false, 4*4, 2*4);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

let zoomin  = function () { scale += 1; set_size(); draw(); };
let zoomout = function () { if (scale > 1) { scale -= 1;  set_size(); draw(); } };

let handleMouseDown = function (event)
{
    grabbed = 1;
};

let handleMouseUp = function (event)
{
    grabbed = -1;
};

let handleMouseMove = function (event)
{
    if (grabbed < 0) return;
    
    //draw();
};

let handleKeyDown = function (event)
{
    if (event.key === "w")
    {
        zoomin();
    }
    else if (event.key === "s")
    {
        zoomout();
    }
    else if (event.key === "m")
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
    else if (event.key === "+")
    {
        if (N < 256) { ++N; draw(); }
    }
    else if (event.key === "-")
    {
        if (N > 2) { --N; draw(); }
    }
};

let handleWheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
};

let create_dropdowns = function ()
{
    let cmlist = document.getElementById('nn');
    
    for (let i=2 ; i<20 ; ++i)
    {
        let option = document.createElement("option");
        option.value = i;
        option.text  = i;
        option.selected = i == N;
        cmlist.appendChild(option);
    }
};

let set_n = function (strval)
{
    let ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 1)
    {
        N = 2;
    }
    else
    {
        N = ival;
    }
    
    draw();
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gl     = gl_init.get_webgl2_context('canvas');
    
    shader = gl_init.create_glprog(gl, vertexs, fragments);
        
    shader.pos = gl.getAttribLocation(shader.bin, "pos");
    shader.tex = gl.getAttribLocation(shader.bin, "tex");
    gl.enableVertexAttribArray(shader.pos);
    gl.enableVertexAttribArray(shader.tex);
    
    //shader.tr    = gl.getUniformLocation(shader.bin, "tr");
    //shader.mouse = gl.getUniformLocation(shader.bin, "mouse");
    
    gl.useProgram(shader.bin);
    gl.clearColor(0, 0, 0, 1);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
    make_quad();
    create_dropdowns();
    field.texture = gl.createTexture();
    
    //canvas.addEventListener("mousedown", handleMouseDown);
    
    resize();
    draw();
};

window.set_n = set_n;

//document.addEventListener("mouseup", handleMouseUp);
//document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

