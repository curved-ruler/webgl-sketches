
let shaders = {

        version   : '#version 300 es\n',
        precision : 'precision mediump float;\n',
        //precision : 'precision highp float;\n',

        vs : `\
in      vec3  posa;
uniform vec3  col;
uniform mat4  vm;
out     vec4  fragcol;

void main ()
{
    gl_Position = vm * vec4(posa.xy, 1.0, 1.0);
    fragcol     = vec4(col, posa.z);
}
`,

        fs : `\
in  vec4 fragcol;
out vec4 fragcolor;

void main ()
{
    fragcolor = fragcol;
}
`

};

export { shaders };
