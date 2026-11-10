'use strict';
/* ---------- playback ---------- */
/* The audio clock is the master: sounds are scheduled on AudioContext time, so after a main-thread stall the
   picture must jump to where the audio already is. While the context is not running (e.g. suspended by autoplay
   policy) fall back to the frame clock and keep AU.base continuous so audio can take over without a jump. */
function tick(now){
  if(!S.playing)return;var prev=S.T,c=AU.ctx,dt=(now-S.last)/1000;S.last=now;
  if(c&&c.state==='running')S.T=Math.max(prev,c.currentTime-AU.base);
  else{S.T+=Math.min(.1,dt);if(c)AU.base=c.currentTime-S.T}
  if(S.T>S.end)S.T=S.end;fireEv(prev,S.T);musicTick(S.T);
  if(S.T>=S.end){S.T=S.end;S.playing=false}
  drawNow();updateUI();if(S.playing)requestAnimationFrame(tick);else if(S.rec)endRec(false)
}
function play(only){
  if(S.playing){play0(only);return}
  auInit();var ps=prepAll();if(ps.length)Promise.all(ps).then(function(){play0(only)});else play0(only)
}
function play0(only){
  if(S.playing){S.playing=false;stopVoices();updateUI();return}
  if(only){var sg=SEG[S.si];if(S.T<sg.t0||S.T>=sg.t1-.05)S.T=sg.t0;S.end=sg.t1}
  else{S.end=TOTAL;if(S.T>=TOTAL-.05)S.T=0}
  auInit();AU.base=AU.ctx?AU.ctx.currentTime-S.T:0;AU.nextE=null;evSeek(S.T);
  S.playing=true;S.last=performance.now();requestAnimationFrame(tick);updateUI()
}
function seekScene(i){stopVoices();S.si=i;S.T=SEG[i].t0+.01;S.playing=false;drawNow();updateUI();renderStrip()}
