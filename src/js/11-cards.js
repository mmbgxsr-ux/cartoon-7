'use strict';
/* ---------- title & credits cards ---------- */
function lumOf(hex){var n=parseInt(hex.slice(1),16),r=n>>16&255,g2=n>>8&255,b=n&255;return (.299*r+.587*g2+.114*b)/255}
function drawCardBG(g,sc){var c=BGC[sc.bg]||BGC.night,gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,c[0]);gr.addColorStop(1,c[1]);g.fillStyle=gr;g.fillRect(0,0,W,H)}
function drawCardText(g,sc,lt){
  var c=BGC[sc.bg]||BGC.night,col=lumOf(c[0])>.55?'#1b2340':'#ffffff',lines=String(sc.t2||'').split('\n');
  g.save();g.textAlign='center';g.textBaseline='middle';g.fillStyle=col;g.shadowColor='rgba(0,0,0,.25)';g.shadowBlur=12;
  function fit(t,size,wt){var sz=size;g.font=wt+' '+sz+'px '+FONT;while(g.measureText(t).width>W-160&&sz>24){sz-=4;g.font=wt+' '+sz+'px '+FONT}return sz}
  if(sc.mode==='credits'){
    var all=[{t:sc.t1||'',s:64,w:800}].concat(lines.map(function(l){return{t:l,s:38,w:600}})),lh=70,total=all.length*lh,
        y0=H+40-(lt/sc.dur)*(H+total+80);
    all.forEach(function(r,i){if(!r.t)return;fit(r.t,r.s,r.w);g.fillText(r.t,W/2,y0+i*lh+(i?30:0))});
  }else{
    var a=clamp(lt/.7,0,1)*clamp((sc.dur-lt)/.5,0,1),dy=(1-clamp(lt/.7,0,1))*24;g.globalAlpha=a;
    var n=lines.filter(function(l){return l}).length,base=H/2-(n?24*n:0);
    fit(sc.t1||'',96,800);g.fillText(sc.t1||'',W/2,base+dy);
    var k=0;lines.forEach(function(l){if(!l)return;fit(l,40,600);g.fillText(l,W/2,base+96+k*58+dy);k++});
  }
  g.restore();
}
function cardMap(){var m={};for(var k in BGS)m[k]=BGS[k];return m}
function cardHTML(sc){
  var h='<div class="row between"><h3>'+(sc.mode==='credits'?'شارات النهاية':'بطاقة العنوان')+'</h3></div>';
  h+='<div><label class="l">النص الكبير</label><input type="text" data-m="scn" data-id="'+sc.id+'" data-k="t1" value="'+esc(sc.t1||'')+'"></div>';
  h+='<div><label class="l">أسطر إضافية (سطر لكل اسم)</label><textarea rows="5" data-m="scn" data-id="'+sc.id+'" data-k="t2" style="width:100%">'+esc(sc.t2||'')+'</textarea></div>';
  h+='<div class="row"><div><label class="l">النمط</label><select data-m="scn" data-id="'+sc.id+'" data-k="mode"><option value="title"'+(sc.mode!=='credits'?' selected':'')+'>عنوان ثابت</option><option value="credits"'+(sc.mode==='credits'?' selected':'')+'>شارات متحركة</option></select></div>'
    +'<div><label class="l">اللون</label><select data-m="scn" data-id="'+sc.id+'" data-k="bg">'+opts(cardMap(),sc.bg)+'</select></div>'
    +'<div><label class="l">المؤثر البصري</label><select data-m="scn" data-id="'+sc.id+'" data-k="fx">'+opts(FXN,sc.fx||'none')+'</select></div>'
    +'<div><label class="l">الكاميرا</label><select data-m="scn" data-id="'+sc.id+'" data-k="cam">'+opts(CAMN,sc.cam||'fixed')+'</select></div>'
    +'<div><label class="l">الانتقال إلى المشهد</label><select data-m="scn" data-id="'+sc.id+'" data-k="trans">'+opts(TRN,sc.trans||'fade')+'</select></div>'
    +num('المدة (ث)','scn',sc.id,'dur',sc.dur,3,40,.5)+'</div>';
  return h+'<p class="hint">الشارات المتحركة تصعد ببطء طوال مدة البطاقة، فاجعل المدة تناسب عدد الأسطر.</p>';
}
function dlBlob(name,blob){
  if(DL){saveFile(name,blob);return}
  try{var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},600);toast('تم الحفظ')}catch(e){toast('تعذر الحفظ من هذه الشاشة')}
}
function p2(n){return ('0'+n).slice(-2)}
function srtTime(t){var ms=Math.round(t*1000),h=Math.floor(ms/3600000);ms-=h*3600000;var m=Math.floor(ms/60000);ms-=m*60000;var sc=Math.floor(ms/1000);ms-=sc*1000;return p2(h)+':'+p2(m)+':'+p2(sc)+','+('00'+ms).slice(-3)}
function exportSRT(){
  var rows=[],withName=$('#srtName')&&$('#srtName').checked;
  P.scenes.forEach(function(sc,i){sc.steps.forEach(function(x){if(x.type==='say'&&(x.text||'').trim())rows.push({a:SEG[i].t0+x.t,b:SEG[i].t0+x.t+x.d,t:x.text.trim(),n:actorOf(x.actor).name})})});
  if(!rows.length){toast('لا يوجد حوار لتصديره');return}
  rows.sort(function(a,b){return a.a-b.a});
  var out=rows.map(function(r,i){return (i+1)+'\n'+srtTime(r.a)+' --> '+srtTime(r.b)+'\n'+(withName?r.n+': ':'')+r.t+'\n'}).join('\n');
  dlBlob(safeName()+'.srt',new Blob([out],{type:'application/x-subrip;charset=utf-8'}));
}
function saveFrame(){cv.toBlob(function(b){if(b)dlBlob(safeName()+'-frame.png',b)},'image/png')}
