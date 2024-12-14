
import { colschemes } from "./colschemes.js";
import { noise }      from "./noise.js";

class Grid_UI {
    
    bcol  = [0.1, 0.1, 0.1];
    lcol  = [1.0, 1.0, 1.0];
    alpha = 1.0;
    bcol_dom  = null;
    lcol_dom  = null;
    alpha_dom = null;
    
    blend = 1;
    blend_dom = null;
    heights_dom = null;
    cols_dom = null;
    colh_presets_dom = null;
    
    levels    = [0];
    lev_cliff = true;
    level_dom = null;
    lev_c_dom = null;
    
    contour_dom = null;
    contour_min = -50;
    contour_max =  50;
    contour_step  = 5;
    contour_curse = false;
    contour_curse_dom = null;
    
    ds_w = 0.5;
    ds_w_dom = null;
    
    kernel = `\
let s  = -a*Math.log(Math.abs(a+0.01));
    s -= -b*Math.log(Math.abs(b+0.01));
    s -= -c*Math.log(Math.abs(c+0.01));
    s -= -d*Math.log(Math.abs(d+0.01));
    s -= -e*Math.log(Math.abs(e+0.01));
    s -= -f*Math.log(Math.abs(f+0.01));
    s -= -g*Math.log(Math.abs(g+0.01));
    s -= -h*Math.log(Math.abs(h+0.01));
return 1.1 * s;`;
    /*
    kernel = `\
let s  = (a+h+f+c)/4;
return 1.0 * s;`;
    */
    
    kernel_dom = null;
    kmin_dom = null;
    kmax_dom = null;
    kmin = -30;
    kmax =  30;
    
    octaves = 1;
    n_amp   = 1;
    n_l     = 0.5;
    noise_dom     = null;
    noise_pre_dom = null;
    oct_dom       = null;
    noisea_dom    = null;
    noisel_dom    = null;
    
    constructor ()
    {
        this.bcol_dom  = document.getElementById('bcolin');
        this.lcol_dom  = document.getElementById('lcolin');
        this.alpha_dom = document.getElementById('alphain');

        this.bcol_dom.value  = "" + Math.floor(this.bcol[0]*255) + "," + Math.floor(this.bcol[1]*255) + "," + Math.floor(this.bcol[2]*255);
        this.lcol_dom.value  = "" + Math.floor(this.lcol[0]*255) + "," + Math.floor(this.lcol[1]*255) + "," + Math.floor(this.lcol[2]*255);
        this.alpha_dom.value = "" + this.alpha;
        
        this.blend_dom   = document.getElementById('blend_in');
        this.heights_dom = document.getElementById('heights_in');
        this.cols_dom    = document.getElementById('cols_in');
        this.colh_presets_dom = document.getElementById('colh_presets');
        
        this.blend_dom.value = "" + this.blend;
        this.heights_dom.value = colschemes[0].limits.join(",");
        
        let colstr = "";
        for (let i=0 ; i<colschemes[0].cols.length ; ++i) { colstr += colschemes[0].cols[i]; colstr+=", "; if (i%3 == 2) colstr+="\n"; }
        this.cols_dom.value = colstr;
        
        for (let i=0 ; i<colschemes.length ; ++i)
        {
            let option = document.createElement("option");
            option.value    = i;
            option.text     = colschemes[i].name;
            option.selected = i == 0;
            this.colh_presets_dom.appendChild(option);
        }
        
        this.level_dom = document.getElementById('level_in');
        this.lev_c_dom = document.getElementById('lev_c_in');
        
        this.level_dom.value   = this.levels.join(",");
        this.lev_c_dom.checked = this.lev_cliff;
        
        this.contour_dom = document.getElementById('cont_mms_in');
        this.contour_dom.value = "" + this.contour_min + ", " + this.contour_max + ", " + this.contour_step;
        this.contour_curse_dom = document.getElementById('cont_curse');
        this.contour_curse_dom.checked = this.contour_curse;
        
        this.ds_w_dom = document.getElementById('dsw_in');
        this.ds_w_dom.value  = "" + this.ds_w;
        
        this.kernel_dom = document.getElementById('kernel_in');
        this.kmin_dom   = document.getElementById('kmin');
        this.kmax_dom   = document.getElementById('kmax');
        this.kernel_dom.value = this.kernel;
        this.kmin_dom.value   = "" + this.kmin;
        this.kmax_dom.value   = "" + this.kmax;
        
        this.noise_dom     = document.getElementById('noise_in');
        this.noise_pre_dom = document.getElementById('noise_presets');
        this.oct_dom       = document.getElementById('octaves');
        this.noisea_dom    = document.getElementById('noiseA');
        this.noisel_dom    = document.getElementById('noiseL');
        
        this.noise_dom.value  = noise.gradient;
        this.oct_dom.value    = "" + this.octaves;
        this.noisea_dom.value = "" + this.n_amp;
        this.noisel_dom.value = "" + this.n_l;
        
        for (const key in noise)
        {
            let option = document.createElement("option");
            option.value    = key;
            option.text     = key;
            option.selected = key == "gradient";
            this.noise_pre_dom.appendChild(option);
        }
    }
    
    get_colsch ()
    {
        let ret = { blend:parseInt(this.blend_dom.value), limits:[], cols:[] };
        
        let lim = this.heights_dom.value.split(",");
        for (let i=0 ; i<lim.length ; ++i) { ret.limits.push(parseFloat(lim[i])); }
        
        let c = this.cols_dom.value.split(",");
        for (let i=0 ; i<c.length ; ++i) { ret.cols.push(parseFloat(c[i])); }
        
        return ret;
    }
    
    set_colsch (val)
    {
        let vv=parseInt(val);
        
        this.heights_dom.value = colschemes[vv].limits.join(",");
        
        let colstr = "";
        for (let i=0 ; i<colschemes[vv].cols.length ; ++i) { colstr += colschemes[vv].cols[i]; colstr+=", "; if (i%3 == 2) colstr+="\n"; }
        this.cols_dom.value = colstr;
        
        this.colh_presets_dom.blur();
    }
    
    get_bcol ()
    {
        let str = this.bcol_dom.value;
        let bc = str.split(',');
        if (bc.length === 1) bc.push(bc[0], bc[0]);
        if (bc.length === 2) bc.push(bc[1]);
        
        this.bcol[0] = parseInt(bc[0]) / 255.0;
        this.bcol[1] = parseInt(bc[1]) / 255.0;
        this.bcol[2] = parseInt(bc[2]) / 255.0;
        
        return this.bcol;
    }
    
    get_lcol ()
    {
        let str = this.lcol_dom.value;
        let bc = str.split(',');
        if (bc.length === 1) bc.push(bc[0], bc[0]);
        if (bc.length === 2) bc.push(bc[1]);
        
        this.lcol[0] = parseInt(bc[0]) / 255.0;
        this.lcol[1] = parseInt(bc[1]) / 255.0;
        this.lcol[2] = parseInt(bc[2]) / 255.0;
        
        return this.lcol;
    }
    
    get_alpha ()
    {
        let a   = parseFloat(this.alpha_dom.value);
        if (isNaN(a) || a === undefined || a === null) return this.alpha;
        if (a < 0) a = 0;
        if (a > 1) a = 1;
        this.alpha = a;
        
        return this.alpha;
    }
    
    get_levels ()
    {
        this.levels = [];
        let str = this.level_dom.value;
        let lv = str.split(",");
        for (let i=0 ; i<lv.length ; ++i)
        {
            let ival = parseFloat(lv[i]);
            if (isNaN(ival) || ival === undefined || ival === null) continue;
            this.levels.push(ival);
        }
        
        return this.levels;
    }
    
    get_lev_c ()
    {
        return this.lev_c_dom.checked;
    }
    
    get_contour_params ()
    {
        let cs = this.contour_dom.value.split(",");
        return [
            parseFloat(cs[0]),
            parseFloat(cs[1]),
            parseFloat(cs[2])
        ];
    }
    get_contour_curse ()
    {
        return this.contour_curse_dom.checked;
    }
    
    get_ds_w ()
    {
        let w = parseFloat(this.ds_w_dom.value);
        if (isNaN(w) || w === undefined || w === null) return this.ds_w;
        this.ds_w = w;
        
        return this.ds_w;
    }
    
    get_kernel_dom ()
    {
        return this.kernel_dom;
    }
    get_kmin ()
    {
        let a   = parseFloat(this.kmin_dom.value);
        if (isNaN(a) || a === undefined || a === null) return this.kmin;
        this.kmin = a;
        
        return this.kmin;
    }
    get_kmax ()
    {
        let a   = parseFloat(this.kmax_dom.value);
        if (isNaN(a) || a === undefined || a === null) return this.kmax;
        this.kmax = a;
        
        return this.kmax;
    }
    
    get_noise_dom ()
    {
        return this.noise_dom;
    }
    
    set_noise (v)
    {
        this.noise_dom.value = noise[v];
        this.noise_pre_dom.blur();
    }
    
    get_n_oct ()
    {
        let w = parseInt(this.oct_dom.value);
        if (isNaN(w) || w === undefined || w === null) return this.octaves;
        this.octaves = w < 0 ? 0 : w;
        
        return this.octaves;
    }
    
    get_n_amp()
    {
        let w = parseFloat(this.noisea_dom.value);
        if (isNaN(w) || w === undefined || w === null) return this.n_amp;
        this.n_amp = w;
        
        return this.n_amp;
    }
    
    get_n_lambda()
    {
        let w = parseFloat(this.noisel_dom.value);
        if (isNaN(w) || w === undefined || w === null) return this.n_l;
        this.n_l = w;
        
        return this.n_l;
    }
}

export { Grid_UI };
