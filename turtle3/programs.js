
let programs = [
    { name: "dotc" , prog: `\
let circ = (a) => {
    for (let i=0 ; i<a; ++i)
    {
        T.pen ? T.penup() : T.pendown(); 
        T.forward(1);
        T.yaw(360/a);
    }
};
circ(30);
circ(40);
circ(60);`
    },

    { name: "dotc2" , prog: `\
let circ = (a) => {
    for (let i=0 ; i<a; ++i)
    {
        T.pen ? T.penup() : T.pendown(); 
        T.forward(1);
        T.yaw(360/a);
    }
};
let c = (a) => {
    T.penup();
    T.yaw(-90);
    T.forward(1/(2*Math.sin(Math.PI/a)));
    T.yaw(90);
    circ(a);
    T.penup();
    T.yaw(90);
    T.forward(1/(2*Math.sin(Math.PI/a)));
    T.yaw(-90);
}

c(30);
c(40);
c(50);
c(60);`
    },


    { name: "dotc-helix" , prog: `\
let circ = (a) => {
    for (let i=0 ; i<a; ++i)
    {
        T.pen ? T.penup() : T.pendown(); 
        T.forward(1);
        T.yaw(360/a);
    }
};
let c = (a) => {
    T.penup();
    T.yaw(-90);
    T.forward(1/(2*Math.sin(Math.PI/a)));
    T.yaw(90);
    circ(a);
    T.penup();
    T.yaw(90);
    T.forward(1/(2*Math.sin(Math.PI/a)));
    T.yaw(-90);
}

for (let i=0 ; i<100 ; ++i)
{
    T.penup();
    T.forward(5);
    T.turn([1,1,1], 10);
    T.pitch(90);
    c(i+10);
    T.pitch(-90);
}`
    },


    { name: "rotc" , prog: `\
let circ = (a) => {
    for (let i=0 ; i<360/a; ++i)
    { 
        T.forward(1);
        T.turn([0,0,1],a);
    }
};
T.pendown();
for (let i=0 ; i<36 ; ++i)
{
    circ(3);
    T.turn([0,0,1],20.2);
}`
    },

    
    { name: "colc" , prog: `\
let circ = (a) => {
    for (let i=0 ; i<360/a; ++i)
    {
        T.setcol(Math.random(), Math.random(), Math.random());
        T.forward(1);
        T.turn([0,0,1], a);
    }
};
T.background(0.2, 0.2, 0.2);
T.pendown();
for (let i=0 ; i<180 ; ++i)
{
    circ(3);
    T.turn([0,0,1], 20.2);
}`
    },


    { name: "koch" , prog: `\
let koch = (lev, dist) => {
    if (lev == 0) {
        T.forward(dist);
    } else {
        koch(lev-1, dist);
        T.turn([0,0,1], 60);
        koch(lev-1, dist);
        T.turn([0,0,1], -120);
        koch(lev-1, dist);
        T.turn([0,0,1], 60);
        koch(lev-1, dist);
    }
};
T.pendown();
koch(3,10);
T.turn([0,0,1],-120);
koch(3,10);
T.turn([0,0,1],-120);
koch(3,10);`
    },


    { name: "kochs" , prog: `\
let koch = (lev, dist) => {
    if (lev == 0) {
        T.forward(dist);
    } else {
        koch(lev-1, dist);
        T.turn([0,0,1], 60);
        koch(lev-1, dist);
        T.turn([0,0,1], -120);
        koch(lev-1, dist);
        T.turn([0,0,1], 60);
        koch(lev-1, dist);
    }
};
let k = (l,d) => {
    let a = Math.pow(3,l)*d;
    let v = [0,0,1];
    
    T.penup();
    T.forward(-a*Math.sqrt(3)/6);
    T.turn(v,90);
    T.forward(a/2);
    T.turn(v,-90-30);
    
    T.pendown();
    koch(l,d);
    T.turn(v,-120);
    koch(l,d);
    T.turn(v,-120);
    koch(l,d);
    
    T.penup();
    T.forward(-a/2);
    T.turn(v,-90);
    T.forward(a*Math.sqrt(3)/6);
};

let a = 20;
k(0, a);
k(1,(a+0.5)/3);
k(2,(a+1.0)/(3*3));
k(3,(a+1.5)/(3*3*3));
k(4,(a+2.0)/(3*3*3*3));`
    },
    
    
    { name: "koch3d" , prog: `\
let koch = (lev, dist) => {
    if (lev == 0) {
        T.forward(dist);
    } else {
        koch(lev-1, dist);
        T.turn([0,0,1], 60);
        koch(lev-1, dist);
        T.turn([0,0,1], -120);
        koch(lev-1, dist);
        T.turn([0,0,1], 60);
        koch(lev-1, dist);
    }
};
let k = (l,d) => {
    let a = Math.pow(3,l)*d;
    let v = [0,0,1];
    
    T.penup();
    T.forward(-a*Math.sqrt(3)/6);
    T.turn(v,90);
    T.forward(a/2);
    T.turn(v,-90-30);
    
    T.pendown();
    koch(l,d);
    T.turn(v,-120);
    koch(l,d);
    T.turn(v,-120);
    koch(l,d);
    
    T.penup();
    T.forward(-a/2);
    T.turn(v,-90);
    T.forward(a*Math.sqrt(3)/6);
};

T.penup();
T.turn([0,1,0],90);
T.forward(20);
T.turn([0,1,0],-90);

for (let i=0 ; i<20 ; ++i)
{
    k(4,0.5);
    T.penup();
    T.turn([0,1,0],-90);
    T.forward(2);
    T.turn([0,1,0],90);
}`
    },


    { name: "randw" , prog: `\
for (let i=0 ; i<100 ; ++i)
{
    T.forward(1);
    let r = Math.random();
    let v = r<0.33?[0,0,1]:r<0.66?[0,1,0]:[1,0,0];
    T.turn(v,(Math.random()<0.5)?90:-90);
}`
    },


    { name: "randwc" , prog: `\
T.background(0,0,0);

for (let j=0 ; j<1000 ; ++j)
{
  T.setcol(Math.random(), Math.random(),   Math.random());
  for (let i=0 ; i<500 ; ++i)
  {
    let a = (Math.random()<0.5)?25.5:-25.5;
    let r = Math.random();
    r<0.33 ? T.roll(a)  :
    r<0.66 ? T.pitch(a) :
             T.yaw(a);

    T.forward(1);
  }
}`
    },


    { name: "poly" , prog: `\
let regn = (n,d) => {
    T.penup();
    T.forward(-d/(2*Math.sin(Math.PI/n)));
    T.turn([0,0,1],90*(n-2)/n);
    T.pendown();
    for (let i=0 ; i<n ; ++i)
    {
        T.forward(d);
        T.turn([0,0,1],-360/n);
    }
    T.penup();
    T.turn([0,0,1],-90*(n-2)/n);
    T.forward(d/(2*Math.sin(Math.PI/n)));
};

let d = 3;
let n = 8;
let m = Math.sqrt(2/(1-Math.cos(Math.PI*(n-2)/n)));
for (let i=0 ; i<20 ; ++i)
{
    regn(n,d);
    T.turn([0,0,1],360/(2*n));
    d = d * m;
}`
    },


    { name: "cube" , prog: `\
let cube = (d) => {
    T.penup();
    T.forward(d/2);
    T.pitch(-90);
    T.forward(d/2);
    T.yaw(90);
    T.forward(d/2);
    
    T.pendown();
    for (let i=0 ; i<4 ; ++i)
    {
        T.pitch(-90);
        T.forward(d);
    }
    
    T.yaw(90);
    T.forward(d);
    T.yaw(90);
    for (let i=0 ; i<4 ; ++i)
    {
        T.forward(d);
        T.pitch(-90);
    }
    
    T.penup();
    T.forward(d);
    T.yaw(90);
    T.pendown();
    T.forward(d);
    
    T.penup();
    T.pitch(-90);
    T.forward(d);
    T.pendown();
    T.pitch(-90);
    T.forward(d);
    
    T.penup();
    T.yaw(90);
    T.forward(d);
    T.pendown();
    T.yaw(90);
    T.forward(d);
    
    T.penup();
    T.yaw(90);
    T.forward(d/2);
    T.yaw(90);
    T.forward(d/2);
    T.pitch(-90);
    T.forward(d/2);
};

cube(10);
`
    },


    { name: "cubewalk" , prog: `\
let cube = (d) => {
    T.penup();
    T.forward(d/2);
    T.pitch(-90);
    T.forward(d/2);
    T.yaw(90);
    T.forward(d/2);
    
    T.pendown();
    for (let i=0 ; i<4 ; ++i)
    {
        T.pitch(-90);
        T.forward(d);
    }
    
    T.yaw(90);
    T.forward(d);
    T.yaw(90);
    for (let i=0 ; i<4 ; ++i)
    {
        T.forward(d);
        T.pitch(-90);
    }
    
    T.penup();
    T.forward(d);
    T.yaw(90);
    T.pendown();
    T.forward(d);
    
    T.penup();
    T.pitch(-90);
    T.forward(d);
    T.pendown();
    T.pitch(-90);
    T.forward(d);
    
    T.penup();
    T.yaw(90);
    T.forward(d);
    T.pendown();
    T.yaw(90);
    T.forward(d);
    
    T.penup();
    T.yaw(90);
    T.forward(d/2);
    T.yaw(90);
    T.forward(d/2);
    T.pitch(-90);
    T.forward(d/2);
};

let a = 4;
for (let i=0 ; i<1000 ; ++i)
{
    T.forward(a+2);
    cube(a);
    
    let r = Math.random();
    let v = r<0.33?[0,0,1]:r<0.66?[0,1,0]:[1,0,0];
    T.turn(v,(Math.random()<0.5)?90:-90);
}
`
    },


    { name: "cubegrid" , prog: `\
let cube = (d) => {
    T.penup();
    T.forward(d/2);
    T.pitch(-90);
    T.forward(d/2);
    T.yaw(90);
    T.forward(d/2);
    
    T.pendown();
    for (let i=0 ; i<4 ; ++i)
    {
        T.pitch(-90);
        T.forward(d);
    }
    
    T.yaw(90);
    T.forward(d);
    T.yaw(90);
    for (let i=0 ; i<4 ; ++i)
    {
        T.forward(d);
        T.pitch(-90);
    }
    
    T.penup();
    T.forward(d);
    T.yaw(90);
    T.pendown();
    T.forward(d);
    
    T.penup();
    T.pitch(-90);
    T.forward(d);
    T.pendown();
    T.pitch(-90);
    T.forward(d);
    
    T.penup();
    T.yaw(90);
    T.forward(d);
    T.pendown();
    T.yaw(90);
    T.forward(d);
    
    T.penup();
    T.yaw(90);
    T.forward(d/2);
    T.yaw(90);
    T.forward(d/2);
    T.pitch(-90);
    T.forward(d/2);
};

let go = (x,y,z) => {
    T.penup();
    T.forward(x);
    T.pitch(90);
    T.forward(z);
    T.yaw(90);
    T.forward(y);
    T.yaw(-90);
    T.pitch(-90);
};

let d   = 1;
let gap = 7;
let n   = 7;
let len = (n-1)*(gap+d);
go(-len/2,-len/2,-len/2);
for (let i=0 ; i<n ; ++i)
{
    for (let j=0 ; j<n ; ++j)
    {
        for (let k=0 ; k<n ; ++k)
        {
            cube(d);
            T.forward(d+gap);
        }
        go(-n*(gap+d),gap+d,0);
    }
    go(0,-n*(gap+d),gap+d);
}
go(0,0,-gap-d);
go(len/2,len/2,-len/2);
`
    }
];


export { programs };
