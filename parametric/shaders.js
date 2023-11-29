
var shaders = {

        version   : '#version 300 es\n',
        precision : 'precision mediump float;\n',
        //precision : 'precision highp float;\n',

vs : `\
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

in      vec2 uv;
uniform mat4  p;
uniform mat4  vm;
uniform int   proj;
uniform float aspect;

const float PI = 3.1415926535897931;

$FUNC$

void main ()
{
    vec2 uvfull = vec2(
        uv.x * (u_range.y - u_range.x) + u_range.x,
        uv.y * (v_range.y - v_range.x) + v_range.x
    );
    vec3 pos = parametric(uvfull.x, uvfull.y);
    
    gl_PointSize = 2.0;
    
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

fs : `\
uniform vec3  col;
out     vec4  fragcolor;

void main ()
{
    fragcolor = vec4(col, 1.0);
}
`,

shell : `\
const vec2 u_range = vec2(0.0, 2.0*PI);
const vec2 v_range = vec2(0.0, 4.0*PI);

vec3 parametric (in float u, in float v)
{
    return vec3(
        cos(v) * (1.0 + cos(u)) * sin(v/8.0),
        sin(u) * sin(v/8.0) + cos(v/8.0) * 1.5,
        sin(v) * (1.0 + cos(u)) * sin(v/8.0)
    );
}`,

torus : `\
const vec2 u_range = vec2(0.0, 2.0*PI);
const vec2 v_range = vec2(0.0, 2.0*PI);

vec3 parametric (in float u, in float v)
{
    float a = 1.0;
    float b = 4.0;
    return vec3(
        (a*cos(u)+b)*cos(v),
        (a*cos(u)+b)*sin(v),
        a*sin(u)
    );
}`,

clifford: `\
const vec2 u_range = vec2(0.0, PI);
const vec2 v_range = vec2(0.0, 2.0*PI);

vec3 parametric (in float u, in float v)
{
    return vec3(
        cos(u+v) / (sqrt(2.0) + cos(v-u)),
        sin(v-u) / (sqrt(2.0) + cos(v-u)),
        sin(u+v) / (sqrt(2.0) + cos(v-u))
    );
}`,

dini: `\
const vec2 u_range = vec2(0.0, 4.0*PI);
const vec2 v_range = vec2(0.0, 2.0);

vec3 parametric (in float u, in float v)
{
    float a = 1.5;
    float b = 0.2;
    return vec3(
        a * cos(u) * sin(v),
        a * sin(u) * sin(v),
        (cos(v) + log(tan(v/2.0) + 0.05)) + b*u
    );
}`,

henneberg:`\
const vec2 u_range = vec2(-0.4*PI, 0.4*PI);
const vec2 v_range = vec2(-0.4*PI, 0.4*PI);

vec3 parametric (in float u, in float v)
{
    return vec3(
        2.0*cos(v)*sinh(u) - (2.0/3.0)*cos(3.0*v)*sinh(3.0*u),
        2.0*cos(v)*sinh(u) - (2.0/3.0)*sin(3.0*v)*sinh(3.0*u),
        2.0*cos(2.0*v)*cosh(2.0*u)
    );
}`,


fxy:`\
const vec2 u_range = vec2(-1.0, 1.0);
const vec2 v_range = vec2(-1.0, 1.0);

vec3 parametric (in float u, in float v)
{
    return vec3(
        u,
        v,
        u*u - v*v
    );
}`

};

export { shaders };
