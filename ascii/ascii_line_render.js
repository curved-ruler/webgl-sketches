
import { m4, v3, tr } from "./matvec.js";
import { obj } from "./obj.js"


//let a = 1 / Math.sqrt(6);
//let camera = {
//    pos   : [100, 100, 100],
//    look  : v3.normalize([-1, -1, -1]),
//    up    : [-a, -a, 2*a],
let camera = {
    pos   : [300, 0, 0],
    look  : v3.normalize([-1,  0,  0]),
    up    : v3.normalize([ 0,  0,  1]),
    near  : 10.0,
    median: 300,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};

let menu_hidden = false;
let usage = `\
Usage:
========
arrows - rotate
+/-    - zoom
M      - menu
Q      - model
I      - projection`;

let mesh_set = "1";
let mesh_names = ["tetra_ures.obj",
                  "okta_ures.obj",
                  "kocka_ures.obj",
                  "dodeka_ures.obj",
                  "ikoza_ures.obj",
                  "fulleren_otszog.obj"];
let mesh_i = 2;
let mesh = null;
let tr_m_v = [];
let proj = 0;
let scale = 1.4;
let axis = 0;
let rotation = 0;
let modlmat = null;
let viewmat = null;
let projmat = null;

let cx = 5;
let cy = 5;
let casp = 1;
let tst = 11;
let rendered = "";
let charmap  = [];
let depthmap = [];
let rendered_html = null;

let ccx = 0;
let ccy = 0;
let canvcont_html = null;



let compute_matrices = function ()
{
    modlmat = tr.rotz(rotation);
    modlmat = m4.mul(tr.rot(v3.cross(camera.up, camera.look), axis), modlmat);
    modlmat = m4.mul(tr.scale(scale), modlmat);
    
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
    
    if (!mesh) return;
    tr_m_v = [];
    let mat = m4.mul(projmat, m4.mul(viewmat, modlmat));
    
    for (let vi = 0 ; vi < mesh.verts.length / 3 ; ++vi)
    {
        let v = [mesh.verts[vi*3], mesh.verts[vi*3+1], mesh.verts[vi*3+2]];
        tr_m_v.push(v3.mmul(mat, v));
    }
};
let transform_6pp = function (position)
{
    let rad = 0.4;
    
    let vm = m4.mul(viewmat, modlmat);
    let v  = v3.mmul(vm, position);
    
    let l   = v3.length(v);
    let iv  = (l < 0.00001) ? [0,0,0] : v3.normalize(v);
    let ivv = (Math.sqrt(iv[0]*iv[0] + iv[1]*iv[1]) < 0.00001) ? [0,0,0] : v3.normalize([iv[0], iv[1], 0.0]);
    let a   = (l < 0.00001) ? 0.0 : Math.acos(v3.dot([0.0, 0.0, -1.0], iv));
    let r   = [ ivv[0] * a*rad, ivv[1] * a*rad, ivv[2] * a*rad ];
    
    let beta = (1.0 + camera.far/camera.near) / (1.0 - camera.far/camera.near);
    let alph = (-1.0 - beta) / camera.near;
    let z  = alph * v3.length(v) + beta;
    if (v[2] > 0.0) z = -v[2]-1.0;
    
    return [r[0] / camera.aspect, r[1], z];
};

let screen_space = function (x, c)
{
    return Math.floor((x + 1) * c / 2);
};

let render_to_html = function ()
{
    rendered = "";
    for (let y = cy-1 ; y>=0 ; --y)
    {
        for (let x = 0 ; x<cx ; ++x)
        {
            rendered += charmap[y*cx + x];
        }
        rendered += "\n";
    }
    rendered_html.innerHTML = rendered;
};
let render_begin = function ()
{
    charmap  = [];
    depthmap = [];
    
    for (let y = cy-1 ; y>=0 ; --y)
    {
        for (let x = 0 ; x<cx ; ++x)
        {
            charmap.push(' ');
            depthmap.push(2);
        }
    }
};
let render_point = function (x, y, z, shade)
{
    if (x >= 0 && y >= 0 && x < cx && y < cy)
    {
        if (z < depthmap[y*cx + x])
        {
            charmap[y*cx + x]  = shade;
            depthmap[y*cx + x] = z;
        }
    }
};
let render_text = function (x, y, z, str)
{
    let xi = x;
    let yi = y;
    for (let i = 0 ; i<str.length ; ++i)
    {
        let ch = str.charAt(i);
        if (ch == '\n')
        {
            --yi;
            xi = x;
            continue;
        }
        render_point(xi, yi, z, ch);
        ++xi;
    }
}
let render_mat = function ()
{
    if (!mesh) return;
    
    for (let vi = 0 ; vi < tr_m_v.length ; ++vi)
    {
        let x = screen_space(tr_m_v[vi][0], cx);
        let y = screen_space(tr_m_v[vi][1], cy);
        render_point(x, y, tr_m_v[vi][2], 'X');
        //console.log("X", x, y, tr_m_v[vi][2]);
    }
    
    for (let li = 0 ; li < mesh.lines.length / 2 ; ++li)
    {
        let v0 = tr_m_v[mesh.lines[li*2]];
        let v1 = tr_m_v[mesh.lines[li*2 + 1]];
        let p0 = [ screen_space(v0[0], cx), screen_space(v0[1], cy), v0[2] ];
        let p1 = [ screen_space(v1[0], cx), screen_space(v1[1], cy), v1[2] ];
        
        if (p0[0] > p1[0]) { [p0, p1] = [p1, p0]; }
        
        let dx = p1[0] - p0[0];
        let dy = p1[1] - p0[1];
        let dz = p1[2] - p0[2];
        let angle = Math.atan2(dy, dx);
        let ch = 'x';
        if      (angle >  Math.PI * 3/8) { ch = '|'; }
        else if (angle >  Math.PI * 1/8) { ch = '/'; }
        else if (angle > -Math.PI * 1/8) { ch = '-'; }
        else if (angle > -Math.PI * 3/8) { ch = '\\'; }
        else                             { ch = '|'; }
        
        if (dx > Math.abs(dy))
        {
            let yi = p0[1];
            let zi = p0[2];
            for (let xi = p0[0]+1 ; xi < p1[0] ; ++xi)
            {
                yi += dy/dx;
                zi += dz/dx;
                render_point(xi, Math.floor(yi), zi, ch);
            }
        }
        else
        {
            if (p0[1] > p1[1]) { [p0, p1] = [p1, p0]; }

            let xi = p0[0];
            let zi = p0[2];
            for (let yi = p0[1]+1 ; yi < p1[1] ; ++yi)
            {
                xi += dx/dy;
                zi += dz/dy;
                render_point(Math.floor(xi), yi, zi, ch);
            }
        }
    }
    
    render_to_html();
};

let render_6pp = function ()
{
    if (!mesh) return;
    
    for (let vi = 0 ; vi < mesh.verts.length / 3 ; ++vi)
    {
        let v = transform_6pp([mesh.verts[vi*3], mesh.verts[vi*3+1], mesh.verts[vi*3+2]]);
        let x = screen_space(v[0], cx);
        let y = screen_space(v[1], cy);
        render_point(x, y, v[2], 'X');
    }
    
    for (let li = 0 ; li < mesh.lines.length / 2 ; ++li)
    {
        let v0 = [mesh.verts[mesh.lines[li*2]*3],   mesh.verts[mesh.lines[li*2]*3+1],   mesh.verts[mesh.lines[li*2]*3+2]];
        let v1 = [mesh.verts[mesh.lines[li*2+1]*3], mesh.verts[mesh.lines[li*2+1]*3+1], mesh.verts[mesh.lines[li*2+1]*3+2]];
        
        for (let i=1 ; i<10 ; ++i)
        {
            let p  = v3.add(v3.cmul(v3.sub(v1, v0), (i/10)), v0);
            let pp = transform_6pp(p);
            render_point(screen_space(pp[0], cx), screen_space(pp[1], cy), pp[2], '.');
        }
    }
    
    render_to_html();
};

let render = function ()
{
    render_begin();
    compute_matrices();
    
    rendered = "";
    
    if (!menu_hidden) render_text(1,cy-1,-1, usage);
    
    
    if (proj === 0 || proj === 1) { render_mat(); }
    else                          { render_6pp(); }
};

var load_model = function ()
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === 4 && xhr.status === 200)
        {
            mesh = obj.create(xhr.responseText);
            render();
        }
    };
    
    xhr.open('GET', '../input/obj' + mesh_set + '/' + mesh_names[mesh_i], true);
    xhr.send(null);
};

var init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    rendered_html  = document.getElementById('canvas');
    canvcont_html  = document.getElementById('canvcont');
    
    resize();
    render_begin();
    render_to_html();
    load_model();
};

var calc_size = function ()
{
    casp = rendered_html.offsetWidth / rendered_html.offsetHeight;
    
    cx = Math.floor((canvcont_html.offsetWidth * tst  / rendered_html.offsetWidth));
    cy = Math.floor((canvcont_html.offsetHeight * tst / rendered_html.offsetHeight));
    console.log("X", canvcont_html.offsetWidth, rendered_html.offsetWidth, cx);
    console.log("Y", canvcont_html.offsetHeight, rendered_html.offsetHeight, cy);
    /*
    cx = 100;
    cy = 30;
    */
    camera.aspect = (cx*casp) / cy;
    
    render();
}

var resize = function ()
{
    if (!canvcont_html) return;
    
    ccx = window.innerWidth;
    ccy = window.innerHeight;
    canvcont_html.style.width  = ccx + "px";
    canvcont_html.style.height = ccy + "px";
    
    var tststr = "";
    for (var i=0 ; i<tst ; ++i)
    {
        for (var j=0 ; j<tst ; ++j)
        {
            tststr += '.';
        }
        tststr += "\n";
    }
    rendered_html.innerHTML = tststr;
    calc_size();
    //document.addEventListener("DOMContentLoaded", calc_size);
};

var handle_keydown = function (event)
{
    if (event.key === 'ArrowUp')
    {
        axis += 1.5;
        render();
    }
    else if (event.key === 'ArrowDown')
    {
        axis -= 1.5;
        render();
    }
    else if (event.key === 'ArrowLeft')
    {
        rotation -= 1.5;
        render();
    }
    else if (event.key === 'ArrowRight')
    {
        rotation += 1.5;
        render();
    }
    else if (event.key === '+')
    {
        scale *= 1.25;
        render();
    }
    else if (event.key === '-')
    {
        scale *= 0.8;
        render();
    }
    else if (event.key === 'i' || event.key === 'I')
    {
        if      (proj === 0) { scale /= 1.4; proj = 1; }
        else if (proj === 1) { scale *= 10;  proj = 2; }
        else                 { scale /= 10; scale *= 1.4; proj = 0; }
        render();
    }
    else if (event.key === 'q' || event.key === 'Q')
    {
        ++mesh_i; if (mesh_i >= mesh_names.length) mesh_i = 0;
        load_model();
    }
    else if (event.key === 'm' || event.key === 'M')
    {
        menu_hidden = !menu_hidden;
        render();
    }
    // Ensure [0,360]
    //axis = axis - Math.floor(axis/360.0)*360.0;
    //rotation = rotation - Math.floor(rotation/360.0)*360.0;
    
    //console.log("K", event.key);
};

window.addEventListener("resize", resize);
document.addEventListener("keydown", handle_keydown);
document.addEventListener("DOMContentLoaded", init);
