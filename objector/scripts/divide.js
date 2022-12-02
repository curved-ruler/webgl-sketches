
import { vector3 as v3 } from "./vector3.js";

var divide = function (obj, n) {
    if (!obj || !n) return null;
    if (n < 2) return obj;
    
    var ret = {
        verts: [],
        faces: [],
        lines: []
    };
    
    
    
    for (var i=0 ; i<obj.faces.length ; i++) {
        var v0 = obj.verts[obj.faces[i][0]];
        var v1 = obj.verts[obj.faces[i][1]];
        var v2 = obj.verts[obj.faces[i][2]];
        
        var v10 = v3.constmul(v3.sub(v1,v0), 1/n);
        var v21 = v3.constmul(v3.sub(v2,v1), 1/n);
        
        
        var st1 = ret.verts.length;
        
        var first = v0;
        ret.verts.push([first[0], first[1], first[2]]);
        for (var j=0 ; j<n ; j++) {
            first = v3.add(first, v10);
            var act = first;
            for (var k=0 ; k<=j+1 ; k++) {
                ret.verts.push([act[0], act[1], act[2]]);
                act = v3.add(act, v21);
            }
        }
        
        var st2 = st1+1;
        var nup = 1;
        var ndown = 0;
        for (var j=0 ; j<n ; j++) {
            //up triangles
            var act1 = st1;
            var act2 = st2;
            for (var u=0 ; u<nup ; u++) {
                ret.faces.push([act1, act2, act2+1]);
                act1++;
                act2++;
            }
            nup++;
            
            // down triangles
            act1 = st1;
            act2 = st2+1;
            for (var d=0 ; d<ndown ; d++) {
                ret.faces.push([act1, act1+1, act2]);
                act1++;
                act2++;
            }
            ndown++;
            
            st1 = st2;
            st2 += j+2;
        }
    }
    
    
    
    
    for (var i=0 ; i<obj.lines.length ; i++) {
        var v0 = obj.verts[obj.lines[i][0]];
        var v1 = obj.verts[obj.lines[i][1]];
        
        var v10 = v3.constmul(v3.sub(v1,v0), 1/n);
        
        var st = ret.verts.length;
        
        for (var j=0 ; j<=n ; j++) {
            ret.verts.push([v0[0], v0[1], v0[2]]);
            v0 = v3.add(v0, v10);
        }
        
        for (var j=0 ; j<n ; j++) {
            ret.lines.push([st, st+1]);
            st++;
        }
    }
    
    
    
    return ret;
};
    
export { divide };


