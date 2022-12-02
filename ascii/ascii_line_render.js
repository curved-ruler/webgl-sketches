
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
    median: 10,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};

let mesh_set = "1";
let mesh_name = "teapot01.obj";
let mesh = null;
let tr_m_v = [];
let proj = 1;
let scale = 1;
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

let screen_space = function(x, c)
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
let render = function ()
{
    if (!mesh) return;
    
    render_begin();
    compute_matrices();
    
    rendered = "";
    
    render_text(1,cy-1,-1,"Usage:\n======\nArrow keys - rotate\n+/- keys   - zoom");
    
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
    
    xhr.open('GET', 'input/' + mesh_set + '/' + mesh_name, true);
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
    // Ensure [0,360]
    //axis = axis - Math.floor(axis/360.0)*360.0;
    //rotation = rotation - Math.floor(rotation/360.0)*360.0;
    
    //console.log("K", event.key);
};

window.addEventListener("resize", resize);
document.addEventListener("keydown", handle_keydown);
document.addEventListener("DOMContentLoaded", init);
