

var shaders = {

    version   : '#version 300 es\n',
    precision : 'precision mediump float;\n',
    //precision : 'precision highp float;\n',
    

    helpers : `\
vec3 shade_diffuse (in vec3 color, in vec3 norm, in vec3 light)
{
    return color*vec3(dot(norm, normalize(light)));
}

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
`,
        vs_pts : `\
in vec4 position;
uniform mat4 pvm;
uniform float aspect;
uniform int proj;
uniform vec3 dcol;
out vec4 col;

void main ()
{
    if (proj == 0) gl_Position = pvm * vec4(position.xyz, 1.0);
    else           gl_Position = transform6pp(vec4(position.xyz, 1.0), pvm, 0.8, aspect, 0.1, 200.0);
    gl_PointSize = 2.0;
    
    col = vec4(dcol, position.w);
}
`,

        fs_pts : `\
in  vec4 col;
out vec4 fragcolor;

void main ()
{
    fragcolor = vec4(col.xyz, clamp(col.w, 0.0, 1.0));
}
`
};

export { shaders };
