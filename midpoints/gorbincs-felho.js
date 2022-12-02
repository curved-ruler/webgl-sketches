
import { m4 }      from "./scripts/matrix4.js"
import { v3 }      from "./scripts/vector3.js"
import { tr }      from "./scripts/transformations.js"
import { glprog }  from "./scripts/glprogram.js"
import { shaders } from "./scripts/shaders.js"

var gl      = null;
var shader2 = null;
var shader3 = null;
var canvas  = null;

/*
var camera = {
    pos   : [0, 0, 15],
    look  : [0, 0, -1],
    up    : [0, 1, 0],
    near  : 0.1,
    median: 30,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};
*/

var camera = {
    pos   : [-15, 0, 15],
    look  : v3.normalize([1, 0, -1]),
    up    : v3.normalize([1, 0, 1]),
    near  : 0.1,
    median: 30,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};

var cam3d = 0;
var menu_hidden = false;

var grabbed  = -1;
var mode     = 0;  // 0 - add, 1 - move, 2 - delete

var controls = []; // 1 control: x, y, x+vx, y+vy
var controlBuffer = null;
var curve = [];
var curveBuffer = null;
var fog = [];
var fogBuffer = null

var alpha     = 0.6;
var curve_pts = 70;
var back_col = [0.2, 0.2, 0.2];
var curv_col = [1.0, 0.6, 0.2];
var fog_col  = [1.0, 0.6, 0.2];
var cont_col = [0.0, 1.0, 1.0];
var halo_col = [1.0, 1.0, 1.0];

var projMatrix, modelMatrix, modelInvMatrix, viewMatrix;
var scale = 1;
var axis = 0;
var rotation = 0;
var rotdir = true;

var mouse_down_3d = false;
var grabbed = -1;
var cwidth, cheight;

var plane_max = 30;
var plane_div = 5;
var halo = [];
var haloBuffer = null;



var fillHalo = function ()
{
    var x,y;
    var d = plane_div;
    
    for (y=-plane_max ; y<plane_max ; y+=d)
    {
        for (x=-plane_max ; x<plane_max ; x+=d)
        {
            halo.push(x);   halo.push(y);
            halo.push(x);   halo.push(y+d);
            halo.push(x);   halo.push(y);
            halo.push(x+d); halo.push(y);
        }
    }
    
    x = plane_max;
    for (y=-plane_max ; y<plane_max ; y+=d)
    {
        halo.push(x);   halo.push(y);
        halo.push(x);   halo.push(y+d);
    }
    y = plane_max;
    for (x=-plane_max ; x<plane_max ; x+=d)
    {
        halo.push(x);   halo.push(y);
        halo.push(x+d); halo.push(y);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, haloBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(halo), gl.STATIC_DRAW);
};

var calc_fog = function ()
{
    fog = [];
    
    for (var i=0 ; i<curve.length/2 ; ++i)
    {
        for (var j=i+1 ; j<curve.length/2 ; ++j)
        {
            fog.push(curve[j*2]   + ((curve[i*2]   - curve[j*2])   / 2));
            fog.push(curve[j*2+1] + ((curve[i*2+1] - curve[j*2+1]) / 2));
            fog.push(Math.sqrt(Math.tan(Math.sqrt((curve[i*2] - curve[j*2]) * (curve[i*2] - curve[j*2]) + (curve[i*2+1] - curve[j*2+1]) * (curve[i*2+1] - curve[j*2+1])))));
        }
    }
    
    if (fog.length > 1)
    {
        if (fogBuffer) gl.deleteBuffer(fogBuffer);
        fogBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, fogBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fog), gl.DYNAMIC_DRAW);
    }
};

var calc_curve = function ()
{
    curve = [];
    
    for (var i=1 ; i<controls.length/4 ; ++i)
    {
        var t   = 0;
        var dt  = 1 / (curve_pts-1);
        var p3x, p3y, cx, cy;
        for (var j=0 ; j<curve_pts ; ++j)
        {
            p3x = 2*controls[i*4]   - controls[i*4+2];
            p3y = 2*controls[i*4+1] - controls[i*4+3];
            cx = (1-t)*(1-t)*(1-t)*controls[(i-1)*4]   + 3*t*(1-t)*(1-t)*controls[(i-1)*4+2] + 3*t*t*(1-t)*p3x + t*t*t*controls[i*4];
            cy = (1-t)*(1-t)*(1-t)*controls[(i-1)*4+1] + 3*t*(1-t)*(1-t)*controls[(i-1)*4+3] + 3*t*t*(1-t)*p3y + t*t*t*controls[i*4+1];
            curve.push(cx);
            curve.push(cy);
            t += dt;
        }
    }
    
    if (curve.length > 1)
    {
        if (curveBuffer) gl.deleteBuffer(curveBuffer);
        curveBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, curveBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(curve), gl.DYNAMIC_DRAW);
        
        calc_fog();
    }
};

var ray_zero_plane = function (p, v)
{
    var z = v3.matrixmul(modelMatrix, [0,0,1]);
    var lambda = -(p[0]*z[0]+p[1]*z[1]+p[2]*z[2]) / (v[0]*z[0]+v[1]*z[1]+v[2]*z[2]);
    
    return v3.matrixmul(modelInvMatrix, v3.add(p, v3.constmul(v, lambda)));
}

var mouse_pointer = function (event)
{
    var rect = canvas.getBoundingClientRect();
    var cw2  = cwidth/2;
    var ch2  = cheight/2;
    
    var x = (           event.clientX - rect.left  - cw2) / ch2; // [-asp,asp] >
    var y = (cheight - (event.clientY - rect.top)  - ch2) / ch2; // [ -1,  1]  ^
    
    var v = v3.init();
    
    if (cam3d === 0)
    {
        var vx = v3.constmul(v3.vectormul(camera.look, camera.up), x * Math.tan(camera.fovy / 2 ));
        var vy = v3.constmul(camera.up, y * Math.tan(camera.fovy / 2 ));
        
        v = v3.add(camera.look, v3.add(vx, vy));
        
        return ray_zero_plane(camera.pos, v);
    }
    else if (cam3d === 1)
    {
        var rad = 0.8;
        var l  = v3.length([x,y,0]);
        //var p0 = ray_zero_plane(camera.pos, camera.look);
        //var ll = v3.length(v3.sub(p0,camera.pos));
        var k  = Math.tan(l/rad) / (l);
        
        var vx = v3.constmul(v3.vectormul(camera.look, camera.up), x * k);
        var vy = v3.constmul(camera.up, y * k);
        
        v = v3.add(camera.look, v3.add(vx, vy));
        
        return ray_zero_plane(camera.pos, v);
    }
    
    retrun [0,0,0];
};

var grab = function (p, eps)
{
    for (var i=0 ; i<controls.length/2 ; ++i)
    {
        if (v3.length([controls[2*i] - p[0], controls[2*i+1] - p[1], 0]) < eps)
        {
            grabbed = i;
            return;
        }
    }
};
var grab_base = function (p, eps)
{
    for (var i=0 ; i<controls.length/2 ; i+=2)
    {
        if (v3.length([controls[2*i] - p[0], controls[2*i+1] - p[1], 0]) < eps)
        {
            grabbed = i;
            return;
        }
    }
};

var computeMatrices = function ()
{
    modelMatrix = tr.roty(axis);
    modelMatrix = m4.mul(tr.rotz(rotation), modelMatrix);
    modelMatrix = m4.mul(tr.scale(scale), modelMatrix);
    
    modelInvMatrix = tr.scale(1/scale);
    modelInvMatrix = m4.mul(tr.rotz(-rotation), modelInvMatrix);
    modelInvMatrix = m4.mul(tr.roty(-axis), modelInvMatrix);
    
    viewMatrix = tr.view(camera);
    projMatrix = tr.persp(camera);
};

var draw = function ()
{
    if (!gl) return;
    
    if (alpha < 0.99)
    {
        gl.disable(gl.DEPTH_TEST);
        gl.enable (gl.BLEND);
        //gl.blendFunc(gl.SRC_ALPHA, gl.SRC_ALPHA_SATURATE);
        //gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
    }
    else
    {
        gl.disable(gl.BLEND);
        gl.enable (gl.DEPTH_TEST);
    }
    
    if (!shader2) return;
    gl.useProgram(shader2.glprog);
    
    gl.clearColor(back_col[0], back_col[1], back_col[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    computeMatrices();
    
    if (cam3d === 0) gl.uniform1i(shader2.projPos, 0);
    else             gl.uniform1i(shader2.projPos, 1);
    
    gl.uniformMatrix4fv(shader2.pPos,  false, projMatrix);
    gl.uniformMatrix4fv(shader2.vmPos, false, m4.mul(modelMatrix, viewMatrix));
    gl.uniform1f(shader2.aspectPos, camera.aspect);
    gl.uniform1f(shader2.alphaPos, alpha);

    gl.uniform3f(shader2.colPos, halo_col[0], halo_col[1], halo_col[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, haloBuffer);
    gl.vertexAttribPointer(shader2.vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, halo.length/2);
    
    if (controls.length > 1)
    {
        if (controlBuffer) gl.deleteBuffer(controlBuffer);
        controlBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, controlBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(controls), gl.DYNAMIC_DRAW);
        gl.uniform3f(shader2.colPos, cont_col[0], cont_col[1], cont_col[2]);
        gl.uniform1f(shader2.psizePos, 6.0);
        gl.vertexAttribPointer(shader2.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, controls.length/2);
        gl.drawArrays(gl.LINES,  0, controls.length/2);
    }
    
    if (curve.length > 1)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, curveBuffer);
        gl.uniform3f(shader2.colPos, curv_col[0], curv_col[1], curv_col[2]);
        gl.uniform1f(shader2.psizePos, 2.0);
        gl.vertexAttribPointer(shader2.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, curve.length/2);
    }
    
    if (!shader3 || (fog.length < 2)) return;
    gl.useProgram(shader3.glprog);
    
    if (cam3d === 0) gl.uniform1i(shader3.projPos, 0);
    else             gl.uniform1i(shader3.projPos, 1);
    
    gl.uniformMatrix4fv(shader3.pPos,  false, projMatrix);
    gl.uniformMatrix4fv(shader3.vmPos, false, m4.mul(modelMatrix, viewMatrix));
    gl.uniform1f(shader3.aspectPos, camera.aspect);
    gl.uniform1f(shader3.alphaPos, alpha);
    gl.uniform3f(shader3.colPos, fog_col[0], fog_col[1], fog_col[2]);
    gl.uniform1f(shader3.psizePos, 2.0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, fogBuffer);
    gl.vertexAttribPointer(shader3.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, fog.length/3);
};

var zoomin  = function () { scale *= 1.25; };
var zoomout = function () { scale *= 0.8;  };

var handleWheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
    
    draw();
}

var handleMouseDown = function (event)
{
    if (event.button === 1)
    {
        mouse_down_3d = true;
        
        if ((axis > 90) && (axis < 270))
        {
            rotdir = false;
        }
        else
        {
            rotdir = true;
        }
    }
    else if (event.button === 0)
    {
        if (mode === 0)
        {
            //++pn;
            var mp = mouse_pointer(event);
            if (mp[0] > 2*plane_max || mp[0] < -2*plane_max || mp[1] > 2*plane_max || mp[1] < -2*plane_max) return;
            
            var p  = [mp[0], mp[1]];
            var pc = [mp[0]+3, mp[1]];
            controls.push(p[0]);
            controls.push(p[1]);
            controls.push(pc[0]);
            controls.push(pc[1]);
            calc_curve();
            draw();
        }
        else if (mode === 1)
        {
            grab(mouse_pointer(event), 0.27/scale);
        }
        else if (mode === 2)
        {
            grab_base(mouse_pointer(event), 0.27/scale);
            if (grabbed >= 0)
            {
                controls.splice(grabbed*2, 4);
            }
            grabbed = -1;
            calc_curve();
            draw();
        }
    }
};

var handleMouseUp = function (event)
{
    mouse_down_3d = false;
    grabbed = -1;
};

var handleMouseMove = function (event)
{
    if (mouse_down_3d)
    {
        axis -= event.movementY*0.25;
        if (rotdir)
        {
            rotation += event.movementX*0.25;
        }
        else
        {
            rotation -= event.movementX*0.25;
        }
        // Ensure [0,360]
        axis = axis - Math.floor(axis/360.0)*360.0;
        rotation = rotation - Math.floor(rotation/360.0)*360.0;
        
        draw();
    }
    else if (grabbed >= 0)
    {
        var d = mouse_pointer(event);
        
        controls[grabbed*2]   = d[0];
        controls[grabbed*2+1] = d[1];
        /*
        if (grabbed % 2 === 0)
        {
            controls[grabbed*2+2] += d[0];
            controls[grabbed*2+3] += d[1];
        }
        */
        
        calc_curve();
        draw();
    }
};

var handleKeyDown = function (event)
{
    if (event.key === "w")
    {
        camera.pos[2] += 1;
    }
    else if (event.key === "s")
    {
        camera.pos[2] -= 1;
    }
    else if (event.key === "i")
    {
        cam3d++;
        if (cam3d > 1) cam3d = 0;
    }
    else if (event.key === "0")
    {
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
    
    draw();
};

var resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    camera.aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

var init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gl     = glprog.get_context_2('canvas');
    canvas.addEventListener("mousedown", handleMouseDown);
    
    resize();
    
    haloBuffer    = gl.createBuffer();
    fillHalo();
    
    shader2 = glprog.create_vf_program(
                    gl,
                    shaders.version + shaders.vs2,
                    shaders.version + shaders.precision + shaders.fs);
        
    shader2.vertexPosition = gl.getAttribLocation(shader2.glprog, "position");
    gl.enableVertexAttribArray(shader2.vertexPosition);
    shader2.pPos      = gl.getUniformLocation(shader2.glprog, "p");
    shader2.vmPos     = gl.getUniformLocation(shader2.glprog, "vm");
    shader2.projPos   = gl.getUniformLocation(shader2.glprog, "proj");
    shader2.aspectPos = gl.getUniformLocation(shader2.glprog, "aspect");
    shader2.colPos    = gl.getUniformLocation(shader2.glprog, "col");
    shader2.alphaPos  = gl.getUniformLocation(shader2.glprog, "alpha");
    shader2.psizePos  = gl.getUniformLocation(shader2.glprog, "pointsize");
    
    shader3 = glprog.create_vf_program(
                    gl,
                    shaders.version + shaders.vs3,
                    shaders.version + shaders.precision + shaders.fs);
        
    shader3.vertexPosition = gl.getAttribLocation(shader3.glprog, "position");
    gl.enableVertexAttribArray(shader3.vertexPosition);
    shader3.pPos      = gl.getUniformLocation(shader3.glprog, "p");
    shader3.vmPos     = gl.getUniformLocation(shader3.glprog, "vm");
    shader3.projPos   = gl.getUniformLocation(shader3.glprog, "proj");
    shader3.aspectPos = gl.getUniformLocation(shader3.glprog, "aspect");
    shader3.colPos    = gl.getUniformLocation(shader3.glprog, "col");
    shader3.alphaPos  = gl.getUniformLocation(shader3.glprog, "alpha");
    shader3.psizePos  = gl.getUniformLocation(shader3.glprog, "pointsize");
    
    draw();
};

var toggle_mode = function ()
{
    ++mode; if (mode > 2) mode = 0;
    
    var msp = document.getElementById('mode_span');
    if      (mode === 0) msp.innerHTML = 'Mouse left: Add';
    else if (mode === 1) msp.innerHTML = 'Mouse left: Move';
    else                 msp.innerHTML = 'Mouse left: Delete';
}

var set_division = function (strval)
{
    var ival = parseInt(strval);
    if (isNaN(ival)) return;
    
    curve_pts = ival;
    calc_curve();
    draw();
};

var set_a = function (strval)
{
    var ival = parseFloat(strval);
    if (isNaN(ival)) return;
    
    alpha = ival;
    draw();
};

window.toggle_mode  = toggle_mode;
window.set_division = set_division;
window.set_a        = set_a;

document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
window.addEventListener("resize", function() { resize(); draw(); });

document.addEventListener("DOMContentLoaded", init);
