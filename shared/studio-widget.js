/* Isolated official UI: public availability only. No contacts or appointment writes. */
(() => {
 'use strict';
 const viewer=new URL('https://n918035.serferpokiskam.chatgpt.site');
 const parents=new Set(['https://kultura-stilya-three-directions-20261116.serferpokiskam.chatgpt.site','https://x1pee.github.io']);
 const publicBooking=new URL('https://n918035.yclients.ru/');
 const catalog=(window.KulturaRequestData?.categories||[]).flatMap(c=>c.services);
 const services=new Set(catalog.map(s=>Number(s.providerId)));
 const staff=new Set((window.KulturaStudioStaffData?.staff||[]).map(s=>Number(s.id)));
 let dialog=null,frame=null,timer=null,status=null,selected=null,opener=null,active=null,selectionPanel=null;
 function close(){if(dialog?.open)dialog.close();}
 function unavailable(){
  if(!dialog?.open)return;
  clearTimeout(timer);frame?.remove();frame=null;selected=null;selectionPanel.hidden=true;status.hidden=true;
  const content=document.createElement('section');content.setAttribute('role','status');content.style.cssText='display:grid;align-content:center;justify-items:start;gap:16px;max-width:540px;margin:0 auto;height:100%;padding:28px;box-sizing:border-box';
  const title=document.createElement('strong');title.textContent='Не удалось открыть расписание внутри сайта';
  const text=document.createElement('p');text.textContent='Можно открыть публичную форму салона в отдельной вкладке. Данные заявки и фотографии туда не передаются; время здесь не выбрано.';
  const link=document.createElement('a');link.href=publicBooking.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Открыть YCLIENTS';link.style.cssText='color:inherit;text-decoration:underline;text-underline-offset:4px;padding:12px 0';
  content.append(title,text,link);dialog.querySelector('.studio-widget-frame').replaceChildren(content);
 }
 function open({serviceId,staffId,trigger,onPick}={}){
  if(!services.has(Number(serviceId)))return;
  clearTimeout(timer);frame?.remove();frame=null;
  if(!dialog){
   dialog=document.createElement('dialog');dialog.className='studio-widget-dialog';dialog.setAttribute('aria-label','Актуальное расписание YCLIENTS');
   dialog.innerHTML='<header><div><strong>Выберите день и время</strong><small>Демо-просмотр YCLIENTS · подтверждение и часть функций отключены</small></div><button type="button" aria-label="Закрыть расписание">×</button></header><p class="studio-widget-status" role="status"></p><div class="studio-widget-frame"></div><footer class="studio-widget-selection" hidden><p><strong data-widget-picked></strong><small>Время не забронировано</small></p><button type="button" data-widget-apply>Сохранить выбор</button></footer>';
   dialog.querySelector('button').onclick=close;
   dialog.addEventListener('close',()=>{clearTimeout(timer);frame?.remove();frame=null;selected=null;active=null;selectionPanel.hidden=true;if(opener?.isConnected)opener.focus({preventScroll:true});});
   dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
   document.body.append(dialog);status=dialog.querySelector('[role=status]');selectionPanel=dialog.querySelector('.studio-widget-selection');
   dialog.querySelector('[data-widget-apply]').onclick=()=>{if(!selected||Date.now()-Date.parse(selected.verifiedAt)>120000){selectionPanel.hidden=true;selected=null;status.hidden=false;status.textContent='Расписание изменяется. Выберите время ещё раз';return;}const preference=selected;const callback=active?.onPick;close();if(typeof callback==='function')callback(preference);};
  }
  opener=trigger||document.activeElement;
  active={serviceId:Number(serviceId),staffId:staffId?Number(staffId):null,onPick};selected=null;selectionPanel.hidden=true;
  const path=new URL('/company/854459/personal/menu',viewer);
  if(location.origin==='https://x1pee.github.io')path.searchParams.set('parent',location.origin);
  path.searchParams.set('o',(staff.has(Number(staffId))?'m'+Number(staffId):'')+'s'+Number(serviceId));
  if(parents.has(location.origin))path.searchParams.set('parent',location.origin);
  if(!parents.has(location.origin)){dialog.querySelector('.studio-widget-frame').replaceChildren();dialog.showModal();unavailable();return;}
  frame=document.createElement('iframe');frame.title='Свободные дни и время в Культуре Стиля';frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.referrerPolicy='no-referrer';frame.src=path.href;
  frame.setAttribute('allow','camera \'none\'; microphone \'none\'; geolocation \'none\'; payment \'none\'');
  dialog.querySelector('.studio-widget-frame').replaceChildren(frame);status.hidden=false;status.textContent='Загружаем расписание салона…';dialog.showModal();dialog.querySelector('button').focus({preventScroll:true});
  frame.addEventListener('error',event=>{if(event.currentTarget===frame)unavailable();},{once:true});
  timer=setTimeout(unavailable,20000);
 }
 addEventListener('message',event=>{
  if(!frame||event.origin!==viewer.origin||event.source!==frame.contentWindow)return;
  const value=event.data;if(!value||typeof value!=='object')return;
  const validViewer=value.readOnly===true&&value.companyId===854459&&value.formId===918035;
  // The guard's initial ready signal does not prove that the official app rendered.
  if(value.type==='kultura-widget:ready'&&validViewer&&value.phase==='interactive'){clearTimeout(timer);status.hidden=true;}
  if(value.type==='kultura-widget:error'&&validViewer&&['bootstrap','availability','timeout'].includes(value.code)){unavailable();return;}
  if(value.type==='kultura-widget:selection'){
   selected=null;selectionPanel.hidden=true;
   const seen=Date.parse(value.verifiedAt),when=Date.parse(value.datetime),now=Date.now();
   if(value.companyId!==854459||value.source!=='yclients'||value.readOnly!==true||Number(value.serviceId)!==active?.serviceId||typeof value.datetime!=='string'||value.datetime.length>40||!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(value.datetime)||!Number.isFinite(when)||!Number.isFinite(seen)||seen>now+30000||now-seen>120000||when<=now||value.dateISO!==value.datetime.slice(0,10)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.timeLabel))return;
   const calendarDate=new Date(value.dateISO+'T00:00:00Z');if(!Number.isFinite(calendarDate.valueOf())||calendarDate.toISOString().slice(0,10)!==value.dateISO)return;
   const officialTime=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(new Date(when));if(officialTime!==value.timeLabel)return;
   const person=Number(value.staffId),knownService=catalog.find(s=>Number(s.providerId)===active.serviceId);
   if(active.staffId&&person!==active.staffId)return;
   if(value.staffId!=null&&(!staff.has(person)||!knownService?.bookingStaffIds?.includes(person)))return;
   selected={serviceId:active.serviceId,staffId:value.staffId!=null?person:null,datetime:value.datetime,dateISO:value.dateISO,timeLabel:value.timeLabel,verifiedAt:value.verifiedAt,source:'yclients'};
   const label=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',weekday:'short',day:'numeric',month:'long'}).format(new Date(when));
   dialog.querySelector('[data-widget-picked]').textContent=label+' · '+value.timeLabel;selectionPanel.hidden=false;
  }
 });
 // Availability stays read-only; a failed embed offers the original public form explicitly.
 window.KulturaStudioWidget={available:true,open};
 addEventListener('pagehide',close);
})();
