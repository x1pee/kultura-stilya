/* Finite native-dialog motion. No prototype changes, cloned forms or network work. */
(() => {
 'use strict';
 if(!window.HTMLDialogElement)return;
 const known='dialog#studio-request-dialog,dialog#studio-contacts-dialog,dialog.studio-contact-dialog,dialog.studio-widget-dialog,dialog#work-preview,dialog.rq-dialog';
 const nativeShow=HTMLDialogElement.prototype.showModal,nativeClose=HTMLDialogElement.prototype.close;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),records=new WeakMap(),enhanced=new Set();
 const OPEN_MS=220,CLOSE_MS=150;
 let pageHidden=false;
 const immediate=()=>reduced.matches||document.hidden||pageHidden;
 const phase=(state,value)=>{state.phase=value;state.dialog.dataset.dialogMotionState=value;};
 function clearTimer(state){clearTimeout(state.timer);state.timer=0;state.generation++;}
 function snapshot(dialog){const s=getComputedStyle(dialog),back=getComputedStyle(dialog,'::backdrop');return{opacity:s.opacity,transform:s.transform,backdrop:back.opacity};}
 function settleOpen(state){clearTimer(state);if(state.dialog.open)phase(state,'open');}
 function finishClose(state){
  clearTimer(state);const args=state.closeArgs;state.closeArgs=[];
  if(state.dialog.open)nativeClose.apply(state.dialog,args);
  phase(state,'closed');
 }
 function beginOpen(state,from=null){
  clearTimer(state);const d=state.dialog;
  d.style.setProperty('--studio-dialog-entry-opacity',from?.opacity||'0');
  d.style.setProperty('--studio-dialog-entry-transform',from?.transform||'translateY(10px) scale(.99)');
  d.style.setProperty('--studio-dialog-backdrop-entry',from?.backdrop||'0');
  d.toggleAttribute('data-dialog-motion-skip',immediate());
  phase(state,immediate()?'open':'opening');
  if(!immediate()){const token=state.generation;state.timer=setTimeout(()=>{if(state.generation===token&&state.phase==='opening')settleOpen(state)},OPEN_MS+35);}
 }
 function requestClose(state,args){
  const d=state.dialog;
  if(!d.open)return nativeClose.apply(d,args);
  if(state.phase==='closing')return;
  clearTimer(state);state.closeArgs=args;
  if(immediate()){d.setAttribute('data-dialog-motion-skip','');finishClose(state);return;}
  const from=snapshot(d);
  d.style.setProperty('--studio-dialog-exit-opacity',from.opacity);
  d.style.setProperty('--studio-dialog-exit-transform',from.transform);
  d.style.setProperty('--studio-dialog-backdrop-exit',from.backdrop);
  phase(state,'closing');const token=state.generation;
  state.timer=setTimeout(()=>{if(state.generation===token&&state.phase==='closing')finishClose(state)},CLOSE_MS+40);
 }
 function reopen(dialog){
  const state=records.get(dialog);
  if(!state||!dialog.open||state.phase!=='closing')return false;
  const from=snapshot(dialog);state.closeArgs=[];beginOpen(state,from);return true;
 }
 function enhance(dialog){
  if(!(dialog instanceof HTMLDialogElement)||records.has(dialog))return dialog;
  const state={dialog,phase:'closed',timer:0,generation:0,closeArgs:[]};records.set(dialog,state);enhanced.add(state);
  dialog.setAttribute('data-studio-dialog-motion','');
  // These are own methods on this opt-in dialog; HTMLDialogElement.prototype stays native.
  dialog.showModal=function(...args){
   if(this!==dialog)return nativeShow.apply(this,args);
   if(reopen(dialog))return;
   const wasOpen=dialog.open,result=nativeShow.apply(dialog,args);
   if(!wasOpen)beginOpen(state);return result;
  };
  dialog.close=function(...args){if(this!==dialog)return nativeClose.apply(this,args);return requestClose(state,args);};
  dialog.addEventListener('cancel',event=>{if(event.defaultPrevented)return;event.preventDefault();requestClose(state,[]);});
  dialog.addEventListener('animationend',event=>{
   if(event.target!==dialog||event.pseudoElement)return;
   if(event.animationName==='studio-dialog-enter'&&state.phase==='opening')settleOpen(state);
   else if(event.animationName==='studio-dialog-exit'&&state.phase==='closing')finishClose(state);
  });
  dialog.addEventListener('close',()=>{if(!dialog.open){clearTimer(state);phase(state,'closed');}});
  if(dialog.open)beginOpen(state);else phase(state,'closed');
  return dialog;
 }
 function scan(node){if(node.nodeType!==1)return;if(node.matches(known))enhance(node);node.querySelectorAll(known).forEach(enhance);}
 scan(document.documentElement);
 const observer=new MutationObserver(changes=>{
  for(const change of changes){
   if(change.type==='childList'){change.addedNodes.forEach(scan);continue;}
   const d=change.target;if(!d.matches(known))continue;enhance(d);const state=records.get(d);
   if(d.open&&state.phase==='closed')beginOpen(state);
   else if(!d.open&&state.phase!=='closed'){clearTimer(state);phase(state,'closed');}
  }
 });
 observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 function settle(){for(const state of enhanced){if(state.phase==='closing')finishClose(state);else if(state.phase==='opening'){state.dialog.setAttribute('data-dialog-motion-skip','');settleOpen(state);}}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
 reduced.addEventListener('change',()=>{if(reduced.matches)settle();});
 addEventListener('pagehide',()=>{pageHidden=true;settle();});
 addEventListener('pageshow',()=>{pageHidden=false;});
 window.StudioDialogMotion={enhance,reopen};
})();


(()=>{'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const data=JSON.parse(document.getElementById('cinema-data').textContent);const categories=new Map(data.categories.map(c=>[c.id,c.title]));
 const menu=document.querySelector('.menu-toggle');const close=()=>{document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false')};
 menu.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open))});
 document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',close));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const open=document.body.classList.contains('menu-open');close();if(open)menu.focus()}});
 addEventListener('resize',()=>{if(innerWidth>900)close()},{passive:true});
 function filter(category,scroll){
  if(!categories.has(category))return;
  document.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===category)));
  document.querySelectorAll('[data-work-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workFilter===category)));
  document.querySelectorAll('[data-work-category]').forEach(card=>card.hidden=card.dataset.workCategory!==category);
  document.getElementById('work-status').textContent=categories.get(category)+' · фотографии из открытой галереи салона';
  if(scroll)document.getElementById('works').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});
 }
 document.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('click',()=>filter(b.dataset.direction,true)));
 document.querySelectorAll('[data-work-filter]').forEach(b=>b.addEventListener('click',()=>filter(b.dataset.workFilter,false)));
 const dialog=document.getElementById('work-preview');
 document.querySelectorAll('[data-open-work]').forEach(b=>b.addEventListener('click',()=>{dialog.querySelector('img').src='../assets/'+b.dataset.openWork;dialog.querySelector('img').alt=b.dataset.workCaption+' — работа салона';dialog.querySelector('#preview-caption').textContent=b.dataset.workCaption+' · фотография из галереи салона';dialog.showModal()}));
 dialog.querySelector('.preview-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 const reveals=[...document.querySelectorAll('.reveal')];
 if(!reduced.matches&&'IntersectionObserver'in window){document.documentElement.classList.add('motion');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('shown');observer.unobserve(entry.target)}}),{threshold:.03,rootMargin:'0px 0px -18px 0px'});reveals.forEach(el=>{observer.observe(el);el.addEventListener('focusin',()=>el.classList.add('shown'))});reduced.addEventListener('change',()=>{if(reduced.matches){reveals.forEach(el=>el.classList.add('shown'));observer.disconnect()}})}
 let progressFrame=0;const update=()=>{progressFrame=0;const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.header').style.setProperty('--progress',max>0?Math.max(0,Math.min(1,scrollY/max)):0)};
 addEventListener('scroll',()=>{if(!document.hidden&&!progressFrame)progressFrame=requestAnimationFrame(update)},{passive:true});addEventListener('resize',()=>{if(!progressFrame)progressFrame=requestAnimationFrame(update)},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(progressFrame);progressFrame=0}});update();
})();

/* A fresh visit never implies a chosen treatment; only explicit actions select one. */
(() => {
 'use strict';
 const controls=[...document.querySelectorAll('[data-direction],[data-work-filter]')];
 controls.forEach(control=>control.setAttribute('aria-pressed','false'));
 const custom=document.querySelector('[data-request-custom]');
 if(custom)custom.dataset.requestCategory='';
 const represented=new Set();
 document.querySelectorAll('[data-work-category]').forEach(card=>{const key=card.dataset.workCategory;card.hidden=represented.has(key);represented.add(key)});
 const status=document.getElementById('work-status');
 if(status)status.textContent='Примеры работ по всем направлениям — выберите то, что интересно вам';
})();

/* Only the visual theme is persisted. Request fields and photos remain in memory. */
(() => {
 'use strict';
 const html=document.documentElement, key='kultura-theme';
 const choices=[...document.querySelectorAll('[data-theme-choice]')];
 const setTheme=(value,persist=true)=>{
  const theme=value==='salon'?'salon':'mono';html.dataset.studioTheme=theme;
  choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)));
  document.querySelector('meta[name="theme-color"]').content=theme==='mono'?'#161616':'#102b26';
  if(persist)try{localStorage.setItem(key,theme)}catch{}
  dispatchEvent(new CustomEvent('kultura:themechange',{detail:{theme}}));
 };
 choices.forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.themeChoice)));
 addEventListener('storage',e=>{if(e.key===key)setTheme(e.newValue,false)});
 setTheme(html.dataset.studioTheme,false);
})();

/* Studio-only entrances and CSS ribbon. Salon gallery is a separate manual module. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let pageHidden=false;
 const custom=document.querySelector('[data-request-custom]');
 document.addEventListener('click',event=>{const pick=event.target.closest('[data-direction],[data-work-filter]');if(custom&&pick)custom.dataset.requestCategory=pick.dataset.direction||pick.dataset.workFilter});
 // Finite entrances only. Content stays visible if motion support is unavailable.
 const entrances=new Set();
 const revealCards=[...document.querySelectorAll('.direction-card,.work-card,.work-custom')].filter(card=>!card.classList.contains('reveal'));
 const ownEntrances=new WeakMap();
 let revealObserver=null;
 function settleEntrances(){for(const motion of entrances)motion.cancel();entrances.clear()}
 if(!reduced.matches&&'IntersectionObserver'in window){
  revealObserver=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting||entry.target.hidden)continue;
    const card=entry.target;revealObserver.unobserve(card);
    if(document.hidden||reduced.matches||!card.animate)continue;
    const peers=[...card.parentElement.children].filter(el=>!el.hidden&&el.matches('.direction-card,.work-card,.service-group'));
    const columns=innerWidth<=900?2:3,stagger=Math.max(0,peers.indexOf(card))%columns*45;
    // One opacity-only entrance: large text panels never leave a temporary transform layer.
    // Keep the real selected/hover transform in CSS throughout the entrance and its final frame.
    const options={duration:420,delay:stagger,easing:'cubic-bezier(.22,.8,.22,1)',fill:'backwards'};
    const motions=[card.animate([{opacity:.72},{opacity:1}],options)];
    ownEntrances.set(card,new Set(motions));
    for(const motion of motions){entrances.add(motion);motion.finished.then(()=>{entrances.delete(motion);ownEntrances.get(card)?.delete(motion)},()=>{entrances.delete(motion);ownEntrances.get(card)?.delete(motion)})}
   }
  },{threshold:.06,rootMargin:'0px 0px -16px 0px'});
  revealCards.forEach(card=>{revealObserver.observe(card);card.addEventListener('focusin',()=>{for(const motion of ownEntrances.get(card)||[])motion.cancel()})});
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)settleEntrances()});
 reduced.addEventListener('change',()=>{if(reduced.matches){settleEntrances();revealObserver?.disconnect()}});
 addEventListener('pagehide',()=>{settleEntrances();revealObserver?.disconnect()});
 const ribbon=document.querySelector('[data-studio-ribbon]');
 if(ribbon){
  const track=ribbon.querySelector('[data-marquee-track]'),legacyPause=ribbon.querySelector('[data-ribbon-pause]');
  const toggle=ribbon.matches('[data-ribbon-toggle]')?ribbon:ribbon.querySelector('[data-ribbon-toggle]')||legacyPause||ribbon;
  let visible=false,manual=false;
  const update=()=>{if(!track)return;const paused=manual||!visible||document.hidden||pageHidden||reduced.matches;track.toggleAttribute('data-motion-paused',paused);ribbon.dataset.motionState=reduced.matches?'reduced':document.hidden||pageHidden?'hidden':!visible?'offscreen':manual?'manual':'running';const label=reduced.matches?'Лента направлений: движение отключено в настройках устройства':manual?'Продолжить движение ленты направлений':'Приостановить ленту направлений';toggle.setAttribute('aria-pressed',String(manual||reduced.matches));toggle.setAttribute('aria-label',label);toggle.setAttribute('aria-disabled',String(reduced.matches));if(legacyPause){legacyPause.disabled=reduced.matches;legacyPause.setAttribute('aria-pressed',String(manual||reduced.matches));legacyPause.setAttribute('aria-label',label);const text=legacyPause.querySelector('span'),icon=legacyPause.querySelector('path');if(text)text.textContent=manual?'Продолжить':'Пауза';if(icon)icon.setAttribute('d',manual?'M8 5l10 7-10 7Z':'M8 5v14M16 5v14')}};
  const press=event=>{if(reduced.matches)return;event?.preventDefault();manual=!manual;update()};
  toggle.addEventListener('click',press);toggle.addEventListener('keydown',event=>{if(toggle.tagName!=='BUTTON'&&['Enter',' '].includes(event.key)){event.preventDefault();if(!event.repeat)press(event)}});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);update()},{threshold:0}).observe(ribbon);else visible=true;
  document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);addEventListener('pagehide',()=>{pageHidden=true;update()});addEventListener('pageshow',()=>{pageHidden=false;update()});update();
 }
})();

/* One location section: native anchors work even without scripting. No geolocation or form data. */
(() => {
 'use strict';
 const location=document.getElementById('location'),nav=document.getElementById('main-nav'),topline=document.querySelector('.hero-topline');
 const configNode=document.getElementById('studio-location-data');
 if(!location||!nav||!topline||!configNode)return;
 const config=JSON.parse(configNode.textContent),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const pin='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
 const city=location.querySelector('address span')?.textContent||'',address=location.querySelector('address')?.lastChild.textContent||'';
 const headerLink=document.createElement('a');headerLink.href='#location';headerLink.className='studio-contact-nav';headerLink.textContent='Как найти';nav.insertBefore(headerLink,nav.querySelector('.nav-cta'));
 const heroLink=document.createElement('a');heroLink.href='#location';heroLink.className='studio-contact-pin';heroLink.innerHTML=pin+'<b></b>';
 heroLink.querySelector('b').textContent=[city==='Санкт-Петербург'?'СПб':city,address.replace(/^проспект\s+/iu,'пр. ')].join(' · ');
 heroLink.setAttribute('aria-label','Перейти к карте и адресу салона');topline.replaceChildren(heroLink);
 const header=document.querySelector('.header');
 function headerSize(){const h=header?.getBoundingClientRect().height||0,padding=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0;document.documentElement.style.setProperty('--studio-anchor-offset',Math.max(0,Math.ceil(h+16-padding))+'px');}
 headerSize();if('ResizeObserver'in window)new ResizeObserver(headerSize).observe(header);else addEventListener('resize',headerSize,{passive:true});
 document.querySelectorAll('.work-card').forEach(card=>{card.addEventListener('click',event=>{if(event.target.closest('button,a,input,select,textarea'))return;card.querySelector('.work-select')?.click();});});
 // True hash links provide browser history and a no-JS fallback. Wait for the menu to close before positioning.
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href="#location"]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();document.body.classList.remove('menu-open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
  if(window.location.hash!=='#location')history.pushState(null,'','#location');
  requestAnimationFrame(()=>{headerSize();location.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});});
 });
 const ua=navigator.userAgent,ios=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),android=/Android/i.test(ua),mobile=ios||android;
 location.dataset.mapMode=mobile?'app':'browser';
 location.querySelector('[data-map-choice-title]').textContent=mobile?'В каком приложении открыть?':'Где открыть маршрут?';
 const fallback=location.querySelector('[data-map-browser]');fallback.hidden=!mobile;
 for(const provider of config.providers){
  const link=location.querySelector('[data-map-provider="'+provider.id+'"]');if(!link)continue;
  link.dataset.browserHref=provider.browser;
  if(mobile){link.href=android?provider.android:provider.ios;link.removeAttribute('target');link.setAttribute('aria-label','Открыть маршрут в приложении '+provider.label);}
  else{link.href=provider.browser;link.target='_blank';link.setAttribute('aria-label','Открыть маршрут в браузере: '+provider.label);}
  link.addEventListener('click',()=>{if(mobile){fallback.href=provider.browser;fallback.textContent='Открыть '+provider.label+' в браузере ↗';}});
 }
 const mount=location.querySelector('[data-map-mount]'),button=location.querySelector('[data-load-studio-map]');let started=false;
 function loadMap(){
  if(started||!mount)return;started=true;mount.dataset.mapState='loading';
  const frame=document.createElement('iframe');frame.src=config.embed;frame.title='Культура Стиля на OpenStreetMap';frame.loading='lazy';frame.referrerPolicy='no-referrer';frame.setAttribute('allowfullscreen','');frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups');
  frame.addEventListener('load',()=>{mount.dataset.mapState='loaded';location.querySelector('[data-map-placeholder]')?.remove();},{once:true});mount.append(frame);
 }
 button?.addEventListener('click',loadMap);
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){loadMap();observer.disconnect();}},{rootMargin:'120px 0px'});observer.observe(mount);}
})();

/* Studio category glass: presentation only; aria-pressed stays owned by request.js. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 function install(){
  const dialog=document.getElementById('studio-request-dialog');
  const strip=dialog?.querySelector('.rq-categories');
  if(!strip)return false;
  if(strip.dataset.categoryGlassReady==='true')return true;
  const chips=[...strip.querySelectorAll('.rq-cat[data-rq-category]')];
  if(!chips.length)return false;
  const glass=document.createElement('span');glass.className='studio-category-glass';glass.setAttribute('aria-hidden','true');strip.prepend(glass);
  strip.dataset.categoryGlassReady='true';strip.dataset.glassSelection='false';strip.dataset.glassStatic='true';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,visible=false,pageHidden=false,painted=false,reveal=null;
  const isOpen=()=>dialog.open&&!document.hidden&&!pageHidden;
  function edgeState(){
   const maximum=Math.max(0,strip.scrollWidth-strip.clientWidth);
   strip.style.setProperty('--category-fade-left',strip.scrollLeft>2?'18px':'0px');
   strip.style.setProperty('--category-fade-right',maximum-strip.scrollLeft>2?'18px':'0px');
   strip.dataset.glassOverflow=String(maximum>2);
  }
  function paint(){
   frame=0;if(!isOpen())return;
   const selected=chips.find(chip=>chip.getAttribute('aria-pressed')==='true'&&!chip.disabled&&!chip.hidden);
   const canMove=visible&&!reduced.matches;
   strip.dataset.glassStatic=String(!canMove||!painted);
   if(selected&&selected.offsetWidth){
    glass.style.width=selected.offsetWidth+'px';glass.style.height=selected.offsetHeight+'px';
    glass.style.transform='translate3d('+selected.offsetLeft+'px,'+selected.offsetTop+'px,0)';
    strip.dataset.glassSelection='true';painted=true;
   }else{strip.dataset.glassSelection='false';painted=false;}
   if(reveal?.offsetWidth){
    const target=Math.max(0,Math.min(strip.scrollWidth-strip.clientWidth,reveal.offsetLeft-(strip.clientWidth-reveal.offsetWidth)/2));
    if(Math.abs(target-strip.scrollLeft)>1)strip.scrollTo({left:target,behavior:canMove?'smooth':'instant'});
   }
   reveal=null;edgeState();
  }
  function schedule(chip=null){
   if(chip)reveal=chip;
   if(!isOpen()){strip.dataset.glassStatic='true';if(frame)cancelAnimationFrame(frame);frame=0;return;}
   if(!frame)frame=requestAnimationFrame(paint);
  }
  function selectedChanged(){schedule(chips.find(chip=>chip.getAttribute('aria-pressed')==='true'));}
  strip.addEventListener('scroll',()=>schedule(),{passive:true});
  strip.addEventListener('focusin',event=>{const chip=event.target.closest('.rq-cat');if(chip&&strip.contains(chip))schedule(chip);});
  const mutations=new MutationObserver(records=>{
   if(records.some(record=>record.target===dialog)){painted=false;selectedChanged();}
   else selectedChanged();
  });
  mutations.observe(strip,{subtree:true,attributes:true,attributeFilter:['aria-pressed','disabled','hidden']});
  mutations.observe(dialog,{attributes:true,attributeFilter:['open']});
  const size=typeof ResizeObserver==='function'?new ResizeObserver(()=>schedule()):null;
  size?.observe(strip);chips.forEach(chip=>size?.observe(chip));
  const visibility=new IntersectionObserver(entries=>{
   visible=Boolean(entries[0]?.isIntersecting&&entries[0].intersectionRect.width>1&&entries[0].intersectionRect.height>1);
   if(!visible)strip.dataset.glassStatic='true';schedule();
  },{root:dialog.querySelector('.studio-request-scroll'),threshold:[0,1]});visibility.observe(strip);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)strip.dataset.glassStatic='true';schedule();});
  reduced.addEventListener('change',()=>{strip.dataset.glassStatic='true';schedule();});
  window.addEventListener('resize',()=>schedule(),{passive:true});
  window.addEventListener('pagehide',()=>{pageHidden=true;strip.dataset.glassStatic='true';if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',()=>{pageHidden=false;schedule();});
  schedule();return true;
 }
 if(install())return;
 const mount=new MutationObserver(()=>{if(install())mount.disconnect();});
 mount.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pagehide',()=>mount.disconnect(),{once:true});
})();

/* R14 salon-only manual gallery. Decode the connected incoming bitmap before exposing it. */
(() => {
 'use strict';
 const deck=document.querySelector('.studio-gallery[data-salon-deck]');
 if(!deck)return;
 const slides=JSON.parse(document.getElementById('studio-media-data').textContent).slides;
 const stage=deck.querySelector('[data-deck-stage]'),counter=deck.querySelector('[data-deck-counter]');
 const announcer=deck.querySelector('[data-deck-announcer]'),status=deck.querySelector('[data-gallery-status]');
 const openButton=deck.querySelector('[data-gallery-action=open]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=deck.querySelector('[data-deck-current]'),incoming=deck.querySelector('[data-deck-incoming]');
 let index=0,target=0,busy=false,preparing=false,visible=false,pageHidden=false,queued=0,token=0;
 let finishTimer=0,pointer=null,skipClickUntil=0,warming=null,viewer=null,viewerToken=0,locked=null;
 const ready=new WeakMap(),pending=new WeakMap();
 const wrap=value=>(value+slides.length)%slides.length;
 const blocked=()=>Boolean(document.querySelector('dialog[open]'));
 const active=()=>visible&&!document.hidden&&!pageHidden&&!blocked();
 const notice=text=>{status.textContent=text;status.hidden=!text};
 const state=()=>{deck.dataset.deckIndex=String(index);deck.dataset.deckBusy=String(busy);deck.dataset.deckAutoActive='false';deck.dataset.deckVisible=String(visible);deck.dataset.deckState=document.hidden||pageHidden?'hidden':blocked()?'covered':!visible?'offscreen':preparing?'loading':busy?'transitioning':'manual';stage.setAttribute('aria-busy',String(preparing));const image=incoming.querySelector('img');deck.dataset.deckNextReady=String(ready.get(image)===image.getAttribute('src')&&image.complete&&image.naturalWidth>0)};
 function paint(card,at){const item=slides[wrap(at)],image=card.querySelector('img'),src='../assets/'+item.file;if(image.getAttribute('src')!==src){pending.get(image)?.cancel();ready.delete(image);image.src=src}image.alt=item.caption+' — настоящее фото салона';image.width=item.width;image.height=item.height;image.loading='eager';image.decoding='async';card.querySelector('.deck-caption').textContent=item.caption;return image}
 function decode(card,at){
  const image=paint(card,at),src=image.getAttribute('src');
  if(ready.get(image)===src&&image.complete&&image.naturalWidth>0)return Promise.resolve(true);
  const old=pending.get(image);if(old?.src===src)return old.promise;
  const entry={src,promise:null,cancel:null};
  entry.promise=new Promise(resolve=>{
   let settled=false;
   const done=ok=>{if(settled)return;settled=true;clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);const valid=Boolean(ok&&image.isConnected&&image.getAttribute('src')===src&&image.complete&&image.naturalWidth>0);if(valid)ready.set(image,src);if(pending.get(image)===entry)pending.delete(image);resolve(valid)};
   const failed=()=>done(false),loaded=()=>done(image.naturalWidth>0),timer=setTimeout(()=>done(false),12000);
   entry.cancel=()=>done(false);
   image.addEventListener('error',failed,{once:true});
   if(image.decode)image.decode().then(()=>done(true),failed);
   else{image.addEventListener('load',loaded,{once:true});if(image.complete)loaded()}
  });pending.set(image,entry);return entry.promise;
 }
 async function warm(){
  if(!active()||busy||warming)return;
  const at=index,card=incoming,operation=token;
  warming={card,at};
  const first=await decode(current,index);
  if(first&&active()&&!busy&&index===at&&token===operation)await decode(card,wrap(at+1));
  if(warming?.card===card&&warming?.at===at)warming=null;
  state();
 }
 function commit(){
  const image=incoming.querySelector('img');
  if(ready.get(image)!==image.getAttribute('src')||!image.complete||!image.naturalWidth)return false;
  const old=current;current=incoming;incoming=old;
  current.removeAttribute('data-deck-incoming');current.setAttribute('data-deck-current','');current.removeAttribute('aria-hidden');
  incoming.removeAttribute('data-deck-current');incoming.setAttribute('data-deck-incoming','');incoming.setAttribute('aria-hidden','true');
  stage.classList.remove('is-changing');index=target;counter.textContent=String(index+1);
  openButton.setAttribute('aria-label','Открыть фотографию: '+slides[index].caption);
  announcer.textContent=slides[index].caption+', '+(index+1)+' из '+slides.length;
  deck.dispatchEvent(new CustomEvent('kultura:deckchange',{bubbles:true,detail:{index,total:slides.length,filename:slides[index].file,manual:true}}));
  return true;
 }
 function finish(continueQueue=true){
  clearTimeout(finishTimer);finishTimer=0;
  if(busy&&!preparing)commit();
  stage.classList.remove('is-changing');busy=false;preparing=false;notice('');state();
  if(continueQueue&&queued&&active()){const step=queued;queued=0;change(step)}else{queued=0;warm()}
 }
 async function change(step){
  if(busy){queued=step<0?-1:1;return}
  if(!active())return;
  target=wrap(index+(step<0?-1:1));busy=true;preparing=true;warming=null;
  const operation=++token,card=incoming;notice('Загружаем фото…');state();
  const first=await decode(current,index);
  const prepared=first&&operation===token&&active()&&await decode(card,target);
  if(operation!==token)return;
  preparing=false;
  if(!prepared||!active()){busy=false;queued=0;notice(prepared?'':'Фото не загрузилось. Нажмите ещё раз.');state();return}
  notice('');
  if(reduced.matches){finish();return}
  stage.classList.add('is-changing');state();finishTimer=setTimeout(()=>finish(),460);
 }
 stage.addEventListener('animationend',event=>{if(busy&&!preparing&&event.target===incoming&&event.animationName==='studio-gallery-in')finish()});
 function suspend(){
  queued=0;pointer=null;warming=null;viewerToken++;
  if(preparing){token++;busy=false;preparing=false;stage.classList.remove('is-changing')}
  else if(busy)finish(false);
  pending.get(incoming.querySelector('img'))?.cancel();
  notice('');state();
 }
 function measure(){
  const r=stage.getBoundingClientRect(),header=Math.max(0,document.querySelector('.header')?.getBoundingClientRect().bottom||0);
  const seenH=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,Math.min(header,110))),seenW=Math.max(0,Math.min(r.right,innerWidth)-Math.max(r.left,0));
  const next=seenH>Math.min(90,r.height*.2)&&seenW>r.width*.5,changed=next!==visible;visible=next;
  if(!active())suspend();else if(changed)warm();state();
 }
 if('IntersectionObserver'in window)new IntersectionObserver(measure,{threshold:[0,.1,.2,.4,.6,1]}).observe(stage);
 let scrollFrame=0;addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;measure()})},{passive:true});
 addEventListener('resize',measure,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else{measure();warm()}});
 addEventListener('pagehide',()=>{pageHidden=true;suspend()});addEventListener('pageshow',()=>{pageHidden=false;measure()});
 reduced.addEventListener('change',()=>{if(reduced.matches&&busy&&!preparing)finish(false);state()});
 new MutationObserver(records=>{if(records.some(item=>item.target.tagName==='DIALOG')){if(blocked())suspend();else{measure();warm()}}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 stage.addEventListener('pointerdown',event=>{if(event.button!==0||!active())return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY};stage.setPointerCapture?.(event.pointerId)});
 stage.addEventListener('pointerup',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;
  if(stage.hasPointerCapture?.(event.pointerId))stage.releasePointerCapture(event.pointerId);
  if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.25){skipClickUntil=performance.now()+650;change(dx<0?1:-1)}
 });
 stage.addEventListener('pointercancel',()=>{pointer=null;skipClickUntil=performance.now()+100});
 stage.addEventListener('click',event=>{
  if(performance.now()<skipClickUntil)return;
  const control=event.target.closest('[data-gallery-action]');
  let action=control?.dataset.galleryAction;
  if(event.detail!==0){const r=stage.getBoundingClientRect(),x=(event.clientX-r.left)/r.width;action=x<.24?'prev':x>.76?'next':'open'}
  if(action==='prev')change(-1);else if(action==='next')change(1);else if(action==='open')openPhoto();
 });
 stage.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();change(event.key==='ArrowLeft'?-1:1)}});
 function createViewer(){
  if(viewer)return viewer;
  viewer=document.createElement('dialog');viewer.id='salon-photo-viewer';viewer.className='studio-salon-viewer';viewer.setAttribute('aria-labelledby','salon-viewer-title');
  viewer.innerHTML='<div class="studio-salon-viewer-header"><h2 id="salon-viewer-title"></h2><button type="button" class="studio-salon-viewer-close" data-gallery-close aria-label="Закрыть фотографию">×</button></div><img class="studio-salon-viewer-photo" alt="" decoding="async">';
  document.body.append(viewer);
  viewer.querySelector('[data-gallery-close]').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',event=>{if(event.target!==viewer)return;const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close()});
  viewer.addEventListener('close',()=>{
   if(locked){const saved=locked;locked=null;Object.assign(document.body.style,saved.styles);scrollTo({top:saved.y,behavior:'instant'})}
   openButton.focus({preventScroll:true});measure();warm();
  });
  return viewer;
 }
 async function openPhoto(){
  if(busy||!active())return;
  const operation=++viewerToken,at=index,image=current.querySelector('img');
  if(!await decode(current,index)||operation!==viewerToken||!active())return;
  const dialog=createViewer(),photo=dialog.querySelector('img'),src=image.getAttribute('src');
  photo.src=src;photo.alt=image.alt;photo.width=image.width;photo.height=image.height;dialog.querySelector('h2').textContent=slides[index].caption;
  try{if(photo.decode)await photo.decode()}catch{return}
  if(operation!==viewerToken||at!==index||!active()||!photo.complete||!photo.naturalWidth)return;
  window.StudioDialogMotion?.enhance(dialog);
  const body=document.body,y=scrollY,width=body.getBoundingClientRect().width;
  locked={y,styles:{position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow}};
  Object.assign(body.style,{position:'fixed',top:'-'+y+'px',width:width+'px',overflow:'clip'});
  try{dialog.showModal();dialog.querySelector('button').focus({preventScroll:true})}catch{Object.assign(body.style,locked.styles);locked=null;scrollTo({top:y,behavior:'instant'})}
 }
 measure();state();
})();

/* Original measurement diagram and visible required marks; no form values or requests change. */
(() => {
 'use strict';
 function markRequired(root){
  for(const label of root.querySelectorAll('label,.rq-reference-title')){
   const walker=document.createTreeWalker(label,NodeFilter.SHOW_TEXT),texts=[];
   while(walker.nextNode()){const node=walker.currentNode;if(node.textContent.includes('*')&&!node.parentElement.closest('.rq-required-mark'))texts.push(node);}
   for(const node of texts){const fragment=document.createDocumentFragment(),parts=node.textContent.split('*');parts.forEach((text,index)=>{if(index){const mark=document.createElement('span');mark.className='rq-required-mark';mark.textContent='*';fragment.append(mark);}fragment.append(document.createTextNode(text));});node.replaceWith(fragment);}
  }
 }
 function init(){
  const root=document.querySelector('[data-request-root][data-booking-mode]'),panel=root?.querySelector('[data-rq-tattoo]');
  if(!panel)return false;
  if(root.dataset.tattooGuideReady==='true')return true;
  markRequired(root);
  if(!panel.querySelector('[data-tattoo-measure-guide]')){
   const guide=document.createElement('details');guide.className='studio-tattoo-guide';guide.dataset.tattooMeasureGuide='';
   guide.innerHTML='<summary>Как измерить татуировку</summary><figure><svg viewBox="0 0 280 196" role="img" aria-labelledby="tattoo-guide-title tattoo-guide-desc" xmlns="http://www.w3.org/2000/svg"><title id="tattoo-guide-title">Длина и ширина рисунка</title><desc id="tattoo-guide-desc">Условный орнамент: длина измеряется сверху вниз, ширина — между крайними боковыми точками. Числа ниже приведены для примера.</desc><defs><marker id="tattoo-guide-arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M7 1 1 4l6 3" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></marker></defs><g class="tattoo-guide-art" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M123 24c-9 12-9 20 0 28 9-8 9-16 0-28Z"/><path d="M123 52v78m0-60c-18-2-27-11-29-22 16 0 25 7 29 22Zm0 19c19-2 28-11 30-22-17 0-26 7-30 22Zm0 20c-15-1-23-8-25-18 13 0 22 6 25 18Z"/><path d="m123 130-8 8 8 10 8-10-8-8Zm-20-50-4 4m47 19 4 4m-27-92v-3"/><circle cx="123" cy="158" r="1.5"/><circle cx="85" cy="44" r="1"/><circle cx="160" cy="63" r="1"/></g><g class="tattoo-guide-extensions" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="2 3"><path d="M136 24h52m-51 134h51M85 56v122m75-103v103"/></g><g class="tattoo-guide-dimensions" fill="none" stroke="currentColor" stroke-width="1" marker-start="url(#tattoo-guide-arrow)" marker-end="url(#tattoo-guide-arrow)"><path d="M188 27v128M89 178h67"/></g><g class="tattoo-guide-labels" fill="currentColor" stroke="none" font-family="Manrope,Arial,sans-serif" font-size="17" font-weight="600"><text x="201" y="94">Длина<tspan class="tattoo-guide-star">*</tspan></text><text x="123" y="195" text-anchor="middle">Ширина<tspan class="tattoo-guide-star">**</tspan></text></g></svg><figcaption><span>* Длина — например, 20 см</span><span>** Ширина — например, 8 см</span><small>Схема для примера, не работа салона</small></figcaption></figure>';
   panel.append(guide);
  }
  // The reference label gains its required star only when tattoo is selected later.
  const labels=new MutationObserver(()=>markRequired(root));
  const watchLabels=()=>root.querySelectorAll('label,.rq-reference-title').forEach(label=>labels.observe(label,{subtree:true,childList:true,characterData:true}));
  watchLabels();
  root.addEventListener('kultura:request-selection',()=>{watchLabels();markRequired(root);});
  root.dataset.tattooGuideReady='true';
  addEventListener('pagehide',()=>labels.disconnect(),{once:true});
  return true;
 }
 if(!init()){
  const observer=new MutationObserver(()=>{if(init())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 }
})();

/* Enhance the existing studio toggle/link/Escape handlers; do not install duplicate toggles. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 const header=document.querySelector('.header'),button=header?.querySelector('.menu-toggle'),nav=header?.querySelector('.nav');
 if(!button||!nav)return;
 const mobile=matchMedia('(max-width:900px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const originalTabIndexes=new WeakMap(),supportsInert='inert' in HTMLElement.prototype;
 let timer=0,lastOpen=null,lastMobile=null;
 if(!nav.id)nav.id='studio-mobile-nav';
 button.setAttribute('aria-controls',nav.id);
 button.querySelector('span')?.setAttribute('aria-hidden','true');
 function setInert(inert){
  if(supportsInert){nav.inert=inert;return}
  for(const item of nav.querySelectorAll('a[href],button,[tabindex]')){
   if(inert){if(!originalTabIndexes.has(item))originalTabIndexes.set(item,item.getAttribute('tabindex'));item.setAttribute('tabindex','-1')}
   else if(originalTabIndexes.has(item)){const value=originalTabIndexes.get(item);if(value===null)item.removeAttribute('tabindex');else item.setAttribute('tabindex',value);originalTabIndexes.delete(item)}
  }
 }
 function settle(){clearTimeout(timer);timer=0;header.dataset.menuState=!mobile.matches?'desktop':document.body.classList.contains('menu-open')?'open':'closed'}
 function sync(force=false){
  const isMobile=mobile.matches,open=isMobile&&document.body.classList.contains('menu-open');
  header.dataset.menuMotion=document.hidden||reduced.matches?'off':'on';
  button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
  if(isMobile&&!open&&nav.contains(document.activeElement)&&!document.querySelector('dialog[open]'))button.focus({preventScroll:true});
  setInert(isMobile&&!open);
  if(isMobile)nav.setAttribute('aria-hidden',String(!open));else nav.removeAttribute('aria-hidden');
  if(force||open!==lastOpen||isMobile!==lastMobile){
   clearTimeout(timer);timer=0;
   const animate=isMobile&&lastMobile===true&&lastOpen!==null&&open!==lastOpen&&!document.hidden&&!reduced.matches;
   header.dataset.menuState=animate?(open?'opening':'closing'):isMobile?(open?'open':'closed'):'desktop';
   if(animate)timer=setTimeout(settle,300);
   lastOpen=open;lastMobile=isMobile;
  }
 }
 new MutationObserver(()=>sync()).observe(document.body,{attributes:true,attributeFilter:['class']});
 mobile.addEventListener('change',()=>sync(true));
 reduced.addEventListener('change',()=>{sync(true);if(reduced.matches)settle()});
 document.addEventListener('visibilitychange',()=>{sync(true);if(document.hidden)settle()});
 addEventListener('pagehide',()=>{clearTimeout(timer);timer=0;header.dataset.menuMotion='off';settle()});
 addEventListener('pageshow',()=>sync(true));
 header.dataset.studioMenuReady='true';sync(true);
})();

/* Only the chosen group is promoted above native lazy loading; no gallery-wide eager fetch. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 const images=[...document.querySelectorAll('[data-studio-work-image]')];
 const prepared=new WeakSet();
 function ready(image){
  if(!image.complete||!image.naturalWidth)return;
  const source=image.currentSrc;
  const finish=()=>{if(image.currentSrc===source&&image.complete&&image.naturalWidth){image.dataset.imageReady='true';image.style.backgroundImage='none'}};
  if(image.decode)image.decode().then(finish,()=>{});else finish();
 }
 for(const image of images){
  image.addEventListener('load',()=>ready(image));
  image.addEventListener('error',()=>{
   if(image.dataset.originalRetry)return;
   image.dataset.originalRetry='true';
   image.closest('picture')?.querySelector('source')?.remove();
   image.src=image.dataset.originalSrc;
  });
  ready(image);
 }
 function promote(image,priority){
  if(!image||prepared.has(image))return;
  prepared.add(image);
  image.fetchPriority=priority?'high':'auto';
  image.loading='eager';
  ready(image);
 }
 // Capture starts the selected small group before the existing filter reveals it.
 document.addEventListener('click',event=>{
  const control=event.target.closest('[data-direction],[data-work-filter]');
  if(!control)return;
  const category=control.dataset.direction||control.dataset.workFilter;
  let count=0;
  for(const card of document.querySelectorAll('[data-work-category]')){
   if(card.dataset.workCategory===category)promote(card.querySelector('[data-studio-work-image]'),count++<2);
  }
 },true);
 if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting||entry.target.closest('[hidden]'))continue;
    promote(entry.target,false);observer.unobserve(entry.target);
   }
  },{rootMargin:'250px 0px'});
  images.forEach(image=>observer.observe(image));
  addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 }
})();

/* Calm alternatives reuse the six real direction controls and their existing flow. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 const ribbon=document.querySelector('.studio-ribbon-continuous');
 const directions=[...document.querySelectorAll('.direction-card[data-direction]')];
 if(!ribbon||directions.length!==6)return;
 const options=[
  {id:'quiet',title:'Тихая строка'},
  {id:'compact',title:'Компактная'},
  {id:'columns',title:'Две колонки'},
  {id:'pills',title:'Направления'},
  {id:'marquee',title:'Медленное движение'},
  {id:'none',title:'Без ленты'}
 ];
 const choices=document.createElement('nav');
 choices.className='studio-ribbon-options';choices.setAttribute('aria-label','Выбрать направление салона');
 const buttons=[];
 for(const direction of directions){
  const label=direction.querySelector('.direction-copy strong')?.textContent.trim();
  if(!label)continue;
  const button=document.createElement('button');button.type='button';button.className='studio-ribbon-choice';
  button.textContent=label;button.dataset.ribbonCategory=direction.dataset.direction;button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>{
   direction.click();
   const filter=[...document.querySelectorAll('[data-work-filter]')].find(item=>item.dataset.workFilter===direction.dataset.direction);
   filter?.focus({preventScroll:true});
   sync();
  });
  choices.append(button);buttons.push(button);
 }
 ribbon.after(choices);
 function sync(){for(const button of buttons){const direction=directions.find(item=>item.dataset.direction===button.dataset.ribbonCategory);button.setAttribute('aria-pressed',String(direction?.getAttribute('aria-pressed')==='true'));}}
 function apply(id){
  if(!options.some(option=>option.id===id))return false;
  document.body.dataset.studioRibbon=id;
  const moving=id==='marquee',visible=id!=='none';
  ribbon.hidden=!moving;ribbon.inert=!moving;ribbon.setAttribute('aria-hidden',String(!moving));
  choices.hidden=!visible||moving;choices.inert=!visible||moving;
  sync();
  document.dispatchEvent(new CustomEvent('kultura:ribbon-preview',{detail:{id}}));
  return true;
 }
 document.addEventListener('click',event=>{if(event.target.closest('[data-direction],[data-work-filter]'))sync();});
 window.KulturaStudioRibbons={options,apply};
 apply('quiet');
})();

/* The CSS loop owns motion. Rebuild its two equal halves only when their size changes. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 const ribbon=document.querySelector('.studio-ribbon-continuous');
 const track=ribbon?.querySelector('[data-marquee-track]');
 const viewport=ribbon?.querySelector('.studio-marquee');
 const groups=track?[...track.children].filter(item=>item.classList.contains('studio-marquee-group')):[];
 if(viewport&&groups.length===2){
  const source=[...groups[0].children].map(item=>item.cloneNode(true));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let copies=1,duration='';
  function repeat(count){
   if(count===copies)return;
   for(const group of groups){
    const fragment=document.createDocumentFragment();
    for(let i=0;i<count;i++)for(const item of source)fragment.append(item.cloneNode(true));
    group.replaceChildren(fragment);
   }
   copies=count;
  }
  function fit(){
   if(reduced.matches){repeat(1);return}
   const width=viewport.clientWidth,unit=groups[0].getBoundingClientRect().width/copies;
   if(!source.length||width<=0||unit<=0)return;
   // Each half includes one trailing gap, so width/copies remains the exact repeat width.
   const count=Math.max(1,Math.ceil((width+1)/unit));
   repeat(count);
   const next=(unit*count/16).toFixed(3)+'s';
   if(next!==duration){track.style.setProperty('--studio-marquee-duration',next);duration=next}
  }
  if('ResizeObserver'in window){const observer=new ResizeObserver(fit);observer.observe(viewport);observer.observe(groups[0])}
  else addEventListener('resize',fit,{passive:true});
  reduced.addEventListener('change',fit);
  document.addEventListener('kultura:ribbon-preview',fit);
  if(document.fonts){document.fonts.ready.then(fit);document.fonts.addEventListener('loadingdone',fit)}
  fit();
 }
 // Keep the broad click/swipe zones and their labels; only replace font-dependent glyphs.
 for(const button of document.querySelectorAll('.studio-gallery-zones [data-gallery-action=prev],.studio-gallery-zones [data-gallery-action=next]')){
  const icon=button.querySelector('span[aria-hidden=true]');
  if(!icon)continue;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',button.dataset.galleryAction==='prev'?'m15 6-6 6 6 6':'m9 6 6 6-6 6');
  svg.append(path);icon.replaceChildren(svg);
 }
})();

/* Temporary palette previews do not overwrite the visitor's saved salon/mono choice. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 const html=document.documentElement;
 const options=[
  {id:'mono',title:'Монохром'},
  {id:'salon',title:'Цвет салона'},
  {id:'pearl',title:'Жемчужный'},
  {id:'rose',title:'Пудровая роза'},
  {id:'champagne',title:'Шампань'},
  {id:'plum',title:'Сливовый'},
  {id:'espresso',title:'Эспрессо'},
  {id:'slate',title:'Морской графит'}
 ];
 const colors={mono:'#161616',salon:'#102b26',pearl:'#eaece8',rose:'#f5e9e9',champagne:'#ede3d2',plum:'#241d29',espresso:'#251d18',slate:'#19272e'};
 let changeTimer=0;
 function settle(){clearTimeout(changeTimer);html.classList.remove('studio-theme-shifting');}
 function apply(id){
  if(!options.some(option=>option.id===id))return false;
  settle();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden){
   html.classList.add('studio-theme-shifting');
   changeTimer=setTimeout(settle,280);
  }
  const custom=id!=='mono'&&id!=='salon';
  if(custom){html.dataset.studioPreviewTheme=id;html.dataset.studioTheme='mono';}
  else{delete html.dataset.studioPreviewTheme;html.dataset.studioTheme=id;}
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(!custom&&button.dataset.themeChoice===id)));
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=colors[id];
  dispatchEvent(new CustomEvent('kultura:themechange',{detail:{theme:id,preview:custom}}));
  return true;
 }
 // Preserve the original two controls and their original storage behavior.
 document.addEventListener('click',event=>{
  if(!event.target.closest('[data-theme-choice]'))return;
  delete html.dataset.studioPreviewTheme;
  settle();
 },true);
 addEventListener('storage',event=>{if(event.key==='kultura-theme'){delete html.dataset.studioPreviewTheme;settle();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
 addEventListener('pagehide',settle);
 window.KulturaStudioThemes={options,apply};
})();

/* Composition previews reuse the real hero, its single heading and existing actions. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 const hero=document.querySelector('.studio .hero');
 if(!hero)return;
 const options=Object.freeze([
  {id:'cover-left',title:'Кинопостер'},
  {id:'cover-center',title:'В центре кадра'},
  {id:'split',title:'Фото и текст'},
  {id:'editorial',title:'Журнальная обложка'},
  {id:'frame',title:'В рамке'},
  {id:'portrait',title:'Вертикальный кадр'}
 ].map(Object.freeze));
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let animation=null;
 function cancel(){animation?.cancel();animation=null;}
 function apply(id){
  if(id!=='original'&&!options.some(option=>option.id===id))return false;
  cancel();
  if(id==='original')delete document.body.dataset.studioHero;
  else document.body.dataset.studioHero=id;
  const rect=hero.getBoundingClientRect();
  if(!motion.matches&&!document.hidden&&rect.bottom>0&&rect.top<innerHeight&&hero.animate){
   animation=hero.animate([{opacity:.78},{opacity:1}],{duration:240,easing:'ease-out'});
   animation.onfinish=()=>{animation=null;};
  }
  document.dispatchEvent(new CustomEvent('kultura:hero-preview',{detail:{id}}));
  return true;
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 motion.addEventListener?.('change',event=>{if(event.matches)cancel();});
 addEventListener('pagehide',cancel);
 window.KulturaStudioHeroes=Object.freeze({options,apply});
})();

/* Six finite intro studies. No media requests, simulated progress or blocking layer. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 const options=[
  {id:'split',title:'В стороны'},
  {id:'lift',title:'Шторка вверх'},
  {id:'iris',title:'Круговое раскрытие'},
  {id:'shutters',title:'Вверх и вниз'},
  {id:'signature',title:'Подпись'},
  {id:'frame',title:'В рамке'}
 ];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');
 layer.className='studio-intro';layer.setAttribute('aria-hidden','true');layer.inert=true;
 document.body.append(layer);
 let animations=[],timer=0,sequence=0,run=0;
 const word=()=>'<div class="studio-intro-word"><span>Культура</span><em>Стиля</em></div>';
 function cancel(){
  sequence++;clearTimeout(timer);timer=0;
  animations.forEach(animation=>animation.cancel());animations=[];
  layer.classList.remove('is-active');layer.replaceChildren();delete layer.dataset.intro;
 }
 function play(id){
  cancel();
  if(!options.some(option=>option.id===id)||reduced.matches||document.hidden||!Element.prototype.animate)return false;
  const current=sequence;
  layer.dataset.intro=id;
  // Alternating names restart the CSS failsafe even for a rapid same-frame replay.
  layer.dataset.introRun=String(++run%2);
  const split=id==='split'||id==='shutters';
  layer.innerHTML=split?'<div class="studio-intro-pane">'+word()+'</div><div class="studio-intro-pane">'+word()+'</div>':'<div class="studio-intro-pane">'+word()+(id==='signature'?'<i class="studio-intro-line"></i>':id==='frame'?'<i class="studio-intro-frame"></i>':'')+'</div>';
  layer.classList.add('is-active');
  const animate=(element,frames,duration,delay=0)=>{
   if(!element)return;
   animations.push(element.animate(frames,{duration,delay,easing:'cubic-bezier(.22,.75,.2,1)',fill:'both'}));
  };
  const panels=layer.querySelectorAll('.studio-intro-pane'),letters=layer.querySelectorAll('.studio-intro-word');
  const hold=500,reveal=850;
  // One stationary glass layer avoids a blur seam between moving clipped panels.
  animate(layer,[{opacity:1},{opacity:0}],reveal,hold);
  if(id==='split'){
   animate(panels[0],[{transform:'translateX(0)',opacity:1},{transform:'translateX(-102%)',opacity:0}],reveal,hold);
   animate(panels[1],[{transform:'translateX(0)',opacity:1},{transform:'translateX(102%)',opacity:0}],reveal,hold);
  }else if(id==='lift'){
   animate(letters[0],[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-28px)'}],800,hold);
   animate(panels[0],[{transform:'translateY(0)',opacity:1},{transform:'translateY(-102%)',opacity:0}],reveal,hold);
  }else if(id==='iris'){
   animate(letters[0],[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.96) translateY(-10px)'}],650,hold);
   animate(panels[0],[{clipPath:'circle(150% at 50% 50%)',opacity:1},{clipPath:'circle(0% at 50% 50%)',opacity:0}],reveal,hold);
  }else if(id==='shutters'){
   animate(panels[0],[{transform:'translateY(0)',opacity:1},{transform:'translateY(-102%)',opacity:0}],reveal,hold);
   animate(panels[1],[{transform:'translateY(0)',opacity:1},{transform:'translateY(102%)',opacity:0}],reveal,hold);
  }else if(id==='signature'){
   animate(letters[0],[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-18px)'}],800,hold);
   animate(layer.querySelector('.studio-intro-line'),[{opacity:0,transform:'translateX(-50%) scaleX(0)'},{opacity:.55,transform:'translateX(-50%) scaleX(1)'}],400);
   animate(panels[0],[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-14px)'}],reveal,hold);
  }else{
   animate(letters[0],[{opacity:1,transform:'scale(1) translateY(0)'},{opacity:0,transform:'scale(1.025) translateY(-10px)'}],800,hold);
   animate(layer.querySelector('.studio-intro-frame'),[{opacity:.4,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.6)'}],reveal,hold);
   animate(panels[0],[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-10px)'}],reveal,hold);
  }
  // CSS also hides the layer if this callback cannot run; input remains available.
  timer=setTimeout(()=>{if(sequence===current)cancel()},1600);
  return true;
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 addEventListener('pagehide',cancel);
 reduced.addEventListener('change',()=>{if(reduced.matches)cancel()});
 window.KulturaStudioIntros={options,play,cancel};
})();

/* Customer chooses the palette and intro; the approved composition stays fixed. */
(() => {
 'use strict';
 if(!document.body.classList.contains('studio'))return;
 const themes=window.KulturaStudioThemes,intros=window.KulturaStudioIntros,heroes=window.KulturaStudioHeroes,ribbons=window.KulturaStudioRibbons;
 if(!themes||!intros||!heroes||!ribbons)return;
 const url=new URL(location.href);
 const groups=[
  {key:'palette',label:'Палитра',items:themes.options,apply:id=>themes.apply(id)},
  {key:'intro',label:'Вступление',items:intros.options,apply:id=>intros.play(id)}
 ];
 const current={};
 for(const group of groups){const requested=url.searchParams.get(group.key);current[group.key]=group.items.some(item=>item.id===requested)?requested:group.key==='palette'?(document.documentElement.dataset.studioTheme==='salon'?'salon':'mono'):'signature';}
 themes.apply(current.palette);heroes.apply('cover-left');ribbons.apply('marquee');
 // Old review links remain usable, but visitors always see a clean company URL.
 for(const key of ['v','palette','hero','intro','ribbon'])url.searchParams.delete(key);
 history.replaceState(history.state,'',url);
 const panel=document.createElement('details');panel.className='studio-preview';
 panel.innerHTML='<summary><span class="studio-preview-label">Варианты дизайна</span><span class="studio-preview-mark" aria-hidden="true">+</span></summary><div class="studio-preview-body"><p>Выберите оформление</p><div class="studio-preview-options"></div><button type="button" class="studio-preview-replay">Повторить вступление</button><span class="studio-preview-status" role="status" aria-live="polite"></span></div>';
 const options=panel.querySelector('.studio-preview-options'),status=panel.querySelector('[role=status]');
 const buttons=new Map();
 function paint(group){const button=buttons.get(group.key),index=group.items.findIndex(item=>item.id===current[group.key]);button.querySelector('strong').textContent=group.items[index].title;button.querySelector('small').textContent=(index+1)+' / '+group.items.length;button.setAttribute('aria-label',group.label+': '+group.items[index].title+'. Следующий вариант');}
 for(const group of groups){
  const row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');
  row.className='studio-preview-row';label.textContent=group.label;button.type='button';button.innerHTML='<strong></strong><small></small>';
  button.addEventListener('click',()=>{
   const index=group.items.findIndex(item=>item.id===current[group.key]);current[group.key]=group.items[(index+1)%group.items.length].id;
   if(group.key==='intro'){panel.open=false;panel.querySelector('summary').focus({preventScroll:true});document.getElementById('top')?.scrollIntoView({block:'start',behavior:'instant'});}
   group.apply(current[group.key]);paint(group);status.textContent=group.label+': '+group.items.find(item=>item.id===current[group.key]).title;
  });
  row.append(label,button);options.append(row);buttons.set(group.key,button);paint(group);
 }
 panel.querySelector('.studio-preview-replay').addEventListener('click',()=>{panel.open=false;panel.querySelector('summary').focus({preventScroll:true});document.getElementById('top')?.scrollIntoView({block:'start',behavior:'instant'});intros.play(current.intro);});
 document.addEventListener('click',event=>{if(panel.open&&!panel.contains(event.target))panel.open=false;const choice=event.target.closest('[data-theme-choice]');if(choice){current.palette=choice.dataset.themeChoice;paint(groups[0]);}});
 addEventListener('storage',event=>{if(event.key==='kultura-theme'){current.palette=document.documentElement.dataset.studioTheme==='salon'?'salon':'mono';paint(groups[0]);}});
 panel.addEventListener('keydown',event=>{if(event.key==='Escape'){panel.open=false;panel.querySelector('summary').focus();}});
 const headerSwitch=document.querySelector('.studio-theme-switch');
 if(headerSwitch)headerSwitch.replaceWith(panel);else document.body.append(panel);
 intros.play(current.intro);
})();
