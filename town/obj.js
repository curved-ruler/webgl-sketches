
let vind = function (str)
{
    let t = str.split('/');
    return t;
};

let create = function (obj_str, scale, y_up)
{
    //let eol = /\r\n|\n\r|\r/g;
    let lines = obj_str.replace('\r','\n').split('\n');
    
    let v  = [];
    let vt = [];
    let f  = [];
    let l  = [];
    
    for (let i in lines)
    {
        let tokens = lines[i].split(' ').map(s => s.trim()).filter(x => x && x.length && x.length > 0);
        
        if (tokens.length < 1) continue;
        
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
                v.push([parseFloat(tokens[3]) * scale,
                        parseFloat(tokens[1]) * scale,
                        parseFloat(tokens[2]) * scale]);
            }
        }
        else if (tokens[0] === 'vt' || tokens[0] === 'VT')
        {
            vt.push([parseFloat(tokens[1]),
                     parseFloat(tokens[2])]);
        }
        else if (tokens[0] === 'f' || tokens[0] === 'F')
        {
            if (tokens.length < 4) { console.log("ERROR: OBJ file face with two or less indices"); continue; }
            
            for (let end = 3 ; end < tokens.length ; ++end)
            {
                let v_vt_vn = vind(tokens[1]);
                    let v0 = parseInt( v_vt_vn[0] );
                    let vv = (v0 < 0) ? v.length + v0 : v0-1;
                    f.push(v[vv][0], v[vv][1], v[vv][2]);
                    l.push(v[vv][0], v[vv][1], v[vv][2]);
                
                    v0 = parseInt( v_vt_vn[1] );
                    vv = (v0 < 0) ? v.length + v0 : v0-1;
                    f.push(vt[vv][0], 1-vt[vv][1]);
                    l.push(vt[vv][0], 1-vt[vv][1]);
                
                v_vt_vn = vind(tokens[end-1]);
                    v0 = parseInt( v_vt_vn[0] );
                    vv = (v0 < 0) ? v.length + v0 : v0-1;
                    f.push(v[vv][0], v[vv][1], v[vv][2]);
                    l.push(v[vv][0], v[vv][1], v[vv][2]);
                
                    v0 = parseInt( v_vt_vn[1] );
                    vv = (v0 < 0) ? v.length + v0 : v0-1;
                    f.push(vt[vv][0], 1-vt[vv][1]);
                    l.push(vt[vv][0], 1-vt[vv][1]);
                
                v_vt_vn = vind(tokens[end]);
                    v0 = parseInt( v_vt_vn[0] );
                    vv = (v0 < 0) ? v.length + v0 : v0-1;
                    f.push(v[vv][0], v[vv][1], v[vv][2]);
                
                    v0 = parseInt( v_vt_vn[1] );
                    vv = (v0 < 0) ? v.length + v0 : v0-1;
                    f.push(vt[vv][0], 1-vt[vv][1]);
            }
        }
        else if (tokens[0] === 'l' || tokens[0] === 'L')
        {
            l.push(parseInt(vind(tokens[1])) - 1,
                   parseInt(vind(tokens[2])) - 1);
        }
    }
    
    return {
        verts: [],
        tris:  f,
        lines: l
    };
};

let obj = { create };

export { obj };

