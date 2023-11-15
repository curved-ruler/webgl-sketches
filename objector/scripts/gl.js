

let gl = null;
let msg = "No WebGL";

let canvas = document.getElementById("canvas", {antialias: false});
try {
    gl = canvas.getContext("webgl");
    let ex = gl.getExtension("OES_element_index_uint");
    
    if (!ex) throw new Error("No UINT extension found");
} catch (e) {
    msg = "Error creating WebGL Context!: " + e.toString();
}
if (!gl) {
    alert(msg);
    throw new Error(msg);
}


export { gl };
