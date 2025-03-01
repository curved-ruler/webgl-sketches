
var shader_strings = {

vs : `\
#version 300 es

layout(location = 0) in vec2  pos;

void main ()
{
    gl_Position = vec4(pos, 0.0, 1.0);
}
`,

fs : `\
#version 300 es
precision highp float;

uniform vec4 tr;
uniform vec2 mouse;
out vec4 color;

$HELPERS$

$FUNC$

void main()
{
    float x = tr.x * gl_FragCoord.x + tr.y;
    float y = tr.z * gl_FragCoord.y + tr.w;
    color = vec4(col(x, y), 1.0);
}
`,

helpers : `\
// HSV, HSL, RGB by Inigo Quilez  https://www.shadertoy.com/view/lsS3Wc
vec3 hsv2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z * mix( vec3(1.0), rgb, c.y);
}

vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

vec3 rgb2hsv( in vec3 c )
{
    vec4 k = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.zy, k.wz), vec4(c.yz, k.xy), (c.z<c.y) ? 1.0 : 0.0);
    vec4 q = mix(vec4(p.xyw, c.x), vec4(c.x, p.yzx), (p.x<c.x) ? 1.0 : 0.0);
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0*d+0.0000001)),
                d / (q.x+0.0000001),
                q.x);
}

vec3 rgb2hsl( in vec3 col )
{
    float minc = min( col.r, min(col.g, col.b) );
    float maxc = max( col.r, max(col.g, col.b) );
    vec3  mask = step(col.grr,col.rgb) * step(col.bbg,col.rgb);
    vec3 h = mask * (vec3(0.0,2.0,4.0) +
                       (col.gbr-col.brg)/(maxc-minc + 0.0000001)) / 6.0;
    return vec3( fract( 1.0 + h.x + h.y + h.z ),                    // H
                 (maxc-minc)/(1.0-abs(minc+maxc-1.0) + 0.0000001),  // S
                 (minc+maxc)*0.5 );                                 // L
}

// Rainbow: Lets roughly map unit wavelength to RGB
// https://twitter.com/Donzanoid/status/903424376707657730
// More:
// https://twitter.com/leonard_ritter/status/903691353753878528
// https://www.shadertoy.com/view/ls2Bz1
vec3 geoffrey (in float t)
{
    vec3 r = vec3(t) * 2.1 - vec3(1.8, 1.14, 0.3);
    return vec3(1.0) - r * r;
}

// complex multiplication
vec2 cmul (in vec2 z1, in vec2 z2)
{
    return vec2(z1.x*z2.x - z1.y*z2.y, z1.x*z2.y + z1.y*z2.x);
}

// complex division
vec2 cdiv (in vec2 z1, in vec2 z2)
{
    return vec2(
        (z1.x*z2.x + z1.y*z2.y) / (z2.x*z2.x + z2.y*z2.y),
        (z1.y*z2.x - z1.x*z2.y) / (z2.x*z2.x + z2.y*z2.y)
    );
}

// complex cos
vec2 ccos(in vec2 z)
{
    vec2 eiz  = vec2( exp(-z.y)*cos(z.x),  exp(-z.y)*sin(z.x) );
    vec2 emiz = vec2( exp( z.y)*cos(z.x), -exp( z.y)*sin(z.x) );
    return (eiz+emiz)/2.0;
}

// complex sin
vec2 csin(in vec2 z)
{
    vec2 eiz  = vec2( exp(-z.y)*cos(z.x),  exp(-z.y)*sin(z.x) );
    vec2 emiz = vec2( exp( z.y)*cos(z.x), -exp( z.y)*sin(z.x) );
    return cdiv(eiz-emiz, vec2(0.0, 2.0));
}

// complex cartesian to polar // z(a,b):a+bi to p(r,φ):r*(cosφ+isinφ)
vec2 ztop (in vec2 z)
{
    return vec2(sqrt(z.x*z.x+z.y*z.y),atan(z.y,z.x));
}

// complex polar to cartesian // p(r,φ):r*(cosφ+isinφ) to z(a,b):a+bi
vec2 ptoz (in vec2 p)
{
    return vec2(p.x*cos(p.y),p.x*sin(p.y));
}

bool isint(in float t, in float e)
{
    return (fract(t) < e || fract(t) > 1.0-e);
}

bool iseq(in float a, in float b, in float e)
{
    return (abs(a-b) < e);
}
`,

eq01 : `\
vec3 col(in float x, in float y)
{
    float left  = sin(x) + (y*y*0.02);
    float right = 1.0;
    return abs(left-right) < 0.2 ? vec3(0.9,0.55,0.0) : vec3(0.11);
}
`,

eq01b : `\
vec3 col(in float x, in float y)
{
    float left  = sin(x) + (y*y*0.02);
    float right = 1.0;
    return isint(left-right, 0.1) ? vec3(0.9,0.55,0.0) : vec3(0.11);
}
`,

eq02 : `\
vec3 col(in float x, in float y)
{
    float t = sin(x*x)+sin(y*y)-1.0;
    t = t*0.5+0.5;
    return geoffrey(t);
}
`,

eq02b : `\
vec3 col(in float x, in float y)
{
    float t = sin(x*x)+sin(y*y)+mouse.x;
    t = fract(t);
    return hsv2rgb(vec3(0.5,t,t));
}`,

groovy_a : `\
vec3 col(in float x, in float y)
{
    float left  = sin(x) * sin(y/8.0) + cos(y/8.0) * 1.5;
    return isint(left, 0.4) ? vec3(0.9,0.55,0.0) : vec3(0.11);
}
`,

groovy_b : `\
vec3 col(in float x, in float y)
{
    float left  = cos(x+y) / (sqrt(2.0) + cos(y-x));
    float right = sin(y-x) / (sqrt(2.0) + cos(y-x));
    return isint(left-right, 0.05) ? vec3(0.9,0.55,0.0) : vec3(0.11);
}
`,

groovy_b_aa : `\
// from @nex@chaos.social
vec3 col(in float x, in float y)
{
    float left  = cos(x+y) / (sqrt(2.0) + cos(y-x));
    float right = sin(y-x) / (sqrt(2.0) + cos(y-x));
    float b = smoothstep(0.8, 1.0, sin((left - right)*5.0 + 1.5));
    return vec3(0.9, 0.55, 0.16) * (b * 0.87 + 0.13);
}
`,

groovy_c : `\
// from @geoffl@mastodon.me.uk
vec3 col(in float x, in float y)
{
        float s = 22.;
        x=x/40.;
        y=y/40.;
        float c=(
            cos(s*x*2.)
           +cos(s*y)
           +cos(s*sqrt(x*x/1.5+y*y))
           +cos(s*(90.+sqrt(x*x*2.5+y*y*1.5)))
           +cos(s*sqrt(x*x+y*y*3.))
           );
    return c-(floor(c*2.)/2.) < 0.1 ? vec3(0.9,0.55,0.0) : vec3(0.11);
}
`,

cmp01 : `\
vec3 col(in float x, in float y)
{
    vec2 z  = vec2(x,y);
    vec2 z3 = z + cdiv(vec2(1.0, 0.0), z);
    vec2 fz1 = vec2(1.0,0.0) - cmul(z3,z3)/2.0;
    vec2 fz  = vec2(1.0,0.0) - cmul(fz1,fz1)/2.0;
    float t = atan(fz.y,fz.x)/6.28 + 0.5;
    return geoffrey(t);
}
`,

cmp01b : `\
vec3 col (in float x, in float y)
{
    vec2 z  = vec2(x,y);
    vec2 z3 = z + cdiv(vec2(1.0, 0.0), z);
    vec2 fz1 = vec2(1.0,0.0) - cmul(z3,z3)/2.0;
    vec2 fz = vec2(1.0,0.0) - cmul(fz1,fz1)/2.0;
    float t = atan(fz.y,fz.x)/6.28 + 0.5;
    return hsv2rgb(vec3(t,0.9,0.9));
}
`,

mandel : `\
// Mandelbrot set by https://twitter.com/lisyarus
vec3 col(in float x, in float y)
{
    vec2 z = vec2(0.0);
    int i = 0;
    int n = 100;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + x, 2.0*z.x*z.y + y);
        if (length(z) > 2.0) break;
    }
    return vec3(float(i)/float(n));
}
`,

mandel_mosaic: `\
vec3 col(in float x, in float y)
{
    float d  = 0.02;
    float sc = 2.5;
    vec2 z0  = vec2(x,y);
    vec2 c   = (floor(z0/d) + 0.5)*d;
    vec2 z   = (z0 - floor(z0/d)*d)*(sc/d) - (sc/2.0);
    int i = 0;
    int n = 100;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + c.x, 2.0*z.x*z.y + c.y);
        if (length(z) > 2.0) break;
    }
    float t = fract(float(i) / float(n) * 1.95);
    return hsv2rgb(vec3(0.1, 0.9, t));
}`,

julia : `\
// Julia sets
vec3 col(in float x, in float y)
{
    vec2 z = vec2(x,y);
    vec2 c = vec2(-0.047, -0.651);
    //vec2 c = vec2(-0.158, -1.03);
    //vec2 c = vec2(-0.201, -0.661);
    //vec2 c = vec2(-0.213, -0.697);
    //vec2 c = vec2(-0.216, -0.701);
    //vec2 c = vec2(-0.225, -0.707);
    //vec2 c = vec2(-0.228, -0.699);
    //vec2 c = vec2( 0.255,  0.5);
    //vec2 c = vec2( 0.296, -0.019);
    //vec2 c = vec2( 0.296, -0.017);
    //vec2 c = vec2( 0.318, -0.044);
    //vec2 c = vec2(-0.755, -0.094);
    int i = 0;
    int n = 500;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + c.x, 2.0*z.x*z.y + c.y);
        if (length(z) > 2.0) break;
    }
    float t = fract(float(i) / float(n) * 2.0);
    return hsv2rgb(vec3(0.1, 0.9, t));
}
`,

julia_and_mand: `\
float mand(in float x, in float y)
{
    vec2 z = vec2(0.0);
    int i = 0;
    int n = 100;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + x, 2.0*z.x*z.y + y);
        if (length(z) > 2.0) break;
    }
    return (float(i)/float(n));
}
vec3 col(in float x, in float y)
{
    vec2 z = vec2(x,y);
    vec2 c = vec2(mouse.x, mouse.y);
    int i = 0;
    int n = 500;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + c.x, 2.0*z.x*z.y + c.y);
        if (length(z) > 2.0) break;
    }
    float t = fract(float(i) / float(n) * 1.95);
    return hsv2rgb(vec3(0.1, 0.9, t)) + vec3(0.1*mand(x,y));
}
`,

julia_rainbow: `\
float mand(in float x, in float y)
{
    vec2 z = vec2(0.0);
    int i = 0;
    int n = 100;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + x, 2.0*z.x*z.y + y);
        if (length(z) > 2.0) break;
    }
    return (float(i)/float(n));
}
vec3 col(in float x, in float y)
{
    vec2 z = vec2(x,y);
    vec2 c = vec2(mouse.x, mouse.y);
    int i = 0;
    int n = 500;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + c.x, 2.0*z.x*z.y + c.y);
        if (length(z) > 2.0) break;
    }
    float t = fract(3.5 * float(i) / float(n));
    return hsv2rgb(vec3(t, 1.0-t, 1.0-t)) + vec3(0.1*mand(x,y));
}
`,

julia_binary: `\
float mand(in float x, in float y)
{
    vec2 z = vec2(0.0);
    int i = 0;
    int n = 100;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + x, 2.0*z.x*z.y + y);
        if (length(z) > 2.0) break;
    }
    return (float(i)/float(n));
}
vec3 col(in float x, in float y)
{
    vec2 z = vec2(x,y);
    vec2 c = vec2(mouse.x, mouse.y);
    int i = 0;
    int n = 500;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + c.x, 2.0*z.x*z.y + c.y);
        if (length(z) > 2.0) break;
    }
    vec3 t = i<n ? vec3(0.0) : hsv2rgb(vec3(0.1, 0.9, 0.9));
    return t + vec3(0.1*mand(x,y));
}
`,

julia_2: `\
// Julia set with equation by @Peter_Stampfli@mathstodon.xy
vec3 col(in float x, in float y)
{
    vec2 z  = vec2(x,y);
    int i = 0;
    int n = 64;
    for (i=0 ; i<n ; ++i)
    {
        vec2 z5 = cmul(z,cmul(z,cmul(z,cmul(z,cmul(z,z)))));
        vec2 a  = (z5-vec2(pow(0.3976,2.0), 0.0));
        vec2 b  = (z5+vec2(pow(0.7638,2.0), 0.0));
        vec2 c  = (z5+vec2(pow(0.6625,2.0), 0.0));
        z = 0.72*cdiv(a,cdiv(b,cdiv(c,z)));
        if (length(z) > 100.0) break;
    }
    float t = fract(float(i) / float(n)*16.0);
    return hsv2rgb(vec3(0.1, 0.9, t));
}
`,

julia_2_m: `\
// derived from equation by @Peter_Stampfli@mathstodon.xy
vec3 col(in float x, in float y)
{
    vec2 z  = vec2(x,y);
    int i = 0;
    int n = 64;
    for (i=0 ; i<n ; ++i)
    {
        vec2 z5 = cmul(z,cmul(z,cmul(z,cmul(z,z))));
        vec2 a  = z5-vec2(mouse.x, 0.0);
        vec2 b  = z5+vec2(2.0*mouse.x, 2.0*mouse.y);
        vec2 c  = z5+vec2(mouse.x, mouse.y);
        z = 0.72*cdiv(a,cdiv(b,cdiv(c,z)));
        if (length(z) > 10.0) break;
    }
    float t = fract(float(i) / float(n)*16.0);
    return hsv2rgb(vec3(0.1, 0.9, t));
}
`,

nr_bad : `\
vec3 col(in float x, in float y)
{
    const int N = 128;
    vec2 z = vec2(x, y);
    
    vec2 r0 = vec2(1.0, 0.0);
    vec2 r1 = vec2(-0.5,  sqrt(0.75));
    vec2 r2 = vec2(-0.5, -sqrt(0.75));
    
    ivec2 ret;
    int i;
    for (i=0 ; i<N ; ++i)
    {
        // f(z) = z^3-1
        vec2 v = vec2(z.x*z.x*z.x - 3.0*z.x*z.y*z.y - 1.0, 3.0*z.x*z.x*z.y - z.y*z.y*z.y);
        // f'(z) = 3z^2;
        vec2 d = 3.0* vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);
        // f(z) / f'(z)
        vec2 q = vec2(v.x*d.x + v.y*d.y, -v.x*d.y+v.y*d.x) / dot(d,d);
        
        z = z-q;
        
        if ( abs(dot(z,r0)) < 0.01 ) { ret.x = 0; ret.y = i; break; }
        if ( abs(dot(z,r1)) < 0.01 ) { ret.x = 1; ret.y = i; break; }
        if ( abs(dot(z,r2)) < 0.01 ) { ret.x = 2; ret.y = i; break; }
    }
    
    vec3 c = ret.x == 0 ? vec3(0.0,1.0,1.0) : ret.x == 1 ? vec3(1.0,0.0,1.0) : vec3(1.0,1.0,0.0);
    
    return float(N-i)/float(N) * c;
}
`,

nr_bad_2: `\
vec3 col(in float x, in float y)
{
    const int N = 32;
    vec2 z = vec2(x, y);
    int i;
    for (i=0 ; i<N ; ++i)
    {
        vec2 v = cmul(z,cmul(z,cmul(z,cmul(z,cmul(z,z))))) + z;
        vec2 d = 6.0*cmul(z,cmul(z,cmul(z,cmul(z,z)))) + 1.0;
        vec2 q = cdiv(v,d);
        z = z-q;
        vec2 v2 = cmul(z,cmul(z,cmul(z,cmul(z,cmul(z,z))))) + z;
        if ( abs(v2.x+v2.y) < 0.0001 ) { break; }
    }
    
    float t = float(N-i)/float(N);
    return vec3(fract(2.95*t));
}`,

nr : `\
vec3 col(in float x, in float y)
{
    const int N = 32;
    vec2 z = vec2(x, y);
    
    vec2 r0 = vec2(1.0, 0.0);
    vec2 r1 = vec2(-0.5,  sqrt(0.75));
    vec2 r2 = vec2(-0.5, -sqrt(0.75));
    
    ivec2 ret;
    int i;
    for (i=0 ; i<N ; ++i)
    {
        // f(z) = z^3-1
        vec2 v = vec2(z.x*z.x*z.x - 3.0*z.x*z.y*z.y - 1.0, 3.0*z.x*z.x*z.y - z.y*z.y*z.y);
        // f'(z) = 3z^2;
        vec2 d = 3.0* vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);
        // f(z) / f'(z)
        vec2 q = vec2(v.x*d.x + v.y*d.y, -v.x*d.y+v.y*d.x) / dot(d,d);
        
        z = z-q;
        
        if ( abs(z-r0).x < 0.0001 && abs(z-r0).y < 0.0001 ) { ret.x = 0; ret.y = i; break; }
        if ( abs(z-r1).x < 0.0001 && abs(z-r1).y < 0.0001 ) { ret.x = 1; ret.y = i; break; }
        if ( abs(z-r2).x < 0.0001 && abs(z-r2).y < 0.0001 ) { ret.x = 2; ret.y = i; break; }
    }
    
    vec3 c = ret.x == 0 ? vec3(1.0,0.0,0.0) : ret.x == 1 ? vec3(0.0,1.0,0.0) : vec3(0.0,0.0,1.0);
    
    return float(N-i)/float(N) * c;
}
`,

nr2 : `\
vec2 fz (in vec2 z, in vec2 a, in vec2 b)
{
    vec2 z2 = cmul(z,z);
    return z2+cdiv(a,z2+cdiv(b,z));
}
vec2 dfz (in vec2 z, in vec2 a, in vec2 b)
{
    vec2 z3 = cmul(z,cmul(z,z));
    vec2 p0 = cmul(a,b-2.0*z3);
    vec2 p1 = cmul(b+z3,b+z3);
    return cdiv(p0,p1)+2.0*z;
}

vec3 col(in float x, in float y)
{
    const int N = 32;
    vec2 z = vec2(x, y);
    vec2 a = vec2(pow(0.3976,2.0), 0.0);
    vec2 b = vec2(pow(0.7638,2.0), 0.0);
    int i;
    for (i=0 ; i<N ; ++i)
    {
        vec2 v = fz(z,a,b);
        
        //if ( abs(v.x) < 0.0001 && abs(v.y) < 0.0001 ) { break; }
        if ( abs(v.x+v.y) < 0.0001 ) { break; }
        
        vec2 d = dfz(z,a,b);
        vec2 q = cdiv(v,d);
        z = z-q;
    }
    
    float t = float(N-i)/float(N);
    return vec3(fract(2.95*t));
}`,

nr2_mouse : `\
vec2 fz (in vec2 z, in vec2 a, in vec2 b)
{
    vec2 z2 = cmul(z,z);
    return z2+cdiv(a,z2+cdiv(b,z));
}
vec2 dfz (in vec2 z, in vec2 a, in vec2 b)
{
    vec2 z3 = cmul(z,cmul(z,z));
    vec2 p0 = cmul(a,b-2.0*z3);
    vec2 p1 = cmul(b+z3,b+z3);
    return cdiv(p0,p1)+2.0*z;
}

vec3 col(in float x, in float y)
{
    const int N = 32;
    vec2 z = vec2(x, y);
    vec2 a = vec2(mouse.x, 0.0);
    vec2 b = vec2(mouse.y, 0.0);
    int i;
    for (i=0 ; i<N ; ++i)
    {
        vec2 v = fz(z,a,b);
        
        //if ( abs(v.x) < 0.0001 && abs(v.y) < 0.0001 ) { break; }
        if ( abs(v.x+v.y) < 0.0001 ) { break; }
        
        vec2 d = dfz(z,a,b);
        vec2 q = cdiv(v,d);
        z = z-q;
    }
    
    float t = float(N-i)/float(N);
    return vec3(fract(2.95*t));
}`,

sec_bad : `\
vec3 col(in float x, in float y)
{
    const int N = 128;
    vec2 z0 = vec2(0.0, 0.0);
    vec2 z1 = vec2(x, y);
    vec2 z  = z1;
    
    vec2 r0 = vec2(1.0, 0.0);
    vec2 r1 = vec2(-0.5,  sqrt(0.75));
    vec2 r2 = vec2(-0.5, -sqrt(0.75));
    
    ivec2 ret;
    int i;
    for (i=0 ; i<N ; ++i)
    {
        // f(z) = z^3-1
        vec2 v0 = vec2(z0.x*z0.x*z0.x - 3.0*z0.x*z0.y*z0.y - 1.0, 3.0*z0.x*z0.x*z0.y - z0.y*z0.y*z0.y);
        vec2 v1 = vec2(z1.x*z1.x*z1.x - 3.0*z1.x*z1.y*z1.y - 1.0, 3.0*z1.x*z1.x*z1.y - z1.y*z1.y*z1.y);
        vec2 v2 = cdiv( cmul(z0,v1)-cmul(z1,v0), v1-v0);
        
        z0 = z1;
        z1 = v2;
        
        if ( abs(dot(z1,r0)) < 0.01 ) { ret.x = 0; ret.y = i; break; }
        if ( abs(dot(z1,r1)) < 0.01 ) { ret.x = 1; ret.y = i; break; }
        if ( abs(dot(z1,r2)) < 0.01 ) { ret.x = 2; ret.y = i; break; }
    }
    
    vec3 c = ret.x == 0 ? vec3(0.0,1.0,1.0) : ret.x == 1 ? vec3(1.0,0.0,1.0) : vec3(1.0,1.0,0.0);
    
    return float(N-i)/float(N) * c;
}
`,

sec : `\
vec3 col(in float x, in float y)
{
    const int N = 32;
    vec2 z0 = vec2(0.0, 0.0);
    vec2 z1 = vec2(x, y);
    vec2 z  = z1;
    
    vec2 r0 = vec2(1.0, 0.0);
    vec2 r1 = vec2(-0.5,  sqrt(0.75));
    vec2 r2 = vec2(-0.5, -sqrt(0.75));
    
    ivec2 ret;
    int i;
    for (i=0 ; i<N ; ++i)
    {
        // f(z) = z^3-1
        vec2 v0 = vec2(z0.x*z0.x*z0.x - 3.0*z0.x*z0.y*z0.y - 1.0, 3.0*z0.x*z0.x*z0.y - z0.y*z0.y*z0.y);
        vec2 v1 = vec2(z1.x*z1.x*z1.x - 3.0*z1.x*z1.y*z1.y - 1.0, 3.0*z1.x*z1.x*z1.y - z1.y*z1.y*z1.y);
        vec2 v2 = cdiv( cmul(z0,v1)-cmul(z1,v0), v1-v0);
        
        z0 = z1;
        z1 = v2;
        
        if ( abs(z1-r0).x < 0.01 && abs(z1-r0).y < 0.01 ) { ret.x = 0; ret.y = i; break; }
        if ( abs(z1-r1).x < 0.01 && abs(z1-r1).y < 0.01 ) { ret.x = 1; ret.y = i; break; }
        if ( abs(z1-r2).x < 0.01 && abs(z1-r2).y < 0.01 ) { ret.x = 2; ret.y = i; break; }
    }
    
    vec3 c = ret.x == 0 ? vec3(1.0,0.0,0.0) : ret.x == 1 ? vec3(0.0,1.0,0.0) : vec3(0.0,0.0,1.0);
    
    return float(N-i)/float(N) * c;
}
`,

bit01 : `\
vec3 col(in float x, in float y)
{
    int a = int(floor(x));
    int b = int(floor(y));
    int left  = (a ^ b) % 9;
    return (left == 0) ? vec3(1.0) : vec3(0.0);
}
`,

bit02 : `\
vec3 col(in float x, in float y)
{
    int a = int(floor(x));
    int b = int(floor(y));
    int left  = (a*a + b*b) % 256;
    return vec3(float(left)/256.0);
}
`

};

export { shader_strings };
