
import { vector3 as v3 } from "./vector3.js";

var cleanVertices = function (obj) {
    var vert2 = [obj.verts[0]];
    var vertx = [0];
    var cleaned = 0;
    
    var ex = null;
    for (var i=1 ; i<obj.verts.length ; i++) {
        ex = null;
        for (var j=0 ; j<vert2.length ; j++) {
            if (v3.eq(obj.verts[i], vert2[j])) {
                ex = j;
                break;
            }
        }
        if (ex !== null) {
            vertx.push(ex);
            cleaned++;
        } else {
            vertx.push(i-cleaned);
            vert2.push(obj.verts[i]);
        }
    }
    
    //for (var i=0 ; i<vertx.length ; i++) {
    //    if (vertx[i] >= vert2.length) vertx[i] = vert2.length-1;
    //}
    
    for (var f=0 ; f<obj.faces.length ; f++) {
        obj.faces[f][0] = vertx[obj.faces[f][0]];
        obj.faces[f][1] = vertx[obj.faces[f][1]];
        obj.faces[f][2] = vertx[obj.faces[f][2]];
    }
    for (var l=0 ; l<obj.lines.length ; l++) {
        obj.lines[l][0] = vertx[obj.lines[l][0]];
        obj.lines[l][1] = vertx[obj.lines[l][1]];
    }
    
    obj.verts = vert2;
};

export { cleanVertices as objclean };

