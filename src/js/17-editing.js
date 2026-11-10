'use strict';
/* ---------- editing ---------- */
function newCast(){
  var l=cur().cast,cand=[20,50,80,35,65,92,8],x=cand[0];
  for(var i=0;i<cand.length;i++){var ok=l.every(function(c){return Math.abs(c.x-cand[i])>=14});if(ok){x=cand[i];break}}
  return {x:x,y:82,flip:x>60}}
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-a]');if(!el)return;var a=el.dataset.a,i=+el.dataset.i,s=cur();
  if(S.rec&&a!=='rec-cancel'&&a!=='tab')return;
  if(a==='tab'){S.tab=el.dataset.v;renderPanel()}
  else if(a==='mute'){AU.muted=!AU.muted;if(AU.listen)AU.listen.gain.value=AU.muted?0:1;el.textContent=AU.muted?'الصوت: مكتوم':'الصوت: يعمل';el.setAttribute('aria-pressed',AU.muted)}
  else if(a==='rec')startRec();
  else if(a==='rec-hq')offlineExport();
  else if(a==='rec-cancel')endRec(true);
  else if(a==='save-video'){if(LAST)saveFile(safeName()+'.'+LAST.ext,LAST.blob)}
  else if(a==='save-png'){cv.toBlob(function(b){if(b)saveFile(safeName()+'.png',b)},'image/png')}
  else if(a==='prev-sfx'){var ps=s.steps.filter(function(x){return x.id===el.dataset.id})[0];if(ps){auInit();playSfx(ps.sfx)}}
  else if(a==='use-tpl'){var ts=$('#tplSel');if(ts)useTemplate(+ts.value)}
  else if(a==='rec-voice')startVoice(el.dataset.id);
  else if(a==='play-voice'){var pf=findStep(el.dataset.id);if(pf&&pf.st.aud){auInit();decodeVoice(pf.st.aud).then(function(v){if(v)playVoice(pf.st.aud)})}}
  else if(a==='del-voice'){var df=findStep(el.dataset.id);if(df){delete df.st.aud;refresh();renderPanel()}}
  else if(a==='pose-add')addPose(el.dataset.id,el.dataset.pose);
  else if(a==='pose-del'){var pa=P.actors.filter(function(x){return x.id===el.dataset.id})[0];if(pa&&pa.poses){delete pa.poses[el.dataset.pose];if(!Object.keys(pa.poses).length)delete pa.poses;refresh();renderPanel()}}
  else if(a==='gal-add')addFromGallery(i);
  else if(a==='img-add')addPhotoActor();
  else if(a==='bg-photo')setPhotoBG();
  else if(a==='bg-clear'){s.bg='day';delete s.bgImg;delete s.bgCol;refresh();renderPanel()}
  else if(a==='save-frame')saveFrame();
  else if(a==='export-srt')exportSRT();
  else if(a==='undo')undo();
  else if(a==='redo')redo();
  else if(a==='export-json')exportProject();
  else if(a==='import-json')importProject();
  else if(a==='restore-bak')restoreBak();
  else if(a==='save-model'){var mc=document.querySelector('[data-model="'+el.dataset.id+'"]');if(mc)mc.toBlob(function(b){if(b)saveFile(safeName()+'-'+actorOf(el.dataset.id).name+'.png',b)},'image/png')}
  else if(a==='play')play(false);
  else if(a==='play-scene')play(true);
  else if(a==='sel-scene'){seekScene(i);renderPanel()}
  else if(a==='go-prod'){S.si=i;S.tab='prod';seekScene(i);renderPanel()}
  else if(a==='add-scene'){var prev=P.scenes[P.scenes.length-1];P.scenes.push({id:uid(),title:'مشهد '+(P.scenes.length+1),bg:'day',dur:8,
    cast:prev.cast.map(function(c){return{actor:c.actor,x:c.x,y:c.y,flip:c.flip}}),steps:[]});S.si=P.scenes.length-1;refresh();renderPanel();toast('أضفت مشهدًا جديدًا')}
  else if(a==='add-title'){P.scenes.unshift({id:uid(),kind:'card',mode:'title',title:'العنوان',t1:P.title||'فيلمي',t2:'',bg:'night',fx:'sparkle',cam:'zin',dur:5,cast:[],steps:[]});S.si=0;S.T=0;refresh();renderPanel();toast('أضفت بطاقة العنوان في البداية')}
  else if(a==='add-credits'){P.scenes.push({id:uid(),kind:'card',mode:'credits',title:'الشارات',t1:'طاقم العمل',t2:'الشخصيات\n'+P.actors.map(function(x){return x.name}).join('\n')+'\n\nشكرًا للمشاهدة',bg:'night',fx:'none',cam:'fixed',dur:10,cast:[],steps:[]});S.si=P.scenes.length-1;S.T=0;refresh();renderPanel();toast('أضفت الشارات في النهاية')}
  else if(a==='dup'){var c=JSON.parse(JSON.stringify(P.scenes[i]));c.id=uid();c.title+=' (نسخة)';c.steps.forEach(function(x){x.id=uid()});P.scenes.splice(i+1,0,c);refresh();renderPanel()}
  else if(a==='del-scene'){if(P.scenes.length<2){toast('يجب أن يبقى مشهد واحد على الأقل');return}P.scenes.splice(i,1);S.si=clamp(S.si,0,P.scenes.length-1);S.T=0;refresh();renderPanel()}
  else if(a==='up'||a==='down'){var j=a==='up'?i-1:i+1;if(j<0||j>=P.scenes.length)return;var t=P.scenes[i];P.scenes[i]=P.scenes[j];P.scenes[j]=t;S.si=j;refresh();renderPanel()}
  else if(a==='add-actor'){if(P.actors.length>=6){toast('الحد الأقصى 6 شخصيات');return}var ks=['cat','boy','robot'],k=ks[P.actors.length%3],pal=[['#f4a259','#ffe6c7'],['#3a86ff','#f1c27d'],['#8338ec','#ffd166'],['#ef476f','#f1c27d'],['#06a77d','#e8f1f2']][P.actors.length%5];
    P.actors.push({id:uid(),name:'شخصية '+(P.actors.length+1),kind:k,color:pal[0],accent:pal[1]});refresh();renderPanel()}
  else if(a==='del-actor'){if(P.actors.length<2){toast('يجب أن تبقى شخصية واحدة');return}var id=el.dataset.id;P.actors=P.actors.filter(function(x){return x.id!==id});
    P.scenes.forEach(function(sc){sc.cast=sc.cast.filter(function(c){return c.actor!==id});sc.steps=sc.steps.filter(function(x){return x.actor!==id})});refresh();renderPanel()}
  else if(a==='add-cast'){var v=$('#castAdd');if(!v)return;var n=newCast();n.actor=v.value;s.cast.push(n);refresh();renderPanel()}
  else if(a==='del-cast'){var id2=el.dataset.id;s.cast=s.cast.filter(function(c){return c.actor!==id2});s.steps=s.steps.filter(function(x){return x.actor!==id2});refresh();renderPanel()}
  else if(a==='add-step'){if(!s.cast.length){toast('أضف شخصية إلى المشهد أولًا');return}var end=0;s.steps.forEach(function(x){end=Math.max(end,x.t+x.d)});
    var t0=+Math.min(end,Math.max(0,s.dur-1)).toFixed(1),ac=s.cast[0].actor;
    var v=el.dataset.v;s.steps.push(v==='act'?{id:uid(),type:'act',actor:ac,t:t0,d:2,act:'wave'}:v==='move'?{id:uid(),type:'move',actor:ac,t:t0,d:2.5,x:50,y:s.cast[0].y,style:'walk'}:v==='sfx'?{id:uid(),type:'sfx',t:t0,d:.5,sfx:'pop'}:{id:uid(),type:'say',actor:ac,t:t0,d:2.4,text:'مرحبًا!',emo:'happy'});
    s.dur=Math.max(s.dur,Math.ceil(t0+3));refresh();renderPanel()}
  else if(a==='del-step'){s.steps=s.steps.filter(function(x){return x.id!==el.dataset.id});refresh();renderPanel()}
});
$('#panel').addEventListener('input',function(e){
  var el=e.target,m=el.dataset.m;if(!m)return;var k=el.dataset.k,v;
  if(el.type==='checkbox')v=el.checked;else if(el.type==='number'||el.type==='range'){v=parseFloat(el.value);if(isNaN(v))return}else v=el.value;
  var s=cur();
  if(m==='proj')P[k]=v;
  else if(m==='scn'){var sc=P.scenes.filter(function(x){return x.id===el.dataset.id})[0];if(sc)sc[k]=v}
  else if(m==='cast'){var c=s.cast.filter(function(x){return x.actor===el.dataset.id})[0];if(c)c[k]=v}
  else if(m==='actor'){var ac=actorOf(el.dataset.id);ac[k]=v;if(k==='kind'||k==='color'||k==='accent')drawThumbs()}
  else if(m==='step'){var st=s.steps.filter(function(x){return x.id===el.dataset.id})[0];if(st)st[k]=v}
  recalc();drawNow();updateUI();renderStrip();save();
});
$('#panel').addEventListener('change',function(e){var m=e.target.dataset.m,k=e.target.dataset.k;
  if(m==='step'&&(k==='t'||k==='curve'||k==='style'))renderPanel();else if(m==='scn'||m==='proj'||m==='actor')drawThumbs()});
$('#scrub').addEventListener('input',function(e){if(S.rec)return;S.playing=false;stopVoices();S.T=parseFloat(e.target.value);var sg=segAt(S.T);if(sg.i!==S.si){S.si=sg.i;renderStrip();if(S.tab==='prod'||S.tab==='rev')renderPanel()}drawNow();updateUI()});
document.addEventListener('keydown',function(e){if(e.code==='Space'&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)&&!(e.target.getAttribute&&e.target.getAttribute('role')==='button')){e.preventDefault();play(false)}});
document.addEventListener('keydown',function(e){var t=e.target;if((e.key==='Enter'||e.key===' ')&&t&&t.getAttribute&&t.getAttribute('role')==='button'&&t.tagName!=='BUTTON'){e.preventDefault();t.click()}});

document.addEventListener('keydown',function(e){
  var tg=/INPUT|SELECT|TEXTAREA/.test(e.target.tagName);
  if((e.ctrlKey||e.metaKey)&&!tg){var k=e.key.toLowerCase();if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(k==='y'){e.preventDefault();redo()}else if(k==='s'){e.preventDefault();exportProject()}else if(k==='d'&&!S.rec){e.preventDefault();var c=JSON.parse(JSON.stringify(cur()));c.id=uid();c.title+=' (نسخة)';c.steps.forEach(function(x){x.id=uid()});P.scenes.splice(S.si+1,0,c);S.si++;S.T=0;refresh();renderPanel();toast('تم تكرار المشهد')}return}
  if(e.key==='Escape'&&S.rec){endRec(true);return}
  if(tg||e.ctrlKey||e.metaKey||e.altKey||S.rec)return;
  if(e.key==='ArrowRight'&&S.si<P.scenes.length-1){e.preventDefault();seekScene(S.si+1);renderPanel()}
  else if(e.key==='ArrowLeft'&&S.si>0){e.preventDefault();seekScene(S.si-1);renderPanel()}
  else if(e.key==='Home'){e.preventDefault();seekScene(0);renderPanel()}
  else if(e.key==='End'){e.preventDefault();seekScene(P.scenes.length-1);renderPanel()}
  else if(e.key==='?'){toast('Space تشغيل · ←/→ المشاهد · Home/End · Ctrl+Z/Y · Ctrl+S حفظ · Ctrl+D تكرار · Esc إلغاء التسجيل')}
});
try{Promise.resolve(window.claude&&window.claude.use?window.claude.use('downloads'):null).then(function(d){DL=d||null;if(S.tab==='out')renderPanel()}).catch(function(){})}catch(e){}
recalc();renderStrip();renderPanel();updateUI();drawNow();
if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('700 32px Cairo'),document.fonts.load('400 20px Lahb')]).then(function(){drawNow();drawThumbs()}).catch(function(){})}
