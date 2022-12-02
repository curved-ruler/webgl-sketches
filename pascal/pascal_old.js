
let menu_hidden = false;

let canvas   = null;
let context  = null;

let N = 2;
let X = 0;
let Y = 0;
let scale = 10;
let grabbed = -1;
/*
let cols = [
    [0.0, 0.0, 0.0], // 0
    [1.0, 0.6, 0.2], // 1
    [1.0, 1.0, 1.0], // 2
    [0.0, 1.0, 1.0], // 3
    [0.0, 1.0, 0.0], // 4
    [1.0, 1.0, 0.0], // 5
    [1.0, 0.0, 0.0], // 6
    [1.0, 0.0, 1.0], // 7
    [0.0, 0.0, 1.0], // 8
];
*/

let data_xn = 0;
let data_yn = 0;
let data = [];



let resize = function ()
{
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
};

let seed_data = function ()
{
    //data[Math.floor(data_xn / 2)] = 1;
    let middle = data_xn / 2;
    let gap = 1;
    let sn  = 1;
    let start = Math.floor(middle - (sn/2)*gap);
    for (let i=0 ; i<sn ; ++i) { data[start + i*gap]=1; }
};
let calc_data = function ()
{
    if (!canvas) return;
    
    data = null;
    data_xn = Math.floor(canvas.width  / scale) + 1;
    data_yn = Math.floor(canvas.height / scale) + 1;
    data = [...Array(data_xn * data_yn)].map((u, i) => 0);
    
    seed_data();
    
    for (let j=1 ; j<data_yn ; ++j)
    {
        for (let i=1 ; i<data_xn-1 ; ++i)
        {
            data[j*data_xn + i] = ( 1 * data[(j-1)*data_xn + (i-1)] +
                                    0 * data[(j-1)*data_xn + (i)]   +
                                    1 * data[(j-1)*data_xn + (i+1)] + j) % N;
        }
    }
};

let draw = function ()
{
    if (!canvas) return;

    calc_data();

    for (let j=0 ; j < data_yn ; ++j)
    {
        for (let i=0 ; i<data_xn ; ++i)
        {
            let k = (data[j*data_xn + i] % N);
            context.fillStyle=`rgb(${k*256/(N-1)}, ${k*256/(N-1)}, ${k*256/(N-1)})`;
            context.fillRect(i*scale, j*scale, scale, scale);
        }
    }
};

let zoomin  = function () { scale += 1; draw(); };
let zoomout = function () { if (scale > 2.5) { scale -= 1;  draw(); } };

let handleMouseDown = function (event)
{
    grabbed = 1;
};

let handleMouseUp = function (event)
{
    grabbed = -1;
};

let handleMouseMove = function (event)
{
    if (grabbed < 0) return;
    
    //draw();
};

let handleKeyDown = function (event)
{
    if (event.key === "w")
    {
        zoomin();
    }
    else if (event.key === "s")
    {
        zoomout();
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
    else if (event.key === "+")
    {
        if (N < 200) { ++N; draw(); }
    }
    else if (event.key === "-")
    {
        if (N > 2) { --N; draw(); }
    }
};

let handleWheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
};

let create_dropdowns = function ()
{
    let cmlist = document.getElementById('nn');
    
    for (let i=2 ; i<20 ; ++i)
    {
        let option = document.createElement("option");
        option.value = i;
        option.text  = i;
        option.selected = i == N;
        cmlist.appendChild(option);
    }
};

let set_n = function (strval)
{
    let ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 1)
    {
        N = 2;
    }
    else
    {
        N = ival;
    }
    
    draw();
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    if (!canvas) { console.error('ERROR: No <canvas>'); return; }
    context = canvas.getContext('2d');
    if (!context) { console.error('ERROR: No context'); return; }
    
    create_dropdowns();
    
    //canvas.addEventListener("mousedown", handleMouseDown);
    
    resize();
    draw();
};

window.set_n = set_n;

//document.addEventListener("mouseup", handleMouseUp);
//document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

