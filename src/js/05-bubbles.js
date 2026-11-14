'use strict';
/* ---------- speech bubble ---------- */
function wrap(g,text,maxW){var words=String(text).split(' '),lines=[],cur='';words.forEach(function(w){var t=cur?cur+' '+w:w;if(g.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t});if(cur)lines.push(cur);return lines}
/* شكل الفقاعة حسب الانفعال: لون الإطار وسماكته ونمط الخط والتعبئة */
var BST={angry:{s:'#c1121f',w:6},surprised:{s:'#f77f00',w:6},sad:{s:'#3a6ea5',w:4,dash:[14,9],f:'#eef3fa'},scared:{s:'#7b2cbf',w:5},love:{s:'#e5173f',w:5,f:'#fff0f3'},happy:{s:'#2a9d8f',w:5},sleepy:{s:'#8d99ae',w:4,dash:[6,8],f:'#eceff4'}};
function vocabKey(w){return String(w).replace(/[\s،.!؟?:؛"«»]/g,'')}
/* ax,ay: نقطة الإشارة على الشاشة (بعد حركة الكاميرا). o: emo, name, col, u (ثواني منذ بدء الجملة), d (مدتها), minY, vocab (كلمات للتظليل) */
function bubble(g,text,ax,ay,frac,o){
  o=o||{};var u=o.u==null?9:o.u,d=o.d||99,pa=Math.min(clamp(u/.12,0,1),clamp((d-u)/.25,0,1));if(pa<=0)return;
  var k=clamp(u/.22,0,1),pop=.85+.15*(1+2.70158*Math.pow(k-1,3)+1.70158*Math.pow(k-1,2));
  var st=BST[o.emo]||{s:'#161b2b',w:4},fc=st.f||'#fff';
  g.save();g.direction='rtl';
  var fs=[42,36,32],fi=0,lines,lw,mw,mX=Math.round(W*.04),lh;
  for(;fi<fs.length;fi++){g.font='700 '+fs[fi]+'px '+FONT;lines=wrap(g,text,fi?680:600);if(lines.length<=3||fi===fs.length-1)break}
  lh=Math.round(fs[fi]*1.33);lw=lines.map(function(l){return g.measureText(l).width});mw=Math.max.apply(null,lw.concat([60]));
  var bw=Math.min(W-2*mX,mw+72),bh=lines.length*lh+34,bx=clamp(ax-bw/2,mX,W-mX-bw),by=Math.max(24,ay-bh-28);
  if(o.noRight&&by<112&&bx+bw>o.noRight){if(o.noRight-bw>=mX)bx=o.noRight-bw;else by=112}
  g.globalAlpha=pa;g.translate(ax,ay);g.scale(pop,pop);g.translate(-ax,-ay);
  if(o.emo==='angry')g.translate(Math.sin(u*60)*2.5,0);else if(o.emo==='scared')g.translate(0,Math.sin(u*40)*2);
  g.fillStyle=fc;g.strokeStyle=st.s;g.lineWidth=st.w;g.lineJoin='round';if(st.dash)g.setLineDash(st.dash);
  rr(g,bx,by,bw,bh,22);g.fill();g.stroke();g.setLineDash([]);
  var tx=clamp(ax,bx+36,bx+bw-36),tip=Math.max(by+bh+18,Math.min(ay,by+bh+34));
  g.beginPath();g.moveTo(tx-16,by+bh-1);g.lineTo(ax,tip);g.lineTo(tx+16,by+bh-1);g.closePath();g.fillStyle=fc;g.fill();
  g.beginPath();g.moveTo(tx-16,by+bh);g.lineTo(ax,tip);g.lineTo(tx+16,by+bh);g.stroke();
  g.fillStyle=fc;g.fillRect(tx-14,by+bh-st.w+1,28,st.w+1);
  if(o.name){g.font='700 24px '+FONT;var nw=g.measureText(o.name).width+52,nx=bx+bw-14-nw,ny=by-18;
    g.fillStyle='#161b2b';rr(g,nx,ny,nw,34,17);g.fill();
    g.fillStyle=o.col||'#fff';g.beginPath();g.arc(nx+nw-18,ny+17,7,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
    g.fillStyle='#fff';g.textAlign='right';g.textBaseline='middle';g.fillText(o.name,nx+nw-32,ny+18);g.font='700 '+fs[fi]+'px '+FONT}
  /* الكشف كلمة كلمة: كشف الحروف يغيّر أشكالها المتصلة في العربية */
  var words=lines.map(function(l){return l.split(' ')}),tw=0;words.forEach(function(w){tw+=w.length});
  var shown=frac>0?Math.max(1,Math.ceil(tw*clamp(frac,0,1)-1e-6)):0,used=0,pulse=.4+.2*Math.sin(u*8);
  g.textAlign='right';g.textBaseline='middle';
  lines.forEach(function(l,i){var w=words[i],cnt=clamp(shown-used,0,w.length);used+=w.length;if(!cnt)return;
    var R=bx+bw/2+lw[i]/2,cy=by+17+lh/2+i*lh+2;
    (o.vocab||[]).forEach(function(v){for(var j=0;j<cnt;j++){if(vocabKey(w[j])!==v)continue;
      var xr=R-(j?g.measureText(w.slice(0,j).join(' ')+' ').width:0),ww=g.measureText(w[j]).width;
      g.fillStyle='rgba(255,209,102,'+pulse.toFixed(2)+')';rr(g,xr-ww-6,cy-lh*.42,ww+12,lh*.84,10);g.fill();
      g.fillStyle='#ffb703';g.fillRect(xr-ww,cy+lh*.3,ww,5)}});
    g.fillStyle='#161b2b';g.fillText(w.slice(0,cnt).join(' '),R,cy)});
  g.restore();
}
