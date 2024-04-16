
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";
import { obj }        from "./obj.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let texture = null;

let floater = -1;
let floater_rot = 0;
let highlight = null;
let hmat = m4.init();

let building_count = 8;
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

// 0 - CLR
// 1 - ADD
// 2 - DEL
// 3 - VIE
let mode = 'CLR';

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
let camera_vie = {
    pos   : [0, 0, 0.2],
    look  : [1, 0, 0],
    up    : [0, 0, 1],
    near  : 0.1,
    median: 10,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1,
    
    move_k : 0.01,
    rot_k  : 0.1,
    
    move_ws : 0,
    move_ad : 0
};

let cam_constrain = function ()
{
    camera_vie.look = v3.normalize(camera_vie.look);
    
    let up2 = v3.cross(camera_vie.look, camera_vie.up);
    
    camera_vie.up = v3.cross(up2, camera_vie.look);
    camera_vie.up = v3.normalize(camera_vie.up);
};

let compute_matrices = function ()
{
    modlmat = tr.rotz(rotation);
    modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis), modlmat);
    modlmat = m4.mul(tr.scale(scale), modlmat);
    
    modinvmat = tr.scale(1/scale);
    modinvmat = m4.mul(tr.rotz(-rotation), modinvmat);
    modinvmat = m4.mul(tr.roty(-axis), modinvmat);
    
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

var ray_zero_plane = function (p, v)
{
    var z = v3.mmul(modlmat, [0,0,1]);
    var lambda = -(p[0]*z[0]+p[1]*z[1]+p[2]*z[2]) / (v[0]*z[0]+v[1]*z[1]+v[2]*z[2]);
    
    return v3.mmul(modinvmat, v3.add(p, v3.cmul(v, lambda)));
}

var mouse_pointer = function (event)
{
    var rect = canvas.getBoundingClientRect();
    var cw2  = cwidth/2;
    var ch2  = cheight/2;
    
    var x = (           event.clientX - rect.left  - cw2) / ch2; // [-asp,asp] >
    var y = (cheight - (event.clientY - rect.top)  - ch2) / ch2; // [ -1,  1]  ^
    
    var v = v3.init();
    
    if (proj === 0 || proj === 1)
    {
        var vx = v3.cmul(v3.cross(camera.look, camera.up), x * Math.tan(camera.fovy / 2 ));
        var vy = v3.cmul(camera.up, y * Math.tan(camera.fovy / 2 ));
        
        v = v3.add(camera.look, v3.add(vx, vy));
        let p = v3.add(camera.pos, v3.add(vx, vy));
        
        return (proj === 1) ? ray_zero_plane(camera.pos, v) : ray_zero_plane(p, v);
    }
    else if (proj === 2)
    {
        var rad = 0.8;
        var l  = v3.length([x,y,0]);
        //var p0 = ray_zero_plane(camera.pos, camera.look);
        //var ll = v3.length(v3.sub(p0,camera.pos));
        var k  = Math.tan(l/rad) / (l);
        
        var vx = v3.cmul(v3.cross(camera.look, camera.up), x * k);
        var vy = v3.cmul(camera.up, y * k);
        
        v = v3.add(camera.look, v3.add(vx, vy));
        
        return ray_zero_plane(camera.pos, v);
    }
    
    retrun [0,0,0];
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

let draw_floater = function (i)
{
    let aaa = 1 / Math.sqrt(6);
    let cam = {
        pos   : [5, 5, 9],
        look  : v3.normalize([-1, -1, -1]),
        up    : [-aaa, -aaa, 2*aaa],
        near  : 0.1,
        median: 10,
        far   : 1000,
        fovy  : Math.PI / 3,
        aspect: 1
    };
    
    let vmm = tr.view(cam);
    let pmm = tr.persp(cam);
    
    let mm = tr.rotz(rotation);
    mm = m4.mul(tr.rotz(floater_rot), mm);
    mm = m4.mul(tr.rot(v3.cross(cam.up, cam.look), axis), mm);
    mm = m4.mul(tr.scale(5), mm);
    
    gl.uniformMatrix4fv(glprog.p,  true, pmm);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(vmm, mm));
    
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
};
let draw_piece = function (m, c)
{
    let vmm = tr.view(c);
    let pmm = tr.persp(c);
    
    let mm = m4.init();
    mm = m4.mul(tr.rotz(rotation), mm);
    mm = m4.mul(tr.rotz(m.rot), mm);
    mm = m4.mul(tr.rot(v3.cross(c.up, c.look), axis), mm);
    mm = m4.mul(tr.scale(scale), mm);
    mm = m4.mul(tr.translate(m.pos), mm);
    
    gl.uniformMatrix4fv(glprog.p,  true, pmm);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(vmm, mm));
    
    if (objtype === 1)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, models[m.i].linbuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.LINES, 0, models[m.i].lines.length / 5);
    }
    
    if (objtype >= 2)
    {
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, models[m.i].tribuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.TRIANGLES, 0, models[m.i].tris.length / 5);
        
        gl.disable(gl.POLYGON_OFFSET_FILL);
    }
};
let draw_editor = function ()
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
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    //if (!texture) { return; }
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(glprog.sampler, 0);
    
    //gl.uniform1f(glprog.alpha, alpha);
    
    if (draw_grid && grid.lines.length > 0)
    {
        gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, grid.buf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.LINES, 0, grid.lines.length / 5);
    }
    
    for (let i=0 ; i<grid.models.length ; ++i)
    {
        draw_piece(grid.models[i], camera);
    }
    
    if (mode === 'ADD' || mode === 'DEL')
    {
        gl.uniformMatrix4fv(glprog.vm, true, m4.mul(m4.mul(viewmat, modlmat), hmat));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, highlight);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    if (floater >= 0)
    {
        gl.viewport(0, 0, 200, 200);
        gl.clearColor(0, 0, 0, 1.0);
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(0, 0, 200, 200);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        draw_floater(floater);
        
        gl.disable(gl.SCISSOR_TEST);
        gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
};

let draw_vie_piece = function (m, c)
{
    let vmm = tr.view(c);
    let pmm = tr.persp(c);
    
    let mm = tr.rotz(m.rot);
    mm = m4.mul(tr.scale(1), mm);
    mm = m4.mul(tr.translate(m.pos), mm);
    
    gl.uniformMatrix4fv(glprog.p,  true, pmm);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(vmm, mm));
    
    if (objtype === 1)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, models[m.i].linbuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.LINES, 0, models[m.i].lines.length / 5);
    }
    
    if (objtype >= 2)
    {
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, models[m.i].tribuf);
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 5*4, 0*4);
        gl.vertexAttribPointer(glprog.tex, 2, gl.FLOAT, false, 5*4, 3*4);
        gl.drawArrays(gl.TRIANGLES, 0, models[m.i].tris.length / 5);
        
        gl.disable(gl.POLYGON_OFFSET_FILL);
    }
};
let draw_vie = function ()
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
    
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    //if (!texture) { return; }
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(glprog.sampler, 0);
    
    //gl.uniform1f(glprog.alpha, alpha);
    
    for (let i=0 ; i<grid.models.length ; ++i)
    {
        draw_vie_piece(grid.models[i], camera_vie);
    }
};

let draw = function ()
{
    if (mode === 'VIE') draw_vie();
    else                draw_editor();
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
    
    if (mode === 'ADD' && event.button === 0)
    {
        for (let i=0 ; i<grid.models.length ; ++i)
        {
            if (grid.models[i].pos[0] == hmat[3] && grid.models[i].pos[1] == hmat[7])
            {
                grid.models[i].i   = floater;
                grid.models[i].rot = floater_rot;
                draw();
                return;
            }
        }
        grid.models.push( { i:floater, pos:[hmat[3], hmat[7], 0], rot:floater_rot } )
        draw();
    }
    else if (mode === 'DEL' && event.button === 0)
    {
        for (let i=0 ; i<grid.models.length ; ++i)
        {
            if (grid.models[i].pos[0] == hmat[3] && grid.models[i].pos[1] == hmat[7])
            {
                grid.models.splice(i,1);
                draw();
                return;
            }
        }
    }
};
let handle_mouse_up = function (event)
{
    grabbed = 0;
};

let handle_mouse_move = function (event)
{
    if (mode !== 'VIE')
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
    else
    {
        if (!modlmat) return;
        if (mode === 'CLR') return;
            
        let mp = mouse_pointer(event);
        if (mp[0] > 1000 || mp[0] < -1000 || mp[1] > 1000 || mp[1] < -1000) return;
        hmat = tr.translate( [Math.floor(mp[0]+0.5), Math.floor(mp[1]+0.5), 0] );
        draw();
    }
    
    }
    else // VIE
    {
        
    if (grabbed === 1)
    {
        let zi   = [0, 0, 1];
        let left = v3.cross(camera_vie.up, camera_vie.look);
        let qx = tr.rot(zi,   -camera_vie.rot_k*event.movementX);
        let qy = tr.rot(left,  camera_vie.rot_k*event.movementY);
        
        let nu = v3.mmul(qy, camera_vie.up);
        let nl = v3.mmul(qy, camera_vie.look);
        
        if (nu[2] > 0.001)
        {
            camera_vie.up   = nu;
            camera_vie.look = nl;
        }
        
        camera_vie.up   = v3.mmul(qx, camera_vie.up);
        camera_vie.look = v3.mmul(qx, camera_vie.look);
        
        cam_constrain();
    }
    
    }
};

let handle_vie_key_up = function (event)
{
    if (mode !== 'VIE') return;
    
    if (event.key === "w" || event.key === "W")
    {
        camera_vie.move_ws = 0;
    }
    else if (event.key === "s" || event.key === "S")
    {
        camera_vie.move_ws = 0;
    }
    else if (event.key === "a" || event.key === "A")
    {
        camera_vie.move_ad = 0;
    }
    else if (event.key === "d" || event.key === "D")
    {
        camera_vie.move_ad = 0;
    }
};
let handle_vie_key_down = function (event)
{
    if (event.key === "w" || event.key === "W")
    {
        camera_vie.move_ws = 1;
    }
    else if (event.key === "s" || event.key === "S")
    {
        camera_vie.move_ws = -1;
    }
    else if (event.key === "a" || event.key === "A")
    {
        camera_vie.move_ad = 1;
    }
    else if (event.key === "d" || event.key === "D")
    {
        camera_vie.move_ad = -1;
    }
    else if (event.key === "v" || event.key === "V")
    {
        mode = 'CLR';
        draw();
    }
};
let handle_key_down = function (event)
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
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    
    
    
    if (mode === 'VIE')
    {
        handle_vie_key_down(event);
        return;
    }
    
    if (event.key === "b" || event.key === "B")
    {
        mode = 'ADD';
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
        mode = 'ADD';
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
    else if (event.key === "Delete")
    {
        mode = 'DEL'
        floater = -1;
        draw();
    }
    else if (event.key === "c" || event.key === "C")
    {
        mode = 'CLR'
        floater = -1;
        draw();
    }
    else if (event.key === "v" || event.key === "V")
    {
        mode = 'VIE';
        floater = -1;
        camera_vie.pos  = [0, 0, 0.2];
        camera_vie.look = [1, 0, 0];
        camera_vie.up   = [0, 0, 1];
        
        window.requestAnimationFrame(tick);
    }
    else if (event.key === " ")
    {
        floater_rot += 90;
        if (floater_rot > 360) floater_rot = 0;
        draw();
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

let cam_move = function ()
{
    if (camera_vie.move_ws)
    {
        camera_vie.pos[0] += camera_vie.look[0] * camera_vie.move_k*camera_vie.move_ws;
        camera_vie.pos[1] += camera_vie.look[1] * camera_vie.move_k*camera_vie.move_ws;
    }
    
    if (camera_vie.move_ad)
    {
        let d = v3.cross(camera_vie.up, camera_vie.look);
        d[2] = 0;
        d = v3.normalize(d);
        camera_vie.pos = v3.add(camera_vie.pos, v3.cmul(d, camera_vie.move_k*camera_vie.move_ad));
    }
};

let tick = function ()
{
    if (mode === 'VIE')
    {
        cam_move();
        draw();
        window.requestAnimationFrame(tick);
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
    camera.aspect     = cwidth / cheight;
    camera_vie.aspect = cwidth / cheight;
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
    
    
    let hgeom = [-0.5, -0.5, 0,   0.334371, 0.22,
                  0.5, -0.5, 0,   0.334371, 0.219533,
                  0.5,  0.5, 0,   0.334371, 0.22,
                  0.5,  0.5, 0,   0.334371, 0.22,
                 -0.5,  0.5, 0,   0.334371, 0.219533,
                 -0.5, -0.5, 0,   0.334371, 0.22];
    highlight = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, highlight);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hgeom), gl.STATIC_DRAW);
                 
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
    
    draw();
};


window.set_alpha = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
document.addEventListener("keyup", handle_vie_key_up);
window.addEventListener("resize", function() { resize(); draw(); });
