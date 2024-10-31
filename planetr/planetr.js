
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

import { saveAs } from './FileSaver.js';

let FS = [

    { Fstr: 'return [x*x - y*y, 2*x*y];'},
    
    { Fstr: `\
let p  = 4.0;
let r  = Math.pow(Math.sqrt(x*x + y*y), p);
let fi = Math.atan2(y, x) * p;
return [r*Math.cos(fi), r*Math.sin(fi)];\
`
    },
    
    { Fstr: `\
let a = x*x + y*y;
return [x/2 + x/(a*2), y/2 - y/(a*2)];\
`
    },
    
    { Fstr: `\
let r = 5;
let l = x*x+y*y;
return [x*r*r/l, y*r*r/l];\
`
    },
    
    { Fstr:`\
let cdiv = (z1, z2) => (
  [(z1[0]*z2[0] + z1[1]*z2[1]) / (z2[0]*z2[0] + z2[1]*z2[1]),
   (z1[1]*z2[0] - z1[0]*z2[1]) / (z2[0]*z2[0] + z2[1]*z2[1])]
);
return cdiv([y,1-x],[x+1,y]);`
    },
    
    { Fstr: 'return [x,y];'}

];


let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let N      = 50;
let A      = 0.2;
let G      = 0.0;
let Ndom   = null;
let Adom   = null;
let Gdom   = null;

let F      = null;
let Fdom   = null;
let Fstr   = FS[0].Fstr;

let model_in = { verts:[], lines:[] };
let model_tr = [];
let vrtbuf = null;
let tribuf = null;
let linbuf = null;

//let bcol  = [0.07, 0.17, 0.17];
//let lcol  = [1.0,  1.0,  1.0];
let bcol  = [0.0, 0.0, 0.0];
let lcol  = [0.0, 1.0, 0.0];
let alpha  = 1.0;
let Alfdom = null;
let Bcodom = null;
let Lcodom = null;

let tiling = "0";

let menu_hidden = false;

let projmat, modlmat, viewmat;
//let modinvmat;
let scale    = 1;
let grabbed  = 0;
let pan      = [0,0];


let camera = {
    pos   : [0,  0, 10],
    look  : [0,  0, -1],
    up    : [0,  1,  0],
    near  : 0.1,
    median: 10,
    far   : 20,
    fovy  : Math.PI / 3,
    aspect: 1
};
let compute_matrices = function ()
{
    modlmat = tr.translate([pan[0], pan[1], 0]);
    modlmat = m4.mul(tr.scale(scale), modlmat);
    
    //modinvmat = tr.scale(1/scale);
    //modinvmat = m4.mul(tr.rotz(-rotation), modinvmat);
    //modinvmat = m4.mul(tr.roty(-axis), modinvmat);
    
    viewmat = tr.view(camera);
    projmat = tr.axon(camera);
};


let fetch_file = function (name, ready)
{
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === 4 && xhr.status === 200)
        {
            ready(xhr.responseText);
        }
    }
    xhr.open('GET', name, true);
    xhr.send(null);
};


let square_t = function ()
{
    model_in.verts = [...Array((N)*(N)*8)];
    model_in.lines = [...Array((N)*(N)*8)];
    
    for (let j=0 ; j<N ; ++j)
    for (let i=0 ; i<N ; ++i)
    {
        model_in.verts[(j*(N)+i)*8+0] = -(N*A)/2.0 + i*A + G/2;
        model_in.verts[(j*(N)+i)*8+1] = -(N*A)/2.0 + j*A + G/2;
        
        model_in.verts[(j*(N)+i)*8+2] = -(N*A)/2.0 + i*A     + G/2;
        model_in.verts[(j*(N)+i)*8+3] = -(N*A)/2.0 + (j+1)*A - G/2;
        
        model_in.verts[(j*(N)+i)*8+4] = -(N*A)/2.0 + (i+1)*A - G/2;
        model_in.verts[(j*(N)+i)*8+5] = -(N*A)/2.0 + (j+1)*A - G/2;
        
        model_in.verts[(j*(N)+i)*8+6] = -(N*A)/2.0 + (i+1)*A - G/2;
        model_in.verts[(j*(N)+i)*8+7] = -(N*A)/2.0 + j*A     + G/2;
    }
    
    for (let j=0 ; j<N ; ++j)
    for (let i=0 ; i<N ; ++i)
    {
        model_in.lines[(j*N+i)*8+0] = (j*(N)+i)*4;
        model_in.lines[(j*N+i)*8+1] = (j*(N)+i)*4+1;
        model_in.lines[(j*N+i)*8+2] = (j*(N)+i)*4+1;
        model_in.lines[(j*N+i)*8+3] = (j*(N)+i)*4+2;
        model_in.lines[(j*N+i)*8+4] = (j*(N)+i)*4+2;
        model_in.lines[(j*N+i)*8+5] = (j*(N)+i)*4+3;
        model_in.lines[(j*N+i)*8+6] = (j*(N)+i)*4+3;
        model_in.lines[(j*N+i)*8+7] = (j*(N)+i)*4;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_in.verts), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model_in.lines), gl.STATIC_DRAW);
    
    
    console.log("V", model_in.verts.length, "L", model_in.lines.length);
    
    transform();
};

let polar_t = function ()
{
    let M = 2*N;
    
    model_in.verts = [...Array(N*M*8)];
    model_in.lines = [...Array(N*M*8)];
    
    let di = 2*Math.PI / M;
    let dG = G*di/2;
    let G2 = G/2;
    
    for (let j=0 ; j<N ; ++j)
    for (let i=0 ; i<M ; ++i)
    {
        let ii = di*i;
        
        model_in.verts[(j*(M)+i)*8+0] = (j+G2)*Math.cos(ii+dG);
        model_in.verts[(j*(M)+i)*8+1] = (j+G2)*Math.sin(ii+dG);
        
        model_in.verts[(j*(M)+i)*8+2] = (j+1-G2)*Math.cos(ii+dG);
        model_in.verts[(j*(M)+i)*8+3] = (j+1-G2)*Math.sin(ii+dG);
        
        model_in.verts[(j*(M)+i)*8+4] = (j+1-G2)*Math.cos(ii+di-dG);
        model_in.verts[(j*(M)+i)*8+5] = (j+1-G2)*Math.sin(ii+di-dG);
        
        model_in.verts[(j*(M)+i)*8+6] = (j+G2)*Math.cos(ii+di-dG);
        model_in.verts[(j*(M)+i)*8+7] = (j+G2)*Math.sin(ii+di-dG);
    }
    
    for (let j=0 ; j<N ; ++j)
    for (let i=0 ; i<N ; ++i)
    {
        model_in.lines[(j*N+i)*8+0] = (j*(N)+i)*4;
        model_in.lines[(j*N+i)*8+1] = (j*(N)+i)*4+1;
        model_in.lines[(j*N+i)*8+2] = (j*(N)+i)*4+1;
        model_in.lines[(j*N+i)*8+3] = (j*(N)+i)*4+2;
        model_in.lines[(j*N+i)*8+4] = (j*(N)+i)*4+2;
        model_in.lines[(j*N+i)*8+5] = (j*(N)+i)*4+3;
        model_in.lines[(j*N+i)*8+6] = (j*(N)+i)*4+3;
        model_in.lines[(j*N+i)*8+7] = (j*(N)+i)*4;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_in.verts), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model_in.lines), gl.STATIC_DRAW);
    
    
    console.log("V", model_in.verts.length, "L", model_in.lines.length);
    
    transform();
};

let hexa_t = function ()
{
    model_in.verts = [...Array(N*N*12)];
    model_in.lines = [...Array(N*N*12)];
    
    let G2 = G/2;
    let G3 = G/2 * Math.cos(30*Math.PI/180); //s3/2
    let G4 = G/2 * Math.sin(30*Math.PI/180); //0.5
    
    let va = [ A/2.0 - G4, -A*Math.sqrt(3.0)/2.0 + G3, 0.0];
    let vb = [-A/2.0 + G4, -A*Math.sqrt(3.0)/2.0 + G3, 0.0];
    let vc = [-A+G2,            0.0        , 0.0];
    let vd = [-A/2.0 + G4,  A*Math.sqrt(3.0)/2.0 - G3, 0.0];
    let ve = [ A/2.0 - G4,  A*Math.sqrt(3.0)/2.0 - G3, 0.0];
    let vf = [ A-G2,            0.0,         0.0];
    
    let vdy  = [  0.0,  A*Math.sqrt(3.0),     0.0];
    let vdx1 = [A*1.5,  A*Math.sqrt(3.0)/2.0, 0.0];
    let vdx2 = [A*1.5, -A*Math.sqrt(3.0)/2.0, 0.0];
    
    let vfirst = [-((N+1) / 2.0)*(1.5*A), -((N+1) / 2.0)*(Math.sqrt(3.0)*A), 0.0];
    let v = [];
    
    for (let y=0 ; y < N ; ++y)
    {
        v = vfirst;
        
        for (let x=0 ; x < N ; ++x)
        {
            model_in.verts[(y*N+x)*12+ 0] = v3.add(v, va)[0];
            model_in.verts[(y*N+x)*12+ 1] = v3.add(v, va)[1];
            model_in.verts[(y*N+x)*12+ 2] = v3.add(v, vb)[0];
            model_in.verts[(y*N+x)*12+ 3] = v3.add(v, vb)[1];
            model_in.verts[(y*N+x)*12+ 4] = v3.add(v, vc)[0];
            model_in.verts[(y*N+x)*12+ 5] = v3.add(v, vc)[1];
            model_in.verts[(y*N+x)*12+ 6] = v3.add(v, vd)[0];
            model_in.verts[(y*N+x)*12+ 7] = v3.add(v, vd)[1];
            model_in.verts[(y*N+x)*12+ 8] = v3.add(v, ve)[0];
            model_in.verts[(y*N+x)*12+ 9] = v3.add(v, ve)[1];
            model_in.verts[(y*N+x)*12+10] = v3.add(v, vf)[0];
            model_in.verts[(y*N+x)*12+11] = v3.add(v, vf)[1];
            
            model_in.lines[(y*N+x)*12+ 0] = (y*N+x)*6 + 0;
            model_in.lines[(y*N+x)*12+ 1] = (y*N+x)*6 + 1;
            model_in.lines[(y*N+x)*12+ 2] = (y*N+x)*6 + 1;
            model_in.lines[(y*N+x)*12+ 3] = (y*N+x)*6 + 2;
            model_in.lines[(y*N+x)*12+ 4] = (y*N+x)*6 + 2;
            model_in.lines[(y*N+x)*12+ 5] = (y*N+x)*6 + 3;
            model_in.lines[(y*N+x)*12+ 6] = (y*N+x)*6 + 3;
            model_in.lines[(y*N+x)*12+ 7] = (y*N+x)*6 + 4;
            model_in.lines[(y*N+x)*12+ 8] = (y*N+x)*6 + 4;
            model_in.lines[(y*N+x)*12+ 9] = (y*N+x)*6 + 5;
            model_in.lines[(y*N+x)*12+10] = (y*N+x)*6 + 5;
            model_in.lines[(y*N+x)*12+11] = (y*N+x)*6 + 0;
            
            v = v3.add(v, vdy);
        }
        
        vfirst = (y%2) ? v3.add(vfirst, vdx1) : v3.add(vfirst, vdx2);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_in.verts), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model_in.lines), gl.STATIC_DRAW);
    
    
    console.log("V", model_in.verts.length, "L", model_in.lines.length);
    
    transform();
};

let james_t10_cmm_t = function ()
{
    let N2 = Math.ceil(N/2);
    
    // -+, ++
    // --, +-
    let addpenta = (xd, yd, xm, ym, g) => {
        return [xd+xm*(0+g),   yd+ym*(0+g),
                xd+xm*(0+g),   yd+ym*(2-g),
                xd+xm*(1-g/2), yd+ym*(2-g),
                xd+xm*(2-g),   yd+ym*(1-g/2),
                xd+xm*(2-g),   yd+ym*(0+g)];
    };
    
    model_in.verts = [];
    model_in.lines = [];
    
    let pent = [];
    let vi  = 0;
    let egy = A/4;
    
    let xy  = [0,0];
    let xpp = [ 3*egy, 3*egy];
    let ypp = [-2*egy, 5*egy];
    
    for (let y=0 ; y < N2 ; ++y)
    {
        xy = [-N2*(xpp[0] + ypp[0])/2, -N2*(xpp[1] + ypp[1])/2];
        xy[0] += y*ypp[0];
        xy[1] += y*ypp[1];
        
        for (let x=0 ; x < N2 ; ++x)
        {
            pent = addpenta(xy[0], xy[1], egy, egy, G);
            model_in.verts.push(...pent);
            model_in.lines.push(vi + 0, vi + 1, vi + 1, vi + 2, vi + 2, vi + 3, vi + 3, vi + 4, vi + 4, vi + 0);
            vi += 5;
            
            pent = addpenta(xy[0], xy[1], -egy, egy, G);
            model_in.verts.push(...pent);
            model_in.lines.push(vi + 0, vi + 1, vi + 1, vi + 2, vi + 2, vi + 3, vi + 3, vi + 4, vi + 4, vi + 0);
            vi += 5;
            
            pent = addpenta(xy[0], xy[1], -egy, -egy, G);
            model_in.verts.push(...pent);
            model_in.lines.push(vi + 0, vi + 1, vi + 1, vi + 2, vi + 2, vi + 3, vi + 3, vi + 4, vi + 4, vi + 0);
            vi += 5;
            
            pent = addpenta(xy[0], xy[1], egy, -egy, G);
            model_in.verts.push(...pent);
            model_in.lines.push(vi + 0, vi + 1, vi + 1, vi + 2, vi + 2, vi + 3, vi + 3, vi + 4, vi + 4, vi + 0);
            vi += 5;
            
            
            
            pent = addpenta(xy[0]-2*egy, xy[1]-egy, -egy, egy, G);
            model_in.verts.push(...pent);
            model_in.lines.push(vi + 0, vi + 1, vi + 1, vi + 2, vi + 2, vi + 3, vi + 3, vi + 4, vi + 4, vi + 0);
            vi += 5;
            
            pent = addpenta(xy[0]-3*egy, xy[1]+3*egy, egy, -egy, G);
            model_in.verts.push(...pent);
            model_in.lines.push(vi + 0, vi + 1, vi + 1, vi + 2, vi + 2, vi + 3, vi + 3, vi + 4, vi + 4, vi + 0);
            vi += 5;
            
            
            xy[0] += xpp[0];
            xy[1] += xpp[1];
            // xpp
            // xd += 3;
            // yd += 3;
        }
        
        // ypp
        // xd -= 2;
        // yd += 5;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_in.verts), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model_in.lines), gl.STATIC_DRAW);
    
    
    console.log("V", model_in.verts.length, "L", model_in.lines.length);
    
    transform();
};

let cairo_t = function ()
{
    let N2 = Math.ceil(N/2);
    
    model_in.verts = [...Array(N2*N2*5*4*2)];
    model_in.lines = [...Array(N2*N2*5*4*2)];
    
    let A2 = A/2;
    let H  = 0.9 * A;
    let H2 = H*0.5;
    let X2 = Math.sqrt( (H2+A2)*(H2+A2) + (H2-A2)*(H2-A2) ) / 2;
    
    let G2 = G/2;
    
    let vv = [
        [ A2,            0.0,      0.0],
        [ A2 + (H-A2)/2, (H+A2)/2, 0.0],
        [0.0,   H,                 0.0],
        [-A2 - (H-A2)/2, (H+A2)/2, 0.0],
        [-A2,            0.0,      0.0]
    ];
    let center = [0, H2, 0];
    let vv2 = [];
    for (let i=0 ; i<5 ; ++i)
    {
        //let vvtr = v3.cmul(v3.normalize(v3.sub(center, vv[i])), G2);
        //vv2.push(v3.add(vv[i], vvtr));
        let vvtr = v3.cmul( v3.sub(vv[i], center), (H2-G2)/H2 );
        vv2.push(v3.add(center, vvtr));
    }
    
    let xy  = [0,0];
    let xpp = [ H+A2, H+A2];
    let ypp = [-H-A2, H+A2];
    
    for (let y=0 ; y < N2 ; ++y)
    {
        xy = [-N2*(xpp[0] + ypp[0])/2, -N2*(xpp[1] + ypp[1])/2];
        xy[0] += y*ypp[0];
        xy[1] += y*ypp[1];
        
        for (let x=0 ; x < N2 ; ++x)
        {
            let mat = m4.init();
            mat = m4.mul(tr.translate([xy[0], xy[1], 0]), mat);
            for (let i=0 ; i<5 ; ++i)
            {
                model_in.verts[(y*N+x)*40+ i*2+0] = v3.mmul(mat, vv2[i])[0];
                model_in.verts[(y*N+x)*40+ i*2+1] = v3.mmul(mat, vv2[i])[1];
            }
            
            mat = m4.init();
            mat = m4.mul(tr.rotz(-90), mat);
            mat = m4.mul(tr.translate([xy[0]-A2-H, xy[1], 0]), mat);
            for (let i=0 ; i<5 ; ++i)
            {
                model_in.verts[(y*N+x)*40+ 10+ i*2+0] = v3.mmul(mat, vv2[i])[0];
                model_in.verts[(y*N+x)*40+ 10+ i*2+1] = v3.mmul(mat, vv2[i])[1];
            }
            
            mat = m4.init();
            mat = m4.mul(tr.rotz(180), mat);
            mat = m4.mul(tr.translate([xy[0], xy[1], 0]), mat);
            for (let i=0 ; i<5 ; ++i)
            {
                model_in.verts[(y*N+x)*40+ 20+ i*2+0] = v3.mmul(mat, vv2[i])[0];
                model_in.verts[(y*N+x)*40+ 20+ i*2+1] = v3.mmul(mat, vv2[i])[1];
            }
            
            mat = m4.init();
            mat = m4.mul(tr.rotz(90), mat);
            mat = m4.mul(tr.translate([xy[0]+A2+H, xy[1], 0]), mat);
            for (let i=0 ; i<5 ; ++i)
            {
                model_in.verts[(y*N+x)*40+ 30+ i*2+0] = v3.mmul(mat, vv2[i])[0];
                model_in.verts[(y*N+x)*40+ 30+ i*2+1] = v3.mmul(mat, vv2[i])[1];
            }
            
            
            
            
            for (let i=0 ; i<5 ; ++i)
            {
                model_in.lines[(y*N+x)*40+ i*2+0] = (y*N+x)*20 + i;
                model_in.lines[(y*N+x)*40+ i*2+1] = (y*N+x)*20 + (i+1)%5;
            }
            for (let i=0 ; i<5 ; ++i)
            {
                model_in.lines[(y*N+x)*40+ 10+ i*2+0] = (y*N+x)*20 + 5+ i;
                model_in.lines[(y*N+x)*40+ 10+ i*2+1] = (y*N+x)*20 + 5+ (i+1)%5;
            }
            for (let i=0 ; i<5 ; ++i)
            {
                model_in.lines[(y*N+x)*40+ 20+ i*2+0] = (y*N+x)*20 + 10+ i;
                model_in.lines[(y*N+x)*40+ 20+ i*2+1] = (y*N+x)*20 + 10+ (i+1)%5;
            }
            for (let i=0 ; i<5 ; ++i)
            {
                model_in.lines[(y*N+x)*40+ 30+ i*2+0] = (y*N+x)*20 + 15+ i;
                model_in.lines[(y*N+x)*40+ 30+ i*2+1] = (y*N+x)*20 + 15+ (i+1)%5;
            }
            
            xy[0] += xpp[0];
            xy[1] += xpp[1];
        }
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_in.verts), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model_in.lines), gl.STATIC_DRAW);
    
    
    console.log("V", model_in.verts.length, "L", model_in.lines.length);
    
    transform();
};

let einstein_hat_t = function (data_csv)
{
    model_in.verts = [];
    model_in.lines = [];
    
    let lines = data_csv.split('\n');
    
    for (let i=0 ; i<lines.length/(14) ; ++i)
    {
        let gook  = true;
        let max   = [100000,-100000,100000,-100000];
        for (let j=0 ; j<14 ; ++j)
        {
            let tokens = lines[i*14 + j].split(',');
            if (tokens.length < 2)
            {
                //console.error("Too few tokens in line");
                gook = false;
                break;
            }
            let vx = parseFloat(tokens[0]);
            let vy = parseFloat(tokens[1]);
            if (Math.abs(vx) > N*20 || Math.abs(vy) > N*20)
            {
                gook = false;
                break;
            }
            
            if (vx < max[0]) max[0] = vx;
            if (vx > max[1]) max[1] = vx;
            if (vy < max[2]) max[2] = vy;
            if (vy > max[3]) max[3] = vy;
        }
        if (gook)
        {
        for (let j=0 ; j<14 ; ++j)
        {
            let s = A/50;
            
            let cent = [(max[1]*s-max[0]*s)/2+max[0]*s, (max[3]*s-max[2]*s)/2+max[2]*s, 0];
            
            let tokens = lines[i*14 + j].split(',');
            let vv = [parseFloat(tokens[0]) * s, parseFloat(tokens[1]) * s, 0];
            
            //let va = v3.sub(vv, cent);
            //let vb = v3.cmul(v3.normalize(va), G);
            //let vc = v3.add(cent, v3.sub(va,vb));
            
            let m  = tr.scale((max[1]*s-cent[0]-G) / (max[1]*s-cent[0]));
            let va = v3.sub(vv, cent);
            let vb = v3.mmul(m, va);
            let vc = v3.add(cent, vb);
            
            model_in.verts.push(vc[0]);
            model_in.verts.push(vc[1]);
        }
        }
    }
    
    for (let i=0 ; i<model_in.verts.length/28 ; ++i)
    {
        for (let j=0 ; j<14 ; ++j)
        {
            let jj = j===13 ? 0 : j+1;
            model_in.lines.push(i*14+j);
            model_in.lines.push(i*14+jj);
        }
    }
        
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_in.verts), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(model_in.lines), gl.STATIC_DRAW);
    
    
    console.log("V", model_in.verts.length, "L", model_in.lines.length);
    
    transform();
    draw();
};

let set_tiling = function (t)
{
    tiling = t;
    
    if (t == "0")
    {
        square_t();
        draw();
    }
    else if (t == "1")
    {
        polar_t();
        draw();
    }
    else if (t == "2")
    {
        hexa_t();
        draw();
    }
    else if (t == "3")
    {
        james_t10_cmm_t();
        draw();
    }
    else if (t == "4")
    {
        cairo_t();
        draw();
    }
    else if (t == "5")
    {
        fetch_file("hats.csv", einstein_hat_t);
        //draw();
    }
};

let transform = function ()
{
    modlmat = tr.translate([pan[0], pan[1], 0]);
    modlmat = m4.mul(tr.scale(scale), modlmat);
    
    model_tr = [...Array(model_in.verts.length)];
    
    for (let i=0 ; i<model_in.verts.length/2 ; ++i)
    {
        let va = [model_in.verts[i*2], model_in.verts[i*2+1], 0];
        let vb = v3.mmul(modlmat, va);
        let vc = [0,0];
        try {
            vc = F(vb[0], vb[1]);
        }
        catch (e)
        {
            alert("Func error:\n" + e);
            return;
        }
        
        model_tr[i*2]   = vc[0];
        model_tr[i*2+1] = vc[1];
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(model_tr));
};


let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    gl.disable(gl.DEPTH_TEST);
    
    if (alpha < 0.99)
    {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    else
    {
        gl.disable(gl.BLEND);
    }
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    viewmat = tr.view(camera);
    projmat = tr.axon(camera);
    gl.uniformMatrix4fv(glprog.pvm, true, m4.mul(projmat, viewmat));
    
    gl.uniform3fv(glprog.col,  lcol);
    gl.uniform1f(glprog.alpha, alpha);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vrtbuf);
    gl.vertexAttribPointer(glprog.pos, 2, gl.FLOAT, false, 2*4, 0*4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linbuf);
    gl.drawElements(gl.LINES, model_in.lines.length, gl.UNSIGNED_INT, 0);
};





let save_obj = function ()
{
    let objstring = "\n";
    let sc = 4.0;
    
    let vn = model_tr.length / 2;
    for (let i=0 ; i<vn ; ++i)
    {
        objstring += "v " + model_tr[i*2+0] / sc + " " + model_tr[i*2+1] / sc + " 0\n";
    }
    objstring += "\n";
    
    let ln = model_in.lines.length / 2;
    for (let i=0 ; i<ln ; ++i)
    {
        objstring += "l " + (model_in.lines[i*2+0]+1) + " " + (model_in.lines[i*2+1]+1) + "\n";
    }
    objstring += "\n";
    
    let blob = new Blob([objstring], {type: "text/plain"});
    saveAs(blob, 'planetr.obj');
};


let handle_key_down = function (event)
{
    if (document.activeElement === Fdom) { return; }
    if (event.ctrlKey) { return; }
    
    //console.log("K", event.key);
    
    if (event.key === "m" || event.key === "M")
    {
        if (menu_hidden)
        {
            menu_hidden = false;
            document.getElementById("menu").className = "";
        }
        else
        {
            menu_hidden = true;
            document.getElementById("menu").className = "hidden";
        }
    }
    else if (event.key === "s" || event.key === "S")
    {
        save_obj();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    else if (event.key === "Enter")
    {
        pan   = [0,0];
        scale = 1;
        transform();
        draw();
    }
    else if (event.key === "ArrowLeft")
    {
        pan[0] -= A/10;
        transform();
        draw();
    }
    else if (event.key === "ArrowRight")
    {
        pan[0] += A/10;
        transform();
        draw();
    }
    else if (event.key === "ArrowUp")
    {
        pan[1] -= A/10;
        transform();
        draw();
    }
    else if (event.key === "ArrowDown")
    {
        pan[1] += A/10;
        transform();
        draw();
    }
};
let zoomin  = function () { scale *= 1.25; };
let zoomout = function () { scale *= 0.8;  };
let handle_wheel = function (event)
{
    if (event.deltaY < 0) zoomin();
    else                  zoomout();
    
    transform();
    draw();
};
let handle_mouse_down = function (event)
{
    grabbed = 1;
};
let handle_mouse_up = function (event)
{
    grabbed = 0;
};
let handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        pan[0] += event.movementX * 0.003;
        pan[1] -= event.movementY * 0.003;
        transform();
        draw();
    }
};


let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    camera.aspect = cwidth / cheight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let set_func = function ()
{
    Fstr = Fdom.value;
    try
    {
        F = Function('x', 'y', Fstr);
    }
    catch (err)
    {
        console.error("Func error!", err.message);
        alert(err.message);
        return;
    }
    
    transform();
    draw();
};


let set_pref = function (value)
{
    let i = parseInt(value);
    if (i<0 || i>= FS.length)
    {
        console.error("Preset error!", i);
        return;
    }
    
    Fstr = FS[i].Fstr;
    
    set_ui();
    
    transform();
    draw();
};
let set_n = function (value)
{
    let n2 = parseInt(value);
    if (isNaN(n2) || n2 === undefined || n2 === null) return;
    if (n2<=0 || n2> 500)
    {
        console.error("N value error", n2);
        return;
    }
    N = n2;
};
let set_a = function (value)
{
    let a2 = parseFloat(value);
    if (isNaN(a2) || a2 === undefined || a2 === null) return;
    A = a2;
};
let set_g = function (value)
{
    let g2 = parseFloat(value);
    if (isNaN(g2) || g2 === undefined || g2 === null) return;
    G = g2;
};
let set_col = function (bstr, lstr)
{
    let bc = bstr.split(',');
    let lc = lstr.split(',');
    if (bc.length < 2) bc.push(bc[0]);
    if (bc.length < 3) bc.push(bc[0]);
    if (lc.length < 2) lc.push(lc[0]);
    if (lc.length < 3) lc.push(lc[0]);
    
    bcol[0] = parseInt(bc[0]) / 255.0;
    bcol[1] = parseInt(bc[1]) / 255.0;
    bcol[2] = parseInt(bc[2]) / 255.0;
    
    lcol[0] = parseInt(lc[0]) / 255.0;
    lcol[1] = parseInt(lc[1]) / 255.0;
    lcol[2] = parseInt(lc[2]) / 255.0;
};
let set_alpha = function (value)
{
    let a2 = parseFloat(value);
    if (isNaN(a2) || a2 === undefined || a2 === null) return;
    alpha = a2;
    //draw();
};
let set_params = function ()
{
    set_n(Ndom.value);
    set_a(Adom.value);
    set_g(Gdom.value);
    set_col(Bcodom.value, Lcodom.value);
    set_alpha(Alfdom.value);
    set_tiling(tiling);
};

let set_ui = function ()
{
    Fdom.value = Fstr;
    F = Function('x', 'y', Fstr);
    
    let opts = document.getElementById("tilings").options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == tiling) { opts.selectedIndex = i; }
    }
    
    Ndom.value = N;
    Adom.value = A;
    Gdom.value = G;
    Bcodom.value = "" + Math.floor(bcol[0]*255) + ", " + Math.floor(bcol[1]*255) + ", " + Math.floor(bcol[2]*255);
    Lcodom.value = "" + Math.floor(lcol[0]*255) + ", " + Math.floor(lcol[1]*255) + ", " + Math.floor(lcol[2]*255);
    Alfdom.value = alpha;
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id);
    
    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);
    
    glprog.pos = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    
    glprog.pvm   = gl.getUniformLocation(glprog.bin, "pvm");
    glprog.col   = gl.getUniformLocation(glprog.bin, "col");
    glprog.alpha = gl.getUniformLocation(glprog.bin, "alpha");

    vrtbuf = gl.createBuffer();
    linbuf = gl.createBuffer();
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    Fdom     = document.getElementById("func");
    Ndom     = document.getElementById("nin");
    Adom     = document.getElementById("ain");
    Gdom     = document.getElementById("gapin");
    Alfdom   = document.getElementById("alphain");
    Bcodom   = document.getElementById("bcolin");
    Lcodom   = document.getElementById("lcolin");
    
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    canvas.addEventListener("wheel",     handle_wheel);
    
    resize();
    
    set_pref(0);
    set_tiling(tiling);
};

window.set_tiling = set_tiling;
window.set_pref   = set_pref;
window.set_func   = set_func;
window.set_params = set_params;

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
