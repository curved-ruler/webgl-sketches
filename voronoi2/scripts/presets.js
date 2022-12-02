
define(function ()
{
    var col_yellow = function (n)
    {
        var ret = [];
        for (var i=0 ; i<n ; ++i)
        {
            var crnd = Math.random()*0.8 + 0.2;
            ret.push(crnd);
            ret.push(crnd*0.6);
            ret.push(crnd*0.2);
        }
        return ret;
    };
    
    var col_cyan_yellow = function (n)
    {
        var ret = [];
        for (var i=0 ; i<(n/2) ; ++i)
        {
            var crnd = Math.random()*0.8 + 0.2;
            
            //cyan
            ret.push(0);
            ret.push(crnd);
            ret.push(crnd);
            
            //yellow
            ret.push(crnd);
            ret.push(crnd*0.6);
            ret.push(crnd*0.2);
        }
        return ret;
    };
    
    var col_rnd = function (n)
    {
        var ret = [];
        for (var i=0 ; i<n ; ++i)
        {
            ret.push(Math.random());
            ret.push(Math.random());
            ret.push(Math.random());
        }
        return ret;
    };
    
    var base_cross = function (noise)
    {
        var ret = [0,0];
        var d = 0.1;
        var x = d;
        for (var i=0 ; i<5 ; ++i)
        {
            ret.push(x + Math.random() * noise);
            ret.push(0 + Math.random() * noise);
            ret.push(-x + Math.random() * noise);
            ret.push(0 + Math.random() * noise);
            
            ret.push(0 + Math.random() * noise);
            ret.push(x + Math.random() * noise);
            ret.push(0 + Math.random() * noise);
            ret.push(-x + Math.random() * noise);
            
            x += d;
        }
        return ret;
    };
    
    var base_poly = function (noise, side, r, edgen, alfa0)
    {
        var ret = [];
        var a  = alfa0 * Math.PI / 180;
        var da = 2*Math.PI / side;
        
        for (var s=0 ; s<side ; ++s)
        {
            var corner = [Math.cos(a)*r, Math.sin(a)*r];
            var next   = [Math.cos(a+da)*r, Math.sin(a+da)*r];
            for (var e=0 ; e<edgen ; ++e)
            {
                var dedge = [((next[0]-corner[0])/edgen)*e, ((next[1]-corner[1])/edgen)*e];
                ret.push(corner[0]+dedge[0] + Math.random() * noise);
                ret.push(corner[1]+dedge[1] + Math.random() * noise);
            }
            a += da;
        }
        return ret;
    };
    
    var base_sin = function (noise)
    {
        var ret = [];
        var len = 30;
        //var min = -((len-1) * d / 2);
        var d   = 2/(len-1);
        
        for (var i=0 ; i<len ; ++i)
        {
            ret.push(-1 + i*d + Math.random() * noise);
            ret.push(Math.sin(i * 2*Math.PI / (len-1)) * 0.6 + Math.random() * noise);
        }
        return ret;
    };
    
    var base_spiral = function (noise)
    {
        var ret = [];
        var len = 40;
        var r = 0;
        var dr = 0.03;
        var alfa = 0;
        var clen = 10;
        var turn = 2*Math.PI / clen;
        
        for (var i=0 ; i<len ; ++i)
        {
            ret.push(Math.cos(alfa)*r + Math.random() * noise);
            ret.push(Math.sin(alfa)*r + Math.random() * noise);
            r    += dr;
            alfa += turn;
        };
        return ret;
    };
    
    var dist_p_base = `\
float dist (in vec2 p1, in vec2 p2)
{
    float p = {ppp};
    return pow(pow(abs(p1.x - p2.x), p) + pow(abs(p1.y - p2.y), p), 1.0/p);
}`;
    
    var dist_p = function (p)
    {
        return dist_p_base.replace(/\{ppp\}/g, p);
    };
    
    var dist_pinf = `\
float dist (in vec2 p1, in vec2 p2)
{
    return max(abs(p1.x - p2.x), abs(p1.y - p2.y));
}`;
    
    var dist_sin_01 = `\
float dist (in vec2 p1, in vec2 p2)
{
    return (sin((p1.x - p2.x)*7.0) + sin((p1.y - p2.y)*7.0))*0.4;
}`;

    var f123_0 = `\
hcol comp_values (in fdata fd)
{
    hcol ret;
    ret.h   = fd.d1;
    ret.col = getcol(fd.i1);
    return ret;
}`;

    var f123_1 = `\
hcol comp_values (in fdata fd)
{
    hcol ret;
    ret.h   = (fd.d2 - fd.d1 + 0.1) * 1.5;
    ret.col = vec3(ret.h);
    return ret;
}`;

    var f123_2 = `\
hcol comp_values (in fdata fd)
{
    hcol ret;
    ret.h   = 0.3*fd.d3 - 0.7*fd.d2 + fd.d1;
    ret.col = vec3(ret.h);
    return ret;
}`;

    var f123_clamp = `\
hcol comp_values (in fdata fd)
{
    hcol ret;
    ret.h   = fd.d1 - 0.1;
    ret.h   = clamp(ret.h, 0.0, 5.0) + 0.2;
    ret.col = vec3(ret.h);
    return ret;
}`;

    var f123_abs = `\
hcol comp_values (in fdata fd)
{
    hcol ret;
    ret.h   = abs(fd.d1 - 0.3);
    ret.col = vec3(ret.h);
    return ret;
}`;
    
    return {
        col_yellow      : col_yellow,
        col_cyan_yellow : col_cyan_yellow,
        col_rnd         : col_rnd,
        
        base_cross      : base_cross,
        base_poly       : base_poly,
        base_sin        : base_sin,
        base_spiral     : base_spiral,
        
        dist_p          : dist_p,
        dist_pinf       : dist_pinf,
        dist_sin_01     : dist_sin_01,
        
        f123_0          : f123_0,
        f123_1          : f123_1,
        f123_2          : f123_2,
        f123_clamp      : f123_clamp,
        f123_abs        : f123_abs,
    };
});
