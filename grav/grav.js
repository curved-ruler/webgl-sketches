
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
//import { m4, v3, tr } from "./matvec.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cw, ch;

let path     = [];
let pathlen  = 800;
let board    = [];
let boardbuf = null;

let bcol      = [0, 0, 0];
let pathcol   = [0.0, 1.0, 1.0];
let boardcol  = [1.0, 1.0, 1.0];

let menu_hidden = false;

let N         = 5;
let dxp       = 0.1;
let G         = 0.8;
let grava     = Math.PI / 2;
let gravadiff = 50 / (5*50*Math.PI);
let gravs     = 0.1;
let aspect    = 1;
let pix       = 1;
let viewm     = [];
let simulation    = true;
let simulation_id = null;
//let eps = 0.00001;

let make_board = function ()
{
    board.push(-1 + gravs*(Math.cos(grava) + 1), 1 - gravs*(Math.sin(grava)+1)*aspect, 1);
    board.push(-1 + gravs,                       1 - (gravs*aspect), 1);
    
    board.push(-1, -1, 1);
    board.push( 1, -1, 1);
    
    board.push(1, -1, 1);
    board.push(1,  1, 1);
    
    board.push( 1, 1, 1);
    board.push(-1, 1, 1);
    
    board.push(-1,  1, 1);
    board.push(-1, -1, 1);
    
    boardbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boardbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(board), gl.DYNAMIC_DRAW);
};
let update_board = function ()
{
    board[0] = -1 + gravs*(Math.cos(grava)+1);
    board[1] =  1 - gravs*(Math.sin(grava)+1)*aspect;
    board[3] = -1 + gravs;
    board[4] =  1 - (gravs*aspect);
    gl.bindBuffer(gl.ARRAY_BUFFER, boardbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(board), 0, 6);
};
let make_path = function ()
{
    //if (pathbuf) gl.deleteBuffer(pathbuf);
    //path  = [];
    
    let st = N*dxp/2;
    
    for (let px=0 ; px<N ; ++px)
    {
        for (let py=0 ; py<N ; ++py)
        {
            let arr  = [];
            let arrv = [];
            for (let i=0 ; i<pathlen ; ++i)
            {
                arr.push( -st + dxp*px, (-st + dxp*py)*aspect, (pathlen-i)/pathlen);
                arrv.push(0, 0);
            }
            
            let pathbufi = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, pathbufi);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.DYNAMIC_DRAW);
            
            path.push( { p: arr, pv: arrv, buf: pathbufi } );
        }
    }
};
let update_path = function ()
{
    for (let pi=0 ; pi<path.length ; ++pi)
    {
        for (let i=pathlen-1 ; i>0 ; --i)
        {
            path[pi].p[i*3]     = path[pi].p[(i-1)*3];
            path[pi].p[i*3 + 1] = path[pi].p[(i-1)*3 + 1];
            
            path[pi].pv[i*2]     = path[pi].pv[(i-1)*2];
            path[pi].pv[i*2 + 1] = path[pi].pv[(i-1)*2 + 1];
        }
        
        
        
        let h = 0.1;
        
        path[pi].pv[0] = path[pi].pv[2] + h*G*Math.cos(grava);
        path[pi].pv[1] = path[pi].pv[3] - h*G*Math.sin(grava)*aspect;
        
        path[pi].p[0] = path[pi].p[3] + h*path[pi].pv[0];
        path[pi].p[1] = path[pi].p[4] + h*path[pi].pv[1];
    
    
    
        let energy = -0.8;
    
        // x bounce
        if (path[pi].p[0] >  1) { path[pi].p[0] =  1; path[pi].pv[0] *= energy; }
        else
        if (path[pi].p[0] < -1) { path[pi].p[0] = -1; path[pi].pv[0] *= energy; }
        // y bounce
        if (path[pi].p[1] >  1) { path[pi].p[1] =  1; path[pi].pv[1] *= energy; }
        else
        if (path[pi].p[1] < -1) { path[pi].p[1] = -1; path[pi].pv[1] *= energy; }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, path[pi].buf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(path[pi].p), 0, path[pi].p.length);
    }
}

let simulate = function ()
{
    grava += gravadiff;
    update_board();
    update_path();
    draw();
};
let toggle_sim = function ()
{
    if (simulation)
    {
        simulation = false;
        window.clearInterval(simulation_id);
    }
    else
    {
        simulation = true;
        simulation_id = window.setInterval(simulate, 45);
    }
};

let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    //compute_matrices();
    gl.uniformMatrix4fv(glprog.vm, true, viewm);
    
    // board
    gl.bindBuffer(gl.ARRAY_BUFFER, boardbuf);
    gl.vertexAttribPointer(glprog.posa, 3, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(glprog.col, boardcol);
    gl.drawArrays(gl.LINES, 0, board.length / 3);
    
    // paths
    gl.uniform3fv(glprog.col, pathcol);
    
    for (let pi=0 ; pi<path.length ; ++pi)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, path[pi].buf);
        gl.vertexAttribPointer(glprog.posa, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, path[pi].p.length / 3);
    }
};

let handle_key_down = function (event)
{
    if (event.key === "m" || event.key === "M")
    {
        /*
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
        */
    }
    else if (event.key === " ")
    {
        toggle_sim();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
};

let set_g = function (sval)
{
    //console.log('G', val);
    let val = parseInt(sval);
    G = val / 100;
};
let set_dg = function (sval)
{
    //console.log('DG', val);
    let val = parseInt(sval);
    gravadiff = val / (5*50*Math.PI);
};

let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth - 200;
    canvas.height = window.innerHeight;
    cw = canvas.width;
    ch = canvas.height;
    aspect = cw / ch;
    pix = 2 / cw;
    viewm = [
        (cw-40)/cw,    0,       0, 0,
           0,       (ch-40)/ch, 0, 0,
           0,          0,       1, 0,
           0,          0,       0, 1
    ];
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id);
    
    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);
    
    glprog.posa = gl.getAttribLocation(glprog.bin, "posa");
    gl.enableVertexAttribArray(glprog.posa);
    
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    //glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.col     = gl.getUniformLocation(glprog.bin, "col");
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    
    resize();
    
    make_board();
    make_path();
    
    draw();
    
    toggle_sim();
};

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); update_board(); draw(); });
window.set_g  = set_g;
window.set_dg = set_dg;
