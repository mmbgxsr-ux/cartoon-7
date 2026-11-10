'use strict';
/* ---------- crash banner ----------
   Nothing leaves the device. On an unexpected error we show a banner with details the person can copy and a button
   that downloads a backup of the project. We deliberately do NOT auto-save here: a half-broken state could overwrite
   the last good copy in storage (the normal debounced autosave and its rotating backups keep running). */
var ERRLOG=[];
function errText(r){
  if(r&&typeof r==='object')return (r.name?r.name+': ':'')+(r.message||String(r));
  return r==null?'خطأ غير معروف':String(r);
}
function crashDetails(){
  var n=typeof P!=='undefined'&&P&&P.scenes?P.scenes.length:'?';
  return ERRLOG.map(function(e){return e.msg+(e.n>1?'  (×'+e.n+')':'')+'\n'+(e.where?'at '+e.where+'\n':'')+(e.stack||'')}).join('\n\n')
    +'\n\nscenes: '+n+'\n'+navigator.userAgent+'\n'+new Date().toISOString();
}
function copyText(s){
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(s);
  return new Promise(function(ok,no){
    try{var t=document.createElement('textarea');t.value=s;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();
      var done=document.execCommand('copy');t.remove();done?ok():no()}catch(e){no(e)}
  });
}
function crashNote(m){if(typeof toast==='function')toast(m)}
function crashBar(){
  var b=document.getElementById('errbar');if(b)return b;
  b=document.createElement('div');b.id='errbar';b.setAttribute('role','alert');
  var p=document.createElement('p');p.textContent='حدث خطأ غير متوقع. الحفظ التلقائي مستمر، ويمكنك حفظ نسخة من مشروعك الآن.';
  var row=document.createElement('div');row.className='row';
  function btn(label,fn,pri){var x=document.createElement('button');x.type='button';x.className='btn sm'+(pri?' pri':'');x.textContent=label;x.onclick=fn;row.appendChild(x)}
  btn('حفظ نسخة من المشروع',function(){try{exportProject()}catch(e){crashNote('تعذر حفظ النسخة')}},true);
  btn('نسخ تفاصيل الخطأ',function(){copyText(crashDetails()).then(function(){crashNote('نُسخت التفاصيل')},function(){crashNote('تعذر النسخ، حدّد النص يدويًا')})});
  btn('إغلاق',function(){b.remove()});
  var d=document.createElement('details'),s=document.createElement('summary'),pre=document.createElement('pre');
  s.textContent='التفاصيل';pre.id='errdetails';d.appendChild(s);d.appendChild(pre);
  b.appendChild(p);b.appendChild(row);b.appendChild(d);document.body.appendChild(b);return b;
}
function crash(reason,where){
  try{
    if(reason&&/^(AbortError|NotAllowedError)$/.test(reason.name))return; /* user cancelled / autoplay policy: not a bug */
    var msg=errText(reason),hit=null;
    ERRLOG.forEach(function(e){if(e.msg===msg&&e.where===where)hit=e});
    var st=reason&&reason.stack?String(reason.stack).split('\n'):[];
    if(st.length&&st[0].indexOf(msg)===0)st.shift(); /* V8 starts the stack with the message we already show */
    if(hit)hit.n++;else{ERRLOG.push({msg:msg,where:where||'',n:1,stack:st.slice(0,6).join('\n')});if(ERRLOG.length>10)ERRLOG.shift()}
    crashBar();document.getElementById('errdetails').textContent=crashDetails();
  }catch(e){}
}
window.addEventListener('error',function(ev){
  if(!ev.error&&/^(ResizeObserver|Script error)/.test(ev.message||''))return;
  crash(ev.error||ev.message,ev.filename?String(ev.filename).split('/').pop()+':'+ev.lineno:'');
});
window.addEventListener('unhandledrejection',function(ev){crash(ev.reason,'promise')});
