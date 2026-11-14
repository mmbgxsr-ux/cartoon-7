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
/* مؤثرات بصرية مؤقتة (خطوة fx): التنفّس خلف الشخصيات، والإنذار والنبض فوقها */
function heartPath(g,x,y,s){g.beginPath();g.moveTo(x,y+.9*s);g.bezierCurveTo(x-1.4*s,y-.1*s,x-.7*s,y-1.1*s,x,y-.4*s);g.bezierCurveTo(x+.7*s,y-1.1*s,x+1.4*s,y-.1*s,x,y+.9*s);g.closePath()}
function drawOvl(g,s,u){
  var d=s.d,a=Math.min(clamp(u/.4,0,1),clamp((d-u)/.4,0,1));if(a<=0)return;
  g.save();
  if(s.fx==='breath'){
    var bt=breathAt(u,d),k=bt.ph===0?ease(bt.p):bt.ph===1?1:1-ease(bt.p),r=lerp(70,150,k),cx=W/2,cy=H*.24,
        col=bt.ph===0?'120,200,255':bt.ph===1?'190,170,255':'130,230,190',lab=bt.ph===0?'شهيق':bt.ph===1?'ثبّت':'زفير';
    g.globalAlpha=a;
    var gr=g.createRadialGradient(cx,cy,r*.2,cx,cy,r*1.5);gr.addColorStop(0,'rgba('+col+',.55)');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,r*1.5,0,7);g.fill();
    g.fillStyle='rgba('+col+',.42)';g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=6;g.beginPath();g.arc(cx,cy,r,0,7);g.fill();g.stroke();
    /* حلقة تقدّم تمتلئ مع الشهيق وتفرغ مع الزفير */
    var fr=bt.ph===0?bt.p:bt.ph===1?1:1-bt.p;g.strokeStyle='#fff';g.lineWidth=9;g.lineCap='round';g.beginPath();g.arc(cx,cy,r+14,-Math.PI/2,-Math.PI/2+Math.PI*2*fr);g.stroke();
    g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.shadowColor='rgba(0,60,120,.45)';g.shadowBlur=8;
    g.font='800 50px '+FONT;g.fillText(lab,cx,cy-(bt.ph===1?0:16));
    if(bt.ph!==1){g.font='800 38px '+FONT;g.fillText(String(Math.max(1,Math.ceil(bt.left-.001))).replace(/\d/g,function(c){return '٠١٢٣٤٥٦٧٨٩'.charAt(+c)}),cx,cy+36)}}
  else if(s.fx==='alert'){
    var ph0=(u%.5)/.5,bb=Math.exp(-ph0*5),v=g.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.9);
    /* الوميض يبدأ مع أول لحظة من كل صافرة فيتطابق الصوت والصورة */
    v.addColorStop(0,'rgba(255,30,30,'+(a*.12*bb).toFixed(3)+')');v.addColorStop(1,'rgba(255,30,30,'+(a*(.2+.5*bb)).toFixed(3)+')');g.fillStyle=v;g.fillRect(0,0,W,H);
    var cx2=210,cy2=135,sz=40*(1+.25*bb);
    g.globalAlpha=a*(1-ph0)*.7;g.strokeStyle='#ff3b3b';g.lineWidth=6;g.beginPath();g.arc(cx2,cy2+sz*.2,sz+ph0*150,0,7);g.stroke();
    g.globalAlpha=a;g.fillStyle='#e63946';g.strokeStyle='#fff';g.lineWidth=6;g.lineJoin='round';
    g.beginPath();g.moveTo(cx2,cy2-sz);g.lineTo(cx2+sz*1.15,cy2+sz*.8);g.lineTo(cx2-sz*1.15,cy2+sz*.8);g.closePath();g.stroke();g.fill();
    g.fillStyle='#fff';g.font='800 '+Math.round(sz*1.1)+'px '+FONT;g.textAlign='center';g.textBaseline='middle';g.fillText('!',cx2,cy2+sz*.2)}
  else if(s.fx==='pulse'){
    var ph=(u%.5)/.5,b=Math.max(Math.exp(-ph*8),ph>.3?.7*Math.exp(-(ph-.3)*8):0),v2=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.9);
    v2.addColorStop(0,'rgba(255,40,70,0)');v2.addColorStop(1,'rgba(255,40,70,'+(a*(.1+.35*b)).toFixed(3)+')');g.fillStyle=v2;g.fillRect(0,0,W,H);
    var hx=W/2,hy=H*.11,hs=34*(1+.4*b);g.globalAlpha=a*(1-ph)*.6;g.strokeStyle='#ff4d6d';g.lineWidth=5;g.beginPath();g.arc(hx,hy+4,hs*.9+ph*110,0,7);g.stroke();
    g.globalAlpha=a;g.fillStyle='#e5173f';g.strokeStyle='#fff';g.lineWidth=5;heartPath(g,hx,hy,hs);g.stroke();g.fill()}
  else if(s.fx==='badge'&&s.label){
    var vw=s.label.indexOf('=')>=0,ek=ease(clamp(u/.25,0,1)),bs=.85+.15*ek,cap=(P.dlg||'bubble')==='caption';
    g.font='800 '+(vw?36:38)+'px '+FONT;g.textAlign='center';g.textBaseline='middle';
    var bw=Math.max(vw?280:220,g.measureText(s.label).width+(vw?130:64)),bh=vw?64:70,cx,cy;
    if(!vw){cx=W-36-bw/2;cy=66}else if(cap){cx=36+bw/2;cy=66}else{cx=W/2;cy=H-40+(1-ek)*26}
    g.globalAlpha=a;g.translate(cx,cy);g.scale(bs,bs);
    g.shadowColor='rgba(0,0,0,.28)';g.shadowBlur=14;g.shadowOffsetY=4;
    g.fillStyle=vw?'#bde0fe':'#ffd166';g.strokeStyle='#fff';g.lineWidth=6;g.lineJoin='round';
    g.beginPath();var rr2=bh/2;g.moveTo(-bw/2+rr2,-bh/2);g.lineTo(bw/2-rr2,-bh/2);g.arc(bw/2-rr2,0,rr2,-Math.PI/2,Math.PI/2);g.lineTo(-bw/2+rr2,bh/2);g.arc(-bw/2+rr2,0,rr2,Math.PI/2,Math.PI*1.5);g.closePath();g.stroke();g.fill();
    g.shadowColor='transparent';g.fillStyle=vw?'#0b3a66':'#4a2c00';
    if(vw){var ix=bw/2-44;g.strokeStyle='#0b3a66';g.lineWidth=4;g.beginPath();g.moveTo(ix-14,-10);g.lineTo(ix,-6);g.lineTo(ix+14,-10);g.lineTo(ix+14,10);g.lineTo(ix,14);g.lineTo(ix-14,10);g.closePath();g.moveTo(ix,-6);g.lineTo(ix,14);g.stroke();g.fillText(s.label,-22,2)}
    else g.fillText(s.label,0,2)}
  g.restore();
}
/* الكاميرا: دالة حتمية من الزمن (تصلح للتشغيل والتصدير إطارًا بإطار) */
function camHold(sc,lt){var h=0;sc.steps.forEach(function(x){if(x.type==='fx'&&x.fx==='badge'&&(x.label||'').indexOf('=')<0&&lt>x.t)h+=Math.min(lt,x.t+x.d)-x.t});return h}
function speakerX(sc,lt){var b=null,i=-1;sc.steps.forEach(function(x){if(x.type==='say'&&(x.text||'').trim()&&lt>=x.t&&lt<=x.t+x.d)b=x});if(!b)return null;
  sc.cast.forEach(function(c,k){if(c.actor===b.actor)i=k});return i<0?null:pose(sc,sc.cast[i],lt,lt,i).px}
function camState(sc,lt){
  var c=sc.cam||'fixed',s=1,tx=0,ty=0,hold=camHold(sc,lt),span=Math.max(1,sc.dur-camHold(sc,sc.dur)),t0=Math.max(0,lt-hold),e=ease(clamp(t0/span,0,1));
  if(c==='zin')s=lerp(1,1.1,ease(clamp((t0-1.2)/Math.max(1,span-1.2),0,1)));
  else if(c==='zout')s=lerp(1.1,1,e);
  else if(c==='panr'){s=1.1;tx=lerp(W*.04,-W*.04,e)}else if(c==='panl'){s=1.1;tx=lerp(-W*.04,W*.04,e)}
  else if(c==='shake'){s=1.04;tx=Math.sin(lt*45)*8;ty=Math.cos(lt*37)*6}
  else if(c==='follow'){
    var u=ease(clamp((lt-.6)/.9,0,1)),sum=0,k,tt,xx,b=0;s=lerp(1,1.1,u);
    for(k=0;k<6;k++){tt=lt-k*.12;xx=tt>=0?speakerX(sc,tt):null;sum+=xx==null?W/2:xx}
    tx=clamp((W/2-sum/6)*.5,-W*.045,W*.045)*u;
    sc.steps.forEach(function(x){if(x.type==='say'&&(x.emo==='surprised'||x.emo==='scared')&&lt>=x.t&&lt<=x.t+x.d){var q=lt-x.t;b=Math.max(b,clamp(Math.min(q/.25,(x.d-q)/.3),0,1))}});
    s+=.06*ease(b)}
  sc.steps.forEach(function(x){if(x.type==='fx'&&x.fx==='alert'&&lt>=x.t&&lt<=x.t+x.d){var ph=(lt-x.t)%.5;if(ph<.18){var a=7*(1-ph/.18);tx+=Math.sin(lt*90)*a;ty+=Math.cos(lt*70)*a*.7;s=Math.max(s,1.03)}}});
  var mx=W/2*(s-1)/s,my=H/2*(s-1)/s;/* لا يظهر خارج الخلفية أبدًا */
  return{s:s,tx:clamp(tx,-mx,mx),ty:clamp(ty,-my,my)}}
function camXf(g,sc,lt){var c=camState(sc,lt);if(c.s===1&&!c.tx&&!c.ty)return;g.translate(W/2,H/2);g.scale(c.s,c.s);g.translate(-W/2+c.tx,-H/2+c.ty)}
function camPt(sc,lt,x,y){var c=camState(sc,lt);return{x:W/2+c.s*(x-W/2+c.tx),y:H/2+c.s*(y-H/2+c.ty)}}
function drawScene(g,sc,lt,T){
  g.save();camXf(g,sc,lt);
  if(sc.kind==='card')drawCardBG(g,sc);else if(sc.bg==='photo'&&sc.bgImg)drawPhotoBG(g,sc);else drawBG(g,sc.bg==='photo'?'day':sc.bg,T);
  sc.steps.forEach(function(s){if(s.type==='fx'&&s.fx==='breath'&&lt>=s.t&&lt<=s.t+s.d)drawOvl(g,s,lt-s.t)});
  var ps=sc.cast.map(function(c,i){return{c:c,p:pose(sc,c,lt,T,i)}}).sort(function(a,b){return a.p.y-b.p.y});
  ps.forEach(function(o){drawActor(g,actorOf(o.c.actor),o.p,T)});
  drawFX(g,sc.fx,T);
  sc.steps.forEach(function(s){if(s.type==='fx'&&s.fx!=='breath'&&s.fx!=='badge'&&lt>=s.t&&lt<=s.t+s.d)drawOvl(g,s,lt-s.t)});
  if(sc.kind==='card')drawCardText(g,sc,lt);
  g.restore();
  if((P.dlg||'bubble')!=='bubble')drawCaption(g,sc,lt);
  var gr=g.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.95);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  if((P.dlg||'bubble')!=='caption'){
    var vocab=[],badgeOn=false;
    sc.steps.forEach(function(x){if(x.type==='fx'&&x.fx==='badge'&&x.label&&lt>=x.t&&lt<=x.t+x.d){
      if(x.label.indexOf('=')<0)badgeOn=true;else x.label.split('·').forEach(function(q){var w=vocabKey(q.split('=')[0]);if(w)vocab.push(w)})}});
    sc.steps.forEach(function(x){if(x.type==='say'&&lt>=x.t&&lt<=x.t+x.d){
      var o=ps.filter(function(q){return q.c.actor===x.actor})[0];if(!o)return;
      var pt=camPt(sc,lt,o.p.px,o.p.py-o.p.lift-300*o.p.sc),ac=actorOf(x.actor);
      bubble(g,x.text||'',pt.x,pt.y,(lt-x.t)/(x.d*.8),{emo:x.emo,name:ac&&ac.name,col:ac&&ac.color,u:lt-x.t,d:x.d,noRight:badgeOn?1000:0,vocab:vocab})}})}
  sc.steps.forEach(function(x){if(x.type==='fx'&&x.fx==='badge'&&x.label&&lt>=x.t&&lt<=x.t+x.d)drawOvl(g,x,lt-x.t)});
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
