
import { m4, v3, quat, tr } from "./matvec.js";

let level = function (grid, L, cliff)
{
    for (let y=0 ; y<=grid.N ; y+=1)
    {
        for (let x=0 ; x<=grid.N ; x+=1)
        {
            if (grid.H[y*(grid.N+1) + x] < L[0]) { grid.H[y*(grid.N+1) + x]=L[0]; }
        }
    }
    
    for (let i=1 ; i<L.length-1 ; i+=2)
    {
        for (let y=0 ; y<=grid.N ; y+=1)
        for (let x=0 ; x<=grid.N ; x+=1)
        {
            if (grid.H[y*(grid.N+1) + x] < L[i+1] && grid.H[y*(grid.N+1) + x] > L[i])
            {
                grid.H[y*(grid.N+1) + x]=L[i];
            }
            else if (!cliff && grid.H[y*(grid.N+1) + x] > L[i+1])
            {
                grid.H[y*(grid.N+1) + x] -= L[i+1]-L[i];
            }
        }
    }
};

let diamond_square = function (grid, weight)
{
    let i = grid.N;
    
    while (i >= 2)
    //while (i >= 4)
    {
        let ip2 = Math.floor(i/2);
        
        // diamond
        for (let y=0 ; y+i <= grid.N ; y+=i)
        {
            //if (y+i >= hh) { std::cerr << "DS: Index out of bounds in Y" << std::endl; break; }
            
            for (let x=0 ; x+i <= grid.N ; x+=i)
            {
                //if (x+i >= hh) { std::cerr << "DS: Index out of bounds in X" << std::endl; break; }
                
                let a = grid.H[ y   *(grid.N+1) +  x];
                let b = grid.H[(y+i)*(grid.N+1) +  x];
                let c = grid.H[ y   *(grid.N+1) + (x+i)];
                let d = grid.H[(y+i)*(grid.N+1) + (x+i)];
                let r = (Math.random()-0.5) * i * weight;
                
                grid.H[(y+ip2) * (grid.N+1) + (x+ip2)] = (a + b + c + d) / 4.0 + r;
                //hmap[(y+ip2) * hw + (x+ip2)] = (a+b+c+d+d)/4.0f;
                /*
                float rnd = dice.next();
                float hhh = rnd < -0.5f ? a :
                            rnd <  0.0f ? b :
                            rnd <  0.5f ? c : d;
                //hmap[(y+ip2) * hw + (x+ip2)] = hhh + r;
                hmap[(y+ip2) * hw + (x+ip2)] = hhh;
                */
            }
        }
        
        // square
        let alt = 0;
        for (let y = ip2 ; y < grid.N ; y+=ip2)
        {
            //if (y == hh-1) continue;
            
            for (let x=(alt % 2 == 1) ? ip2 : i ; x < grid.N ; x+=i)
            {
                //if (x == hw-1) continue;
                
                let p = 4.0;
                
                let a = 0.0;
                if (x-ip2 >= 0)
                {
                    a = grid.H[y*(grid.N+1) + (x-ip2)];
                }
                else { p -= 1.0; }
                
                let b = 0.0;
                if (x+ip2 <= grid.N)
                {
                    b = grid.H[y*(grid.N+1) + (x+ip2)];
                }
                else { p -= 1.0; }
                
                let c = 0.0;
                if (y-ip2 >= 0)
                {
                    c = grid.H[(y-ip2)*(grid.N+1) + x];
                }
                else { p -= 1.0; }
                
                let d = 0.0;
                if (y+ip2 < grid.N)
                {
                    d = grid.H[(y+ip2)*(grid.N+1) + x];
                }
                else { p -= 1.0; }
                
                let r = (Math.random()-0.5) * ip2 * weight;
                
                grid.H[y*(grid.N+1) + x] = (a + b + c + d) / p + r;
                //hmap[y*hw + x] = (a+b+c+d+d)/(p);
                /*
                float rnd = dice.next();
                float hhh = rnd < -0.5f ? a :
                            rnd <  0.0f ? b :
                            rnd <  0.5f ? c : d;
                //hmap[y*hw + x] = hhh + r;
                hmap[y*hw + x] = hhh;
                */
            }
            ++alt;
        }
        
        // step
        i = ip2;
    }
};

let kernel_init = function (grid, n)
{
    for (let y=0 ; y<=grid.N ; y+=1)
    for (let x=0 ; x<=grid.N ; x+=1)
    {
        let i = Math.floor(Math.random()*5000);
        grid.H[y*(grid.N+1) + x] = i%n === 0 ? 3 : 0;
    }
};
let kernel = function (grid, base, min, max)
{
    let grid_c = structuredClone(grid.H);
    let n = grid.N;
    
    for (let y=0 ; y<=grid.N ; y+=1)
    for (let x=0 ; x<=grid.N ; x+=1)
    {
        let a = (x>0 && y>0) ? grid_c[(y-1)*(n+1) + x-1] : 0;
        let b = (y>0)        ? grid_c[(y-1)*(n+1) + x]   : 0;
        let c = (x<n && y>0) ? grid_c[(y-1)*(n+1) + x+1] : 0;
        
        let d = (x>0)        ? grid_c[(y)  *(n+1) + x-1] : 0;
        let X =                grid_c[(y)  *(n+1) + x];
        let e = (x<n)        ? grid_c[(y)  *(n+1) + x+1] : 0;
        
        let f = (x>0 && y<n) ? grid_c[(y+1)*(n+1) + x-1] : 0;
        let g = (y<n)        ? grid_c[(y+1)*(n+1) + x]   : 0;
        let h = (x<n && y<n) ? grid_c[(y+1)*(n+1) + x+1] : 0;
        
        let s = base(X, a, b, c, d, e, f, g, h);
        if (s > max) s = max;
        if (s < min) s = min;
        grid.H[y*(grid.N+1) + x] = s;
    }
};


let noise = function (grid, oct, amp, lam, base)
{
    for (let y=0 ; y<=grid.N ; y+=1)
    for (let x=0 ; x<=grid.N ; x+=1)
    {
        let o = 1.0;
        let f = 0.0;
        for (let i=0 ; i<oct ; ++i)
        {
            f   += (amp*o) * base( (x*lam/o),
                                   (y*lam/o) );
            o /= 2.0;
        }
        grid.H[y*(grid.N+1) + x] += f;
    }
};

let is_in = function (x, y, n)
{
    return (x >= 0 && y >= 0 && x <= n && y <= n);
};
let add_s = function (grid,ix,iy,s, kernel,k)
{
    for (let y=-k ; y<=k ; ++y)
    for (let x=-k ; x<=k ; ++x)
    {
        if ( is_in(ix+x, iy+y, grid.N) )
        {
            grid.H[(iy+y)*(grid.N+1)+(ix+x)] += s * kernel[(y+k)*(2*k+1)+(x+k)];
        }
    }
};
let erosion = function (grid, geth, params)
{
    let pos = [2 + Math.random()*(grid.N-4),
               2 + Math.random()*(grid.N-4)];
    //let pos = [grid.N / 2, grid.N / 2];
    
    let h0 = geth(grid, pos);
    let h1 = h0;
    params.debug_pts.push(pos[0], pos[1], h0,  1,0,0,  1,0,0 );
    
    let ix  = Math.floor(pos[0]);
    let iy  = Math.floor(pos[1]);
    let ip  = 0;
    let stay = 0;
    let dir = [0,0];
    let vel = 0;
    let sediment = 0;
    //while (is_in(ix,iy,grid.N) && ip < params.maxmove && stay < 2)
    while (is_in(pos[0],pos[1],grid.N) && ip < params.maxmove)
    {
        let va = [pos[0],pos[1],h0];
        let u = pos[0] - ix;
        let v = pos[1] - iy;
        let ha = grid.H[iy*(grid.N+1)+ix];
        let hb = grid.H[iy*(grid.N+1)+ix+1];
        let hc = grid.H[(iy+1)*(grid.N+1)+ix];
        let hd = grid.H[(iy+1)*(grid.N+1)+ix+1];
        let grad = [v*(hd-hc) + (1-v)*(hb-ha),
                    u*(hd-hb) + (1-u)*(hc-ha)];
        
        dir[0] = dir[0]*params.inertia - grad[0]*(1-params.inertia);
        dir[1] = dir[1]*params.inertia - grad[1]*(1-params.inertia);
        pos[0] += dir[0];
        pos[1] += dir[1];
        h1 = geth(grid, pos);
        let vb = [pos[0],pos[1],h1];
        vel = v3.length(v3.sub(va,vb));
        
        let ix2 = Math.floor(pos[0]);
        let iy2 = Math.floor(pos[1]);
        if (!is_in(pos[0],pos[1],grid.N)) { return; }
        
        /*
        if (ix2 == ix && iy2 == iy)
        {
            stay += 1;
            h0 = h1;
            ip += 1;
            continue;
        }
        */
        stay = 0;
        
        let hdif = h1-h0;
        
        if (hdif > 0)
        {
            let s = Math.min(hdif,sediment);
            //grid.H[iy*(grid.N+1)+ix] += s;
            //add_s(grid,ix,iy,s, params.kernel,params.kk);
            sediment -= s;
        }
        else // hdif < 0
        {
            //let c = Math.max(vel, 0.1)*params.capacity*((params.maxmove-ip)/params.maxmove);
            let c = -hdif*params.capacity;
            if (sediment < c)
            {
                let s = Math.min((c-sediment), -hdif);
                //grid.H[iy*(grid.N+1)+ix] -= s;
                add_s(grid,ix,iy, -s, params.kernel,params.kk);
                sediment += s;
            }
            else
            {
                let s = Math.min((sediment-c), -hdif);
                //grid.H[iy*(grid.N+1)+ix] += s;
                add_s(grid,ix,iy, s, params.kernel,params.kk);
                sediment -= s;
            }
        }
        
        ix = ix2;
        iy = iy2;
        h0 = h1;
        ip += 1;
        
        params.debug_pts.push(pos[0], pos[1], h1,  1,0,0,  1,0,0);
    }
};

let generators = {
    diamond_square,
    kernel_init,
    kernel,
    level,
    noise,
    erosion
};

export { generators };
