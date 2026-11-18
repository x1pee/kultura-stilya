/* Studio-only scheduling shell. No fabricated staff, availability or booking confirmation. */
(() => {
  'use strict';
  const root=document.querySelector('[data-request-root][data-booking-mode]');
  if(!root||!window.KulturaRequest?.registerBookingAdapter)return;
  const assetBase=new URL('../assets/',document.currentScript.src);
  const config=window.KulturaStudioBookingConfig||{mode:'disconnected'};
  const permittedLive=config.mode==='live'&&config.apiBase==='/api/booking';
  const embeddedViewer=!permittedLive&&window.KulturaStudioWidget?.available===true;
  const snapshot=window.KulturaStudioStaffData||{staff:[]};
  const panel=document.createElement('section');panel.className='sb';panel.setAttribute('aria-label','Мастер и время визита');
  panel.innerHTML='<div class="sb-heading"><h3>Мастер и время</h3><span class="sb-mode">YCLIENTS · не подключён</span></div><p class="sb-note" data-sb-intro>Здесь появятся сотрудники салона и их свободное время. Подключение расписания ещё не выполнено</p><div class="sb-staff" aria-label="Сотрудники салона"></div><p class="sb-note" data-sb-staff-note hidden>Состав команды из открытой записи салона. Доступность для выбранной услуги проверится после подключения</p><p class="sb-label">День визита</p><div class="sb-week" aria-label="Ближайшие семь дней"></div><div class="sb-day-label"><span data-sb-date></span><small>Время по Москве</small></div><div data-sb-content aria-live="polite"></div><p class="sb-selection" hidden></p>';
  root.querySelector('.rq-summary').after(panel);
  const dateInput=root.querySelector('#rq-date');dateInput.closest('.rq-field').hidden=true;dateInput.disabled=true;
  const q=s=>panel.querySelector(s);
  if(!permittedLive){q('.sb-week').hidden=true;q('.sb-label').hidden=true;q('.sb-day-label').hidden=true;}
  if(embeddedViewer)q('.sb-mode').textContent='YCLIENTS · просмотр';
  let service=null,serviceId=null,staffId=null,day=null,slot=null,availability=null,sequence=0,controller=null,categoryStaffIds=[],widgetPreference=null,categoryId=null,timeDraft=null;
  const categoryDrafts=new Map();
  const format=(date,options)=>new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',...options}).format(date);
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const isoDate=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(today()+'T12:00:00+03:00');d.setUTCDate(d.getUTCDate()+i);return {date:isoDate(d),value:d};});
  function empty(title,text){const box=document.createElement('div');box.className='sb-empty';const strong=document.createElement('strong');strong.textContent=title;box.append(strong,document.createTextNode(text));q('[data-sb-content]').replaceChildren(box);}
  function savedTime(value){return value?{datetime:value.datetime,timeLabel:value.timeLabel||value.time}:null;}
  function paintTimeDraft(){if(!timeDraft)return;const note=q('.sb-selection');note.hidden=false;note.textContent='Пожелание: '+format(new Date(timeDraft.datetime),{day:'numeric',month:'long'})+', '+timeDraft.timeLabel+' · доступность нужно проверить заново · время не забронировано';}
  function expireWidgetPreference(){if(!widgetPreference)return false;const now=Date.now(),seen=Date.parse(widgetPreference.verifiedAt),when=Date.parse(widgetPreference.datetime);if(Number.isFinite(seen)&&seen<=now+30000&&now-seen<=120000&&Number.isFinite(when)&&when>now)return false;timeDraft=savedTime(widgetPreference);widgetPreference=null;paintTimeDraft();return true;}
  function saveCategoryDraft(){if(categoryId!==null)categoryDrafts.set(categoryId,{serviceId,staffId,day,time:savedTime(widgetPreference||timeDraft||slot)});}
  function eligibleStaff(){const ids=service?.bookingStaffIds||categoryStaffIds;return snapshot.staff.filter(p=>ids.includes(Number(p.id)));}
  function renderStaff(staff,snapshotOnly=false){
    const box=q('.sb-staff');box.replaceChildren();q('[data-sb-staff-note]').hidden=!snapshotOnly||!staff.length;
    for(const person of staff){if(!person.id||!person.name)continue;
      const button=document.createElement('button');button.type='button';button.className='sb-person';button.dataset.staffId=String(person.id);button.setAttribute('aria-pressed',String(staffId===String(person.id)));
      const initials=document.createElement('span');initials.className='sb-initials';initials.setAttribute('aria-hidden','true');initials.textContent=person.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('');
      let portrait=initials;
      if(typeof person.photoFile==='string'&&/^studio-staff-\d+\.(jpg|png|webp)$/.test(person.photoFile)){
        portrait=document.createElement('img');portrait.src=new URL(person.photoFile,assetBase).href;portrait.alt=person.name+' — сотрудник салона';portrait.loading='lazy';portrait.width=120;portrait.height=140;portrait.onerror=()=>portrait.replaceWith(initials);
      }
      const text=document.createElement('span');const name=document.createElement('strong');name.textContent=person.name;const role=document.createElement('small');role.textContent=person.specialization||'';text.append(name,role);button.append(portrait,text);
      const option=service?.staffOptions?.find(o=>String(o.staffId)===String(person.id));
      if(option?.durationSeconds){const duration=document.createElement('small');duration.textContent=(option.durationSeconds/60)+' мин';text.append(duration);}
      button.onclick=()=>{staffId=String(person.id);slot=null;widgetPreference=null;timeDraft=null;for(const b of box.children)b.setAttribute('aria-pressed',String(b===button));if(option?.durationSeconds)root.querySelector('[data-rq-description]').textContent=(option.durationSeconds/60)+' мин · '+person.name;load();};box.append(button);
    }
  }
  function renderDays(){const box=q('.sb-week');box.replaceChildren();for(const [index,item]of days.entries()){
    const b=document.createElement('button');b.type='button';b.className='sb-day';b.dataset.date=item.date;b.setAttribute('aria-pressed',String(day===item.date));b.setAttribute('aria-label',format(item.value,{weekday:'long',day:'numeric',month:'long'}));
    const label=document.createElement('small');label.textContent=index===0?'Сегодня':index===1?'Завтра':format(item.value,{weekday:'short'});const num=document.createElement('strong');num.textContent=format(item.value,{day:'numeric'});b.append(label,num);
    b.onclick=()=>{day=item.date;slot=null;timeDraft=null;renderDays();load();};box.append(b);
  }}
  function renderSlots(items){
    if(!items.length){empty('Нет свободного времени','Для этой услуги и мастера на выбранный день YCLIENTS не вернул доступных окон. Выберите другой день');return;}
    const box=document.createElement('div');box.className='sb-slots';
    for(const item of items){if(!item.datetime||!item.time)continue;const b=document.createElement('button');b.type='button';b.className='sb-slot';b.textContent=item.time;b.setAttribute('aria-pressed',String(slot?.datetime===item.datetime));
      b.onclick=()=>{slot=item;timeDraft=null;for(const other of box.children)other.setAttribute('aria-pressed',String(other===b));const note=q('.sb-selection');note.hidden=false;note.textContent='Выбрано: '+format(new Date(day+'T12:00:00+03:00'),{day:'numeric',month:'long'})+', '+item.time;};box.append(b);
    }q('[data-sb-content]').replaceChildren(box);
  }
  async function load(){
    const mine=++sequence,pickedServiceId=serviceId,pickedCategory=categoryId;controller?.abort();slot=null;q('.sb-selection').hidden=true;paintTimeDraft();
    q('[data-sb-date]').textContent=format(new Date(day+'T12:00:00+03:00'),{weekday:'long',day:'numeric',month:'long'});
    if(!service){empty('Выберите услугу для записи','После выбора услуги здесь появятся её мастера и переход к свободному времени. Референсы можно добавить независимо от выбора услуги');return;}
    if(embeddedViewer){
      const box=document.createElement('div');box.className='sb-widget-choice';
      const button=document.createElement('button');button.type='button';button.className='rq-primary';button.dataset.sbWidget='';button.textContent='Выбрать день и время';
      if(timeDraft)button.textContent='Изменить пожелание по времени';
      button.onclick=()=>window.KulturaStudioWidget.open({serviceId:service.providerId,staffId,trigger:button,onPick(value){
        if(mine!==sequence||pickedServiceId!==serviceId||pickedCategory!==categoryId||Number(value.serviceId)!==Number(service?.providerId))return;
        widgetPreference=value;timeDraft=null;if(value.staffId){staffId=String(value.staffId);renderStaff(eligibleStaff(),true);const person=eligibleStaff().find(p=>String(p.id)===staffId),option=service?.staffOptions?.find(o=>String(o.staffId)===staffId);if(person&&option?.durationSeconds)root.querySelector('[data-rq-description]').textContent=(option.durationSeconds/60)+' мин · '+person.name;}
        const label=q('.sb-selection');label.hidden=false;label.textContent='Выбрано: '+format(new Date(value.datetime),{weekday:'short',day:'numeric',month:'long'})+', '+value.timeLabel+' · время не забронировано';button.textContent='Изменить день и время';
      }});
      const note=document.createElement('p');note.className='sb-note';note.textContent='Откроется живое расписание салона внутри сайта. В демо можно выбрать время, но запись не отправляется';
      box.append(button,note);q('[data-sb-content]').replaceChildren(box);return;
    }
    if(!permittedLive){empty('Расписание пока не подключено','Дни можно просмотреть, но свободные часы и смены мастеров появятся только из YCLIENTS. Сейчас можно подготовить пожелания и референсы ниже');return;}
    controller=new AbortController();panel.setAttribute('aria-busy','true');empty('Получаем расписание','Проверяем доступность выбранной услуги и мастера');
    try{
      const url=new URL('/api/booking/availability',location.origin);url.searchParams.set('serviceIds',serviceId);url.searchParams.set('date',day);if(staffId)url.searchParams.set('staffId',staffId);
      const response=await fetch(url,{signal:controller.signal,cache:'no-store',credentials:'same-origin'});if(!response.ok)throw new Error('unavailable');const result=await response.json();
      if(mine!==sequence)return;
      const verified=Date.parse(result.verifiedAt),expires=Date.parse(result.expiresAt),now=Date.now();
      const allowedStaff=new Set(eligibleStaff().map(p=>String(p.id)));
      const activeFlag=value=>value==null||value===false||value===0||value==='0';
      if(result.mode!=='live'||result.source!=='yclients'||Number(result.companyId)!==Number(snapshot.companyId)||result.date!==day||!Array.isArray(result.slots)||!Array.isArray(result.staff)||!Array.isArray(result.services)||!result.services.some(s=>String(s.id)===serviceId&&Number(s.providerId)===Number(service.providerId))||result.staff.some(p=>!allowedStaff.has(String(p.id))||p.bookable!==true||!activeFlag(p.hidden)||!activeFlag(p.fired))||!Number.isFinite(verified)||!Number.isFinite(expires)||verified>now+30000||expires<=now||expires<=verified||expires-verified>120000)throw new Error('unverified');
      if(staffId&&!result.staff.some(p=>String(p.id)===staffId))throw new Error('staff-unavailable');
      if(result.slots.some(s=>!(typeof s.datetime==='string'||(typeof s.datetime==='number'&&Number.isFinite(s.datetime)))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)||!Number.isFinite(s.durationSeconds)||s.durationSeconds<=0))throw new Error('invalid-slots');
      availability=result;q('.sb-mode').textContent='YCLIENTS · расписание';q('[data-sb-intro]').textContent='Выберите мастера и актуальное время для этой услуги';renderStaff(result.staff);renderSlots(result.slots);
    }catch(e){if(e.name==='AbortError')return;if(mine===sequence){availability=null;empty('Расписание недоступно','Не удалось получить актуальные данные салона. Попробуйте выбрать день ещё раз');}}
    finally{if(mine===sequence)panel.removeAttribute('aria-busy');}
  }
  day=days[0].date;renderDays();
  if(snapshot.staff.length){q('[data-sb-intro]').textContent='Выберите мастера для вашего визита. Актуальные свободные окна появятся после подключения расписания салона';q('[data-sb-staff-note]').textContent='Сотрудники и длительность — из открытой онлайн-записи салона. Время визита ещё не забронировано';}
  if(embeddedViewer)q('[data-sb-intro]').textContent='Выберите мастера или перейдите к расписанию. Актуальные дни и часы откроются в защищённом окне YCLIENTS';
  window.KulturaRequest.registerBookingAdapter({
    onServiceChange(value){const next=value.service?.canonicalId||'intent:'+value.category;if(next===serviceId&&value.category===categoryId)return;const changedCategory=value.category!==categoryId;if(changedCategory)saveCategoryDraft();service=value.service;serviceId=next;categoryId=value.category;categoryStaffIds=[...new Set((value.categoryServices||[]).flatMap(s=>s.bookingStaffIds||[]).map(Number))];const draft=changedCategory?categoryDrafts.get(categoryId):null;staffId=draft?.serviceId===serviceId&&eligibleStaff().some(p=>String(p.id)===draft.staffId)?draft.staffId:null;day=draft?.serviceId===serviceId?draft.day:days[0].date;timeDraft=draft?.serviceId===serviceId?draft.time:null;slot=null;availability=null;widgetPreference=null;renderDays();q('[data-sb-intro]').hidden=!service;if(!permittedLive)renderStaff(service?eligibleStaff():[],true);load();},
    validate(){if(embeddedViewer)expireWidgetPreference();if(permittedLive&&service){if(availability&&Date.parse(availability.expiresAt)<=Date.now()){availability=null;slot=null;load();return {error:'Расписание обновляется. Выберите свободное время ещё раз',focus:q('.sb-day[aria-pressed=true]')};}if(!availability||!slot)return {error:'Выберите доступное время из расписания салона',focus:q('.sb-day[aria-pressed=true]')};}return null;},
    extendDetails(details){expireWidgetPreference();const person=(availability?.staff||snapshot.staff||[]).find(x=>String(x.id)===staffId);if(person){details.push(['Предпочтение по мастеру',person.name+(person.specialization?' · '+person.specialization:'')]);const option=service?.staffOptions?.find(o=>String(o.staffId)===staffId);if(option?.durationSeconds)details.push(['Длительность',(option.durationSeconds/60)+' мин']);}if(widgetPreference)details.push(['Пожелание по времени',format(new Date(widgetPreference.datetime),{day:'numeric',month:'long'})+', '+widgetPreference.timeLabel+' · не забронировано']);else if(timeDraft)details.push(['Пожелание по времени',format(new Date(timeDraft.datetime),{day:'numeric',month:'long'})+', '+timeDraft.timeLabel+' · доступность нужно проверить заново · не забронировано']);else if(slot)details.push(['Время',format(new Date(day+'T12:00:00+03:00'),{day:'numeric',month:'long'})+', '+slot.time]);else details.push(['Расписание',embeddedViewer?'Доступен просмотр YCLIENTS. Время не забронировано':'YCLIENTS ещё не подключён. Время не забронировано']);},
    decorateReview(dialog){dialog.querySelector('h2').textContent='Пожелания к вашему визиту';dialog.querySelector('.rq-status').textContent='Демо: пожелания подготовлены. Заявка не отправлена, время не забронировано';},
    reset(){controller?.abort();sequence++;categoryDrafts.clear();categoryId=null;staffId=null;slot=null;availability=null;widgetPreference=null;timeDraft=null;day=days[0].date;renderDays();if(!permittedLive)renderStaff([],false);q('[data-sb-intro]').hidden=true;q('.sb-selection').hidden=true;serviceId=null;service=null;}
  });
  window.addEventListener('pagehide',()=>{controller?.abort();sequence++;categoryDrafts.clear();staffId=null;slot=null;availability=null;widgetPreference=null;timeDraft=null;});
})();
