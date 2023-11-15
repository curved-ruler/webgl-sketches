// Constants
var constants = {

    eps1 : 0.1,
    eps2 : 0.01,
    eps3 : 0.001,
    eps4 : 0.0001,
    eps5 : 0.00001,
    eps6 : 0.000001,
    eps7 : 0.0000001,
    eps8 : 0.00000001,
    eps9 : 0.000000001,

    eps  : 0.0000001,


    renderModes : {
        axw:  'Axonometric - wireframe',
        axh:  'Axonometric - hidden line',
        prw:  'Perspective - wireframe',
        prh:  'Perspective - hidden line',
        p6w:  'Fisheye - wireframe',
        p6h:  'Fisheye - hidden line',
        cyc:  'Cyclography',
        cyc3: 'Cyclography - 3',
        cyc4: 'Cyclography - 4',
        cyc5: 'Cyclography - 5',
        cycR: 'Cyclography - R'
    },
    
    inputs1 : {
        tetrahedron  : 'tetraeder.obj',
        tetra_e      : 'tetra_ures.obj',
        octahedron   : 'oktaeder.obj',
        octa_e       : 'okta_ures.obj',
        cube         : 'kocka.obj',
        cube_e       : 'kocka_ures.obj',
        dodecahedron : 'dodekaeder.obj',
        dodeca_e     : 'dodeka_ures.obj',
        icosahedron  : 'ikozaeder.obj',
        icosa_e      : 'ikoza_ures.obj',
        fulleren_o   : 'fulleren_otszog.obj',
        
        csaszar     : 'csaszar.obj',
        csaszar_e   : 'csaszar_e.obj',
        szilassi     : 'szilassi.obj',
        szilassi_e   : 'szilassi_e.obj',
        haz     : 'haz.obj',
        haz_e   : 'haz_e.obj',
        teto    : 'teto.obj',
        teto_e  : 'teto_e.obj',
        teapot  : 'teapot01.obj',
        square  : 'negyzet.obj'
    },
   
    inputs2 : {
        alfa147    : 'alfa147.obj',
        minicooper : 'minicooper.obj',
        cessna     : 'cessna.obj',
        lamp       : 'lamp.obj',
        trumpet    : 'trumpet.obj',
        sponza_e   : 'sponza_lines.obj'
    }
};

export { constants };
