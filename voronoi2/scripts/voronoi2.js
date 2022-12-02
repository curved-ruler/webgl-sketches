
require(['glprogram',
         'shaders',
         'matrix4',
         'vector3',
         'transformations',
         'presets',
         'parameters'],
function (gl, shaders, m4, v3, tr, presets, parameters)
{
    var gl2d     = null;
    var gl3d     = null;
    var shader   = null;
    var shader3d = null;
    var canvas   = null;
    var canvas3d = null;
    
    var camera = {
        eye   : [0, 0, 3],
        look  : [0, 0, -1],
        up    : [0, 1, 0],
        near  : 0.01,
        median: 5,
        far   : 20,
        fovy  : Math.PI / 4,
        aspect: 1
    };
    
    var projectionMatrix, modelViewMatrix;
    var scale = 1;
    var rot1 = m4.init();
    var axis = 0;
    var rotation = 0;
    var rotdir = true;
    
    var mouse_down_3d;
    var grabbed = -1;
    var cwidth, cheight, cw3, ch3;
    
    var vertices = [
        -1.0, -1.0,
         1.0, -1.0,
         1.0,  1.0,
        
        -1.0, -1.0,
         1.0,  1.0,
        -1.0,  1.0
    ];
    
    var halo_dx = 7.0;
    var halo = [];
    var haloBuffer = null;
    var Lhalo = [];
    var LhaloBuffer = null;
    var vertexBuffer = null;
    
    var fillHalo = function ()
    {
        var i=0;
        var j=0;
        for (var y=0 ; y<=(cheight-halo_dx) ; y+=halo_dx)
        {
            i = 0;
            for (var x=0 ; x<=(cwidth-halo_dx) ; x+=halo_dx)
            {
                halo.push(i);   halo.push(j);   halo.push(0);
                halo.push(i);   halo.push(j+1); halo.push(1);
                halo.push(i+1); halo.push(j);   halo.push(2);
                halo.push(i+1); halo.push(j+1); halo.push(3);
                halo.push(i+1); halo.push(j);   halo.push(4);
                halo.push(i);   halo.push(j+1); halo.push(5);
                ++i;
            }
            ++j;
        }
        
        gl3d.bindBuffer(gl3d.ARRAY_BUFFER, haloBuffer);
        gl3d.bufferData(gl3d.ARRAY_BUFFER, new Float32Array(halo), gl3d.STATIC_DRAW);
        
        var i=0;
        var j=0;
        for (var y=0 ; y<=(cheight-halo_dx) ; y+=halo_dx)
        {
            i = 0;
            for (var x=0 ; x<=(cwidth-halo_dx) ; x+=halo_dx)
            {
                Lhalo.push(i);   Lhalo.push(j);   Lhalo.push(0);
                Lhalo.push(i);   Lhalo.push(j+1); Lhalo.push(1);
                Lhalo.push(i);   Lhalo.push(j+1); Lhalo.push(1);
                Lhalo.push(i+1); Lhalo.push(j+1); Lhalo.push(3);
                ++i;
            }
            ++j;
        }
        
        gl3d.bindBuffer(gl3d.ARRAY_BUFFER, LhaloBuffer);
        gl3d.bufferData(gl3d.ARRAY_BUFFER, new Float32Array(Lhalo), gl3d.STATIC_DRAW);
    };
    
    var newshaders = function ()
    {
        shader = gl.create_vf_program(
                    gl2d,
                    
                    shaders.version + shaders.vs2d,
                    
                    shaders.version +
                    shaders.precision +
                    parameters.fnorm +
                    shaders.compute.replace(/\{basen\}/g, parameters.bases.length/2) +
                    parameters.usefdata +
                    shaders.fs2d.replace(/\{basen\}/g, parameters.bases.length/2));
        
        shader.vertexPosition = gl2d.getAttribLocation(shader.glprog, "position");
        gl2d.enableVertexAttribArray(shader.vertexPosition);
        shader.basePosition     = gl2d.getUniformLocation(shader.glprog, "basedata");
        shader.markerPosition   = gl2d.getUniformLocation(shader.glprog, "marker");
        shader.scalePosition    = gl2d.getUniformLocation(shader.glprog, "canvas_scale_p2");
        
        shader3d = gl.create_vf_program(
                    gl3d,
                    
                    shaders.version +
                    parameters.fnorm +
                    shaders.compute.replace(/\{basen\}/g, parameters.bases.length/2) +
                    parameters.usefdata +
                    shaders.helpers.replace(/\{basen\}/g, parameters.bases.length/2) +
                    shaders.vs3d,
                    
                    shaders.version + shaders.precision + shaders.fs3d);
        
        shader3d.vertexPosition = gl3d.getAttribLocation(shader3d.glprog, "position");
        gl3d.enableVertexAttribArray(shader3d.vertexPosition);
        shader3d.basePos   = gl3d.getUniformLocation(shader3d.glprog, "basedata");
        shader3d.markerPos = gl3d.getUniformLocation(shader3d.glprog, "marker");
        shader3d.pvmPos    = gl3d.getUniformLocation(shader3d.glprog, "pvm");
        shader3d.projPos   = gl3d.getUniformLocation(shader3d.glprog, "proj");
        shader3d.dxPos     = gl3d.getUniformLocation(shader3d.glprog, "dx");
        shader3d.lightPos  = gl3d.getUniformLocation(shader3d.glprog, "light");
        shader3d.alphaPos  = gl3d.getUniformLocation(shader3d.glprog, "alpha");
        shader3d.scalePos  = gl3d.getUniformLocation(shader3d.glprog, "canvas_scale_p2");
        shader3d.aplhaPos = gl3d.getUniformLocation(shader3d.glprog, "alpha");
    };
    
    
    var getsize = function ()
    {
        if (!canvas || !canvas3d)
        {
            console.error("ERROR: no canvas");
            return;
        }
        cwidth  = canvas.width;
        cheight = canvas.height;
        cw3 = canvas3d.width;
        ch3 = canvas3d.height;
        gl2d.viewport(0, 0, canvas.width, canvas.height);
        gl3d.viewport(0, 0, canvas3d.width, canvas3d.height);
    };

    var computeMatrices = function ()
    {
        modelViewMatrix = tr.view(camera);
        modelViewMatrix = m4.mul(tr.roty(axis), modelViewMatrix);
        modelViewMatrix = m4.mul(tr.rotx(rotation), modelViewMatrix);
        modelViewMatrix = m4.mul(rot1, modelViewMatrix);
        modelViewMatrix = m4.mul(tr.scale(scale), modelViewMatrix);
        //modelViewMatrix = m4.mul(tr.translate([-1, -1, -1]), modelViewMatrix);
        projectionMatrix = tr.persp(camera);
    };
    
    var draw = function ()
    {
        if (!shader) return;
        
        gl2d.useProgram(shader.glprog);
    
        gl2d.disable(gl2d.DEPTH_TEST);
        gl2d.disable(gl2d.BLEND);
    
        gl2d.clearColor(0.3, 0.3, 0.3, 1.0);
        gl2d.clear(gl2d.COLOR_BUFFER_BIT);
        
        //gl2d.bindBuffer(gl2d.ARRAY_BUFFER, model.vertexBuffer);
        gl2d.vertexAttribPointer(shader.vertexPosition, 2, gl2d.FLOAT, false, 0, 0);
        gl2d.uniform1f(shader.markerPosition, 3);
        gl2d.uniform1f(shader.scalePosition, cwidth/2);
        gl2d.uniform1fv(shader.basePosition, new Float32Array(parameters.basedata));
        
        //if (shader.aspect)
        //{
        //    gl2d.uniform1f(shader.aspect, camera.aspect);
        //}
        
        
        gl2d.drawArrays(gl2d.TRIANGLES, 0, 6);
    };
    
    var draw3d = function ()
    {
        if (!gl3d || halo.length < 1) return;
        
        gl3d.useProgram(shader3d.glprog);
    
        if (parameters.alpha < 0.999)
        {
            gl3d.disable(gl3d.DEPTH_TEST);
            gl3d.enable (gl3d.BLEND);
        }
        else
        {
            gl3d.enable (gl3d.DEPTH_TEST);
            gl3d.disable(gl3d.BLEND);
        }
        gl3d.blendFunc(gl3d.SRC_ALPHA, gl3d.ONE_MINUS_SRC_ALPHA);
    
        gl3d.clearColor(parameters.bcg[parameters.i_bcg*3],
                        parameters.bcg[parameters.i_bcg*3+1],
                        parameters.bcg[parameters.i_bcg*3+2],
                        1.0);
        gl3d.clear(gl3d.COLOR_BUFFER_BIT | gl3d.DEPTH_BUFFER_BIT);
        
        if (parameters.obj3d === 0) gl3d.bindBuffer(gl3d.ARRAY_BUFFER, haloBuffer);
        else                        gl3d.bindBuffer(gl3d.ARRAY_BUFFER, LhaloBuffer);
        
        gl3d.vertexAttribPointer(shader3d.vertexPosition, 3, gl3d.FLOAT, false, 0, 0);
        gl3d.uniform1f(shader3d.markerPos, 9);
        gl3d.uniform1fv(shader3d.basePos, new Float32Array(parameters.basedata));
        gl3d.uniform1f(shader3d.dxPos, halo_dx);
        gl3d.uniform1f(shader3d.scalePos, cwidth/2);
        gl3d.uniform3fv(shader3d.lightPos, [5,5,5]);
        
        gl3d.uniform1f(shader3d.alphaPos, parameters.alpha);
        
        computeMatrices();
        
        if (parameters.cam3d === 0)
        {
            gl3d.uniform1i(shader3d.projPos, 0);
            gl3d.uniformMatrix4fv(shader3d.pvmPos, false, m4.mul(modelViewMatrix, projectionMatrix));
        }
        else
        {
            gl3d.uniform1i(shader3d.projPos, 1);
            gl3d.uniformMatrix4fv(shader3d.pvmPos, false, modelViewMatrix);
        }
        
        if (parameters.obj3d === 0) gl3d.drawArrays(gl3d.TRIANGLES, 0, halo.length/3);
        else                        gl3d.drawArrays(gl3d.LINES,    0, Lhalo.length/3);
    };
    
    var grab_base = function (x, y, eps)
    {
        //grabbed = -1;
        for (var i=0 ; i<(parameters.bases.length/2) ; ++i)
        {
            if (Math.abs(parameters.bases[2*i] - x) < eps && Math.abs(parameters.bases[2*i+1] - y) < eps)
            {
                grabbed = i;
            }
        }
    };

    var event_scale = function (event)
    {
        var rect = canvas.getBoundingClientRect();
        var cw2 = cwidth/2;
        
        return {
            x: (           event.clientX - rect.left  - cw2) / cw2,
            y: (cheight - (event.clientY - rect.top)  - cw2) / cw2,
            movx :  event.movementX / cw2,
            movy : -event.movementY / cw2
        };
    };
    
    var handleMouseDown = function (event)
    {
        var m = event_scale(event);
        
        if (parameters.anim === 1)
        {
            var pixdiff = 10;
            grab_base( m.x, m.y, 2 / (cwidth / pixdiff) );
            var found = false;
            for (i = 0 ; i<parameters.animdata.length ; ++i)
            {
                if (parameters.animdata[i].id === grabbed)
                {
                    parameters.animdata.splice(i,1);
                    found = true;
                    break;
                }
            }
            if (!found)
            {
                var adi = {
                    id   : grabbed,
                    t    : 0,
                    tmax : Math.floor(Math.random() * (parameters.t1-parameters.t0) + parameters.t0),
                    gorb : [parameters.bases[2*grabbed], parameters.bases[2*grabbed+1],
                            Math.random()*1.6-0.8, Math.random()*1.6-0.8,
                            Math.random()*1.6-0.8, Math.random()*1.6-0.8,
                            Math.random()*1.6-0.8, Math.random()*1.6-0.8]
                };
                parameters.animdata.push(adi);
            }
            return;
        }
        
        if (parameters.addpoint === 0)
        {
            parameters.bases.push(m.x);
            parameters.bases.push(m.y);
            createBaseData();
            newshaders();
            draw();
            draw3d();
        }
        else if (parameters.addpoint === 1)
        {
            var pixdiff = 6;
            grab_base( m.x, m.y, 2 / (cwidth / pixdiff) );
        }
        else
        {
            var pixdiff = 6;
            grab_base( m.x, m.y, 2 / (cwidth / pixdiff) );
            if (grabbed > -1)
            {
                parameters.bases.splice(grabbed*2, 2);
                var dc = parameters.colours.splice(grabbed*3, 3);
                parameters.colours.push(dc[0]);
                parameters.colours.push(dc[1]);
                parameters.colours.push(dc[2]);
                createBaseData();
                newshaders();
                draw();
                draw3d();
            }
        }
    };

    var handleMouseUp = function (event)
    {
        grabbed = -1;
    };

    var handleMouseMove = function (event)
    {
        if (grabbed < 0)
        {
            return;
        }
        var m = event_scale(event);
        parameters.bases[grabbed*2]      += m.movx;
        parameters.bases[grabbed*2+1]    += m.movy;
        parameters.basedata[grabbed*5]   += m.movx;
        parameters.basedata[grabbed*5+1] += m.movy;
        draw();
        draw3d();
    };
    
    var handleMouseDown3d = function (event)
    {
        mouse_down_3d = true;
        
        if ((axis > 90) && (axis < 270))
        {
            rotdir = false;
        }
        else
        {
            rotdir = true;
        }
    };

    var handleMouseUp3d = function (event)
    {
        mouse_down_3d = false;
    };

    var handleMouseMove3d = function (event)
    {
        if (!mouse_down_3d)
        {
            return;
        }
        
        axis += event.movementX*0.25;
        if (rotdir) {
            rotation += event.movementY*0.25;
        } else {
            rotation -= event.movementY*0.25;
        }
        // Ensure [0,360]
        axis = axis - Math.floor(axis/360.0)*360.0;
        rotation = rotation - Math.floor(rotation/360.0)*360.0;
        
        draw3d();
    };
    
    var read_codes = function ()
    {
        var nta = document.getElementById("fnorm_area");
        parameters.fnorm = nta.value;
        
        var fta = document.getElementById("f123_area");
        parameters.usefdata = fta.value;
        
        newshaders();
        draw();
        draw3d();
    };
    
    var toggle_input = function ()
    {
        ++parameters.addpoint;
        if (parameters.addpoint > 2) parameters.addpoint = 0;
        
        var ret = document.getElementById("base_input");
        if (parameters.addpoint === 0)
        {
            ret.innerHTML = "ADD";
        }
        else if (parameters.addpoint === 1)
        {
            ret.innerHTML = "MOV";
        }
        else
        {
            ret.innerHTML = "DEL";
        }
    };
    
    var toggle_bck = function ()
    {
        ++(parameters.i_bcg);
        if (parameters.i_bcg >= parameters.bcg.length/3) parameters.i_bcg = 0;
        draw3d();
    };
    
    var clear_bases = function ()
    {
        //parameters.bases = [cwidth/2, cheight/2];
        //document.getElementById('presets').value = 0;
        parameters.bases = [];
        createBaseData();
        newshaders();
        
        parameters.addpoint = 0;
        document.getElementById("base_input").innerHTML = "ADD";
        
        draw();
        draw3d();
    };
    
    var createBaseData = function ()
    {
        parameters.basedata = [];
        for (var i=0 ; i<(parameters.bases.length / 2) ; ++i)
        {
            parameters.basedata.push(parameters.bases[i*2]);
            parameters.basedata.push(parameters.bases[i*2 + 1]);
            
            var j = i % (parameters.colours.length / 3);
            parameters.basedata.push(parameters.colours[j*3]);
            parameters.basedata.push(parameters.colours[j*3 + 1]);
            parameters.basedata.push(parameters.colours[j*3 + 2]);
        }
    };
    
    var zoomin  = function () { scale *= 1.25; draw3d(); };
    var zoomout = function () { scale *= 0.8;  draw3d(); };
    
    var preset_base = function (strval)
    {
        if (strval.substring(0,3) === 'rrr')
        {
            var s = Number(strval.substring(3));
            var a = (s % 2 === 0) ? 90-(180/s) : 90;
            var e = 6 - Math.floor((s-3)/2);
            //var e = 7+3-s;
            parameters.bases = presets.base_poly(parameters.noise, s, 0.8, e, a);
        }
        else if (strval === '0')
        {
            parameters.bases = [];
        }
        else if (strval === 'cross')
        {
            parameters.bases = presets.base_cross(parameters.noise);
        }
        else if (strval === 'spiral')
        {
            parameters.bases = presets.base_spiral(parameters.noise);
        }
        else if (strval === 'sin')
        {
            parameters.bases = presets.base_sin(parameters.noise);
        }
        
        if (parameters.anim === 1) { toggle_anim(); }
        
        createBaseData();
        newshaders();
        draw();
        draw3d();
    };
    
    var set_colscheme = function (strval)
    {
        switch (strval)
        {
            case 'y' :
                parameters.colours = presets.col_yellow(100);
                break;
            case 'cy' :
                parameters.colours = presets.col_cyan_yellow(100);
                break;
            case 'rnd' :
                parameters.colours = presets.col_rnd(100);
                break;
                
            default:
                console.error("Colscheme");
                return;
        }
        createBaseData();
        draw();
        draw3d();
    };
    
    var set_noise = function (strval)
    {
        parameters.noise = Number(strval);
    };
    
    var set_dist = function (strval)
    {
        if (strval.substring(0,2) === 'pp')
        {
            parameters.fnorm = presets.dist_p(strval.substring(2));
            document.getElementById("fnorm_area").value = parameters.fnorm;
        }
        else if (strval === 'pinf')
        {
            parameters.fnorm = presets.dist_pinf;
            document.getElementById("fnorm_area").value = parameters.fnorm;
        }
        else if (strval === 'sin01')
        {
            parameters.fnorm = presets.dist_sin_01;
            document.getElementById("fnorm_area").value = parameters.fnorm;
        }
        read_codes();
    };
    
    var set_computef = function (strval)
    {
        switch (strval)
        {
            case '0' :
                parameters.usefdata = presets.f123_0;
                document.getElementById("f123_area").value = parameters.usefdata;
                break;
            case '1' :
                parameters.usefdata = presets.f123_1;
                document.getElementById("f123_area").value = parameters.usefdata;
                break;
            case '2' :
                parameters.usefdata = presets.f123_2;
                document.getElementById("f123_area").value = parameters.usefdata;
                break;
            case '3' :
                parameters.usefdata = presets.f123_clamp;
                document.getElementById("f123_area").value = parameters.usefdata;
                break;
            case '4' :
                parameters.usefdata = presets.f123_abs;
                document.getElementById("f123_area").value = parameters.usefdata;
                break;
                
            default :
                console.error("Computef");
                return;
        }
        read_codes();
    };
    
    var set_3d = function (strval)
    {
        var aa = 0.4;
        switch (strval)
        {
            case 'mt' :
                parameters.obj3d = 0;
                parameters.cam3d = 0;
                parameters.alpha = 1;
                break;
            case 'mta' :
                parameters.obj3d = 0;
                parameters.cam3d = 0;
                parameters.alpha = aa;
                break;
            case 'ml' :
                parameters.obj3d = 1;
                parameters.cam3d = 0;
                parameters.alpha = 1;
                break;
            case 'mla' :
                parameters.obj3d = 1;
                parameters.cam3d = 0;
                parameters.alpha = aa;
                break;
            case '6t' :
                parameters.obj3d = 0;
                parameters.cam3d = 1;
                parameters.alpha = 1;
                break;
            case '6ta' :
                parameters.obj3d = 0;
                parameters.cam3d = 1;
                parameters.alpha = aa;
                break;
            case '6l' :
                parameters.obj3d = 1;
                parameters.cam3d = 1;
                parameters.alpha = 1;
                break;
            case '6la' :
                parameters.obj3d = 1;
                parameters.cam3d = 1;
                parameters.alpha = aa;
                break;
                
            default :
                console.error("3D");
                return;
        }
        draw3d();
    };
    
    var anim_step = function ()
    {
        for (var i = 0 ; i<parameters.animdata.length ; ++i)
        {
            var act = parameters.animdata[i];
            var tt = act.t / act.tmax;
            
            // cubic Bezier
            var p3x = 2*act.gorb[4] - act.gorb[6];
            var p3y = 2*act.gorb[5] - act.gorb[7];
            var cx = (1-tt)*(1-tt)*(1-tt)*act.gorb[0] + 3*tt*(1-tt)*(1-tt)*act.gorb[2] + 3*tt*tt*(1-tt)*p3x + tt*tt*tt*act.gorb[4];
            var cy = (1-tt)*(1-tt)*(1-tt)*act.gorb[1] + 3*tt*(1-tt)*(1-tt)*act.gorb[3] + 3*tt*tt*(1-tt)*p3y + tt*tt*tt*act.gorb[5];
            
            parameters.bases[parameters.animdata[i].id*2]      = cx;
            parameters.bases[parameters.animdata[i].id*2+1]    = cy;
            parameters.basedata[parameters.animdata[i].id*5]   = cx;
            parameters.basedata[parameters.animdata[i].id*5+1] = cy;
            
            ++(parameters.animdata[i].t);
            
            if (parameters.animdata[i].t > act.tmax)
            {
                parameters.animdata[i].t    = 0;
                parameters.animdata[i].tmax = Math.floor(Math.random() * (parameters.t1-parameters.t0) + parameters.t0);
                parameters.animdata[i].gorb[0] = parameters.animdata[i].gorb[4];
                parameters.animdata[i].gorb[1] = parameters.animdata[i].gorb[5];
                parameters.animdata[i].gorb[2] = parameters.animdata[i].gorb[6];
                parameters.animdata[i].gorb[3] = parameters.animdata[i].gorb[7];
                
                parameters.animdata[i].gorb[4] = Math.random()*1.6-0.8;
                parameters.animdata[i].gorb[5] = Math.random()*1.6-0.8;
                parameters.animdata[i].gorb[6] = Math.random()*1.6-0.8;
                parameters.animdata[i].gorb[7] = Math.random()*1.6-0.8;
            }
        }
        draw();
        draw3d();
    };
    
    var toggle_anim = function ()
    {
        if (parameters.anim === 0)
        {
            parameters.anim = 1;
            document.getElementById('animbut').innerHTML = 'Stop';
            //parameters.animt    = 0;
            parameters.animdata = [];
            parameters.animID = window.setInterval(anim_step, 33);
        }
        else
        {
            window.clearInterval(parameters.animID);
            document.getElementById('animbut').innerHTML = 'Animate';
            parameters.anim = 0;
        }
    };
    
    var init = function ()
    {
        canvas   = document.getElementById('canvas');
        canvas3d = document.getElementById('canvas3d');
        gl2d     = gl.get_context_2('canvas');
        gl3d     = gl.get_context_2('canvas3d');
        
        parameters.fnorm    = shaders.def_norm;
        parameters.usefdata = shaders.def_usefdata;
        document.getElementById("fnorm_area").value = parameters.fnorm;
        document.getElementById("f123_area").value  = parameters.usefdata;
        
        parameters.colours = presets.col_yellow(100);
        getsize();
        clear_bases();
        createBaseData();
        
        preset_base('cross');
        
        haloBuffer   = gl3d.createBuffer();
        LhaloBuffer  = gl3d.createBuffer();
        fillHalo();
        vertexBuffer = gl2d.createBuffer();
        gl2d.bindBuffer(gl2d.ARRAY_BUFFER, vertexBuffer);
        gl2d.bufferData(gl2d.ARRAY_BUFFER, new Float32Array(vertices), gl2d.STATIC_DRAW);
        
        newshaders();
    };
    
    
    init();
    
    window.readNorm      = read_codes;
    window.toggleBi      = toggle_input;
    window.toggle_anim   = toggle_anim;
    window.toggle_bck    = toggle_bck;
    window.zoomin        = zoomin;
    window.zoomout       = zoomout;
    window.preset_base   = preset_base;
    window.set_noise     = set_noise;
    window.set_dist      = set_dist;
    window.set_computef  = set_computef;
    window.set_colscheme = set_colscheme;
    window.set_3d        = set_3d;
    
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    
    canvas3d.addEventListener("mousedown", handleMouseDown3d);
    canvas3d.addEventListener("mouseup",   handleMouseUp3d);
    canvas3d.addEventListener("mousemove", handleMouseMove3d);
    
    //window.addEventListener("resize", function() { resize(); draw(); });
    
    draw();
    draw3d();
});

