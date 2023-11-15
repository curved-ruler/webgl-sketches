
import { gl } from "./gl.js";
import { divide } from "./divide.js";
import { objclean } from "./objclean.js";
import { parameters } from "./parameters.js";
import { constants as c } from "./constants.js";


let clean = function (array) {
    let ret = [];
    array.forEach(e => { if (e !== '' && e !== null) ret.push(e); });
    return ret;
};

let v = function (str) {
    let i = str.indexOf('/');
    return str.substring(0, (i != -1) ? i : str.length);
};

let createFace = function (indices, tokens) {
    if (tokens.length < 4) return;
    for (let end = 3 ; end < tokens.length ; end++) {
        indices.push([parseInt(v(tokens[1]))     - 1,
                      parseInt(v(tokens[end-1])) - 1,
                      parseInt(v(tokens[end]))   - 1]);
    }
};

let create = function (objStr, do_clean) {
    let eol = /\r\n|\n\r|\n|\r/g;
    let lines = clean(objStr.replace(eol,'\n').split('\n'));
    
    let vertices = [];
    let faceIndices = [];
    let lineIndices = [];
    
    for (let i in lines) {
        let tokens = clean(lines[i].split(' '));
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
    
    let model = null;
    let innerModel = {
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
    
    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.verts.flat(2)), gl.STATIC_DRAW);
    
    let faceBuffer = null;
    if (model.faces.length > 0) {
        faceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model.faces.flat(2)), gl.STATIC_DRAW);
    }
    
    let lineBuffer = null;
    if (model.lines.length > 0) {
        lineBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model.lines.flat(2)), gl.STATIC_DRAW);
    }
    
    model.vertexBuffer = vertexBuffer;
    model.faceBuffer   = faceBuffer;
    model.lineBuffer   = lineBuffer;
    
    console.log("V", model.verts.length, "F", model.faces.length, "L", model.lines.length);
    
    return model;
};

let obj = { create };

export { obj };

