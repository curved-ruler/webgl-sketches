
let level = function (grid, L)
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

let generators = {
    diamond_square,
    level
};

export { generators };
