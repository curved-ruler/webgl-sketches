

/////////// 3D ROTATION MAGIC ///////////

var rotx = function (a)
{
    var c = Math.cos(a/180*Math.PI);
    var s = Math.sin(a/180*Math.PI);
    return [
        1,  0,  0, 0,
        0,  c, -s, 0,
        0,  s,  c, 0,
        0,  0,  0, 1
    ];
};

var roty = function (a)
{
    var c = Math.cos(a/180*Math.PI);
    var s = Math.sin(a/180*Math.PI);
    return [
         c, 0,  s, 0,
         0, 1,  0, 0,
        -s, 0,  c, 0,
         0, 0,  0, 1
    ];
};

var rotz = function (a)
{
    var c = Math.cos(a/180*Math.PI);
    var s = Math.sin(a/180*Math.PI);
    return [
        c, -s, 0, 0,
        s,  c, 0, 0,
        0,  0, 1, 0,
        0,  0, 0, 1
    ];
};
    
var matrixmul = function (ma, mb)
{
    var ret = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
    for (var i=0 ; i<4 ; i++)
    {
        for (var j=0 ; j<4 ; j++)
        {
            var sum = 0;
            for (var k=0 ; k<4 ; k++)
            {
                sum += ma[j*4 + k] * mb[k*4 + i];
            }
            ret[j*4 + i] = sum;
        }
    }
    return ret;
};
var mvmul = function (m, v)
{
    var ret = [
        v[0]*m[0] + v[1]*m[4] + v[2]*m[8]  + m[12],
        v[0]*m[1] + v[1]*m[5] + v[2]*m[9]  + m[13],
        v[0]*m[2] + v[1]*m[6] + v[2]*m[10] + m[14],
        v[0]*m[3] + v[1]*m[7] + v[2]*m[11] + m[15]
    ];
    
    if (Math.abs(ret[3]) > 0.000001)
    {
        return [ret[0]/ret[3], ret[1]/ret[3], ret[2]/ret[3]];
    }
    else
    {
        return [0, 0, 0];
    }
};

/////////// END OF ROTATION MAGIC ///////////





canvas3        = null;
canvas3context = null;
canvas4        = null;
canvas4context = null;

var cube3verts = [
  -1, -1, -1, //0
   1, -1, -1, //1
   1,  1, -1, //2
  -1,  1, -1, //3
   
  -1, -1,  1, //4
   1, -1,  1, //5
   1,  1,  1, //6
  -1,  1,  1  //7
];
var cube3edges = [
  0, 1,
  1, 2,
  2, 3,
  3, 0,
  
  4, 5,
  5, 6,
  6, 7,
  7, 4,
  
  0, 4,
  1, 5,
  2, 6,
  3, 7
];

var cube4verts = [
  1,  1,  1,  1,
  1,  1,  1, -1,
  1,  1, -1,  1,
  1,  1, -1, -1,
  1, -1,  1,  1,
  1, -1,  1, -1,
  1, -1, -1,  1,
  1, -1, -1, -1,
 -1,  1,  1,  1,
 -1,  1,  1, -1,
 -1,  1, -1,  1,
 -1,  1, -1, -1,
 -1, -1,  1,  1,
 -1, -1,  1, -1,
 -1, -1, -1,  1,
 -1, -1, -1, -1
];

var cube4edges = [
   0,  8,
   0,  4,
   0,  2,
   0,  1,
   1,  9,
   1,  5,
   1,  3,
   2, 10,
   2,  6,
   2,  3,
   3, 11,
   3,  7,
   4, 12,
   4,  6,
   4,  5,
   5, 13,
   5,  7,
   6, 14,
   6,  7,
   7, 15,
   8, 12,
   8, 10,
   8,  9,
   9, 13,
   9, 11,
  10, 14,
  10, 11,
  11, 15,
  12, 14,
  12, 13,
  13, 15,
  14, 15
];

var light3d = [0, 0, 3];
var zplane  =       -3;
var light4d = [0, 0, 0, 3];
var wplane  =          -3;

var scale3  = 0.5;
var scale4  = 0.5;

var cam4d = [0, 0, 13];
var z4    =       -13;


// for rotating the hypercube
var axis     = 0;
var rotation = 0;
//var rotdir   = true;
var grabbed  = 0;





////// line: (v0 -- v1), z=z plane intersection
var intersect_3d_z = function (v0, v1, z)
{
    var linex = v1[0] - v0[0];
    var liney = v1[1] - v0[1];
    var linez = v1[2] - v0[2];
    
    if (Math.abs(linez) > 0.000001)
    {
        var lambda = z / linez;
        return [linex * lambda, liney * lambda];
    }
    else
    {
        return [0, -100000];
    }
};
var intersect_4d_w = function (v0, v1, w)
{
    var linex = v1[0] - v0[0];
    var liney = v1[1] - v0[1];
    var linez = v1[2] - v0[2];
    var linew = v1[3] - v0[3];
    
    if (Math.abs(linew) > 0.000001)
    {
        var lambda = w / linew;
        return [linex * lambda, liney * lambda, linez * lambda];
    }
    else
    {
        return [0, 0, -100000];
    }
};


var move_to_canvas_center = function (can, p, scale)
{
    return [(can.width  + can.height * p[0] * scale) / 2,
            (can.height - can.height * p[1] * scale) / 2];
};

var draw3d = function()
{
    canvas3context.clearRect(0, 0, canvas3.width, canvas3.height);
    
    for (var i=0 ; i<cube3edges.length/2 ; ++i)
    {
        var v0 = [cube3verts[cube3edges[i*2]     * 3],
                  cube3verts[cube3edges[i*2]     * 3 + 1],
                  cube3verts[cube3edges[i*2]     * 3 + 2]];
        
        var v1 = [cube3verts[cube3edges[i*2 + 1] * 3],
                  cube3verts[cube3edges[i*2 + 1] * 3 + 1],
                  cube3verts[cube3edges[i*2 + 1] * 3 + 2]];
        
        var proj0 = intersect_3d_z(light3d, v0, zplane);
        var proj1 = intersect_3d_z(light3d, v1, zplane);
        
        var p0 = move_to_canvas_center(canvas3, proj0, scale3);
        var p1 = move_to_canvas_center(canvas3, proj1, scale3);
        
        canvas3context.beginPath();
        canvas3context.moveTo(p0[0], p0[1]);
        canvas3context.lineTo(p1[0], p1[1]);
        canvas3context.stroke();
    }
};

var draw4d = function()
{
    canvas4context.clearRect(0, 0, canvas4.width, canvas4.height);
    
    for (var i=0 ; i<cube4edges.length/2 ; ++i)
    {
        var v0 = [cube4verts[cube4edges[i*2]     * 4],
                  cube4verts[cube4edges[i*2]     * 4 + 1],
                  cube4verts[cube4edges[i*2]     * 4 + 2],
                  cube4verts[cube4edges[i*2]     * 4 + 3]];
        
        var v1 = [cube4verts[cube4edges[i*2 + 1] * 4],
                  cube4verts[cube4edges[i*2 + 1] * 4 + 1],
                  cube4verts[cube4edges[i*2 + 1] * 4 + 2],
                  cube4verts[cube4edges[i*2 + 1] * 4 + 3]];
        
        var pppp0 = intersect_4d_w(light4d, v0, wplane);
        var pppp1 = intersect_4d_w(light4d, v1, wplane);
        
        var modelmat = roty(-rotation);
        modelmat = matrixmul(rotx(axis), modelmat);
        
        var ppp0 = mvmul(modelmat, pppp0);
        var ppp1 = mvmul(modelmat, pppp1);
        
        var pp0 = intersect_3d_z(cam4d, ppp0, z4);
        var pp1 = intersect_3d_z(cam4d, ppp1, z4);
        
        var p0 = move_to_canvas_center(canvas4, pp0, scale4);
        var p1 = move_to_canvas_center(canvas4, pp1, scale4);
        
        //console.log('P', p0[0], p0[1], 'P', p1[0], p1[1], i);
        
        canvas4context.beginPath();
        canvas4context.moveTo(p0[0], p0[1]);
        canvas4context.lineTo(p1[0], p1[1]);
        canvas4context.stroke();
    }
};

var handle_wheel = function (event)
{
    if (event.deltaY < 0) scale4 *= 1.25;
    else                  scale4 *= 0.8;
    
    draw4d();
}
var handle_mouse_down = function (event)
{
    grabbed = 1;
    //rotdir = (axis < 90) || (axis > 270);
};
var handle_mouse_up = function (event)
{
    grabbed = 0;
};

var handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        axis -= event.movementY*0.25;
        //rotation += rotdir ? event.movementX*0.25 : event.movementX*-0.25;
        rotation += event.movementX*0.25;
        
        // Ensure [0,360]
        axis = axis - Math.floor(axis/360.0)*360.0;
        rotation = rotation - Math.floor(rotation/360.0)*360.0;
        
        draw4d();
    }
};


var init = function()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas3 = document.getElementById('canvas3d');
    canvas3context = canvas3.getContext('2d');
    
    canvas4 = document.getElementById('canvas4d');
    canvas4context = canvas4.getContext('2d');
    canvas4.addEventListener("mousedown", handle_mouse_down);
    canvas4.addEventListener("mouseup",   handle_mouse_up);
    canvas4.addEventListener("mousemove", handle_mouse_move);
    canvas4.addEventListener("wheel",     handle_wheel);
    
    draw3d();
    draw4d();
};
document.addEventListener("DOMContentLoaded", init);
