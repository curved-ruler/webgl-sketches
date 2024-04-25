
let shaders = {

        version   : '#version 300 es\n',
        precision : 'precision mediump float;\n',
        //precision : 'precision highp float;\n',

        func: `\
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
        `,
        
        vs0 : `\

in      vec3  pos;
uniform mat4  p;
uniform mat4  vm;
uniform int   proj;
uniform float aspect;

$FUNC$

void main ()
{
    //gl_PointSize = pointsize;
    if (proj == 0 || proj == 1)
    {
        gl_Position = p * vm * vec4(pos, 1.0);
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
}
`,
        
        vs_tex : `\

in      vec3  pos;
in      vec2  tex;
uniform mat4  p;
uniform mat4  vm;
uniform int   proj;
uniform float aspect;
out     vec2  texint;

$FUNC$

void main ()
{
    //gl_PointSize = pointsize;
    if (proj == 0 || proj == 1)
    {
        gl_Position = p * vm * vec4(pos, 1.0);
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
    
    texint = tex;
}
`,
        
        fs0 : `\
uniform vec3  col;
out     vec4  fragcolor;

void main ()
{
    fragcolor = vec4(col, 1.0);
}
`,
        
        fs_tex : `\
uniform sampler2D texsampler;
uniform float bayer[16];
in      vec2  texint;
out     vec4  fragcolor;

void main ()
{
    vec4 col = texture(texsampler, texint);
    int i = int(gl_FragCoord.y-0.5) % 4;
    int j = int(gl_FragCoord.x-0.5) % 4;
    fragcolor = floor(col + bayer[i*4+j]);
}
`

};

export { shaders };
