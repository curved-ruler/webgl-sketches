
let file_dom = null;
let font_dom = null;
let shade_dom = null;
let board  = null;
let bc_dom = null;
let charx = 10;
let chary = 15;
let rx = 0;
let ry = 0;
let file = false;
let im_dom = null;
let canvas = null;
let ctx = null;
let imdata   = {};
let rendered = [];


let font  = "20px Courier";
let shade = " .+%";


let pixel_brightness = function (r,g,b)
{
    return (0.299*r + 0.587*g + 0.114*b);
};

let draw = function ()
{
    if (!file) return;
    
    rx = Math.floor(imdata.width  / charx);
    ry = Math.floor(imdata.height / chary);
    rendered = "";
    
    for (let i=0 ; i<ry ; ++i)
    {
    for (let j=0 ; j<rx ; ++j)
    {
        let rsum = 0;
        let gsum = 0;
        let bsum = 0;
        for (let k=0 ; k<chary ; ++k)
        for (let l=0 ; l<charx ; ++l)
        {
            rsum += imdata.data[(i+k)*imdata.width*4 + (j*charx + l)*4];
            gsum += imdata.data[(i+k)*imdata.width*4 + (j*charx + l)*4 + 1];
            bsum += imdata.data[(i+k)*imdata.width*4 + (j*charx + l)*4 + 2];
        }
        rsum /= 256*charx*chary;
        gsum /= 256*charx*chary;
        bsum /= 256*charx*chary;
        let bri = Math.floor((1-pixel_brightness(rsum, gsum, bsum)) * shade.length);
        rendered += shade.charAt(bri);
    }
    rendered += "\n";
    }
    
    board.innerHTML = rendered;
};

let resize = function ()
{
    if (!board) return;
    
    board.innerHTML = "ABCDE\nabcde\n01234\nmmmmm\nMMMMM";
    charx = Math.floor(bc_dom.offsetWidth / 5);
    chary = Math.floor(bc_dom.offsetHeight / 5);
};

let handle_file_change = function (files)
{
    im_dom.addEventListener("load", () => {
        file = true;
        canvas.width  = im_dom.width;
        canvas.height = im_dom.height;
        ctx.drawImage(im_dom, 0, 0);
        imdata = ctx.getImageData(0, 0, canvas.width, canvas.height);
        //resize();
        draw();
    });
    im_dom.src = URL.createObjectURL(file_dom.files[0]);
};

let init = function ()
{
    canvas = document.getElementById("canv");
    ctx    = canvas.getContext("2d");
    board  = document.getElementById("board");
    
    bc_dom = document.getElementById("board-cont");
    
    file_dom  = document.getElementById("file-in");
    font_dom  = document.getElementById("font-in");
    shade_dom = document.getElementById("shade-in");
    im_dom    = document.getElementById("im");
    
    file_dom.addEventListener("change", handle_file_change);
    font_dom.value  = font;
    shade_dom.value = shade;
    
    font_change();
    draw();
};


window.font_change  = () => { font  = font_dom.value; board.style.font=font; resize(); draw(); }
window.shade_change = () => { shade = shade_dom.value; draw(); }

document.addEventListener("DOMContentLoaded", init);
