'use strict';
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Наблюдаем за появлением элементов, не скрывая их при недоступном JS.
if (!noMotion && 'IntersectionObserver' in window) document.body.classList.add('motion-ready');
const observer = !noMotion && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
}, { threshold: .10, rootMargin: '0px 0px -25px 0px' }) : null;
if (observer) document.querySelectorAll('.reveal, .timeline-row, .detail, .venue-card, .letter p').forEach(el => observer.observe(el));
else document.querySelectorAll('.reveal, .timeline-row, .detail, .venue-card, .letter p').forEach(el => el.classList.add('is-visible'));
// Линия прокрутки в шапке.
const progress = document.getElementById('scrollProgress');
let ticking = false;
function updateScrollProgress() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${total > 0 ? Math.min(1, window.scrollY / total) : 0})`;
  ticking = false;
}
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateScrollProgress); ticking = true; } }, {passive:true});
window.addEventListener('resize', updateScrollProgress);
updateScrollProgress();
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
    formMessage.textContent = 'Пожалуйста, заполните обязательные поля анкеты выше.';
    document.getElementById('rsvp').scrollIntoView({behavior: noMotion ? 'auto' : 'smooth', block: 'start'});
    window.setTimeout(() => invalid.focus({ preventScroll: true }), noMotion ? 0 : 450);
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
    formMessage.scrollIntoView({ block: 'nearest', behavior: noMotion ? 'auto' : 'smooth' });
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

// ====================================
// ПЕЧАТЬ ТЕКСТА НА ПЕРВОЙ ФОТОГРАФИИ
// ====================================

function startWeddingTyping() {
  const elements = document.querySelectorAll(
    ".wedding-hero .wedding-typing"
  );

  const scrollHint = document.querySelector(
    ".wedding-hero .wedding-scroll"
  );

  if (!elements.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  async function typeText(element, speed) {
    const text = element.dataset.typing || "";

    if (reducedMotion) {
      element.textContent = text;
      return;
    }

    element.textContent = "";
    element.classList.add("is-typing");

    for (const character of Array.from(text)) {
      element.textContent += character;

      await sleep(speed);
    }

    element.classList.remove("is-typing");
  }

  async function runAnimation() {
    if (!reducedMotion) {
      await sleep(350);
    }

    for (let i = 0; i < elements.length; i++) {
      const speed = i === 1 ? 95 : 35;

      await typeText(elements[i], speed);

      if (!reducedMotion) {
        await sleep(250);
      }
    }

    if (scrollHint) {
      scrollHint.classList.add("is-visible");
    }
  }

  runAnimation();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startWeddingTyping,
    { once: true }
  );
} else {
  startWeddingTyping();
}
