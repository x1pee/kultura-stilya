
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
 const revealCards=[...document.querySelectorAll('.direction-card,.work-card,.work-custom,.service-group')];
 let revealObserver=null;
 function settleEntrances(){for(const motion of entrances)motion.cancel();entrances.clear()}
 if(!reduced.matches&&'IntersectionObserver'in window){
  revealObserver=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting||entry.target.hidden)continue;
    const card=entry.target;revealObserver.unobserve(card);
    if(document.hidden||reduced.matches||!card.animate)continue;
    const peers=[...card.parentElement.children].filter(el=>!el.hidden&&el.matches('.direction-card,.work-card,.service-group'));
    const columns=innerWidth<=900?2:3,stagger=Math.max(0,peers.indexOf(card))%columns*65;
    const motion=card.animate([{opacity:.35,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:stagger,easing:'cubic-bezier(.22,.8,.22,1)',fill:'both'});
    entrances.add(motion);motion.finished.then(()=>{entrances.delete(motion);motion.cancel()},()=>entrances.delete(motion));
   }
  },{threshold:.06,rootMargin:'0px 0px -16px 0px'});
  revealCards.forEach(card=>{revealObserver.observe(card);card.addEventListener('focusin',()=>{for(const motion of card.getAnimations())motion.cancel()})});
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
 const stage=deck.querySelector('[data-deck-stage]'),current=deck.querySelector('[data-deck-current]'),incoming=deck.querySelector('[data-deck-incoming]'),pause=deck.querySelector('[data-deck-pause]');
 const counter=deck.querySelector('[data-deck-counter]'),announcer=deck.querySelector('[data-deck-announcer]');
 const TRANSITION_MS=460,AUTO_MS=5600;
 let index=0,target=0,busy=false,preparing=false,visible=false,manualPaused=false,hover=false,focus=false,autoTimer=0,finishTimer=0,queued=0,queuedManual=true,transitionManual=false,pointer=null,skipClickUntil=0,loadToken=0;
 const decoded=new Map();
 const wrap=value=>(value+slides.length)%slides.length;
 const paint=(card,at)=>{const slide=slides[at],image=card.querySelector('img');image.src='../assets/'+slide.file;image.alt=slide.caption+' — настоящее фото салона';card.querySelector('.deck-caption').textContent=slide.caption};
 const stopAuto=()=>{clearTimeout(autoTimer);autoTimer=0;deck.dataset.deckAutoActive='false'};
 const obstructed=()=>Boolean(document.querySelector('dialog[open]'));
 const canAuto=()=>visible&&!manualPaused&&!hover&&!focus&&!pointer&&!document.hidden&&!pageHidden&&!reduced.matches&&!busy&&!obstructed();
 const state=()=>{deck.dataset.deckIndex=String(index);deck.dataset.deckBusy=String(busy);deck.dataset.deckPreloadCount=String(decoded.size);deck.dataset.deckState=reduced.matches?'reduced':document.hidden||pageHidden?'hidden':!visible?'offscreen':obstructed()?'covered':manualPaused?'manual':preparing?'loading':busy?'transitioning':hover||focus||pointer?'interaction':'idle';stage.setAttribute('aria-busy',String(preparing));pause.disabled=reduced.matches;pause.setAttribute('aria-pressed',String(manualPaused||reduced.matches));pause.setAttribute('aria-label',reduced.matches?'Автосмена фото отключена: уменьшение движения':manualPaused?'Продолжить смену фотографий':'Приостановить смену фотографий');pause.querySelector('path').setAttribute('d',manualPaused?'M8 5l10 7-10 7Z':'M8 5v14M16 5v14')};
 function clearDecoded(){for(const entry of decoded.values())entry.cancel?.();decoded.clear();}
 function prepare(at){
  at=wrap(at);if(decoded.has(at)){const entry=decoded.get(at);decoded.delete(at);decoded.set(at,entry);return entry.promise;}
  const image=new Image();image.decoding='async';const entry={image,promise:null,cancel:null};
  entry.promise=new Promise(resolve=>{let settled=false;const done=ok=>{if(settled)return;settled=true;clearTimeout(timeout);image.onload=image.onerror=null;resolve(ok)};const timeout=setTimeout(()=>done(false),3500);entry.cancel=()=>{if(!settled){image.removeAttribute('src');done(false)}};image.onerror=()=>done(false);image.onload=()=>{if(image.decode)image.decode().then(()=>done(true),()=>done(image.naturalWidth>0));else done(image.naturalWidth>0)};image.src='../assets/'+slides[at].file;});
  entry.promise=entry.promise.then(ok=>{if(!ok&&decoded.get(at)===entry)decoded.delete(at);return ok});decoded.set(at,entry);while(decoded.size>2){const oldest=decoded.keys().next().value;decoded.get(oldest).cancel?.();decoded.delete(oldest);}state();return entry.promise;
 }
 function warmNext(){if(!visible||busy||document.hidden||pageHidden||obstructed())return;const next=wrap(index+1),at=index;prepare(next).then(ok=>{if(ok&&visible&&!busy&&!document.hidden&&!pageHidden&&!obstructed()&&index===at)paint(incoming,next)});}
 const schedule=()=>{stopAuto();state();warmNext();if(canAuto()){autoTimer=setTimeout(()=>{autoTimer=0;deck.dataset.deckAutoActive='false';refreshVisibility();if(canAuto())change(1,false)},AUTO_MS);deck.dataset.deckAutoActive='true'}};
 function commit(at,manual){index=wrap(at);paint(current,index);paint(incoming,index);counter.textContent=String(index+1);stage.setAttribute('aria-label',slides[index].caption+'. Следующее фото салона');if(manual)announcer.textContent=slides[index].caption+', '+(index+1)+' из '+slides.length;deck.dispatchEvent(new CustomEvent('kultura:deckchange',{bubbles:true,detail:{index,total:slides.length,filename:slides[index].file,manual}}));}
 function finish(continueQueue=true){clearTimeout(finishTimer);finishTimer=0;if(busy){commit(target,transitionManual);busy=false;stage.classList.remove('is-changing')}state();if(continueQueue&&queued){const step=queued,manual=queuedManual;queued=0;change(step,manual)}else{queued=0;schedule()}}
 async function change(step,manual=true){
  stopAuto();if(busy){queued=step<0?-1:1;queuedManual=manual;return}
  if((!visible&&!manual)||document.hidden||pageHidden||obstructed())return;
  target=wrap(index+(step<0?-1:1));transitionManual=manual;
  busy=true;preparing=true;const token=++loadToken;state();const ready=await prepare(target);
  if(token!==loadToken)return;
  preparing=false;if(!ready||(!visible&&!manual)||document.hidden||pageHidden||obstructed()){busy=false;queued=0;if(!ready&&manual)announcer.textContent='Не удалось загрузить фотографию. Попробуйте ещё раз.';schedule();return}
  if(reduced.matches){commit(target,manual);busy=false;if(queued){const next=queued,nextManual=queuedManual;queued=0;change(next,nextManual)}else schedule();return}
  paint(incoming,target);stage.classList.add('is-changing');state();finishTimer=setTimeout(()=>finish(),TRANSITION_MS);
 }
 const suspend=()=>{stopAuto();queued=0;pointer=null;if(preparing){loadToken++;preparing=false;busy=false;stage.classList.remove('is-changing')}else if(busy)finish(false);clearDecoded();stopAuto();state()};
 deck.querySelector('[data-deck-next]').addEventListener('click',()=>change(1));deck.querySelector('[data-deck-prev]').addEventListener('click',()=>change(-1));
 pause.addEventListener('click',()=>{manualPaused=!manualPaused;queued=0;if(manualPaused)suspend();else schedule();state()});
 stage.addEventListener('click',()=>{if(performance.now()>=skipClickUntil)change(1)});
 stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer={x:e.clientX,y:e.clientY,id:e.pointerId,swiped:false};stage.setPointerCapture?.(e.pointerId);stopAuto()});
 stage.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||pointer.swiped)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25){pointer.swiped=true;skipClickUntil=performance.now()+650;if(e.cancelable)e.preventDefault();change(dx<0?1:-1)}});
 stage.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,swiped=pointer.swiped;pointer=null;if(stage.hasPointerCapture?.(e.pointerId))stage.releasePointerCapture(e.pointerId);if(!swiped&&Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.2){skipClickUntil=performance.now()+650;change(dx<0?1:-1)}else schedule()});stage.addEventListener('pointercancel',()=>{pointer=null;schedule()});
 deck.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){hover=true;stopAuto();state()}});deck.addEventListener('pointerleave',()=>{hover=false;schedule()});deck.addEventListener('focusin',()=>{focus=true;stopAuto();state()});deck.addEventListener('focusout',()=>{focus=deck.contains(document.activeElement);schedule()});
 function refreshVisibility(){const r=stage.getBoundingClientRect(),height=innerHeight,width=innerWidth,top=Math.min(96,Math.max(0,document.querySelector('.header')?.getBoundingClientRect().bottom||0));const seenHeight=Math.max(0,Math.min(r.bottom,height-12)-Math.max(r.top,top)),seenWidth=Math.max(0,Math.min(r.right,width)-Math.max(r.left,0));const next=r.width>0&&r.height>0&&seenHeight>=Math.min(r.height,height-top-12)*.72&&seenWidth>=Math.min(r.width,width)*.85;const changed=next!==visible;visible=next;deck.dataset.deckVisible=String(visible);if(!visible||obstructed())suspend();else if(changed){warmNext();schedule();}}
 if('IntersectionObserver'in window)new IntersectionObserver(refreshVisibility,{threshold:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1]}).observe(stage);else{let fallbackTimer=0;addEventListener('scroll',()=>{if(!fallbackTimer)fallbackTimer=setTimeout(()=>{fallbackTimer=0;refreshVisibility()},100)},{passive:true});}
 addEventListener('resize',refreshVisibility,{passive:true});
 const modalObserver=new MutationObserver(records=>{if(records.some(r=>r.target.tagName==='DIALOG')){refreshVisibility();if(visible&&!obstructed())schedule()}});modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else schedule()});reduced.addEventListener('change',()=>{if(reduced.matches)suspend();else schedule();state()});
 addEventListener('pagehide',()=>{pageHidden=true;suspend()});addEventListener('pageshow',()=>{pageHidden=false;refreshVisibility();schedule()});refreshVisibility();state();
})();
