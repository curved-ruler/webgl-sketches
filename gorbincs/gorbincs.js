
import { geom2d } from "./geom2d.js";


var menu_hidden = false;

var grabbed  = -1;
var mode     = 0;    // 0 - add, 1 - move, 2 - delete
var curvemode  = 0;
var curvemodes = ["Bezier", "Bezier4 patches", "Lagrange interpolaton", "Hermite", "Catmull-Rom"];
var vectormode = [false, true, false, true, false];
var canvas   = null;
var context  = null;
var pts = 20;
var scale = 1;
var alpha = 0.4;

var show_cont = true;
var show_curve = true;
var show_curvature = 0;

var bog_size = 10;
var controls = []; // 1 control: x, y, x+vx, y+vy
var curve    = [];
var curve_c  = [];

var back_col = [0.2, 0.2, 0.2];
var curv_col = [1.0, 0.6, 0.2];
var cuva_col = [1.0, 1.0, 1.0];
var cont_col = [0.0, 1.0, 1.0];



var init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    if (!canvas) { console.error('ERROR: No <canvas>'); return; }
    context = canvas.getContext('2d');
    if (!context) { console.error('ERROR: No context'); return; }
    
    create_dropdowns();
    
    canvas.addEventListener("mousedown", handleMouseDown);
    
    resize();
    draw();
};

var resize = function ()
{
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

var draw = function ()
{
    if (!canvas) return;

    context.fillStyle=`rgb(${back_col[0]*256}, ${back_col[1]*256}, ${back_col[2]*256})`;
    context.fillRect(0,0,canvas.width,canvas.height);

    if (show_cont)
    {
        context.fillStyle   =`rgb(${cont_col[0]*256}, ${cont_col[1]*256}, ${cont_col[2]*256})`;
        context.strokeStyle =`rgb(${cont_col[0]*256}, ${cont_col[1]*256}, ${cont_col[2]*256})`;
        
        if (vectormode[curvemode])
        {
            for (var i=0 ; i<controls.length/4; ++i)
            {
                context.beginPath();
                var p1 = scaleup([ controls[i*4],   controls[i*4+1] ]);
                var p2 = scaleup([ controls[i*4+2], controls[i*4+3] ]);
                context.arc(p1[0], p1[1], bog_size/2, 0, 2 * Math.PI, false);
                context.fill();
                
                context.beginPath();
                context.moveTo(p1[0], p1[1]);
                context.lineTo(p2[0], p2[1]);
                context.stroke();
            }
        }
        else
        {
            for (var i=0 ; i<controls.length/2; ++i)
            {
                context.beginPath();
                var p1 = scaleup([ controls[i*2], controls[i*2+1] ]);
                context.arc(p1[0], p1[1], bog_size/2, 0, 2 * Math.PI, false);
                context.fill();
            }
        }
    }

    if (show_curve)
    {
        context.fillStyle =`rgb(${curv_col[0]*256}, ${curv_col[1]*256}, ${curv_col[2]*256})`;
        for (var i=0 ; i<curve.length/2; ++i)
        {
            context.beginPath();
            var p1 = scaleup([ curve[i*2], curve[i*2+1] ]);
            context.arc(p1[0], p1[1], 2, 0, 2 * Math.PI, false);
            context.fill();
        }
    }

    if (alpha > 0.98) context.strokeStyle =`rgb(${cuva_col[0]*256}, ${cuva_col[1]*256}, ${cuva_col[2]*256})`;
    else              context.strokeStyle =`rgba(${cuva_col[0]*256}, ${cuva_col[1]*256}, ${cuva_col[2]*256}, ${alpha})`;
    if (show_curvature === 1)
    {
        for (var i=0 ; i<curve.length/2; ++i)
        {
            var p1 = scaleup([ curve[i*2],   curve[i*2+1]   ]);
            var p2 = scaleup([ curve_c[i*2], curve_c[i*2+1] ]);
            
            context.beginPath();
            context.moveTo(p1[0], p1[1]);
            context.lineTo(p2[0], p2[1]);
            context.stroke();
        }
    }
    else if (show_curvature === 2 || show_curvature === 3)
    {
        for (var i=0 ; i<curve.length/2; ++i)
        {
            var p = scaleup([curve_c[i*2], curve_c[i*2+1]]);
            var r = Math.sqrt(
                        (curve_c[i*2] - curve[i*2])*(curve_c[i*2] - curve[i*2]) +
                        (curve_c[i*2+1] - curve[i*2+1]) * (curve_c[i*2+1] - curve[i*2+1])
                    ) * scale;
            
            context.beginPath();
            context.arc(p[0], p[1], r, 0, 2 * Math.PI, false);
            context.stroke();
        }
    }
};

var grab = function (x, y)
{
    var pixdiff = bog_size / scale;

    for (var i=0 ; i<controls.length/2 ; ++i)
    {
        if (Math.abs(controls[2*i]   - x) < pixdiff &&
            Math.abs(controls[2*i+1] - y) < pixdiff)
        {
            grabbed = i;
        }
    }
};
var grab_base = function (x, y)
{
    var pixdiff = bog_size / scale;

    for (var i=0 ; i<controls.length/2 ; i+=2)
    {
        if (Math.abs(controls[2*i]   - x) < pixdiff &&
            Math.abs(controls[2*i+1] - y) < pixdiff)
        {
            grabbed = i;
        }
    }
};

var check = function(a,b)
{
    //console.log("CHECK", Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]));
    if (Math.abs(a[0]-b[0]) > 0.0000001 || Math.abs(a[1]-b[1]) > 0.0000001)
    {
        console.log("CHECK FAILED", Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]));
    }
}

var reciprok = function (v)
{
    var lenn = v[0]*v[0]+v[1]*v[1];
    if (lenn < 0.0000001) return [0,0];
    return [v[0] / lenn, v[1] / lenn];
}

var calc_curvature = function()
{
    if (curve.length < 2) return [];
    
    curve_c = [];
    
    curve_c.push(curve[0]);
    curve_c.push(curve[1]);
    
    for (var i=1 ; i<curve.length/2 - 1 ; ++i)
    {
        var pv1 = [(curve[(i-1)*2] - curve[i*2])/2, (curve[(i-1)*2 + 1] - curve[i*2 + 1])/2];
        var v1  = [pv1[1], -pv1[0]];
        var p1  = [curve[i*2] + pv1[0], curve[i*2+1] + pv1[1]];
        
        var pv2 = [(curve[(i+1)*2] - curve[i*2])/2, (curve[(i+1)*2 + 1] - curve[i*2 + 1])/2];
        var v2  = [pv2[1], -pv2[0]];
        var p2  = [curve[i*2] + pv2[0], curve[i*2+1] + pv2[1]];
        
        var ts = geom2d.intersect_lines(
            { p:p1, v:v1 },
            { p:p2, v:v2 }
        );
        
        if (ts.length == 2)
        {
            var q = [p1[0] + ts[0]*v1[0], p1[1] + ts[0]*v1[1]];

            //var q2 = [p2[0] + ts[1]*v2[0], p2[1] + ts[1]*v2[1]];
            //check(q,q2);
            
            if (show_curvature === 1 || show_curvature === 2)
            {
                var qv = reciprok([curve[i*2]-q[0], curve[i*2+1]-q[1]]);
                curve_c.push(curve[i*2]   + 3000*qv[0]/scale);
                curve_c.push(curve[i*2+1] + 3000*qv[1]/scale);
            }
            else
            {
                curve_c.push(q[0]);
                curve_c.push(q[1]);
            }
        }
        else
        {
            console.log("OOF");
            curve_c.push(curve[i*2]);
            curve_c.push(curve[i*2+1]);
        }
    }
    
    var i = curve.length/2 - 1;
    curve_c.push(curve[i*2]);
    curve_c.push(curve[i*2+1]);
}

let calcBezier = function ()
{
    curve = [];
    
    let n = controls.length/2;
    
    for (let pi=0 ; pi<pts ; ++pi)
    {
        let t = pi/(pts-1);
        let P = [0,0];
        for (let ci=0 ; ci<n ; ++ci)
        {
            let Bt = 1.0;
            let ni = n-1;
            for (let i=0 ; i<ci ; ++i)
            {
                Bt *= ni / (i+1);
                --ni;
            }
            
            P[0] += controls[ci*2]   * Bt * Math.pow(t,ci) * Math.pow(1-t, n-1-ci);
            P[1] += controls[ci*2+1] * Bt * Math.pow(t,ci) * Math.pow(1-t, n-1-ci);
        }
        
        curve.push(P[0]);
        curve.push(P[1]);
    }
    
    calc_curvature();
};

var calcB4 = function ()
{
    curve = [];
    
    for (var i=1 ; i<controls.length/4 ; ++i)
    {
        var t   = 0;
        var dt  = 1 / (pts-1);
        var p3x, p3y, cx, cy;
        for (var j=0 ; j<pts-1 ; ++j)
        {
            p3x = 2*controls[i*4]   - controls[i*4+2];
            p3y = 2*controls[i*4+1] - controls[i*4+3];
            cx = (1-t)*(1-t)*(1-t)*controls[(i-1)*4]   + 3*t*(1-t)*(1-t)*controls[(i-1)*4+2] + 3*t*t*(1-t)*p3x + t*t*t*controls[i*4];
            cy = (1-t)*(1-t)*(1-t)*controls[(i-1)*4+1] + 3*t*(1-t)*(1-t)*controls[(i-1)*4+3] + 3*t*t*(1-t)*p3y + t*t*t*controls[i*4+1];
            curve.push(cx);
            curve.push(cy);
            t += dt;
        }
    }
    
    calc_curvature();
};

var calcLagrange = function ()
{
    curve = [];
    
    var n = controls.length/2;
    if (n < 2) return;
    
    var dt = 1 / ((n-1)*pts);
    var cx, cy;
    for (var t=0 ; t<=1.001 ; t+=dt)
    {
        cx = 0;
        cy = 0;
        for (var i=0 ; i<n ; ++i)
        {
            var L = 1;
            for (var li = 0 ; li < n ; ++li)
            {
                L *= (li == i) ? 1 : (t - li/(n-1)) / (i/(n-1) - li/(n-1));
            }
            cx += controls[i*2]   * L;
            cy += controls[i*2+1] * L;
        }
        curve.push(cx);
        curve.push(cy);
    }
    
    calc_curvature();
};

let calcHermite = function ()
{
    curve = [];
    
    for (let i=0 ; i-1<controls.length/4 ; ++i)
    {
        let t   = 0;
        let dt  = 1 / (pts-1);
        
        let m0x = controls[i*4+2] - controls[i*4];
        let m0y = controls[i*4+3] - controls[i*4+1];
        let m1x = controls[(i+1)*4+2] - controls[(i+1)*4];
        let m1y = controls[(i+1)*4+3] - controls[(i+1)*4+1];
        
        for (let j=0 ; j<pts-1 ; ++j)
        {
            let cx = (2*t*t*t - 3*t*t + 1)*controls[(i)*4]   + (t*t*t - 2*t*t + t)*m0x + (-2*t*t*t + 3*t*t)*controls[(i+1)*4]   + (t*t*t - t*t)*m1x;
            let cy = (2*t*t*t - 3*t*t + 1)*controls[(i)*4+1] + (t*t*t - 2*t*t + t)*m0y + (-2*t*t*t + 3*t*t)*controls[(i+1)*4+1] + (t*t*t - t*t)*m1y;
            curve.push(cx);
            curve.push(cy);
            t += dt;
        }
    }
    
    calc_curvature();
};

let calcCatmullRom = function ()
{
    curve = [];
    
    for (let i=1 ; i-2<controls.length/2 ; ++i)
    {
        let t   = 0;
        let dt  = 1 / (pts-1);
        
        let m0x = (controls[(i+1)*2]   - controls[(i-1)*2])   / 2;
        let m0y = (controls[(i+1)*2+1] - controls[(i-1)*2+1]) / 2;
        let m1x = (controls[(i+2)*2]   - controls[(i)*2])     / 2;
        let m1y = (controls[(i+2)*2+1] - controls[(i)*2+1])   / 2;
        
        for (let j=0 ; j<pts-1 ; ++j)
        {
            let cx = (2*t*t*t - 3*t*t + 1)*controls[(i)*2]   + (t*t*t - 2*t*t + t)*m0x + (-2*t*t*t + 3*t*t)*controls[(i+1)*2]   + (t*t*t - t*t)*m1x;
            let cy = (2*t*t*t - 3*t*t + 1)*controls[(i)*2+1] + (t*t*t - 2*t*t + t)*m0y + (-2*t*t*t + 3*t*t)*controls[(i+1)*2+1] + (t*t*t - t*t)*m1y;
            curve.push(cx);
            curve.push(cy);
            t += dt;
        }
    }
    
    calc_curvature();
};

var calc_curve = function ()
{
    switch (curvemode)
    {
        case 0 : calcBezier(); break;
        case 1 : calcB4(); break;
        case 2 : calcLagrange(); break;
        case 3 : calcHermite(); break;
        case 4 : calcCatmullRom(); break;
        default: break;
    }
};

var scaledn = function (v) { return [(v[0] - (canvas.width/2)) / scale, (v[1] - (canvas.height/2)) / scale]; };
var scaleup = function (v) { return [(v[0] * scale) + (canvas.width/2), (v[1] * scale) + (canvas.height/2)]; };
var zoomin  = function () { scale *= 1.25; draw(); };
var zoomout = function () { scale *= 0.8;  draw(); };

var handleMouseDown = function (event)
{
    //console.log("E", event.clientX, event.clientY);
    
    if (mode === 0)
    {
        //++pn;
        var p  = scaledn([event.clientX,    event.clientY]);
        var pc = scaledn([event.clientX+40, event.clientY+40]);
        
        if (vectormode[curvemode])
        {
            controls.push(p[0]);
            controls.push(p[1]);
            controls.push(pc[0]);
            controls.push(pc[1]);
        }
        else
        {
            controls.push(p[0]);
            controls.push(p[1]);
        }
        calc_curve();
        draw();
    }
    else if (mode === 1)
    {
        var p  = scaledn([event.clientX, event.clientY]);
        grab( p[0], p[1] );
    }
    else if (mode === 2)
    {
        var p  = scaledn([event.clientX, event.clientY]);
        
        if (vectormode[curvemode])
        {
            grab_base( p[0], p[1] );
            if (grabbed >= 0)
            {
                controls.splice(grabbed*2, 4);
            }
        }
        else
        {
            grab( p[0], p[1] );
            if (grabbed >= 0)
            {
                controls.splice(grabbed*2, 2);
            }
        }
        grabbed = -1;
        calc_curve();
        draw();
    }
};

var handleMouseUp = function (event)
{
    grabbed = -1;
};

var handleMouseMove = function (event)
{
    if (grabbed < 0) return;
    
    //var d = [event.movementX / (canvas.width/2), event.movementY / (canvas.height/2)];
    var d = [event.movementX/scale, event.movementY/scale];
    
    controls[grabbed*2]   += d[0];
    controls[grabbed*2+1] += d[1];
    if (vectormode[curvemode] && grabbed % 2 === 0)
    {
        controls[grabbed*2+2] += d[0];
        controls[grabbed*2+3] += d[1];
    }
    
    calc_curve();
    draw();
};

var handleKeyDown = function (event)
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
};

var handleWheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
};

var create_dropdowns = function ()
{
    var cmlist = document.getElementById('curve_type');
    for (var i=0 ; i<curvemodes.length ; ++i)
    {
        var option = document.createElement("option");
        option.value = i;
        option.text  = curvemodes[i];
        cmlist.appendChild(option);
    }
};

var toggle_mode = function ()
{
    ++mode; if (mode > 2) mode = 0;
    
    var msp = document.getElementById('mode_span');
    if      (mode === 0) msp.innerHTML = 'Add';
    else if (mode === 1) msp.innerHTML = 'Move';
    else                 msp.innerHTML = 'Delete';
};

var set_pts = function (strval)
{
    var ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 1)
    {
        pts = 20;
    }
    else
    {
        pts = ival;
    }
    
    calc_curve();
    draw();
};

var s_curve = function (val)
{
    show_curve = val;
    draw();
};
var s_cont = function (val)
{
    show_cont = val;
    draw();
};
var set_curvature = function (strval)
{
    switch (strval)
    {
        case 'curva_no' :
            show_curvature = 0; break;
        case 'curva_lin' :
            show_curvature = 1; break;
        case 'curva_circ' :
            show_curvature = 2; break;
        case 'curva_circ_ok' :
            show_curvature = 3; break;
        
        default:
            show_curvature = 0;
    }
    
    calc_curve();
    draw();
};
var set_curve_type = function (strval)
{
    var ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 0 || ival >= curvemodes.length )
    {
        console.log('ERROR: set_curve_type input: ', strval);
    }
    else
    {
        var len = controls.length/2;
        if (!vectormode[curvemode] && vectormode[ival] && len % 2 === 1) { controls.splice(-2,2); }
        curvemode = ival;
        calc_curve();
        draw();
    }
};

window.toggle_mode = toggle_mode;
window.s_curve = s_curve;
window.s_cont  = s_cont;
window.set_curvature = set_curvature;
window.set_pts = set_pts;
window.set_curve_type = set_curve_type;

document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

