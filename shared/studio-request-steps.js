/* A compact direction summary keeps the next choice close, without delaying form state. */
(() => {
  'use strict';
  const dialog=document.getElementById('studio-request-dialog');
  const strip=dialog?.querySelector('.rq-categories');
  if(!strip)return;
  const choices=document.createElement('div'),inner=document.createElement('div');
  choices.className='studio-direction-choices';choices.id='studio-direction-choices';inner.className='studio-direction-inner';
  strip.before(choices);choices.append(inner);inner.append(strip);
  const summary=document.createElement('button');summary.type='button';summary.className='studio-direction-current';summary.hidden=true;
  summary.setAttribute('aria-controls',choices.id);
  const label=document.createElement('span'),icon=document.createElement('i');icon.setAttribute('aria-hidden','true');summary.append(label,icon);choices.before(summary);
  let expanded=false,category='';
  function sync(){
    const selected=strip.querySelector('[data-rq-category][aria-pressed=true]');
    const next=selected?.dataset.rqCategory||'';
    if(next!==category)expanded=false;
    category=next;summary.hidden=!category;
    if(selected)label.textContent=selected.textContent.trim();
    const collapsed=Boolean(category&&!expanded);
    if(collapsed&&strip.contains(document.activeElement))summary.focus({preventScroll:true});
    choices.classList.toggle('is-collapsed',collapsed);choices.inert=collapsed;
    summary.setAttribute('aria-expanded',String(!collapsed));
    summary.setAttribute('aria-label','Изменить направление: '+label.textContent);
  }
  summary.addEventListener('click',()=>{expanded=!expanded;sync();});
  strip.addEventListener('click',event=>{if(event.target.closest('[data-rq-category]')){expanded=false;sync();}});
  new MutationObserver(sync).observe(strip,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  dialog.addEventListener('kultura:request-selection',()=>{expanded=false;sync();});
  sync();
})();
