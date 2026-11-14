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
function A(id,name,kind,color,accent,hair,pants){var o={id:id,name:name,kind:kind,color:color,accent:accent};if(hair)o.hair=hair;if(pants)o.pants=pants;return o}
function M(a,t,d,x,y,style,curve){return{type:'move',actor:a,t:t,d:d,x:x,y:y,style:style||'walk',curve:curve||'auto'}}
function Y(a,t,d,text,emo){return{type:'say',actor:a,t:t,d:d,text:text,emo:emo}}
function X(t,sfx){return{type:'sfx',t:t,d:.5,sfx:sfx}}
function C(a,x,y,flip){return{actor:a,x:x,y:y,flip:!!flip}}

/* السطر: [الشخصية، النص، التعبير، خيارات]. الخيارات: d مدة الجملة، fx مؤثر بصري (مع fxo إزاحة وfxd مدة)، sfx مؤثر صوتي (مع sfxo إزاحة)، bd شارة على الشاشة (مع bdo إزاحة وbdd مدة)، وإن احتوت «=» فهي لافتة مفردة بلون أزرق، ac إيماءة (مع acd مدة)، mv حركة [x,y,النمط,المدة] تبدأ مع الجملة */
function lessonScene(title,bg,cast,lines,extra){
  var t=.5,steps=[];lines.forEach(function(l){var o=l[3]||{},d=o.d||Math.min(12,Math.max(2.6,Math.round((l[1].length*.075+.8)*10)/10));
    steps.push(Y(l[0],t,d,l[1],l[2]));
    if(o.fx)steps.push({type:'fx',fx:o.fx,t:+(t+(o.fxo||0)).toFixed(1),d:o.fxd||d});
    if(o.bd){var vq=o.bd.indexOf('=')>=0,bo=o.bdo,bdd=o.bdd;
      if(vq){var w0=o.bd.split('=')[0].trim(),ix=l[1].indexOf(w0);
        if(bo==null){bo=ix>=0?ix/Math.max(1,l[1].length)*d*.8+.45:.6;bo=Math.max(.3,Math.min(bo,d-.6))}
        if(bdd==null)bdd=Math.min(2.8,d-bo+.9)}
      steps.push({type:'fx',fx:'badge',label:o.bd,t:+(t+(bo||0)).toFixed(1),d:bdd||d});
      if(vq)steps.push(X(+(t+(bo||0)).toFixed(1),'pop'))}
    if(o.sfx)steps.push(X(+(t+(o.sfxo||0)).toFixed(1),o.sfx));
    if(o.ac)steps.push({type:'act',actor:l[0],t:+(t+(o.aco||0)).toFixed(1),d:o.acd||1.5,act:o.ac});
    if(o.mv)steps.push(M(l[0],+(t+(o.mvo||0)).toFixed(1),o.mv[3]||1.6,o.mv[0],o.mv[1],o.mv[2]||'walk'));
    t+=d+.3});
  (extra||[]).forEach(function(e){steps.push(e)});
  return{title:title,bg:bg,dur:Math.min(40,Math.ceil(t+.7)),cast:cast,steps:steps}}
function V(sc,cam,trans){sc.cam=cam;sc.trans=trans;return sc}
function lessonProject(hero){
  var S1='a1',F='a2',N='a3';
  var AS=hero&&typeof ASSETS!=='undefined'?ASSETS:null,R4='a4',W5='a5';
  var a0=AS?assetActor(S1,'سامي',AS.sami):hero&&typeof HERO!=='undefined'?{id:S1,name:'سامي',kind:'img',color:'#8d99ae',accent:'#e8eaf0',img:HERO.img,poses:HERO.poses}:A(S1,'سامي','boy','#d62828','#f5c9a0','#7a4a2a','#2b59b8');
  var a1=AS?assetActor(F,'يوسف',AS.friend):A(F,'يوسف','boy','#3a8ee0','#8a5a3c','#1b1b1b','#4a4f60');
  var a2=AS&&AS.mona?assetActor(N,'منى',AS.mona):A(N,'منى','girl','#f2b134','#f5c9a0','#3b2415');
  var acts=[a0,a1,a2];
  if(AS){acts.push(assetActor(R4,'الجهاز السحري',AS.remote));acts.push(assetActor(W5,'مكبّر الصوت الساحر',AS.wizard))}
  /* الأدوات (R4, W5) تُحذف تلقائيًا من المشاهد إن لم تكن ضمن الممثلين */
  return{title:'فكّر قليلًا.. تربح كثيرًا',music:'calm',actors:acts,scenes:[
  {kind:'card',title:'العنوان',mode:'title',t1:'فكّر قليلًا.. تربح كثيرًا',t2:'الوحدة الثانية: أخلاقي.. حياتي',bg:'school',dur:5},
  V(lessonScene('لحظة اندفاع','hallway',[C(S1,25,84),C(F,75,84,true),C(N,100,88,true)],[[S1,'لماذا أخذت ساندويتشي؟!','angry'],[F,'أنا آسف، لم أقصد!','scared',{mv:[82,86,'slide',1.2]}],[S1,'دائمًا تفعل هذا! لن أكلّمك بعد اليوم!','angry',{ac:'jump',acd:1}],[F,'كنت جائعًا ونسيت طعامي في البيت..','sad'],[N,'سامي، انتظر! ماذا حدث للتو؟','surprised']],[M(S1,.5,2.5,38,84,'walk'),M(N,8,4.5,50,88,'walk')]),'follow','cut'),
  V(lessonScene('الجهاز السحري','livingroom',[C(R4,50,64),C(S1,28,84),C(N,74,84,true)],[[N,'ما حدث الآن اسمه الاندفاع: أن تتصرف قبل أن تفكر.','neutral'],[N,'تخيّل أن لديك جهازًا سحريًا للتحكم عن بُعد، يوقفك كلما كنت توشك أن تتصرف دون تفكير.','happy',{bd:'توشك = تقترب'}],[S1,'جهاز سحري؟ وهل هو موجود فعلًا؟','surprised',{ac:'jump',acd:1}],[N,'نعم! إنه موجود بالفعل داخل عقلك.','happy',{ac:'wave',acd:1.6}]]),'follow','cross'),
  V(lessonScene('التسرّع','classroom',[C(S1,28,84),C(F,52,88),C(N,76,84,true)],[[F,'وتريد أن تجيب عن سؤال بسرعة قبل أن تسمع السؤال كاملًا.','neutral'],[S1,'أعرف الإجابة! أنا أعرفها!','happy',{ac:'jump',acd:1.4}],[N,'لكن السؤال لم ينتهِ بعد!','surprised']]),'panr','wipe'),
  V(lessonScene('الشراء بلا تفكير','entrance',[C(S1,30,84),C(F,70,84,true),C(N,50,88)],[[N,'وتريد شراء شيء لمجرد أنك رأيته، دون التفكير في ثمنه أو الحاجة إليه.','neutral'],[S1,'ما أجمل هذه اللعبة! سأشتريها الآن!','love',{mv:[40,84,'hop',1.6]}],[F,'وهل تحتاجها فعلًا يا سامي؟','surprised']]),'panl','slide'),
  V(lessonScene('الندم','bedroom',[C(S1,50,84),C(N,18,88),C(F,82,86,true)],[[S1,'ليتني فكّرت قبل أن أتصرف..','sad',{ac:'bow',acd:2}],[N,'معظم الأخطاء التي نقع فيها تحدث لأننا لا نتحكم في انفعالاتنا حين نكون مندفعين.','neutral'],[F,'والاندفاع يعني أن تتصرف قبل أن تفكر.','neutral'],[S1,'وأنا أندم بعدها كثيرًا.','sad']]),'zout','fade'),
  V(lessonScene('الاندفاع المفيد','playground',[C(F,26,84),C(S1,50,88),C(N,76,84,true)],[[F,'وقد يكون الاندفاع مفيدًا أحيانًا.','happy'],[F,'تخيّل أن دراجة تسرع نحو طفل صغير!','surprised'],[S1,'سأركض وأسحبه فورًا!','scared',{mv:[36,88,'run',1.4]}],[N,'صحيح! هذا اندفاع مفيد، لأنه ينقذ شخصًا في خطر.','happy'],[N,'لكن في كثير من الأحيان يجعلنا نندم، لأننا لم نمنح عقولنا وقتًا للتفكير.','sad',{bd:'الأحيان = الأوقات · نمنح = نعطي'}],[S1,'إذن كيف نفعّل جهاز التحكم في انفعالاتنا؟','surprised',{bd:'نفعّل = نشغّل'}]]),'panr','slide'),
  V(lessonScene('الإشارة الحمراء','magicforest',[C(R4,46,63),C(S1,24,84),C(N,68,84,true),C(F,88,86,true)],[[N,'أولًا انتبه إلى الإشارة الحمراء، وهي تنبّهك أنك في حالة اندفاع.','neutral',{fx:'alert',fxo:1.2,fxd:3.6,bd:'١ · انتبه'}],[F,'فعندما تشعر أن قلبك ينبض بسرعة، أو أن صوتًا بداخلك يقول: افعلها الآن!','neutral',{bd:'ينبض = يدق'}],[S1,'قلبي يدق بسرعة!','scared',{fx:'pulse',fxd:3.2}],[F,'هذه إشارة أنك على وشك الاندفاع.','surprised',{sfx:'ding'}]]),'follow','cross'),
  V(lessonScene('زر التوقف','garden',[C(S1,22,84),C(R4,46,64),C(F,68,88,true),C(N,88,84,true)],[[N,'فعليك أن تستخدم الجهاز: توقّف للحظة، وخذ نفسًا عميقًا.','happy',{bd:'٢ · توقّف وتنفّس'}],[S1,'شهيق..','sleepy',{d:4,fx:'breath',fxd:8,mv:[34,84,'walk',2]}],[S1,'وزفير..','sleepy',{d:3.7}],[F,'وأعطِ نفسك فرصة لتفكّر في النتائج التي تترتب على هذا الفعل.','neutral',{bd:'٣ · فكّر ثم تصرّف'}],[S1,'الآن أستطيع أن أفكر بهدوء.','happy']],[X(.3,'pop')]),'zin','cross'),
  {kind:'card',title:'نعيد المشهد',mode:'title',t1:'نعيد المشهد من جديد',t2:'لكن هذه المرة.. بالجهاز السحري',bg:'hallway',dur:4,trans:'wipe'},
  V(lessonScene('القرار الصائب','hallway',[C(S1,25,84),C(F,75,84,true),C(N,50,88)],[[S1,'لماذا أخذت ساندويتشي؟!','angry',{fx:'alert',fxo:.2,fxd:2.4,bd:'١ · انتبه'}],[N,'سامي، ظهرت الإشارة الحمراء! توقّف وخذ نفسًا.','happy',{bd:'٢ · توقّف وتنفّس'}],[S1,'شهيق.. وزفير..','sleepy',{d:6.5,fx:'breath',fxd:6.5}],[F,'آسف يا سامي، أخذت ساندويتشك بالخطأ.','sad',{bd:'٣ · فكّر ثم تصرّف'}],[S1,'لا بأس! سنتقاسمه معًا.','happy'],[F,'وغدًا سأحضر لك ساندويتشًا مثله!','happy'],[N,'هكذا يعمل جهاز التحكم: فكّر أولًا، ثم تصرّف.','happy',{sfx:'tada',sfxo:.6}]],[M(S1,.5,2.5,38,84,'walk')]),'follow','wipe'),
  V(lessonScene('والآن أخبرنا','classroom',[C(S1,20,84),C(W5,44,66),C(F,66,88,true),C(N,86,84,true)],[[N,'والآن أخبرنا: ماذا تفعل عندما تكون غاضبًا أو متسرعًا؟','happy',{ac:'wave',acd:1.6}],[F,'هل سبق أن اتخذت قرارًا سريعًا ثم ندمت عليه لاحقًا؟','neutral',{bd:'لاحقًا = فيما بعد'}],[S1,'وهل سبق أن اتخذت قرارًا بعد تفكير ثم تأكدت أنه كان صائبًا؟ صف لنا الموقف.','happy']]),'zout','cross'),
  {kind:'card',title:'الخلاصة',mode:'list',t1:'الخلاصة: انتبه · توقّف · فكّر',t2:'انتبه للإشارة الحمراء\nتوقّف وخذ نفسًا عميقًا\nفكّر في النتائج ثم تصرّف',bg:'garden',dur:9},
  {kind:'card',title:'المفردات',mode:'credits',t1:'المفردات الجديدة',t2:'توشك: تقترب · الأحيان: الأوقات\nنمنح: نعطي، وضدها نمنع\nينبض: يدق · لاحقًا: فيما بعد\nتفعيل: تشغيل، وضدها تعطيل',bg:'night',dur:9}]}}
var TPL=[
 {n:'درس بسامي الرئيسي (من صورك)',b:function(){return lessonProject(true)}},
 {n:'درس: فكّر قليلًا.. تربح كثيرًا',b:function(){return lessonProject()}},
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
     +'<button class="btn sm" data-a="dup" data-i="'+i+'">نسخ</button><button class="btn sm" data-a="dup-edit" data-i="'+i+'">نسخ وتعديل</button><button class="btn sm dng" data-a="del-scene" data-i="'+i+'">حذف</button></div></div></div>';
  });
  return h;
}
