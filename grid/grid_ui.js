
class Grid_UI {
    
    bcol  = [0.1, 0.1, 0.1];
    lcol  = [1.0, 1.0, 1.0];
    alpha = 1.0;
    bcol_dom  = null;
    lcol_dom  = null;
    alpha_dom = null;
    
    levels    = [0,4,12];
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
        
        this.level_dom = document.getElementById('level_in');
        this.lev_c_dom = document.getElementById('lev_c_in');
        
        this.level_dom.value   = this.levels.join(",");
        this.lev_c_dom.checked = this.lev_cliff;
        
        this.ds_w_dom = document.getElementById('dsw_in');
        this.ds_w_dom.value  = "" + this.ds_w;
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
