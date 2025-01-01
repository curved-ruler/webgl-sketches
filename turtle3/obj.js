
let create = function (obj_str, scale, y_up, col)
{
    //let eol = /\r\n|\n\r|\r/g;
    let lines = obj_str.replace('\r','\n').split('\n');
    
    let v  = [];
    let l  = [];
    
    for (let i in lines)
    {
        let tokens = lines[i].split(' ').map(s => s.trim()).filter(x => x && x.length && x.length > 0);
        
        if (tokens.length < 3) continue;
        
        if (tokens[0] === 'v' || tokens[0] === 'V')
        {
            if (!y_up)
            {
                v.push([parseFloat(tokens[1]) * scale,
                        parseFloat(tokens[2]) * scale,
                        parseFloat(tokens[3]) * scale]);
            }
            else
            {
                v.push([parseFloat(tokens[1]) * scale,
                        parseFloat(tokens[3]) * scale,
                        parseFloat(tokens[2]) * scale]);
            }
        }
        else if (tokens[0] === 'l' || tokens[0] === 'L')
        {
            let v0 = parseInt( tokens[1] );
            let vv = (v0 < 0) ? v.length + v0 : v0-1;
            l.push(v[vv][0], v[vv][1], v[vv][2]);
            l.push(col[0], col[1], col[2]);
                
            v0 = parseInt( tokens[2] );
            vv = (v0 < 0) ? v.length + v0 : v0-1;
            l.push(v[vv][0], v[vv][1], v[vv][2]);
            l.push(col[0], col[1], col[2]);
        }
    }
    
    return l;
};

let obj = { create };

export { obj };

