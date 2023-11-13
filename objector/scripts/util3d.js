
import { matrix4 as m4 } from "./matrix4.js";
import { vector3 as v3 } from "./vector3.js";

var mch = function (o, r, ntype)
{
    var pn = ntype;
    if (ntype < 0)        { pn = Math.floor((Math.random() * 10) + 3); }
    else if (ntype === 0) { pn = Math.min(Math.max(8, Math.round(r * 1.5)), 40); }
    
    var alpha = 0;
    var points = [];
    for (var pi=0 ; pi<pn ; pi++) {
        points.push([(Math.sin(alpha) * r) + o[0],
                     (Math.cos(alpha) * r) + o[1],
                     0]);
        alpha += (2*Math.PI / pn);
        //alpha += (360 / pn);
    }
    return points;
};

var util3d = {
    makeXYCircle : mch
};

export { util3d };
