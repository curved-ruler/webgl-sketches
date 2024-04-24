
import { glprog }  from "./glprogram.js"
import { shader_strings as S } from "./shaders.js"

let gl      = null;
let shader  = null;
let canvas  = null;
let helpdiv = null;
let cwidth, cheight;

let fta = null;

let pos       = { x:0.0,  y:0.0 };
let mouse_pos = { x:0.0,  y:0.0 };
let mouse_dom = { x:null, y:null };
let mousep_dom = null;
let tr = [1,0,1,0];
let scale = 40.0;
let grabbed  = 0;
let mouse_param = false;
let screen_quad_buffer = null;
let start_func = "";
let menu_hidden = false;



let make_quad = function ()
{
    let screen_quad = [
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

let draw = function ()
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

let zoomin  = function () { scale *= 0.8; };
let zoomout = function () { scale *= 1.25;  };
let handle_wheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
    
    draw();
}
let handle_mouse_down = function (event)
{
    grabbed = 1;
};
let handle_mouse_up = function (event)
{
    grabbed = 0;
};

let handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        let a = scale/cheight;
        pos.x += event.movementX * a;
        pos.y += event.movementY * a;
        draw();
    }
    else if (mouse_param)
    {
        mouse_pos.x = tr[0] * event.clientX + tr[1];
        mouse_pos.y = tr[2] * (cheight-event.clientY) + tr[3];
        
        mouse_dom.x.innerHTML = mouse_pos.x.toFixed(9);
        mouse_dom.y.innerHTML = mouse_pos.y.toFixed(9);
        draw();
    }
};

let handle_key_down = function (event)
{
    if (document.activeElement === fta) { return; }
    
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
    else if (event.key === "q" || event.key === "Q")
    {
        mouse_param = !mouse_param;
        mousep(mouse_param);
        mousep_dom.checked = mouse_param;
    }
};

let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let create_shader = function ()
{
    if (!gl) return;
    
    let fs_withf = S.fs.replace('$HELPERS$', S.helpers).replace('$FUNC$', start_func);
    shader = glprog.create_vf_program(gl, S.vs, fs_withf);
        
    shader.pos = gl.getAttribLocation(shader.glprog, "pos");
    gl.enableVertexAttribArray(shader.pos);
    
    shader.tr    = gl.getUniformLocation(shader.glprog, "tr");
    shader.mouse = gl.getUniformLocation(shader.glprog, "mouse");
}

let init = function ()
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
    mousep_dom  = document.getElementById('mousep_chk');
    
    fta = document.getElementById('func');
    
    resize();
    make_quad();
    preset('eq01');
    create_shader();
    draw();
};

let initf = function ()
{
    let fta = document.getElementById('func');
    fta.value = start_func;
}
let setf  = function ()
{
    let fta = document.getElementById('func');
    start_func = fta.value;
    create_shader();
    draw();
};
let preset = function (opt)
{
    start_func = S[opt];
    initf();
    create_shader();
    draw();
}
let mousep = function (v)
{
    mouse_param = v;
}

window.initf  = initf;
window.setf   = setf;
window.preset = preset;
window.mousep = mousep;

let helper_is_visible = false;
let show_helper = function ()
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
