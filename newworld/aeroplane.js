
import { m4, v3, quat, tr } from "./matvec.js";

/*
let plane = {
    pos    : [0, 0, 0],
    orient : [0, 0, 0, 0],
    
    imass    : 1/100,
    iinertia : 1/10,
    
    forw   : false,
    backw  : false,
    tup    : false,
    tdown  : false,
    tLroll : false,
    tRroll : false,
    tLyaw  : false,
    tRyaw  : false,
    
    damp  : -0.01, // - (F / vmax)
    adamp : -1.0,
    
    maxvel  : 0.03,
    maxavel : 0.5

    acceleration : [0,0,0],
    angularacc   : [0,0,0],
    velocity     : [0,0,0],
    angularvel   : [0,0,0]
};
*/



let tick = function (plane, dt)
{
    let forces  = [0, 0, 0];
    let torques = [0, 0, 0];
    let add_f = (f)       => { forces[0] += f[0]; forces[1]+=f[1]; forces[2]+=f[2]; };
    let add_t = (f, fpos) => { let t = v3.cross(fpos, f); torques[0]+=t[0]; torques[1]+=t[1]; torques[2]+=t[2];};
    
    let look  = tr.rot_q(plane.orient, [1,0,0]);
    let up    = tr.rot_q(plane.orient, [0,0,1]);
    let right = v3.cross(look, up);
    let vrot  = v3.length(plane.velocity) * 30.0; // TODO param
    if (vrot > 0.7) vrot = 0.7;
    
    if (plane.forw) {
        add_f( [look[0]*plane.force, look[1]*plane.force, look[2]*plane.force] );
    }
    if (plane.backw) {
        add_f( [look[0]*plane.force, look[1]*plane.force, look[2]*plane.force] );
    }
    if (plane.tup) {
        add_t([up[0]*(plane.torque*vrot), up[1]*(plane.torque*vrot), up[2]*(plane.torque*vrot)], look);
    }
    if (plane.tdown) {
        add_t([up[0]*(-plane.torque*vrot), up[1]*(-plane.torque*vrot), up[2]*(-plane.torque*vrot)], look);
    }
    if (plane.tLroll) {
        add_t([up[0]*(plane.torque*vrot), up[1]*(plane.torque*vrot), up[2]*(plane.torque*vrot)], right);
    }
    if (plane.tRroll) {
        add_t([up[0]*(plane.torque*vrot), up[1]*(plane.torque*vrot), up[2]*(plane.torque*vrot)], [-right[0], -right[1], -right[2]]);
    }
    if (plane.tLyaw) {
        add_t([right[0]*(plane.torque*vrot), right[1]*(plane.torque*vrot), right[2]*(plane.torque*vrot)], [-look[0], -look[1], -look[2]]);
    }
    if (plane.tRyaw) {
        add_t([right[0]*(plane.torque*vrot), right[1]*(plane.torque*vrot), right[2]*(plane.torque*vrot)], look);
    }
    
    let len = v3.length(plane.velocity);
    if (len > 0.00001)
    {
        let vn = v3.normalize(plane.velocity);
        let cosangle = v3.dot(vn, look);
        let ll = (cosangle > 0.0) ? look : [-look[0], -look[1], -look[2]];
        vn = v3.add(vn, v3.cmul(v3.sub(ll, vn), 0.2));
        vn = v3.setlength(vn, len);
        plane.velocity = vn;
    }
    
    // dampers
    let veldamp = v3.normalize(plane.velocity);
    veldamp = v3.cmul(veldamp, plane.damp);
    add_f(veldamp);
    
    let wn = v3.normalize(plane.angularvel);
    let r  = v3.normalize(tr.norm_ortho(wn));
    let t  = v3.cmul(v3.cross(plane.angularvel, r), plane.adamp);
    add_t(t, r);
    
    move(plane, forces, torques, dt);
    
    plane.orient = quat.normalize(plane.orient);
};

let move = function (plane, forces, torques, dt)
{
    plane.pos          = v3.add(plane.pos, v3.add( v3.cmul(plane.velocity, dt) , v3.cmul(plane.acceleration, dt*dt*0.5) ) ); // TODO 0.5
    plane.acceleration = v3.cmul(forces, plane.imass);
    plane.velocity     = v3.add(plane.velocity, v3.cmul(plane.acceleration, dt));
    plane.velocity     = v3.maximize(plane.velocity, plane.maxvel);
    
    plane.angularacc = v3.cmul(torques, plane.iinertia);
    let w            = [0, plane.angularvel[0], plane.angularvel[1], plane.angularvel[2]];
    plane.orient     = quat.add ( plane.orient, quat.cmul(quat.mul(w, plane.orient), dt*0.5) );
    plane.angularvel = v3.add( plane.angularvel, v3.cmul(plane.angularacc, dt) );
    plane.angularvel = v3.maximize(plane.angularvel, plane.maxavel);
};


let control = function (plane, ev, newval)
{
    if (ev.key === 'ArrowUp')   { plane.forw  = newval; }
    if (ev.key === 'ArrowDown') { plane.backw = newval; }
    
    if (ev.key === 's' || ev.key === 'S') { plane.tup = newval; }
    if (ev.key === 'w' || ev.key === 'W') { plane.tdown = newval; }
    
    if (ev.key === 'a' || ev.key === 'A') { plane.tLyaw = newval; }
    if (ev.key === 'd' || ev.key === 'D') { plane.tRyaw = newval; }
    
    if (ev.key === 'ArrowLeft')  { plane.tLroll = newval; }
    if (ev.key === 'ArrowRight') { plane.tRroll = newval; }
};




let plane_controls = {
    control : control,
    move    : move,
    tick    : tick
};
export { plane_controls };
 
