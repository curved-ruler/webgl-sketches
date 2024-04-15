
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";
import { obj }        from "./obj.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let texture = null;

let building_count = 8;
let floater = -1;
let floater_rot = 0;
let models = [
    { name : 'building_A.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'building_B.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'building_C.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'building_D.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'building_E.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'building_F.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'building_G.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'building_H.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    
    { name : 'road_corner_curved.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'road_corner.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'road_junction.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'road_straight_crossing.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'road_straight.obj', tris:[], lines:[], tribuf:null, linbuf:null },
    { name : 'road_tsplit.obj', tris:[], lines:[], tribuf:null, linbuf:null }
];
let grid   = { models:[], lines:[], buf:null };
let limits = [0,0,0,0];

let tribuf = null;
let linbuf = null;

let draw_grid = true;

let bcol  = [0.2, 0.2, 0.2];
let tcol  = [0.0, 0.0, 0.0];
let lcol  = [0.0, 1.0, 1.0];
let alpha = 1.0;
let alpha_dom = null;

let menu_hidden = false;

let objtype = 1;
let proj = 1;
let projmat, modlmat, viewmat, modinvmat;
let scale    = 1;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;


let a = 1 / Math.sqrt(6);
let camera = {
    pos   : [5, 5, 9],
    look  : v3.normalize([-1, -1, -1]),
    up    : [-a, -a, 2*a],
    near  : 0.1,
    median: 10,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};

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

let make_grid = function ()
{
    grid.lines = [];
    if (grid.buf !== null) { gl.deleteBuffer(grid.buf); }
    
    for (let y=limits[2]-1 ; y<=limits[3]+1 ; ++y)
    {
        for (let x=limits[0]-1 ; x<=limits[1]+1 ; ++x)
        {
            grid.lines.push(x-0.5,y-0.5,0,   0.334371, 0.22);
            grid.lines.push(x+0.5,y-0.5,0,   0.334371, 0.219533);
            
            grid.lines.push(x-0.5,y-0.5,0,   0.334371, 0.22);
            grid.lines.push(x-0.5,y+0.5,0,   0.334371, 0.219533);
        }
    }
    for (let i=limits[0]-1 ; i<=limits[1]+1 ; ++i)
    {
            grid.lines.push(i-0.5,limits[3]+1.5,0,   0.334371, 0.22);
            grid.lines.push(i+0.5,limits[3]+1.5,0,   0.334371, 0.219533);
    }
    for (let i=limits[2]-1 ; i<=limits[3]+1 ; ++i)
    {
            grid.lines.push(limits[1]+1.5,i-0.5,0,   0.334371, 0.22);
            grid.lines.push(limits[1]+1.5,i+0.5,0,   0.334371, 0.219533);
    }
    
    grid.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, grid.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid.lines), gl.STATIC_DRAW);
};

let fetch_objfile = function (y_up)
{
    for (let i=0 ; i<models.length ; ++i)
    {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function()
        {
            if (xhr.readyState === 4 && xhr.status === 200)
            {
                let model = obj.create(xhr.responseText, 0.5, true);
                make_object(i, model);
            }
        }
        xhr.open('GET', 'obj/' + models[i].name, true);
        xhr.send(null);
    }
}
let make_object = function (i, model)
{
    for (let m=0 ; m<model.tris.length ; ++m) { models[i].tris.push(model.tris[m]); }
    if (models[i].tris.length > 0)
    {
        models[i].tribuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, models[i].tribuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.tris), gl.STATIC_DRAW);
    }
    
    for (let m=0 ; m<model.lines.length ; ++m) { models[i].lines.push(model.tris[m]); }
    if (models[i].lines.length > 0)
    {
        models[i].linbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, models[i].linbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.lines), gl.STATIC_DRAW);
    }
    
    //console.log("V", model.verts.length, "T", model.faces.length, "L", model.lines.length);
};

let draw_one = function (i)
{
    modlmat = tr.rotz(rotation);
    modlmat = m4.mul(tr.rotz(floater_rot), modlmat);
    modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis), modlmat);
    modlmat = m4.mul(tr.scale(scale), modlmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    
    if (objtype === 1)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, models[i].linbuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.LINES, 0, models[i].lines.length / 5);
    }
    
    if (objtype >= 2)
    {
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, models[i].tribuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.TRIANGLES, 0, models[i].tris.length / 5);
        
        gl.disable(gl.POLYGON_OFFSET_FILL);
    }
}
let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    if (alpha < 0.99)
    {
        //gl.enable(gl.BLEND);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    //if (!texture) { return; }
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(glprog.sampler, 0);
    
    //gl.uniform1f(glprog.alpha, alpha);
    
    
    if (draw_grid && grid.lines.length > 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, grid.buf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.LINES, 0, grid.lines.length / 5);
    }
    /*
    if (objtype === 1 && model.lines.length > 0)
    {
        //gl.depthMask(true);
        gl.bindBuffer(gl.ARRAY_BUFFER, linbuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.LINES, 0, model.lines.length / 5);
    }
    
    if (objtype >= 2 && model.faces.length > 0)
    {
        //gl.depthMask(false);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, tribuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.TRIANGLES, 0, model.faces.length / 5);
        
        gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    */
    
    if (floater >= 0)
    {
        gl.viewport(0, 0, 200*camera.aspect, 200);
        gl.clearColor(0, 0, 0, 1.0);
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(0, 0, 200*camera.aspect, 200);

        let oldscale = scale;
        scale = 8;
        compute_matrices();
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        draw_one(floater);
        
        scale = oldscale;
        compute_matrices();
        
        gl.disable(gl.SCISSOR_TEST);
        gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
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
let handle_key_down = function ()
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
    else if (event.key === "o" || event.key === "O")
    {
        ++objtype;
        if (objtype > 2) { objtype = 1; }
        draw();
    }
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) { proj = 0; }
        draw();
    }
    else if (event.key === "b" || event.key === "B")
    {
        if (floater >= -1 && floater < building_count-1)
        {
            ++floater;
        }
        else
        {
            floater = 0;
        }
        draw();
    }
    else if (event.key === "r" || event.key === "R")
    {
        if (floater >= building_count && floater < models.length-1)
        {
            ++floater;
        }
        else
        {
            floater = building_count;
        }
        draw();
    }
    else if (event.key === "d" || event.key === "D")
    {
        floater = -1;
        draw();
    }
    else if (event.key === " ")
    {
        floater_rot += 90;
        if (floater_rot > 360) floater_rot = 0;
        draw();
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
        scale    = 1;
        draw();
    }
};
let set_alpha = function (strval)
{
    let ival = Number(strval);
    
    if (isNaN(ival) || ival === undefined || ival === null) return;
    if (ival < 0)   ival = 0;
    if (ival > 1.0) ival = 1.0;
    
    alpha = ival;
    alpha_dom.blur();
    
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

let load_texture = function (name)
{
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([255, 255, 255, 255]));
    
    // Asynchronously load an image
    let image = new Image();
    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    });
    image.src = name;
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id);
    
    let vs_tex = shaders.vs_tex.replace('$FUNC$', shaders.func);
    glprog = gl_init.create_glprog(gl, shaders.version + vs_tex, shaders.version + shaders.precision + shaders.fs_tex);
    
    glprog.pos = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    glprog.tex = gl.getAttribLocation(glprog.bin, "tex");
    gl.enableVertexAttribArray(glprog.tex);
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.sampler = gl.getUniformLocation(glprog.bin, "texsampler");
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    //gl.clearDepth(1); = default
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    alpha_dom = document.getElementById('alpha');
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == 0.5) { opts.selectedIndex = i; }
    }
    
    load_texture("citybits_texture.png");
    
    resize();
    make_grid();
    fetch_objfile();
};


window.set_alpha = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
