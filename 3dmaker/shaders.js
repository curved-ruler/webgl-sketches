
let shaders = {

        version   : '#version 300 es\n',
        precision : 'precision mediump float;\n',
        //precision : 'precision highp float;\n',

        vs : `\

vec3 shade_diffuse (in vec3 color, in vec3 norm, in vec3 light)
{
    vec3 N  = normalize(norm);
    vec3 L  = normalize(light);
    float d = (dot(N,L)+1.0)/2.0;
    return color*d;
}

vec4 tr6pp (in vec4 position, in mat4 vm, in float rad, in float aspect, in float nn, in float ff)
{
    vec4 v   = vm * position;
    float l = length(v.xyz);
    vec3 iv  = (l < 0.0001) ? vec3(0.0) : normalize(v.xyz);
    vec3 ivv = (length(iv.xy) < 0.0001) ? vec3(0.0) : normalize(vec3(iv.x, iv.y, 0.0));
    float a  = (l < 0.0001) ? 0.0 : acos(dot(vec3(0.0, 0.0, -1.0), iv));
    vec3 r   = (ivv * a) * rad;
    
    float beta = (1.0 + ff/nn) / (1.0 - ff/nn);
    float alph = (-1.0 - beta) / nn;
    float z  = alph * length(v.xyz) + beta;
    if (v.z > 0.0) z = -v.z-1.0;
    
    return vec4(r.x / aspect, r.y, z, 1.0);
}

in      vec3  pos;
in      vec3  col;
in      vec3  norm;

uniform mat4  p;
uniform mat4  vm;
uniform int   proj;
uniform int   colmode;
uniform int   shaded;
uniform vec3  defcol;
uniform float aspect;

out vec3 fcol;

void main ()
{
    vec4 p2 = vm * vec4(pos, 1.0);
    gl_PointSize = 2.0;
    
    if (proj == 0 || proj == 1)
    {
        gl_Position = p * p2;
    }
    else
    {
        gl_Position = tr6pp(vec4(pos, 1.0), // pos
                            vm,             // vm
                            1.4,            // rad
                            aspect,         // aspect
                            0.1,            // near
                            1000.0          // far
                            );
    }
    
    vec3 col2 = defcol;
    if (colmode == 0) col2 = col;
    
    if (shaded == 1)
    {
        fcol  = 0.5*col2 + 0.5*shade_diffuse(col2,norm,vec3(1.0, 1.0, 1.0));
    }
    else
    {
        fcol = col2;
    }
}
`,

        fs : `\

in      vec3  fcol;
uniform float alpha;
out     vec4  fragcolor;

void main ()
{
    fragcolor = vec4(fcol, alpha);
}
`

};

export { shaders };
