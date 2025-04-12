
import { vec3 } from "./matvec.js";

let create = function (obj_str, params, y_up)
{
    //let eol = /\r\n|\n\r|\r/g;
    let lines = obj_str.replace('\r','\n').split('\n');
    
    let v  = [];
    
    for (let i in lines)
    {
        let tokens = lines[i].split(' ').map(s => s.trim()).filter(x => x && x.length && x.length > 0);
        
        if (tokens.length < 1) continue;
        
        if (tokens[0] === 'v' || tokens[0] === 'V')
        {
            let vnew = {};
            if (!y_up)
            {
                vnew = { x:parseFloat(tokens[1]) * params[0] + params[1],
                         y:parseFloat(tokens[2]) * params[0] + params[2],
                         z:parseFloat(tokens[3]) * params[0] + params[3] };
            }
            else
            {
                vnew = { x:parseFloat(tokens[1]) * params[0] + params[1],
                         y:parseFloat(tokens[3]) * params[0] + params[2],
                         z:parseFloat(tokens[2]) * params[0] + params[3] };
            }
            
            let add = true;
            for (let i=0 ; i<v.length/6 ; i+=1)
            {
                let vi = { x:v[i*6], y:v[i*6+1], z:v[i*6+2] };
                if (vec3.eq(vi,vnew))
                {
                    add = false;
                    break;
                }
            }
            
            if (add)
            {
                v.push( vnew.x, vnew.y, vnew.z );
            }
        }
    }
    
    return {
        verts: v
    };
};

let obj = { create };

export { obj };

