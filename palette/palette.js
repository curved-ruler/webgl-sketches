
import { cconv }  from "./color-conv.js"
import { saveAs } from './FileSaver.js';

let canvas  = null;
let context = null;
let voronoi = [];

let colsdiv = null;
let cols    = [];
let colshsv = [];

let menu_hidden = false;
let ipix = null;
let ivn  = null;


let seth = function (node)
{
    let i = parseInt(node.parentNode.id.substr(1));
    
    let h = parseFloat(node.value)/360;
    colshsv[i*3] = h;
    let s = colshsv[i*3 + 1];
    let v = colshsv[i*3 + 2];
    
    let hsl = cconv.hsv2hsl([h,s,v]);
    cols[i].style.backgroundColor = `hsl(${hsl[0]*360}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
    
    backgr(i);
    draw();
};
let sets = function (node)
{
    let i = parseInt(node.parentNode.id.substr(1));
    
    let s = parseFloat(node.value)/100;
    let h = colshsv[i*3];
    colshsv[i*3 + 1] = s;
    let v = colshsv[i*3 + 2];
    
    let hsl = cconv.hsv2hsl([h,s,v]);
    cols[i].style.backgroundColor = `hsl(${hsl[0]*360}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
    
    backgr(i);
    draw();
};
let setv = function (node)
{
    let i = parseInt(node.parentNode.id.substr(1));
    
    let v = parseFloat(node.value)/100;
    let h = colshsv[i*3];
    let s = colshsv[i*3 + 1];
    colshsv[i*3 + 2] = v;
    
    let hsl = cconv.hsv2hsl([h,s,v]);;
    cols[i].style.backgroundColor = `hsl(${hsl[0]*360}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
    
    backgr(i);
    draw();
};
let backgr = function (id)
{
    let hsl0 = cconv.readable(cconv.hsv2hsl([ colshsv[id*3], 0, colshsv[id*3+2] ]), 360, 100, 100);
    let hsl1 = cconv.readable(cconv.hsv2hsl([ colshsv[id*3], 1, colshsv[id*3+2] ]), 360, 100, 100);
    let hsl2 = cconv.readable(cconv.hsv2hsl([ colshsv[id*3], colshsv[id*3+1], 0 ]), 360, 100, 100);
    let hsl3 = cconv.readable(cconv.hsv2hsl([ colshsv[id*3], colshsv[id*3+1], 1 ]), 360, 100, 100);
    document.getElementById("s"+id).style.background = `linear-gradient(to right, hsl(${hsl0[0]} ${hsl0[1]} ${hsl0[2]}), hsl(${hsl1[0]} ${hsl1[1]} ${hsl1[2]}))`;
    document.getElementById("v"+id).style.background = `linear-gradient(to right, hsl(${hsl2[0]} ${hsl2[1]} ${hsl2[2]}), hsl(${hsl3[0]} ${hsl3[1]} ${hsl3[2]}))`;
};

let delcolor = function (node)
{
    if (cols.length < 2) return;
    
    let id = parseInt(node.parentNode.id.substr(1));
    //if (id >= cols.length) return;
    for (let i=id+1 ; i<cols.length ; ++i)
    {
        let i1 = i-1;
        let d = document.getElementById("d"+i);
        d.id = "d" + i1;
        let h = document.getElementById("h"+i);
        h.id = "h" + i1;
        let s = document.getElementById("s"+i);
        s.id = "s" + i1;
        let v = document.getElementById("v"+i);
        v.id = "v" + i1;
    }
    cols[id].remove();
    
    cols.splice(id,1);
    colshsv.splice(id*3,3);
    
    //console.log("C", cols);
    
    draw();
};
let addcolor = function ()
{
    if (cols.length >= 50) return;
    
    let id  = cols.length;
    let row = `
  <span id="h${id}" class="wheel"><input type="range" min="0" max="360" value="90" onchange="seth(this)"></span>
  <span id="s${id}"><input type="range" min="0" max="100" value="90" onchange="sets(this)"></span>
  <span id="v${id}"><input type="range" min="0" max="100" value="90" onchange="setv(this)"></span>
  <span onclick="delcolor(this)" style="background:#323232;">🗑</span>
`;
    
    const div   = document.createElement("div");
    let i = cols.length
    div.id = "d" + i;
    div.innerHTML = row;
    colsdiv.appendChild(div);
    
    cols.push(div);
    colshsv.push(90/360, 0.9, 0.9);
    
    let hsl = cconv.hsv2hsl([90/360, 0.9, 0.9]);
    cols[i].style.backgroundColor = `hsl(${hsl[0]*360}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
    
    backgr(i);
    draw();
};

let resize = function ()
{
    if (!canvas) return;
    
    canvas.width =  window.innerWidth;
    canvas.height = window.innerHeight;
};

let init_voronoi = function ()
{
    voronoi = [];
    
    let vn = parseInt(ivn.value);
    for (let i=0 ; i<vn ; ++i)
    {
        voronoi.push(Math.random() * (0.98) + 0.01,
                     Math.random() * (0.98) + 0.01);
    }
};

let draw = function ()
{
    let pix = parseInt(ipix.value);
    
    for (let y = 0 ; y < canvas.height ; y += pix)
    for (let x = 0 ; x < canvas.width  ; x += pix)
    {
        let d  = 10000;
        let vi = 0;
        for (let i=0 ; i<voronoi.length/2 ; ++i)
        {
            let a = x - voronoi[i*2]*canvas.width;
            let b = y - voronoi[i*2+1]*canvas.height;
            let di = Math.sqrt(a*a + b*b);
            if (di < d)
            {
                d = di;
                vi = i;
            }
        }
        let ci = vi % cols.length;
        let c = [ colshsv[ci*3], colshsv[ci*3+1], colshsv[ci*3+2] ];
        let hsl = cconv.hsv2hsl(c);
        context.fillStyle = `hsl(${hsl[0]*360}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
        context.fillRect( x, y, pix, pix );
    }
};

let save_pal = function ()
{
    let objstring = "\n";
    
    for (let i=0 ; i<cols.length ; ++i)
    {
        let c = cconv.readable([ colshsv[i*3],colshsv[i*3+1],colshsv[i*3+2] ], 360, 100, 100);
        objstring += c[0] + ", " + c[1] + ", " + c[2];
        if (i<cols.length-1) { objstring += ","; }
        objstring += "\n";
    }

    let blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'palette.txt');
};

let handle_key_down = function (event)
{
    //if (document.activeElement === Fdom) { return; }
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
    else if (event.key === "v" || event.key === "V")
    {
        init_voronoi();
        draw();
    }
    else if (event.key === "s" || event.key === "S")
    {
        save_pal();
    }
    else if (event.key === "+" )
    {
        addcolor();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    
    colsdiv = document.getElementById("colsdiv");
    
    ipix = document.getElementById("ipix");
    ivn  = document.getElementById("ivn");
    ipix.value = 2;
    ivn.value  = 100;
    
    addcolor();
    
    init_voronoi();
    resize();
    draw();
};

window.seth = seth;
window.sets = sets;
window.setv = setv;
window.addcolor = addcolor;
window.delcolor = delcolor;

window.addEventListener("resize", function() { resize(); draw(); });

document.addEventListener("keydown", handle_key_down);
document.addEventListener("DOMContentLoaded", init);
