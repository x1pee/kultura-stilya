/* Studio-only presentation. The existing local draft stays in the same DOM. */
(() => {
  'use strict';
  const mount=document.querySelector('[data-request-presentation="dialog"]');
  if(!mount||!window.KulturaRequest?.setPresentationAdapter)return;
  const section=mount.closest('section');
  const dialog=document.createElement('dialog');dialog.id='studio-request-dialog';dialog.className='studio-request-dialog';dialog.setAttribute('aria-labelledby','studio-request-title');
  dialog.innerHTML='<header class="studio-request-header"><span id="studio-request-title">Ваш визит в Культуру Стиля</span><button type="button" data-dialog-close aria-label="Закрыть окно заявки">×</button></header><div class="studio-request-scroll"></div>';
  const scroll=dialog.querySelector('.studio-request-scroll');scroll.append(mount);document.body.append(dialog);
  section.innerHTML='<div class="studio-request-invite"><div><p class="eyebrow">Начнём с вашей идеи</p><h2>Есть свой <em>образ?</em></h2><p>Покажите референс и расскажите мастеру, что хотите изменить</p></div><button type="button" data-open-request>Обсудить мой образ <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></button></div>';
  const rq=mount.querySelector('.rq');
  rq.classList.add('rq-compact');
  rq.querySelector('h2').textContent='Детали вашего визита';
  rq.querySelector('.rq-intro').textContent='Выберите услугу, добавьте пожелания и фотографии. Черновик останется в этой вкладке';
  const form=rq.querySelector('form');
  const contactColumn=rq.querySelector('.rq-layout>.rq-col:nth-child(2)');
  contactColumn.classList.add('rq-contact-column');
  const contactHeading=document.createElement('h3');contactHeading.className='rq-contact-heading';contactHeading.textContent='Контакты';contactColumn.prepend(contactHeading);
  const bottom=form.querySelector('.rq-bottom');if(bottom)contactColumn.append(bottom);
  const uploadField=rq.querySelector('[data-rq-upload]');
  const upload=uploadField.querySelector('.rq-upload');
  const referenceDetails=document.createElement('details');referenceDetails.className='rq-reference-details';
  referenceDetails.innerHTML='<summary data-reference-toggle><span class="rq-reference-title">Фото и референсы</span><span class="rq-reference-count"></span><i aria-hidden="true">+</i></summary>';
  referenceDetails.append(upload);uploadField.append(referenceDetails);
  const referenceTitle=referenceDetails.querySelector('.rq-reference-title'),referenceCount=referenceDetails.querySelector('.rq-reference-count');
  const fileHint=rq.querySelector('#rq-files-hint');if(fileHint)fileHint.textContent='До 5 фото по 10 МБ · JPG, PNG, WebP, HEIC · только в этой вкладке';
  const paste=rq.querySelector('[data-reference-paste]');if(paste){
    paste.dataset.placeholder='Вставить фото';
    const pasteHint=document.createElement('small');pasteHint.id='studio-paste-hint';pasteHint.className='studio-paste-hint';pasteHint.textContent='Скопируйте фото и вставьте как текст — удерживайте поле и выберите «Вставить»';
    paste.after(pasteHint);paste.setAttribute('aria-describedby',[paste.getAttribute('aria-describedby'),pasteHint.id].filter(Boolean).join(' '));
  }
  let compactCategory=null;
  function syncCompact(forceCategory=false){
    const chosen=rq.querySelector('[data-rq-category][aria-pressed=true]');
    const category=chosen?.dataset.rqCategory||'';
    const changed=category!==compactCategory;
    const count=upload.querySelector('.rq-previews').childElementCount;
    const work=!rq.querySelector('.rq-work').hidden;
    const required=category==='tattoo';
    const label=rq.querySelector('[data-rq-upload-label]').textContent;
    const countLabel=count?count+' / 5':work?'выбран образ':required?'обязательно':'добавить фото';
    if(referenceTitle.textContent!==label)referenceTitle.textContent=label;
    if(referenceCount.textContent!==countLabel)referenceCount.textContent=countLabel;
    referenceDetails.dataset.required=String(required);
    if(required||count||work||rq.querySelector('#rq-files-error').textContent)referenceDetails.open=true;
    else if(changed)referenceDetails.open=false;
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
  referenceDetails.addEventListener('dragover',e=>{if(Array.from(e.dataTransfer?.types||[]).includes('Files')){e.preventDefault();referenceDetails.open=true;}});
  referenceDetails.addEventListener('drop',e=>{
    if(!paste||paste.contains(e.target)||!e.dataTransfer?.files?.length)return;
    e.preventDefault();e.stopPropagation();referenceDetails.open=true;
    paste.dispatchEvent(new DragEvent('drop',{bubbles:false,cancelable:true,dataTransfer:e.dataTransfer}));
  });
  form.addEventListener('reset',()=>queueMicrotask(()=>{referenceDetails.open=false;compactCategory=null;syncCompact(true)}));
  syncCompact();
  const close=dialog.querySelector('[data-dialog-close]');
  const submit=mount.querySelector('button[type="submit"]');
  submit.classList.add('rq-orbit');
  let origin=null,position=0,restore=null,visible=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function motion(){submit.classList.toggle('is-orbiting',dialog.open&&visible&&!document.hidden&&!reduced.matches);}
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting||false;motion();},{root:scroll,threshold:.4});observer.observe(submit);
  function open(value={}){
    if(dialog.open)return;
    origin=value.trigger||document.activeElement;position=window.scrollY;
    document.body.classList.remove('menu-open');
    const menu=document.querySelector('.menu-toggle');menu?.setAttribute('aria-expanded','false');
    restore={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width};
    document.body.style.position='fixed';document.body.style.top=-position+'px';document.body.style.width='100%';
    dialog.showModal();scroll.scrollTop=0;syncCompact(true);
    rq.querySelector('h2').textContent=value.custom?'Ваш собственный образ':'Детали вашего визита';
    close.focus({preventScroll:true});motion();
  }
  dialog.addEventListener('close',()=>{
    motion();
    if(restore){Object.assign(document.body.style,restore);restore=null;window.scrollTo({top:position,behavior:'instant'});}
    if(origin?.isConnected)origin.focus({preventScroll:true});origin=null;
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
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  document.addEventListener('click',e=>{const trigger=e.target.closest('a[href="#request"],[data-open-request]');if(!trigger)return;e.preventDefault();open({trigger});});
  document.addEventListener('visibilitychange',motion);reduced.addEventListener('change',motion);
  window.KulturaRequest.setPresentationAdapter({open});
  window.addEventListener('pagehide',()=>{observer.disconnect();compactObserver.disconnect();if(dialog.open)dialog.close();});
})();
