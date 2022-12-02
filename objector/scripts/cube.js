
import { gl } from "./gl.js";
import { divide } from "./divide.js";
import { parameters } from "./parameters.js";

var createCube = function () {
    if (!gl) return null;
    
    var model = null;
    
    // Vertex Data
    var verts = [
        -50.0, -50.0,  50.0,
         50.0, -50.0,  50.0,
         50.0,  50.0,  50.0,
        -50.0,  50.0,  50.0,
        
         50.0, -50.0, -50.0,
        -50.0, -50.0, -50.0,
        -50.0,  50.0, -50.0,
         50.0,  50.0, -50.0
    ];
    
    
    // Index data of triangles
    var faceIndices = [
        0, 1, 2,      0, 2, 3,
        4, 5, 6,      4, 6, 7,
        3, 2, 7,      3, 7, 6,
        0, 5, 4,      0, 4, 1,
        1, 4, 7,      1, 7, 2,
        0, 3, 6,      0, 6, 5
    ];
    
    
    var lineIndices = [
         0, 1,    1, 2,    2, 3,    3, 0,
         4, 5,    5, 6,    6, 7,    7, 4,
         0, 5,    1, 4,    2, 7,    3, 6
    ];
    
    var innerModel = {
        verts: verts,
        faces: faceIndices,
        lines: lineIndices
    };
    
    if (parameters.doDivide) {
        model = divide(innerModel, parameters.divide);
    } else {
        model = innerModel;
    }
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts), gl.STATIC_DRAW);
    
    var faceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.faces), gl.STATIC_DRAW);
    
    var lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.lines), gl.STATIC_DRAW);
    
    model.vertexBuffer = vertexBuffer;
    model.faceBuffer   = faceBuffer;
    model.lineBuffer   = lineBuffer;
    
    return model;
};

var cube = {
    create : createCube
};

export { cube };
