
let vind = function (str)
{
    let t = str.split('/');
    return t;
};

let create = function (obj_str, scale, y_up, col)
{
    //let eol = /\r\n|\n\r|\r/g;
    let lines = obj_str.replace('\r','\n').split('\n');
    
    let v  = [];
    let vn = [];
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
                v.push([parseFloat(tokens[1]) * scale,
                        parseFloat(tokens[3]) * scale,
                        parseFloat(tokens[2]) * scale]);
            }
        }
        else if (tokens[0] === 'vn' || tokens[0] === 'VN')
        {
            vn.push([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])]);
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
                    
                    f.push(col[0], col[1], col[2]);
                
                    //v0 = parseInt( v_vt_vn[2] );
                    //vv = (v0 < 0) ? v.length + v0 : v0-1;
                    //f.push(vn[vv][0], vn[vv][1], vn[vv][2]);
                
                v_vt_vn = vind(tokens[end-1]);
                
                    v0 = parseInt( v_vt_vn[0] );
                    vv = (v0 < 0) ? v.length + v0 : v0-1;
                    f.push(v[vv][0], v[vv][1], v[vv][2]);
                    
                    f.push(col[0], col[1], col[2]);
                
                    //v0 = parseInt( v_vt_vn[2] );
                    //vv = (v0 < 0) ? v.length + v0 : v0-1;
                    //f.push(vn[vv][0], vn[vv][1], vn[vv][2]);
                
                v_vt_vn = vind(tokens[end]);
                
                    v0 = parseInt( v_vt_vn[0] );
                    vv = (v0 < 0) ? v.length + v0 : v0-1;
                    f.push(v[vv][0], v[vv][1], v[vv][2]);
                    
                    f.push(col[0], col[1], col[2]);
                
                    //v0 = parseInt( v_vt_vn[2] );
                    //vv = (v0 < 0) ? v.length + v0 : v0-1;
                    //f.push(vn[vv][0], vn[vv][1], vn[vv][2]);
            }
        }
        else if (tokens[0] === 'l' || tokens[0] === 'L')
        {
            let v0 = parseInt( tokens[1] );
            let vv = (v0 < 0) ? v.length + v0 : v0-1;
            l.push(v[vv][0], v[vv][1], v[vv][2]);
            l.push(0, 0, 0);
            //l.push(col[0], col[1], col[2]);
            
            v0 = parseInt( tokens[2] );
            vv = (v0 < 0) ? v.length + v0 : v0-1;
            l.push(v[vv][0], v[vv][1], v[vv][2]);
            l.push(0, 0, 0);
            //l.push(col[0], col[1], col[2]);
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

