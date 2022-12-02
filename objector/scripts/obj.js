
import { gl } from "./gl.js";
import { divide } from "./divide.js";
import { objclean } from "./objclean.js";
import { parameters } from "./parameters.js";
import { constants as c } from "./constants.js";


var clean = function (array) {
    var ret = [];
    array.forEach(e => { if (e !== '' && e !== null) ret.push(e); });
    return ret;
};

var v = function (str) {
    var i = str.indexOf('/');
    return str.substring(0, (i != -1) ? i : str.length);
};

var createFace = function (indices, tokens) {
    if (tokens.length < 4) return;
    for (var end = 3 ; end < tokens.length ; end++) {
        indices.push([parseInt(v(tokens[1]))     - 1,
                      parseInt(v(tokens[end-1])) - 1,
                      parseInt(v(tokens[end]))   - 1]);
    }
};

var create = function (objStr, do_clean) {
    var eol = /\r\n|\n\r|\n|\r/g;
    var lines = clean(objStr.replace(eol,'\n').split('\n'));
    
    var vertices = [];
    var faceIndices = [];
    var lineIndices = [];
    
    for (var i in lines) {
        var tokens = clean(lines[i].split(' '));
        if (tokens.length === 0) continue;
        if (tokens[0] === 'v' || tokens[0] === 'V') {
            vertices.push([parseFloat(tokens[1]),
                           parseFloat(tokens[2]),
                           parseFloat(tokens[3])]);
            
        } else if (tokens[0] === 'f' || tokens[0] === 'F') {
            createFace(faceIndices, tokens);
            
        } else if (tokens[0] === 'l' || tokens[0] === 'L') {
            lineIndices.push([parseInt(v(tokens[1])) - 1,
                              parseInt(v(tokens[2])) - 1]);
        }
    }
    
    var model = null;
    var innerModel = {
        verts: vertices,
        faces: faceIndices,
        lines: lineIndices
    };
    
    if (parameters.doDivide) {
        model = divide(innerModel, parameters.divide);
    } else {
        model = innerModel;
    }
    
    if (do_clean) objclean(model);
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts.flat(2)), gl.STATIC_DRAW);
    
    var faceBuffer = null;
    if (model.faces.length > 0) {
        faceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.faces.flat(2)), gl.STATIC_DRAW);
    }
    
    var lineBuffer = null;
    if (model.lines.length > 0) {
        lineBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.lines.flat(2)), gl.STATIC_DRAW);
    }
    
    model.vertexBuffer = vertexBuffer;
    model.faceBuffer   = faceBuffer;
    model.lineBuffer   = lineBuffer;
    
    return model;
};

var obj = { create };

export { obj };

