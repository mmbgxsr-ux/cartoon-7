'use strict';
/* ---------- speech bubble ---------- */
function wrap(g,text,maxW){var words=String(text).split(' '),lines=[],cur='';words.forEach(function(w){var t=cur?cur+' '+w:w;if(g.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t});if(cur)lines.push(cur);return lines}
function bubble(g,text,ax,ay,frac){
  g.save();g.font='700 32px '+FONT;g.direction='rtl';
  var lines=wrap(g,text,460),lw=lines.map(function(l){return g.measureText(l).width}),mw=Math.max.apply(null,lw);
  var bw=mw+60,bh=lines.length*44+30,bx=clamp(ax-bw/2,24,W-24-bw),by=Math.max(20,ay-bh-28);
  g.fillStyle='#fff';g.strokeStyle='#161b2b';g.lineWidth=4;rr(g,bx,by,bw,bh,22);g.fill();g.stroke();
  var tx=clamp(ax,bx+30,bx+bw-30);g.beginPath();g.moveTo(tx-14,by+bh-1);g.lineTo(ax,Math.min(ay,by+bh+30));g.lineTo(tx+14,by+bh-1);g.closePath();g.fillStyle='#fff';g.fill();
  g.beginPath();g.moveTo(tx-14,by+bh);g.lineTo(ax,Math.min(ay,by+bh+30));g.lineTo(tx+14,by+bh);g.stroke();
  g.fillStyle='#fff';g.fillRect(tx-12,by+bh-3,24,6);
  var total=0;lines.forEach(function(l){total+=l.length});var left=Math.round(total*clamp(frac,0,1));
  g.fillStyle='#161b2b';g.textAlign='right';g.textBaseline='middle';
  lines.forEach(function(l,i){var part=l.slice(0,Math.max(0,left));left-=l.length;if(part)g.fillText(part,bx+bw/2+lw[i]/2,by+24+i*44+8)});
  g.restore();
}
