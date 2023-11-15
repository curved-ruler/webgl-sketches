

let gl = null;
let msg = "No WebGL";

let canvas = document.getElementById("canvas", {antialias: false});
try
{
    gl = canvas.getContext("webgl");
    let ex = gl.getExtension("OES_element_index_uint");
    
    if (!ex) throw new Error("No UINT gl extension found");
    if (!gl) throw new Error("gl is somehow null");
}
catch (e)
{
    alert("Error creating WebGL Context!\n" + e);
}


export { gl };
