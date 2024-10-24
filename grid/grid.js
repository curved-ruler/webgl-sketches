
import { saveAs } from './FileSaver.js';

import { gl_init }          from "./gl_init.js";
import { shaders }          from "./shaders.js";
import { m4, v3, quat, tr } from "./matvec.js";
import { generators }       from "./generators.js";
import { Grid_UI }          from "./grid_ui.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let gui = null;

let grid   = {
    N:128,
    H:[],
    C:[],
    tris:[],   lines:[],  points:[],
    tbuf:null, lbuf:null, pbuf:null
};
let nn_dom = null;

let menu_hidden = false;

let colmode = 0;
let proj = 1;
let obj  = 1;
let projmat, modlmat, viewmat;
let modinvmat;
let scale    = 1.0;
let axis     = 0;
let rotation = 0;
let rotdir   = true;
let grabbed  = 0;




let camera = {
    upcam : false,
    pos   : [50, 50, 50],
    look  : v3.normalize([-1, -1, -1]),
    up    : v3.normalize([-1, -1,  2]),
    near  : 10,
    median: 30,
    //far   : 86,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};
let compute_matrices = function ()
{
    modlmat = m4.init();
    modlmat = m4.mul(tr.translate([-grid.N/2, -grid.N/2, 0]), modlmat);
    modlmat = m4.mul(tr.rotz(rotation), modlmat);
    modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis), modlmat);
    modlmat = m4.mul(tr.scale(scale), modlmat);
    /*
    modinvmat = tr.scale(1/scale);
    modinvmat = m4.mul(tr.translate([-trans[0], -trans[1], 0]), modinvmat);
    modinvmat = m4.mul(tr.rotz(-rotation), modinvmat);
    modinvmat = m4.mul(tr.roty(-axis), modinvmat);
    */
    viewmat = tr.view(camera);
    projmat = (proj === 0) ? tr.axon(camera) : tr.persp(camera);
};



let error = function (m)
{
    console.error(m);
    window.alert(m);
}



let save_terr = function ()
{
    let buffer = new ArrayBuffer(2*4 + (grid.N+1)*(grid.N+1)*2*4);
    let view   = new DataView(buffer);
    
    view.setUint32(0, grid.N);
    view.setUint32(4, grid.N);
    
    for (let i=0 ; i<=grid.N ; ++i)
    for (let j=0 ; j<=grid.N ; ++j)
    {
        view.setFloat32((i*grid.N + j)*4, grid.H[i*grid.N + j]);
    }
    for (let i=0 ; i<=grid.N ; ++i)
    for (let j=0 ; j<=grid.N ; ++j)
    {
        view.setFloat32((grid.N+1)*(grid.N+1)*4 + (i*grid.N + j)*4, grid.C[i*grid.N + j]);
    }

    let blob = new Blob([buffer], {type: "model/gltf-binary"});
    saveAs(blob, 'grid.terr');
};

let init_grid = function ()
{
    grid.H = [...Array( (grid.N+1)*(grid.N+1) )].map(i=>0);
    grid.C = [...Array( (grid.N+1)*(grid.N+1) )].map(i=>4294967295);
    grid_to_gpu();
};
let getcol = function (cs, h)
{
    let i=0;
    let n=cs.cols.length/3
    while (i<n-1 && cs.limits[i]<h) i+=1;
    return [cs.cols[i*3], cs.cols[i*3+1], cs.cols[i*3+2]];
};
let mix = function (a, b, sub, i)
{
    return (a*(sub-i) + b*(i)) / (sub);
};
let col_grid = function ()
{
    let c = gui.get_colsch();
    let hpal = structuredClone(c);
    
    if (c.blend > 1)
    {
        hpal.limits = [];
        hpal.cols   = [];
        
        hpal.limits.push(c.limits[0]);
        hpal.cols.push(c.cols[0], c.cols[1], c.cols[2]);
        
        let n = c.cols.length/3;
        for (let p=1 ; p < n ; ++p)
        {
            for (let i = 0 ; i<c.blend ; ++i)
            {
                hpal.limits.push( mix(c.limits[p-1], c.limits[p], c.blend, i) );
                
                hpal.cols.push( mix(c.cols[(p-1)*3],   c.cols[p*3],   c.blend, i) );
                hpal.cols.push( mix(c.cols[(p-1)*3+1], c.cols[p*3+1], c.blend, i) );
                hpal.cols.push( mix(c.cols[(p-1)*3+2], c.cols[p*3+2], c.blend, i) );
            }
        }
        
        hpal.limits.push(c.limits[c.limits.length-1]);
        hpal.cols.push(c.cols[(n-1)*3], c.cols[(n-1)*3 + 1], c.cols[(n-1)*3 + 2]);
    }
    
    for (let j=0 ; j<grid.N ; ++j)
    for (let i=0 ; i<grid.N ; ++i)
    {
        let col = getcol(hpal, grid.H[j*(grid.N+1)+i]);
        let r = Math.floor(col[0]*255);
        let g = Math.floor(col[1]*255);
        let b = Math.floor(col[2]*255);
        grid.C[j*(grid.N+1)+i] = (r*16777216) + (g*65536) + (b*256);
    }
};
let grid_to_gpu = function ()
{
    grid.tris   = [];
    grid.lines  = [];
    grid.points = [];
    
    for (let j=0 ; j<grid.N ; ++j)
    for (let i=0 ; i<grid.N ; ++i)
    {
        let col = grid.C[ j   *(grid.N+1)+i];
        
        let h0  = grid.H[ j   *(grid.N+1)+i];
        let h1  = grid.H[(j+1)*(grid.N+1)+i];
        let h2  = grid.H[ j   *(grid.N+1)+i+1];
        let h3  = grid.H[(j+1)*(grid.N+1)+i+1];
        
        let a = col % 256;
        col = Math.floor((col-a)/256);
        let b = col % 256;
        col = Math.floor((col-b)/256);
        let g = col % 256;
        col = Math.floor((col-g)/256);
        let r = col % 256;
        
        let va = [ 1, 0, h1-h0 ];
        let vb = [ 0, 1, h2-h0 ];
        let norm = v3.cross(va,vb);
        
        grid.tris.push(i,   j+1,  h1, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        grid.tris.push(i,   j,    h0, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        grid.tris.push(i+1, j,    h2, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        
        grid.tris.push(i+1, j,    h2, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        grid.tris.push(i+1, j+1,  h3, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        grid.tris.push(i,   j+1,  h1, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        
        
        grid.lines.push(i,   j,   h0, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        grid.lines.push(i+1, j,   h2, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        
        grid.lines.push(i,   j,   h0, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        grid.lines.push(i,   j+1, h1, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        
        
        grid.points.push(i,  j,   h0, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        
        if (j==grid.N-1)
        {
            grid.lines.push(i,    j+1, h1, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
            grid.lines.push(i+1,  j+1, h3, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
            grid.points.push(i,   j+1, h1, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        }
        if (i==grid.N-1)
        {
            grid.lines.push(i+1,  j,   h2, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
            grid.lines.push(i+1,  j+1, h3, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
            grid.points.push(i+1, j,   h2, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        }
        if (j==grid.N-1 && i == grid.N-1)
        {
            grid.points.push(i+1, j+1,  h3, r/255, g/255, b/255,  norm[0], norm[1], norm[2]);
        }
    }
    
    gl.deleteBuffer(grid.tbuf);
    gl.deleteBuffer(grid.lbuf);
    gl.deleteBuffer(grid.pbuf);
    grid.tbuf = gl.createBuffer();
    grid.lbuf = gl.createBuffer();
    grid.pbuf = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, grid.tbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid.tris),   gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, grid.lbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid.lines),  gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, grid.pbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid.points), gl.STATIC_DRAW);
    
    //console.log("V", model.verts.length, "L", model.lines.length);
};

let diamond_square = function()
{
    generators.diamond_square(grid, gui.get_ds_w());
    col_grid();
    grid_to_gpu();
    draw();
};
let level = function ()
{
    generators.level(grid, gui.get_levels(), gui.get_lev_c());
    grid_to_gpu();
    draw();
};
let kernel_init = function ()
{
    generators.kernel_init(grid, 50);
    col_grid();
    grid_to_gpu();
    draw();
};
let kernel = function ()
{
    try
    {
        let base = Function('X', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', gui.get_kernel_dom().value);
        generators.kernel(grid, base, gui.get_kmin(), gui.get_kmax());
        col_grid();
        grid_to_gpu();
        draw();
    }
    catch (err) { error("kernel func error!\n" + err.message); return; }
};
let add_noise = function ()
{
    try
    {
        let base = Function('x', 'y', gui.get_noise_dom().value);
        let oct  = gui.get_n_oct();
        let amp  = gui.get_n_amp();
        let lam  = gui.get_n_lambda();
        generators.noise(grid, oct, amp, lam, base);
        col_grid();
        grid_to_gpu();
        draw();
    }
    catch (err) { error("noise func error!\n" + err.message); return; }
};
let reset = function ()
{
    for (let y=0 ; y<=grid.N ; y+=1)
    for (let x=0 ; x<=grid.N ; x+=1)
    {
        grid.H[y*(grid.N+1) + x] = 0;
    }
    grid_to_gpu();
    draw();
};

let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    let alpha = gui.get_alpha();
    if (alpha < 0.99)
    {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.blendFunc(gl.DST_ALPHA, gl.ONE_MINUS_DST_ALPHA);
        gl.disable(gl.DEPTH_TEST);
    }
    else
    {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
    }
    
    let bcol = gui.get_bcol();
    let lcol = gui.get_lcol();
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    gl.uniform1f(glprog.alpha,   alpha);
    gl.uniform1i(glprog.colmode, colmode);
    gl.uniform3fv(glprog.defcol, lcol);
    
    if ((obj === 0 || obj === 3 || obj === 5) && grid.pbuf !== null)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, grid.pbuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
        gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
        gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
        gl.uniform1i(glprog.shaded, obj === 3 ? 0 : 1);
        gl.drawArrays(gl.POINTS, 0, grid.points.length / 9);
    }
    
    if ((obj === 1 || obj === 4 || obj === 5) && grid.lbuf !== null)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, grid.lbuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
        gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
        gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
        gl.uniform1i(glprog.shaded, obj === 4 ? 0 : 1);
        gl.drawArrays(gl.LINES, 0, grid.lines.length / 9);
    }
    
    if ((obj === 2 || obj === 3 || obj === 4) && grid.tbuf !== null)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, grid.tbuf);
        gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
        gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
        gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
        gl.uniform1i(glprog.shaded, 1);
        
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        gl.drawArrays(gl.TRIANGLES, 0, grid.tris.length / 9);
        gl.disable(gl.POLYGON_OFFSET_FILL);
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
        if (event.ctrlKey)
        {
            panz -= event.movementY*0.1;
        }
        else
        {
            axis -= event.movementY*0.25;
            rotation += rotdir ? event.movementX*0.25 : event.movementX*-0.25;
            
            // Ensure [0,360]
            axis = axis - Math.floor(axis/360.0)*360.0;
            rotation = rotation - Math.floor(rotation/360.0)*360.0;
        }
        draw();
    }
};
let handle_key_down = function (event)
{
    if (document.activeElement === gui.get_noise_dom())  { return; }
    if (document.activeElement === gui.get_kernel_dom()) { return; }
    if (event.ctrlKey) { return; }
    
    //console.log("KEY", event.key);
    
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
    else if (event.key === "b" || event.key === "B")
    {
        kernel();
    }
    else if (event.key === "d" || event.key === "D")
    {
        diamond_square();
    }
    else if (event.key === "s" || event.key === "S")
    {
        save_terr();
    }
    else if (event.key === "o" || event.key === "O")
    {
        ++obj;
        if (obj > 5) { obj = 0; }
        draw();
    }
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) proj = 0;
        draw();
    }
    else if (event.key === "k" || event.key === "K")
    {
        ++colmode;
        if (colmode > 1) { colmode = 0; }
        draw();
    }
    else if (event.key === "l" || event.key === "L")
    {
        level();
    }
    else if (event.key === "n" || event.key === "N")
    {
        add_noise();
    }
    else if (event.key === "r" || event.key === "R")
    {
        reset();
    }
    else if (event.key === "q" || event.key === "Q")
    {
        if (camera.upcam)
        {
            camera.upcam = false;
            camera.pos   = [50, 50, 50];
            camera.look  = v3.normalize([-1, -1, -1]);
            camera.up    = v3.normalize([-1, -1,  2]);
        }
        else
        {
            camera.upcam = true;
            camera.pos   = [0, 0, 100];
            camera.look  = [0, 0, -1];
            camera.up    = [0, 1,  0];
        }
        draw();
    }
    else if (event.key === "v" || event.key === "V")
    {
        kernel_init();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    else if (event.key === "Enter")
    {
        //scale    = 1.0;
        axis     = 0;
        rotation = 0;
        rotdir   = true;
        draw();
    }
};



let set_n = function (strval)
{
    let nn = parseInt(strval);
    if (nn !== Infinity && !isNaN(nn) && nn > 3)
    {
        grid.N = nn;
        init_grid();
        draw();
    }
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

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id, {preserveDrawingBuffer: true, antialias: false});
    
    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);
    
    glprog.pos  = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    glprog.col  = gl.getAttribLocation(glprog.bin, "col");
    gl.enableVertexAttribArray(glprog.col);
    glprog.norm = gl.getAttribLocation(glprog.bin, "norm");
    gl.enableVertexAttribArray(glprog.norm);
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");
    glprog.shaded  = gl.getUniformLocation(glprog.bin, "shaded");
    glprog.colmode = gl.getUniformLocation(glprog.bin, "colmode");
    glprog.invert  = gl.getUniformLocation(glprog.bin, "invert");
    glprog.defcol  = gl.getUniformLocation(glprog.bin, "defcol");
    
    grid.tbuf = gl.createBuffer();
    grid.lbuf = gl.createBuffer();
    grid.pbuf = gl.createBuffer();
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    nn_dom = document.getElementById('nnin');
    nn_dom.value = "" + grid.N;
    
    gui = new Grid_UI;
    
    resize();
    init_grid();
    draw();
};


window.set_n  = set_n;
window.level  = level;
window.ds     = diamond_square;
window.kernel = kernel;
window.add_noise = add_noise;

window.set_colh_pre  = (v) => { gui.set_colsch(v); col_grid(); grid_to_gpu(); draw(); }
window.set_colh      = ()  => { col_grid(); grid_to_gpu(); draw(); }
window.set_noise_pre = (v) => { gui.set_noise(v); }

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", () => { resize(); draw(); });
