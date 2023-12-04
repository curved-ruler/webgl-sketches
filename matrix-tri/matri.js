 
import { gl_init }    from "./gl_init.js";


let vs = `\
#version 300 es

in      vec2  pos;
in      float alpha;
out     vec3  col;

vec3 hsv2rgb ( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z * mix( vec3(1.0), rgb, c.y);
}

void main ()
{
    gl_Position = vec4(pos, 0.0, 1.0);
    if (alpha > 0.98)
    {
        col = hsv2rgb( vec3(110.0/360.0, 0.4, 1.0) );
    }
    else
    {
        col = hsv2rgb( vec3(110.0/360.0, 0.9, alpha) );
    }
}`;

let fs = `\
#version 300 es
precision mediump float;

in      vec3  col;
out     vec4  fragcolor;

void main ()
{
    fragcolor = vec4(col, 1.0);
}`;

let canvas = null;
let gl     = null;
let glprog = null;

let Nx = 0;
let Ny = 0;
let Dx = 25;
let Dy = 25;
let tris   = [];
let tribuf = null;

let dAlpha  = 0.05;
let nStream = 1.0/dAlpha;
let iStream = 0;
let streams = [];

let run    = false;
let run_id = null;


let tick = function ()
{
    for (let i=0 ; i<streams.length ; ++i)
    {
        if (streams[i]<0) continue;
        
        ++streams[i];
        if (streams[i] > Ny+nStream)
        {
            streams[i] = -1;
            continue;
        }
        
        setcol(i, streams[i], 1.0);
        for (let y=streams[i]-1 ; y>=0 ; --y)
        {
            let c = getcol(i, y);
            if (c > 0)
            {
                setcol(i, y, c-dAlpha);
            }
        }
    }
    
    ++iStream;
    if (iStream > 3)
    {
        iStream = 0;
        add_stream(Math.floor(Math.random() * Nx));
        add_stream(Math.floor(Math.random() * Nx));
        add_stream(Math.floor(Math.random() * Nx));
    }
    
    for (let i=0 ; i<200 ; ++i)
    {
        let x = Math.floor(Math.random() * Nx);
        let y = Math.floor(Math.random() * Ny);
        let c = getcol(x,y);
        change_tri(x,y,c);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, tribuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(tris));
    
    draw();
};

let getcol = function (i,j)
{
    if (i>=Nx || j>=Ny || j<0) return 0;
    
    return tris[((Ny-1-j)*Nx+i)*18+ 2];
};
let setcol = function (i,j,c)
{
    if (i>=Nx || j>=Ny || j<0) return;
    
    tris[((Ny-1-j)*Nx+i)*18+ 2] = c;
    tris[((Ny-1-j)*Nx+i)*18+ 5] = c;
    tris[((Ny-1-j)*Nx+i)*18+ 8] = c;
    tris[((Ny-1-j)*Nx+i)*18+11] = c;
    tris[((Ny-1-j)*Nx+i)*18+14] = c;
    tris[((Ny-1-j)*Nx+i)*18+17] = c;
};
let add_stream = function (i)
{
    if (i >= 0 && i < Nx)
    {
        if (streams[i] >= 0) return;
        
        streams[i] = 0;
        setcol(i,0, 1.0);
    }
};

let change_tri = function (x,y, a)
{
    let t = [...Array(6)].map(i => (Math.random() * 1.2 - 0.1));
    let dxx = 2.05/Nx;
    let dyy = 2.05/Ny;
    
    tris[((Ny-1-y)*Nx+x)*18+ 0] = -1 + (x-1)*dxx + t[0]*dxx;
    tris[((Ny-1-y)*Nx+x)*18+ 1] = -1 + (Ny-1-y-1)*dyy + t[0]*dyy;
    tris[((Ny-1-y)*Nx+x)*18+ 2] = a;
    
    tris[((Ny-1-y)*Nx+x)*18+ 3] = -1 + (x-1)*dxx + t[2]*dxx;
    tris[((Ny-1-y)*Nx+x)*18+ 4] = -1 + (Ny-1-y-1)*dyy + t[3]*dyy;
    tris[((Ny-1-y)*Nx+x)*18+ 5] = a;
    
    tris[((Ny-1-y)*Nx+x)*18+ 6] = -1 + (x-1)*dxx + t[2]*dxx;
    tris[((Ny-1-y)*Nx+x)*18+ 7] = -1 + (Ny-1-y-1)*dyy + t[3]*dyy;
    tris[((Ny-1-y)*Nx+x)*18+ 8] = a;
    
    tris[((Ny-1-y)*Nx+x)*18+ 9] = -1 + (x-1)*dxx + t[4]*dxx;
    tris[((Ny-1-y)*Nx+x)*18+10] = -1 + (Ny-1-y-1)*dyy + t[5]*dyy;
    tris[((Ny-1-y)*Nx+x)*18+11] = a;
    
    tris[((Ny-1-y)*Nx+x)*18+12] = -1 + (x-1)*dxx + t[4]*dxx;
    tris[((Ny-1-y)*Nx+x)*18+13] = -1 + (Ny-1-y-1)*dyy + t[5]*dyy;
    tris[((Ny-1-y)*Nx+x)*18+14] = a;
    
    tris[((Ny-1-y)*Nx+x)*18+15] = -1 + (x-1)*dxx + t[0]*dxx;
    tris[((Ny-1-y)*Nx+x)*18+16] = -1 + (Ny-1-y-1)*dyy + t[0]*dyy;
    tris[((Ny-1-y)*Nx+x)*18+17] = a;
};
let init_tris = function ()
{
    tris    = [...Array(Nx*Ny*18)];
    streams = [...Array(Nx)].map(i=>-1);
    
    for (let j=0 ; j<Ny ; ++j)
    for (let i=0 ; i<Nx ; ++i)
    {
        change_tri(i,j, 0);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, tribuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tris), gl.STREAM_DRAW);
};

let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    //gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //compute_matrices();
    
    //gl.uniform1f(glprog.alpha, alpha);
    //gl.uniform3fv(glprog.col, tcol);

    gl.bindBuffer(gl.ARRAY_BUFFER, tribuf);
    gl.vertexAttribPointer(glprog.pos,   2, gl.FLOAT, false, 3*4, 0*4);
    gl.vertexAttribPointer(glprog.alpha, 1, gl.FLOAT, false, 3*4, 2*4);
    gl.drawArrays(gl.LINES, 0, tris.length / 3);
};

let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    Nx = Math.ceil(canvas.width  / Dx);
    Ny = Math.ceil(canvas.height / Dy);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    init_tris();
};

let handle_key_down = function (event)
{
    if (event.ctrlKey) { return; }
    
    if (event.key === " ") // Space
    {
        if (run)
        {
            run = false;
            window.clearInterval(run_id);
        }
        else
        {
            run = true;
            run_id = window.setInterval(tick, 80);
        }
    }
    else if (event.key === "c" || event.key === "C")
    {
        for (let i=0 ; i<streams.length ; ++i)
        {
            streams[i] = -1;
        }
        for (let j=0 ; j<Ny ; ++j)
        for (let i=0 ; i<Nx ; ++i)
        {
            setcol(i,j, 0);
        }
    
        gl.bindBuffer(gl.ARRAY_BUFFER, tribuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(tris));
    
        draw();
    }
    else if (event.key === "q" || event.key === "Q")
    {
        /*
        for (let i=0 ; i<streams.length ; ++i)
        {
            streams[i] = -1;
        }
        */
        for (let j=0 ; j<Ny ; ++j)
        for (let i=0 ; i<Nx ; ++i)
        {
            setcol(i,j, 1-dAlpha);
        }
    
        gl.bindBuffer(gl.ARRAY_BUFFER, tribuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(tris));
    
        draw();
    }
    
    console.log("key", event.key);
};

let gpu_init = function (canvas_id)
{
    gl     = gl_init.get_webgl2_context(canvas_id);
    glprog = gl_init.create_glprog(gl, vs, fs);
    
    glprog.pos  = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    glprog.alpha  = gl.getAttribLocation(glprog.bin, "alpha");
    gl.enableVertexAttribArray(glprog.alpha);
    
    glprog.col     = gl.getUniformLocation(glprog.bin, "col");
    //glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");

    tribuf = gl.createBuffer();
};
let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    //canvas.addEventListener("wheel", handle_wheel);
    
    resize();
    draw();
};


document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });

run = true;
run_id = window.setInterval(tick, 80);
