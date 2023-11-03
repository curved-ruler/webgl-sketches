
import { gl_init }  from "./gl_init.js"

let menu_hidden = false;

var gl      = null;
var shader  = null;
let canvas  = null;
let screen_quad_buffer = null;

let F = null;
let R = null;
let N = null;

let first_d = null;
let rule_d  = null;
let n_d     = null;

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


let presets = [
    
    { Fstr: `\
let middle = xmax / 2;
let gap = 4;
let sn  = 22;
let start = Math.floor(middle - (sn/2)*gap);
for (let i=0 ; i<sn ; ++i)
{
    first[start + i*gap] = 1;
}
`,
      Rstr: `\
// prev row cells: p[0] p[1] p[2] p[3] p[4]
// current row:              curr
return Math.floor(1.7*p[1] + 0*p[2] + 1.7*p[3]) % N;
`,
      N: 7
    },

];



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
    let farr = [...Array(field.x)].map(i => 0);
    
    F(farr, field.x, N);
    
    for (let i=0 ; i<field.x ; ++i)
    {
        field.data[i] = farr[i];
        field.im[i*4+0] = field.data[i]*255/(N-1);
        field.im[i*4+1] = field.data[i]*255/(N-1);
        field.im[i*4+2] = field.data[i]*255/(N-1);
    }
};

let calc_data = function ()
{
    if (!canvas) return;
        
    seed_data();
    
    let fx = field.x-1;
    
    for (let j=1 ; j<field.y ; ++j)
    {
        for (let i=0 ; i<field.x ; ++i)
        {
            let prev = [(i-2)<0  ? 0 : field.data[(j-1)*field.x + (i-2)],
                        (i-1)<0  ? 0 : field.data[(j-1)*field.x + (i-1)],
                        field.data[(j-1)*field.x + (i)],
                        (i+1)>fx ? 0 : field.data[(j-1)*field.x + (i+1)],
                        (i+2)>fx ? 0 : field.data[(j-1)*field.x + (i+2)]];
            
            field.data[j*field.x + i] = R(prev, N);
            
            field.im[(j*field.x + i)*4 + 0] = field.data[j*field.x + i] * 255 / (N-1);
            field.im[(j*field.x + i)*4 + 1] = field.data[j*field.x + i] * 255 / (N-1);
            field.im[(j*field.x + i)*4 + 2] = field.data[j*field.x + i] * 255 / (N-1);
            
            //console.log(field.data[j*field.x + i]);
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
    if (document.activeElement === first_d) { return; }
    if (document.activeElement === rule_d)  { return; }
    
    
    if (event.key === "w" || event.key === "W")
    {
        zoomin();
    }
    else if (event.key === "s" || event.key === "S")
    {
        zoomout();
    }
    else if (event.key === "m" || event.key === "M")
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

let initf = function ()
{
    first_d.value = presets[0].Fstr;
    rule_d.value  = presets[0].Rstr;
    n_d.value     = presets[0].N;
};

let setf = function ()
{
    let n2 = Number(n_d.value);
    if (isNaN(n2) || n2 === undefined || n2 === null)
    {
        console.error("Couldn't parse N");
        alert("Couldn't parse N");
        return;
    }
    N = n2;
    
    let Fstr = first_d.value;
    try
    {
        F = Function('first', 'xmax', 'N', Fstr);
    }
    catch (err)
    {
        console.error("Func error!", err.message);
        alert(err.message);
        return;
    }
    
    let Rstr = rule_d.value;
    try
    {
        R = Function('p', 'N', Rstr);
    }
    catch (err)
    {
        console.error("Func error!", err.message);
        alert(err.message);
        return;
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
    
    first_d = document.getElementById("firstr");
    rule_d  = document.getElementById("rule");
    n_d     = document.getElementById("n");
    
    initf();
    setf();
    
    make_quad();
    field.texture = gl.createTexture();
    
    //canvas.addEventListener("mousedown", handleMouseDown);
    
    resize();
    draw();
};


window.setf = setf;

//document.addEventListener("mouseup", handleMouseUp);
//document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

