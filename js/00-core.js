'use strict';
var W=1280,H=720;
function $(s){return document.querySelector(s)}
function uid(){return Math.random().toString(36).slice(2,8)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var KINDS={cat:'قط',boy:'ولد',girl:'فتاة',rabbit:'أرنب',robot:'روبوت'};
var BGS={day:'نهار',sunset:'غروب',night:'ليل',desert:'صحراء وأهرامات',room:'غرفة',forest:'غابة',sea:'شاطئ وبحر',space:'فضاء'};
var TRN={fade:'تلاشٍ للأسود',cross:'تداخل',wipe:'مسح',slide:'دفع',cut:'قطع مباشر'};
var GRADEN={none:'بدون',warm:'دافئ',cool:'بارد',cinema:'سينمائي',vintage:'قديم',noir:'أبيض وأسود',bright:'مشرق'};
var DLGN={bubble:'فقاعات',caption:'ترجمة سفلية',both:'الاثنان'};
var CAMN={fixed:'ثابتة',zin:'تقريب',zout:'ابتعاد',panr:'تحريك لليمين',panl:'تحريك لليسار',shake:'اهتزاز'};
var FXN={none:'بدون',rain:'مطر',snow:'ثلج',sparkle:'بريق'};
var STY={walk:'مشي',run:'جري',hop:'قفز',slide:'انزلاق'};
var ACTN={wave:'تلويح',clap:'تصفيق',dance:'رقص',sit:'جلوس',bow:'انحناءة',jump:'قفز في المكان'};
var EMO={neutral:'عادي',happy:'سعيد',sad:'حزين',surprised:'متفاجئ',angry:'غاضب',sleepy:'نعسان',scared:'خائف',love:'محب'};
var FONT='Cairo,"Segoe UI",Tahoma,sans-serif';
