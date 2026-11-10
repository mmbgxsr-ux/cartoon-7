'use strict';
/* ---------- offline frame-by-frame MP4 export (WebCodecs + mp4-muxer) ---------- */
/* mp4-muxer source: embedded by the build (works offline), else src/vendor (dev server), else the CDN. */
function muxerEmbedded(){return !!document.getElementById('vendor-mp4-muxer')}
async function loadMuxer(){
  var el=document.getElementById('vendor-mp4-muxer');
  if(el)return import(URL.createObjectURL(new Blob([el.textContent],{type:'text/javascript'})));
  try{return await import('./src/vendor/mp4-muxer.mjs')}catch(e){}
  return import('https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.mjs');
}
async function offlineExport(){
  if(S.rec||S.playing)return;
  if(!window.VideoEncoder||!window.AudioEncoder||!window.OfflineAudioContext||!window.AudioData){toast('التصدير عالي الجودة يحتاج متصفح Chrome أو Edge حديثًا');return}
  var qh=parseInt(P.qh)||720,fps=parseInt(P.fps)||30,W2=Math.round(qh*16/9/2)*2,H2=qh,SR=48000,err=null;
  var ks=['ctx','master','listen','sfx','mus','dest','noise','base','nextE','voices'],snap={};ks.forEach(function(k){snap[k]=AU[k]});
  S.rec={rec:{state:'inactive'},cancel:false,stopping:false,hq:true};renderStrip();toast(muxerEmbedded()?'جارٍ التجهيز':'جارٍ التجهيز، قد يلزم اتصال بالإنترنت لتحميل مكتبة MP4');
  var ve=null,ae=null,wait=function(ms){return new Promise(function(r){setTimeout(r,ms)})},chk=function(){if(S.rec&&S.rec.cancel)throw 'cancel';if(err)throw err};
  try{
    auInit();await Promise.all(prepAll());stopVoices();
    var M=await loadMuxer();
    var vcfg={codec:'avc1.64002A',width:W2,height:H2,bitrate:qh>=1080?12e6:qh<=480?4e6:8e6,framerate:fps},acfg={codec:'mp4a.40.2',sampleRate:SR,numberOfChannels:2,bitrate:128000};
    if(!(await VideoEncoder.isConfigSupported(vcfg)).supported||!(await AudioEncoder.isConfigSupported(acfg)).supported)throw new Error('الترميز H.264/AAC غير مدعوم هنا');
    var tgt=new M.ArrayBufferTarget(),mux=new M.Muxer({target:tgt,video:{codec:'avc',width:W2,height:H2},audio:{codec:'aac',numberOfChannels:2,sampleRate:SR},fastStart:'in-memory'});
    /* 1) render the whole soundtrack offline, driving the same scheduler with virtual time */
    var oc=new OfflineAudioContext(2,Math.ceil(TOTAL*SR),SR),OT=0;
    Object.defineProperty(oc,'currentTime',{get:function(){return OT}});
    var mg=oc.createGain(),sg=oc.createGain(),mn=oc.createGain(),mreal=mn.gain;mg.connect(oc.destination);sg.connect(mg);mn.connect(mg);
    Object.defineProperty(mn,'gain',{get:function(){return {set value(v){mreal.setValueAtTime(v,OT)}}}});
    AU.ctx=oc;AU.master=mg;AU.listen=mg;AU.sfx=sg;AU.mus=mn;AU.dest=null;AU.voices=[];
    AU.noise=oc.createBuffer(1,SR,SR);var nd=AU.noise.getChannelData(0);for(var q=0;q<nd.length;q++)nd[q]=Math.random()*2-1;
    S.end=TOTAL;AU.base=0;AU.nextE=null;evSeek(0);
    var F=Math.ceil(TOTAL*fps),prev=-1;
    for(var i=0;i<=F;i++){var T=Math.min(TOTAL,i/fps);OT=T;fireEv(prev,T);musicTick(T);prev=T}
    var rb=await oc.startRendering();chk();
    ae=new AudioEncoder({output:function(c,m){mux.addAudioChunk(c,m)},error:function(e){err=e}});ae.configure(acfg);
    var L=rb.getChannelData(0),R=rb.numberOfChannels>1?rb.getChannelData(1):L,CH=4096;
    for(var o=0;o<L.length;o+=CH){var n=Math.min(CH,L.length-o),d=new Float32Array(n*2);d.set(L.subarray(o,o+n),0);d.set(R.subarray(o,o+n),n);
      ae.encode(new AudioData({format:'f32-planar',sampleRate:SR,numberOfFrames:n,numberOfChannels:2,timestamp:Math.round(o*1e6/SR),data:d}));
      if(ae.encodeQueueSize>16){await wait(0);chk()}}
    await ae.flush();chk();
    /* 2) render every video frame at exact timestamps */
    ve=new VideoEncoder({output:function(c,m){mux.addVideoChunk(c,m)},error:function(e){err=e}});ve.configure(vcfg);
    cv.width=W2;cv.height=H2;
    for(var f=0;f<F;f++){
      chk();S.T=f/fps;drawNow();
      var vf=new VideoFrame(cv,{timestamp:Math.round(f*1e6/fps),duration:Math.round(1e6/fps)});ve.encode(vf,{keyFrame:f%(fps*2)===0});vf.close();
      while(ve.encodeQueueSize>6){await wait(4);chk()}
      if(f%8===0){updateUI();await wait(0)}
    }
    await ve.flush();chk();mux.finalize();
    LAST={blob:new Blob([tgt.buffer],{type:'video/mp4'}),ext:'mp4'};toast('الفيديو جاهز للحفظ');
  }catch(e){toast(e==='cancel'?'أُلغي التصدير':'تعذر التصدير: '+((e&&e.message)||e))}
  finally{
    try{ve&&ve.state!=='closed'&&ve.close()}catch(e){}try{ae&&ae.state!=='closed'&&ae.close()}catch(e){}
    ks.forEach(function(k){AU[k]=snap[k]});S.rec=null;S.T=0;S.si=0;cv.width=1280;cv.height=720;recalc();drawNow();renderStrip();updateUI();if(S.tab==='out')renderPanel();
  }
}
function saveFile(name,data){
  if(!DL){try{var b=data instanceof Blob?data:new Blob([data]),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);toast('تم الحفظ')}catch(e){toast('تعذر الحفظ من هذه الشاشة')}return}
  DL.save({filename:name,data:data}).then(function(){toast('تم الحفظ')}).catch(function(err){toast(err&&err.code==='declined'?'ألغيت الحفظ':'تعذر الحفظ من هذه الشاشة')});
}
function safeName(){return (P.title||'cartoon').replace(/[\\/:*?"<>|]/g,'').trim().slice(0,60)||'cartoon'}
function outHTML(){
  var h='<h3>الصوت</h3><div><label class="l" for="mus">الموسيقى</label><select id="mus" data-m="proj" data-k="music">'+opts(MUSN,P.music)+'</select></div>'
   +'<div><label class="l" for="vol">مستوى الموسيقى</label><input type="range" id="vol" data-m="proj" data-k="vol" min="0" max="1" step="0.05" value="'+P.vol+'"></div>'
   +'<p class="hint">الكلام يُسمع بأصوات «بيب» خاصة بكل شخصية. أضف المؤثرات من تبويب «المشهد» بزر «+ صوت».</p>'
   +'<h3>التصدير</h3><div class="row"><div><label class="l" for="qh">الدقة</label><select id="qh" data-m="proj" data-k="qh"><option value="480"'+(P.qh==='480'?' selected':'')+'>480p (خفيف)</option><option value="720"'+(P.qh==='720'?' selected':'')+'>720p (مناسب)</option><option value="1080"'+(P.qh==='1080'?' selected':'')+'>1080p (عالٍ)</option></select></div>'
   +'<div><label class="l" for="fps">الإطارات في الثانية</label><select id="fps" data-m="proj" data-k="fps"><option value="24"'+(P.fps==='24'?' selected':'')+'>24</option><option value="30"'+(P.fps==='30'?' selected':'')+'>30</option><option value="60"'+(P.fps==='60'?' selected':'')+'>60</option></select></div></div><p class="hint">تسجيل الفيلم يتم أثناء عرضه، فيستغرق '+fmt(TOTAL)+' دقيقة. أبقِ هذه الصفحة ظاهرة حتى ينتهي.</p>'
   +'<div class="row"><button class="btn pri" data-a="rec"'+(S.rec?' disabled':'')+'>سجّل الفيلم كفيديو</button><button class="btn pri" data-a="rec-hq">تصدير عالي الجودة MP4 (إطارًا بإطار)</button>'
   +'<button class="btn" data-a="save-png">حفظ الإطار الحالي صورة</button>'+'</div>';
  if(LAST){h+='<div class="step"><div class="row between"><b>الفيديو جاهز ('+LAST.ext.toUpperCase()+' · '+(LAST.blob.size/1048576).toFixed(1)+' م.ب)</b>'
    +'<button class="btn sm pri" data-a="save-video">حفظ الفيديو</button>'+'</div>'
    +'</div>'}
  return h+'<h3>الألوان والترجمة</h3><div class="row"><div><label class="l" for="grade">تصحيح الألوان</label><select id="grade" data-m="proj" data-k="grade">'+opts(GRADEN,P.grade||'none')+'</select></div>'
   +'<div><label class="l" for="dlg">عرض الحوار على الشاشة</label><select id="dlg" data-m="proj" data-k="dlg">'+opts(DLGN,P.dlg||'bubble')+'</select></div></div>'
   +'<p class="hint">تصحيح الألوان يُطبَّق على الفيلم المعروض والمُصدَّر، وليس على الصور المصغرة. الترجمة السفلية تظهر أسفل الشاشة مثل الأفلام.</p>'
   +'<label class="row" style="gap:6px"><input type="checkbox" id="srtName" style="width:auto"> إضافة اسم المتحدث في ملف الترجمة</label>'
   +'<div class="row"><button class="btn" data-a="export-srt">تصدير الترجمة (SRT)</button></div>'
   +'<h3>لقطة غلاف</h3><p class="hint">احفظ الإطار الظاهر الآن كصورة PNG لاستخدامه كغلاف أو بوستر. حرّك الشريط إلى اللقطة التي تريدها أولًا.</p><div class="row"><button class="btn" data-a="save-frame">حفظ الإطار الحالي (PNG)</button></div>'
   +'<h3>المشروع</h3><p class="hint">احفظ المشروع كملف لنقله أو الاحتفاظ بنسخة احتياطية، وافتحه لاحقًا من هنا. المشروع يُحفظ تلقائيًا في هذا المتصفح أيضًا.</p>'
   +'<div class="row"><button class="btn" data-a="export-json">حفظ المشروع كملف</button><button class="btn" data-a="import-json">فتح مشروع</button><button class="btn" data-a="restore-bak">استعادة نسخة احتياطية</button></div>';
}
function sfxHTML(s){
  return '<div class="step"><div class="row between"><span class="badge sfx">صوت</span><button class="btn sm dng" data-a="del-step" data-id="'+s.id+'">حذف</button></div><div class="row">'
   +num('البداية (ث)','step',s.id,'t',s.t,0,60,.1)
   +'<div><label class="l">المؤثر</label><select data-m="step" data-id="'+s.id+'" data-k="sfx">'+opts(SFXN,s.sfx)+'</select></div>'
   +'<div style="flex:0 0 auto;align-self:end"><button class="btn sm" data-a="prev-sfx" data-id="'+s.id+'">تجربة</button></div></div></div>';
}
