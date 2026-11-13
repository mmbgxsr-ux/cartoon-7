'use strict';
/* ---------- voice recording ---------- */
var VB={};
function vkey(u){return u.length+':'+u.slice(30,60)+u.slice(-30)}
function lipFor(st,lt){
  if(st.aud){var v=VB[vkey(st.aud)];if(v&&v.env){var a=v.env[Math.floor((lt-st.t)*30)];if(a==null)a=0;return a<.14?VIS.M:[3+a*14,8+a*5]}}
  return visemeAt(st.text,(lt-st.t)/(st.d*.8));
}
function decodeVoice(u){
  var k=vkey(u);if(VB[k]&&VB[k].buf)return Promise.resolve(VB[k]);if(VB[k]&&VB[k].p)return VB[k].p;
  if(!auInit())return Promise.resolve(null);
  var i=u.indexOf('base64,'),bin,arr;try{bin=atob(u.slice(i+7));arr=new Uint8Array(bin.length);for(var j=0;j<bin.length;j++)arr[j]=bin.charCodeAt(j)}catch(e){return Promise.resolve(null)}
  var p=new Promise(function(res){
    var done=function(buf){var d=buf.getChannelData(0),hop=Math.max(1,Math.round(buf.sampleRate/30)),env=[],mx=1e-4;
      for(var o=0;o<d.length;o+=hop){var sq=0,c=0,e2=Math.min(d.length,o+hop);for(var q=o;q<e2;q++){sq+=d[q]*d[q];c++}var r=Math.sqrt(sq/Math.max(1,c));env.push(r);if(r>mx)mx=r}
      env=env.map(function(x){return x/mx});env=env.map(function(x,n){return (x*2+(env[n-1]||0)+(env[n+1]||0))/4});
      VB[k]={buf:buf,dur:buf.duration,env:env};res(VB[k])};
    try{AU.ctx.decodeAudioData(arr.buffer,done,function(){delete VB[k];res(null)})}catch(e){delete VB[k];res(null)}});
  VB[k]={p:p};return p;
}
function prepAll(){var ps=[];P.scenes.forEach(function(sc){sc.steps.forEach(function(x){if(x.aud){var v=VB[vkey(x.aud)];if(!v||!v.buf)ps.push(decodeVoice(x.aud))}})});return ps}
function playVoice(u){var v=VB[vkey(u)];if(!v||!v.buf||!AU.ctx)return;var src=AU.ctx.createBufferSource();src.buffer=v.buf;src.connect(AU.sfx);src.start(AU.ctx.currentTime);
  (AU.voices=AU.voices||[]).push(src);src.onended=function(){AU.voices=(AU.voices||[]).filter(function(x){return x!==src})}}
function stopVoices(){(AU.voices||[]).forEach(function(x){try{x.stop()}catch(e){}});AU.voices=[]}
function findStep(id){for(var i=0;i<P.scenes.length;i++)for(var j=0;j<P.scenes[i].steps.length;j++)if(P.scenes[i].steps[j].id===id)return{st:P.scenes[i].steps[j],sc:P.scenes[i]};return null}
function attachVoice(id,url){
  var f=findStep(id);if(!f)return;if(url.length>2400000){toast('التسجيل طويل جدًا، سجّل جملة أقصر');return}
  f.st.aud=url;
  decodeVoice(url).then(function(v){if(v){f.st.d=Math.min(30,Math.max(.3,Math.ceil((v.dur+.2)*10)/10));f.sc.dur=Math.min(40,Math.max(f.sc.dur,Math.ceil(f.st.t+f.st.d)))}
    refresh();renderPanel();toast(v?'تم حفظ التسجيل':'حُفظ التسجيل، لكن تعذر تحليله')});
}
function startVoice(id){
  if(S.mic){stopVoice();return}
  if(S.playing||S.rec){toast('أوقف التشغيل أولًا');return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){toast('الميكروفون غير مدعوم في هذا المتصفح');return}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stm){
    var mt=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].filter(function(m){return MediaRecorder.isTypeSupported(m)})[0],rec;
    try{rec=new MediaRecorder(stm,mt?{mimeType:mt,audioBitsPerSecond:48000}:{audioBitsPerSecond:48000})}catch(e){stm.getTracks().forEach(function(t){t.stop()});toast('تعذر بدء التسجيل');return}
    var ch=[];rec.ondataavailable=function(e){if(e.data&&e.data.size)ch.push(e.data)};
    rec.onstop=function(){stm.getTracks().forEach(function(t){t.stop()});var m=S.mic;if(m)clearTimeout(m.to);S.mic=null;
      if(!m||!ch.length){renderPanel();return}
      var fr=new FileReader();fr.onload=function(){attachVoice(id,fr.result)};fr.readAsDataURL(new Blob(ch,{type:rec.mimeType||mt||'audio/webm'}))};
    S.mic={id:id,rec:rec,to:setTimeout(stopVoice,20000)};rec.start();renderPanel();toast('جارٍ التسجيل. اضغط «إيقاف» عند الانتهاء');
  }).catch(function(){toast('الميكروفون غير متاح. اسمح بالوصول إليه، أو افتح الملف مباشرة في المتصفح')});
}
function stopVoice(){var m=S.mic;if(!m)return;try{if(m.rec.state!=='inactive')m.rec.stop()}catch(e){}}
function pickVoiceFile(id){
  var f=document.createElement('input');f.type='file';f.accept='audio/*,.mp3,.m4a,.wav,.ogg,.webm,.aac';
  f.onchange=function(){var fl=f.files&&f.files[0];if(!fl)return;if(fl.size>1700000){toast('الملف كبير ('+(fl.size/1048576).toFixed(1)+' ميجا). الحد الأقصى 1.7 ميجا للجملة، قصّه أو اختر ملفًا أصغر');return}
    var fr=new FileReader();fr.onload=function(){var u=String(fr.result);if(!/^data:audio\//.test(u)){var t=fl.type&&/^audio\//.test(fl.type)?fl.type:'audio/mpeg';u='data:'+t+';base64,'+u.slice(u.indexOf('base64,')+7)}attachVoice(id,u)};fr.onerror=function(){toast('تعذر قراءة الملف')};fr.readAsDataURL(fl)};f.click()}
function voiceRow(st){
  var rec=S.mic&&S.mic.id===st.id,h='<div class="row"><button class="btn sm'+(rec?' pri':'')+'" data-a="rec-voice" data-id="'+st.id+'">'+(rec?'■ إيقاف التسجيل':'🎙 سجّل صوتي')+'</button><button class="btn sm" data-a="file-voice" data-id="'+st.id+'">📁 صوت من ملف</button>';
  if(st.aud)h+='<button class="btn sm" data-a="play-voice" data-id="'+st.id+'">▶ استمع</button><button class="btn sm dng" data-a="del-voice" data-id="'+st.id+'">حذف التسجيل</button>';
  h+='</div>';if(st.aud)h+='<p class="hint">صوتك مسجّل، وفم الشخصية يتبعه. مدة الجملة صارت بطول التسجيل.</p>';return h;
}
