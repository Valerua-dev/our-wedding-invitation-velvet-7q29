'use strict';

// СВАДЕБНЫЙ ЖУРНАЛ · 9 отдельных страниц, вместо длинного сайта.
const pages = [...document.querySelectorAll('.mag-page')];
const nextButton = document.getElementById('nextPage');
const prevButton = document.getElementById('prevPage');
const indicator = document.getElementById('pageIndicator');
const openButton = document.getElementById('openBtn');
const coverBook = document.getElementById('book');
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentPage = 0;
let busy = false;

const pageNames = ['ОБЛОЖКА', 'ПРИГЛАШЕНИЕ', 'ДО СВАДЬБЫ', 'ПРОГРАММА', 'МЕСТА', 'ДЕТАЛИ', 'АНКЕТА', 'КОНТАКТЫ', 'ФИНАЛ'];
function updateNavigation() {
  const label = `${pageNames[currentPage]}  ·  ${String(currentPage + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
  indicator.textContent = label;
  prevButton.disabled = busy || currentPage === 0;
  nextButton.disabled = busy || currentPage === pages.length - 1;
}
function moveTo(index, animate = true) {
  if (busy || index < 0 || index >= pages.length || index === currentPage) return;
  const outgoing = pages[currentPage];
  const incoming = pages[index];
  const forward = index > currentPage;
  busy = true;
  updateNavigation();
  incoming.scrollTop = 0;
  incoming.removeAttribute('inert');
  incoming.setAttribute('aria-hidden', 'false');
  incoming.classList.add(forward ? 'turn-in-next' : 'turn-in-prev');
  outgoing.classList.add(forward ? 'turn-out-next' : 'turn-out-prev');
  const complete = () => {
    outgoing.classList.remove('page-entered', 'active', 'turn-out-next', 'turn-out-prev');
    outgoing.setAttribute('aria-hidden', 'true');
    outgoing.setAttribute('inert', '');
    incoming.classList.remove('turn-in-next', 'turn-in-prev');
    incoming.classList.add('active');
    // Анимация запускается только ПОСЛЕ завершения перелистывания.
    // Сбрасываем её, чтобы при возврате на страницу надписи проявлялись снова.
    requestAnimationFrame(() => requestAnimationFrame(() => incoming.classList.add('page-entered')));
    currentPage = index;
    busy = false;
    updateNavigation();
  };
  window.setTimeout(complete, animate && !noMotion ? 780 : 0);
}
nextButton.addEventListener('click', () => moveTo(currentPage + 1));
prevButton.addEventListener('click', () => moveTo(currentPage - 1));
openButton.addEventListener('click', () => {
  if (busy) return;
  coverBook.classList.add('opened');
  busy = true;
  updateNavigation();
  window.setTimeout(() => { busy = false; moveTo(1); }, noMotion ? 0 : 1050);
});
// Управление с клавиатуры, когда фокус не находится в поле анкеты.
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); moveTo(currentPage + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveTo(currentPage - 1); }
});
// Свайпы: только горизонтальные; вертикальный скролл внутри длинных страниц не блокируем.
let touchStart = null;
const shell = document.getElementById('magazineShell');
shell.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) return;
  touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
shell.addEventListener('touchend', event => {
  if (!touchStart || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
  if (event.target.closest('input,textarea,select')) return;
  moveTo(currentPage + (dx < 0 ? 1 : -1));
}, { passive: true });
updateNavigation();

// Эффект печатных букв: разбиваем только заголовки, сохраняя курсив <i>.
// Буквы появляются при каждом входе на страницу, а не при первой загрузке сайта.
function prepareLetterHeadings() {
  const headings = document.querySelectorAll(
    '.mag-page .display, .mag-page .letter h3, .mag-page .contact-card h3, ' +
    '.mag-page .final-submit h3, .mag-page .ending h2, .mag-page .inside-center h2'
  );
  headings.forEach(heading => {
    if (heading.dataset.lettersReady) return;
    heading.dataset.lettersReady = 'true';
    const accessibleText = heading.textContent.replace(/\s+/g, ' ').trim();
    heading.setAttribute('aria-label', accessibleText);
    heading.classList.add('letter-heading');
    const textNodes = [];
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    let count = 0;
    for (const node of textNodes) {
      const fragment = document.createDocumentFragment();
      for (const char of node.textContent) {
        if (/\s/.test(char)) {
          fragment.appendChild(document.createTextNode(char));
        } else {
          const span = document.createElement('span');
          span.className = 'letter-char';
          span.textContent = char;
          span.style.setProperty('--char-order', String(count++));
          span.setAttribute('aria-hidden', 'true');
          fragment.appendChild(span);
        }
      }
      node.parentNode.replaceChild(fragment, node);
    }
  });
}
prepareLetterHeadings();
// Запускаем появление текста на первой странице после загрузки.
requestAnimationFrame(() => requestAnimationFrame(() => pages[0].classList.add('page-entered')));

// Отсчёт до 21 июля 2027, 10:30, Белгород (UTC+3).
const weddingTime = Date.parse('2027-07-21T10:30:00+03:00');
function updateCountdown() {
  const delta = Math.max(0, weddingTime - Date.now());
  const values = {
    days: Math.floor(delta / 86400000),
    hours: Math.floor(delta % 86400000 / 3600000),
    minutes: Math.floor(delta % 3600000 / 60000),
    seconds: Math.floor(delta % 60000 / 1000)
  };
  for (const [id, value] of Object.entries(values)) {
    const target = document.getElementById(id);
    if (target) target.textContent = String(value).padStart(2, '0');
  }
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

// Анкета пары и семьи. ВАЖНО: пока ID Formspree не заполнен, данные никуда не уходят.
const FORMSPREE_FORM_ID = 'YOUR_FORM_ID';
const form = document.getElementById('rsvpForm');
const formMessage = document.getElementById('formMessage');
const submitButton = document.getElementById('sendResponseButton');
const otherDrinkCheck = document.getElementById('otherDrinkCheck');
const otherDrinkField = document.getElementById('otherDrinkField');
const otherDrinkText = document.getElementById('otherDrinkText');
const attendingFields = document.getElementById('attendingFields');
function updateOtherDrink() {
  const chosen = otherDrinkCheck.checked;
  otherDrinkField.hidden = !chosen;
  otherDrinkCheck.setAttribute('aria-expanded', String(chosen));
  otherDrinkText.disabled = !chosen;
  otherDrinkText.required = chosen;
  if (!chosen) otherDrinkText.value = '';
}
otherDrinkCheck.addEventListener('change', updateOtherDrink);
updateOtherDrink();
// Не заставляем отвечать о напитках и питании тех, кто не придёт.
function updateAttendance() {
  const attendance = form.querySelector('input[name="attendance"]:checked')?.value;
  attendingFields.hidden = attendance === 'Нет';
  attendingFields.querySelectorAll('input, textarea').forEach(control => {
    control.disabled = attendance === 'Нет';
  });
  if (attendance !== 'Нет') updateOtherDrink();
}
form.querySelectorAll('input[name="attendance"]').forEach(item => item.addEventListener('change', updateAttendance));
updateAttendance();

submitButton.addEventListener('click', () => {
  const invalid = [...form.elements].find(element => element.willValidate && !element.checkValidity());
  if (invalid) {
    formMessage.className = 'form-message error';
    formMessage.textContent = 'Пожалуйста, заполните обязательные поля анкеты. Мы открыли нужную страницу.';
    moveTo(pages.findIndex(page => page.id === 'rsvp'));
    window.setTimeout(() => invalid.focus({ preventScroll: false }), noMotion ? 50 : 820);
    return;
  }
  form.requestSubmit();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  formMessage.className = 'form-message';
  formMessage.textContent = '';
  if (!/^[a-z0-9]{8}$/i.test(FORMSPREE_FORM_ID) || FORMSPREE_FORM_ID === 'YOUR_FORM_ID') {
    formMessage.classList.add('error');
    formMessage.textContent = 'Анкета пока работает в режиме просмотра: отправка организаторам ещё не подключена. Для получения ответов нужно настроить Formspree.';
    formMessage.scrollIntoView({ block: 'nearest', behavior: noMotion ? 'instant' : 'smooth' });
    return;
  }
  const data = new FormData(form);
  const drinks = data.getAll('drinks').map(String);
  const otherDrink = String(data.get('otherDrink') || '').trim();
  const payload = {
    _subject: 'Свадьба 21.07.2027 — ответ гостя',
    'Имена гостей': String(data.get('name') || '').trim(),
    'Кто не сможет прийти': String(data.get('absentGuests') || '').trim(),
    'Присутствие': String(data.get('attendance') || ''),
    'Напитки': drinks.filter(d => d !== 'Другое').concat(otherDrink ? [`Другое: ${otherDrink}`] : []).join(', ') || 'Не указаны',
    'Особенности питания': String(data.get('diet') || ''),
    'Пожелания': String(data.get('wishes') || '')
  };
  submitButton.disabled = true;
  submitButton.textContent = 'ОТПРАВЛЯЕМ…';
  try {
    const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Ошибка ${response.status}`);
    formMessage.classList.add('success');
    formMessage.textContent = 'Спасибо! Ваш ответ отправлен организаторам свадьбы ♡';
    form.reset(); updateOtherDrink(); updateAttendance();
  } catch (error) {
    console.error(error);
    formMessage.classList.add('error');
    formMessage.textContent = 'Не получилось отправить ответ. Проверьте подключение к интернету и попробуйте ещё раз.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'ОТПРАВИТЬ ОТВЕТ ↗';
  }
});
