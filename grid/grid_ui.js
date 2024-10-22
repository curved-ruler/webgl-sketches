
import { colschemes } from "./colschemes.js";

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
    
    ds_w = 0.5;
    ds_w_dom = null;
    
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
        
        this.ds_w_dom = document.getElementById('dsw_in');
        this.ds_w_dom.value  = "" + this.ds_w;
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
    
    get_ds_w ()
    {
        let w = parseFloat(this.ds_w_dom.value);
        if (isNaN(w) || w === undefined || w === null) return this.ds_w;
        this.ds_w = w;
        
        return this.ds_w;
    }
}

export { Grid_UI };
