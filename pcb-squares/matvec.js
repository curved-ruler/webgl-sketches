
let vec2 = {
    add : function (va, vb)
    {
        return [va[0]+vb[0], va[1]+vb[1]];
    },
    
    sub : function (va, vb)
    {
        return [va[0]-vb[0], va[1]-vb[1]];
    },
    
    cmul : function (v, c)
    {
        return [v[0]*c, v[1]*c];
    },
    
    dot : function (va, vb)
    {
        return va[0]*vb[0] + va[1]*vb[1];
    },
    
    length : function (v)
    {
        return Math.sqrt(v[0]*v[0] + v[1]*v[1]);
    }
};

export { vec2 };

