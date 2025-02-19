
import { m4, v3, quat, tr } from "./matvec.js";



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
        add_f( [look[0]*plane.force,  look[1]*plane.force,  look[2]*plane.force] );
    }
    if (plane.backw) {
        add_f( [look[0]*-plane.force, look[1]*-plane.force, look[2]*-plane.force] );
    }
    if (plane.up) {
        add_f(   [up[0]*plane.force,    up[1]*plane.force,    up[2]*plane.force] );
    }
    if (plane.down) {
        add_f(   [up[0]*-plane.force,   up[1]*-plane.force,   up[2]*-plane.force] );
    }
    if (plane.left) {
        add_f([right[0]*-plane.force,right[1]*-plane.force,right[2]*-plane.force]);
    }
    if (plane.right) {
        add_f([right[0]*plane.force, right[1]*plane.force, right[2]*plane.force]);
    }
    
    let len = v3.length(plane.velocity);
    if (len < 0.0001)
    {
        plane.velocity = [0,0,0];
    }
    else if (plane.slow)
    {
        plane.velocity = v3.setlength(plane.velocity, len*0.9);
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
    if (ev.key === 'w' || ev.key === 'W') { plane.forw  = newval; }
    if (ev.key === 's' || ev.key === 'S') { plane.backw = newval; }
    
    if (ev.key === 'a' || ev.key === 'A') { plane.left  = newval; }
    if (ev.key === 'd' || ev.key === 'D') { plane.right = newval; }
    
    if (ev.key === 'q' || ev.key === 'Q') { plane.up   = newval; }
    if (ev.key === 'e' || ev.key === 'E') { plane.down = newval; }
    
    if (ev.key === ' ') { plane.slow = newval; }
};




let plane_controls = {
    control : control,
    move    : move,
    tick    : tick
};
export { plane_controls };
 
