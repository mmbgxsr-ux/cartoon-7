'use strict';
/* ---------- characters ---------- */
function limb(g,x,y,ang,len,w,col,hand,hr){g.save();g.translate(x,y);g.rotate(ang);g.lineCap='round';g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(0,0);g.lineTo(0,len);g.stroke();
  if(hand){g.fillStyle=hand;g.beginPath();g.arc(0,len,hr||9,0,7);g.fill()}g.restore()}
var VIS={A:[14,11],O:[9,7],E:[5,16],N:[6,10],M:[1,10]};
function visKind(ch){
  if(!ch||/[\s.,!؟?،:;"«»\-]/.test(ch))return 'M';
  if('اأإآعحهءةaAhH'.indexOf(ch)>-1)return 'A';
  if('وؤُuUoO'.indexOf(ch)>-1)return 'O';
  if('يىئِiIeE'.indexOf(ch)>-1)return 'E';
  if('مبفmbpf'.indexOf(ch)>-1)return 'M';
  return 'N';
}
function visemeAt(text,u){
  var n=(text||'').length;if(!n||u<0||u>1)return VIS.M;
  var f=u*n,i=Math.min(n-1,Math.floor(f)),fr=f-i,cur=VIS[visKind(text.charAt(i))],prv=VIS[visKind(i?text.charAt(i-1):' ')],k=Math.min(1,fr*3);
  return [lerp(prv[0],cur[0],k),lerp(prv[1],cur[1],k)];
}
function mouth(g,emo,talk,y,T,seed,col,vis){
  g.strokeStyle=col;g.fillStyle='#5a1a1a';g.lineWidth=4;g.lineCap='round';g.beginPath();
  if(talk&&vis){if(vis[0]<2.5){g.moveTo(-vis[1],y+4);g.lineTo(vis[1],y+4);g.stroke()}else{g.ellipse(0,y+4,vis[1],vis[0],0,0,7);g.fill()}return}
  if(talk){var o=3+Math.abs(Math.sin(T*17+seed))*13;g.ellipse(0,y+4,11,o,0,0,7);g.fill();return}
  if(emo==='happy'||emo==='love'){g.arc(0,y-6,15,.12*Math.PI,.88*Math.PI);g.stroke()}
  else if(emo==='sleepy'){g.ellipse(0,y+5,6,4+Math.abs(Math.sin(T*1.6))*4,0,0,7);g.fill()}
  else if(emo==='scared'){g.moveTo(-12,y+6);for(var zi=1;zi<=6;zi++)g.lineTo(-12+zi*4,y+6+(zi%2?-5:3));g.stroke()}
  else if(emo==='sad'){g.arc(0,y+12,12,1.15*Math.PI,1.85*Math.PI);g.stroke()}
  else if(emo==='surprised'){g.ellipse(0,y+4,7,10,0,0,7);g.fill()}
  else if(emo==='angry'){g.moveTo(-10,y+5);g.lineTo(10,y+2);g.stroke()}
  else{g.arc(0,y-3,9,.15*Math.PI,.85*Math.PI);g.stroke()}
}
function heart(g,x,y,z,col){g.fillStyle=col;g.beginPath();g.moveTo(x,y+z*.9);g.bezierCurveTo(x-z*1.6,y-z*.2,x-z*.8,y-z*1.3,x,y-z*.45);g.bezierCurveTo(x+z*.8,y-z*1.3,x+z*1.6,y-z*.2,x,y+z*.9);g.fill()}
function eyesSpecial(g,k,p,ex,ey,T){
  if(p.emo==='love'){var pu=1+Math.sin(T*8)*.08;[-1,1].forEach(function(s){heart(g,s*ex,ey,13*pu,k==='robot'?p.accent:'#e63757')})}
  else{g.strokeStyle=k==='robot'?p.accent:'#2b1d14';g.lineWidth=5;g.lineCap='round';[-1,1].forEach(function(s){g.beginPath();g.arc(s*ex,ey-2,11,.15*Math.PI,.85*Math.PI);g.stroke()})}
}
function faceExtras(g,k,p,T,ex,ey){
  var e=p.emo;
  if(e==='love'){if(k!=='robot'){g.fillStyle='rgba(255,120,150,.45)';[-1,1].forEach(function(s){g.beginPath();g.ellipse(s*(ex+16),ey+24,10,6,0,0,7);g.fill()})}
    var ph=(T*.9)%1;g.save();g.globalAlpha=1-ph;heart(g,52,ey-60-ph*40,8,'#e63757');g.restore()}
  else if(e==='sleepy'){g.strokeStyle='#5b6cff';g.lineWidth=4;g.lineCap='round';g.lineJoin='round';
    for(var i=0;i<3;i++){var q=((T*.7+i*.34)%1),z=7+i*3,x=46+q*26,y=ey-48-q*46;g.save();g.globalAlpha=1-q;g.beginPath();g.moveTo(x,y);g.lineTo(x+z,y);g.lineTo(x,y+z);g.lineTo(x+z,y+z);g.stroke();g.restore()}}
  else if(e==='scared'){var dy=Math.abs(Math.sin(T*4))*6,x2=ex+30,y2=ey-22+dy;g.fillStyle='#7cc8ff';g.beginPath();g.moveTo(x2,y2-10);g.quadraticCurveTo(x2+8,y2+2,x2,y2+7);g.quadraticCurveTo(x2-8,y2+2,x2,y2-10);g.fill()}
}
var ANIMAL={dog:1,bear:1,fox:1}; /* share the cat skeleton (body, limbs, face) and differ in ears, tail and muzzle */
function baseKind(k){return k==='rabbit'||ANIMAL[k]?'cat':k==='girl'?'boy':k}
function animalTail(g,k,p,T,c,ac){
  if(k==='dog'){var hap=p.emo==='happy'||p.emo==='love'||p.talk,wag=Math.sin(T*(hap?15:4)+p.seed)*(hap?18:9);
    g.strokeStyle=c;g.lineWidth=16;g.lineCap='round';g.beginPath();g.moveTo(-42,-72);g.bezierCurveTo(-72,-74,-92,-100,-84+wag,-140);g.stroke()}
  else if(k==='bear'){g.fillStyle=c;g.beginPath();g.arc(-42,-76,13,0,7);g.fill()}
  else{g.save();g.translate(-48,-82);g.rotate(-.68+Math.sin(T*2.6+p.seed)*.08);
    g.fillStyle=c;g.beginPath();g.ellipse(0,-44,20,54,0,0,7);g.fill();
    g.beginPath();g.ellipse(0,-44,20,54,0,0,7);g.clip();g.fillStyle='#fff';g.fillRect(-30,-110,60,32);g.restore()}
}
function animalHead(g,k,p,T,c,ac){
  var sway=p.walk?Math.sin(p.phase)*.14:0;
  if(k==='dog'){[-1,1].forEach(function(s){g.save();g.translate(s*42,-226);g.rotate(s*(.16+sway));g.fillStyle=shade(c,-.38);g.beginPath();g.ellipse(s*9,40,15,50,0,0,7);g.fill();g.restore()})}
  else if(k==='bear'){[-1,1].forEach(function(s){g.fillStyle=c;g.beginPath();g.arc(s*40,-231,19,0,7);g.fill();g.fillStyle=ac;g.beginPath();g.arc(s*40,-231,10,0,7);g.fill()})}
  else{[-1,1].forEach(function(s){g.fillStyle=c;g.beginPath();g.moveTo(s*54,-204);g.lineTo(s*50,-284);g.lineTo(s*12,-234);g.closePath();g.fill();
    g.fillStyle='#3b2a22';g.beginPath();g.moveTo(s*45,-214);g.lineTo(s*46,-268);g.lineTo(s*23,-233);g.closePath();g.fill()})}
  g.fillStyle=c;g.beginPath();g.arc(0,-185,56,0,7);g.fill();
  if(k==='dog'){g.fillStyle=shade(c,-.3);g.beginPath();g.ellipse(-24,-194,19,22,-.2,0,7);g.fill()} /* eye patch */
  if(k==='fox'){g.fillStyle=ac;[-1,1].forEach(function(s){g.beginPath();g.ellipse(s*36,-166,27,17,s*.45,0,7);g.fill()})}
  g.fillStyle=ac;g.beginPath();g.ellipse(0,-165,k==='dog'?30:k==='bear'?25:21,k==='dog'?22:k==='bear'?19:15,0,0,7);g.fill();
  g.fillStyle=k==='bear'?'#3b2418':'#241812';g.beginPath();g.ellipse(0,-175,k==='dog'?10:k==='bear'?9:6.5,k==='dog'?7:k==='bear'?6:5,0,0,7);g.fill();
  g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.ellipse(-3,-177,3,1.8,0,0,7);g.fill();
  if(k==='dog'&&!p.talk&&(p.emo==='happy'||p.emo==='love')){g.fillStyle='#e56b7f';g.beginPath();g.ellipse(0,-150,8,11,0,0,7);g.fill()} /* tongue */
  if(k==='fox'){g.strokeStyle=shade(c,-.4);g.lineWidth=3;g.lineCap='round';[-1,1].forEach(function(s){for(var i=0;i<3;i++){g.beginPath();g.moveTo(s*20,-166+i*5);g.lineTo(s*52,-172+i*9);g.stroke()}})}
}
function face(g,k,p,T){
  k=baseKind(k);
  var ey=k==='cat'?-190:k==='boy'?-192:-198,mx=k==='cat'?-164:k==='boy'?-166:-176,ex=k==='robot'?20:19;
  var bl=((T*1000+p.seed*500)%3600)<130?.1:1,emo=p.emo,big=emo==='surprised'?3:emo==='scared'?4:0;
  if(emo==='love'||emo==='sleepy'){eyesSpecial(g,k,p,ex,ey,T)}
  else if(k==='robot'){g.fillStyle=p.accent;[-1,1].forEach(function(s){rr(g,s*ex-8,ey-8*bl,16,16*bl,4);g.fill()})}
  else{[-1,1].forEach(function(s){g.fillStyle='#fff';g.beginPath();g.ellipse(s*ex,ey,13+big,(13+big)*bl,0,0,7);g.fill();
    g.fillStyle='#1b1f2e';g.beginPath();g.ellipse(s*ex+3,ey+1,(6.5-big/2),(6.5-big/2)*bl,0,0,7);g.fill();
    g.fillStyle='#fff';g.beginPath();g.arc(s*ex+5,ey-2,2,0,7);g.fill()})}
  g.strokeStyle=k==='robot'?p.accent:'#2b1d14';g.lineWidth=5;g.lineCap='round';
  if(emo==='angry'){[-1,1].forEach(function(s){g.beginPath();g.moveTo(s*(ex+11),ey-22);g.lineTo(s*(ex-9),ey-14);g.stroke()})}
  else if(emo==='sad'){[-1,1].forEach(function(s){g.beginPath();g.moveTo(s*(ex+11),ey-15);g.lineTo(s*(ex-9),ey-24);g.stroke()})}
  else if(emo==='surprised'){[-1,1].forEach(function(s){g.beginPath();g.moveTo(s*(ex+9),ey-27);g.lineTo(s*(ex-9),ey-27);g.stroke()})}
  else if(emo==='scared'){[-1,1].forEach(function(s){g.beginPath();g.moveTo(s*(ex+11),ey-22);g.lineTo(s*(ex-9),ey-34);g.stroke()})}
  mouth(g,emo,p.talk,mx,T,p.seed,k==='robot'?p.accent:'#2b1d14',p.vis);
  faceExtras(g,k,p,T,ex,ey);
}
function drawActor(g,a,p,T){
  var sc=p.sc,k=a.kind,bk=baseKind(k),c=a.color,ac=a.accent,sw=Math.sin(p.phase),air=p.lift>6,rf=p.run?1.5:1;
  p.accent=ac;
  g.save();g.translate(p.px,p.py);
  g.fillStyle='rgba(0,0,0,'+(.22*clamp(1-p.lift/260,.3,1))+')';g.beginPath();g.ellipse(0,0,60*sc,12*sc,0,0,7);g.fill();
  g.translate(0,-p.lift);g.rotate(p.rot);g.scale(p.face*p.sx*sc,p.sy*sc);
  if(k==='img'){drawImgActor(g,a,p,T);g.restore();return}
  if(p.emo==='scared')g.translate(Math.sin(T*45)*2.5,0);if(p.act==='sit')g.translate(0,56);
  var legC=k==='boy'?'#2f3b5c':k==='robot'?'#6f7a90':k==='girl'?ac:c, armC=k==='robot'?'#6f7a90':c, hand=k==='boy'?ac:k==='robot'?ac:ac;
  var act=p.act,ab=p.walk?-sw*.7*rf:.12,af=p.talk?2.5+Math.sin(T*8+p.seed)*.35:p.walk?sw*.7*rf:.12;
  if(act==='wave')af=-2.55+Math.sin(T*9)*.4;else if(act==='clap'){ab=-1.9-Math.sin(T*14)*.15;af=1.9+Math.sin(T*14)*.15}else if(act==='dance'){ab=2.5+Math.sin(T*6)*.4;af=-2.5-Math.sin(T*6)*.4}
  limb(g,-42,-122,ab,52,17,armC,hand,9);
  [[-20,1],[20,-1]].forEach(function(l){var ang=act==='sit'?-1.4:air?l[1]*.3:p.walk?l[1]*sw*.55*rf:act==='dance'?l[1]*Math.sin(T*6)*.3:0;
    limb(g,l[0],-68,ang,62,22,legC,null);g.save();g.translate(l[0],-68);g.rotate(ang);g.fillStyle=bk==='cat'?ac:shade(legC,-.4);g.beginPath();g.ellipse(7,64,17,9,0,0,7);g.fill();g.restore()});
  if(bk==='cat'){var tw=Math.sin(T*3+p.seed)*16;g.strokeStyle=c;g.lineWidth=18;g.lineCap='round';if(k==='cat'){g.beginPath();g.moveTo(-42,-72);g.bezierCurveTo(-96,-80,-98+tw,-130,-72+tw,-168);g.stroke()}else if(ANIMAL[k]){animalTail(g,k,p,T,c,ac)}else{g.fillStyle='#fff';g.beginPath();g.arc(-50,-84,18,0,7);g.fill();g.fillStyle=c}
    g.fillStyle=c;g.beginPath();g.ellipse(0,-100,50,56,0,0,7);g.fill();g.fillStyle=ac;g.beginPath();g.ellipse(0,-92,30,38,0,0,7);g.fill()}
  else if(bk==='boy'){g.fillStyle=c;if(k==='girl'){g.beginPath();g.moveTo(-38,-144);g.lineTo(38,-144);g.lineTo(58,-64);g.lineTo(-58,-64);g.closePath();g.fill()}else{rr(g,-40,-144,80,84,24);g.fill()}g.fillStyle=shade(c,.35);rr(g,-14,-144,28,14,7);g.fill()}
  else{g.fillStyle=c;rr(g,-44,-148,88,86,14);g.fill();g.fillStyle='#10152a';rr(g,-24,-130,48,30,8);g.fill();
    [-12,0,12].forEach(function(x,i){g.fillStyle=i===1?ac:shade(ac,.4);g.beginPath();g.arc(x,-115,4.5,0,7);g.fill()})}
  limb(g,42,-122,af,52,17,armC,hand,9);
  if(ANIMAL[k])animalHead(g,k,p,T,c,ac);
  else if(bk==='cat'){g.fillStyle=c;[-1,1].forEach(function(s){if(k==='rabbit'){g.beginPath();g.ellipse(s*24,-262,15,52,s*.12,0,7);g.fill();g.fillStyle='#f4a6b8';g.beginPath();g.ellipse(s*24,-260,7,38,s*.12,0,7);g.fill();g.fillStyle=c;return}g.beginPath();g.moveTo(s*50,-205);g.lineTo(s*44,-264);g.lineTo(s*12,-230);g.closePath();g.fill();
    g.fillStyle='#f4a6b8';g.beginPath();g.moveTo(s*42,-212);g.lineTo(s*39,-248);g.lineTo(s*20,-228);g.closePath();g.fill();g.fillStyle=c});
    g.beginPath();g.arc(0,-185,56,0,7);g.fill();g.fillStyle=ac;g.beginPath();g.ellipse(0,-168,26,18,0,0,7);g.fill();
    g.fillStyle='#e58a9c';g.beginPath();g.moveTo(-6,-177);g.lineTo(6,-177);g.lineTo(0,-170);g.closePath();g.fill();
    g.strokeStyle=shade(c,-.35);g.lineWidth=3;[-1,1].forEach(function(s){for(var i=0;i<3;i++){g.beginPath();g.moveTo(s*24,-170+i*5);g.lineTo(s*62,-178+i*10);g.stroke()}});
    if(k==='cat'){g.lineWidth=5;g.beginPath();g.moveTo(-9,-238);g.lineTo(-9,-226);g.moveTo(0,-240);g.lineTo(0,-228);g.moveTo(9,-238);g.lineTo(9,-226);g.stroke()}}
  else if(bk==='boy'){if(k==='girl'){g.fillStyle=shade(ac,-.65);rr(g,-58,-205,116,118,44);g.fill()}g.fillStyle=ac;[-1,1].forEach(function(s){g.beginPath();g.arc(s*50,-185,10,0,7);g.fill()});g.beginPath();g.arc(0,-188,50,0,7);g.fill();
    g.fillStyle=shade(ac,-.65);g.beginPath();g.arc(0,-192,53,Math.PI*1.04,Math.PI*1.96);g.closePath();g.fill();g.beginPath();g.arc(-8,-240,14,0,7);g.arc(14,-238,12,0,7);g.fill()}
  else{g.strokeStyle='#6f7a90';g.lineWidth=5;g.beginPath();g.moveTo(0,-232);g.lineTo(0,-262);g.stroke();g.fillStyle=ac;g.beginPath();g.arc(0,-266,8,0,7);g.fill();
    g.fillStyle=shade(c,.12);rr(g,-54,-236,108,86,20);g.fill();g.fillStyle='#10152a';rr(g,-42,-224,84,62,14);g.fill()}
  face(g,k,p,T);
  g.restore();
}
function squash(hu){return(1+.14*Math.sin(hu*Math.PI))*(hu<.12?1-.2*(1-hu/.12):hu>.88?1-.2*((hu-.88)/.12):1)}
function pose(sc,c,lt,T,idx){
  var moves=sc.steps.filter(function(s){return s.type==='move'&&s.actor===c.actor}).sort(function(a,b){return a.t-b.t});
  var x=c.x,y=c.y,face=c.flip?-1:1,lift=0,sx=1,sy=1,rot=0,phase=0,walk=false,run=false;
  for(var i=0;i<moves.length;i++){var m=moves[i],dir=m.x>x?1:m.x<x?-1:face;
    if(lt>=m.t+m.d){x=m.x;y=m.y;face=dir;continue}
    if(lt>m.t){var u=(lt-m.t)/m.d,dist=Math.abs(m.x-x);face=dir;
      if(m.style==='hop'){var n=Math.max(1,Math.round(dist/14)),hu=(u*n)%1,q=squash(hu);var he=curveAt(m.curve,'hop',u);x=lerp(x,m.x,he);y=lerp(y,m.y,he);lift=Math.sin(hu*Math.PI)*70;sy=q;sx=1/q}
      else{var e=curveAt(m.curve,m.style,u);var nx=lerp(x,m.x,e),ny=lerp(y,m.y,e);
        if(m.style==='walk'||m.style==='run'){walk=true;run=m.style==='run';phase=dist*e/(run?9:14)*Math.PI;lift=Math.abs(Math.sin(phase))*(run?14:6);if(run)rot=.1*dir}else rot=.06*dir*Math.sin(u*Math.PI);x=nx;y=ny}}
    break}
  var act=null,acts=sc.steps.filter(function(s){return s.type==='act'&&s.actor===c.actor&&lt>=s.t&&lt<=s.t+s.d});
  if(acts.length){var A0=acts[acts.length-1],au=clamp((lt-A0.t)/A0.d,0,1);act=A0.act;
    if(act==='dance'){rot+=Math.sin(T*6)*.12;lift+=Math.abs(Math.sin(T*6))*18;sy*=1+Math.abs(Math.sin(T*6))*.04}
    else if(act==='bow')rot+=.5*face*Math.sin(Math.PI*au);
    else if(act==='jump'){var jn=Math.max(1,Math.round(A0.d/.7)),jh=(au*jn)%1,jq=squash(jh);lift+=Math.sin(jh*Math.PI)*80;sy*=jq;sx*=1/jq}}
  var emo='neutral',talk=false,tx=-1,vis=null;
  sc.steps.forEach(function(s){if(s.type==='say'&&s.actor===c.actor&&lt>=s.t&&s.t>tx){tx=s.t;if(lt<=s.t+s.d){talk=true;emo=s.emo||'neutral';vis=lipFor(s,lt)}else if(lt<=s.t+s.d+.6)emo=s.emo||'neutral'}});
  var seed=(idx+1)*1.7;sy*=1+Math.sin(T*3+seed)*.012;
  return {px:x/100*W,py:y/100*H,sc:lerp(.78,1.3,clamp((y-60)/35,0,1)),face:face,lift:lift,rot:rot,sx:sx,sy:sy,phase:phase,walk:walk,run:run,act:act,emo:emo,talk:talk,vis:vis,seed:seed,y:y};
}
