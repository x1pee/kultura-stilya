
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

/* Contact shortcuts read the existing footer; there is no second facts dataset. */
(() => {
 'use strict';
 const footer=document.querySelector('footer#contacts');
 const nav=document.getElementById('main-nav'),topline=document.querySelector('.hero-topline');
 if(!footer||!nav||!topline||document.getElementById('studio-contacts-dialog'))return;
 const pin='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
 const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
 const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
 function lines(node){
  if(!node)return[];
  const copy=node.cloneNode(true);copy.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode('\n')));
  return copy.textContent.split('\n').map(clean).filter(Boolean);
 }
 function facts(){
  const top=footer.querySelector('.footer-top');
  const location=top&&[...top.children].find(el=>el.querySelector('p')&&el.querySelector('a.text-link'));
  const addressLines=lines(location?.querySelector('p'));
  const rawCity=clean(location?.querySelector('small')?.textContent);
  const city=rawCity.toLowerCase().replace(/(^|[\s-])\p{L}/gu,letter=>letter.toUpperCase());
  const address=addressLines[0]||'';
  const hasCity=city&&address.toLowerCase().includes(city.toLowerCase());
  return{city,address:city&&!hasCity?city+', '+address:address,shortAddress:hasCity?address.slice(address.toLowerCase().indexOf(city.toLowerCase())+city.length).replace(/^[,\s]+/,''):address,hours:addressLines.slice(1).join(' · '),map:location?.querySelector('a.text-link[href]'),phone:footer.querySelector('a.footer-phone[href^="tel:"]'),socials:[...footer.querySelectorAll('.footer-links a[href]')]};
 }
 const initial=facts();if(!initial.address)return;
 const dialog=document.createElement('dialog');dialog.id='studio-contacts-dialog';dialog.className='studio-contact-dialog';dialog.setAttribute('aria-labelledby','studio-contacts-title');
 dialog.innerHTML='<header class="studio-contact-heading"><h2 id="studio-contacts-title">Как нас найти</h2><button type="button" data-studio-contacts-close aria-label="Закрыть контакты">×</button></header><div class="studio-contact-content"></div>';
 document.body.append(dialog);
 const content=dialog.querySelector('.studio-contact-content'),closeButton=dialog.querySelector('[data-studio-contacts-close]');
 const headerLink=document.createElement('button');headerLink.type='button';headerLink.className='studio-contact-nav';headerLink.dataset.openStudioContacts='';headerLink.textContent='Как найти';
 nav.insertBefore(headerLink,nav.querySelector('.nav-cta'));
 const heroLink=document.createElement('button');heroLink.type='button';heroLink.className='studio-contact-pin';heroLink.dataset.openStudioContacts='';heroLink.innerHTML=pin+'<b></b>';
 topline.replaceChildren(heroLink);
 for(const trigger of[headerLink,heroLink]){trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls',dialog.id);}
 function updatePin(value){
  const city=value.city.toLowerCase()==='санкт-петербург'?'СПб':value.city;
  const compact=value.shortAddress.replace(/^проспект\s+/iu,'пр. ');
  heroLink.querySelector('b').textContent=[city,compact].filter(Boolean).join(' · ');
  heroLink.setAttribute('aria-label','Открыть адрес и часы работы: '+value.address);
 }
 function publicLink(source,className){
  if(!source)return null;
  const href=source.getAttribute('href');
  if(!href||!/^https:\/\//i.test(href))return null;
  const link=source.cloneNode(true);link.className=className;link.target='_blank';link.rel='noopener noreferrer';
  return link;
 }
 function render(){
  const value=facts();updatePin(value);content.replaceChildren();
  const address=document.createElement('section');address.className='studio-contact-location';
  const label=document.createElement('p');label.className='studio-contact-label';label.textContent='Адрес';
  const main=document.createElement('p');main.className='studio-contact-address';main.textContent=value.address;address.append(label,main);
  if(value.hours){const hours=document.createElement('p');hours.className='studio-contact-hours';hours.textContent=value.hours;address.append(hours);}
  const map=publicLink(value.map,'studio-contact-route');if(map){map.replaceChildren(document.createTextNode('Построить маршрут'));map.insertAdjacentHTML('beforeend',arrow);address.append(map);}
  content.append(address);
  if(value.phone){const call=document.createElement('a');call.className='studio-contact-phone';call.href=value.phone.getAttribute('href');const small=document.createElement('small');small.textContent='Позвонить в салон';const number=document.createElement('strong');number.textContent=clean(value.phone.textContent);call.append(small,number);call.insertAdjacentHTML('beforeend',arrow);content.append(call);}
  const socials=document.createElement('div');socials.className='studio-contact-socials';socials.setAttribute('aria-label','Мессенджеры и социальные сети');
  value.socials.forEach(source=>{const link=publicLink(source,'studio-contact-social');if(link)socials.append(link)});if(socials.childElementCount)content.append(socials);
 }
 let origin=null,lock=null,scrollPosition=0;
 const visible=element=>Boolean(element?.isConnected&&element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden');
 function open(trigger){
  if(dialog.open)return;
  render();origin=trigger||document.activeElement;scrollPosition=window.scrollY;
  document.body.classList.remove('menu-open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
  if(!document.querySelector('dialog[open]')){
   lock={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width};
   const width=document.body.getBoundingClientRect().width;
   document.body.style.position='fixed';document.body.style.top=-scrollPosition+'px';document.body.style.width=width+'px';
  }
  dialog.showModal();dialog.scrollTop=0;closeButton.focus({preventScroll:true});
 }
 function close(){if(dialog.open)dialog.close();}
 closeButton.addEventListener('click',close);
 dialog.addEventListener('close',()=>{
  if(lock){Object.assign(document.body.style,lock);lock=null;window.scrollTo({top:scrollPosition,behavior:'instant'});}
  const remaining=[...document.querySelectorAll('dialog[open]')].at(-1);
  let target=visible(origin)?origin:document.querySelector('.menu-toggle');
  if(!visible(target))target=heroLink;
  if(remaining&&!remaining.contains(target))target=remaining.querySelector('button,a[href],[tabindex="0"]');
  target?.focus({preventScroll:true});origin=null;
 });
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close()});
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const items=[...dialog.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')].filter(visible),first=items[0],last=items.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-open-studio-contacts]');if(!trigger)return;event.preventDefault();open(trigger)});
 addEventListener('pagehide',close);updatePin(initial);
})();
