
import { gl_init }          from "./gl_init.js";
import { shaders }          from "./shaders.js";
import { m4, v3, quat, tr } from "./matvec.js";
import { plane_controls }   from "./aeroplane.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let planet = {
    N:     128,
    ready:   0,
    cx:      3,
    cy:      3,
    cells: [...Array(3*3)].map( (i)=>(
        {
            tris:[],   lines:[],  points:[],
            tbuf:null, lbuf:null, pbuf:null
        }) )
};

let maps = [
    {
        N : 128,
        F : ['../input/terr/pl/', 'terr_ds_'],
        D : [3,3]
    },
    {
        N : 128,
        F : ['../input/terr/pl2/', 'planet_'],
        D : [5,5]
    },
    {
        N : 128,
        F : ['../input/terr/pl3/', 'planet_'],
        D : [3,3]
    }
];
let mapi = 0;

let plv_size    = 5;
let planet_view = [...Array(plv_size * plv_size)];


let bcol  = [0.1, 0.1, 0.1];
let tcol  = [0.9, 0.9, 0.9];
let colmode = 0;
let alpha   = 1.0;
let alpha_dom = null;

let menu_hidden = false;

let obj  = 1;
let proj = 1;
let projmat, modlmat, viewmat;
let scale    = 1;


let camera = {
    pos   : [0, 0, 0.1],
    look  : [0.5, 0.5, 0],
    up    : [0, 0, 1],
    near  : 0.1,
    median: 30,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};
let cam_constrain = function ()
{
    camera.look = v3.normalize(camera.look);
    
    let up2 = v3.cross(camera.look, camera.up);
    
    camera.up = v3.cross(up2, camera.look);
    camera.up = v3.normalize(camera.up);
};
let update_cam = function ()
{
    let up    = tr.rot_q(aeroplane.orient, [0,0,1]);
    let look  = tr.rot_q(aeroplane.orient, [1,0,0]);
    let right = v3.cross(look, up);
    
    let dir = v3.add( v3.cmul(look, -1/5.0), v3.cmul(up, 0.5/5.0) );
    
    camera.pos  = v3.add(aeroplane.pos, v3.cmul(dir, camera.median));
    camera.look = v3.sub(aeroplane.pos, camera.pos);
    camera.up   = v3.cross(right, camera.look);
    
    cam_constrain();
};

let aeroplane = {
    oldpos : [0, 0, 0],
    pos    : [0, 0, 0],
    orient : [1, 0, 0, 0],
    
    imass    : 1/1000,
    iinertia : 1/100,
    
    forw   : false,
    backw  : false,
    tup    : false, //dup = false;
    tdown  : false, //ddown  = false;
    tLroll : false, //dleft  = false;
    tRroll : false, //dright = false;
    tLyaw  : false,
    tRyaw  : false,
    
    thrust : false,
    
    damp  : -1,
    adamp : -2.0,
    
    maxvel  : 10,
    maxavel : 5,
    
    force  : 100,
    torque : 1,
    
    acceleration : [0,0,0],
    angularacc   : [0,0,0],
    velocity     : [0,0,0],
    angularvel   : [0,0,0]
};


let compute_matrices = function ()
{
    modlmat = m4.init();
    
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

let clamp = function (x, a, b)
{
    if (x < a) return a;
    if (x > b) return b;
    return x;
};

let getheight = function (pos)
{
    let i = clamp(Math.floor(pos[0] / planet.N), 0, planet.cx-1);
    let j = clamp(Math.floor(pos[1] / planet.N), 0, planet.cy-1);
    
    if (planet.cells[j*planet.cx+i].tris.length < 1) return 0+camh;
    
    let x = pos[0] - Math.floor(pos[0]/planet.N)*planet.N;
    let y = pos[1] - Math.floor(pos[1]/planet.N)*planet.N;
    
    let k = 2 * ( Math.floor(y) * planet.N + Math.floor(x) );
    let xx = x - Math.floor(x);
    let yy = y - Math.floor(y);
    
    return planet.cells[j*planet.cx+i].tris[k*9*3 +    2]    * (1-xx) *   (yy) +
           planet.cells[j*planet.cx+i].tris[k*9*3 +  9+2]    * (1-xx) * (1-yy) +
           planet.cells[j*planet.cx+i].tris[k*9*3 + 18+2]    *   (xx) * (1-yy) +
           planet.cells[j*planet.cx+i].tris[(k+1)*9*3 + 9+2] *   (xx) *   (yy);
};
let cam_pos_h = function ()
{
    let h = getheight(camera.pos);
    camera.pos[2] = h+camh;
};


let fetch_terr = function (name, x, y, pnx)
{
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === 4 && xhr.status === 200)
        {
            //console.log("XY", x, y);
            
            let arrayBuffer = xhr.response;
            const view = new DataView(arrayBuffer);
            
            let Nx = view.getUint32(0, true);
            let Ny = view.getUint32(4, true);
            if (Nx != planet.N || Ny != planet.N)
            {
                window.alert("N mismatch: PN-Nx-Ny: " + planet.N + " - " + Nx + " - " + Ny);
                return;
            }
            
            let xoff = 0;
            let yoff = 0;
            
            let H  = [...Array((Nx+1)*(Ny+1))];
            let C  = [...Array((Nx+1)*(Ny+1))];
            
            for (let j=0 ; j<=Ny ; ++j)
            for (let i=0 ; i<=Nx ; ++i)
            {
                H[j*(Nx+1)+i] = view.getFloat32(8+(j*(Nx+1)+i)*4, true);
            }
            for (let j=0 ; j<=Ny ; ++j)
            for (let i=0 ; i<=Nx ; ++i)
            { 
                C[j*(Nx+1)+i] = view.getUint32(8+(Nx+1)*(Ny+1)*4+(j*(Nx+1)+i)*4, true);
            }
            for (let j=0 ; j<Ny ; ++j)
            for (let i=0 ; i<Nx ; ++i)
            {
                let col = C[j*(Nx+1)+i];
                let a = col % 256;
                col = Math.floor((col-a)/256);
                let b = col % 256;
                col = Math.floor((col-b)/256);
                let g = col % 256;
                col = Math.floor((col-g)/256);
                let r = col % 256;
                
                let va = [ 1, 0, H[(j+1)*(Nx+1)+i]-H[(j)*(Nx+1)+i] ];
                let vb = [ 0, 1, H[(j)*(Nx+1)+i+1]-H[(j)*(Nx+1)+i] ];
                let norm = v3.cross(va,vb);
                
                planet.cells[y*pnx+x].tris.push(xoff+i,   yoff+j+1, H[(j+1)*(Nx+1)+i],   r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                planet.cells[y*pnx+x].tris.push(xoff+i,   yoff+j,   H[(j  )*(Nx+1)+i],   r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                planet.cells[y*pnx+x].tris.push(xoff+i+1, yoff+j,   H[(j  )*(Nx+1)+i+1], r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
             
                planet.cells[y*pnx+x].tris.push(xoff+i+1, yoff+j,   H[(j  )*(Nx+1)+i+1], r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                planet.cells[y*pnx+x].tris.push(xoff+i+1, yoff+j+1, H[(j+1)*(Nx+1)+i+1], r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                planet.cells[y*pnx+x].tris.push(xoff+i,   yoff+j+1, H[(j+1)*(Nx+1)+i],   r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                
                
                planet.cells[y*pnx+x].lines.push(xoff+i,   yoff+j,   H[(j  )*(Nx+1)+i],   r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                planet.cells[y*pnx+x].lines.push(xoff+i+1, yoff+j,   H[(j  )*(Nx+1)+i+1], r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                
                planet.cells[y*pnx+x].lines.push(xoff+i,   yoff+j,   H[(j  )*(Nx+1)+i],   r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                planet.cells[y*pnx+x].lines.push(xoff+i,   yoff+j+1, H[(j+1)*(Nx+1)+i],   r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
                
                
                planet.cells[y*pnx+x].points.push(xoff+i,   yoff+j,   H[(j  )*(Nx+1)+i],   r/255, g/255, b/255,   norm[0], norm[1], norm[2]);
            }
            
            //console.log("H", H);
            
            planet.cells[y*pnx+x].tbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, planet.cells[y*pnx+x].tbuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planet.cells[y*pnx+x].tris),  gl.STATIC_DRAW);
            
            planet.cells[y*pnx+x].lbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, planet.cells[y*pnx+x].lbuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planet.cells[y*pnx+x].lines), gl.STATIC_DRAW);
            
            planet.cells[y*pnx+x].pbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, planet.cells[y*pnx+x].pbuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planet.cells[y*pnx+x].points), gl.STATIC_DRAW);
            
            ++planet.ready;
        }
    }
    xhr.open('GET', name, true);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
};

let make_planet = function ()
{
    for (let i=0 ; i<planet.cx*planet.cy ; ++i)
    {
        if (planet.cells[i].tbuf)
        {
            gl.deleteBuffer(planet.cells[i].tbuf);
            gl.deleteBuffer(planet.cells[i].lbuf);
            gl.deleteBuffer(planet.cells[i].pbuf);
        }
    }
    
    planet = {
        N:       maps[mapi].N,
        ready:   0,
        cx:      maps[mapi].D[0],
        cy:      maps[mapi].D[1],
        cells: [...Array( maps[mapi].D[0] * maps[mapi].D[1] )].map( (i)=>(
        {
            tris:[],   lines:[],  points:[],
            tbuf:null, lbuf:null, pbuf:null
        }) )
    };
    
    loop_planet();
    
    for (let i=0 ; i<planet.cx ; ++i)
    {
        for (let j=0 ; j<planet.cy ; ++j)
        {
            fetch_terr(maps[mapi].F[0] + maps[mapi].F[1] + j + '_' + i + '.terr', i, j, planet.cx);
        }
    }
};

let loop_planet = function ()
{
    let x = aeroplane.pos[0];
    let y = aeroplane.pos[1];
    
    let xm = Math.floor(x / (planet.N*scale) - plv_size/2);
    let ym = Math.floor(y / (planet.N*scale) - plv_size/2);
    
    let modi = (x, m) =>
    {
        if (x >= 0) return (x - Math.floor(x/m)*m);
        else        return (Math.floor((-x-1)/m) + 1)*m + x;
    };

    for (let j=0 ; j<plv_size ; ++j)
    {
        for (let i=0 ; i<plv_size ; ++i)
        {
            let i2 = modi(ym+i, planet.cy);
            let j2 = modi(xm+j, planet.cx);
            
            //console.log("IJ", i2, j2);
            
            planet_view[j*plv_size + i] = { pointer: i2*planet.cx + j2,  tr: [(xm+j)*planet.N, (ym+i)*planet.N, 0] };
        }
    }
    
    //xo1 = xn1;
    //yo1 = yn1;
};


let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    if (alpha < 0.98)
    {
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    else
    {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
    }
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    
    gl.uniform1i (glprog.colmode, colmode);
    gl.uniform3fv(glprog.defcol,  tcol);
    gl.uniform1f (glprog.alpha,   alpha);
    
    for (let i=0 ; i<planet_view.length ; ++i)
    {
        let cell = planet.cells[planet_view[i].pointer];
        modlmat  = tr.translate(planet_view[i].tr);
        gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat))
        
        if ((obj === 0 || obj === 3 || obj === 5) && cell.pbuf !== null)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, cell.pbuf);
            gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
            gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
            gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
            gl.uniform1i(glprog.shaded, obj === 3 ? 0 : 1);
            gl.drawArrays(gl.POINTS, 0, cell.points.length / 9);
        }
        
        if ((obj === 1 || obj === 4 || obj === 5) && cell.lbuf !== null)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, cell.lbuf);
            gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
            gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
            gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
            gl.uniform1i(glprog.shaded, obj === 4 ? 0 : 1);
            gl.drawArrays(gl.LINES, 0, cell.lines.length / 9);
        }
        
        if ((obj === 2 || obj === 3 || obj === 4) && cell.tbuf !== null)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, cell.tbuf);
            gl.vertexAttribPointer(glprog.pos,  3, gl.FLOAT, false, 9*4, 0*4);
            gl.vertexAttribPointer(glprog.col,  3, gl.FLOAT, false, 9*4, 3*4);
            gl.vertexAttribPointer(glprog.norm, 3, gl.FLOAT, false, 9*4, 6*4);
            gl.uniform1i(glprog.shaded, 1);
            
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(1, 1);
            gl.drawArrays(gl.TRIANGLES, 0, cell.tris.length / 9);
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
    }
};



let handle_key_up = function (event)
{
    plane_controls.control(aeroplane, event, false);
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
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) { proj = 1; }
    }
    else if (event.key === "o" || event.key === "O")
    {
        ++obj;
        if (obj > 5) { obj = 0; }
    }
    else if (event.key === "k" || event.key === "K")
    {
        ++colmode;
        if (colmode > 1) { colmode = 0; }
    }
    else if (event.key === "1")
    {
        ++mapi;
        if (mapi >= maps.length) { mapi = 0; }
        make_planet();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    
    
    plane_controls.control(aeroplane, event, true);
};
let set_alpha = function (strval)
{
    alpha = parseFloat(strval);
    alpha_dom.blur();
};

let tick = function (timestamp)
{
    plane_controls.tick(aeroplane, 0.1); // TODO timestamp
    
    let distxy = (a,b) => ( Math.sqrt( (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]) ) );
    
    if (distxy(aeroplane.oldpos, aeroplane.pos) > 128)
    {
        aeroplane.oldpos = aeroplane.pos;
        loop_planet();
    }
    
    update_cam();
    draw();
    
    window.requestAnimationFrame(tick);
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
    glprog.defcol  = gl.getUniformLocation(glprog.bin, "defcol");
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    //canvas.addEventListener("mousedown", handle_mouse_down);
    //canvas.addEventListener("mouseup",   handle_mouse_up);
    //canvas.addEventListener("mousemove", handle_mouse_move);
    
    alpha_dom = document.getElementById('alpha');
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == alpha) { opts.selectedIndex = i; }
    }
    
    resize();
    
    cam_constrain();
    make_planet();
};


window.set_alpha = set_alpha;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
document.addEventListener("keyup",   handle_key_up);
window.addEventListener("resize", function() { resize(); draw(); });

window.requestAnimationFrame(tick);
