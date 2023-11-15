

var gl = null;
var msg = "No WebGL";

var canvas = document.getElementById("canvas");
try {
    gl = canvas.getContext("webgl2", {antialias: false});
} catch (e) {
    msg = "Error creating WebGL Context!: " + e.toString();
}
if (!gl) {
    alert(msg);
    throw new Error(msg);
}


export { gl };
