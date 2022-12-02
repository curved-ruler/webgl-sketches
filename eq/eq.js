
import { glprog }  from "./glprogram.js"
import { shader_strings as S } from "./shaders.js"

var gl      = null;
var shader  = null;
var canvas  = null;
var helpdiv = null;
var cwidth, cheight;

var pos       = { x:0.0,  y:0.0 };
var mouse_pos = { x:0.0,  y:0.0 };
var mouse_dom = { x:null, y:null };
var tr = [1,0,1,0];
var scale = 40.0;
var grabbed  = 0;
var mouse_param = false;
var screen_quad_buffer = null;
var start_func = "";
var menu_hidden = false;



var make_quad = function ()
{
    var screen_quad = [
        -1.0,  1.0,
        -1.0, -1.0,
         1.0, -1.0,
        
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
    ];
    
    screen_quad_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screen_quad_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screen_quad), gl.STATIC_DRAW);
};

var draw = function ()
{
    if (!gl) return;
    if (!shader) return;
    gl.useProgram(shader.glprog);
    
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
    tr = [scale/cheight, -(cwidth*scale)/(cheight*2.0)-pos.x, scale/cheight, -scale/2.0+pos.y];
    //console.log("TR", tr);
    gl.uniform4fv(shader.tr, tr);
    gl.uniform2f(shader.mouse, mouse_pos.x, mouse_pos.y);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, screen_quad_buffer);
    gl.vertexAttribPointer(shader.pos, 2, gl.FLOAT, false, 0*4, 0*4);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

var zoomin  = function () { scale *= 0.8; };
var zoomout = function () { scale *= 1.25;  };
var handle_wheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
    
    draw();
}
var handle_mouse_down = function (event)
{
    grabbed = 1;
};
var handle_mouse_up = function (event)
{
    grabbed = 0;
};

var handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        var a = scale/cheight;
        pos.x += event.movementX * a;
        pos.y += event.movementY * a;
        draw();
    }
    else
    {
        mouse_pos.x = tr[0] * event.clientX + tr[1];
        mouse_pos.y = tr[2] * (cheight-event.clientY) + tr[3];
        if (mouse_param)
        {
            mouse_dom.x.innerHTML = mouse_pos.x;
            mouse_dom.y.innerHTML = mouse_pos.y;
            draw();
        }
    }
};

var handle_key_down = function (event)
{
    if (event.key === "m" && event.ctrlKey)
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
};

var resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

var create_shader = function ()
{
    if (!gl) return;
    
    var fs_withf = S.fs.replace('$HELPERS$', S.helpers).replace('$FUNC$', start_func);
    shader = glprog.create_vf_program(gl, S.vs, fs_withf);
        
    shader.pos = gl.getAttribLocation(shader.glprog, "pos");
    gl.enableVertexAttribArray(shader.pos);
    
    shader.tr    = gl.getUniformLocation(shader.glprog, "tr");
    shader.mouse = gl.getUniformLocation(shader.glprog, "mouse");
}

var init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    helpdiv = document.getElementById('hlp');
    helpdiv.innerHTML = S.helpers.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    
    canvas = document.getElementById('canvas');
    gl     = glprog.get_context_2('canvas');
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    mouse_dom.x = document.getElementById('mousex');
    mouse_dom.y = document.getElementById('mousey');
    
    resize();
    make_quad();
    preset('eq01');
    create_shader();
    draw();
};

var initf = function ()
{
    var fta = document.getElementById('func');
    fta.value = start_func;
}
var setf  = function ()
{
    var fta = document.getElementById('func');
    start_func = fta.value;
    create_shader();
    draw();
};
var preset = function (opt)
{
    start_func = S[opt];
    initf();
    create_shader();
    draw();
}
var mousep = function (v)
{
    mouse_param = v;
}

window.initf  = initf;
window.setf   = setf;
window.preset = preset;
window.mousep = mousep;

var helper_is_visible = false;
var show_helper = function ()
{
    if (helper_is_visible)
    {
        helpdiv.classList.add('hidden');
    }
    else
    {
        helpdiv.classList.remove('hidden');
    }
    helper_is_visible = !helper_is_visible;
}
window.show_helper = show_helper;

document.addEventListener("keydown",   handle_key_down);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });
