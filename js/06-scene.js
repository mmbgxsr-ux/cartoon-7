'use strict';
/* ---------- scene + frame ---------- */
var FXP=(function(){var r=rnd(11),a=[];for(var i=0;i<140;i++)a.push([r(),r(),r()*.6+.7,r()*6]);return a})();
function drawFX(g,k,T){
  if(k==='rain'){g.fillStyle='rgba(30,50,90,.14)';g.fillRect(0,0,W,H);g.strokeStyle='rgba(200,225,255,.7)';g.lineWidth=2;g.beginPath();
    FXP.forEach(function(p){var y=((p[1]*H+T*p[2]*1100)%(H+60))-30,x=p[0]*W-y*.18;g.moveTo(x,y);g.lineTo(x-6,y+22)});g.stroke()}
  else if(k==='snow'){g.fillStyle='rgba(255,255,255,.92)';FXP.forEach(function(p){var y=((p[1]*H+T*p[2]*90)%(H+20))-10,x=p[0]*W+Math.sin(T*1.2+p[3])*24;g.beginPath();g.arc(x,y,2+p[2]*2.5,0,7);g.fill()})}
  else if(k==='sparkle'){g.lineWidth=2;g.lineCap='round';FXP.slice(0,36).forEach(function(p){var a=.5+.5*Math.sin(T*3+p[3]),r=6+p[2]*8*a,x=p[0]*W,y=p[1]*H*.9;
    g.strokeStyle='rgba(255,240,170,'+a.toFixed(2)+')';g.beginPath();g.moveTo(x-r,y);g.lineTo(x+r,y);g.moveTo(x,y-r);g.lineTo(x,y+r);g.stroke()})}
}
function camXf(g,sc,lt){
  var c=sc.cam||'fixed';if(c==='fixed')return;
  var e=ease(clamp(lt/sc.dur,0,1)),s=1,tx=0,ty=0;
  if(c==='zin')s=lerp(1,1.22,e);else if(c==='zout')s=lerp(1.22,1,e);
  else if(c==='panr'){s=1.14;tx=lerp(W*.055,-W*.055,e)}else if(c==='panl'){s=1.14;tx=lerp(-W*.055,W*.055,e)}
  else if(c==='shake'){s=1.04;tx=Math.sin(lt*45)*8;ty=Math.cos(lt*37)*6}
  g.translate(W/2,H/2);g.scale(s,s);g.translate(-W/2+tx,-H/2+ty);
}
function drawScene(g,sc,lt,T){
  g.save();camXf(g,sc,lt);
  if(sc.kind==='card')drawCardBG(g,sc);else if(sc.bg==='photo'&&sc.bgImg)drawPhotoBG(g,sc);else drawBG(g,sc.bg==='photo'?'day':sc.bg,T);
  var ps=sc.cast.map(function(c,i){return{c:c,p:pose(sc,c,lt,T,i)}}).sort(function(a,b){return a.p.y-b.p.y});
  ps.forEach(function(o){drawActor(g,actorOf(o.c.actor),o.p,T)});
  drawFX(g,sc.fx,T);
  if(sc.kind==='card')drawCardText(g,sc,lt);
  sc.steps.forEach(function(s){if((P.dlg||'bubble')!=='caption'&&s.type==='say'&&lt>=s.t&&lt<=s.t+s.d){
    var o=ps.filter(function(q){return q.c.actor===s.actor})[0];if(!o)return;
    bubble(g,s.text||'',o.p.px,o.p.py-o.p.lift-300*o.p.sc,(lt-s.t)/(s.d*.8))}});
  g.restore();
  if((P.dlg||'bubble')!=='bubble')drawCaption(g,sc,lt);
  var gr=g.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.95);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  var idx=P.scenes.indexOf(sc),tr=sc.trans||'fade',nx=P.scenes[idx+1],ntr=nx?(nx.trans||'fade'):'fade';
  var fi=(idx<=0||tr==='fade')?lt/.35:1,fo=(!nx||ntr==='fade')?(sc.dur-lt)/.35:1,f=Math.min(fi,fo);
  if(f<1){g.fillStyle='rgba(0,0,0,'+(1-clamp(f,0,1))+')';g.fillRect(0,0,W,H)}
}
function drawCaption(g,sc,lt){
  var act=sc.steps.filter(function(s){return s.type==='say'&&(s.text||'').trim()&&lt>=s.t&&lt<=s.t+s.d});if(!act.length)return;
  var s=act[act.length-1];g.save();g.font='700 38px '+FONT;g.direction='rtl';g.textAlign='center';g.textBaseline='middle';
  var lines=wrap(g,s.text,W-260).slice(0,3),lh=52,bh=lines.length*lh+24,mw=Math.max.apply(null,lines.map(function(l){return g.measureText(l).width})),bw=Math.min(W-100,mw+70),by=H-40-bh;
  g.fillStyle='rgba(0,0,0,.62)';rr(g,W/2-bw/2,by,bw,bh,16);g.fill();g.fillStyle='#fff';lines.forEach(function(l,i){g.fillText(l,W/2,by+12+lh/2+i*lh)});g.restore();
}
function applyGrade(g){
  var k=P.grade;if(!k||k==='none')return;g.save();
  function lay(op,col){g.globalCompositeOperation=op;g.fillStyle=col;g.fillRect(0,0,W,H)}
  function vig(a){var r=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,'+a+')');lay('source-over',r)}
  if(k==='warm'){lay('soft-light','rgba(255,150,40,.55)');lay('source-over','rgba(255,190,110,.07)')}
  else if(k==='cool'){lay('soft-light','rgba(60,130,255,.55)');lay('source-over','rgba(120,170,255,.06)')}
  else if(k==='cinema'){var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(0,140,170,.65)');gr.addColorStop(1,'rgba(255,140,50,.6)');lay('soft-light',gr);lay('multiply','rgb(235,235,245)');vig(.38)}
  else if(k==='vintage'){lay('saturation','rgba(128,128,128,.45)');lay('soft-light','rgba(200,140,70,.65)');lay('multiply','rgb(255,240,215)');vig(.3)}
  else if(k==='noir'){lay('saturation','rgb(128,128,128)');lay('soft-light','rgba(0,0,0,.4)');vig(.35)}
  else if(k==='bright'){lay('soft-light','rgba(255,255,255,.5)')}
  g.restore();
}
function draw(g,T){
  var sg=segAt(T),sc=P.scenes[sg.i],lt=T-sg.t0,tr=sc.trans||'fade',TD=.6;
  if(sg.i>0&&lt<TD&&(tr==='cross'||tr==='wipe'||tr==='slide')){
    var pv=P.scenes[sg.i-1],u=ease(clamp(lt/TD,0,1));
    if(tr==='cross'){drawScene(g,pv,pv.dur-.001,T);g.save();g.globalAlpha=u;drawScene(g,sc,lt,T);g.restore()}
    else if(tr==='wipe'){drawScene(g,pv,pv.dur-.001,T);g.save();g.beginPath();g.rect(W*(1-u),0,W*u,H);g.clip();drawScene(g,sc,lt,T);g.restore()}
    else{g.save();g.translate(-u*W,0);drawScene(g,pv,pv.dur-.001,T);g.restore();g.save();g.translate((1-u)*W,0);drawScene(g,sc,lt,T);g.restore()}
  }else drawScene(g,sc,lt,T);
  applyGrade(g);
}
var cv=$('#cv'),g=cv.getContext('2d');
function drawNow(){g.setTransform(cv.width/W,0,0,cv.width/W,0,0);draw(g,S.T)}
