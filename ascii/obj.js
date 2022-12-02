
var vind = function (str)
{
    var i = str.indexOf('/');
    return str.substring(0, (i != -1) ? i : str.length);
};

var create = function (obj_str)
{
    //var eol = /\r\n|\n\r|\r/g;
    var lines = obj_str.replace('\r','\n').split('\n');
    
    var v = [];
    var f = [];
    var l = [];
    
    for (var i in lines)
    {
        var tokens = lines[i].split(' ').map(s => s.trim()).filter(x => x && x.length && x.length > 0);
        
        if (tokens.length < 1) continue;
        
        if (tokens[0] === 'v' || tokens[0] === 'V')
        {
            v.push(parseFloat(tokens[1]),
                   parseFloat(tokens[2]),
                   parseFloat(tokens[3]));
        }
        else if (tokens[0] === 'f' || tokens[0] === 'F')
        {
            if (tokens.length < 4) { console.log("ERROR: OBJ file face with two or less indices"); continue; }
            
            for (var end = 3 ; end < tokens.length ; ++end)
            {
                f.push(parseInt(vind(tokens[1]))     - 1,
                       parseInt(vind(tokens[end-1])) - 1,
                       parseInt(vind(tokens[end]))   - 1);
            }
        }
        else if (tokens[0] === 'l' || tokens[0] === 'L')
        {
            l.push(parseInt(vind(tokens[1])) - 1,
                   parseInt(vind(tokens[2])) - 1);
        }
    }
    
    return {
        verts: v,
        faces: f,
        lines: l
    };
};

var obj = { create };

export { obj };

