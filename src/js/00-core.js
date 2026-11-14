'use strict';
var W=1280,H=720;
function $(s){return document.querySelector(s)}
function uid(){return Math.random().toString(36).slice(2,8)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function own(m,k){return typeof k==='string'&&Object.prototype.hasOwnProperty.call(m,k)}
function cleanId(v){var s=String(v==null?'':v).replace(/[^A-Za-z0-9_-]/g,'').slice(0,12);return s&&!(s in Object.prototype)?s:uid()}
/* دورة التنفّس: شهيق ٤٦٪ ثم ثبات قصير ٨٪ ثم زفير ٤٦٪؛ الدورة نحو ٨ ثوانٍ كحدّ أقصى. ph: 0 شهيق، 1 ثبات، 2 زفير */
function breathCyc(d){return d/Math.max(1,Math.round(d/8))}
function breathAt(u,d){var cy=breathCyc(d),q=(u%cy)/cy;
  if(q<.46)return{ph:0,p:q/.46,left:(.46-q)*cy,cy:cy};
  if(q<.54)return{ph:1,p:1,left:(.54-q)*cy,cy:cy};
  return{ph:2,p:(q-.54)/.46,left:(1-q)*cy,cy:cy}}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var KINDS={cat:'قط',boy:'ولد',girl:'فتاة',rabbit:'أرنب',robot:'روبوت'};
var BGS={day:'نهار',sunset:'غروب',night:'ليل',desert:'صحراء وأهرامات',room:'غرفة',forest:'غابة',sea:'شاطئ وبحر',space:'فضاء',livingroom:'صالة المنزل',bedroom:'غرفة النوم',school:'المدرسة (من الخارج)',magicforest:'الغابة السحرية',playground:'ساحة اللعب',classroom:'الفصل الدراسي',hallway:'ممر المدرسة',entrance:'مدخل البيت',garden:'حديقة وقوس قزح'};
/* ارتفاع قدمي الشخصية الافتراضي (% من الشاشة) فوق أرض كل خلفية صورة، يُستخدم عند إضافة شخصية لمشهد */
var BGY={livingroom:88,bedroom:88,school:86,magicforest:86,playground:82,classroom:88,hallway:85,entrance:88,garden:80};
var TRN={fade:'تلاشٍ للأسود',cross:'تداخل',wipe:'مسح',slide:'دفع',cut:'قطع مباشر'};
var GRADEN={none:'بدون',warm:'دافئ',cool:'بارد',cinema:'سينمائي',vintage:'قديم',noir:'أبيض وأسود',bright:'مشرق'};
var DLGN={bubble:'فقاعات',caption:'ترجمة سفلية',both:'الاثنان'};
var CAMN={fixed:'ثابتة',zin:'تقريب',zout:'ابتعاد',panr:'تحريك لليمين',panl:'تحريك لليسار',shake:'اهتزاز',follow:'تتبّع المتكلم'};
var OVN={breath:'تنفّس (دائرة تكبر وتصغر)',alert:'إنذار أحمر',pulse:'نبض القلب',badge:'شارة خطوة (نص على الشاشة)'};
var FXN={none:'بدون',rain:'مطر',snow:'ثلج',sparkle:'بريق'};
var STY={walk:'مشي',run:'جري',hop:'قفز',slide:'انزلاق'};
var ACTN={wave:'تلويح',clap:'تصفيق',dance:'رقص',sit:'جلوس',bow:'انحناءة',jump:'قفز في المكان'};
var EMO={neutral:'عادي',happy:'سعيد',sad:'حزين',surprised:'متفاجئ',angry:'غاضب',sleepy:'نعسان',scared:'خائف',love:'محب'};
var FONT='Cairo,"Segoe UI",Tahoma,sans-serif';
