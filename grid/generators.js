
let diamond_square = function (grid)
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
                
                let a = grid.verts[(y*(grid.N+1) + x)*2];
                let b = grid.verts[((y+i)*(grid.N+1) + x)*2];
                let c = grid.verts[(y*(grid.N+1) + (x+i))*2];
                let d = grid.verts[((y+i)*(grid.N+1) + (x+i))*2];
                let r = (Math.random()-0.5) * i * 0.6;
                
                grid.verts[((y+ip2) * (grid.N+1) + (x+ip2))*2] = (a + b + c + d) / 4.0 + r;
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
                    a = grid.verts[(y*(grid.N+1) + (x-ip2))*2];
                }
                else { p -= 1.0; }
                
                let b = 0.0;
                if (x+ip2 <= grid.N)
                {
                    b = grid.verts[(y*(grid.N+1) + (x+ip2))*2];
                }
                else { p -= 1.0; }
                
                let c = 0.0;
                if (y-ip2 >= 0)
                {
                    c = grid.verts[((y-ip2)*(grid.N+1) + x)*2];
                }
                else { p -= 1.0; }
                
                let d = 0.0;
                if (y+ip2 < grid.N)
                {
                    d = grid.verts[((y+ip2)*(grid.N+1) + x)*2];
                }
                else { p -= 1.0; }
                
                let r = (Math.random()-0.5) * ip2 * 0.6;
                
                grid.verts[(y*(grid.N+1) + x)*2] = (a + b + c + d) / p + r;
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
    diamond_square: diamond_square
};

export { generators };
