
import { gl } from "./gl.js";
import { shaders } from "./shaders.js";
import { cube } from "./cube.js";
import { obj } from "./obj.js";
import { matrix4 as m4 } from "./matrix4.js";
import { vector3 as v3 } from "./vector3.js";
import { transformations as tr } from "./transformations.js";
import { util3d }  from "./util3d.js";
import { parameters } from "./parameters.js";
import { constants as c } from "./constants.js";



var projectionMatrix, modelViewMatrix;
var camera = {
    eye   : [0, 0, 500],
    look  : [0, 0, -1],
    up    : [0, 1, 0],
    near  : 2,
    median: 500,
    far   : 10000,
    fovy  : Math.PI / 2,
    aspect: 1
};
var mouseDown, lastMouseX, lastMouseY;
var scale = 1;
var rot1 = m4.init();
var axis = 0;
var rotation = 0;
var rotdir = true;
var model = null;
var shader = null;
var canvas = null;
var clean = true;

var init = function () {
    resize();
    getModel(parameters.modelSet);
    //model = cube.create();
    shader = shaders.create();
};

var resize = function () {
    if (!canvas) return;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	setViewport();
};

var setViewport = function () {
    if (!gl || !canvas) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    camera.aspect = canvas.width / canvas.height;
};


var computeMatrices = function () {
    modelViewMatrix = tr.view(camera);
    modelViewMatrix = m4.mul(tr.roty(axis), modelViewMatrix);
    modelViewMatrix = m4.mul(tr.rotx(rotation), modelViewMatrix);
    modelViewMatrix = m4.mul(rot1, modelViewMatrix);
    modelViewMatrix = m4.mul(tr.scale(scale), modelViewMatrix);
    
    switch (parameters.render) {
        case c.renderModes.axw:
        case c.renderModes.axh:
        case c.renderModes.cyc:
            projectionMatrix = tr.axon(camera);
            break;
        case c.renderModes.prw:
        case c.renderModes.prh:
            projectionMatrix = tr.persp(camera);
            break;
        default:
            projectionMatrix = null;
    }
};



var draw1 = function () {
    gl.useProgram(shader.program);

    //gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clearColor(parameters.bcol[0], parameters.bcol[1], parameters.bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.vertexAttribPointer(shader.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    
    computeMatrices();
    
    if (shader.rad) {
        gl.uniform1f(shader.rad, 0.7);
    }
    if (shader.aspect) {
        gl.uniform1f(shader.aspect, camera.aspect);
    }
    if (shader.ff) {
        gl.uniform1f(shader.ff, camera.far);
        gl.uniform1f(shader.nn, camera.near);
    }
        
    if (shader.modelViewMatrix) {
        gl.uniformMatrix4fv(shader.modelViewMatrix, false, modelViewMatrix);
    }
    if (shader.projectionMatrix) {
        gl.uniformMatrix4fv(shader.projectionMatrix, false, projectionMatrix);
    }
    
    
    if (model.lines.length > 0) {
        gl.depthMask(true);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.lineBuffer);
        gl.lineWidth(parameters.linew);
        gl.uniform4fv(shader.col, [0.8, 0.6, 0.0, 1.0]);
        gl.drawElements(gl.LINES, model.lines.length * 2, gl.UNSIGNED_INT, 0);
    }
    
    if (model.faces.length) {
        gl.depthMask(false);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.faceBuffer);
        switch (parameters.render) {
            case c.renderModes.axw:
            case c.renderModes.prw:
            case c.renderModes.p6w:
                if (parameters.modelSet === 1) {
                    gl.uniform4fv(shader.col, [0.0, 0.0, 0.0, 0.8]);
                } else {
                    gl.uniform4fv(shader.col, [0.0, 0.0, 0.0, 0.4]);
                }
                break;
            case c.renderModes.axh:
            case c.renderModes.prh:
            case c.renderModes.p6h:
                gl.uniform4fv(shader.col, [0.2, 0.2, 0.2, 1.0]);
                break;
        }
        gl.drawElements(gl.TRIANGLES, model.faces.length * 3, gl.UNSIGNED_INT, 0);
        gl.disable(gl.POLYGON_OFFSET_FILL);
    }
};




var drawC = function () {
    var cmodel = {
        verts: [],
        lines: []
    };
    var pindex = 0;
    
    var mvm = m4.init();
    mvm = m4.mul(tr.roty(axis), mvm);
    mvm = m4.mul(tr.rotx(rotation), mvm);
    mvm = m4.mul(rot1, mvm);
    mvm = m4.mul(tr.scale(scale), mvm);
    
    for (var vi = 0 ; vi < model.verts.length ; vi++) {
        var p = model.verts[vi];
        var p2 = v3.matrixmul(mvm, p);
        var o = [p2[0], p2[1], 0];
        if (parameters.cpersp === 1)
        {
            var ray = v3.sub(p2,camera.eye);
            //camera.eye.z + t*ray.z = 0
            if (Math.abs(ray[2]) < c.eps) continue;
            var t = -(camera.eye[2] / ray[2]);
            o = v3.add(camera.eye,v3.constmul(ray,t));
        }
        
        ///////// BUG heh
        //var r = v3.length(v3.sub(p,o));
        
        var r = v3.length(v3.sub(p2,o));
        
        if (parameters.crr   === 1) r = r*r;
        if (parameters.csqrt === 1) r = Math.sqrt( r );
        
        
        

        var points = [];

        if (parameters.render === c.renderModes.cyc)
        {
            points = util3d.makeXYCircle(o, r, 0);
        }
        else if (parameters.render === c.renderModes.cyc3)
        {
            points = util3d.makeXYCircle(o, r, 3);
        }
        else if (parameters.render === c.renderModes.cyc4)
        {
            points = util3d.makeXYCircle(o, r, 4);
        }
        else if (parameters.render === c.renderModes.cyc5)
        {
            points = util3d.makeXYCircle(o, r, 5);
        }
        else if (parameters.render === c.renderModes.cycR)
        {
            points = util3d.makeXYCircle(o, r, -1);
        }
        cmodel.verts = cmodel.verts.concat(points);
        var pn = points.length;
        for (var i=0 ; i<(pn-1) ; i++) {
            cmodel.lines.push([pindex+i, pindex+i+1]);
        }
        //if (pn < 3) console.error("PN", pn);
        //if (pn > 2) {
            cmodel.lines.push([pindex, pindex+pn-1]);
        //}
        pindex += pn;
    }
    
    
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cmodel.verts.flat(2)), gl.STREAM_DRAW);
    
    var lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(cmodel.lines.flat(2)), gl.DYNAMIC_DRAW);
    
    cmodel.vertexBuffer = vertexBuffer;
    cmodel.lineBuffer   = lineBuffer;
    
    
    
    gl.useProgram(shader.program);

    gl.disable(gl.DEPTH_TEST);
    if (parameters.ccol[3] > 0.99) {
        gl.disable(gl.BLEND);
    } else {
        gl.enable(gl.BLEND);
        //gl.blendFunc(gl.SRC_ALPHA, gl.SRC_ALPHA_SATURATE);
        gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
    }
    
    gl.clearColor(parameters.bcol[0], parameters.bcol[1], parameters.bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cmodel.vertexBuffer);
    gl.vertexAttribPointer(shader.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    
    modelViewMatrix = tr.view(camera);
    projectionMatrix = tr.axon(camera);
    gl.uniformMatrix4fv(shader.modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(shader.projectionMatrix, false, projectionMatrix);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cmodel.lineBuffer);
    gl.lineWidth(parameters.linew);
    gl.uniform4fv(shader.col, parameters.ccol);
    gl.drawElements(gl.LINES, cmodel.lines.length * 2, gl.UNSIGNED_INT, 0);
};

var draw = function ()
{
    if (!gl || !shader || !model) return;
    if (parameters.render === c.renderModes.cyc  ||
        parameters.render === c.renderModes.cyc3 ||
        parameters.render === c.renderModes.cyc4 ||
        parameters.render === c.renderModes.cyc5 ||
        parameters.render === c.renderModes.cycR) {
        
        drawC();
    } else {
        draw1();
    }
};


var handleMouseDown = function (event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    if ((axis > 90) && (axis < 270)) {
        rotdir = false;
    } else {
        rotdir = true;
    }
};

var handleMouseUp = function (event) {
    mouseDown = false;
};

var handleMouseMove = function (event) {
    if (!mouseDown) {
        return;
    }
    var x = (event.clientX - lastMouseX)*0.3;
    var y = (event.clientY - lastMouseY)*0.3;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    
    axis += x;
    if (rotdir) {
        rotation += y;
    } else {
        rotation -= y;
    }
    // Ensure [0,360]
    axis = axis - Math.floor(axis/360.0)*360.0;
    rotation = rotation - Math.floor(rotation/360.0)*360.0;
    
    draw();
};

var handleKeyDown = function (event) {
    /*
    if (String.fromCharCode(event.keyCode) === "+") {
        scale *= 1.6;
    } else if (String.fromCharCode(event.keyCode) === "-") {
        scale *= 0.625;
    }
    */
    
    if (event.key === 'w' || event.key === 'W')
    {
        scale *= 1.1;
    }
    else if (event.key === 's' || event.key === 'S')
    {
        scale *= 0.9;
    }
    else if (event.key === 'ArrowUp')
    {
        rot1 = m4.mul(tr.rotx(-5), rot1);
    }
    else if (event.key === 'ArrowDown')
    {
        rot1 = m4.mul(tr.rotx(5), rot1);
    }
    else if (event.key === 'ArrowLeft')
    {
        rot1 = m4.mul(tr.roty(-5), rot1);
    }
    else if (event.key === 'ArrowRight')
    {
        rot1 = m4.mul(tr.roty(5), rot1);
    }
    else if (event.key === 'm' || event.key === 'M')
    {
        if (parameters.hidden)
        {
            parameters.hidden = false;
            document.getElementById("menu").className = "";
        }
        else
        {
            parameters.hidden = true;
            document.getElementById("menu").className = "hidden";
        }
    }
    else if (event.key === 'Enter')
    {
        axis = 0;
        rotation = 0;
        rotdir = true;
        rot1 = m4.init();
    }
    else
    {
        console.log("key", event.key, "code", event.code); return;
    }
    
    draw();
};

var handleWheel = function (event)
{
    if (event.deltaY < 0) scale *= 1.1;
    else                  scale *= 0.9;
    
    draw();
}

var createRenderDropdown = function () {
    var renderList = document.getElementById("render");
    for (var r in c.renderModes) {
        var option = document.createElement("option");
        option.value = r;
        option.text = c.renderModes[r];
        renderList.appendChild(option);
    }
};

var setRenderMode = function (selectedMode) {
    parameters.render = c.renderModes[selectedMode];
    shader = shaders.create();
    draw();
};

var toggleDivision = function (value) {
    parameters.doDivide = value;
    init();
    draw();
};

var toggleCA = function (value) {
    if (value) parameters.ccol = [1.0, 0.6, 0.2, 0.2];
    else       parameters.ccol = [0.9, 0.7, 0.0, 1.0];
    
    draw();
};
var toggleCPersp = function (value) {
    if (value) parameters.cpersp = 1;
    else       parameters.cpersp = 0;
    
    draw();
};
var toggleCRR = function (value) {
    if (value) parameters.crr = 1;
    else       parameters.crr = 0;
    
    draw();
};
var toggleCSqrt = function (value) {
    if (value) parameters.csqrt = 1;
    else       parameters.csqrt = 0;
    
    draw();
};

var setDivNum = function (divnum) {
    parameters.divide = divnum;
    init();
    draw();
};

var setLineWidth = function (lw) {
    parameters.linew = parseFloat(lw);
    draw();
};

var createModelDropdown = function () {
    // set1
    var modelList = document.getElementById('model1');
    for (var r1 in c.inputs1) {
        var option = document.createElement('option');
        option.value = c.inputs1[r1];
        option.text = r1;
        if (option.value === parameters.modelName) option.selected = 'true';
        modelList.appendChild(option);
    }
    
    // set 2
    var modelList2 = document.getElementById('model2');
    for (var r2 in c.inputs2) {
        var option = document.createElement('option');
        option.value = c.inputs2[r2];
        option.text = r2;
        modelList2.appendChild(option);
    }
};

var getModel = function (set) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            model = obj.create(xhr.responseText, clean);
            draw();
        }
    }
    //xhr.open('GET', parameters.server + '/input/' + set + '/' + parameters.modelName, true);
    xhr.open('GET', '../input/obj' + set + '/' + parameters.modelName, true);
    xhr.send(null);
};

var setModel = function (selectedModel, modelSet) {
    if (selectedModel === '') return;
    
    if (modelSet === 1) {
        document.getElementById('model2').selectedIndex = 0;
        //document.getElementById('divide').disabled = false;
        //document.getElementById('divnum').disabled = false;
        clean = true;
    } else {
        document.getElementById('model1').selectedIndex = 0;
        //document.getElementById('divide').checked = false;
        //document.getElementById('divide').disabled = true;
        //document.getElementById('divnum').disabled = true;
        //parameters.doDivide = false;
        clean = false;
    }
    
    parameters.modelName = selectedModel;
    parameters.modelSet = modelSet;
    getModel(modelSet);
};


window.setRenderMode = setRenderMode;
window.setModel = setModel;
window.toggleDivision = toggleDivision;
window.toggleCA     = toggleCA;
window.toggleCPersp = toggleCPersp;
window.toggleCRR    = toggleCRR;
window.toggleCSqrt  = toggleCSqrt;
window.setDivNum = setDivNum;
window.setLineWidth = setLineWidth;

createRenderDropdown();
createModelDropdown();
canvas = document.getElementById("canvas");
init();

canvas.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("wheel", handleWheel);
document.addEventListener("keydown", handleKeyDown);
window.addEventListener("resize", function() { resize(); draw(); });

draw();

