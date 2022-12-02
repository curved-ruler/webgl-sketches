
define (function ()
{
    var get_context = function (canvas_id)
    {
        var canvas = document.getElementById(canvas_id);
        var glc;
        if (!canvas)
        {
            console.error('No <canvas> with id: ' + canvas_id);
            return null;
        }
        try
        {
            glc = canvas.getContext('webgl');
        }
        catch (e)
        {
            console.error('Error creating WebGL Context!: ' + e.toString());
        }
        if (!glc)
        {
            console.error('NO GL');
        }
        
        return glc;
    };
    
    var get_context_2 = function (canvas_id)
    {
        var canvas = document.getElementById(canvas_id);
        var glc2;
        if (!canvas)
        {
            console.error('No <canvas> with id: ' + canvas_id);
            return null;
        }
        try
        {
            glc2 = canvas.getContext('webgl2');
        }
        catch (e)
        {
            console.error('Error creating WebGL 2.0 Context!: ' + e.toString());
        }
        if (!glc2)
        {
            console.error('NO GL');
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
            console.error('Compiling shader: ' + gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    };
    
    var create_vf_program = function (gl, vs_str, fs_str)
    {
        var vfp = { glprog : gl.createProgram() };
        
        vfp.vs = compile_shader(gl, vs_str, gl.VERTEX_SHADER);
        gl.attachShader(vfp.glprog, vfp.vs);
                
        vfp.fs = compile_shader(gl, fs_str, gl.FRAGMENT_SHADER);
        gl.attachShader(vfp.glprog, vfp.fs);
        
        gl.linkProgram(vfp.glprog);
        
        if (!gl.getProgramParameter(vfp.glprog, gl.LINK_STATUS))
        {
            console.error('Could link program' + getProgramInfoLog());
        }
        
        return vfp;
    };
    
    return {
        get_context       : get_context,
        get_context_2     : get_context_2,
        create_vf_program : create_vf_program
    };
});
