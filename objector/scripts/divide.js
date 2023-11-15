
import { vector3 as v3 } from "./vector3.js";

let divide = function (obj, n) {
    if (!obj || !n) return null;
    if (n < 2) return obj;
    
    let ret = {
        verts: [],
        faces: [],
        lines: []
    };
    
    
    
    for (let i=0 ; i<obj.faces.length ; i++) {
        let v0 = obj.verts[obj.faces[i][0]];
        let v1 = obj.verts[obj.faces[i][1]];
        let v2 = obj.verts[obj.faces[i][2]];
        
        let v10 = v3.constmul(v3.sub(v1,v0), 1/n);
        let v21 = v3.constmul(v3.sub(v2,v1), 1/n);
        
        
        let st1 = ret.verts.length;
        
        let first = v0;
        ret.verts.push([first[0], first[1], first[2]]);
        for (let j=0 ; j<n ; j++) {
            first = v3.add(first, v10);
            let act = first;
            for (let k=0 ; k<=j+1 ; k++) {
                ret.verts.push([act[0], act[1], act[2]]);
                act = v3.add(act, v21);
            }
        }
        
        let st2 = st1+1;
        let nup = 1;
        let ndown = 0;
        for (let j=0 ; j<n ; j++) {
            //up triangles
            let act1 = st1;
            let act2 = st2;
            for (let u=0 ; u<nup ; u++) {
                ret.faces.push([act1, act2, act2+1]);
                act1++;
                act2++;
            }
            nup++;
            
            // down triangles
            act1 = st1;
            act2 = st2+1;
            for (let d=0 ; d<ndown ; d++) {
                ret.faces.push([act1, act1+1, act2]);
                act1++;
                act2++;
            }
            ndown++;
            
            st1 = st2;
            st2 += j+2;
        }
    }
    
    
    
    
    for (let i=0 ; i<obj.lines.length ; i++) {
        let v0 = obj.verts[obj.lines[i][0]];
        let v1 = obj.verts[obj.lines[i][1]];
        
        let v10 = v3.constmul(v3.sub(v1,v0), 1/n);
        
        let st = ret.verts.length;
        
        for (let j=0 ; j<=n ; j++) {
            ret.verts.push([v0[0], v0[1], v0[2]]);
            v0 = v3.add(v0, v10);
        }
        
        for (let j=0 ; j<n ; j++) {
            ret.lines.push([st, st+1]);
            st++;
        }
    }
    
    
    
    return ret;
};
    
export { divide };


