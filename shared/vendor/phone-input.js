/* Based on the PULSE phone field; numbering metadata is bundled libphonenumber-js (MIT). */
(function(){
 'use strict';
 const russianTemplate='+7 900 000-00-00';
 const database=globalThis.libphonenumber;
 const digitsOf=value=>String(value??'').replace(/\D/g,'');
 function normalize(value){
  const text=String(value??''),digits=digitsOf(text);
  if(!digits)return '';
  if(/^\s*\+/.test(text))return digits;
  if(/^00/.test(digits))return digits.slice(2);
  if(/^[78]/.test(digits))return '7'+digits.slice(1);
  if(digits.length===10)return '7'+digits;
  if(digits.length>10&&database?.isValidPhoneNumber('+'+digits))return digits;
  return '7'+digits;
 }
 function bounded(digits){
  // E.164 permits at most 15 digits; national metadata may set a lower ceiling.
  let next=digits.slice(0,digits.startsWith('7')?11:15);
  if(database)while(next.length>1&&database.validatePhoneNumberLength('+'+next)==='TOO_LONG')next=next.slice(0,-1);
  return next;
 }
 function format(value){
  const digits=bounded(normalize(value));
  if(!digits)return String(value??'').trim()==='+'?'+':'';
  if(!digits.startsWith('7'))return database?new database.AsYouType().input('+'+digits):'+'+digits;
  const local=digits.slice(1);let result='+7';
  if(local.length)result+=' '+local.slice(0,3);
  if(local.length>3)result+=' '+local.slice(3,6);
  if(local.length>6)result+='-'+local.slice(6,8);
  if(local.length>8)result+='-'+local.slice(8,10);
  return result;
 }
 function error(value){
  const digits=normalize(value);
  if(!digits)return 'Введи номер телефона';
  if(digits.length>15)return 'В номере лишние цифры';
  if(!database)return /^7\d{10}$/.test(digits)?'':'Проверь номер телефона';
  const number='+'+digits,reason=database.validatePhoneNumberLength(number);
  if(reason==='TOO_SHORT'||digits==='7')return 'Номер ещё не дописан';
  if(reason==='TOO_LONG')return 'В номере лишние цифры';
  if(reason==='INVALID_COUNTRY')return 'Проверь код страны после +';
  return database.isValidPhoneNumber(number)?'':'Проверь номер телефона';
 }
 function hint(value){
  const digits=bounded(normalize(value));
  if(!digits||digits.startsWith('7'))return russianTemplate;
  if(!database)return value;
  const formatter=new database.AsYouType();formatter.input('+'+digits);
  const country=formatter.getCountry(),example=country&&database.getExampleNumber(country,globalThis.PulsePhoneExamples||{});
  if(!example)return value;
  const filled=digits.padEnd(example.number.length-1,'0');
  const full=new database.AsYouType().input('+'+filled);
  return full.startsWith(value)?full:value;
 }
 function caretAfterDigits(value,count){
  if(count<=0)return value.startsWith('+')?1:0;
  let seen=0,index=0;
  for(;index<value.length;index++)if(/\d/.test(value[index])&&++seen===count){index++;break;}
  while(index<value.length&&!/\d/.test(value[index]))index++;
  return index;
 }
 function deletion(value,start,end,backward){
  if(start!==end)return null;
  let index=backward?start-1:start;
  while(index>=0&&index<value.length&&!/\d/.test(value[index]))index+=backward?-1:1;
  if(index<0||index>=value.length)return {value,caret:start};
  if(digitsOf(value).length<=1)return {value:'',caret:0};
  const ordinal=digitsOf(value.slice(0,index)).length;
  const next=format(value.slice(0,index)+value.slice(index+1));
  return {value:next,caret:caretAfterDigits(next,ordinal)};
 }
 function attach(input,guide){
  let previous='',before=null,composing=false;
  function paint(){
   const value=input.value;
   if(guide){
    guide.replaceChildren();
    const entered=document.createElement('span');entered.className='phone-guide-entered';entered.textContent=value;
    const rest=document.createElement('span');rest.textContent=hint(value).slice(value.length);
    guide.append(entered,rest);
   }
   previous=value;
  }
  function write(value,caret){input.value=value;paint();if(caret!==null)input.setSelectionRange(caret,caret);}
  function sync(){
   const raw=input.value,position=input.selectionStart??raw.length,digits=digitsOf(raw);
   const ordinal=Math.max(0,digitsOf(raw.slice(0,position)).length+normalize(raw).length-digits.length);
   const next=format(raw);write(next,document.activeElement===input?caretAfterDigits(next,ordinal):null);
  }
  input.addEventListener('compositionstart',()=>{composing=true;});
  input.addEventListener('compositionend',()=>{composing=false;sync();});
  input.addEventListener('beforeinput',event=>{
   before={value:input.value,start:input.selectionStart??0,end:input.selectionEnd??0};
   if(composing||!event.cancelable||!/^deleteContent(Backward|Forward)$/.test(event.inputType))return;
   const change=deletion(before.value,before.start,before.end,event.inputType==='deleteContentBackward');
   if(!change)return;
   event.preventDefault();write(change.value,change.caret);before=null;
   input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  input.addEventListener('input',event=>{
   if(composing||event.isComposing)return;
   if(before&&/^deleteContent(Backward|Forward)$/.test(event.inputType)&&digitsOf(input.value)===digitsOf(previous)){
    const change=deletion(before.value,before.start,before.end,event.inputType==='deleteContentBackward');
    if(change){write(change.value,change.caret);before=null;return;}
   }
   before=null;sync();
  });
  input.addEventListener('change',sync);
  input.addEventListener('blur',()=>{if(!normalize(input.value)||input.value.trim()==='+7')write('',null);else sync();});
  // Reset is dispatched before the browser clears controls; repaint the guide afterwards.
  input.form?.addEventListener('reset',()=>queueMicrotask(()=>{before=null;sync();}));
  sync();
  return {error:()=>error(input.value),normalize:()=>normalize(input.value),sync};
 }
 globalThis.SmenaPhoneInput={normalize,bounded,format,error,hint,caretAfterDigits,deletion,attach};
})();
