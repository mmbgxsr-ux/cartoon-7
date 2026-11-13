'use strict';
/* ---------- project ---------- */
function demo(){
  var m=uid(),k=uid();
  return {title:'ميمو يعود إلى البيت',actors:[
    {id:m,name:'ميمو',kind:'cat',color:'#f4a259',accent:'#ffe6c7'},
    {id:k,name:'كريم',kind:'boy',color:'#3a86ff',accent:'#f1c27d'}],
   scenes:[
    {id:uid(),title:'الضياع',bg:'desert',dur:10,cast:[{actor:m,x:78,y:80,flip:true},{actor:k,x:8,y:84,flip:false}],steps:[
      {id:uid(),type:'say',actor:m,t:.4,d:2.6,text:'يا إلهي! أين بيتي؟',emo:'sad'},
      {id:uid(),type:'move',actor:m,t:3,d:1.8,x:68,y:86,style:'hop'},
      {id:uid(),type:'move',actor:k,t:4,d:3.4,x:36,y:84,style:'walk'},
      {id:uid(),type:'say',actor:k,t:7.4,d:2.4,text:'لا تخف يا ميمو، سأوصلك!',emo:'happy'}]},
    {id:uid(),title:'العودة',bg:'sunset',dur:8,cast:[{actor:k,x:12,y:84,flip:false},{actor:m,x:20,y:88,flip:false}],steps:[
      {id:uid(),type:'move',actor:k,t:.3,d:3.5,x:62,y:84,style:'walk'},
      {id:uid(),type:'move',actor:m,t:.5,d:3.5,x:74,y:88,style:'hop'},
      {id:uid(),type:'say',actor:m,t:4.4,d:3,text:'شكرًا يا صديقي، أنا في بيتي!',emo:'happy'}]}]};
}
var P;
try{var raw=localStorage.getItem('cartoon-studio-p1');if(raw){P=JSON.parse(raw);if(!P||!P.scenes||!P.scenes.length||!P.actors||!P.actors.length)P=null}}catch(e){P=null}
if(!P)P=demo();
if(!P.music)P.music='happy';
if(P.vol==null)P.vol=.6;
if(!P.qh)P.qh='720';
if(!P.fps)P.fps='30';
if(!P.grade)P.grade='none';
if(!P.dlg)P.dlg='bubble';
var S={tab:'plan',si:0,T:0,playing:false,end:0,last:0};
var SEG=[],TOTAL=1,EV=[],PITCH={cat:1.6,boy:1.1,girl:1.4,rabbit:1.9,robot:.7},DL=null,LAST=null;
function recalc(){
  var t=0;SEG=P.scenes.map(function(s,i){var o={i:i,t0:t,t1:t+s.dur};t+=s.dur;return o});TOTAL=Math.max(1,t);
  EV=[];P.scenes.forEach(function(s,i){var t0=SEG[i].t0;s.steps.forEach(function(st){
    if(st.type==='sfx')EV.push({T:t0+st.t,k:'sfx',v:st.sfx});
    else if(st.type==='say'&&st.aud)EV.push({T:t0+st.t,k:'voice',v:st.aud});
    else if(st.type==='say'){var tx=st.text||'',n=tx.length,ao=actorOf(st.actor),pc=PITCH[ao.kind==='face'?(ao.body==='girl'?'girl':'boy'):ao.kind]||1;
      for(var c=0;c<n;c+=2){if(tx.charAt(c)!==' ')EV.push({T:t0+st.t+(c/Math.max(1,n))*st.d*.8,k:'blip',v:pc})}}})});
  EV.sort(function(a,b){return a.T-b.T});
}
var HASIDB=false,IDBOK=null,LSOK=null,WARNAT=0;
function saveHealth(){if(IDBOK===false&&LSOK===false&&typeof toast==='function'){var n=Date.now();if(n-WARNAT>60000){WARNAT=n;toast('تعذر الحفظ التلقائي. احفظ المشروع كملف الآن')}}}
function idb(fn){try{var q=indexedDB.open('cartoon-studio-db',1);q.onupgradeneeded=function(){q.result.createObjectStore('p')};q.onsuccess=function(){try{fn(q.result)}catch(e){IDBOK=false;saveHealth()}};q.onerror=function(){IDBOK=false;saveHealth()}}catch(e){IDBOK=false;saveHealth()}}
function idbPut(j){idb(function(db){var t=db.transaction('p','readwrite'),o=t.objectStore('p'),n=Date.now();t.oncomplete=function(){IDBOK=true};t.onerror=t.onabort=function(){IDBOK=false;saveHealth()};o.put({j:j,ts:n},'cur');
  if(n-(idbPut.b||0)>300000){idbPut.b=n;o.put({j:j,ts:n},'bak'+(Math.floor(n/300000)%3))}})}
function okProj(o){return o&&o.scenes&&o.scenes.length&&o.actors&&o.actors.length}
function persist(){var j=JSON.stringify(P);idbPut(j);try{localStorage.setItem('cartoon-studio-p1',j);LSOK=true}catch(e){LSOK=false;try{localStorage.removeItem('cartoon-studio-p1')}catch(_){}if(!HASIDB&&j.length>1500000)toast('الصور كبيرة على الحفظ التلقائي. احفظ المشروع كملف');saveHealth()}}
idb(function(db){var r=db.transaction('p').objectStore('p').get('cur');r.onsuccess=function(){HASIDB=true;var v=r.result,o=null;if(!v)return;try{o=JSON.parse(v.j)}catch(e){}
  if(okProj(o)&&HST.length===1&&HI===0&&v.j!==HST[0]){loadP(o);HST=[JSON.stringify(P)];HI=0;histUI();toast('استُعيد آخر حفظ')}}});
function restoreBak(){idb(function(db){var o=db.transaction('p').objectStore('p'),best=null,n=0;
  ['bak0','bak1','bak2'].forEach(function(k){var r=o.get(k);r.onsuccess=function(){var v=r.result;if(v&&(!best||v.ts>best.ts))best=v;if(++n===3){var p=null;try{p=best&&JSON.parse(best.j)}catch(e){}
    if(!okProj(p)){toast('لا توجد نسخة احتياطية بعد');return}
    clearTimeout(save.h);pushHist();S.si=0;S.T=0;loadP(p);pushHist();histUI();toast('استُعيدت نسخة من '+new Date(best.ts).toLocaleTimeString('ar-EG'))}}})})}
var HST=[JSON.stringify(P)],HI=0;
function pushHist(){var j=JSON.stringify(P);if(j===HST[HI])return;HST=HST.slice(0,HI+1);HST.push(j);while(HST.length>80||(HST.length>5&&HST.reduce(function(n,x){return n+x.length},0)>25000000))HST.shift();HI=HST.length-1}
function save(){clearTimeout(save.h);save.h=setTimeout(function(){persist();pushHist();histUI()},400)}
function histUI(){var u=$('#bUndo'),r=$('#bRedo');if(!u)return;u.disabled=!(HI>0||JSON.stringify(P)!==HST[HI]);r.disabled=HI>=HST.length-1}
function loadP(o){P=o;if(!P.music)P.music='happy';if(P.vol==null)P.vol=.6;if(!P.qh)P.qh='720';if(!P.fps)P.fps='30';if(!P.grade)P.grade='none';if(!P.dlg)P.dlg='bubble';recalc();S.si=clamp(S.si,0,P.scenes.length-1);S.T=clamp(S.T,0,TOTAL);S.playing=false;renderStrip();renderPanel();drawNow();updateUI();persist();histUI()}
function undo(){if(S.rec)return;clearTimeout(save.h);pushHist();if(HI<=0){toast('لا شيء للتراجع عنه');histUI();return}HI--;loadP(JSON.parse(HST[HI]));toast('تراجعت')}
function redo(){if(S.rec)return;if(HI>=HST.length-1){toast('لا شيء لإعادته');return}HI++;loadP(JSON.parse(HST[HI]));toast('أعدت')}
function numOr(v,d,a,b){v=parseFloat(v);return isFinite(v)?clamp(v,a,b):d}
var STRIPACT={idle:'وقوف وتنفّس',walk:'مشي',run:'جري',talk:'كلام',jump:'قفز',wave:'تلويح',sit:'جلوس'};
var STRIPVIEW={side:'من الجنب',front:'من قدام',back:'من ورا'};
var STRIPN={idle:4,walk:8,run:8,talk:4,jump:6,wave:6,sit:4};
var KEYMODES={auto:'تلقائي',green:'أخضر',blue:'أزرق',magenta:'بينك',white:'أبيض'};
var STRIPKEY=/^(idle|walk|run|talk|jump|wave|sit):(side|front|back)$/;
function cleanProject(o){
  if(!o||!Array.isArray(o.scenes)||!o.scenes.length||!Array.isArray(o.actors)||!o.actors.length)return null;
  var hex=function(c,d){return /^#[0-9a-f]{6}$/i.test(c||'')?c:d},ids=Object.create(null),idmap=Object.create(null);
  var imgOk=function(u,max){return typeof u==='string'&&u.length<max&&/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(u)};
  var actors=o.actors.slice(0,6).map(function(a){var id=cleanId(a.id);while(ids[id])id=uid();ids[id]=1;idmap[String(a.id)]=id;var isImg=a.kind==='img'&&imgOk(a.img,1200000),isFace=a.kind==='face'&&imgOk(a.img,1200000);
    var r={id:id,name:String(a.name||'شخصية').slice(0,30),kind:isImg?'img':isFace?'face':own(KINDS,a.kind)?a.kind:'cat',color:hex(a.color,'#f4a259'),accent:hex(a.accent,'#ffe6c7')};if(!isImg&&!isFace&&(r.kind==='boy'||r.kind==='girl')){if(/^#[0-9a-f]{6}$/i.test(a.hair||''))r.hair=a.hair;if(r.kind==='boy'&&/^#[0-9a-f]{6}$/i.test(a.pants||''))r.pants=a.pants}if(isFace){r.img=a.img;r.body=a.body==='girl'?'girl':'boy';r.zoom=numOr(a.zoom,1,1,3);r.fx=numOr(a.fx,0,-1,1);r.fy=numOr(a.fy,0,-1,1)}
    if(isImg){r.img=a.img;if(a.poses&&typeof a.poses==='object'){var pz={};Object.keys(POSEN).forEach(function(k){if(imgOk(a.poses[k],1200000))pz[k]=a.poses[k]});if(Object.keys(pz).length)r.poses=pz}
      if(a.dir==='L')r.dir='L';
      if(a.strips&&typeof a.strips==='object'){var sz={},cnt=0;Object.keys(a.strips).forEach(function(k){var s=a.strips[k];
        if(cnt<24&&STRIPKEY.test(k)&&s&&typeof s==='object'&&imgOk(s.img,3500000)){var n=Math.round(+s.n),cw=Math.round(+s.cw),ch=Math.round(+s.ch),hh=Math.round(+s.h);
          if(n>=1&&n<=16&&cw>=8&&cw<=1600&&ch>=8&&ch<=2400&&hh>=8&&hh<=ch){sz[k]={img:s.img,n:n,cw:cw,ch:ch,h:hh};cnt++}}});
        if(cnt)r.strips=sz}}return r});
  var scenes=o.scenes.slice(0,60).map(function(sc){
    var cast=(Array.isArray(sc.cast)?sc.cast:[]).filter(function(c){return c&&idmap[c.actor]}).map(function(c){return{actor:idmap[c.actor],x:numOr(c.x,50,0,100),y:numOr(c.y,82,60,95),flip:!!c.flip}});
    var steps=(Array.isArray(sc.steps)?sc.steps:[]).filter(function(x){return x.type==='move'||x.type==='say'||x.type==='act'||x.type==='sfx'}).map(function(x){
      var r={id:cleanId(x.id),type:x.type,t:numOr(x.t,0,0,60),d:numOr(x.d,1,.3,30)};
      if(x.type!=='sfx')r.actor=idmap[x.actor]||actors[0].id;
      if(x.type==='move'){r.x=numOr(x.x,50,0,100);r.y=numOr(x.y,82,60,95);r.style=own(STY,x.style)?x.style:'walk';r.curve=own(CRVN,x.curve)?x.curve:'auto'}
      if(x.type==='say'){r.text=String(x.text||'').slice(0,200);r.emo=own(EMO,x.emo)?x.emo:'neutral';if(typeof x.aud==='string'&&x.aud.length<2500000&&/^data:audio\/[a-z0-9.+-]+(;codecs=[a-z0-9.,-]+)?;base64,[A-Za-z0-9+\/=]+$/i.test(x.aud))r.aud=x.aud}
      if(x.type==='act')r.act=own(ACTN,x.act)?x.act:'wave';
      if(x.type==='sfx')r.sfx=own(SFXN,x.sfx)?x.sfx:'pop';
      return r});
    var ph=sc.bg==='photo'&&imgOk(sc.bgImg,2500000);
    var out={id:cleanId(sc.id),title:String(sc.title||'مشهد').slice(0,60),bg:ph?'photo':own(BGS,sc.bg)?sc.bg:'day',fx:own(FXN,sc.fx)?sc.fx:'none',cam:own(CAMN,sc.cam)?sc.cam:'fixed',trans:own(TRN,sc.trans)?sc.trans:'fade',dur:numOr(sc.dur,8,3,40),cast:cast,steps:steps};if(ph){out.bgImg=sc.bgImg;out.bgCol=hex(sc.bgCol,'#333333')}if(sc.kind==='card'){out.kind='card';out.t1=String(sc.t1||'').slice(0,80);out.t2=String(sc.t2||'').slice(0,600);out.mode=sc.mode==='credits'?'credits':'title';out.cast=[];out.steps=[]}return out});
  return{title:String(o.title||'فيلمي').slice(0,80),actors:actors,scenes:scenes,music:own(MUSN,o.music)?o.music:'happy',vol:numOr(o.vol,.6,0,1),qh:['480','720','1080'].indexOf(String(o.qh))>=0?String(o.qh):'720',fps:['24','30','60'].indexOf(String(o.fps))>=0?String(o.fps):'30',grade:own(GRADEN,o.grade)?o.grade:'none',dlg:own(DLGN,o.dlg)?o.dlg:'bubble'};
}
function exportProject(){
  var blob=new Blob([JSON.stringify(P,null,1)],{type:'application/json'}),name=safeName()+'.cartoon.json';
  if(DL){saveFile(name,blob);return}
  try{var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},600);toast('تم الحفظ')}catch(e){toast('تعذر الحفظ من هذه الشاشة')}
}
function importProject(){
  var f=document.createElement('input');f.type='file';f.accept='.json,application/json';
  f.onchange=function(){var fl=f.files&&f.files[0];if(!fl)return;var r=new FileReader();
    r.onload=function(){var o=null;try{o=cleanProject(JSON.parse(r.result))}catch(e){}
      if(!o){toast('ملف المشروع غير صالح');return}
      clearTimeout(save.h);pushHist();S.si=0;S.T=0;loadP(o);pushHist();histUI();toast('فُتح المشروع')};
    r.readAsText(fl)};
  f.click();
}
function actorOf(id){return P.actors.filter(function(a){return a.id===id})[0]||P.actors[0]}
function cur(){return P.scenes[clamp(S.si,0,P.scenes.length-1)]}
function segAt(T){for(var i=0;i<SEG.length;i++)if(T<SEG[i].t1)return SEG[i];return SEG[SEG.length-1]}
