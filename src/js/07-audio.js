'use strict';
/* ---------- audio ---------- */
var SFXN={pop:'فقاعة',boing:'نطّة',whoosh:'سرعة',ding:'جرس',sad:'حزن',tada:'تاداا',step:'خطوة',drum:'طبلة'};
var MUSN={none:'بدون',happy:'مرح',calm:'هادئ',adventure:'مغامرة'};
var MOODS={happy:{bpm:124,root:261.6,scale:[0,2,4,7,9],prog:[0,5,7,5],perc:1},calm:{bpm:84,root:220,scale:[0,2,4,7,9],prog:[0,7,5,7],perc:0},adventure:{bpm:144,root:196,scale:[0,3,5,7,10],prog:[0,3,5,7],perc:1}};
var AU={ctx:null,muted:false,base:0,nextE:null};
function auInit(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return true}
  var C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
  try{AU.ctx=new C()}catch(e){return false}
  var c=AU.ctx;AU.master=c.createGain();AU.listen=c.createGain();AU.sfx=c.createGain();AU.mus=c.createGain();
  AU.sfx.connect(AU.master);AU.mus.connect(AU.master);AU.master.connect(AU.listen);AU.listen.connect(c.destination);
  AU.listen.gain.value=AU.muted?0:1;
  try{AU.dest=c.createMediaStreamDestination();AU.master.connect(AU.dest)}catch(e){AU.dest=null}
  AU.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);var d=AU.noise.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  if(c.state==='suspended')c.resume();return true;
}
function tone(f,t,d,type,v,f2,out){
  t=Math.max(0,t);
  var o=AU.ctx.createOscillator(),gn=AU.ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(v||.2,t+.012);gn.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(gn);gn.connect(out||AU.sfx);o.start(t);o.stop(t+d+.03);
}
function noiseHit(t,d,v,f1,f2,out){
  t=Math.max(0,t);
  var s=AU.ctx.createBufferSource(),bp=AU.ctx.createBiquadFilter(),gn=AU.ctx.createGain();s.buffer=AU.noise;bp.type='bandpass';bp.Q.value=1.2;
  bp.frequency.setValueAtTime(f1,t);bp.frequency.exponentialRampToValueAtTime(f2,t+d);
  gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(v,t+d*.3);gn.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(bp);bp.connect(gn);gn.connect(out||AU.sfx);s.start(t);s.stop(t+d+.05);
}
function playSfx(k){
  if(!AU.ctx)return;var n=AU.ctx.currentTime;
  if(k==='pop')tone(520,n,.12,'sine',.5,980);
  else if(k==='boing'){tone(180,n,.38,'sine',.5,520);tone(360,n,.38,'triangle',.2,1040)}
  else if(k==='whoosh')noiseHit(n,.55,.5,400,3200);
  else if(k==='ding'){tone(1318,n,.8,'sine',.35);tone(1976,n+.02,.6,'sine',.18)}
  else if(k==='sad'){tone(392,n,.3,'triangle',.4,370);tone(311,n+.3,.6,'triangle',.4,220)}
  else if(k==='tada'){[523,659,784,1047].forEach(function(f,i){tone(f,n+i*.09,i===3?.7:.2,'triangle',.35)})}
  else if(k==='step')tone(110,n,.08,'sine',.5,70);
  else if(k==='drum'){tone(150,n,.28,'sine',.8,45);noiseHit(n,.12,.3,1500,500)}
}
function blip(pc){if(AU.ctx)tone(200*pc*(1+Math.random()*.4),AU.ctx.currentTime,.06,'square',.09)}
function evSeek(T){var i=0;while(i<EV.length&&EV[i].T<T-.0005)i++;S.ep=i}
function fireEv(prev,now){
  while(S.ep<EV.length&&EV[S.ep].T<=now){var e=EV[S.ep];if(e.T>prev-.001){if(e.k==='sfx')playSfx(e.v);else if(e.k==='voice')playVoice(e.v);else blip(e.v)}S.ep++}
}
function musicTick(T){
  var m=MOODS[P.music];if(!AU.ctx||!m)return;
  var fade=S.end>=TOTAL-.01?clamp((TOTAL-T)/1.2,0,1):1;AU.mus.gain.value=(P.vol==null?.6:P.vol)*.5*fade;
  var e=60/m.bpm/2;if(AU.nextE==null)AU.nextE=Math.ceil(T/e);
  while(AU.nextE*e<T+.25){
    var i=AU.nextE,tt=AU.base+i*e;
    if(tt>AU.ctx.currentTime-.02){
      var chord=m.prog[Math.floor(i/8)%m.prog.length],pat=[0,2,1,3,2,4,3,1][i%8],deg=m.scale[pat%m.scale.length];
      tone(m.root*2*Math.pow(2,(chord+deg)/12),tt,e*1.6,'triangle',.5,null,AU.mus);
      if(i%4===0)tone(m.root/2*Math.pow(2,chord/12),tt,e*3,'sine',.9,null,AU.mus);
      if(m.perc){if(i%4===0)tone(140,tt,.12,'sine',.8,45,AU.mus);else if(i%2===1)noiseHit(tt,.05,.25,6000,8000,AU.mus)}
    }
    AU.nextE++;
  }
}
