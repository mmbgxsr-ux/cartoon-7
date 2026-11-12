'use strict';
/* ---------- motion strips: ONE image holds N animation frames of a photo character ---------- */
/* Pure helpers (keyImage, stripBounds, stripLayout, stripPick) work on RGBA arrays so they can be unit-tested. */

function smoothstep(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function keyMetric(mode,r,g,b){return mode==='green'?g-Math.max(r,b):mode==='blue'?b-Math.max(r,g):Math.min(r,b)-g}

/* guess the background colour from the four corners: green|blue|magenta|white|none(transparent)|null(unknown) */
function detectKey(d,w,h){
  var bs=Math.max(1,Math.min(12,w>>2,h>>2)),cs=[[0,0],[w-bs,0],[0,h-bs],[w-bs,h-bs]],r=0,g=0,b=0,n=0,tr=0,k,x,y,j;
  for(k=0;k<4;k++)for(y=cs[k][1];y<cs[k][1]+bs;y++)for(x=cs[k][0];x<cs[k][0]+bs;x++){j=(y*w+x)*4;n++;if(d[j+3]<20)tr++;r+=d[j];g+=d[j+1];b+=d[j+2]}
  if(!n)return null;if(tr/n>.9)return 'none';
  r/=n;g/=n;b/=n;
  var best=null,bv=90,m;
  ['green','blue','magenta'].forEach(function(md){m=keyMetric(md,r,g,b);if(m>bv){bv=m;best=md}});
  if(best)return best;
  if(r>225&&g>225&&b>225)return 'white';
  return null;
}

/* remove a flat chroma-key background in place; edge pixels get partial alpha and the key colour is "despilled" */
function keyImage(d,w,h,mode){
  var n=w*h,i,j,r,g,b,s,a,m;
  for(i=0;i<n;i++){j=i*4;if(d[j+3]===0)continue;
    r=d[j];g=d[j+1];b=d[j+2];s=keyMetric(mode,r,g,b);a=1-smoothstep(50,130,s);
    if(a<1||s>35){
      if(mode==='green'){m=Math.max(r,b);if(g>m)d[j+1]=m}
      else if(mode==='blue'){m=Math.max(r,g);if(b>m)d[j+2]=m}
      else if(s>0){d[j]=Math.max(g,r-s);d[j+2]=Math.max(g,b-s)}}
    if(a<1)d[j+3]=Math.round(d[j+3]*a)}
}

/* find the n frames of a horizontal strip: cut where the gap between figures is, searching near the equal-split guess */
function stripBounds(d,w,h,n){
  var cols=[],x,y,o,first=-1,last=-1;
  for(x=0;x<w;x++)cols[x]=0;
  for(y=0;y<h;y++){o=y*w*4+3;for(x=0;x<w;x++,o+=4)if(d[o]>128)cols[x]++}
  for(x=0;x<w;x++)if(cols[x]>2){if(first<0)first=x;last=x}
  if(first<0||n<1)return null;
  var cw=(last-first+1)/n,segs=[],start=first,mode='gaps',i;
  for(i=1;i<n;i++){
    var ex=first+i*cw,lo=Math.max(start+1,Math.round(ex-cw*.35)),hi=Math.min(last-1,Math.round(ex+cw*.35)),bs=-1,be=-1,bsc=-1e9,rs=-1,xx;
    for(xx=lo;xx<=hi+1;xx++){
      if(xx<=hi&&cols[xx]<=2){if(rs<0)rs=xx}
      else if(rs>=0){var len=xx-rs,sc=len-.15*Math.abs((rs+xx-1)/2-ex);if(sc>bsc){bsc=sc;bs=rs;be=xx-1}rs=-1}}
    if(bs<0){mode='equal';var mn=1e9,mx=Math.round(ex);for(xx=lo;xx<=hi;xx++)if(cols[xx]<mn){mn=cols[xx];mx=xx}bs=be=mx}
    if(bs-1<start)return null;
    segs.push([start,bs-1]);start=be+1}
  if(last<start)return null;
  segs.push([start,last]);
  return {segs:segs,mode:mode}
}

function measureFrame(d,w,h,x0,x1){
  var ymin=h,ymax=-1,xmin=w,xmax=-1,y,x,o;
  for(y=0;y<h;y++)for(x=x0;x<=x1;x++){if(d[(y*w+x)*4+3]>128){if(y<ymin)ymin=y;if(y>ymax)ymax=y;if(x<xmin)xmin=x;if(x>xmax)xmax=x}}
  if(ymax<0)return null;
  var cut=ymin+Math.round((ymax-ymin+1)*.55),sx=0,c=0;
  for(y=ymin;y<cut;y++)for(x=xmin;x<=xmax;x++)if(d[(y*w+x)*4+3]>128){sx+=x;c++}
  return {x0:x0,x1:x1,ymin:ymin,ymax:ymax,xmin:xmin,xmax:xmax,ax:c?sx/c:(xmin+xmax)/2}
}

/* anchor every frame on its body (not its bounding box) and its feet, so the figure doesn't jitter */
function stripLayout(d,w,h,n){
  var b=stripBounds(d,w,h,n);if(!b||b.segs.length!==n)return null;
  var fr=[],i,half=0,H=0,hs=[],st=0;
  for(i=0;i<n;i++){var m=measureFrame(d,w,h,b.segs[i][0],b.segs[i][1]);if(!m)return null;fr.push(m)}
  fr.forEach(function(m,k){half=Math.max(half,m.ax-m.xmin+1,m.xmax-m.ax+1);var fh=m.ymax-m.ymin+1;hs.push(fh);H=Math.max(H,fh);
    if(m.xmax-m.xmin<fr[st].xmax-fr[st].xmin)st=k});
  hs.sort(function(p,q){return p-q});
  var med=hs.length%2?hs[hs.length>>1]:(hs[hs.length/2-1]+hs[hs.length/2])/2;
  half=Math.ceil(half)+4;
  return {frames:fr,half:half,cw:half*2,H:H+4,med:med,st:st,mode:b.mode}
}

/* canvas wrapper: key out the background, split, align and pack the frames into one atlas */
function buildStrip(c,n,keyMode){
  var w=c.width,h=c.height,q=c.getContext('2d'),im=q.getImageData(0,0,w,h),mode=keyMode;
  if(!mode||mode==='auto')mode=detectKey(im.data,w,h);
  if(mode==='green'||mode==='blue'||mode==='magenta'){keyImage(im.data,w,h,mode);q.putImageData(im,0,0)}
  else if(mode!=='none'){removeBg(c);im=q.getImageData(0,0,w,h)}
  var L=stripLayout(im.data,w,h,n);if(!L)return null;
  var s=Math.min(1.2,380/L.med),cwS=Math.max(8,Math.ceil(L.cw*s)),hS=Math.max(8,Math.ceil(L.H*s));
  while(cwS*n>4096&&s>.2){s*=.9;cwS=Math.max(8,Math.ceil(L.cw*s));hS=Math.max(8,Math.ceil(L.H*s))}
  var out=document.createElement('canvas');out.width=cwS*n;out.height=hS;var o=out.getContext('2d');
  L.frames.forEach(function(m,i){
    var sx=Math.round(m.ax-L.half),sy=m.ymax+3-L.H,dx=i*cwS,c0=clamp((m.x0-sx)*cwS/L.cw,0,cwS),c1=clamp((m.x1+1-sx)*cwS/L.cw,0,cwS);
    o.save();o.beginPath();o.rect(dx+c0,0,Math.max(0,c1-c0),hS);o.clip();
    o.drawImage(c,sx,sy,L.cw,L.H,dx,0,cwS,hS);o.restore()});
  var f=L.frames[L.st],sw=f.xmax-f.xmin+1,sh=f.ymax-f.ymin+1,k=380/sh,stand=document.createElement('canvas');
  stand.width=Math.max(1,Math.round(sw*k));stand.height=380;
  stand.getContext('2d').drawImage(c,f.xmin,f.ymin,sw,sh,0,0,stand.width,stand.height);
  return {img:encAlpha(out),n:n,cw:cwS,ch:hS,h:Math.max(8,Math.round(L.med*hS/L.H)),mode:L.mode,key:mode,stand:stand}
}

/* which strip and frame to show for this pose; null when the actor has no suitable strip */
function stripPick(a,p,T){
  var st=a.strips;if(!st)return null;
  var act,pr=0;
  if(p.jp!=null){act='jump';pr=p.jp}
  else if(p.act==='sit'){act='sit';pr=p.ap||0}
  else if(p.act==='wave')act='wave';
  else if(p.walk)act=p.run?'run':'walk';
  else if(p.talk)act='talk';
  else act='idle';
  var acts=act==='run'?['run','walk']:act==='talk'?['talk','idle']:[act],
    moving=act==='walk'||act==='run'||act==='jump',
    views=moving&&p.view?[p.view,'side','front','back']:['front','side','back'],ai,vi;
  for(ai=0;ai<acts.length;ai++)for(vi=0;vi<views.length;vi++){
    var key=acts[ai]+':'+views[vi],s=st[key];if(!s)continue;
    var n=s.n,i;
    if(act==='walk'||act==='run')i=Math.floor((((p.phase/(2*Math.PI))%1)+1)%1*n)%n;
    else if(act==='jump')i=Math.min(n-1,Math.floor(clamp(pr,0,.999)*n));
    else if(act==='sit')i=Math.min(n-1,Math.floor(clamp(pr*1.5,0,.999)*n));
    else if(act==='wave')i=Math.floor(T*8)%n;
    else if(act==='talk'&&acts[ai]==='talk')i=Math.round((p.vis?clamp(p.vis[0]/14,0,1):Math.abs(Math.sin(T*10+(p.seed||0))))*(n-1));
    else i=Math.floor(T*3)%n;
    return {s:s,i:i,key:key,act:act}}
  return null;
}

/* ---------- UI + actions ---------- */
function stripCtl(pfx,defAct){
  return '<div class="row"><select id="'+pfx+'-act" data-m="stripui" data-p="'+pfx+'" aria-label="الحركة">'+opts(STRIPACT,defAct||'walk')+'</select>'
    +'<select id="'+pfx+'-view" aria-label="الزاوية">'+opts(STRIPVIEW,'side')+'</select></div>'
    +'<div class="row"><label class="l">عدد الصور</label><input type="number" id="'+pfx+'-n" min="1" max="16" value="'+STRIPN[defAct||'walk']+'" style="width:70px">'
    +'<select id="'+pfx+'-key" aria-label="لون الخلفية">'+opts(KEYMODES,'auto')+'</select></div>';
}
function stripCtlRead(pfx){
  var v=function(s){var e=$('#'+pfx+'-'+s);return e?e.value:''};
  var act=own(STRIPACT,v('act'))?v('act'):'walk',view=own(STRIPVIEW,v('view'))?v('view'):'side',n=clamp(parseInt(v('n'),10)||STRIPN[act],1,16),key=own(KEYMODES,v('key'))?v('key'):'auto';
  return {act:act,view:view,n:n,key:key,dir:v('dir')==='R'?'R':'L'};
}
function stripHTML(a){
  var h='<h4>أشرطة الحركة</h4><div class="hint">شريط = صورة واحدة فيها عدة صور متتالية للحركة (خلفية سادة وفراغ بين الصور). تُختار الحركة والزاوية حسب ما تفعله الشخصية على المسرح.</div>'
    +'<div class="row"><label class="l">الصورة تنظر إلى</label><select data-m="actor" data-id="'+a.id+'" data-k="dir" aria-label="اتجاه الصورة">'+opts({R:'اليمين',L:'اليسار'},a.dir==='L'?'L':'R')+'</select></div>'
    +stripCtl('st'+a.id)+'<div class="row"><button class="btn sm" data-a="strip-add" data-id="'+a.id+'">+ رفع شريط</button></div>';
  Object.keys(a.strips||{}).forEach(function(k){var pr=k.split(':'),s=a.strips[k];
    h+='<div class="row between"><span class="hint">'+STRIPACT[pr[0]]+' · '+STRIPVIEW[pr[1]]+' · '+s.n+' صور</span><button class="btn sm dng" data-a="strip-del" data-id="'+a.id+'" data-k="'+k+'">حذف</button></div>'});
  return h;
}
function stripMsg(r){return r.mode==='equal'?' (الصور متلاصقة فقسّمتها بالتساوي، راجع النتيجة)':''}
function addStrip(id){
  var a=P.actors.filter(function(x){return x.id===id})[0];if(!a||a.kind!=='img')return;
  var o=stripCtlRead('st'+id);
  pickImage(function(c){
    var r=buildStrip(c,o.n,o.key);if(!r){toast('لم أستطع تقسيم الشريط، تأكد من الخلفية السادة وعدد الصور');return}
    a.strips=a.strips||{};a.strips[o.act+':'+o.view]={img:r.img,n:r.n,cw:r.cw,ch:r.ch,h:r.h};
    refresh();renderPanel();toast('تمت إضافة شريط «'+STRIPACT[o.act]+' '+STRIPVIEW[o.view]+'» ('+r.n+' صور)'+stripMsg(r))},4096);
}
function addStripActor(){
  if(P.actors.length>=6){toast('الحد الأقصى 6 شخصيات، احذف شخصية أولًا');return}
  var o=stripCtlRead('stnew');
  pickImage(function(c,fl){
    if(P.actors.length>=6)return;
    var r=buildStrip(c,o.n,o.key);if(!r){toast('لم أستطع تقسيم الشريط، تأكد من الخلفية السادة وعدد الصور');return}
    var id=uid(),nm=(fl.name||'').replace(/\.[^.]+$/,'').slice(0,20)||'شخصية',s={};
    s[o.act+':'+o.view]={img:r.img,n:r.n,cw:r.cw,ch:r.ch,h:r.h};
    var a={id:id,name:nm,kind:'img',color:'#8d99ae',accent:'#e8eaf0',img:encAlpha(r.stand),strips:s};if(o.dir==='L')a.dir='L';
    P.actors.push(a);addToScene(id);refresh();renderPanel();toast('أضفت «'+nm+'» بشريط '+STRIPACT[o.act]+' ('+r.n+' صور)'+stripMsg(r))},4096);
}
function delStrip(id,k){
  var a=P.actors.filter(function(x){return x.id===id})[0];if(!a||!a.strips||!a.strips[k])return;
  delete a.strips[k];if(!Object.keys(a.strips).length)delete a.strips;refresh();renderPanel();toast('تم حذف الشريط');
}
