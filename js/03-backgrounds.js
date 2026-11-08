'use strict';
/* ---------- backgrounds ---------- */
function sky(g,c1,c2,h){var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fillRect(0,0,W,H)}
function ground(g,y,c1,c2){var gr=g.createLinearGradient(0,y,0,H);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fillRect(0,y,W,H-y)}
function cloud(g,x,y,s){g.fillStyle='rgba(255,255,255,.9)';[[0,0,40],[38,-10,34],[74,2,38],[36,12,34]].forEach(function(c){g.beginPath();g.arc(x+c[0]*s,y+c[1]*s,c[2]*s,0,7);g.fill()})}
function sun(g,x,y,r,c){var gr=g.createRadialGradient(x,y,r*.4,x,y,r*2.4);gr.addColorStop(0,c);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r*2.4,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,7);g.fill()}
function hills(g,y,c,amp,ph){g.fillStyle=c;g.beginPath();g.moveTo(0,H);for(var x=0;x<=W;x+=40)g.lineTo(x,y+Math.sin(x/190+ph)*amp);g.lineTo(W,H);g.closePath();g.fill()}
function pyramid(g,x,y,w,h){g.fillStyle='#e8b95f';g.beginPath();g.moveTo(x-w/2,y);g.lineTo(x,y-h);g.lineTo(x+w/2,y);g.closePath();g.fill();
  g.fillStyle='#c9953f';g.beginPath();g.moveTo(x,y-h);g.lineTo(x+w/2,y);g.lineTo(x+w*.1,y);g.closePath();g.fill()}
function palm(g,x,y){g.strokeStyle='#7a5230';g.lineWidth=14;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+28,y-90,x+8,y-170);g.stroke();
  g.strokeStyle='#2f9e5b';g.lineWidth=9;for(var i=0;i<6;i++){var a=-Math.PI/2+(i-2.5)*.55;g.beginPath();g.moveTo(x+8,y-170);g.quadraticCurveTo(x+8+Math.cos(a)*50,y-170+Math.sin(a)*40-14,x+8+Math.cos(a)*92,y-170+Math.sin(a)*70+26);g.stroke()}}
function drawBG(g,k,T){
  if(k==='night'){sky(g,'#0a0e2c','#2b2f6e',H);STARS.forEach(function(s){g.fillStyle='rgba(255,255,255,'+(.55+.45*Math.sin(T*2+s[3]))+')';g.beginPath();g.arc(s[0],s[1],s[2],0,7);g.fill()});
    sun(g,1040,130,48,'#fff6cf');hills(g,430,'#18304a',30,1);ground(g,470,'#1d3b45','#102a30')}
  else if(k==='sunset'){sky(g,'#3b2a6b','#ff7a59',H*.62);sun(g,820,420,70,'#ffd27a');hills(g,420,'#5b3a63',24,2);ground(g,468,'#6b3f5e','#3d2848');cloud(g,(180+T*6)%1500-120,120,1.1)}
  else if(k==='desert'){sky(g,'#ffcf8a','#fff1d3',H*.55);sun(g,1060,120,54,'#fff3b8');pyramid(g,780,430,300,230);pyramid(g,1010,430,200,150);pyramid(g,620,430,150,100);
    hills(g,440,'#f0c97f',16,0);ground(g,470,'#efc980','#d6a456');palm(g,150,470);cloud(g,(100+T*8)%1500-100,110,.9)}
  else if(k==='forest'){sky(g,'#bfe8c9','#e8f7e0',H*.6);
    g.fillStyle='rgba(255,250,200,.22)';[[300,170],[620,260],[960,200]].forEach(function(b){g.beginPath();g.moveTo(b[0],0);g.lineTo(b[0]+b[1],0);g.lineTo(b[0]+b[1]*.4-150,480);g.lineTo(b[0]-150,480);g.closePath();g.fill()});
    hills(g,430,'#7fbf8a',20,1);
    [80,260,470,700,930,1150].forEach(function(x,i){var h=250+(i%3)*50;g.fillStyle='#6b4a2f';g.fillRect(x-16,480-h*.55,32,h*.55);
      g.fillStyle=i%2?'#2f8f4e':'#3aa35d';[[0,-h*.5,70],[-48,-h*.36,56],[48,-h*.36,56]].forEach(function(c){g.beginPath();g.arc(x+c[0],480+c[1]-h*.18,c[2],0,7);g.fill()})});
    ground(g,480,'#4f9d56','#2d5c36');cloud(g,(220+T*5)%1500-120,70,.8)}
  else if(k==='sea'){sky(g,'#7fd3ff','#e6f8ff',H*.5);sun(g,1000,110,50,'#fff2a8');cloud(g,(160+T*9)%1500-120,120,1);
    var sg=g.createLinearGradient(0,330,0,480);sg.addColorStop(0,'#3bb6e6');sg.addColorStop(1,'#0d6fa8');g.fillStyle=sg;g.fillRect(0,330,W,150);
    g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=3;for(var wy=350;wy<480;wy+=26){g.beginPath();for(var wx=0;wx<=W;wx+=30)g.lineTo(wx,wy+Math.sin(wx/55+T*1.6+wy)*5);g.stroke()}
    ground(g,480,'#f2d9a0','#d9b878');palm(g,1130,480)}
  else if(k==='space'){sky(g,'#05010f','#1a0b3a',H);STARS.forEach(function(s2){g.fillStyle='rgba(255,255,255,'+(.5+.5*Math.sin(T*2+s2[3]))+')';g.beginPath();g.arc(s2[0],s2[1]*1.5,s2[2],0,7);g.fill()});
    var pg=g.createRadialGradient(880,190,10,900,200,100);pg.addColorStop(0,'#ffb26b');pg.addColorStop(1,'#a8326b');g.fillStyle=pg;g.beginPath();g.arc(900,200,90,0,7);g.fill();
    g.strokeStyle='rgba(255,220,170,.75)';g.lineWidth=8;g.beginPath();g.ellipse(900,205,150,28,-.35,0,7);g.stroke();
    hills(g,440,'#4a4a63',20,1);ground(g,470,'#5b5b78','#34344a');g.fillStyle='rgba(0,0,0,.18)';[[260,560,90,18],[640,620,120,22],[1010,590,80,16]].forEach(function(c){g.beginPath();g.ellipse(c[0],c[1],c[2],c[3],0,0,7);g.fill()})}
  else if(k==='room'){g.fillStyle='#f0d3b4';g.fillRect(0,0,W,H);g.fillStyle='rgba(120,70,40,.07)';for(var x=0;x<W;x+=80)g.fillRect(x,0,40,470);
    g.fillStyle='#8cc9ff';rr(g,820,90,300,240,14);g.fill();g.fillStyle='rgba(255,255,255,.75)';g.beginPath();g.arc(930,190,34,0,7);g.arc(975,180,28,0,7);g.fill();
    g.strokeStyle='#fff';g.lineWidth=12;rr(g,820,90,300,240,14);g.stroke();g.beginPath();g.moveTo(970,90);g.lineTo(970,330);g.moveTo(820,210);g.lineTo(1120,210);g.stroke();
    ground(g,470,'#b98156','#8d5c3a');g.strokeStyle='rgba(0,0,0,.12)';g.lineWidth=2;for(var y=500;y<H;y+=46){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
    g.fillStyle='#e0614a';g.beginPath();g.ellipse(430,610,300,54,0,0,7);g.fill();g.fillStyle='#f3a48f';g.beginPath();g.ellipse(430,610,220,36,0,0,7);g.fill()}
  else{sky(g,'#74c2ff','#d9f2ff',H*.6);sun(g,1060,120,52,'#fff2a8');cloud(g,(120+T*10)%1500-120,130,1.2);cloud(g,(640+T*6)%1500-120,80,.9);
    hills(g,420,'#9bd88f',22,0);hills(g,455,'#6cc36a',16,3);ground(g,480,'#62b95e','#3f9150')}
}
