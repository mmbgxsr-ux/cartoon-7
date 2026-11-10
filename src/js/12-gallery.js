'use strict';
/* ---------- gallery & photos ---------- */
var GAL=[{n:'ميمو',k:'cat',c:'#f4a259',a:'#ffe6c7'},{n:'كريم',k:'boy',c:'#3a86ff',a:'#f1c27d'},{n:'ليلى',k:'girl',c:'#e76f51',a:'#f1c27d'},{n:'لولو',k:'rabbit',c:'#efe9f7',a:'#ffd6e0'},
  {n:'بولت',k:'robot',c:'#6c8ead',a:'#ffd166'},{n:'سمسم',k:'cat',c:'#8d99ae',a:'#e8eaf0'},{n:'نور',k:'girl',c:'#8338ec',a:'#e0b184'},{n:'جزرة',k:'rabbit',c:'#f4a259',a:'#fff1d6'}];
var IMGC={};
function getImgKey(key,src){var c=IMGC[key];if(!c||c.src!==src){var im=new Image();c=IMGC[key]={src:src,im:im,ok:false};im.onload=function(){c.ok=true;drawNow();drawThumbs()};im.src=src}return c.ok?c.im:null}
var POSEN={happy:'سعيد',sad:'حزين',surprised:'متفاجئ',angry:'غاضب',sleepy:'نعسان',scared:'خائف',love:'محب',talk:'يتكلم',walk:'يمشي'};
function drawImgActor(g,a,p,T){
  var ps=a.poses||{},base=getImgKey('a'+a.id,a.img),Hs=270,im=base,hasEmo=false;
  Object.keys(ps).forEach(function(k){getImgKey('a'+a.id+':'+k,ps[k])});
  function pick(k){if(!ps[k])return null;var c=IMGC['a'+a.id+':'+k];return c&&c.ok&&c.src===ps[k]?c.im:null}
  var cand=null;
  if(p.walk&&Math.sin(p.phase)>0)cand=pick('walk');
  if(!cand&&p.talk&&p.vis&&p.vis[0]>5)cand=pick('talk');
  if(p.emo&&p.emo!=='neutral'&&ps[p.emo]){hasEmo=true;if(!cand)cand=pick(p.emo)}
  if(cand)im=cand;
  if(!im){g.fillStyle='rgba(120,130,150,.45)';rr(g,-55,-Hs,110,Hs,22);g.fill();return}
  var w=im.width*Hs/im.height,h=Hs;if(w>300){w=300;h=w*im.height/im.width}
  var sx=1,sy=1,rot=0,dx=0;
  if(p.walk){var wv=Math.abs(Math.sin(p.phase));rot+=Math.sin(p.phase)*.07;sy*=1-wv*.035;sx*=1+wv*.02}
  if(p.talk)sy*=1+Math.sin(T*10+p.seed)*.03;
  if(!hasEmo){var e=p.emo;
    if(e==='happy')sy*=1+Math.abs(Math.sin(T*5))*.03;
    else if(e==='sad'){rot+=.04;sy*=.96}
    else if(e==='surprised'){sx*=1.05;sy*=1.06}
    else if(e==='angry')dx=Math.sin(T*35)*2
    else if(e==='scared')dx=Math.sin(T*45)*2.5
    else if(e==='sleepy'){rot+=.05;sy*=.97}
    else if(e==='love')sy*=1+Math.abs(Math.sin(T*6))*.02}
  if(p.act==='sit')sy*=.8;if(p.act==='wave'||p.act==='clap')rot+=Math.sin(T*9)*.04;
  if(p.lift>8){sy*=1.06;sx*=.96}
  g.translate(dx,0);g.rotate(rot);g.scale(sx,sy);g.drawImage(im,-w/2,-h,w,h);
}
function drawFaceHead(g,a,p,T){
  var im=getImgKey('f'+a.id,a.img),R=60,NY=-138,HY=-54,e=p.emo,tilt=0,dy=0,sx=1,sy=1,dx=0;
  if(p.walk)tilt+=Math.sin(p.phase)*.05;
  if(p.talk){var o=p.vis?p.vis[0]/14:Math.abs(Math.sin(T*10+p.seed));tilt+=Math.sin(T*7+p.seed)*.04;sy*=1+o*.05;sx*=1-o*.02}
  if(e==='happy')dy-=Math.abs(Math.sin(T*5))*5;
  else if(e==='sad'){tilt+=.12;dy+=8}
  else if(e==='surprised'){sx*=1.1;sy*=1.1}
  else if(e==='angry')dx=Math.sin(T*35)*2;
  else if(e==='sleepy'){tilt+=.2;dy+=6}
  else if(e==='love')dy-=Math.abs(Math.sin(T*6))*3;
  g.save();g.translate(dx,NY+dy);g.rotate(tilt);g.scale(sx,sy);
  g.fillStyle='#fff';g.beginPath();g.arc(0,HY,R+4,0,7);g.fill();
  g.save();g.beginPath();g.arc(0,HY,R,0,7);g.clip();
  if(im){var z=clamp(a.zoom||1,1,3),s=Math.min(im.width,im.height)/z,cx=im.width/2-(a.fx||0)*(im.width-s)/2,cy=im.height/2-(a.fy||0)*(im.height-s)/2;
    g.drawImage(im,cx-s/2,cy-s/2,s,s,-R,HY-R,2*R,2*R)}
  else{g.fillStyle='#c9cfdd';g.fillRect(-R,HY-R,2*R,2*R)}
  var tint=e==='angry'?'rgba(255,50,30,.28)':e==='sad'?'rgba(80,110,255,.16)':e==='scared'?'rgba(210,235,255,.22)':e==='sleepy'?'rgba(40,50,130,.14)':null;
  if(tint){g.fillStyle=tint;g.fillRect(-R,HY-R,2*R,2*R)}
  g.restore();
  g.lineWidth=4;g.strokeStyle=shade(a.color,-.35);g.beginPath();g.arc(0,HY,R,0,7);g.stroke();
  g.restore();
  faceExtras(g,'boy',p,T,19,-192);
}
function faceHTML(a){
  function rg(k,lbl,min,max){return '<div class="row"><label class="l">'+lbl+'</label><input type="range" dir="ltr" data-m="actor" data-id="'+a.id+'" data-k="'+k+'" min="'+min+'" max="'+max+'" step="0.05" value="'+(a[k]!=null?a[k]:(k==='zoom'?1:0))+'"></div>'}
  return '<div class="hint">وجه من صورة على جسم كرتوني. حرّك المؤشرات حتى يظهر الوجه كاملًا داخل الدائرة.</div>'
    +'<select data-m="actor" data-id="'+a.id+'" data-k="body" aria-label="الجسم">'+opts({boy:'جسم ولد',girl:'جسم فتاة'},a.body==='girl'?'girl':'boy')+'</select>'
    +rg('zoom','التقريب',1,3)+rg('fx','يمين ويسار',-1,1)+rg('fy','أعلى وأسفل',-1,1)
    +'<div class="row"><button class="btn sm" data-a="face-swap" data-id="'+a.id+'">تغيير الصورة</button></div>';
}
function addFaceActor(){
  if(P.actors.length>=6){toast('الحد الأقصى 6 شخصيات، احذف شخصية أولًا');return}
  pickImage(function(c,fl){
    if(P.actors.length>=6)return;
    var id=uid(),nm=(fl.name||'').replace(/\.[^.]+$/,'').slice(0,20)||'وجهي';
    P.actors.push({id:id,name:nm,kind:'face',body:'boy',color:'#3a86ff',accent:'#f1c27d',img:canvasUrl(c,false),zoom:1.3,fx:0,fy:c.height>c.width?.6:0});
    addToScene(id);refresh();renderPanel();toast('أضفت «'+nm+'» بوجهك إلى المشروع والمشهد')},480);
}
function swapFace(id){
  pickImage(function(c){var a=P.actors.filter(function(x){return x.id===id})[0];if(!a||a.kind!=='face')return;
    a.img=canvasUrl(c,false);a.zoom=1.3;a.fx=0;a.fy=c.height>c.width?.6:0;refresh();renderPanel();toast('تم تغيير الصورة')},480);
}
function poseHTML(a){
  var h='<div class="hint">شخصية من صورة. أضف صورًا لأوضاع أخرى لتتبدل تلقائيًا (اختياري).</div><div class="pgrid">';
  Object.keys(POSEN).forEach(function(k){var u=(a.poses||{})[k];
    h+='<div class="pz"><button class="btn sm" data-a="pose-add" data-id="'+a.id+'" data-pose="'+k+'" aria-label="'+(u?'استبدال':'إضافة')+' صورة '+POSEN[k]+'">'+(u?'<img src="'+u+'" alt="">':'<span class="plus">+</span>')+'<span>'+POSEN[k]+'</span></button>'
      +(u?'<button class="x" data-a="pose-del" data-id="'+a.id+'" data-pose="'+k+'" aria-label="حذف صورة '+POSEN[k]+'">×</button>':'')+'</div>'});
  return h+'</div>';
}
function canvasUrl(c,rm){
  if(rm)removeBg(c);var u=encAlpha(c);
  if(u.length>700000){var c2=document.createElement('canvas');c2.width=Math.round(c.width*.6);c2.height=Math.round(c.height*.6);c2.getContext('2d').drawImage(c,0,0,c2.width,c2.height);u=encAlpha(c2)}
  return u;
}
function addPose(id,k){
  if(!POSEN[k])return;var rm=$('#rmbg')?$('#rmbg').checked:true;
  pickImage(function(c){var a=P.actors.filter(function(x){return x.id===id})[0];if(!a||a.kind!=='img')return;
    a.poses=a.poses||{};a.poses[k]=canvasUrl(c,rm);refresh();renderPanel();toast('أضفت صورة «'+POSEN[k]+'»')},380);
}
function drawPhotoBG(g,sc){
  var im=getImgKey('b'+sc.id,sc.bgImg);if(!im){g.fillStyle=sc.bgCol||'#333';g.fillRect(0,0,W,H);return}
  var k=Math.max(W/im.width,H/im.height),w=im.width*k,h=im.height*k;g.drawImage(im,(W-w)/2,(H-h)/2,w,h);
}
function bgName(s){return BGS[s.bg]||'صورة'}
function bgMap(s){var m={};for(var k in BGS)m[k]=BGS[k];if(s.bg==='photo')m.photo='صورة من المعرض';return m}
function removeBg(c){
  var q=c.getContext('2d'),w=c.width,h=c.height,im=q.getImageData(0,0,w,h),d=im.data,r0=d[0],g0=d[1],b0=d[2];if(d[3]<250)return;
  var seen=new Uint8Array(w*h),st=[];
  function push(i){if(seen[i])return;var j=i*4;if(d[j+3]>0&&Math.abs(d[j]-r0)+Math.abs(d[j+1]-g0)+Math.abs(d[j+2]-b0)<110){seen[i]=1;st.push(i)}}
  for(var x=0;x<w;x++){push(x);push((h-1)*w+x)}for(var y=0;y<h;y++){push(y*w);push(y*w+w-1)}
  while(st.length){var i=st.pop(),x2=i%w,y2=(i-x2)/w;if(x2>0)push(i-1);if(x2<w-1)push(i+1);if(y2>0)push(i-w);if(y2<h-1)push(i+w)}
  for(var k=0;k<seen.length;k++)if(seen[k])d[k*4+3]=0;q.putImageData(im,0,0);
}
function readImage(fl,maxDim,cb){
  if(!fl||!/^image\//.test(fl.type)){toast('اختر ملف صورة');return}
  if(fl.size>15*1048576){toast('الصورة كبيرة جدًا (الحد 15 م.ب)');return}
  var r=new FileReader();r.onerror=function(){toast('تعذر قراءة الصورة')};
  r.onload=function(){var im=new Image();im.onerror=function(){toast('تعذر قراءة الصورة')};
    im.onload=function(){var k=Math.min(1,maxDim/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c,fl)};im.src=r.result};
  r.readAsDataURL(fl);
}
function pickImage(cb,maxDim){var f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=function(){readImage(f.files&&f.files[0],maxDim,cb)};f.click()}
function encAlpha(c){var u=c.toDataURL('image/webp',.85);if(u.indexOf('data:image/webp')!==0)u=c.toDataURL('image/png');return u}
function addToScene(id){var sc=cur();if(!sc.cast.some(function(c){return c.actor===id})){var n=newCast();n.actor=id;sc.cast.push(n)}}
function addFromGallery(i){
  var p0=GAL[i];if(!p0)return;if(P.actors.length>=6){toast('الحد الأقصى 6 شخصيات، احذف شخصية أولًا');return}
  var nm=p0.n;while(P.actors.some(function(a){return a.name===nm}))nm=p0.n+' '+(Math.floor(Math.random()*90)+10);
  var id=uid();P.actors.push({id:id,name:nm,kind:p0.k,color:p0.c,accent:p0.a});addToScene(id);refresh();renderPanel();toast('أضفت «'+nm+'» إلى المشروع والمشهد')}
function addPhotoActor(){
  if(P.actors.length>=6){toast('الحد الأقصى 6 شخصيات، احذف شخصية أولًا');return}
  var rm=$('#rmbg')?$('#rmbg').checked:true;
  pickImage(function(c,fl){
    if(P.actors.length>=6)return;if(rm)removeBg(c);var u=encAlpha(c);
    if(u.length>700000){var c2=document.createElement('canvas');c2.width=Math.round(c.width*.6);c2.height=Math.round(c.height*.6);c2.getContext('2d').drawImage(c,0,0,c2.width,c2.height);u=encAlpha(c2)}
    var id=uid(),nm=(fl.name||'').replace(/\.[^.]+$/,'').slice(0,20)||'صورة';
    P.actors.push({id:id,name:nm,kind:'img',color:'#8d99ae',accent:'#e8eaf0',img:u});addToScene(id);refresh();renderPanel();toast('أضفت «'+nm+'» إلى المشروع والمشهد')},380);
}
function setPhotoBG(){
  var sc=cur();
  pickImage(function(c){var u=c.toDataURL('image/jpeg',.82),q=document.createElement('canvas');q.width=q.height=1;var x=q.getContext('2d');x.drawImage(c,0,0,1,1);var d=x.getImageData(0,0,1,1).data;
    sc.bg='photo';sc.bgImg=u;sc.bgCol='#'+[d[0],d[1],d[2]].map(function(v){return ('0'+v.toString(16)).slice(-2)}).join('');refresh();renderPanel();toast('تم تعيين الخلفية')},1280);
}
function galleryHTML(){
  var h='<h3>معرض الشخصيات</h3><p class="hint">اضغط شخصية لإضافتها إلى المشروع وإلى المشهد الحالي.</p><div class="row">';
  GAL.forEach(function(p0,i){h+='<button class="gal" data-a="gal-add" data-i="'+i+'"><canvas width="100" height="130" data-gal="'+i+'" aria-hidden="true"></canvas><span>'+esc(p0.n)+'</span></button>'});
  return h+'</div><h3>شخصية بوجهك</h3><div class="row"><button class="btn pri" data-a="face-add">+ شخصية بوجه من صورة</button></div><p class="hint">اختر صورة واضحة لوجهك. يوضع الوجه على جسم كرتوني (ولد أو فتاة) فيمشي ويجري ويقفز ويلوّح ويصفّق ويرقص ويجلس ويتكلم مثل باقي الشخصيات، ويتغير تعبيره حسب الحوار. اضبط الإطار من بطاقة الشخصية.</p><h3>من معرض الصور</h3><label class="row" style="gap:6px"><input type="checkbox" id="rmbg" checked style="width:auto"> أزل الخلفية الموحدة تلقائيًا</label>'
   +'<div class="row"><button class="btn" data-a="img-add">+ شخصية من صورة</button></div>'
   +'<p class="hint">تصبح الصورة شخصية تمشي وتقفز وتتكلم بحركة خفيفة. بعد إضافتها ستجد في بطاقتها خانات لصور أوضاعها (سعيد، حزين، يتكلم...) لتتبدل تلقائيًا. الأفضل صورة لشخص أو رسم كامل على خلفية موحدة. لا يوجد تزامن للشفاه مع الصور.</p>';
}
var MPOSES=[['عادي',{emo:'neutral'}],['سعيد',{emo:'happy'}],['حزين',{emo:'sad'}],['متفاجئ',{emo:'surprised'}],
  ['غاضب',{emo:'angry'}],['نعسان',{emo:'sleepy',T:.4}],['خائف',{emo:'scared',T:.4}],['محب',{emo:'love',T:.4}],
  ['يتكلم',{emo:'happy',talk:true,vis:[14,11]}],['يمشي',{emo:'neutral',walk:true,phase:1.1}],['يجري',{emo:'happy',walk:true,run:true,phase:1.1,rot:.1,lift:10}],['يقفز',{emo:'happy',lift:70,sy:.92,sx:1.08}],
  ['يجلس',{emo:'happy',act:'sit'}],['يلوّح',{emo:'happy',act:'wave',T:.45}],['يرقص',{emo:'happy',act:'dance',T:.45,rot:.1,lift:14}],['يصفّق',{emo:'happy',act:'clap',T:.45}]];
function drawModel(c,a){
  var q=c.getContext('2d');q.setTransform(1,0,0,1,0,0);q.clearRect(0,0,c.width,c.height);q.fillStyle='#fff';q.fillRect(0,0,c.width,c.height);
  q.fillStyle='#161b2b';q.textAlign='center';q.font='700 30px '+FONT;q.fillText('ورقة النموذج · '+a.name+' ('+(KINDS[a.kind]||(a.kind==='face'?'وجه من صورة':'صورة'))+')',600,42);
  MPOSES.forEach(function(m,i){var x0=(i%4)*300,y0=60+Math.floor(i/4)*420;
    q.fillStyle='#f3f5fa';rr(q,x0+8,y0+4,284,404,16);q.fill();q.strokeStyle='#d8ddea';q.lineWidth=2;q.stroke();
    var p={px:x0+150,py:y0+330,sc:.9,face:1,lift:0,rot:0,sx:1,sy:1,phase:0,walk:false,emo:'neutral',talk:false,seed:1};
    for(var k in m[1])p[k]=m[1][k];
    drawActor(q,a,p,m[1].T||0);q.fillStyle='#59627e';q.font='700 22px '+FONT;q.textAlign='center';q.fillText(m[0],x0+150,y0+388)});
  q.fillStyle='#59627e';q.font='600 18px '+FONT;q.textAlign='start';
  q.fillText(a.color+'  ·  '+a.accent,24,1766);
  q.fillStyle=a.color;q.fillRect(0,880,10,0);
}
function modelsHTML(){
  var h='<h3>ورقات النماذج</h3><p class="hint">كل شخصية بستة عشر وضعًا ثابتًا لتبقى متسقة بين المشاهد. احفظها كصورة واعتمدها مرجعًا.</p>';
  P.actors.forEach(function(a){h+='<div><canvas width="1200" height="1780" data-model="'+a.id+'" style="width:100%;height:auto;border-radius:10px;border:1px solid var(--line)" aria-label="ورقة نموذج '+esc(a.name)+'"></canvas>'
    +'<div class="row" style="margin-top:6px"><button class="btn sm" data-a="save-model" data-id="'+a.id+'">حفظ ورقة '+esc(a.name)+' (PNG)</button></div></div>'});
  return h;
}
function charsHTML(){
  var h='<div class="row between"><h3>الشخصيات</h3><button class="btn sm pri" data-a="add-actor">+ شخصية</button></div>';
  P.actors.forEach(function(a){
    h+='<div class="card"><canvas class="pv" width="200" height="260" data-prev="'+a.id+'"></canvas><div class="f">'
     +'<input type="text" data-m="actor" data-id="'+a.id+'" data-k="name" value="'+esc(a.name)+'" aria-label="الاسم">'
     +(a.kind==='img'?poseHTML(a):a.kind==='face'?faceHTML(a):'<select data-m="actor" data-id="'+a.id+'" data-k="kind" aria-label="النوع">'+opts(KINDS,a.kind)+'</select>')
     +(a.kind==='img'?'':'<div class="row"><label class="l">'+(a.kind==='face'?'لون الملابس':'اللون')+'</label><input type="color" data-m="actor" data-id="'+a.id+'" data-k="color" value="'+a.color+'">'
     +'<label class="l">'+(a.kind==='face'?'لون اليدين':'اللون الثانوي')+'</label><input type="color" data-m="actor" data-id="'+a.id+'" data-k="accent" value="'+a.accent+'"></div>')
     +'<div><button class="btn sm dng" data-a="del-actor" data-id="'+a.id+'">حذف</button></div></div></div>';
  });
  return h+galleryHTML()+modelsHTML();
}
