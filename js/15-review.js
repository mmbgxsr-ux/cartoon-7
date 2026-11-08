'use strict';
/* ---------- review: color script, x-sheet, QC ---------- */
var BGC={day:['#74c2ff','#d9f2ff','#62b95e'],sunset:['#3b2a6b','#ff7a59','#6b3f5e'],night:['#0a0e2c','#2b2f6e','#1d3b45'],desert:['#ffcf8a','#fff1d3','#efc980'],room:['#f0d3b4','#f0d3b4','#b98156'],forest:['#bfe8c9','#e8f7e0','#3d7a46'],sea:['#7fd3ff','#e6f8ff','#f2d9a0'],space:['#05010f','#1a0b3a','#5b5b78']};
var MOODN={neutral:'هدوء',happy:'فرح',sad:'حزن',surprised:'دهشة',angry:'غضب',sleepy:'نعاس',scared:'خوف',love:'حب'};
function sceneMood(s){var c={};s.steps.forEach(function(x){if(x.type==='say'){var e=x.emo||'neutral';c[e]=(c[e]||0)+1}});
  var best='neutral',n=0;Object.keys(c).forEach(function(k){if(c[k]>n){n=c[k];best=k}});return best}
function colorScriptHTML(){
  var bar='',lab='';
  P.scenes.forEach(function(s,i){var c=BGC[s.bg]||(s.bg==='photo'&&s.bgCol?[s.bgCol,s.bgCol,s.bgCol]:BGC.day),m=sceneMood(s),w=Math.max(34,Math.round(s.dur*14));
    bar+='<div style="flex:'+s.dur+' 0 '+w+'px;background:linear-gradient(180deg,'+c[0]+' 0%,'+c[1]+' 58%,'+c[2]+' 58%,'+c[2]+' 100%)"><button data-a="sel-scene" data-i="'+i+'" aria-label="'+esc(s.title)+': '+bgName(s)+'، '+MOODN[m]+'"></button></div>';
    lab+='<span style="flex:'+s.dur+' 0 '+w+'px">'+MOODN[m]+'</span>'});
  return '<div class="cs">'+bar+'</div><div class="csl">'+lab+'</div>'
   +'<p class="hint">كل مقطع مشهد بعرض يناسب مدته، وتحته مزاجه المستنتج من تعابير الحوار. اضغط مقطعًا للانتقال إليه.</p>';
}
function xsheetHTML(){
  if(cur().kind==='card')return '<p class="hint">هذه بطاقة نصية، لا توجد فيها حركة أو حوار.</p>';
  var s=cur(),n=Math.min(60,Math.ceil(s.dur)),cols=s.cast.map(function(c){return c.actor});
  var h='<div class="xs"><table><thead><tr><th>ث</th>'+cols.map(function(id){return '<th>'+esc(actorOf(id).name)+'</th>'}).join('')+'<th>صوت</th></tr></thead><tbody>';
  for(var r=0;r<n;r++){
    h+='<tr><td class="tm">'+r+'</td>';
    cols.forEach(function(id){
      var cell='',cls='';
      s.steps.forEach(function(x){if(x.type==='sfx'||x.actor!==id)return;
        if(x.t<r+1&&x.t+x.d>r){var start=Math.floor(x.t)===r;cls=x.type==='say'?'sy':'mv';
          cell=start?(x.type==='act'?'<b>'+ACTN[x.act]+'</b>':x.type==='move'?'<b>'+STY[x.style]+'</b> ← '+Math.round(x.x)+'٪':'<b>'+(x.aud?'🎙 ':'')+'«'+esc(x.text||'')+'»</b>'):'│'}});
      h+='<td class="'+cls+'">'+cell+'</td>'});
    var sf='';s.steps.forEach(function(x){if(x.type==='sfx'&&Math.floor(x.t)===r)sf+=(sf?'، ':'')+(SFXN[x.sfx]||x.sfx)});
    h+='<td class="'+(sf?'sf':'')+'">'+sf+'</td></tr>'}
  return h+'</tbody></table></div><p class="hint">كل صف ثانية واحدة. الأزرق للحركة، والبرتقالي للحوار، والبني للمؤثرات الصوتية. غيّر المشهد من الشريط تحت العرض.</p>';
}
function qcCheck(){
  var L=[],used={};
  function add(sev,i,msg){L.push({sev:sev,i:i,msg:msg})}
  P.scenes.forEach(function(s,i){var nm='«'+s.title+'»';if(s.kind==='card')return;
    s.cast.forEach(function(c){used[c.actor]=1});
    if(!s.cast.length)add('e',i,'المشهد '+nm+' بلا شخصيات.');
    var say=s.steps.filter(function(x){return x.type==='say'}),mv=s.steps.filter(function(x){return x.type==='move'});
    if(!s.steps.length)add('e',i,'المشهد '+nm+' بلا حركة أو حوار.');
    else if(!say.length)add('i',i,'المشهد '+nm+' بلا حوار، تأكد أن القصة تُفهم بالحركة وحدها.');
    s.steps.forEach(function(x){
      if(x.t+x.d>s.dur+.01)add('w',i,'في '+nm+': خطوة تنتهي بعد نهاية المشهد ('+(x.t+x.d).toFixed(1)+' ث من '+s.dur+').');
      if(x.type!=='sfx'&&!s.cast.some(function(c){return c.actor===x.actor}))add('e',i,'في '+nm+': خطوة لشخصية غير موجودة في المشهد.');
      if(x.type==='say'){if(!(x.text||'').trim())add('e',i,'في '+nm+': جملة حوار فارغة.');
        else if(!x.aud&&x.text.length/x.d>15)add('w',i,'في '+nm+': الحوار «'+x.text.slice(0,18)+'…» سريع جدًا ('+Math.round(x.text.length/x.d)+' حرفًا/ث). زد المدة.')}});
    ['move','say','act'].forEach(function(ty){P.actors.forEach(function(a){
      var l=s.steps.filter(function(x){return x.type===ty&&x.actor===a.id}).sort(function(p,q){return p.t-q.t});
      for(var k=1;k<l.length;k++)if(l[k].t<l[k-1].t+l[k-1].d-.01){add('w',i,'في '+nm+': '+(ty==='move'?'حركتان':ty==='act'?'إيماءتان':'جملتان')+' متداخلتان لـ'+a.name+'.');break}})});
    var cov=[];s.steps.forEach(function(x){cov.push([x.t,x.t+x.d])});cov.sort(function(a,b){return a[0]-b[0]});
    var end=0,gap=0;cov.forEach(function(c){gap=Math.max(gap,c[0]-end);end=Math.max(end,c[1])});gap=Math.max(gap,s.dur-end);
    if(s.steps.length&&gap>4)add('i',i,'في '+nm+': فراغ نحو '+Math.round(gap)+' ثوانٍ بلا أي حدث.');
  });
  P.actors.forEach(function(a){if(!used[a.id])add('w',-1,'الشخصية «'+a.name+'» غير مستخدمة في أي مشهد.')});
  var names={};P.actors.forEach(function(a){if(names[a.name])add('w',-1,'اسمان متطابقان: «'+a.name+'».');names[a.name]=1});
  if(P.scenes.length>2&&P.scenes.every(function(s){return s.bg===P.scenes[0].bg}))add('i',-1,'كل المشاهد بالخلفية نفسها، جرّب تنويعها لتتصاعد لوحة الألوان.');
  if(TOTAL<10)add('i',-1,'مدة الفيلم أقل من 10 ثوانٍ.');
  if(P.music==='none'||P.vol<=0)add('i',-1,'الموسيقى مغلقة. الصوت يحمل نصف أثر الفيلم.');
  return L;
}
function qcHTML(){
  var L=qcCheck(),e=L.filter(function(x){return x.sev==='e'}).length,w=L.filter(function(x){return x.sev==='w'}).length,n=L.length-e-w;
  var h='<div class="qsum">'+(e?'يوجد '+e+' خطأ يجب إصلاحه':w?'لا أخطاء، لكن '+w+' تنبيه يستحق المراجعة':'لا أخطاء ولا تنبيهات، الفيلم جاهز للتصدير')+(n&&!e?' · '+n+' ملاحظة':'')+'</div>';
  var ic={e:'×',w:'!',i:'i'};
  L.sort(function(a,b){return 'ewi'.indexOf(a.sev)-'ewi'.indexOf(b.sev)}).forEach(function(x){
    h+='<div class="qc"><span class="ic '+x.sev+'" aria-hidden="true">'+ic[x.sev]+'</span><div class="tx">'+esc(x.msg)+'</div>'
     +(x.i>=0?'<button class="btn sm" data-a="go-prod" data-i="'+x.i+'">اذهب</button>':'')+'</div>'});
  if(!L.length)h+='<div class="qc"><span class="ic ok" aria-hidden="true">✓</span><div class="tx">اجتازت كل الفحوص.</div></div>';
  return h+'<p class="hint">فحص تلقائي لكل مشهد: التوقيت، تداخل الحركات والجمل، سرعة الحوار، الفراغات، والشخصيات غير المستخدمة.</p>';
}
function revHTML(){
  return '<h3>لوحة الألوان الشعورية</h3>'+colorScriptHTML()
   +'<h3>جدول التوقيت: '+esc(cur().title)+'</h3>'+xsheetHTML()
   +'<h3>مراقبة الجودة</h3>'+qcHTML();
}
function renderPanel(){
  Array.prototype.forEach.call(document.querySelectorAll('#tabs button'),function(b){b.setAttribute('aria-selected',b.dataset.v===S.tab)});
  $('#panel').innerHTML=S.tab==='plan'?planHTML():S.tab==='chars'?charsHTML():S.tab==='out'?outHTML():S.tab==='rev'?revHTML():prodHTML();
  drawThumbs();
}
function drawThumbs(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-thumb]'),function(c){
    var i=+c.dataset.thumb,sg=SEG[i];if(!sg)return;var q=c.getContext('2d');q.setTransform(c.width/W,0,0,c.width/W,0,0);
    var s=P.scenes[i];drawScene(q,s,clamp(s.dur*.6,.4,s.dur-.4),sg.t0+s.dur*.6)});
  Array.prototype.forEach.call(document.querySelectorAll('[data-gal]'),function(c){var p0=GAL[+c.dataset.gal],q=c.getContext('2d');q.setTransform(1,0,0,1,0,0);q.clearRect(0,0,c.width,c.height);
    drawActor(q,{id:'g'+c.dataset.gal,kind:p0.k,color:p0.c,accent:p0.a},{px:50,py:122,sc:.42,face:1,lift:0,rot:0,sx:1,sy:1,phase:0,walk:false,emo:'happy',talk:false,seed:1},0)});
  Array.prototype.forEach.call(document.querySelectorAll('[data-model]'),function(c){drawModel(c,actorOf(c.dataset.model))});
  Array.prototype.forEach.call(document.querySelectorAll('[data-prev]'),function(c){
    var a=actorOf(c.dataset.prev),q=c.getContext('2d');q.setTransform(1,0,0,1,0,0);q.clearRect(0,0,c.width,c.height);
    drawActor(q,a,{px:100,py:240,sc:.86,face:1,lift:0,rot:0,sx:1,sy:1,phase:0,walk:false,emo:'happy',talk:false,seed:1},0)});
}
function renderStrip(){
  $('#strip').innerHTML=P.scenes.map(function(s,i){return '<button class="chip" data-a="sel-scene" data-i="'+i+'" '+(i===S.si?'aria-current="true"':'')+'>'+esc(s.title)+'<small>'+s.dur+' ث</small></button>'}).join('');
}
function updateUI(){
  var sc=$('#scrub');sc.max=TOTAL;sc.value=S.T;$('#time').textContent=fmt(S.T)+' / '+fmt(TOTAL);
  var sg=segAt(S.T);if(sg.i!==S.si&&S.playing){S.si=sg.i;renderStrip();if(S.tab==='prod'||S.tab==='rev')renderPanel()}
  if(!S.playing)histUI();
  $('#bPlay').textContent=S.playing?'إيقاف مؤقت':'تشغيل الفيلم';
  var rb=$('#recbadge');rb.hidden=!S.rec;if(S.rec)$('#recpct').textContent='● جارٍ التسجيل '+Math.round(clamp(S.T/TOTAL,0,1)*100)+'٪';
}
function refresh(){recalc();renderStrip();drawNow();updateUI();save()}
