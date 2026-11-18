/* Studio presentation only: the original select remains the form's source of truth. */
(() => {
  'use strict';
  const dialog = document.getElementById('studio-request-dialog');
  const source = dialog?.querySelector('#rq-service');
  const home = source?.closest('.rq-field');
  const summary = dialog?.querySelector('.rq-summary');
  const summaryTitle = summary?.querySelector('[data-rq-title]');
  const label = home?.querySelector('label[for="rq-service"]');
  if (!source || !home || !summaryTitle || !label || source.dataset.servicePicker) return;

  const form = source.form;
  const mount = source.closest('[data-request-root]');
  const scroll = dialog.querySelector('.studio-request-scroll');
  const error = home.querySelector('#rq-service-error');
  const control = document.createElement('div');
  control.className = 'studio-service-control';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = 'studio-service-trigger';
  trigger.className = 'studio-service-trigger';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'studio-service-listbox');
  const value = document.createElement('span');
  value.id = 'studio-service-value';
  value.className = 'studio-service-value';
  const chevron = document.createElement('span');
  chevron.className = 'studio-service-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(value, chevron);
  control.append(trigger);
  source.before(control);
  if (error) control.append(error);

  const list = document.createElement('div');
  list.id = 'studio-service-listbox';
  list.className = 'studio-service-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  list.inert = true;
  list.setAttribute('aria-hidden', 'true');
  dialog.append(list);
  if (!label.id) label.id = 'studio-service-label';
  label.htmlFor = trigger.id;
  trigger.setAttribute('aria-labelledby', label.id + ' ' + value.id);
  list.setAttribute('aria-labelledby', label.id);
  summaryTitle.classList.add('studio-service-original-title');
  summary.classList.add('studio-service-summary');
  source.dataset.servicePicker = 'true';
  source.classList.add('studio-service-native');
  source.tabIndex = -1;
  source.setAttribute('aria-hidden', 'true');

  let rows = [];
  let renderKey = '';
  let active = -1;
  let expanded = false;
  let hideTimer = 0;
  let typeahead = '';
  let typeaheadAt = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const higherDialogOpen = () => Array.from(document.querySelectorAll('dialog[open]')).some(item => item !== dialog);
  const canOpen = () => dialog.open && !source.disabled && !higherDialogOpen() && dialog.dataset.dialogMotionState !== 'closing';

  function parts(option) {
    const text = option?.label || option?.textContent || '';
    const split = text.lastIndexOf(' · ');
    return split < 0 ? { title: text, price: '' } : { title: text.slice(0, split), price: text.slice(split + 3) };
  }
  function optionDisabled(option) {
    return option.disabled || Boolean(option.parentElement?.tagName === 'OPTGROUP' && option.parentElement.disabled);
  }
  function close(immediate = false) {
    expanded = false;
    list.inert = true;
    list.setAttribute('aria-hidden', 'true');
    list.classList.remove('is-visible');
    list.style.visibility = '';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    control.classList.remove('is-open');
    typeahead = '';
    if (immediate === true || reduced.matches || document.hidden || list.hidden) {
      clearTimeout(hideTimer); hideTimer = 0;
      list.hidden = true;
    } else if (!hideTimer) {
      // CSS reverses the same transition on reopen; only its final hiding is delayed.
      hideTimer = setTimeout(() => { hideTimer = 0; if (!expanded) list.hidden = true; }, 180);
    }
  }
  function showActive(index, reveal = true) {
    active = index;
    for (const row of rows) row.element.classList.toggle('is-active', row.index === active);
    const row = rows.find(item => item.index === active);
    if (!row || !expanded) { trigger.removeAttribute('aria-activedescendant'); return; }
    trigger.setAttribute('aria-activedescendant', row.element.id);
    if (!reveal) return;
    // Adjust only the list's own scroll; scrollIntoView would also move the form.
    const top = row.element.offsetTop;
    const bottom = top + row.element.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }
  function sync() {
    const options = Array.from(source.options);
    const key = JSON.stringify(options.map(option => [option.value, option.label, optionDisabled(option), option.hidden, Boolean(option.parentElement?.hidden)]));
    if (key !== renderKey) {
      // A changed catalog must never leave old service rows visible or selectable.
      close(true);
      renderKey = key;
      rows = [];
      list.replaceChildren();
      options.forEach((option, index) => {
        if (option.hidden || option.parentElement?.hidden) return;
        const element = document.createElement('div');
        element.id = 'studio-service-option-' + index;
        element.className = 'studio-service-option';
        element.dataset.serviceIndex = String(index);
        element.setAttribute('role', 'option');
        element.setAttribute('aria-selected', String(index === source.selectedIndex));
        element.setAttribute('aria-disabled', String(optionDisabled(option)));
        const copy = document.createElement('span');
        copy.className = 'studio-service-option-copy';
        const title = document.createElement('span');
        title.className = 'studio-service-option-title';
        const price = document.createElement('span');
        price.className = 'studio-service-option-price';
        const text = parts(option);
        title.textContent = text.title;
        price.textContent = text.price;
        const check = document.createElement('span');
        check.className = 'studio-service-check';
        check.setAttribute('aria-hidden', 'true');
        check.textContent = '✓';
        copy.append(title, price);
        element.append(copy, check);
        list.append(element);
        rows.push({ index, option, element });
      });
    }
    const selected = source.value !== '' && source.selectedIndex >= 0;
    value.textContent = selected ? parts(options[source.selectedIndex]).title : 'Выберите услугу';
    trigger.title = selected ? value.textContent : (options[source.selectedIndex]?.label || 'Выберите услугу');
    trigger.disabled = source.disabled;
    trigger.setAttribute('aria-required', String(source.required));
    const invalid = source.getAttribute('aria-invalid');
    if (invalid) trigger.setAttribute('aria-invalid', invalid); else trigger.removeAttribute('aria-invalid');
    const described = source.getAttribute('aria-describedby');
    if (described) trigger.setAttribute('aria-describedby', described); else trigger.removeAttribute('aria-describedby');
    for (const row of rows) row.element.setAttribute('aria-selected', String(row.index === source.selectedIndex));
    if (source.disabled) close();
  }
  function position() {
    const box = dialog.getBoundingClientRect();
    const anchor = trigger.getBoundingClientRect();
    const header = dialog.querySelector('.studio-request-header')?.getBoundingClientRect();
    const upper = Math.max(box.top + 8, (header?.bottom || box.top) + 6);
    const lower = box.bottom - 8;
    const below = lower - anchor.bottom - 7;
    const above = anchor.top - upper - 7;
    const down = below >= 180 || below >= above;
    const available = Math.max(0, down ? below : above);
    if (available < 44 || anchor.bottom <= upper || anchor.top >= lower) return false;
    const width = Math.min(anchor.width, box.width - 16);
    const left = Math.max(box.left + 8, Math.min(anchor.left, box.right - width - 8));
    list.style.width = Math.max(0, width) + 'px';
    list.style.maxHeight = Math.floor(Math.min(available, Math.max(180, Math.min(260, window.innerHeight * .32)))) + 'px';
    list.style.left = left - box.left - dialog.clientLeft + dialog.scrollLeft + 'px';
    const height = list.getBoundingClientRect().height;
    const top = down ? anchor.bottom + 7 : anchor.top - 7 - height;
    list.style.top = Math.max(upper, Math.min(top, lower - height)) - box.top - dialog.clientTop + dialog.scrollTop + 'px';
    list.dataset.placement = down ? 'below' : 'above';
    return true;
  }
  function open(edge) {
    sync();
    if (!canOpen()) return;
    clearTimeout(hideTimer); hideTimer = 0;
    const wasHidden = list.hidden;
    list.hidden = false;
    list.style.visibility = 'hidden';
    if (!position()) { close(true); return; }
    expanded = true;
    list.inert = false;
    list.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    control.classList.add('is-open');
    list.style.visibility = '';
    // One style flush starts a hidden list from its closed state; reversals need none.
    if (wasHidden && !reduced.matches) void list.offsetWidth;
    list.classList.add('is-visible');
    const enabled = rows.filter(row => !optionDisabled(row.option));
    const initial = edge === 'first' ? enabled[0] : edge === 'last' ? enabled[enabled.length - 1] : enabled.find(row => row.index === source.selectedIndex) || enabled[0];
    showActive(initial?.index ?? -1);
  }
  function choose(index) {
    const row = rows.find(item => item.index === index);
    if (!expanded || !row || optionDisabled(row.option) || !canOpen()) return;
    if (source.options[index] !== row.option) { close(); sync(); return; }
    const previous = source.selectedIndex;
    source.selectedIndex = index;
    close();
    // Match native selection semantics and keep all existing booking/form listeners.
    if (previous !== index) {
      source.dispatchEvent(new Event('input', { bubbles: true }));
      source.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync();
    trigger.focus({ preventScroll: true });
  }
  function step(delta) {
    const enabled = rows.filter(row => !optionDisabled(row.option));
    const index = enabled.findIndex(row => row.index === active);
    const next = Math.max(0, Math.min(enabled.length - 1, index + delta));
    showActive(enabled[next]?.index ?? -1);
  }
  trigger.addEventListener('click', () => { if (expanded) close(); else open(); });
  trigger.addEventListener('focus', sync);
  trigger.addEventListener('keydown', event => {
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'Escape') {
      if (!expanded) return;
      event.preventDefault(); event.stopPropagation(); close(); return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!expanded) { open(event.key === 'Home' ? 'first' : event.key === 'End' || (event.key === 'ArrowUp' && source.value === '') ? 'last' : undefined); return; }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') step(event.key === 'ArrowDown' ? 1 : -1);
      else if (event.key === 'Home' || event.key === 'End') {
        const enabled = rows.filter(row => !optionDisabled(row.option));
        showActive((event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1])?.index ?? -1);
      } else choose(active);
      return;
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    const now = performance.now();
    typeahead = now - typeaheadAt > 700 ? event.key : typeahead + event.key;
    typeaheadAt = now;
    if (!expanded) open();
    const query = typeahead.toLocaleLowerCase('ru-RU');
    const found = rows.find(row => !optionDisabled(row.option) && parts(row.option).title.toLocaleLowerCase('ru-RU').startsWith(query));
    if (found) showActive(found.index);
  });
  list.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
  list.addEventListener('click', event => {
    const option = event.target.closest('[data-service-index]');
    if (option && list.contains(option)) choose(Number(option.dataset.serviceIndex));
  });
  document.addEventListener('pointerdown', event => { if (expanded && !control.contains(event.target) && !list.contains(event.target)) close(); }, true);
  document.addEventListener('focusin', event => { if (expanded && event.target !== source && !control.contains(event.target) && !list.contains(event.target)) close(); });
  dialog.addEventListener('cancel', event => { if (expanded) { event.preventDefault(); event.stopPropagation(); close(); } });
  dialog.addEventListener('close', () => close(true));
  dialog.addEventListener('scroll', close, { passive: true });
  scroll?.addEventListener('scroll', close, { passive: true });
  window.addEventListener('resize', close, { passive: true });
  window.addEventListener('scroll', close, { passive: true });
  window.visualViewport?.addEventListener('resize', close, { passive: true });
  window.visualViewport?.addEventListener('scroll', close, { passive: true });
  source.addEventListener('change', sync);
  source.addEventListener('input', sync);
  form?.addEventListener('reset', () => queueMicrotask(() => { close(); sync(); }));
  mount?.addEventListener('kultura:request-selection', () => { close(); sync(); });
  const observer = new MutationObserver(sync);
  const sourceObservation = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'required', 'selected', 'label', 'value', 'hidden', 'aria-invalid', 'aria-describedby'] };
  observer.observe(source, sourceObservation);
  // Existing validation calls select.focus(); proxy this instance without changing its validity.
  function focusBridge(options) {
    sync();
    if (!canOpen()) return;
    trigger.focus(options);
    open();
  }
  try { Object.defineProperty(source, 'focus', { configurable: true, value: focusBridge }); } catch { /* focusin below also covers native programmatic focus. */ }
  source.addEventListener('focus', () => { if (document.activeElement === source) focusBridge({ preventScroll: true }); });
  source.addEventListener('invalid', event => { event.preventDefault(); focusBridge({ preventScroll: false }); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) close(true); });
  reduced.addEventListener('change', () => { if (reduced.matches && !expanded) close(true); });
  window.addEventListener('pagehide', () => { close(true); observer.disconnect(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { observer.observe(source, sourceObservation); sync(); } });
  sync();
})();
