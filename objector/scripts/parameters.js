
import { constants as c } from "./constants.js";

var parameters = {
    hideMenu  : false,
    render    : c.renderModes.axw,
    modelName : c.inputs1['cube'],
    modelSet  : 1,
    doDivide  : false,
    divide    : 2,
    
    bcol      : [0.11, 0.11, 0.11, 1.0],
    ccol      : [0.9,  0.7,  0.0,  1.0],
    /*
    bcol      : [1.0, 1.0, 1.0, 1.0],
    ccol      : [0.0, 0.0, 0.0, 1.0],
    */
    cpersp    : 0,
    crr       : 0,
    csqrt     : 0
};

export { parameters };
