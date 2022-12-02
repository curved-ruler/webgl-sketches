
import { gl } from "./gl.js";
import { parameters } from "./parameters.js";
import { constants as c } from "./constants.js";

var vsMatrix = `
    attribute vec3 position;
    uniform mat4 proj, view;
    void main () {
            gl_Position = proj * view * vec4(position, 1.0);
    }
`;

var vs6 = `
    attribute vec3 position;
    uniform mat4 view;
    uniform float rad, aspect, ff, nn;
    void main () {
        vec4 v   = view * vec4(position, 1.0);
        float l = length(v.xyz);
        vec3 iv  = (l < 0.0001) ? vec3(0.0) : normalize(v.xyz);
        vec3 ivv = (length(iv.xy) < 0.0001) ? vec3(0.0) : normalize(vec3(iv.x, iv.y, 0.0));
        float a  = (l < 0.0001) ? 0.0 : acos(dot(vec3(0.0, 0.0, -1.0), iv));
        vec3 r   = (ivv * a) * rad;
    
        float beta = (1.0 + ff/nn) / (1.0 - ff/nn);
        float alph = (-1.0 - beta) / nn;
        float z  = alph * length(v.xyz) + beta;
    
        gl_Position = vec4(r.x / aspect, r.y, z, 1.0);
    }
`;

var fsSimple = `
    precision mediump float;
    uniform vec4 col;
    void main(void) {
        gl_FragColor = col;
    }
`;


var VS_TYPE_MATRIX = "vs-type-matrix";
var VS_TYPE_6PP = "vs-type-6pp";

var FS_TYPE_SIMPLE = "fs-type-simple";




var compile = function (str, type) { 
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
};



var initShader = function (shader) {
    shader.program = gl.createProgram();
    
    switch (shader.vsType) {
        case VS_TYPE_MATRIX:
            shader.vertexShader = compile(vsMatrix, "vertex");
            gl.attachShader(shader.program, shader.vertexShader);
            break;
            
        case VS_TYPE_6PP:
            shader.vertexShader = compile(vs6, "vertex");
            gl.attachShader(shader.program, shader.vertexShader);
            break;
    }
    
    switch (shader.fsType) {
        case FS_TYPE_SIMPLE:
            shader.fragmentShader = compile(fsSimple, "fragment");
            gl.attachShader(shader.program, shader.fragmentShader);
            break;
    }

    ///////////////// Link
    gl.linkProgram(shader.program);
    ///////////////// Parameters
    
    switch (shader.vsType) {
        case VS_TYPE_MATRIX:
            shader.vertexPosition = gl.getAttribLocation(shader.program, "position");
            gl.enableVertexAttribArray(shader.vertexPosition);
            shader.projectionMatrix = gl.getUniformLocation(shader.program, "proj");
            shader.modelViewMatrix = gl.getUniformLocation(shader.program, "view");
            break;
            
        case VS_TYPE_6PP:
            shader.vertexPosition = gl.getAttribLocation(shader.program, "position");
            gl.enableVertexAttribArray(shader.vertexPosition);
            shader.modelViewMatrix = gl.getUniformLocation(shader.program, "view");
            shader.rad = gl.getUniformLocation(shader.program, "rad");
            shader.aspect = gl.getUniformLocation(shader.program, "aspect");
            shader.ff = gl.getUniformLocation(shader.program, "ff");
            shader.nn = gl.getUniformLocation(shader.program, "nn");
            break;
    }
    
    switch (shader.fsType) {
        case FS_TYPE_SIMPLE:
            shader.col = gl.getUniformLocation(shader.program, "col");
            break;
    }
    
    if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS)) {
        shader = null;
        alert("Could not initialize shaders");
    }
        
    return shader;
};

var shaders = {
    create : function () {
        var shader = {};
        switch (parameters.render) {
            case c.renderModes.axw:
            case c.renderModes.axh:
            case c.renderModes.prw:
            case c.renderModes.prh:
            case c.renderModes.cyc:
            case c.renderModes.cyc3:
            case c.renderModes.cyc4:
            case c.renderModes.cyc5:
            case c.renderModes.cycR:
                shader.vsType = VS_TYPE_MATRIX;
                shader.fsType = FS_TYPE_SIMPLE;
                break;
                
            case c.renderModes.p6w:
            case c.renderModes.p6h:
                shader.vsType = VS_TYPE_6PP;
                shader.fsType = FS_TYPE_SIMPLE;
                break;
        }
        return initShader(shader);
    }
};

export { shaders };
