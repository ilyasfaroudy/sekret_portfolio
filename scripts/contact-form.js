(() => {
  'use strict';
  const form = document.getElementById('contactForm');
  if (!form) return;
  const fields = form.querySelector('.brief-fields');
  const button = form.querySelector('[type="submit"]');
  const status = document.getElementById('brief-status');
  const counter = document.getElementById('brief-count');
  const controls = [...fields.querySelectorAll('input, select, textarea')];
  const touched = new Set();
  const services = ["Брендинг","Веб-дизайн","Графический дизайн","3D / Motion","Другое"];
  const budgets = ["Не определён","до 30 000 ₽","30 000–60 000 ₽","60 000 ₽+"];
  let sending = false;
  function errorFor(control) {
    const value = control.value.trim();
    if (control.maxLength > 0 && control.value.length > control.maxLength) return 'Слишком длинное значение.';
    if (control.name === 'name' && value.length < 2) return 'Введите имя: минимум 2 символа.';
    if (control.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email.';
    if (control.name === 'service' && !services.includes(value)) return 'Выберите направление.';
    if (control.name === 'message' && value.length < 20) return 'Опишите проект: минимум 20 символов.';
    if (control.name === 'budget' && value && !budgets.includes(value)) return 'Выберите бюджет из списка.';
    return '';
  }
  function showError(control, error) {
    control.setAttribute('aria-invalid', String(Boolean(error)));
    document.getElementById('error-' + control.name).textContent = error;
  }
  function validate(control) { const error = errorFor(control); showError(control, error); return !error; }
  function updateCount() { counter.textContent = form.elements.message.value.length + ' / 800'; }
  controls.forEach(control => {
    control.addEventListener('blur', () => { touched.add(control.name); validate(control); });
    const update = () => {
      if (touched.has(control.name)) validate(control);
      updateCount();
      if (!sending) { status.textContent = ''; button.textContent = 'ОТПРАВИТЬ ЗАЯВКУ ↗'; }
    };
    control.addEventListener('input', update);
    control.addEventListener('change', update);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const valid = controls.map(control => { touched.add(control.name); return validate(control); }).every(Boolean);
    if (!valid) { controls.find(control => control.getAttribute('aria-invalid') === 'true').focus(); return; }
    const payload = Object.fromEntries(controls.map(control => [control.name, control.value.trim()]));
    sending = true;
    button.disabled = true;
    fields.disabled = true;
    form.setAttribute('aria-busy','true');
    button.textContent = 'ОТПРАВЛЯЕМ...';
    status.textContent = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal:controller.signal });
      const data = await response.json();
      if (!response.ok || data.ok !== true) {
        if (data.errors) controls.forEach(control => { if (typeof data.errors[control.name] === 'string') showError(control,data.errors[control.name]); });
        throw new Error('Submission failed');
      }
      form.reset();
      touched.clear();
      controls.forEach(control => showError(control,''));
      updateCount();
      button.textContent = 'ЗАЯВКА ОТПРАВЛЕНА ↗';
      status.textContent = 'Спасибо! Заявка получена. Отвечу в течение дня.';
    } catch (_) {
      button.textContent = 'ОТПРАВИТЬ ЗАЯВКУ ↗';
      status.textContent = 'НЕ УДАЛОСЬ ОТПРАВИТЬ. ПОПРОБУЙТЕ ЕЩЁ РАЗ.';
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      fields.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
  form.noValidate = true;
  button.disabled = false;
  updateCount();
})();
