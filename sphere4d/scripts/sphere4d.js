
import { glprogram as gl } from "./glprogram.js";
import { shaders } from "./shaders.js";
import { matrix4 as m4 } from "./matrix4.js";
import { vector3 as v3 } from "./vector3.js";
import { transformations as tr } from "./transformations.js";
import { parameters as P } from "./parameters.js";

var glx    = null;
var shader = null;
var canvas = null;

var camera = {
    eye   : [0, 0, 50],
    look  : [0, 0, -1],
    up    : [0, 1, 0],
    near  : 0.1,
    median: 30,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1
};

var projectionMatrix, modelViewMatrix;
var scale = 2.5;
var rot1 = m4.init();
var axis = 0;
var rotation = 0;
var rotdir = true;
var mouse_down_3d;

var pts4 = [];

var allvert = [];
var vert    = [];

var line = [];
var vertBuffer = null;
var lineBuffer = null;

var spiral1 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = Math.PI;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var dfi1 =   Math.PI / P.N * 1;
    var dfi2 =  -Math.PI / P.N * 1;
    var dfi3 = 2*Math.PI / P.N *11;
    
    for (var i=0 ; i<P.N ; ++i)
    {
        var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
        pts4.push(vi);
        
        fi1 += dfi1;
        fi2 += dfi2;
        fi3 += dfi3;
    }
};

var spiral2 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = Math.PI;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var dfi1 =   Math.PI / P.N * 0;
    var dfi2 =   Math.PI / P.N * 1;
    var dfi3 = 2*Math.PI / P.N *11;
    
    for (var i=0 ; i<P.N ; ++i)
    {
        var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
        pts4.push(vi);
        
        fi1 += dfi1;
        fi2 += dfi2;
        fi3 += dfi3;
    }
};

var spiral3 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = Math.PI;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var dfi1 =   Math.PI / P.N * 1;
    var dfi2 =   Math.PI / P.N * 0;
    var dfi3 = 2*Math.PI / P.N * 5;
    
    for (var i=0 ; i<P.N ; ++i)
    {
        var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
        pts4.push(vi);
        
        fi1 += dfi1;
        fi2 += dfi2;
        fi3 += dfi3;
    }
};

var spiral4 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = 0.0;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var dfi1 =   Math.PI / P.N *10;
    var dfi2 =   Math.PI / P.N * 1;
    var dfi3 = 2*Math.PI / P.N * 0;
    
    for (var i=0 ; i<P.N ; ++i)
    {
        var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
        pts4.push(vi);
        
        fi1 += dfi1;
        fi2 += dfi2;
        fi3 += dfi3;
    }
};

var spiral5 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = 0.0;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var dfi1 =   Math.PI / P.N *10;
    var dfi2 =   Math.PI / P.N * 1;
    var dfi3 = 2*Math.PI / P.N * 1;
    
    for (var i=0 ; i<P.N ; ++i)
    {
        var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
        pts4.push(vi);
        
        fi1 += dfi1;
        fi2 += dfi2;
        fi3 += dfi3;
    }
};

var spiral6 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = 0.0;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var dfi1 =   Math.PI / P.N * 1;
    var dfi2 =   Math.PI / P.N * 1;
    var dfi3 = 2*Math.PI / P.N * 1;
    
    for (var i=0 ; i<P.N ; ++i)
    {
        var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
        pts4.push(vi);
        
        fi1 += dfi1;
        fi2 += dfi2;
        fi3 += dfi3;
    }
};

var spiral7 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = 0.0;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var dfi1 =   Math.PI / P.N * 5;
    var dfi2 =   Math.PI / P.N * 5;
    var dfi3 = 2*Math.PI / P.N * 5;
    
    for (var i=0 ; i<P.N ; ++i)
    {
        var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
        pts4.push(vi);
        
        fi1 += dfi1;
        fi2 += dfi2;
        fi3 += dfi3;
    }
};

var sphere_grid = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = 0.0;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var n  = 10;
    var n2 = 20;
    
    var dfi1 = Math.PI / (n-1);
    var dfi2 = Math.PI / (n-1);
    var dfi3 = Math.PI / (n2-1);
    
    for (var i=0 ; i<n-2 ; ++i)
    {
        for (var j=0 ; j<n-2 ; ++j)
        {
            for (var k=0 ; k<2*(n2-1) ; ++k)
            {
                fi1 = dfi1*(i+1);
                fi2 = dfi2*(j+1);
                fi3 = dfi3*(k);
                
                var vi = [P.R * Math.cos(fi1 + fip1),
                          P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                          P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                          P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
                pts4.push(vi);
            }
        }
    }
    
    dfi1 =   Math.PI / (n-1);
    dfi2 =   Math.PI / (n2-1);
    dfi3 = Math.PI / (n-1);
    
    for (var i=0 ; i<n-2 ; ++i)
    {
        for (var j=0 ; j<n2-2 ; ++j)
        {
            for (var k=0 ; k<2*(n-1) ; ++k)
            {
                fi1 = dfi1*(i+1);
                fi2 = dfi2*(j+1);
                fi3 = dfi3*(k);
                
                var vi = [P.R * Math.cos(fi1 + fip1),
                          P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                          P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                          P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
                pts4.push(vi);
            }
        }
    }
    
    dfi1 =   Math.PI / (n2-1);
    dfi2 =   Math.PI / (n-1);
    dfi3 = Math.PI / (n-1);
    
    for (var i=0 ; i<n2-2 ; ++i)
    {
        for (var j=0 ; j<n-2 ; ++j)
        {
            for (var k=0 ; k<2*(n-1) ; ++k)
            {
                fi1 = dfi1*(i+1);
                fi2 = dfi2*(j+1);
                fi3 = dfi3*(k);
                
                var vi = [P.R * Math.cos(fi1 + fip1),
                          P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                          P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                          P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
                pts4.push(vi);
            }
        }
    }
};

var sphere_grid_1 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = 0.0;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var n  = 10;
    var n2 = 100;
    
    var dfi1 = Math.PI / (n-1);
    var dfi2 = Math.PI / (n-1);
    var dfi3 = Math.PI / (n2-1);
    
    for (var i=0 ; i<n-2 ; ++i)
    {
        for (var j=0 ; j<n-2 ; ++j)
        {
            for (var k=0 ; k<2*(n2-1) ; ++k)
            {
                fi1 = dfi1*(i+1);
                fi2 = dfi2*(j+1);
                fi3 = dfi3*(k);
                
                var vi = [P.R * Math.cos(fi1 + fip1),
                          P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                          P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                          P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
                pts4.push(vi);
            }
        }
    }
};
var sphere_grid_2 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = 0.0;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var n  = 10;
    var n2 = 100;
    
    var dfi1 =   Math.PI / (n-1);
    var dfi2 =   Math.PI / (n2-1);
    var dfi3 = Math.PI / (n-1);
    
    for (var i=0 ; i<n-2 ; ++i)
    {
        for (var j=0 ; j<n2-2 ; ++j)
        {
            for (var k=0 ; k<2*(n-1) ; ++k)
            {
                fi1 = dfi1*(i+1);
                fi2 = dfi2*(j+1);
                fi3 = dfi3*(k);
                
                var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
                pts4.push(vi);
            }
        }
    }
};
var sphere_grid_3 = function ()
{
    pts4 = [];
    
    var fi1 = 0.0;
    var fi2 = 0.0;
    var fi3 = 0.0;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    var n  = 10;
    var n2 = 100;
    
    var dfi1 =   Math.PI / (n2-1);
    var dfi2 =   Math.PI / (n-1);
    var dfi3 = Math.PI / (n-1);
    
    for (var i=0 ; i<n2-2 ; ++i)
    {
        for (var j=0 ; j<n-2 ; ++j)
        {
            for (var k=0 ; k<2*(n-1) ; ++k)
            {
                fi1 = dfi1*(i+1);
                fi2 = dfi2*(j+1);
                fi3 = dfi3*(k);
                
                var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
                pts4.push(vi);
            }
        }
    }
};

var proj_back = function (x, y, z)
{
    //var beta = P.R / Math.sqrt((x*x + y*y + z*z + (P.D-P.R)*(P.D-P.R)));
    var beta = 2*(P.R-P.D)*P.R / (x*x + y*y + z*z + (P.D-P.R)*(P.D-P.R));
    return [x*beta, y*beta, z*beta, (P.D-P.R)*beta + P.R];
};

var grid = function ()
{
    pts4 = [];
    
    var n  = 10;
    //var n2 = 100;
    var s  = 1.5;
    //var s2 = (n2/n)
    var dd = (n-1)*s / 2;
    var fip1 = P.FI1/180*Math.PI;
    var fip2 = P.FI2/180*Math.PI;
    var fip3 = P.FI3/180*Math.PI;
    //var fip = 0;
    
    for (var i=0 ; i<n ; ++i)
    {
        for (var j=0 ; j<n ; ++j)
        {
            for (var k=0 ; k<n ; ++k)
            {
                var x = proj_back(i*s-dd, j*s-dd, k*s-dd);
                
                //var fi1 = Math.acos(x[0] / P.R);
                ////var fi2 = Math.acos(x[1] / Math.sqrt(x[1]*x[1] + x[2]*x[2] + x[3]*x[3]));
                ////var fi3 = (x[3] >= 0) ? Math.acos(x[2] / Math.sqrt(x[2]*x[2] + x[3]*x[3])) : 2*Math.PI - Math.acos(x[2] / Math.sqrt(x[2]*x[2] + x[3]*x[3]));
                //var fi2 = Math.acos(x[1] / (P.R*Math.sin(fi1)));
                //var fi3 = Math.acos(x[2] / (P.R*Math.sin(fi1)*Math.sin(fi2)));
                
                var fi1 = Math.PI/2 - Math.atan2(x[0], Math.sqrt(x[1]*x[1] + x[2]*x[2] + x[3]*x[3]));
                var fi2 = Math.PI/2 - Math.atan2(x[1], Math.sqrt(x[2]*x[2] + x[3]*x[3]));
                var fi3 = Math.PI - 2*Math.atan2(x[2] + Math.sqrt(x[3]*x[3] + x[2]*x[2]), x[3]);
                
                //var fi1 = Math.atan2(Math.sqrt(x[1]*x[1] + x[2]*x[2] + x[3]*x[3]), x[0]);
                //var fi2 = Math.atan2(Math.sqrt(x[2]*x[2] + x[3]*x[3]), x[1]);
                //var fi3 = 2*Math.atan2(x[3], x[2] + Math.sqrt(x[3]*x[3] + x[2]*x[2]));
                
                var vi = [P.R * Math.cos(fi1 + fip1),
                  P.R * Math.sin(fi1 + fip1) * Math.cos(fi2 + fip2),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.cos(fi3 + fip3),
                  P.R * Math.sin(fi1 + fip1) * Math.sin(fi2 + fip2) * Math.sin(fi3 + fip3)];
                
                //pts4.push(x);
                pts4.push(vi);
            }
        }
    }
};

var flatten_and_alpha = function(arr_of_arrs)
{
    var ret = [];
    var curra = P.alpha;
    
    var dalpha = 0;
    if      (P.follow < 3)  dalpha = P.dalpha2;
    else if (P.follow < 4)  dalpha = P.dalpha3;
    else if (P.follow < 5)  dalpha = P.dalpha4;
    else dalpha = (P.alpha - P.lastalpha) / (arr_of_arrs.length-1);
    
    
    for (var i = arr_of_arrs.length-1; i >= 0; --i)
    {
        for (var j = 0; j < arr_of_arrs[i].length; j+=4)
        {
            ret.push(arr_of_arrs[i][j]);
            ret.push(arr_of_arrs[i][j+1]);
            ret.push(arr_of_arrs[i][j+2]);
            ret.push(curra);
            //arr_of_arrs[i][j] = curra;
        }
        //ret = ret.concat(arr_of_arrs[i]);
        curra -= dalpha;
    }
    return ret;
}

var calclines_1 = function(arr_of_arrs)
{
    var ret = [];
    var curra = P.alpha;
    
    var dalpha = 0;
    if      (P.follow < 3)  dalpha = P.dalpha2;
    else if (P.follow < 4)  dalpha = P.dalpha3;
    else if (P.follow < 5)  dalpha = P.dalpha4;
    else dalpha = (P.alpha - P.lastalpha) / (arr_of_arrs.length-1);
    
    
    for (var i = arr_of_arrs.length-1; i >= 0; --i)
    {
        for (var j = 4; j < arr_of_arrs[i].length; j+=4)
        {
            ret.push(arr_of_arrs[i][j-4]);
            ret.push(arr_of_arrs[i][j-4+1]);
            ret.push(arr_of_arrs[i][j-4+2]);
            ret.push(curra);
            
            ret.push(arr_of_arrs[i][j]);
            ret.push(arr_of_arrs[i][j+1]);
            ret.push(arr_of_arrs[i][j+2]);
            ret.push(curra);
            
            if (i>0)
            {
                ret.push(arr_of_arrs[i-1][j]);
                ret.push(arr_of_arrs[i-1][j+1]);
                ret.push(arr_of_arrs[i-1][j+2]);
                ret.push(curra);
            
                ret.push(arr_of_arrs[i][j]);
                ret.push(arr_of_arrs[i][j+1]);
                ret.push(arr_of_arrs[i][j+2]);
                ret.push(curra);
            }
        }
        curra -= dalpha;
    }
    return ret;
}

var project = function ()
{
    var h0 = P.R - P.D;
    
    var k = 4*360 / 5;
    
    var newvert = [];
    vert = [];
    
    for (var i=0; i<pts4.length ; ++i)
    {
        var h1 = pts4[i][3] - P.D;
        
        if (Math.abs(h0-h1) < 0.00001)
        {
            //newvert.push(-100000);
            //newvert.push(-100000);
            //newvert.push(-100000);
            //newvert.push(P.alpha);
            console.log("Oops");
            continue;
        }
        
        var ratio = h0 / (h0-h1);
        
        newvert.push(pts4[i][0] * ratio);
        newvert.push(pts4[i][1] * ratio);
        newvert.push(pts4[i][2] * ratio);
        newvert.push(P.alpha);
    }
    
    
    while (allvert.length >= P.follow)
    {
        allvert.splice(0,1);
    }
    allvert.push(newvert);
    
    if (P.obj3d == 0)
    {
        vert = flatten_and_alpha(allvert);
        glx.bindBuffer(glx.ARRAY_BUFFER, vertBuffer);
        glx.bufferData(glx.ARRAY_BUFFER, new Float32Array(vert), glx.DYNAMIC_DRAW);
    }
    else
    {
        line = calclines_1(allvert);
        glx.bindBuffer(glx.ARRAY_BUFFER, lineBuffer);
        glx.bufferData(glx.ARRAY_BUFFER, new Float32Array(line), glx.DYNAMIC_DRAW);
    }
    
    //P.roti++;
};

var spiral = function (strm)
{
    switch (strm)
    {
        case 's1' : spiral1(); break;
        case 's2' : spiral2(); break;
        case 's3' : spiral3(); break;
        case 's4' : spiral4(); break;
        case 's5' : spiral5(); break;
        case 's6' : spiral6(); break;
        case 's7' : spiral7(); break;
        case 'sg' : sphere_grid(); break;
        case 'sg1' : sphere_grid_1(); break;
        case 'sg2' : sphere_grid_2(); break;
        case 'sg3' : sphere_grid_3(); break;
        case 'gr' : grid(); break;
    
        default : spiral1();
    }
};

var set_model = function (strm)
{
    if (P.anim !== 0) { toggle_anim(); }
    
    document.getElementById('model').blur();
    
    P.roti = 0;
    P.FI1 = 0.0;
    P.FI2 = 0.0;
    P.FI3 = 0.0;
    P.spiral = strm;
    allvert = [];
    
    spiral(P.spiral);
    project();
    
    draw();
};

var set_col = function (strval)
{
    switch (strval)
    {
        case 'c0' : P.i_col = 0; P.i_bcg = 0; break;
        case 'c1' : P.i_col = 1; P.i_bcg = 1; break;
        case 'c2' : P.i_col = 2; P.i_bcg = 2; break;
        
        default:
            console.error('COL SELECT: ' + strval);
            P.i_col = 0; P.i_bcg = 0;
    }
    draw();
};

var set_follow = function (strval)
{
    var ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 1)
    {
        P.follow = 1;
    }
    else
    {
        P.follow = ival;
    }
    
    //draw();
};

var set_spsize = function (strval)
{
    var ival = parseInt(strval);
    
    if (isNaN(ival) || ival < 2)
    {
        P.N = 2;
    }
    else
    {
        P.N = ival;
    }
    
    spiral(P.spiral);
    project();
    draw();
};

var set_step = function (strval)
{
    var fval = parseFloat(strval);
    
    if (isNaN(fval) || fval < 0.05)
    {
        P.step = 0.05;
    }
    else
    {
        P.step = fval;
    }

    if (P.DFI1 > 0.04) P.DFI1 = P.step;
    if (P.DFI2 > 0.04) P.DFI2 = P.step;
    if (P.DFI3 > 0.04) P.DFI3 = P.step;

    if (P.DFI1 < 0.04) P.DFI1 = -P.step;
    if (P.DFI2 < 0.04) P.DFI2 = -P.step;
    if (P.DFI3 < 0.04) P.DFI3 = -P.step;
    console.log("1: " + P.DFI1 + " 2: " + P.DFI2 + " 3: " + P.DFI3);
}

var set_fi = function (strval)
{
    switch (strval)
    {
        case 'fi1' : P.DFI1 = P.step; P.DFI2 = 0.0;    P.DFI3 = 0.0;    break;
        case 'fi2' : P.DFI1 = 0.0;    P.DFI2 = P.step; P.DFI3 = 0.0;    break;
        case 'fi3' : P.DFI1 = 0.0;    P.DFI2 = 0.0;    P.DFI3 = P.step; break;
        
        default: console.error('FI SELECT: ' + strval);
    }
};

var newshader = function ()
{
    shader = gl.create_vf_program(
                glx,
                shaders.version + shaders.helpers + shaders.vs_pts,
                shaders.version + shaders.precision + shaders.fs_pts);
    
    shader.vertexPosition = glx.getAttribLocation(shader.glprog, "position");
    glx.enableVertexAttribArray(shader.vertexPosition);
    shader.pvmPos    = glx.getUniformLocation(shader.glprog, "pvm");
    shader.projPos   = glx.getUniformLocation(shader.glprog, "proj");
    shader.colPos    = glx.getUniformLocation(shader.glprog, "dcol");
    shader.aspectPos = glx.getUniformLocation(shader.glprog, "aspect");
};

var computeMatrices = function ()
{
    modelViewMatrix = tr.view(camera);
    modelViewMatrix = m4.mul(tr.roty(axis), modelViewMatrix);
    modelViewMatrix = m4.mul(tr.rotx(rotation), modelViewMatrix);
    modelViewMatrix = m4.mul(rot1, modelViewMatrix);
    modelViewMatrix = m4.mul(tr.scale(scale), modelViewMatrix);
    //modelViewMatrix = m4.mul(tr.translate([-1, -1, -1]), modelViewMatrix);
    projectionMatrix = tr.persp(camera);
};

var draw = function ()
{
    if (!shader) return;
    
    glx.useProgram(shader.glprog);

        glx.disable(glx.DEPTH_TEST);
        glx.enable (glx.BLEND);
        //glx.blendFunc(glx.SRC_ALPHA, glx.SRC_ALPHA_SATURATE);
        //glx.blendFunc(glx.SRC_ALPHA, glx.DST_ALPHA);
        glx.blendFunc(glx.SRC_ALPHA, glx.ONE_MINUS_SRC_ALPHA);
        //glx.blendFunc(glx.SRC_ALPHA, glx.ONE_MINUS_DST_ALPHA);

    glx.clearColor(P.bcg[P.i_bcg*3],
                   P.bcg[P.i_bcg*3 + 1],
                   P.bcg[P.i_bcg*3 + 2],
                   1.0);
    glx.clear(glx.COLOR_BUFFER_BIT | glx.DEPTH_BUFFER_BIT);
    
    if (P.obj3d === 0)
    {
        glx.bindBuffer(glx.ARRAY_BUFFER, vertBuffer);
        glx.vertexAttribPointer(shader.vertexPosition, 4, glx.FLOAT, false, 0, 0);
    }
    else
    {
        glx.bindBuffer(glx.ARRAY_BUFFER, lineBuffer);
        glx.vertexAttribPointer(shader.vertexPosition, 4, glx.FLOAT, false, 0, 0);
    }
    
    glx.uniform1f(shader.aspectPos, camera.aspect);
    glx.uniform3f(shader.colPos,
                  P.col[P.i_col*3],
                  P.col[P.i_col*3 + 1],
                  P.col[P.i_col*3 + 2]);
    
    computeMatrices();
    
    if (P.cam3d === 0)
    {
        glx.uniform1i(shader.projPos, 0);
        glx.uniformMatrix4fv(shader.pvmPos, false, m4.mul(modelViewMatrix, projectionMatrix));
    }
    else
    {
        glx.uniform1i(shader.projPos, 1);
        glx.uniformMatrix4fv(shader.pvmPos, false, modelViewMatrix);
    }
    
    //if (shader.aspect)
    //{
    //    glx.uniform1f(shader.aspect, camera.aspect);
    //}
    
    if (P.obj3d === 0) glx.drawArrays(glx.POINTS, 0, vert.length/4);
    else               glx.drawArrays(glx.LINES,  0, line.length/4);
};

var anim_step = function (fi1, fi2, fi3)
{
    P.FI1 += P.DFI1;
    P.FI2 += P.DFI2;
    P.FI3 += P.DFI3;
    P.FI1 = P.FI1 - Math.floor(P.FI1/360.0)*360.0;
    P.FI2 = P.FI2 - Math.floor(P.FI2/360.0)*360.0;
    P.FI3 = P.FI3 - Math.floor(P.FI3/360.0)*360.0;
    spiral(P.spiral);
    project();
    draw();
};

var toggle_anim = function ()
{
    if (P.anim === 0)
    {
        P.anim = 1;
        //document.getElementById('animbut').innerHTML = 'Stop';
        P.animID = window.setInterval(anim_step, 33);
    }
    else
    {
        window.clearInterval(P.animID);
        //document.getElementById('animbut').innerHTML = 'Animate';
        P.anim = 0;
    }
};

var event_scale = function (event)
{
    var rect = canvas.getBoundingClientRect();
    var cw2 = cwidth/2;
    
    return {
        x: (           event.clientX - rect.left  - cw2) / cw2,
        y: (cheight - (event.clientY - rect.top)  - cw2) / cw2,
        movx :  event.movementX / cw2,
        movy : -event.movementY / cw2
    };
};

var handleMouseDown = function (event)
{
    mouse_down_3d = true;
    
    if ((axis > 90) && (axis < 270))
    {
        rotdir = false;
    }
    else
    {
        rotdir = true;
    }
};

var handleMouseUp = function (event)
{
    mouse_down_3d = false;
};

var handleMouseMove = function (event)
{
    if (!mouse_down_3d) { return; }
    
    axis += event.movementX*0.25;
    if (rotdir)
    {
        rotation += event.movementY*0.25;
    }
    else
    {
        rotation -= event.movementY*0.25;
    }
    // Ensure [0,360]
    axis = axis - Math.floor(axis/360.0)*360.0;
    rotation = rotation - Math.floor(rotation/360.0)*360.0;
    
    draw();
};

var handleKeyDown = function (event)
{
    if (event.keyCode === 87)
    {
        // W
        scale *= 1.1;
    }
    else if (event.keyCode === 83)
    {
        // S
        scale *= 0.9;
    }
    else if (event.keyCode === 48)
    {
        // 0 zero
        toggle_anim();
    }
    else if (event.keyCode === 71)
    {
        // G
        P.DFI1 = -Math.abs(P.DFI1);
        P.DFI2 = -Math.abs(P.DFI2);
        P.DFI3 = -Math.abs(P.DFI3);
        anim_step();
    }
    else if (event.keyCode === 72)
    {
        // H
        P.DFI1 = Math.abs(P.DFI1);
        P.DFI2 = Math.abs(P.DFI2);
        P.DFI3 = Math.abs(P.DFI3);
        anim_step();
    }
    /*
    else if (event.keyCode === 66)
    {
        // B
        P.D += 0.02;
        project();
    }
    else if (event.keyCode === 78)
    {
        // N
        P.D -= 0.02;
        project();
    }
    */
    else if (event.keyCode === 73)
    {
        // I
        P.cam3d++;
        if (P.cam3d > 1) P.cam3d = 0;
    }
    else if (event.keyCode === 79)
    {
        // O
        P.obj3d++;
        if (P.obj3d > 1) P.obj3d = 0;

        project();
    }
    else if (event.keyCode === 38) {
        // up
        rot1 = m4.mul(tr.rotx(-90), rot1);
        
    } else if (event.keyCode === 40) {
        // down
        rot1 = m4.mul(tr.rotx(90), rot1);
        
    } else if (event.keyCode === 37) {
        // left
        rot1 = m4.mul(tr.roty(-90), rot1);
        
    } else if (event.keyCode === 39) {
        // right
        rot1 = m4.mul(tr.roty(90), rot1);
    }
    else if (event.keyCode === 77)
    {
        // M
        if (P.hidden)
        {
            P.hidden = false;
            document.getElementById("menu").className = "";
        }
        else
        {
            P.hidden = true;
            document.getElementById("menu").className = "hidden";
        }
    }
    
    draw();
};

var zoomin  = function () { scale *= 1.25; draw(); };
var zoomout = function () { scale *= 0.8;  draw(); };

var resize = function ()
{
    if (!canvas || !glx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.aspect = canvas.width / canvas.height;
    glx.viewport(0, 0, canvas.width, canvas.height);
};

var handleWheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
}

var init = function ()
{
    canvas = document.getElementById('canvas');
    glx    = gl.get_context_2('canvas');
    
    resize();
    
    vertBuffer = glx.createBuffer();
    lineBuffer = glx.createBuffer();
    
    spiral1();
    project();
    newshader();
};


init();

window.set_model  = set_model;
window.set_spsize = set_spsize;
window.set_col    = set_col;
window.set_follow = set_follow;
window.set_fi     = set_fi;
window.set_step   = set_step;

canvas.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);

window.addEventListener("resize", function() { resize(); draw(); });

draw();

