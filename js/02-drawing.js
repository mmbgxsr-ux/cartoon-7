'use strict';
/* ---------- drawing helpers ---------- */
function shade(h,p){var n=parseInt(h.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255,f=p<0?0:255,q=Math.abs(p);
  return 'rgb('+Math.round(lerp(r,f,q))+','+Math.round(lerp(g,f,q))+','+Math.round(lerp(b,f,q))+')'}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function rnd(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var STARS=(function(){var r=rnd(7),a=[];for(var i=0;i<70;i++)a.push([r()*W,r()*H*.55,r()*2+.8,r()*6]);return a})();
