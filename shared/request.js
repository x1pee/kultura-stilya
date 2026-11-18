/* Local-only interactive concept. No request/contact/file data leaves this tab. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript.src;
  const base = new URL('.', scriptUrl);
  const data = window.KulturaRequestData;
  const mount = document.querySelector('[data-request-root]');
  if (!data || !mount) return;
  const freeTattooPlace = Boolean(mount.dataset.bookingMode);
  let workPresets=[];
  if(freeTattooPlace){try{const p=JSON.parse(document.getElementById('studio-work-presets')?.textContent||'null');if(p?.version===1&&Array.isArray(p.presets))workPresets=p.presets;}catch{}}
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const photoUrl = name => new URL('../assets/' + name, base).href;
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
  let pendingSelection = null;
  window.KulturaRequest = {select: value => { pendingSelection = value; }};
  mount.innerHTML = `<div class="rq"><p class="rq-eyebrow">От идеи к вашему образу</p><h2>Расскажите, что вам нравится</h2><p class="rq-intro">Выберите услугу и добавьте пожелания. Для окрашивания, маникюра и тату можно приложить фотографии — так проще показать задумку мастеру</p><form novalidate aria-label="Демонстрационная заявка в салон"><div class="rq-layout"><div class="rq-col"><fieldset><legend>Что планируете?</legend><div class="rq-categories">${data.categories.map(c => `<button type="button" class="rq-cat" data-rq-category="${esc(c.id)}" aria-pressed="false">${esc(c.title)}</button>`).join('')}</div><div class="rq-field"><label for="rq-service">Услуга</label><select id="rq-service" required aria-describedby="rq-service-error"></select><p class="rq-error" id="rq-service-error"></p></div></fieldset><div class="rq-summary" aria-live="polite"><h3 data-rq-title></h3><p class="rq-price" data-rq-price></p><p class="rq-small" data-rq-description></p><div class="rq-work" hidden><img alt="Выбранный пример работы салона" width="76" height="84"><div><p data-rq-work-label></p><button class="rq-textbtn" type="button" data-rq-clear-work>Убрать пример</button></div></div></div><div data-rq-tattoo hidden><div class="rq-field"><label for="rq-place">Место нанесения *</label><select id="rq-place" disabled aria-describedby="rq-place-error"><option value="">Выберите зону</option>${['Рука','Нога','Спина','Грудь','Плечо','Другая зона'].map(x=>`<option>${x}</option>`).join('')}</select><p class="rq-error" id="rq-place-error"></p></div><div class="rq-field" data-rq-other hidden><label for="rq-other">Уточните место *</label><input id="rq-other" maxlength="100" disabled aria-describedby="rq-other-error"><p class="rq-error" id="rq-other-error"></p></div><div class="rq-pair"><div class="rq-field"><label for="rq-length">Примерная длина, см *</label><input id="rq-length" type="number" min="1" max="100" step="0.5" inputmode="decimal" placeholder="Например, 10" disabled aria-describedby="rq-length-error"><p class="rq-error" id="rq-length-error"></p></div><div class="rq-field"><label for="rq-width">Ширина, см <span class="rq-small">если знаете</span></label><input id="rq-width" type="number" min="1" max="100" step="0.5" inputmode="decimal" placeholder="Например, 5" disabled aria-describedby="rq-width-error"><p class="rq-error" id="rq-width-error"></p></div></div><p class="rq-small">Размер поможет обсудить идею. Итоговую стоимость и длительность согласует мастер</p></div><div class="rq-field" data-rq-color hidden><label for="rq-color">Какой результат хотите?</label><textarea id="rq-color" disabled maxlength="800" placeholder="Текущий цвет и желаемый результат"></textarea></div><div class="rq-field" data-rq-nails hidden><label for="rq-nails">Пожелания к маникюру</label><textarea id="rq-nails" disabled maxlength="800" placeholder="Например, форма, длина или детали дизайна"></textarea></div><div class="rq-field" data-rq-upload hidden><div class="rq-upload"><label for="rq-files" data-rq-upload-label>Фотографии и референсы</label><p class="rq-small" data-rq-upload-hint></p><input id="rq-files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" disabled aria-describedby="rq-files-hint rq-files-error"><p class="rq-small" id="rq-files-hint">До 5 фото, каждое до 10 МБ · JPG, PNG, WebP, HEIC<br>В демо фотографии остаются только в этой вкладке</p><p class="rq-error" id="rq-files-error" role="status"></p><div class="rq-previews" aria-label="Выбранные фотографии"></div></div></div></div><div class="rq-col"><div class="rq-field"><label for="rq-name">Ваше имя *</label><input id="rq-name" type="text" autocomplete="given-name" maxlength="80" placeholder="Как к вам обращаться" required aria-describedby="rq-name-error"><p class="rq-error" id="rq-name-error"></p></div><div class="rq-field"><label for="rq-phone">Номер телефона *</label><input id="rq-phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="+7 900 000-00-00" required aria-describedby="rq-phone-error rq-phone-hint"><p class="rq-small" id="rq-phone-hint">Поддерживаются и другие коды стран</p><p class="rq-error" id="rq-phone-error"></p></div><div class="rq-field"><label for="rq-date">Желаемая дата <span class="rq-small">необязательно</span></label><input id="rq-date" type="date" aria-describedby="rq-date-hint rq-date-error"><p class="rq-small" id="rq-date-hint">Это пожелание. Свободное время пока не подключено</p><p class="rq-error" id="rq-date-error"></p></div><div class="rq-field"><label for="rq-comment">Что ещё учесть?</label><textarea id="rq-comment" maxlength="1200" placeholder="Ваши пожелания или вопрос мастеру"></textarea></div><fieldset data-rq-checks hidden><legend>Перед татуировкой</legend><label class="rq-check"><input id="rq-age" type="checkbox" disabled aria-describedby="rq-age-error"><span>Мне исполнилось 18 лет *</span></label><p class="rq-error" id="rq-age-error"></p><label class="rq-check"><input id="rq-read" type="checkbox" disabled aria-describedby="rq-read-error"><span>Я прочитал(а) <button class="rq-textbtn" type="button" data-rq-preparation>памятку и противопоказания перед татуировкой</button> *</span></label><p class="rq-error" id="rq-read-error"></p></fieldset><p class="rq-error" id="rq-general-error" role="alert" tabindex="-1"></p><button class="rq-primary" type="submit">Проверить заявку ${arrow}</button><p class="rq-small rq-actionnote">Демонстрация: данные и фото никуда не отправляются. Настоящая запись не создаётся</p></div></div><div class="rq-bottom"><p class="rq-small">Для рабочего сайта подключим запись к расписанию салона</p><button class="rq-textbtn" type="reset">Очистить заявку</button></div></form></div>`;
  const form = mount.querySelector('form');
  if(freeTattooPlace){
    const previous=mount.querySelector('#rq-place');
    const input=document.createElement('input');input.id='rq-place';input.type='text';input.maxLength=120;input.disabled=true;input.autocomplete='off';input.placeholder='Например, левое предплечье или ключица';input.setAttribute('aria-describedby','rq-place-error');
    previous.replaceWith(input);
  }
  const q = selector => mount.querySelector(selector);
  const field = id => q('#rq-' + id);
  const service = field('service');
  const neutralSelection=mount.dataset.neutralSelection==='true';
  const neutralCategory={id:'',title:'Свой образ',services:[]};
  let category = neutralSelection?neutralCategory:data.categories[0];
  let selectedWork = null;
  let selectedPreset = null;
  const presetHint=freeTattooPlace?document.createElement('p'):null;
  if(presetHint){presetHint.className='rq-small rq-preset-note';presetHint.dataset.rqPresetNote='';presetHint.hidden=true;q('.rq-summary').append(presetHint);}
  function paintPreset(){if(presetHint){presetHint.hidden=!selectedPreset;presetHint.textContent=selectedPreset?.note||'';}}
  let files = [];
  const decodingUrls = new Set();
  let fileBusy = false;
  let fileEpoch = 0;
  let phone = null;
  let bookingAdapter = null;
  let presentationAdapter = null;
  let customIntent = false;
  const categoryDrafts = new Map();
  const draftFields = ['place','other','length','width','color','nails','date','comment'];
  let draftResetPending = false;
  function saveCategoryDraft() {
    const draft=categoryDrafts.get(category.id)||{pendingBatches:0};
    Object.assign(draft,{serviceId:service.value===''?null:category.services[Number(service.value)]?.canonicalId,customIntent,selectedWork,selectedPreset,files,consentMode,
      values:Object.fromEntries(draftFields.map(id=>[id,field(id).value])),age:field('age').checked,read:field('read').checked});
    categoryDrafts.set(category.id,draft);return draft;
  }
  let lastDialogFocus = null;
  const dialogs = [];
  function makeDialog(title) {
    const d = document.createElement('dialog');
    d.className = 'rq-dialog';
    d.setAttribute('aria-label', title);
    d.innerHTML = '<button type="button" class="rq-close" aria-label="Закрыть">×</button><div class="rq-dialog-content"></div>';
    d.querySelector('.rq-close').onclick = () => d.close();
    d.addEventListener('click', e => { if (e.target === d) { const r=d.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close(); }});
    d.addEventListener('close', () => lastDialogFocus?.focus({preventScroll:true}));
    document.body.append(d); dialogs.push(d); return d;
  }
  const preparation = makeDialog('Памятка перед татуировкой');
  const prep = data.preparation;
  preparation.querySelector('.rq-dialog-content').innerHTML = `<p class="rq-eyebrow">Перед визитом</p><h2>${esc(prep.title)}</h2><p>${esc(prep.intro)}</p><ul>${prep.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="rq-small">${esc(prep.footnote)} Это информационная памятка для демонстрации; перед запуском её согласует салон</p><p class="rq-small">Подробнее: <a href="${esc(prep.sources[0].url)}" target="_blank" rel="noopener">FDA о безопасности тату</a>, <a href="${esc(prep.sources[1].url)}" target="_blank" rel="noopener">рекомендации дерматологов AAD</a></p><button class="rq-primary" type="button" data-rq-understood>Понятно ${arrow}</button>`;
  preparation.querySelector('[data-rq-understood]').onclick = () => preparation.close();
  const originalPreparation = preparation.querySelector('.rq-dialog-content').innerHTML;
  let consentMode = '';
  function temporaryTattoo(serviceEntry) {
    if (!freeTattooPlace || category.id !== 'tattoo') return '';
    if (serviceEntry?.canonicalId === 'tattoo:4') return 'jagua';
    if (serviceEntry?.canonicalId === 'tattoo:5') return 'henna';
    return '';
  }
  function updateTattooConsent(serviceEntry) {
    if (!freeTattooPlace) return;
    const technique = temporaryTattoo(serviceEntry);
    const mode = category.id === 'tattoo' ? technique || 'tattoo' : '';
    if (mode !== consentMode) { field('age').checked = false; field('read').checked = false; }
    consentMode = mode;
    const ageNeeded = Boolean(mode && !technique);
    field('age').closest('label').hidden = !ageNeeded;
    field('age').disabled = !ageNeeded;
    field('age').required = ageNeeded;
    field('age-error').hidden = !ageNeeded;
    field('read').required = Boolean(mode);
    if (!mode) return;
    const checks = q('[data-rq-checks]');
    checks.querySelector('legend').textContent = technique ? 'Перед временным рисунком' : 'Перед татуировкой';
    field('read').nextElementSibling.innerHTML = 'Я прочитал(а) <button class="rq-textbtn" type="button" data-rq-preparation>' + (technique ? 'памятку о временном рисунке и возможной аллергии' : 'памятку перед татуировкой') + '</button> и до процедуры сообщу мастеру об известных аллергиях и противопоказаниях <span class="rq-required-mark">*</span>';
    let allergyNote = checks.querySelector('[data-rq-allergy-note]');
    if (!allergyNote) { allergyNote = document.createElement('p'); allergyNote.className = 'rq-small'; allergyNote.dataset.rqAllergyNote = ''; checks.querySelector('legend').after(allergyNote); }
    allergyNote.textContent = 'В том числе об аллергии на апельсин и другие цитрусовые, красители, ароматизаторы, эфирные масла и компоненты средств. Состав уточните у мастера до нанесения.';
    const content = preparation.querySelector('.rq-dialog-content');
    if (technique) {
      const title = technique === 'jagua' ? 'Перед рисунком джагуа-гелем' : 'Перед рисунком хной';
      preparation.setAttribute('aria-label', title);
      content.innerHTML = `<h2>${title}</h2><p>Это временный рисунок на коже. Натуральное происхождение средства не исключает аллергическую реакцию.</p><ul><li>Заранее сообщите мастеру об известных аллергиях — в том числе на апельсин и другие цитрусовые, хну, джагуа, красители, ароматизаторы и эфирные масла — и прошлых реакциях на средства.</li><li>Составы различаются. До нанесения уточните состав конкретного средства и обсудите известные ограничения с мастером.</li><li>Не наносите средство на повреждённую или раздражённую кожу. При прошлой реакции на средство сначала обсудите процедуру с врачом.</li></ul><p class="rq-small">Памятка не заменяет индивидуальную консультацию. Перед запуском текст и составы средств согласует салон.</p><p class="rq-small">Подробнее: <a href="https://www.fda.gov/cosmetics/cosmetic-ingredients/allergens-cosmetics" target="_blank" rel="noopener">FDA об аллергенах в косметике</a>, <a href="https://www.fda.gov/cosmetics/cosmetic-products/temporary-tattoos-hennamehndi-and-black-henna-fact-sheet" target="_blank" rel="noopener">о временных рисунках и хне</a></p><button class="rq-primary" type="button" data-rq-understood>Понятно ${arrow}</button>`;
    } else {
      preparation.setAttribute('aria-label', 'Памятка перед татуировкой');
      content.innerHTML = originalPreparation;
      const allergy = document.createElement('li');
      allergy.textContent = 'До процедуры сообщите мастеру об известных аллергиях и прошлых реакциях на пигменты, антисептики, латекс и средства ухода. При аллергии на апельсин, другие цитрусовые или ароматизаторы уточните состав используемых средств.';
      content.querySelector('ul').prepend(allergy);
    }
    content.querySelector('[data-rq-understood]').onclick = () => preparation.close();
  }
  const review = makeDialog('Проверка демонстрационной заявки');
  function showDialog(dialog, origin) { lastDialogFocus=origin || document.activeElement; dialog.showModal(); }
  mount.addEventListener('click', e => { const button = e.target.closest('[data-rq-preparation]'); if (button) showDialog(preparation, button); });
  function setError(id, message) {
    const el = field(id); const output = field(id + '-error');
    if (output) output.textContent = message;
    if (el) { if(message) el.setAttribute('aria-invalid','true'); else el.removeAttribute('aria-invalid'); }
  }
  function clearErrors() { for(const el of mount.querySelectorAll('.rq-error'))el.textContent=''; for(const el of mount.querySelectorAll('[aria-invalid]'))el.removeAttribute('aria-invalid'); }
  const priceLabel = s => s.price != null ? `${s.price_prefix ? s.price_prefix + ' ' : ''}${Number(s.price).toLocaleString('ru-RU')} ₽` : 'Стоимость уточнит мастер';
  function updateService() {
    const s = service.value===''?null:category.services[Number(service.value)];
    q('[data-rq-title]').textContent = s?.title || (customIntent?'Хочу свой образ':'Выберите услугу');
    q('[data-rq-price]').textContent = s ? priceLabel(s) : customIntent?'Стоимость обсудим с мастером':'';
    q('[data-rq-description]').textContent = s?.description || '';
    updateTattooConsent(s);
    bookingAdapter?.onServiceChange?.({category:category.id,service:s,index:service.value===''?null:Number(service.value),isCustom:customIntent,categoryServices:category.services});
  }
  function clearFiles() {
    fileEpoch++;
    const urls=new Set(files.map(f=>f.url));
    for(const url of decodingUrls)urls.add(url);decodingUrls.clear();
    if(freeTattooPlace){for(const draft of categoryDrafts.values())for(const entry of draft.files||[])urls.add(entry.url);categoryDrafts.clear();fileBusy=false;uploadChain=Promise.resolve();pendingBatches=0;}
    urls.forEach(url=>URL.revokeObjectURL(url));files=[];field('files').value='';renderFiles();
  }
  function updateCategory(id, title, intent) {
    const next = neutralSelection&&!id?neutralCategory:data.categories.find(c=>c.id===id); if(!next)return;
    const categoryChanged=category.id!==id;
    const previousTitle=freeTattooPlace&&!categoryChanged&&service.value!==''?category.services[Number(service.value)]?.title:null;
    let restored=null;
    if(categoryChanged) {
      if(freeTattooPlace){
        if(!draftResetPending)saveCategoryDraft();
        restored=categoryDrafts.get(id)||null;
        files=restored?.files||[];fileBusy=Boolean(restored?.pendingBatches);field('files').value='';
        selectedWork=restored?.selectedWork||null;selectedPreset=restored?.selectedPreset||null;customIntent=restored?.customIntent||false;
        for(const key of draftFields)field(key).value=restored?.values?.[key]||'';
        field('age').checked=Boolean(restored?.age);field('read').checked=Boolean(restored?.read);consentMode=restored?.consentMode||'';
        renderFiles();
      }else {clearFiles();selectedWork=null;selectedPreset=null;}
      paintPreset();paintWork();
    }
    category=next;
    if(freeTattooPlace){if(intent==='ready')customIntent=false;else if(intent==='custom'&&!restored)customIntent=true;}
    for(const b of mount.querySelectorAll('[data-rq-category]'))b.setAttribute('aria-pressed',String(b.dataset.rqCategory===id));
    service.innerHTML=(customIntent||neutralSelection?'<option value="">'+(!category.id?'Сначала выберите направление':customIntent?'Выберите услугу, если уже знаете':'Выберите услугу')+'</option>':'')+category.services.map((s,i)=>`<option value="${i}">${esc(s.title)} · ${esc(priceLabel(s))}</option>`).join('');
    service.disabled=neutralSelection&&!category.id;
    if(restored?.serviceId){const index=category.services.findIndex(s=>s.canonicalId===restored.serviceId);if(index>=0)service.value=String(index);}
    const targetTitle=title||previousTitle;
    if(targetTitle) { const index=category.services.findIndex(s=>s.title===targetTitle);if(index>=0)service.value=String(index); }
    for(const [key,selector] of [['tattoo','[data-rq-tattoo]'],['tattoo','[data-rq-checks]'],['color','[data-rq-color]'],['nails','[data-rq-nails]']]) {
      const panel=q(selector); panel.hidden=key!==id;
      for(const input of panel.querySelectorAll('input,select,textarea'))input.disabled=panel.hidden;
    }
    const canUpload=freeTattooPlace||['color','nails','tattoo'].includes(id); q('[data-rq-upload]').hidden=!canUpload;field('files').disabled=!canUpload||fileBusy;
    q('[data-rq-upload-label]').textContent=id==='tattoo'?'Референсы татуировки *':'Фотографии и референсы';
    q('[data-rq-upload-hint]').textContent=id==='color'?'Можно добавить желаемый результат и фото ваших волос сейчас':id==='nails'?'Добавьте понравившийся дизайн — мастер сможет заранее обсудить детали':'Добавьте пример желаемого образа или свою идею';
    if(!freeTattooPlace){field('age').checked=false;field('read').checked=false;field('place').value='';field('length').value='';field('width').value='';field('other').value='';}
    q('[data-rq-other]').hidden=true;field('other').disabled=true;
    clearErrors();updateService();draftResetPending=false;
  }
  function paintWork() {
    const el=q('.rq-work');el.hidden=!selectedWork;
    if(selectedWork) {el.querySelector('img').src=photoUrl(selectedWork.image);q('[data-rq-work-label]').textContent='Пример салона: '+selectedWork.label;}
  }
  q('[data-rq-clear-work]').onclick=()=>{selectedWork=null;selectedPreset=null;paintPreset();paintWork();};
  mount.addEventListener('click',e=>{const b=e.target.closest('[data-rq-category]');if(b)updateCategory(b.dataset.rqCategory);});
  service.onchange=()=>{if(service.value!=='')customIntent=false;selectedPreset=null;paintPreset();clearErrors();updateService();};
  field('place').onchange=()=>{const other=!freeTattooPlace&&field('place').value==='Другая зона';q('[data-rq-other]').hidden=!other;field('other').disabled=!other;setError('place','');};
  function renderFiles() {
    const box=q('.rq-previews');box.replaceChildren();
    files.forEach((entry,i)=>{
      const tile=document.createElement('div');tile.className='rq-file';
      const image=document.createElement('img');image.alt='Локальный референс '+(i+1);image.src=entry.url;
      image.onerror=()=>{const fallback=document.createElement('span');fallback.textContent='HEIC / фото выбрано. Предпросмотр недоступен в этом браузере';image.replaceWith(fallback);};
      const name=document.createElement('small');name.textContent=entry.file.name;
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Удалить фото '+(i+1));
      remove.onclick=()=>{URL.revokeObjectURL(entry.url);files.splice(i,1);renderFiles();setError('files','');field('files').focus({preventScroll:true});};
      tile.append(image,name,remove);box.append(tile);
    });
  }
  async function isImage(file,epoch=fileEpoch) {
    const b=new Uint8Array(await file.slice(0,32).arrayBuffer());
    if(epoch!==fileEpoch)return false;
    const jpeg=b[0]===255&&b[1]===216&&b[2]===255;
    const png=b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10;
    const str=new TextDecoder('ascii').decode(b);
    const webp=str.startsWith('RIFF')&&str.slice(8,12)==='WEBP';
    const heic=str.slice(4,8)==='ftyp'&&/heic|heix|hevc|hevx|mif1|msf1/.test(str.slice(8));
    if(heic) {
      // A browser may not decode HEIC, but a signature alone is not a photograph.
      const bytes=await file.arrayBuffer();if(epoch!==fileEpoch)return false;const view=new DataView(bytes);let offset=0,meta=false,media=false,brand=false;
      while(offset+8<=bytes.byteLength){let size=view.getUint32(offset);const type=new TextDecoder('ascii').decode(new Uint8Array(bytes,offset+4,4));let header=8;
        if(size===1){if(offset+16>bytes.byteLength)return false;const large=view.getBigUint64(offset+8);if(large>BigInt(bytes.byteLength))return false;size=Number(large);header=16;}
        if(size===0)size=bytes.byteLength-offset;
        if(size<header||offset+size>bytes.byteLength)return false;
        if(type==='ftyp')brand=/heic|heix|hevc|hevx/.test(new TextDecoder('ascii').decode(new Uint8Array(bytes,offset+header,Math.min(size-header,80))));
        if(type==='meta'&&size>header+8)meta=true;if(type==='mdat'&&size>header+16)media=true;offset+=size;
      }
      return offset===bytes.byteLength&&meta&&media&&brand;
    }
    if(!jpeg&&!png&&!webp)return false;
    try {
      if(window.createImageBitmap){const bitmap=await createImageBitmap(file);const valid=bitmap.width>0&&bitmap.height>0;bitmap.close();return valid;}
      const url=URL.createObjectURL(file);
      decodingUrls.add(url);
      try{return await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth>0&&img.naturalHeight>0);img.onerror=()=>resolve(false);img.src=url;});}finally{if(decodingUrls.delete(url))URL.revokeObjectURL(url);}
    }catch{return false;}
  }
  let uploadChain=Promise.resolve(),pendingBatches=0;
  function addFiles(incoming){
    const batch=Array.from(incoming).slice(0,6),epoch=fileEpoch,targetFiles=files;
    if(!batch.length)return;
    // Each decoder keeps its original RAM owner, even if the user changes direction.
    const owner=freeTattooPlace?saveCategoryDraft():null;
    if(owner)owner.pendingBatches++;
    pendingBatches++;fileBusy=true;field('files').disabled=true;
    uploadChain=uploadChain.then(async()=>{const errors=[];
    try { for(const file of batch) {
      if(epoch!==fileEpoch)break;
      if(targetFiles.length>=5){errors.push('Можно добавить не больше 5 фото');break;}
      if(file.size>10*1024*1024){errors.push('Фото «'+file.name+'» больше 10 МБ');continue;}
      if(targetFiles.some(x=>x.file.name===file.name&&x.file.size===file.size&&x.file.lastModified===file.lastModified)){errors.push('Это фото уже добавлено');continue;}
      if(!await isImage(file,epoch)){errors.push('Выберите фотографию JPG, PNG, WebP или HEIC');continue;}
      if(epoch!==fileEpoch)break;
      targetFiles.push({file,url:URL.createObjectURL(file)});
    }} catch {errors.push('Не удалось прочитать фото. Попробуйте другой файл');}
    finally{if(!freeTattooPlace||epoch===fileEpoch)pendingBatches--;if(owner)owner.pendingBatches--;if(!freeTattooPlace||(epoch===fileEpoch&&targetFiles===files)){fileBusy=owner?owner.pendingBatches>0:pendingBatches>0;field('files').disabled=q('[data-rq-upload]').hidden||fileBusy;renderFiles();if(epoch===fileEpoch)setError('files',errors.join('. '));}}
    });
  }
  field('files').onchange=()=>{const input=field('files');const batch=Array.from(input.files||[]);input.value='';addFiles(batch);};
  if(freeTattooPlace){
    const paste=document.createElement('div');paste.className='rq-paste';paste.dataset.referencePaste='';paste.contentEditable='true';paste.tabIndex=0;paste.setAttribute('role','textbox');paste.setAttribute('aria-label','Вставить скопированные фотографии');paste.setAttribute('inputmode','none');paste.setAttribute('spellcheck','false');paste.dataset.placeholder='Или нажмите здесь и вставьте фото';
    field('files').after(paste);
    paste.addEventListener('beforeinput',e=>e.preventDefault());
    paste.addEventListener('input',()=>paste.replaceChildren());
    form.addEventListener('paste',e=>{
      if(q('[data-rq-upload]').hidden)return;
      const transfer=e.clipboardData;const items=transfer?.files?.length?Array.from(transfer.files):Array.from(transfer?.items||[]).filter(x=>x.kind==='file').map(x=>x.getAsFile()).filter(Boolean);
      if(items.length){e.preventDefault();addFiles(items);paste.replaceChildren();}
      else if(e.target===paste){e.preventDefault();setError('files','Скопируйте само изображение, затем вставьте его сюда');paste.replaceChildren();}
    });
    paste.addEventListener('dragover',e=>e.preventDefault());paste.addEventListener('drop',e=>{e.preventDefault();addFiles(e.dataTransfer?.files||[]);paste.replaceChildren();});
  }
  function select(value={}) {
    let preset=null;
    if(freeTattooPlace&&!value.custom&&value.workImage&&!value.serviceTitle&&data.images.includes(value.workImage)){
      const candidate=workPresets.find(p=>p.category===value.category&&p.image===value.workImage);
      const match=data.categories.find(c=>c.id===value.category)?.services.find(s=>s.canonicalId===candidate?.canonicalId);
      if(match){preset=candidate;value={...value,serviceTitle:match.title};}
    }
    const changedCustomCategory=freeTattooPlace&&value.custom&&data.categories.some(c=>c.id===value.category&&c.id!==category.id);
    const returningToDraft=freeTattooPlace&&value.category!==category.id&&categoryDrafts.has(value.category);
    const reopenCustom=freeTattooPlace&&value.custom&&customIntent&&!changedCustomCategory;
    const intent=freeTattooPlace?(value.custom?'custom':value.serviceTitle||value.workImage?'ready':null):null;
    if(!reopenCustom)updateCategory(value.category || category.id, value.serviceTitle,intent);
    if(value.custom&&!reopenCustom&&!returningToDraft){service.value='';selectedWork=null;selectedPreset=null;paintPreset();paintWork();updateService();}
    if(preset){selectedPreset=preset;paintPreset();}
    else if(value.serviceTitle||(!value.custom&&value.workImage)){selectedPreset=null;paintPreset();}
    if(value.workImage&&data.images.includes(value.workImage)) { selectedWork={image:value.workImage,label:String(value.workLabel||'Выбранная работа').slice(0,140)};paintWork(); }
    if(presentationAdapter)presentationAdapter.open(value);
    else mount.closest('#request')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    if(freeTattooPlace)mount.dispatchEvent(new CustomEvent('kultura:request-selection',{bubbles:true,detail:{category:category.id,serviceId:service.value===''?null:category.services[Number(service.value)]?.canonicalId||null,preset:Boolean(selectedPreset),custom:customIntent}}));
  }
  window.KulturaRequest={select,registerBookingAdapter(adapter){
    if(!mount.dataset.bookingMode)return false;
    bookingAdapter=adapter;updateService();return true;
  },setPresentationAdapter(adapter){if(mount.dataset.requestPresentation!=='dialog')return false;presentationAdapter=adapter;return true;}};
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-request-category]');if(!button||mount.contains(button))return;
    e.preventDefault();select({category:button.dataset.requestCategory,serviceTitle:button.dataset.requestService,workImage:button.dataset.requestWorkImage,workLabel:button.dataset.requestWorkLabel,custom:button.dataset.requestCustom==='true',trigger:button});
  });
  form.addEventListener('submit',e=>{
    e.preventDefault();clearErrors();const problems=[];
    const fail=(id,message)=>{setError(id,message);problems.push(id);};
    const selected=service.value===''?null:category.services[Number(service.value)];
    if(!selected&&!customIntent)fail('service',neutralSelection&&!category.id?'Сначала выберите направление':'Выберите услугу');
    const name=field('name').value.trim();if(name.length<2||!/[\p{L}]/u.test(name))fail('name','Укажите имя — хотя бы 2 буквы');
    const phoneError=phone?phone.error():'Проверка номера загружается. Попробуйте ещё раз';if(phoneError)fail('phone',phoneError);
    const date=field('date').value; if(date&&date<localToday())fail('date','Выберите сегодняшнюю или будущую дату');
    if(category.id==='tattoo') {
      const place=field('place').value.trim();
      if(!place||(freeTattooPlace&&(place.length<2||place.length>120)))fail('place',freeTattooPlace?'Напишите место нанесения — от 2 до 120 символов':'Выберите место нанесения');
      if(!freeTattooPlace&&place==='Другая зона'&&!field('other').value.trim())fail('other','Уточните место нанесения');
      const length=Number(field('length').value);if(!length||length<1||length>100)fail('length','Укажите примерную длину от 1 до 100 см');
      const width=field('width').value;if(width&&(Number(width)<1||Number(width)>100))fail('width','Укажите ширину от 1 до 100 см');
      if(!files.length&&!selectedWork)fail('files','Добавьте референс или выберите пример работы салона');
      if(!temporaryTattoo(selected)&&!field('age').checked)fail('age','Для этой демонстрационной заявки необходимо подтвердить 18+');
      if(!field('read').checked)fail('read','Прочитайте памятку и отметьте ознакомление');
    }
    if(fileBusy){field('general-error').textContent='Подождите, фото ещё обрабатывается';field('general-error').focus();return;}
    if(problems.length){field('general-error').textContent='Проверьте отмеченные поля';let invalid=field(problems[0]);if(neutralSelection&&invalid===service&&service.disabled)invalid=q('[data-rq-category]');if(freeTattooPlace){const folded=invalid?.closest('details');if(folded)folded.open=true;}invalid?.focus({preventScroll:false});return;}
    if(bookingAdapter?.validate){const result=bookingAdapter.validate();if(result?.error){field('general-error').textContent=result.error;result.focus?.focus();return;}}
    const details=selected?[['Услуга',selected.title],['Цена по прайсу',priceLabel(selected)]]:[['Направление',category.title],['Запрос','Хочу свой образ — помощь с выбором услуги']];
    details.push(['Имя',name],['Телефон',field('phone').value]);
    bookingAdapter?.extendDetails?.(details);
    if(date)details.push(['Пожелание по дате',new Date(date+'T12:00:00').toLocaleDateString('ru-RU')]);
    if(category.id==='tattoo')details.push(['Место',!freeTattooPlace&&field('place').value==='Другая зона'?field('other').value.trim():field('place').value.trim()],['Размер',field('length').value+(field('width').value?' × '+field('width').value:'')+' см'],['Подтверждения',temporaryTattoo(selected)?'Памятка о временном рисунке прочитана · Об известных аллергиях сообщу мастеру':freeTattooPlace?'18+ · Памятка прочитана · Об известных аллергиях сообщу мастеру':'18+ · Памятка прочитана']);
    if(category.id==='color'&&field('color').value.trim())details.push(['Окрашивание',field('color').value.trim()]);
    if(category.id==='nails'&&field('nails').value.trim())details.push(['Маникюр',field('nails').value.trim()]);
    if(selectedWork)details.push(['Пример салона',selectedWork.label]);
    if(selectedPreset)details.push(['Уточнение по образу',selectedPreset.note]);
    if(files.length)details.push(['Ваши референсы',files.map(f=>f.file.name).join('\n')]);
    if(field('comment').value.trim())details.push(['Пожелания',field('comment').value.trim()]);
    review.querySelector('.rq-dialog-content').innerHTML=`<p class="rq-eyebrow">Проверьте детали</p><h2>Вот как выглядит ваша заявка</h2><p class="rq-status">Это демо. Заявка не отправлена, запись не создана</p><dl class="rq-review">${details.map(([key,val])=>`<div><dt>${esc(key)}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl><p class="rq-small">На рабочем сайте мастер увидит пожелания и референсы, а запись будет связана с расписанием салона. Подключение YCLIENTS — следующий этап</p><button class="rq-primary" type="button" data-rq-edit>Вернуться к заявке ${arrow}</button>`;
    review.querySelector('[data-rq-edit]').onclick=()=>review.close();
    bookingAdapter?.decorateReview?.(review);
    showDialog(review,form.querySelector('[type=submit]'));
  });
  function localToday(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  field('date').min=localToday();
  form.addEventListener('reset',()=>{draftResetPending=true;clearFiles();selectedWork=null;selectedPreset=null;customIntent=false;consentMode='';paintPreset();paintWork();bookingAdapter?.reset?.();queueMicrotask(()=>updateCategory(neutralSelection?'':data.categories[0].id));});
  window.addEventListener('pagehide',()=>{clearFiles();form.reset();dialogs.forEach(d=>{if(d.open)d.close();d.querySelector('.rq-review')?.remove();});});
  async function loadVendor(name){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('vendor/'+name,base).href;s.onload=resolve;s.onerror=reject;document.head.append(s);});}
  updateCategory(category.id);
  (async()=>{try {if(!window.libphonenumber)await loadVendor('libphonenumber-max.js');if(!window.SmenaPhoneExamples)await loadVendor('phone-examples.js');if(!window.SmenaPhoneInput)await loadVendor('phone-input.js');phone=window.SmenaPhoneInput.attach(field('phone'));mount.dataset.requestReady='true';}catch{field('phone-error').textContent='Проверка номера не загрузилась. Обновите страницу';mount.dataset.requestReady='error';}})();
  if(pendingSelection)select(pendingSelection);
})();
