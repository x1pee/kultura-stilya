const PARENT = 'https://kultura-stilya-three-directions-20261116.serferpokiskam.chatgpt.site';
export const ALLOWED_PARENT_ORIGINS = Object.freeze([PARENT,'https://x1pee.github.io']);
const UPSTREAM = 'https://n918035.yclients.ru';
const PLATFORM = 'https://platform.yclients.com';
const SERVICES = [13079291,13079292,13079293,13079295,13079298,18997172,13079306,13079307,13079308,22320324,22320330,22320333,26202597,19681376,19681469,19681442,19687715,19687757,13079280,17075473,13785902,16852145,16852146,13079266,13079267,13079268,13747309,15810789,15812635,22564074,16085912,16085906];
const STAFF = [2606825,5912418,5937435,2694879,2694880,3259298,4959944,5586333,3249878];
export const READ_PATHS = [
 '/api/v1/b2c/channel/widget/booking-form/918035/',
 '/api/v1/b2c/channel/widget/location/854459/',
 '/api/v1/b2c/localization/provider/translations/ru-RU/widget',
 '/api/v1/b2c/booking/availability/book_staff/854459',
 '/api/v1/b2c/booking/availability/book_services/854459',
 '/api/v1/b2c/booking/availability/search-services',
 '/api/v1/b2c/booking/availability/search-staff',
 '/api/v1/b2c/booking/availability/search-dates',
 '/api/v1/b2c/booking/availability/search-timeslots',
 '/api/v1/b2c/booking/availability/forms/918035/attendances/validate'
];
const READ_POST = READ_PATHS.filter(p => /\/search-[a-z-]+$/.test(p) || p.endsWith('/attendances/validate'));
export const OBSERVED_BLOCKED_METADATA_PATHS = [
 '/api/v1/booking/forms/918035/custom_fields',
 '/api/v1/booking/forms/918035/feature_flags',
 '/api/v1/booking/forms/918035/security_levels/',
 '/api/v1/booking/locations/854459/applications/available',
 '/api/v1/company/854459/promo_blocks',
 '/api/v1/booking/locations/854459/privacy_policy',
 '/api/v1/salon/854459/plugins/'
];
// Explicit403 closed the metadata experiment. The published candidate permits core availability only.
export const METADATA_PATHS = [];
const ASSET = /^\/(?:assets\/[a-zA-Z0-9_./-]+\.(?:svg|png|jpe?g|webp|woff2?|ttf)|signer_bg\.wasm)$/;
const PAGE = /^\/company\/854459\/personal\/(?:menu|select-staff|select-services|select-time)\/?$/;
const HEADERS = {'Cache-Control':'no-store, max-age=0','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()'};
export const PUBLIC_BOOTSTRAP_RESOURCES = Object.freeze({
 source:'https://n918035.yclients.ru/',
 verifiedAt:'2026-11-17T23:03:34.617Z',
 storage:'https://n918035.yclients.ru/assets/js/empty-storage-if-not-exist.js',
 polyfills:'https://n918035.yclients.ru/polyfills-MUPSOIU4.js',
 main:'https://n918035.yclients.ru/main-PXX7I2XC.js',
 styles:'https://n918035.yclients.ru/styles-VYRIQLW6.css'
});

export function makeCsp(childOrigin, parentOrigin = PARENT) {
 return ["default-src 'none'",`script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' ${UPSTREAM}`,`style-src 'self' 'unsafe-inline' ${UPSTREAM} https://fonts.googleapis.com`,`img-src 'self' data: blob: https://assets.yclients.com https://be.cdn.yclients.com ${UPSTREAM}`,`font-src 'self' data: ${UPSTREAM} https://fonts.gstatic.com https://assets.yclients.com`,'connect-src '+[UPSTREAM+'/signer_bg.wasm',childOrigin+'/signer_bg.wasm',...READ_PATHS.map(p=>PLATFORM+p),...METADATA_PATHS.map(p=>UPSTREAM+p)].join(' '),"object-src 'none'","frame-src 'none'","form-action 'none'","base-uri 'self'",`frame-ancestors ${parentOrigin}`,"sandbox allow-scripts allow-same-origin"].join('; ');
}

export function normalizePublicSlots(payload){
 if(!payload||!Array.isArray(payload.data))return [];
 const byTime=new Map();
 for(const row of payload.data){
  const a=row?.attributes;if(a?.is_bookable!==true||typeof a.datetime!=='string'||typeof a.time!=='string')continue;
  if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(a.datetime)||! /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(a.time)||a.datetime.slice(11,16)!==a.time)continue;
  const dateISO=a.datetime.slice(0,10),date=new Date(dateISO+'T00:00:00Z');
  if(!Number.isFinite(date.valueOf())||date.toISOString().slice(0,10)!==dateISO)continue;
  if(!byTime.has(a.time))byTime.set(a.time,new Map());
  byTime.get(a.time).set(a.datetime,{datetime:a.datetime,dateISO,timeLabel:a.time});
 }
 return [...byTime.values()].filter(items=>items.size===1).map(items=>[...items.values()][0]);
}

export function publicSlotChoice(snapshot,context,timeLabel,now=Date.now()){
 if(!snapshot||snapshot.context!==context||!Number.isFinite(snapshot.receivedAt)||!Number.isFinite(now))return null;
 const age=now-snapshot.receivedAt;
 return age>=0&&age<=120000&&snapshot.slots instanceof Map?snapshot.slots.get(timeLabel)||null:null;
}

// Runs before the official runtime. It never reads request headers/bodies, auth values or contacts.
// Only exact public200 availability responses are parsed for bookable datetime/time fields.
function browserGuard(config,normalizeSlots,readSlot) {
 'use strict';
 const own = location.origin;
 const allowed = new Set(config.paths.map(p=>config.platform+p));
 const post = new Set(config.posts.map(p=>config.platform+p));
 const metadata = new Set(config.metadata.map(p=>config.upstream+p));
 const nativeFetch = window.fetch.bind(window);
 const message = data => {if(window.parent!==window)window.parent.postMessage({...data,type:'kultura-widget:'+data.type},config.parent);};
 let slotCache=null,generation=0,lastSelection='',highlighted=null,previousOutline=null;
 const roots=new Map();let queued=false;
 function queueProtect(){if(!queued){queued=true;queueMicrotask(()=>{queued=false;protect();});}}
 function captureRoot(root){if(roots.has(root))return;const observer=new MutationObserver(queueProtect);observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','readonly','contenteditable']});roots.set(root,{observer,connected:!root.host||root.host.isConnected});if(root!==document){root.addEventListener('click',readOnlyClick,true);root.addEventListener('submit',stopSubmit,true);root.addEventListener('beforeinput',stopContactInput,true);}queueProtect();}
 const attachShadow=Element.prototype.attachShadow;
 Element.prototype.attachShadow=function(init){const root=attachShadow.call(this,init);captureRoot(root);return root;};
 function all(selector){const result=[];for(const root of roots.keys())result.push(...root.querySelectorAll(selector));return result;}
 function intent(){const o=new URL(location.href).searchParams.get('o')||'';const serviceId=Number(o.match(/(?:^|m\d+)s(\d+)/)?.[1]),staffId=Number(o.match(/^m(\d+)/)?.[1]);return{context:location.pathname+'?o='+o,serviceId:config.services.includes(serviceId)?serviceId:null,staffId:config.staff.includes(staffId)?staffId:null};}
 let lastContext=intent().context;
 function baseSelection(){const i=intent(),value={type:'selection',companyId:854459,source:'yclients',readOnly:true};if(i.serviceId)value.serviceId=i.serviceId;if(i.staffId)value.staffId=i.staffId;return value;}
 function clearSlots(){slotCache=null;generation++;for(const node of all('[data-kultura-time]'))node.removeAttribute('data-kultura-time');if(highlighted){highlighted.style.outline=previousOutline?.outline||'';highlighted.style.outlineOffset=previousOutline?.outlineOffset||'';highlighted.removeAttribute('data-kultura-selected-slot');highlighted=null;}document.querySelector('[data-kultura-slot-note]')?.remove();message(baseSelection());}
 function startAvailability(raw){const u=new URL(raw,location.href);if(u.origin!==config.platform||!['/api/v1/b2c/booking/availability/search-dates','/api/v1/b2c/booking/availability/search-timeslots'].includes(u.pathname))return null;clearSlots();return{kind:u.pathname.endsWith('/search-timeslots')?'slots':'dates',generation,context:intent().context};}
 function receiveAvailability(meta,payload){if(meta?.kind!=='slots'||meta.generation!==generation||meta.context!==intent().context||!intent().serviceId)return;const slots=normalizeSlots(payload);if(!slots.length)return;slotCache={slots:new Map(slots.map(s=>[s.timeLabel,s])),context:meta.context,receivedAt:Date.now(),verifiedAt:new Date().toISOString()};queueProtect();}
 function observeFetch(response,meta){if(meta&&response.status===200){response.clone().json().then(data=>receiveAvailability(meta,data)).catch(()=>{});}return response;}
 function targetUrl(raw){const u=new URL(raw,location.href);return u.origin===own&&u.pathname==='/signer_bg.wasm'&&!u.search&&!u.hash?config.upstream+'/signer_bg.wasm':u.href;}
 function readAllowed(raw, method) {
  try {
   const u = new URL(raw, location.href), m = String(method||'GET').toUpperCase(), full=u.origin+u.pathname;
   if(u.username||u.password||u.hash) return false;
   const queryKeys=[...u.searchParams.keys()];
   const expected = u.pathname.endsWith('/location/854459/') ? ['forBooking'] : /\/(?:book_staff|book_services)\/854459$/.test(u.pathname) ? ['without_seances'] : [];
   if(queryKeys.some(k=>!expected.includes(k)||u.searchParams.getAll(k).some(v=>!/^(?:true|false|0|1)$/.test(v))))return false;
   if(allowed.has(full)) return m==='GET'||m==='HEAD'||(m==='POST'&&post.has(full));
   if(metadata.has(full))return m==='GET'||m==='HEAD';
   return (m==='GET'||m==='HEAD') && [own+'/signer_bg.wasm',config.upstream+'/signer_bg.wasm'].includes(full);
  } catch { return false; }
 }
 const deny = (kind='request',raw='') => {let target='';try{const u=new URL(raw,location.href);target=' '+u.origin+u.pathname;}catch{}return new TypeError('Read-only availability viewer: '+kind+' disabled'+target);};
 window.fetch = function(input, init) {
  const raw=typeof input==='string'||input instanceof URL?String(input):input.url;
  const method=init?.method||(typeof input==='object'&&input.method)||'GET';
  const target=targetUrl(raw);
  if(!readAllowed(target,method)) return Promise.reject(deny('fetch '+method,raw));
  const mapped=target!==new URL(raw,location.href).href;
  const meta=startAvailability(target);
  return nativeFetch(mapped?(typeof input==='object'&&!(input instanceof URL)?new Request(target,input):target):input,init).then(response=>observeFetch(response,meta));
 };
 const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send;
 const blockedXhr=new WeakSet(),xhrAvailability=new WeakMap(),observedXhr=new WeakSet();
 XMLHttpRequest.prototype.open=function(method,url,...rest){const target=targetUrl(url);if(!readAllowed(target,method))blockedXhr.add(this);else blockedXhr.delete(this);xhrAvailability.set(this,startAvailability(target));if(!observedXhr.has(this)){observedXhr.add(this);this.addEventListener('load',()=>{const meta=xhrAvailability.get(this);if(!meta||this.status!==200)return;try{const data=this.responseType==='json'?this.response:JSON.parse(this.responseText);receiveAvailability(meta,data);}catch{}});}return open.call(this,method,target,...rest);};
 XMLHttpRequest.prototype.send=function(...args){if(blockedXhr.has(this)){queueMicrotask(()=>{this.dispatchEvent(new ProgressEvent('error'));this.dispatchEvent(new ProgressEvent('loadend'));});return;}return send.apply(this,args);};
 try{navigator.sendBeacon=()=>false;}catch{}
 try{window.open=()=>null;}catch{}
 try{window.WebSocket=function(){throw deny();};window.EventSource=function(){throw deny();};}catch{}
 function stopSubmit(e){e.preventDefault();e.stopImmediatePropagation();}
 addEventListener('submit',stopSubmit,true);
 function state() {
  // Only IDs verified in the approved catalog are reported. Date encoding is deliberately not guessed.
  const current=intent().context;if(current!==lastContext){lastContext=current;clearSlots();}
  const value=baseSelection();
  const key=JSON.stringify(value);if(key!==lastSelection){lastSelection=key;message(value);}
 }
 function selectSlot(e){
  const cell=e.composedPath().find(n=>n instanceof Element&&n.hasAttribute('data-kultura-time'));if(!cell)return false;
  const time=cell.getAttribute('data-kultura-time');if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))return false;
  e.preventDefault();e.stopImmediatePropagation();
  const i=intent(),slot=readSlot(slotCache,i.context,time,Date.now());
  if(!slot){clearSlots();const n=document.createElement('div');n.dataset.kulturaSlotNote='';n.setAttribute('role','status');n.textContent='Выбрано '+time+'. Запись не отправлена. Обновите день, чтобы подтвердить доступность.';n.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;z-index:2147483646;max-width:520px;margin:auto;border-radius:16px;background:#173c2e;color:#fff;padding:14px 18px;font:15px/1.5 system-ui';document.body.append(n);return true;}
  if(highlighted){highlighted.style.outline=previousOutline?.outline||'';highlighted.style.outlineOffset=previousOutline?.outlineOffset||'';highlighted.removeAttribute('data-kultura-selected-slot');}
  highlighted=cell;previousOutline={outline:cell.style.outline,outlineOffset:cell.style.outlineOffset};cell.style.outline='3px solid #246345';cell.style.outlineOffset='3px';cell.setAttribute('data-kultura-selected-slot','true');
  let n=document.querySelector('[data-kultura-slot-note]');if(!n){n=document.createElement('div');n.dataset.kulturaSlotNote='';n.setAttribute('role','status');n.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;z-index:2147483646;max-width:520px;margin:auto;border-radius:16px;background:#173c2e;color:#fff;padding:14px 18px;font:15px/1.5 system-ui';document.body.append(n);}
  const label=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(slot.dateISO+'T12:00:00Z'));
  n.textContent='Выбрано '+label+', '+slot.timeLabel+'. Запись не отправлена.';
  message({...baseSelection(),...slot,verifiedAt:slotCache.verifiedAt});return true;
 }
 function contactStep() {return /\/(?:create-record|record|client|profile|payment|confirmation|confirm)(?:\/|$)/.test(location.pathname);}
 function notice() {
  if(document.querySelector('[data-kultura-readonly-notice]'))return;
  const n=document.createElement('section');n.dataset.kulturaReadonlyNotice='';n.setAttribute('role','status');
  n.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;gap:16px;padding:28px;background:#f8f7f3;color:#17251e;font:17px/1.5 system-ui;text-align:center';
  const title=document.createElement('h2');title.textContent='Демо: запись не отправляется';
  const text=document.createElement('p');text.textContent='Можно посмотреть актуальное время салона. Ввод контактов и подтверждение визита здесь отключены.';
  const back=document.createElement('button');back.textContent='Вернуться к расписанию';back.style.cssText='min-height:48px;border:0;border-radius:24px;background:#173c2e;color:white;padding:12px 22px;font:inherit';back.addEventListener('click',()=>{n.remove();history.back();});
  n.append(title,text,back);document.body.append(n);
 }
 function protect() {
  for(const [root,info]of roots){if(root.host){if(root.host.isConnected)info.connected=true;else if(info.connected){info.observer.disconnect();roots.delete(root);continue;}}for(const e of root.querySelectorAll('*'))if(e.shadowRoot)captureRoot(e.shadowRoot);}
  for(const e of all('input,textarea,[contenteditable="true"]')){
   if(e.tagName==='INPUT'&&['radio','checkbox'].includes(e.type)&&!contactStep())continue;
   const safeSearch=e.tagName==='INPUT'&&['text','search'].includes(e.type)&&/поиск|найти|search/i.test(e.getAttribute('placeholder')||'');
   if(safeSearch){e.autocomplete='off';continue;}
   if(e.type==='hidden'||e.disabled)continue;
   e.value='';e.disabled=true;e.readOnly=true;e.autocomplete='off';e.setAttribute('aria-disabled','true');
   if(e.isContentEditable){e.textContent='';e.contentEditable='false';}
  }
  const age=slotCache?Date.now()-slotCache.receivedAt:Infinity;
  for(const chip of all('y-core-chip')){
   const text=(chip.shadowRoot?.querySelector('y-core-text.y-core-chip__text')?.textContent||'').trim();
   const valid=slotCache&&slotCache.context===intent().context&&age>=0&&age<=120000&&slotCache.slots.has(text);
   if(valid){chip.setAttribute('data-kultura-time',text);chip.setAttribute('role','button');chip.tabIndex=0;chip.setAttribute('aria-label','Выбрать '+text);}else chip.removeAttribute('data-kultura-time');
  }
  if(contactStep())notice();
  state();
 }
 function readOnlyClick(e){
  if(selectSlot(e))return;
  const a=e.target.closest?.('a');
  if(a){try{const u=new URL(a.href,location.href);if(u.origin!==own||!/^\/company\/854459\/personal\//.test(u.pathname)||/create-record|payment|profile|confirm|client/.test(u.pathname)){e.preventDefault();e.stopImmediatePropagation();return;}u.searchParams.set('parent',config.parent);a.href=u.href;}catch{e.preventDefault();e.stopImmediatePropagation();}}
  const b=e.target.closest?.('button,[role="button"]');
  if(b&&/^(?:записаться|подтвердить|оплатить|войти|отправить)(?:\s|$)/i.test(b.textContent.trim())){e.preventDefault();e.stopImmediatePropagation();notice();}
 }
 addEventListener('click',readOnlyClick,true);
 function stopContactInput(e){const t=e.target;if(t.matches?.('textarea,[contenteditable],input:not([type="search"])')&&!(t.tagName==='INPUT'&&/поиск|найти|search/i.test(t.placeholder||''))){e.preventDefault();}}
 addEventListener('beforeinput',stopContactInput,true);
 addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.composedPath().some(n=>n instanceof Element&&n.hasAttribute('data-kultura-time'))){selectSlot(e);}},true);
 for(const name of ['pushState','replaceState']){
  const original=history[name].bind(history);
  history[name]=function(data,title,url){if(url){const u=new URL(url,location.href);if(u.origin===own&&/\/(?:create-record|record|client|profile|payment|confirmation|confirm)(?:\/|$)/.test(u.pathname)){notice();return;}if(u.origin!==own||!(u.pathname==='/'||/^\/company\/854459\/personal\//.test(u.pathname)))throw deny('navigation',url);u.searchParams.set('parent',config.parent);url=u.pathname+u.search+u.hash;}const result=original(data,title,url);queueMicrotask(protect);return result;};
 }
 addEventListener('popstate',protect);
 function start(){captureRoot(document);protect();message({type:'ready',readOnly:true,companyId:854459,formId:918035});}
 if(document.readyState==='loading')addEventListener('DOMContentLoaded',start,{once:true});else start();
}

export function guardSource(parentOrigin = PARENT) {
 const config={parent:parentOrigin,upstream:UPSTREAM,platform:PLATFORM,paths:READ_PATHS,posts:READ_POST,metadata:METADATA_PATHS,services:SERVICES,staff:STAFF};
 return '('+browserGuard.toString()+')('+JSON.stringify(config)+',('+normalizePublicSlots.toString()+'),('+publicSlotChoice.toString()+'));';
}

export function transformHtml(html, childOrigin, parentOrigin = PARENT) {
 let result=html.replace(/<base\b[^>]*>/gi,'');
 result=result.replace(/(<(?:script|link)\b[^>]*?\b(?:src|href)=["'])(?!https?:|data:|\/\/)([^"']+)(["'])/gi,(all,start,url,end)=>start+new URL(url,UPSTREAM+'/').href+end);
 const guard='<base href="/"><meta name="robots" content="noindex,nofollow,noarchive"><script>'+guardSource(parentOrigin).replace(/<\/script/gi,'<\\/script')+'</script>';
 return result.replace(/<head(?:\s[^>]*)?>/i,match=>match+guard);
}

export function makeBootstrapHtml(childOrigin,parentOrigin=PARENT){
 // Original scaffold; only verified public external resource URLs are reused. No vendor HTML/config is copied.
 const r=PUBLIC_BOOTSTRAP_RESOURCES;
 const clean='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Культура Стиля — просмотр расписания</title><link rel="stylesheet" href="'+r.styles+'"><script src="'+r.storage+'"></script></head><body><app-root></app-root><noscript>Для просмотра расписания нужен JavaScript. Демо не отправляет записи.</noscript><script type="module" src="'+r.polyfills+'"></script><script type="module" src="'+r.main+'"></script></body></html>';
 return transformHtml(clean,childOrigin,parentOrigin);
}

function response(body,status=200,extra={}){return new Response(body,{status,headers:{...HEADERS,...extra}});}
export function resolveParentOrigin(url,defaultParent=PARENT){
 const values=url.searchParams.getAll('parent');
 if(!values.length)return defaultParent;
 return values.length===1&&ALLOWED_PARENT_ORIGINS.includes(values[0])?values[0]:null;
}
function validQuery(url){
 if([...url.searchParams.keys()].some(k=>!['o','parent'].includes(k))||url.searchParams.getAll('o').length>1||url.searchParams.getAll('parent').length>1)return false;
 const o=url.searchParams.get('o')||'';
 if(!o)return true;
 const match=o.match(/^(?:m(\d+))?s(\d+)(?:d\d{10})?$/);
 return Boolean(match&&SERVICES.includes(Number(match[2]))&&(!match[1]||STAFF.includes(Number(match[1]))));
}

// Factory injection is for isolated tests only; the deployed default ignores environment/configuration.
export function createHandler({fetchImpl=fetch,parentOrigin=PARENT}={}) {
 return async function handler(request){
  const url=new URL(request.url);
  if(!['GET','HEAD'].includes(request.method))return response('Read-only viewer',405,{'Allow':'GET, HEAD'});
  if(url.pathname==='/health')return response(JSON.stringify({ok:true,readOnly:true,companyId:854459,formId:918035,bootstrap:'verified-public-assets',upstreamHtmlRequired:false}),200,{'Content-Type':'application/json'});
  if(url.pathname==='/diagnostic'){
   if(url.search)return response('Unknown diagnostic parameters',400);
   const started=Date.now(),result={checkedAt:new Date().toISOString(),upstreamStatus:null,redirect:false,errorName:null,elapsedMs:null};
   try{
    const probe=await fetchImpl(UPSTREAM+'/',{method:'GET',redirect:'manual',credentials:'omit',signal:AbortSignal.timeout(12000)});
    result.upstreamStatus=probe.status;result.redirect=probe.status>=300&&probe.status<400;
    await probe.body?.cancel();
   }catch(error){result.errorName=String(error?.name||'Error').slice(0,60);}
   result.elapsedMs=Date.now()-started;
   return response(request.method==='HEAD'?null:JSON.stringify(result),200,{'Content-Type':'application/json; charset=utf-8'});
  }
  if(url.pathname.startsWith('/api/'))return response('API disabled',405,{'Allow':'GET, HEAD'});
  if(ASSET.test(url.pathname)){
   if(url.search)return response('Unknown asset parameters',400);
   try{const r=await fetchImpl(UPSTREAM+url.pathname,{method:'GET',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(8000)});if(!r.ok)return response('Upstream asset unavailable',502);return response(request.method==='HEAD'?null:r.body,200,{'Content-Type':r.headers.get('Content-Type')||'application/octet-stream'});}catch{return response('Upstream asset unavailable',502);}
  }
  const selectedParent=resolveParentOrigin(url,parentOrigin);
  if(!(url.pathname==='/'||PAGE.test(url.pathname))||!validQuery(url)||!selectedParent)return response('Not found',404);
  return response(request.method==='HEAD'?null:makeBootstrapHtml(url.origin,selectedParent),200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':makeCsp(url.origin,selectedParent)});
 };
}
export default {fetch:createHandler()};
