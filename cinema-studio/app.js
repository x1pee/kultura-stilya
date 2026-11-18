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

/* Studio-only motion: CSS ribbon, one bounded deck timeout, no idle RAF loop. */
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
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.4);update()},{threshold:[0,.4,1]}).observe(ribbon);else visible=true;
  document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);addEventListener('pagehide',()=>{pageHidden=true;update()});addEventListener('pageshow',()=>{pageHidden=false;update()});update();
 }
 const deck=document.querySelector('[data-salon-deck]');if(!deck)return;
 const slides=JSON.parse(document.getElementById('studio-media-data').textContent).slides;
 const stage=deck.querySelector('[data-deck-stage]'),pause=deck.querySelector('[data-deck-pause]');
 let current=deck.querySelector('[data-deck-current]'),incoming=deck.querySelector('[data-deck-incoming]');
 const counter=deck.querySelector('[data-deck-counter]'),announcer=deck.querySelector('[data-deck-announcer]');
 const TRANSITION_MS=460,AUTO_MS=3500;
 let index=0,target=0,busy=false,preparing=false,visible=false,inView=false,manualPaused=false,focus=false,keyboardInput=false,autoTimer=0,finishTimer=0,queued=0,queuedManual=true,transitionManual=false,pointer=null,skipClickUntil=0,loadToken=0,warming=null,prefetch=null;
 const readySrc=new WeakMap(),pendingDecode=new WeakMap();
 const wrap=value=>(value+slides.length)%slides.length;
 const paint=(card,at)=>{const slide=slides[at],image=card.querySelector('img'),src='../assets/'+slide.file;if(image.getAttribute('src')!==src){readySrc.delete(image);image.src=src}image.alt=slide.caption+' — настоящее фото салона';if(slide.width&&slide.height){image.width=slide.width;image.height=slide.height}card.querySelector('.deck-caption').textContent=slide.caption;return image};
 const stopAuto=()=>{clearTimeout(autoTimer);autoTimer=0;deck.dataset.deckAutoActive='false'};
 const obstructed=()=>Boolean(document.querySelector('dialog[open]'));
 const canAuto=()=>visible&&!manualPaused&&!focus&&!pointer&&!document.hidden&&!pageHidden&&!reduced.matches&&!busy&&!obstructed();
 const state=()=>{const image=incoming.querySelector('img'),ready=readySrc.get(image)===image.getAttribute('src');deck.dataset.deckIndex=String(index);deck.dataset.deckBusy=String(busy);deck.dataset.deckPreloadCount=ready?'1':'0';deck.dataset.deckPredecodeActive=String(Boolean(prefetch&&!prefetch.settled));deck.dataset.deckNextReady=String(ready);deck.dataset.deckState=reduced.matches?'reduced':document.hidden||pageHidden?'hidden':obstructed()?'covered':manualPaused?'manual':preparing?'loading':busy?'transitioning':!visible?'offscreen':focus||pointer?'interaction':'idle';stage.setAttribute('aria-busy',String(preparing));pause.disabled=reduced.matches;pause.setAttribute('aria-pressed',String(manualPaused||reduced.matches));pause.setAttribute('aria-label',reduced.matches?'Автосмена фото отключена: уменьшение движения':manualPaused?'Продолжить смену фотографий':'Приостановить смену фотографий');pause.querySelector('path').setAttribute('d',manualPaused?'M8 5l10 7-10 7Z':'M8 5v14M16 5v14')};
 function predecode(at){
  const src='../assets/'+slides[wrap(at)].file;if(prefetch?.src===src&&!prefetch.image.isConnected)return prefetch.promise;
  prefetch?.cancel();const image=new Image();image.decoding='async';const entry={src,image,promise:null,cancel:null,settled:false};
  entry.promise=new Promise(resolve=>{const done=ok=>{if(entry.settled)return;entry.settled=true;clearTimeout(timeout);image.onload=image.onerror=null;if(!ok&&prefetch===entry)prefetch=null;resolve(ok?image:null)};const timeout=setTimeout(()=>done(false),3500);entry.cancel=()=>{if(!entry.settled){image.removeAttribute('src');done(false)}};image.onerror=()=>done(false);image.onload=()=>{if(image.decode)image.decode().then(()=>done(true),()=>done(false));else done(image.naturalWidth>0)};image.src=src;});prefetch=entry;state();return entry.promise;
 }
 function decodeCard(card,at){
  const image=paint(card,wrap(at)),src=image.getAttribute('src');image.loading='eager';image.decoding='async';
  if(readySrc.get(image)===src&&image.complete&&image.naturalWidth>0)return Promise.resolve(true);
  const previous=pendingDecode.get(image);if(previous?.src===src)return previous.promise;
  const entry={src,promise:null};entry.promise=new Promise(resolve=>{let settled=false;const done=ok=>{if(settled)return;settled=true;clearTimeout(timeout);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);const valid=ok&&image.getAttribute('src')===src&&image.naturalWidth>0;if(valid)readySrc.set(image,src);if(pendingDecode.get(image)===entry)pendingDecode.delete(image);resolve(valid)};const timeout=setTimeout(()=>done(false),3500),failed=()=>done(false),loaded=()=>done(image.naturalWidth>0);if(image.decode)image.decode().then(()=>done(true),()=>done(false));else{image.addEventListener('load',loaded,{once:true});image.addEventListener('error',failed,{once:true});if(image.complete)loaded();}});pendingDecode.set(image,entry);return entry.promise;
 }
 async function prepareCard(card,at,relevant){const old=card.querySelector('img'),src='../assets/'+slides[wrap(at)].file;if(old.getAttribute('src')!==src){const image=await predecode(at);if(!image||!relevant())return false;image.draggable=false;image.loading='eager';image.decoding='async';image.width=slides[wrap(at)].width||old.width;image.height=slides[wrap(at)].height||old.height;image.className=old.className;old.replaceWith(image);}if(!relevant())return false;return decodeCard(card,at);}
 function warmNext(){if(!visible||busy||document.hidden||pageHidden||obstructed())return;const next=wrap(index+1),at=index,card=incoming,token=loadToken;if(warming?.index===at&&warming?.card===card)return;warming={index:at,card};const relevant=()=>visible&&!busy&&!document.hidden&&!pageHidden&&!obstructed()&&index===at&&incoming===card&&loadToken===token;prepareCard(card,next,relevant).then(ok=>{if(warming?.index===at&&warming?.card===card)warming=null;if(ok&&relevant())state()});}
 const schedule=()=>{stopAuto();state();warmNext();if(canAuto()){autoTimer=setTimeout(()=>{autoTimer=0;deck.dataset.deckAutoActive='false';refreshVisibility();if(canAuto())change(1,false)},AUTO_MS);deck.dataset.deckAutoActive='true'}};
 function commit(at,manual){stage.classList.remove('is-changing');const old=current;current=incoming;incoming=old;current.removeAttribute('data-deck-incoming');current.setAttribute('data-deck-current','');current.removeAttribute('aria-hidden');incoming.removeAttribute('data-deck-current');incoming.setAttribute('data-deck-incoming','');incoming.setAttribute('aria-hidden','true');index=wrap(at);counter.textContent=String(index+1);stage.setAttribute('aria-label',slides[index].caption+'. Следующее фото салона');if(manual)announcer.textContent=slides[index].caption+', '+(index+1)+' из '+slides.length;deck.dispatchEvent(new CustomEvent('kultura:deckchange',{bubbles:true,detail:{index,total:slides.length,filename:slides[index].file,manual}}));}
 function finish(continueQueue=true){clearTimeout(finishTimer);finishTimer=0;if(busy){commit(target,transitionManual);busy=false}state();if(continueQueue&&queued){const step=queued,manual=queuedManual;queued=0;change(step,manual)}else{queued=0;schedule()}}
 async function change(step,manual=true){
  stopAuto();if(busy){queued=step<0?-1:1;queuedManual=manual;return}
  if((!visible&&!manual)||document.hidden||pageHidden||obstructed())return;
  target=wrap(index+(step<0?-1:1));transitionManual=manual;
  busy=true;preparing=true;warming=null;const token=++loadToken,card=incoming,at=target;state();const ready=await prepareCard(card,at,()=>token===loadToken&&incoming===card&&!document.hidden&&!pageHidden&&!obstructed()&&(visible||manual));
  if(token!==loadToken)return;
  preparing=false;if(!ready||(!visible&&!manual)||document.hidden||pageHidden||obstructed()){busy=false;queued=0;if(!ready&&manual)announcer.textContent='Не удалось загрузить фотографию. Попробуйте ещё раз.';schedule();return}
  if(reduced.matches){commit(target,manual);busy=false;if(queued){const next=queued,nextManual=queuedManual;queued=0;change(next,nextManual)}else schedule();return}
  stage.classList.add('is-changing');state();finishTimer=setTimeout(()=>finish(),TRANSITION_MS+100);
 }
 stage.addEventListener('animationend',event=>{if(busy&&!preparing&&event.target===incoming&&event.animationName==='r8-deck-in')finish()});
 const suspend=()=>{stopAuto();queued=0;pointer=null;warming=null;if(preparing){loadToken++;preparing=false;busy=false;stage.classList.remove('is-changing')}else if(busy)finish(false);prefetch?.cancel();prefetch=null;stopAuto();state()};
 deck.querySelector('[data-deck-next]').addEventListener('click',()=>change(1));deck.querySelector('[data-deck-prev]').addEventListener('click',()=>change(-1));
 pause.addEventListener('click',()=>{manualPaused=!manualPaused;queued=0;if(manualPaused)suspend();else schedule();state()});
 stage.addEventListener('click',()=>{if(performance.now()>=skipClickUntil)change(1)});
 stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer={x:e.clientX,y:e.clientY,id:e.pointerId,swiped:false};stage.setPointerCapture?.(e.pointerId);stopAuto()});
 stage.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||pointer.swiped)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25){pointer.swiped=true;skipClickUntil=performance.now()+650;if(e.cancelable)e.preventDefault();change(dx<0?1:-1)}});
 stage.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,swiped=pointer.swiped;pointer=null;if(stage.hasPointerCapture?.(e.pointerId))stage.releasePointerCapture(e.pointerId);if(!swiped&&Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.2){skipClickUntil=performance.now()+650;change(dx<0?1:-1)}else schedule()});stage.addEventListener('pointercancel',()=>{pointer=null;schedule()});
 document.addEventListener('pointerdown',()=>{keyboardInput=false;if(focus){focus=false;schedule()}},true);
 document.addEventListener('keydown',event=>{if(['Tab','ArrowLeft','ArrowRight','Enter',' '].includes(event.key)){keyboardInput=true;focus=deck.contains(document.activeElement);if(focus){stopAuto();state()}}},true);
 deck.addEventListener('focusin',()=>{focus=keyboardInput;if(focus)stopAuto();state()});deck.addEventListener('focusout',()=>{focus=keyboardInput&&deck.contains(document.activeElement);schedule()});
 function refreshVisibility(){const r=stage.getBoundingClientRect(),height=innerHeight,width=innerWidth,top=Math.min(96,Math.max(0,document.querySelector('.header')?.getBoundingClientRect().bottom||0));const seenHeight=Math.max(0,Math.min(r.bottom,height-12)-Math.max(r.top,top)),seenWidth=Math.max(0,Math.min(r.right,width)-Math.max(r.left,0));const next=r.width>0&&r.height>0&&seenHeight>=Math.min(r.height,height-top-12)*.72&&seenWidth>=Math.min(r.width,width)*.85;const changed=next!==visible;inView=seenHeight>0&&seenWidth>0;visible=next;deck.dataset.deckVisible=String(visible);deck.dataset.deckInView=String(inView);if(!inView||obstructed())suspend();else if(!visible){stopAuto();if(busy&&!transitionManual)suspend();else state()}else if(changed){warmNext();schedule();}}
 if('IntersectionObserver'in window)new IntersectionObserver(refreshVisibility,{threshold:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1]}).observe(stage);else{let fallbackTimer=0;addEventListener('scroll',()=>{if(!fallbackTimer)fallbackTimer=setTimeout(()=>{fallbackTimer=0;refreshVisibility()},100)},{passive:true});}
 addEventListener('resize',refreshVisibility,{passive:true});
 const modalObserver=new MutationObserver(records=>{if(records.some(r=>r.target.tagName==='DIALOG')){refreshVisibility();if(visible&&!obstructed())schedule()}});modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else schedule()});reduced.addEventListener('change',()=>{if(reduced.matches)suspend();else schedule();state()});
 addEventListener('pagehide',()=>{pageHidden=true;suspend()});addEventListener('pageshow',()=>{pageHidden=false;refreshVisibility();schedule()});refreshVisibility();state();
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
  const frame=document.createElement('iframe');frame.src=config.embed;frame.title='Культура Стиля на Яндекс Картах';frame.loading='lazy';frame.referrerPolicy='no-referrer';frame.setAttribute('allowfullscreen','');frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups');
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
