
var shaders = {

        version   : '#version 300 es\n',
        precision : 'precision mediump float;\n',
        //precision : 'precision highp float;\n',

        vs2 : `\
vec4 transform6pp (in vec4 position, in mat4 vm, in float rad, in float aspect, in float nn, in float ff)
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

in vec2 position;
uniform mat4  p;
uniform mat4  vm;
uniform float aspect;
uniform float pointsize;
uniform int   proj;

void main ()
{
    gl_PointSize = pointsize;
    if (proj == 0) gl_Position = p * vm * vec4(position, 0.0, 1.0);
    else           gl_Position = transform6pp(vec4(position, 0.0, 1.0), vm, 0.8, aspect, 0.1, 1000.0);
}
`,

        vs3 : `\
vec4 transform6pp (in vec4 position, in mat4 vm, in float rad, in float aspect, in float nn, in float ff)
{
    vec4 v   = vm * position;
    vec3 iv  = normalize(v.xyz);
    vec3 ivv = normalize(vec3(iv.x, iv.y, 0.0));
    float a  = acos(dot(vec3(0.0, 0.0, -1.0), iv));
    vec3 r   = (ivv * a) * rad;
    
    float beta = (1.0 + ff/nn) / (1.0 - ff/nn);
    float alph = (-1.0 - beta) / nn;
    float z  = alph * length(v.xyz) + beta;
    if (v.z > 0.0) z = -v.z-1.0;
    
    return vec4(r.x / aspect, r.y, z, 1.0);
}

in vec3 position;
uniform mat4  p;
uniform mat4  vm;
uniform float aspect;
uniform float pointsize;
uniform int   proj;

void main ()
{
    gl_PointSize = pointsize;
    if (proj == 0) gl_Position = p * vm * vec4(position, 1.0);
    else           gl_Position = transform6pp(vec4(position, 1.0), vm, 0.8, aspect, 0.1, 1000.0);
}
`,

        fs : `\
uniform float alpha;
uniform vec3 col;
out vec4 fragcolor;

void main ()
{
    fragcolor = vec4(col, alpha);
}
`,

};

export { shaders };
