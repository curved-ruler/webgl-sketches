
//line2 : { p: [px, py], v: [vx, vx] }
var intersect_lines = function (l1, l2)
{
    var t1, t2;
    var err = false;
    
    var a = l1.p[0]; var b = l1.p[1];
    var c = l1.v[0]; var d = l1.v[1];
    var e = l2.p[0]; var f = l2.p[1];
    var g = l2.v[0]; var h = l2.v[1];
    
    if (Math.abs(c) < 0.000001)
    {
        var denom = g - (h*c / d);
        
        if (Math.abs(denom) < 0.000001)
        {
            err = true;
        }
        else
        {
            var numer = a - e + (f*c / d) - (b*c / d);
            t2 = numer / denom;
            t1 = (f - b + t2*h) / d;
        }
    }
    else
    {
        var denom = h - (d*g / c);
        
        if (Math.abs(denom) < 0.000001)
        {
            err = true;
        }
        else
        {
            var numer = b - f + (d*e / c) - (d*a / c);
            t2 = numer / denom;
            t1 = (e - a + t2*g) / c;
        }
    }
    
    if (err) return [];
    return [t1, t2];
}

var geom2d = { intersect_lines };

export { geom2d };
