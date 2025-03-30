
let canvas   = null;
let context  = null;
let menu_hidden = false;

let params = `\
return {
    dt : 1,
    Nx : 30,
    Ny : 1,
    r  : 100,
    dr : 25,
    F  : (i,j,t) => ( (t-i-j+20) / 40 )
};`;
let P = null;
let P_dom = null;

let dtor = 2 * Math.PI;

let show_circ = true;
let C_dom = null;
let animate   = false;

let t  = 0;
let dt = 1;
let Nx = 30;
let Ny = 1;
let r  = 100;
let dr = 25;
let F  = (i,j,t) => ( (t-i-j+20) / 40 );

let back_col = [0.2, 0.2, 0.2];
let curv_col = [1.0, 0.6, 0.2];
let dots_col = [0.0, 0.6, 0.9];

let errorlog = function (str)
{
    console.error('Error: ' + str);
    window.alert('Error:\n' + str);
};
let tog_circs = function ()
{
    show_circ = !show_circ;
    C_dom.blur();
    draw();
};
let set_params = function ()
{
    try
    {
        P = Function(P_dom.value);
        let currp = P();
        dt = currp.dt;
        Nx = currp.Nx;
        Ny = currp.Ny;
        r  = currp.r;
        dr = currp.dr;
        F  = currp.F;
        
        draw();
    }
    catch (err)
    {
        errorlog(err.message);
        return;
    }
};

let resize = function ()
{
    if (!canvas) return;
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
};


let draw = function ()
{
    if (!canvas) return;

    context.fillStyle=`rgb(${back_col[0]*256}, ${back_col[1]*256}, ${back_col[2]*256})`;
    context.fillRect(0,0,canvas.width,canvas.height);

    context.strokeStyle =`rgb(${curv_col[0]*256}, ${curv_col[1]*256}, ${curv_col[2]*256})`;

    let mx = canvas.width/2  - Nx/2*dr;
    let my = canvas.height/2 - Ny/2*dr;
    
    if (show_circ)
    {
    for (let j=0 ; j<Ny; ++j)
    for (let i=0 ; i<Nx; ++i)
    {
        context.beginPath();
        context.arc(i*dr + mx, j*dr + my, r, 0, 2 * Math.PI, false);
        context.stroke();
    }
    }

    context.fillStyle=`rgb(${dots_col[0]*256}, ${dots_col[1]*256}, ${dots_col[2]*256})`;

    for (let j=0 ; j<Ny; ++j)
    for (let i=0 ; i<Nx; ++i)
    {
        let tt = F(i,j,t) * dtor;
        context.beginPath();
        context.arc(i*dr + mx + r*Math.sin(-tt), j*dr + my + r*Math.cos(-tt), 7, 0, 2 * Math.PI, false);
        context.fill();
    }
};

let tick = function (timestamp)
{
    t += dt*0.3;
    draw();
    
    if (animate) { window.requestAnimationFrame(tick); }
};


let handleKeyDown = function (event)
{
    if (document.activeElement === P_dom) { return; }
    if (event.ctrlKey) { return; }
    
    
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
    else if (event.key === "w" || event.key === "W")
    {
        t -= dt;
        //console.log("T", t);
        draw();
    }
    else if (event.key === "s" || event.key === "S")
    {
        t += dt;
        //console.log("T", t);
        draw();
    }
    else if (event.key === " ")
    {
        animate = !animate;
        if (animate) { window.requestAnimationFrame(tick); }
    }
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    if (!canvas) { console.error('ERROR: No <canvas>'); return; }
    context = canvas.getContext('2d');
    if (!context) { console.error('ERROR: No context'); return; }
    
    
    C_dom = document.getElementById('circin');
    
    P_dom = document.getElementById('paramsin');
    P_dom.value = params;
    set_params();
    
    resize();
    draw();
};

window.tog_circs  = tog_circs;
window.set_params = set_params;
window.addEventListener("resize", function() { resize(); draw(); });

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
