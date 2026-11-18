/* Studio-only presentation. The existing local draft stays in the same DOM. */
(() => {
  'use strict';
  const mount=document.querySelector('[data-request-presentation="dialog"]');
  if(!mount||!window.KulturaRequest?.setPresentationAdapter)return;
  const section=mount.closest('section');
  const dialog=document.createElement('dialog');dialog.id='studio-request-dialog';dialog.className='studio-request-dialog';dialog.setAttribute('aria-labelledby','studio-request-title');
  dialog.setAttribute('closedby','none');
  dialog.addEventListener('cancel',event=>event.preventDefault(),{capture:true});
  dialog.innerHTML='<header class="studio-request-header"><span id="studio-request-title">Ваш визит в Культуру Стиля</span><button type="button" data-dialog-close aria-label="Закрыть окно заявки">×</button></header><div class="studio-request-scroll"></div>';
  const scroll=dialog.querySelector('.studio-request-scroll');scroll.append(mount);document.body.append(dialog);
  // The draft lives in the dialog; no duplicate invitation or empty padded section remains.
  section.remove();
  const rq=mount.querySelector('.rq');
  rq.classList.add('rq-compact');
  rq.querySelector('h2').textContent='Детали вашего визита';
  rq.querySelector('h2').hidden=true;
  rq.querySelector('.rq-intro').textContent='Выберите услугу, добавьте пожелания и фотографии. Черновик останется в этой вкладке';
  const form=rq.querySelector('form');
  const contactColumn=rq.querySelector('.rq-layout>.rq-col:nth-child(2)');
  contactColumn.classList.add('rq-contact-column');
  const contactHeading=document.createElement('h3');contactHeading.className='rq-contact-heading';contactHeading.textContent='Контакты';contactColumn.prepend(contactHeading);
  const bottom=form.querySelector('.rq-bottom');if(bottom)contactColumn.append(bottom);
  const uploadField=rq.querySelector('[data-rq-upload]');
  const upload=uploadField.querySelector('.rq-upload');
  const referenceDetails=document.createElement('section');referenceDetails.className='rq-reference-details';referenceDetails.setAttribute('aria-label','Фотографии и референсы');
  referenceDetails.innerHTML='<header class="studio-reference-heading"><span class="rq-reference-title">Фото и референсы</span><span class="rq-reference-count"></span></header>';
  referenceDetails.append(upload);uploadField.append(referenceDetails);
  const referenceTitle=referenceDetails.querySelector('.rq-reference-title'),referenceCount=referenceDetails.querySelector('.rq-reference-count');
  const fileInput=rq.querySelector('#rq-files'),fileHint=rq.querySelector('#rq-files-hint');
  fileHint?.remove();fileInput.setAttribute('aria-describedby','rq-files-error');fileInput.setAttribute('aria-label','Добавить фотографии');
  const fileChoice=document.createElement('div');fileChoice.className='studio-file-choice';
  fileChoice.innerHTML='<span aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 4 4 3-3 6 6"/></svg><span>Добавить фото</span></span>';
  fileInput.before(fileChoice);fileChoice.append(fileInput);
  const paste=rq.querySelector('[data-reference-paste]');if(paste){
    paste.dataset.placeholder='Вставить фото';
    const pasteChoice=document.createElement('div');pasteChoice.className='studio-paste-choice';
    pasteChoice.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="16" rx="3"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>';
    paste.before(pasteChoice);pasteChoice.append(paste);
    const pasteHint=document.createElement('small');pasteHint.id='studio-paste-hint';pasteHint.className='studio-paste-hint';pasteHint.textContent='Скопируйте фото и вставьте как текст — удерживайте поле и выберите «Вставить»';
    pasteChoice.after(pasteHint);paste.setAttribute('aria-describedby',[paste.getAttribute('aria-describedby'),pasteHint.id].filter(Boolean).join(' '));
  }
  let compactCategory=null;
  function syncCompact(forceCategory=false){
    const chosen=rq.querySelector('[data-rq-category][aria-pressed=true]');
    const category=chosen?.dataset.rqCategory||'';
    const changed=category!==compactCategory;
    const count=upload.querySelector('.rq-previews').childElementCount;
    const work=!rq.querySelector('.rq-work').hidden;
    const label=rq.querySelector('[data-rq-upload-label]').textContent;
    const countLabel=count?count+' фото':work?'выбран образ':'';
    if(referenceTitle.textContent!==label)referenceTitle.textContent=label;
    if(referenceCount.textContent!==countLabel)referenceCount.textContent=countLabel;
    rq.classList.toggle('rq-custom-draft',rq.querySelector('#rq-service').value==='');
    if(changed||forceCategory){
      const categories=rq.querySelector('.rq-categories');
      if(chosen&&categories.clientWidth)categories.scrollLeft=chosen.offsetLeft-(categories.clientWidth-chosen.clientWidth)/2;
    }
    for(const person of rq.querySelectorAll('.sb-person')){
      const title=[...person.querySelectorAll('strong,small')].map(e=>e.textContent.trim()).filter(Boolean).join(' · ');
      if(person.title!==title)person.title=title;
    }
    compactCategory=category;
  }
  const compactObserver=new MutationObserver(()=>syncCompact());
  compactObserver.observe(mount,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','aria-pressed','aria-invalid']});
  referenceDetails.addEventListener('dragover',e=>{if(Array.from(e.dataTransfer?.types||[]).includes('Files'))e.preventDefault();});
  referenceDetails.addEventListener('drop',e=>{
    if(!paste||paste.contains(e.target)||!e.dataTransfer?.files?.length)return;
    e.preventDefault();e.stopPropagation();
    paste.dispatchEvent(new DragEvent('drop',{bubbles:false,cancelable:true,dataTransfer:e.dataTransfer}));
  });
  form.addEventListener('reset',()=>queueMicrotask(()=>{compactCategory=null;syncCompact(true)}));
  syncCompact();
  // Deliberate choices advance only this dialog; typing never scrolls or moves focus.
  let progressTimer=0,timeIntent=0,uploadIntent=0,manualUntil=0;
  const find=selector=>mount.querySelector(selector);
  const cancelProgress=()=>{clearTimeout(progressTimer);progressTimer=0;};
  function cancelIntentProgress(){cancelProgress();timeIntent=0;uploadIntent=0;}
  function interruptProgress(){cancelIntentProgress();manualUntil=performance.now()+450;}
  const visibleBlock=element=>Boolean(element&&!element.hidden&&element.getClientRects().length);
  function detailBlock(){return ['[data-rq-tattoo]','[data-rq-color]','[data-rq-nails]','[data-rq-upload]'].map(find).find(visibleBlock)||find('.rq-contact-column');}
  function progress(resolve,delay=110,source=null){
    cancelProgress();if(performance.now()<manualUntil)return;
    progressTimer=setTimeout(()=>{
      progressTimer=0;
      if(!dialog.open||dialog.dataset.dialogMotionState==='closing'||document.hidden)return;
      const active=document.activeElement;
      if([...document.querySelectorAll('dialog[open]')].some(d=>d!==dialog))return;
      if(source&&active!==source&&active?.matches('input,select,textarea,[contenteditable=true]'))return;
      const target=typeof resolve==='function'?resolve():resolve;if(!visibleBlock(target))return;
      const box=scroll.getBoundingClientRect(),rect=target.getBoundingClientRect();
      if(rect.top>=box.top+12&&rect.top+Math.min(rect.height,170)<=box.bottom-20)return;
      const top=Math.max(0,Math.min(scroll.scrollHeight-scroll.clientHeight,scroll.scrollTop+rect.top-box.top-16));
      scroll.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    },delay);
  }
  mount.addEventListener('kultura:request-selection',event=>{timeIntent=0;uploadIntent=0;manualUntil=0;progress(()=>event.detail?.serviceId?find('.sb'):find('#rq-service')?.closest('.rq-field'),260);});
  form.addEventListener('change',event=>{if(event.target.id==='rq-service'){cancelIntentProgress();manualUntil=0;if(event.target.value!=='')progress(()=>find('.sb'),180,event.target);}});
  form.addEventListener('input',cancelIntentProgress);
  form.addEventListener('focusin',event=>{if(event.target.matches('input,select,textarea,[contenteditable=true]'))cancelIntentProgress();});
  form.addEventListener('click',event=>{
    if(event.target.closest('[data-rq-category]')){cancelIntentProgress();manualUntil=0;progress(()=>find('#rq-service')?.value!==''?find('.sb'):find('#rq-service')?.closest('.rq-field'),180);}
    else if(event.target.closest('.sb-person')){cancelIntentProgress();manualUntil=0;progress(()=>find('[data-sb-widget]')||find('[data-sb-content]'));}
  });
  document.addEventListener('click',event=>{if(event.target.closest('[data-widget-apply],.sb-slot'))timeIntent=performance.now();},true);
  form.addEventListener('change',event=>{if(event.target.id==='rq-files')uploadIntent=performance.now();},true);
  form.addEventListener('paste',event=>{if(event.clipboardData?.files?.length)uploadIntent=performance.now();},true);
  form.addEventListener('drop',event=>{if(event.dataTransfer?.files?.length)uploadIntent=performance.now();},true);
  form.addEventListener('blur',event=>{
    const input=event.target;if(!input.value?.trim())return;
    if(['rq-color','rq-nails'].includes(input.id))progress(()=>find('[data-rq-upload]'),110,input);
    else if(input.id==='rq-place'&&input.value.trim().length>=2)progress(()=>find('#rq-length')?.closest('.rq-field'),110,input);
    else if(input.id==='rq-length'&&input.checkValidity())progress(()=>find('[data-rq-upload]'),110,input);
    else if(input.id==='rq-name'&&input.value.trim().length>=2)progress(()=>find('#rq-phone')?.closest('.rq-field'),110,input);
    else if(input.id==='rq-phone'&&input.value.replace(/\D/g,'').length>=7&&!find('#rq-phone-error').textContent)progress(()=>find('#rq-comment')?.closest('.rq-field'),110,input);
    else if(input.id==='rq-comment')progress(()=>find('button[type=submit]'),110,input);
  },true);
  const flowObserver=new MutationObserver(changes=>{
    const note=find('.sb-selection');
    if(timeIntent&&performance.now()-timeIntent<2000&&note&&!note.hidden&&note.textContent.startsWith('Выбрано:')&&changes.some(r=>r.target===note||note.contains(r.target))){timeIntent=0;progress(detailBlock,260);}
    const previews=find('.rq-previews');
    if(uploadIntent&&performance.now()-uploadIntent<10000&&previews?.childElementCount&&changes.some(r=>r.target===previews||previews.contains(r.target))){uploadIntent=0;progress(()=>find('.rq-contact-column'),180);}
  });
  const timeNote=find('.sb-selection'),previews=find('.rq-previews');
  if(timeNote)flowObserver.observe(timeNote,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  if(previews)flowObserver.observe(previews,{subtree:true,childList:true});
  scroll.addEventListener('wheel',interruptProgress,{passive:true});scroll.addEventListener('touchstart',cancelProgress,{passive:true});scroll.addEventListener('touchmove',interruptProgress,{passive:true});
  form.addEventListener('reset',interruptProgress);
  dialog.addEventListener('close',interruptProgress);
  const close=dialog.querySelector('[data-dialog-close]');
  const submit=mount.querySelector('button[type="submit"]');
  submit.classList.add('rq-orbit');
  let origin=null,position=0,restore=null,visible=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function canRestoreFocus(el){return Boolean(el?.isConnected&&el.getClientRects().length&&(el.checkVisibility?el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}):getComputedStyle(el).visibility!=='hidden'));}
  function motion(){submit.classList.toggle('is-orbiting',dialog.open&&visible&&!document.hidden&&!reduced.matches);}
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting||false;motion();},{root:scroll,threshold:.4});observer.observe(submit);
  function open(value={}){
    if(dialog.open)return;
    origin=value.trigger||document.activeElement;position=window.scrollY;
    document.body.classList.remove('menu-open');
    const menu=document.querySelector('.menu-toggle');menu?.setAttribute('aria-expanded','false');
    const bodyWidth=document.body.getBoundingClientRect(),root=document.documentElement;
    restore={body:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,left:document.body.style.left,right:document.body.style.right,overflowX:document.body.style.overflowX,overflowY:document.body.style.overflowY},overflowY:root.style.overflowY};
    // Keep a classic scrollbar's existing space; body:has(dialog[open]) otherwise removes it.
    if(window.innerWidth-root.clientWidth>0)root.style.overflowY='scroll';
    document.body.style.position='fixed';document.body.style.top=-position+'px';document.body.style.width=bodyWidth.width+'px';document.body.style.left=bodyWidth.left+'px';document.body.style.right='auto';
    // Unlike hidden, clip does not make the locked body a new scroll container for sticky headers.
    document.body.style.overflowX='clip';document.body.style.overflowY='clip';
    dialog.showModal();scroll.scrollTop=0;syncCompact(true);
    rq.querySelector('h2').textContent=value.custom?'Ваш собственный образ':'Детали вашего визита';
    close.focus({preventScroll:true});motion();
  }
  dialog.addEventListener('close',()=>{
    motion();
    if(restore){Object.assign(document.body.style,restore.body);document.documentElement.style.overflowY=restore.overflowY;restore=null;window.scrollTo({top:position,behavior:'instant'});}
    const target=canRestoreFocus(origin)?origin:document.querySelector('.menu-toggle');
    if(canRestoreFocus(target))target.focus({preventScroll:true});origin=null;
  });
  close.onclick=()=>dialog.close();
  dialog.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const items=[...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[contenteditable=true]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length>0);
    const first=items[0],last=items[items.length-1];
    if(!first){e.preventDefault();close.focus({preventScroll:true});return;}
    if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();last.focus({preventScroll:true});}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus({preventScroll:true});}
  });
  document.addEventListener('click',e=>{const trigger=e.target.closest('a[href="#request"],[data-open-request]');if(!trigger)return;e.preventDefault();if(trigger.matches('[data-open-request]'))window.KulturaRequest.select({custom:true,trigger});else open({trigger});});
  document.addEventListener('visibilitychange',motion);reduced.addEventListener('change',motion);
  window.KulturaRequest.setPresentationAdapter({open});
  window.addEventListener('pagehide',()=>{cancelProgress();flowObserver.disconnect();observer.disconnect();compactObserver.disconnect();if(dialog.open)dialog.close();});
})();
