
let shaders = {

        version   : '#version 300 es\n',
        precision : 'precision mediump float;\n',
        //precision : 'precision highp float;\n',

        vs : `\
in      vec2  pos;
uniform mat4  pvm;

void main ()
{
    gl_Position = pvm * vec4(pos, 0.0, 1.0);
}
`,

        fs : `\
uniform vec3  col;
uniform float alpha;
out     vec4  fragcolor;

void main ()
{
    fragcolor = vec4(col, alpha);
}
`

};

export { shaders };
