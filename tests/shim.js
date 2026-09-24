/* The browser APIs survey.html touches, reduced to what the assertions need: recorded
   navigations (NAV), recorded requests (POSTS / GETS) with a per-case FETCH_HANDLER, an
   in-memory localStorage (LS), and a DOM stub whose #main innerHTML is read back as the
   rendered page (MAIN_HTML). */
var window = globalThis;
globalThis.window = globalThis;
globalThis.self = globalThis;

/* jsc has setTimeout but no clearTimeout. */
var __nativeSetTimeout = globalThis.setTimeout;
var __timers = {}, __tid = 0;
globalThis.setTimeout = function(fn, ms){
  var id = ++__tid;
  __timers[id] = true;
  __nativeSetTimeout(function(){ if(__timers[id]){ delete __timers[id]; fn(); } }, ms||0);
  return id;
};
globalThis.clearTimeout = function(id){ delete __timers[id]; };
globalThis.PENDING_TIMERS = function(){ return Object.keys(__timers).length; };

globalThis.NAV = [];
globalThis.POSTS = [];
globalThis.GETS = [];

function mkEl(tag){
  return {
    tagName:(tag||'div').toUpperCase(), id:'', className:'', innerHTML:'', textContent:'',
    value:'', href:'', download:'', style:{},
    children:[],
    appendChild:function(c){ this.children.push(c); return c; },
    removeChild:function(){}, remove:function(){}, focus:function(){},
    scrollIntoView:function(){}, setAttribute:function(){}, click:function(){}
  };
}
var __els = { main:mkEl('main'), prog:mkEl('div'), progtxt:mkEl('p') };
__els.main.id='main'; __els.prog.id='prog'; __els.progtxt.id='progtxt';

globalThis.document = {
  referrer:'',
  activeElement:null,
  body:mkEl('body'),
  getElementById:function(id){ return __els[id] || null; },
  querySelector:function(){ return null; },
  querySelectorAll:function(){ return []; },
  createElement:function(t){ return mkEl(t); },
  addEventListener:function(){}
};
globalThis.MAIN_HTML = function(){ return __els.main.innerHTML; };
globalThis.PROG_TXT  = function(){ return __els.progtxt.textContent; };

globalThis.navigator = { userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/127 Safari/537.36' };
globalThis.scrollTo = function(){};

globalThis.location = {
  search:'',
  href:'http://127.0.0.1:8765/survey.html',
  replace:function(u){ globalThis.NAV.push(u); }
};

globalThis.URLSearchParams = function(q){
  var m = {};
  String(q||'').replace(/^\?/,'').split('&').forEach(function(kv){
    if(!kv) return;
    var i = kv.indexOf('=');
    var k = i<0 ? kv : kv.slice(0,i);
    var v = i<0 ? '' : kv.slice(i+1);
    m[decodeURIComponent(k.replace(/\+/g,' '))] = decodeURIComponent(v.replace(/\+/g,' '));
  });
  this.get = function(k){ return Object.prototype.hasOwnProperty.call(m,k) ? m[k] : null; };
};

var __store = {};
globalThis.localStorage = {
  getItem:function(k){ return Object.prototype.hasOwnProperty.call(__store,k) ? __store[k] : null; },
  setItem:function(k,v){ __store[k]=String(v); },
  removeItem:function(k){ delete __store[k]; },
  _dump:function(){ return __store; }
};
globalThis.LS = __store;

globalThis.CONFIRMS = [];
globalThis.CONFIRM_RESULT = true;
globalThis.confirm = function(m){ globalThis.CONFIRMS.push(String(m)); return globalThis.CONFIRM_RESULT; };
globalThis.alert = function(){};

globalThis.Blob = function(){};
globalThis.URL = { createObjectURL:function(){ return 'blob:x'; }, revokeObjectURL:function(){} };

globalThis.AbortController = function(){
  var self = this;
  this.signal = { aborted:false, _cbs:[], addEventListener:function(n,f){ this._cbs.push(f); } };
  this.abort = function(){ self.signal.aborted = true; self.signal._cbs.forEach(function(f){ f(); }); };
};

/* FETCH_HANDLER is supplied by each case; it receives (url, init) and returns
   { status, body, delayMs } or { abort:true, delayMs }. */
globalThis.FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true,"row":1}' }; };

globalThis.fetch = function(url, init){
  init = init || {};
  var rec = { url:String(url), method:init.method||'GET', mode:init.mode||'cors',
              keepalive:!!init.keepalive, body:init.body||null };
  if(rec.method==='POST') globalThis.POSTS.push(rec); else globalThis.GETS.push(rec);
  var r = globalThis.FETCH_HANDLER(rec.url, init) || {};
  var delay = r.delayMs || 0;
  return new Promise(function(resolve, reject){
    var done = false;
    if(init.signal){
      init.signal.addEventListener('abort', function(){
        if(done) return; done = true; reject(new Error('AbortError'));
      });
    }
    setTimeout(function(){
      if(done) return; done = true;
      if(r.abort) return reject(new TypeError('Failed to fetch'));
      resolve({
        ok: r.status>=200 && r.status<300,
        status: r.status,
        text: function(){ return Promise.resolve(r.body||''); },
        json: function(){ return Promise.resolve(JSON.parse(r.body||'null')); }
      });
    }, delay);
  });
};

globalThis.sleep = function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };

/* --- assertions --- */
globalThis.PASS = 0; globalThis.FAIL = 0;
globalThis.ok = function(name, cond, detail){
  if(cond){ globalThis.PASS++; print('  PASS  ' + name); }
  else    { globalThis.FAIL++; print('  FAIL  ' + name + (detail!==undefined ? '  <<< ' + detail : '')); }
};
globalThis.eq = function(name, got, want){
  globalThis.ok(name, got===want, 'got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
};
