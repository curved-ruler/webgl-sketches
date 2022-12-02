
var get_webgl_context = function (canvas_id)
{
    var canvas = document.getElementById(canvas_id);
    var glc;
    
    if (!canvas)
    {
        console.error('No <canvas> with id: ' + canvas_id);
        window.alert('No <canvas> with id:\n' + canvas_id);
        return null;
    }
    try
    {
        glc = canvas.getContext('webgl');
    }
    catch (e)
    {
        console.error('Error creating WebGL Context!: ' + e.toString());
        window.alert('Error creating WebGL Context!:\n' + e.toString());
    }
    
    return glc;
};

var get_webgl2_context = function (canvas_id)
{
    var canvas = document.getElementById(canvas_id);
    var glc2;
    
    if (!canvas)
    {
        console.error('No <canvas> with id: ' + canvas_id);
        window.alert('No <canvas> with id:\n' + canvas_id);
        return null;
    }
    try
    {
        glc2 = canvas.getContext('webgl2', {preserveDrawingBuffer: true});
        //glc2 = canvas.getContext('webgl2');
    }
    catch (e)
    {
        console.error('Error creating WebGL 2.0 Context!: ' + e.toString());
        window.alert('Error creating WebGL 2.0 Context!:\n' + e.toString());
    }
    
    return glc2;
};

var compile_shader = function (gl, str, type)
{ 
    var shader = gl.createShader(type);
    
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        console.error('Error while compiling shader: ' + gl.getShaderInfoLog(shader));
        window.alert('Error while compiling shader:\n' + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
};

var create_glprog = function (gl, vs_str, fs_str)
{
    var glp = { bin: gl.createProgram() };
    
    var vsc = compile_shader(gl, vs_str, gl.VERTEX_SHADER);
    gl.attachShader(glp.bin, vsc);
    
    var fsc = compile_shader(gl, fs_str, gl.FRAGMENT_SHADER);
    gl.attachShader(glp.bin, fsc);
    
    gl.linkProgram(glp.bin);
    
    if (!gl.getProgramParameter(glp.bin, gl.LINK_STATUS))
    {
        console.error('Error while linking program: ' + gl.getProgramInfoLog());
        window.alert('Error while linking program:\n' + gl.getProgramInfoLog());
    }
    
    return glp;
};

var gl_init = {
    get_webgl_context  : get_webgl_context,
    get_webgl2_context : get_webgl2_context,
    create_glprog      : create_glprog
};

export { gl_init };
