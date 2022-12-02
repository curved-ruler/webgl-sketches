
var parameters = {
        R         : 1.0, // radius
        D         : -1.0,  // "plane" coord
        
        FI1       : 0.0,
        FI2       : 0.0,
        FI3       : 0.0,
        
        step      : 5.0,
        DFI1      : 5.0,
        DFI2      : 0.0,
        DFI3      : 0.0,
        
        roti      : 0,
        rotn      : 100,
        N         : 1000,
        follow    : 20,
        
        spiral    : 's1',
        
        anim      : 0,
        animID    : null,
        animdata  : [], // { id, t, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y }
        t0        : 70,
        t1        : 90,
        
        i_col     : 2,
        col       : [
            1.0, 1.0, 1.0,
            0.0, 0.0, 0.0,
            0.5, 0.3, 0.0
        ],
        i_bcg     : 2,
        bcg       : [
            0.0, 0.0, 0.0,
            1.0, 1.0, 1.0,
            0.1, 0.1, 0.1
        ],
        
        cam3d     : 0,
        obj3d     : 0,
        
        alpha     : 0.3,
        dalpha2   : 0.09,
        dalpha3   : 0.07,
        dalpha4   : 0.05,
        dalpha5   : 0.02,
        lastalpha : 0.01,
        
        hidden : false
};

export { parameters };
