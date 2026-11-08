'use strict';
/* ---------- easing curves ---------- */
var CRVN={auto:'تلقائي',smooth:'سلس',linear:'ثابت السرعة',in:'يتسارع',out:'يتباطأ',back:'ارتداد في النهاية',antic:'ترقّب قبل الانطلاق',bounce:'نطّ عند الوصول',elastic:'مطّاطي'};
var CURVES={
  linear:function(u){return u},
  smooth:function(u){return ease(u)},
  in:function(u){return u*u*u},
  out:function(u){var v=1-u;return 1-v*v*v},
  back:function(u){var c1=1.70158,c3=c1+1,v=u-1;return 1+c3*v*v*v+c1*v*v},
  antic:function(u){var c1=1.70158,c3=c1+1;return c3*u*u*u-c1*u*u},
  bounce:function(u){var n=7.5625,d=2.75;if(u<1/d)return n*u*u;if(u<2/d){u-=1.5/d;return n*u*u+.75}if(u<2.5/d){u-=2.25/d;return n*u*u+.9375}u-=2.625/d;return n*u*u+.984375},
  elastic:function(u){return u<=0?0:u>=1?1:Math.pow(2,-10*u)*Math.sin((u*10-.75)*2*Math.PI/3)+1}
};
function curveAt(name,style,u){
  if(!CURVES[name])name='auto';
  if(name==='auto')name=style==='hop'?'linear':'smooth';
  return CURVES[name](clamp(u,0,1));
}
function curveSVG(name,style){
  var pts=[],N=40,y=function(v){return 54-(v+.25)/1.5*48};
  for(var i=0;i<=N;i++){var u=i/N;pts.push((6+u*108).toFixed(1)+','+y(curveAt(name,style,u)).toFixed(1))}
  return '<svg viewBox="0 0 120 60" width="120" height="60" role="img" aria-label="رسم منحنى التسارع" style="background:var(--surface2);border:1px solid var(--line);border-radius:8px;flex:none">'
   +'<line x1="6" x2="114" y1="'+y(0)+'" y2="'+y(0)+'" stroke="var(--line)" stroke-dasharray="3 3"/><line x1="6" x2="114" y1="'+y(1)+'" y2="'+y(1)+'" stroke="var(--line)" stroke-dasharray="3 3"/>'
   +'<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round"/></svg>';
}
function curveRow(st){
  var c=st.curve||'auto';
  return '<div class="row" style="align-items:flex-end"><div style="flex:1"><label class="l">منحنى التسارع</label><select data-m="step" data-id="'+st.id+'" data-k="curve">'+opts(CRVN,c)+'</select></div>'+curveSVG(c,st.style)+'</div>';
}
function stepHTML(s){if(s.type==='sfx')return sfxHTML(s);
  var h='<div class="step"><div class="row between"><span class="badge '+s.type+'">'+(s.type==='move'?'حركة':s.type==='act'?'إيماءة':'كلام')+'</span>'
   +'<button class="btn sm dng" data-a="del-step" data-id="'+s.id+'">حذف</button></div><div class="row">'
   +'<div><label class="l">الشخصية</label><select data-m="step" data-id="'+s.id+'" data-k="actor">'+actorOpts(s.actor)+'</select></div>'
   +num('البداية (ث)','step',s.id,'t',s.t,0,60,.1)+num('المدة (ث)','step',s.id,'d',s.d,.3,30,.1)+'</div>';
  if(s.type==='move')h+='<div class="row"><div><label class="l">الأسلوب</label><select data-m="step" data-id="'+s.id+'" data-k="style">'+opts(STY,s.style)+'</select></div>'
   +num('الموضع أفقيًا %','step',s.id,'x',s.x,0,100,1)+num('العمق %','step',s.id,'y',s.y,60,95,1)+'</div>'+curveRow(s);
  else if(s.type==='act')h+='<div><label class="l">الإيماءة</label><select data-m="step" data-id="'+s.id+'" data-k="act">'+opts(ACTN,s.act||'wave')+'</select></div>';
  else h+='<div><label class="l">النص</label><input type="text" data-m="step" data-id="'+s.id+'" data-k="text" value="'+esc(s.text||'')+'"></div>'
   +'<div><label class="l">تعبير الوجه</label><select data-m="step" data-id="'+s.id+'" data-k="emo">'+opts(EMO,s.emo||'neutral')+'</select></div>'+voiceRow(s);
  return h+'</div>';
}
function prodHTML(){
  if(cur().kind==='card')return cardHTML(cur());
  var s=cur(),h='<div class="row between"><h3>المشهد: '+esc(s.title)+'</h3></div>';
  h+='<div class="row"><div><label class="l">الخلفية</label><select data-m="scn" data-id="'+s.id+'" data-k="bg">'+opts(bgMap(s),s.bg)+'</select></div><div><label class="l">الكاميرا</label><select data-m="scn" data-id="'+s.id+'" data-k="cam">'+opts(CAMN,s.cam||'fixed')+'</select></div><div><label class="l">الانتقال إلى المشهد</label><select data-m="scn" data-id="'+s.id+'" data-k="trans">'+opts(TRN,s.trans||'fade')+'</select></div><div><label class="l">المؤثر البصري</label><select data-m="scn" data-id="'+s.id+'" data-k="fx">'+opts(FXN,s.fx||'none')+'</select></div>'+num('المدة (ث)','scn',s.id,'dur',s.dur,3,40,.5)+'</div>';
  h+='<div class="row"><button class="btn sm" data-a="bg-photo">خلفية من معرض الصور</button>'+(s.bg==='photo'?'<button class="btn sm dng" data-a="bg-clear">إزالة صورة الخلفية</button>':'')+'</div>';
  h+='<h3>الشخصيات في المشهد</h3>';
  s.cast.forEach(function(c){h+='<div class="step"><div class="row between"><b>'+esc(actorOf(c.actor).name)+'</b><button class="btn sm dng" data-a="del-cast" data-id="'+c.actor+'">إزالة</button></div><div class="row">'
    +num('البداية أفقيًا %','cast',c.actor,'x',c.x,0,100,1)+num('العمق %','cast',c.actor,'y',c.y,60,95,1)
    +'<div><label class="l">يواجه اليسار</label><input type="checkbox" data-m="cast" data-id="'+c.actor+'" data-k="flip"'+(c.flip?' checked':'')+'></div></div></div>'});
  var free=P.actors.filter(function(a){return !s.cast.some(function(c){return c.actor===a.id})});
  if(free.length)h+='<div class="row"><select id="castAdd" style="flex:1">'+free.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>'}).join('')+'</select><button class="btn sm" data-a="add-cast">+ إضافة للمشهد</button></div>';
  h+='<div class="row between"><h3>الحركة والحوار</h3><div class="row"><button class="btn sm pri" data-a="add-step" data-v="move">+ حركة</button><button class="btn sm pri" data-a="add-step" data-v="act">+ إيماءة</button><button class="btn sm pri" data-a="add-step" data-v="say">+ كلام</button><button class="btn sm pri" data-a="add-step" data-v="sfx">+ صوت</button></div></div>';
  var st=s.steps.slice().sort(function(a,b){return a.t-b.t});
  if(!st.length)h+='<p class="hint">لا توجد خطوات بعد. أضف حركة أو جملة حوار.</p>';
  st.forEach(function(x){h+=stepHTML(x)});
  return h;
}
