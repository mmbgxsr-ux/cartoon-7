'use strict';
/* ---------- UI ---------- */
function toast(m){var t=$('#toast');t.textContent=m;t.className='on';clearTimeout(toast.h);toast.h=setTimeout(function(){t.className=''},2200)}
function fmt(s){s=Math.max(0,s);return Math.floor(s/60)+':'+('0'+Math.floor(s%60)).slice(-2)}
function opts(map,sel){return Object.keys(map).map(function(k){return '<option value="'+k+'"'+(k===sel?' selected':'')+'>'+map[k]+'</option>'}).join('')}
function actorOpts(sel){return P.actors.map(function(a){return '<option value="'+a.id+'"'+(a.id===sel?' selected':'')+'>'+esc(a.name)+'</option>'}).join('')}
function num(label,m,id,k,v,min,max,step){return '<div><label class="l">'+label+'</label><input type="number" data-m="'+m+'" data-id="'+id+'" data-k="'+k+'" value="'+v+'" min="'+min+'" max="'+max+'" step="'+step+'"></div>'}

function fixLabels(root){
  Array.prototype.forEach.call(root.querySelectorAll('label:not([for])'),function(l){
    if(l.querySelector('input,select,textarea'))return;
    var c=l.nextElementSibling;
    if(!c||!/^(INPUT|SELECT|TEXTAREA)$/.test(c.tagName)){var cs=l.parentNode?l.parentNode.querySelectorAll('input,select,textarea'):[];c=cs.length===1?cs[0]:null}
    if(!c)return;
    if(!c.id)c.id='fld'+(++fixLabels.n);
    l.setAttribute('for',c.id)})
}
fixLabels.n=0;
function A(id,name,kind,color,accent){return{id:id,name:name,kind:kind,color:color,accent:accent}}
function M(a,t,d,x,y,style,curve){return{type:'move',actor:a,t:t,d:d,x:x,y:y,style:style||'walk',curve:curve||'auto'}}
function Y(a,t,d,text,emo){return{type:'say',actor:a,t:t,d:d,text:text,emo:emo}}
function X(t,sfx){return{type:'sfx',t:t,d:.5,sfx:sfx}}
function C(a,x,y,flip){return{actor:a,x:x,y:y,flip:!!flip}}
var TPL=[
 {n:'الروبوت والصديق',b:function(){return{title:'بولت وليلى',music:'adventure',actors:[A('a1','بولت','robot','#6c8ead','#ffd166'),A('a2','ليلى','boy','#e76f51','#f1c27d')],scenes:[
  {title:'اللقاء',bg:'room',dur:9,cast:[C('a1',80,84,true),C('a2',10,84)],steps:[Y('a2',.4,2.4,'من أنت؟','surprised'),M('a1',2.6,2,58,84,'slide','back'),Y('a1',4.8,3,'أنا بولت، روبوت جديد!','happy'),X(4.7,'ding')]},
  {title:'نزهة في الغابة',bg:'forest',fx:'sparkle',cam:'panr',dur:9,cast:[C('a2',8,84),C('a1',3,88)],steps:[M('a2',.3,4,60,84),M('a1',.5,4,45,88,'slide'),Y('a1',4.6,3.2,'ما أجمل الأشجار!','happy')]},
  {title:'نحو النجوم',bg:'space',cam:'zin',dur:9,cast:[C('a2',25,84),C('a1',55,86,true)],steps:[Y('a2',.5,2.8,'هل نصل إلى الفضاء؟','surprised'),Y('a1',3.6,2.8,'سنصل يومًا ما!','happy'),X(6.6,'tada')]}]}}},
 {n:'يوم ممطر',b:function(){return{title:'المطر والقط',music:'calm',actors:[A('a1','ميمو','cat','#f4a259','#ffe6c7'),A('a2','سامي','boy','#3a86ff','#f1c27d')],scenes:[
  {title:'تحت المطر',bg:'day',fx:'rain',dur:8,cast:[C('a1',70,86,true),C('a2',10,84)],steps:[Y('a1',.4,2.6,'يا للمطر! أنا مبلل!','sad'),M('a2',3,3,48,84),Y('a2',6,2,'تعال معي!','happy')]},
  {title:'الدفء',bg:'room',dur:8,cast:[C('a2',15,84),C('a1',5,88)],steps:[M('a1',.3,3,50,88,'hop'),Y('a1',3.6,2.8,'ما أدفأ البيت!','happy'),X(3.5,'pop')]}]}}},
 {n:'مغامرة الصحراء',b:function(){return{title:'سر الأهرامات',music:'adventure',actors:[A('a1','كريم','boy','#3a86ff','#f1c27d'),A('a2','ميمو','cat','#f4a259','#ffe6c7')],scenes:[
  {title:'الوصول',bg:'desert',cam:'zout',dur:9,cast:[C('a1',8,84),C('a2',2,88)],steps:[M('a1',.3,4,45,84),M('a2',.5,4,32,88,'hop'),Y('a1',4.6,3,'انظر إلى الأهرامات!','surprised')]},
  {title:'الليل',bg:'night',cam:'shake',dur:8,cast:[C('a1',30,84),C('a2',60,88,true)],steps:[Y('a2',.5,2.4,'سمعت صوتًا!','surprised'),X(.4,'drum'),Y('a1',3.5,3,'لا تخف، أنا معك.','happy')]}]}}}
];
function useTemplate(i){
  var t=TPL[i];if(!t)return;var o=cleanProject(t.b());if(!o){toast('تعذر تحميل القالب');return}
  clearTimeout(save.h);pushHist();S.si=0;S.T=0;loadP(o);pushHist();histUI();toast('تم تحميل القالب، يمكنك التراجع لاسترجاع مشروعك')}
function planHTML(){
  var h='<div><label class="l" for="ptitle">عنوان الفيلم</label><input type="text" id="ptitle" data-m="proj" data-k="title" value="'+esc(P.title)+'"></div>';
  h+='<div class="row between"><h3>لوحة القصة</h3><button class="btn sm pri" data-a="add-scene">+ مشهد جديد</button></div>';
  h+='<div class="row"><button class="btn sm" data-a="add-title">+ بطاقة عنوان</button><button class="btn sm" data-a="add-credits">+ شارات النهاية</button></div>';
  h+='<p class="hint">كل بطاقة مشهد. اضغط الصورة لمشاهدته، و«تحرير» لضبط الحركة والحوار.</p>';
  h+='<div class="row"><select id="tplSel" style="flex:1" aria-label="قالب">'+TPL.map(function(t,i){return '<option value="'+i+'">'+t.n+'</option>'}).join('')+'</select><button class="btn sm" data-a="use-tpl">ابدأ من قالب</button></div>';
  P.scenes.forEach(function(s,i){
    h+='<div class="card" '+(i===S.si?'aria-current="true"':'')+'><canvas width="320" height="180" data-thumb="'+i+'" data-a="sel-scene" data-i="'+i+'" tabindex="0" role="button" aria-label="عرض المشهد: '+esc(s.title)+'"></canvas><div class="f">'
     +'<input type="text" data-m="scn" data-id="'+s.id+'" data-k="title" value="'+esc(s.title)+'" aria-label="عنوان المشهد">'
     +'<div class="hint">'+(s.kind==='card'?(s.mode==='credits'?'شارات':'عنوان')+' · '+s.dur+' ث':bgName(s)+' · '+s.dur+' ث · '+s.cast.length+' شخصيات')+'</div>'
     +'<div class="row"><button class="btn sm" data-a="go-prod" data-i="'+i+'">تحرير</button>'
     +'<button class="btn sm" data-a="up" data-i="'+i+'" aria-label="تقديم">▲</button><button class="btn sm" data-a="down" data-i="'+i+'" aria-label="تأخير">▼</button>'
     +'<button class="btn sm" data-a="dup" data-i="'+i+'">نسخ</button><button class="btn sm dng" data-a="del-scene" data-i="'+i+'">حذف</button></div></div></div>';
  });
  return h;
}
