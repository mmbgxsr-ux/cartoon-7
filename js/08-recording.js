'use strict';
/* ---------- recording and saving ---------- */
function pickMime(){var c=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  for(var i=0;i<c.length;i++){try{if(MediaRecorder.isTypeSupported(c[i]))return c[i]}catch(e){}}return ''}
function startRec(){
  if(S.rec)return;
  if(!window.MediaRecorder||!cv.captureStream){toast('متصفحك لا يدعم تسجيل الفيديو');return}
  auInit();S.playing=false;S.T=0;S.si=0;LAST=null;
  var qh=parseInt(P.qh)||720,fps=parseInt(P.fps)||30,bps=qh>=1080?12000000:qh<=480?4000000:8000000;
  cv.width=Math.round(qh*16/9/2)*2;cv.height=qh;drawNow();
  var st=cv.captureStream(fps);if(AU.dest)AU.dest.stream.getAudioTracks().forEach(function(t){st.addTrack(t)});
  var mime=pickMime(),rec;
  try{rec=new MediaRecorder(st,mime?{mimeType:mime,videoBitsPerSecond:bps}:{videoBitsPerSecond:bps})}catch(e){cv.width=1280;cv.height=720;drawNow();toast('تعذر بدء التسجيل');return}
  var chunks=[];rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
  rec.onstop=function(){var r=S.rec;S.rec=null;cv.width=1280;cv.height=720;drawNow();
    if(r&&!r.cancel&&chunks.length){var type=rec.mimeType||mime||'video/webm';LAST={blob:new Blob(chunks,{type:type}),ext:type.indexOf('mp4')>-1?'mp4':'webm'};toast('الفيديو جاهز للحفظ')}
    else toast('أُلغي التسجيل');
    updateUI();if(S.tab==='out')renderPanel()};
  S.rec={rec:rec,cancel:false,stopping:false};rec.start(250);renderStrip();play(false);
}
function endRec(cancel){
  var r=S.rec;if(!r||r.stopping)return;r.stopping=true;r.cancel=!!cancel;S.playing=false;
  setTimeout(function(){try{if(r.rec.state!=='inactive')r.rec.stop()}catch(e){}},cancel?0:500);
}
