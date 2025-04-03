
define(function ()
{
    return {
        
        version   : '#version 300 es\n',
        precision : 'precision mediump float;\n',
        //precision : 'precision highp float;\n',
        
        def_norm : `\
float dist (in vec2 p1, in vec2 p2, in int i)
{
    return float(i%2+1) * pow( pow(abs(p1.x - p2.x), 2.0) + pow(abs(p1.y - p2.y), 2.0), 0.5);
}
`,
    
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

void get_pos_norm (in vec3 data, in float dx, out vec3 pos, out vec3 norm, out vec3 col)
{
    vec2  p0, p1, p2, p3;
    fdata fdata0, fdata1, fdata2, fdata3;
    hcol  hc0, hc1, hc2, hc3;
    
    float datx = data.x;
    float daty = data.y;
    
    p0 = vec2(datx*dx, daty*dx);
    p0 = (p0 - vec2(canvas_scale_p2)) / canvas_scale_p2;
    fdata0 = compute_fdata(p0);
    hc0 = comp_values(fdata0);
    
    if      (data.z > -0.1 && data.z < 0.1) p1 = vec2(datx*dx, daty*dx);
    else if (data.z >  0.9 && data.z < 1.1) p1 = vec2((datx)*dx, (daty-1.0)*dx);
    else if (data.z >  1.9 && data.z < 2.1) p1 = vec2((datx-1.0)*dx, (daty)*dx);
    else if (data.z >  2.9 && data.z < 3.1) p1 = vec2((datx-1.0)*dx, (daty-1.0)*dx);
    else if (data.z >  3.9 && data.z < 4.1) p1 = vec2((datx-1.0)*dx, (daty)*dx);
    else                                    p1 = vec2((datx)*dx, (daty-1.0)*dx);
    
    p2 = vec2(p1.x, p1.y+dx);
    p3 = vec2(p1.x+dx, p1.y);
    p1 = (p1 - vec2(canvas_scale_p2)) / canvas_scale_p2;
    p2 = (p2 - vec2(canvas_scale_p2)) / canvas_scale_p2;
    p3 = (p3 - vec2(canvas_scale_p2)) / canvas_scale_p2;
    fdata1 = compute_fdata(p1);
    fdata2 = compute_fdata(p2);
    fdata3 = compute_fdata(p3);
    hc1 = comp_values(fdata1);
    hc2 = comp_values(fdata2);
    hc3 = comp_values(fdata3);
    
    pos  = vec3(p0, hc0.h);
    norm = normalize(cross(vec3(p2, hc2.h) - vec3(p1, hc1.h), vec3(p3, hc3.h) - vec3(p1, hc1.h)));
    col = hc1.col;
}
`,

        compute : `\
uniform float canvas_scale_p2;
uniform float marker;
uniform float basedata[{basen} * 5 + 1];

struct fdata
{
    bool  spot;
    float d1;
    int   i1;
    float d2;
    int   i2;
    float d3;
    int   i3;
};

struct hcol
{
    float h;
    vec3  col;
};

float eukn (in vec2 p1, in vec2 p2)
{
    return (p1.x - p2.x)*(p1.x - p2.x) + (p1.y - p2.y)*(p1.y - p2.y);
}

vec3 getcol (in int baseid)
{
    vec3 col = vec3(0.2, 0.2, 0.2);
    
    if (baseid != -1)
    {
        for (int j=0 ; j<{basen} ; ++j)
        {
            if (baseid == j)
                col = vec3(basedata[j*5+2], basedata[j*5+3], basedata[j*5+4]);
        }
    }
    
    return col;
}

#define FMAX 1.0e+20
#define CSWAP(j) \
if (dfs[j-1] > dfs[j]) \
{ \
    dfs[4] = dfs[j-1]; dfs[j-1] = dfs[j]; dfs[j] = dfs[4]; \
    ifs[4] = ifs[j-1]; ifs[j-1] = ifs[j]; ifs[j] = ifs[4]; \
}

fdata compute_fdata (in vec2 p)
{
    fdata ret;
    ret.spot = false;
    
    float dfs[5];
    int   ifs[5];
    dfs[0] = FMAX; ifs[0] = -1;
    dfs[1] = FMAX; ifs[1] = -1;
    dfs[2] = FMAX; ifs[2] = -1;
    dfs[3] = FMAX; ifs[3] = -1;
    
    float markerpix = (marker/canvas_scale_p2) * (marker/canvas_scale_p2);
    
    for (int i=0 ; i<{basen} ; ++i)
    {
        if (eukn(p, vec2(basedata[i*5], basedata[i*5+1])) < markerpix) { ret.spot = true; }
        
        float di = dist(p, vec2(basedata[i*5], basedata[i*5+1]), i);
        dfs[3] = di; ifs[3] = i;
        
        CSWAP(3);
        CSWAP(2);
        CSWAP(1);
        
        CSWAP(2);
        CSWAP(1);
        
        CSWAP(1);
    }
    
    ret.d1 = (ifs[0] > -1) ? dfs[0] : 0.0; ret.i1 = ifs[0];
    ret.d2 = (ifs[1] > -1) ? dfs[1] : 0.0; ret.i2 = ifs[1];
    ret.d3 = (ifs[2] > -1) ? dfs[2] : 0.0; ret.i3 = ifs[2];
    
    return ret;
}
`,
        def_usefdata  : `\
hcol comp_values (in fdata fd)
{
    hcol ret;
    ret.h   = fd.d1;
    ret.col = getcol(fd.i1);
    return ret;
}
`,

        vs3d : `\
in vec3 position;
uniform mat4 pvm;
uniform float dx;
uniform vec3 light;
uniform int proj;

out vec3 col;
void main ()
{
    vec3 P, N, C;
    get_pos_norm(position, dx, P, N, C);
    
    if (proj == 0) gl_Position = pvm * vec4(P, 1.0);
    else           gl_Position = transform6pp(vec4(P, 1.0), pvm, 0.8, 1.0, 0.01, 20.0);
    
    col = C + 0.2 * shade_diffuse(vec3(0.7, 0.7, 0.7), N, light);
}
`,
    
        vs2d : `\
in  vec2 position;
void main ()
{
    gl_Position = vec4(position, 0.0, 1.0);
}
`,

        fs3d : `\
uniform float alpha;
in  vec3 col;
out vec4 fragcolor;

void main ()
{
    fragcolor = vec4(col, alpha);
}
`,

        fs2d : `\
out vec4 fragcolor;
void main ()
{
    fdata finfo = compute_fdata((gl_FragCoord.xy - vec2(canvas_scale_p2)) / canvas_scale_p2);
    
    hcol hc = comp_values(finfo);
    
    if (!(finfo.spot))
    {
        fragcolor = vec4(hc.col, 1.0);
    }
    else
    {
        fragcolor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
`

    };
});
