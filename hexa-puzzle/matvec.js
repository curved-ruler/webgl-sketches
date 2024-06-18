
let vec2 = {
    add : function (va, vb)
    {
        return [va[0]+vb[0], va[1]+vb[1]];
    },
    
    cmul : function (v, c)
    {
        return [v[0]*c, v[1]*c];
    }
};

export { vec2 };

