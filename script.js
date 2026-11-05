'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal on scroll: плавно, без отключения содержимого на устройствах без JS.
const reveals = [...document.querySelectorAll('.reveal')];
if (!reducedMotion && 'IntersectionObserver' in window) {
  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  reveals.forEach(el => observer.observe(el));
} else reveals.forEach(el => el.classList.add('visible'));

// Печать имён буква за буквой на фотографии.
(async function typeNames() {
  const el = document.querySelector('.hero .typewriter');
  if (!el || reducedMotion) return;
  const original = el.dataset.type || el.textContent;
  el.textContent = '';
  el.classList.add('typing');
  for (const character of Array.from(original)) {
    el.textContent += character;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  el.classList.remove('typing');
})();

// Линия прогресса прокрутки.
const progress = document.getElementById('scrollProgress');
function updateProgress() {
  if (!progress) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0})`;
}
window.addEventListener('scroll', updateProgress, { passive:true });
window.addEventListener('resize', updateProgress);
updateProgress();

// Отсчёт до регистрации, часовой пояс Белгорода (UTC+3).
const weddingTime = Date.parse('2027-07-21T10:30:00+03:00');
function updateCountdown() {
  const delta = Math.max(0, weddingTime - Date.now());
  const numbers = {
    days: Math.floor(delta / 86400000),
    hours: Math.floor(delta % 86400000 / 3600000),
    minutes: Math.floor(delta % 3600000 / 60000),
    seconds: Math.floor(delta % 60000 / 1000)
  };
  Object.entries(numbers).forEach(([key,value]) => {
    const el = document.getElementById(key);
    if (el) el.textContent = String(value).padStart(2, '0');
  });
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Заполнение за пару/семью. Отправка только после подключения своего Formspree ID.
const FORMSPREE_FORM_ID = 'YOUR_FORM_ID';
const form = document.getElementById('rsvpForm');
const message = document.getElementById('formMessage');
const send = document.getElementById('sendResponseButton');
const otherCheck = document.getElementById('otherDrinkCheck');
const otherField = document.getElementById('otherDrinkField');
const otherText = document.getElementById('otherDrinkText');
const attending = document.getElementById('attendingFields');
function updateOther() {
  const selected = otherCheck.checked && !otherCheck.disabled;
  otherField.hidden = !selected;
  otherText.disabled = !selected;
  otherText.required = selected;
  if (!selected) otherText.value = '';
}
otherCheck.addEventListener('change', updateOther);
function updateAttendance() {
  const answer = form.querySelector('input[name="attendance"]:checked')?.value;
  const no = answer === 'Нет';
  attending.hidden = no;
  attending.querySelectorAll('input,textarea').forEach(el => { el.disabled = no; });
  updateOther();
}
form.querySelectorAll('input[name="attendance"]').forEach(el => el.addEventListener('change', updateAttendance));
updateAttendance();
send.addEventListener('click', () => {
  if (!form.reportValidity()) {
    document.getElementById('rsvp').scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth'});
    return;
  }
  form.requestSubmit();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  message.className = 'form-message';
  message.textContent = '';
  if (!/^[a-z0-9]{8}$/i.test(FORMSPREE_FORM_ID)) {
    message.classList.add('error');
    message.textContent = 'Отправка пока не подключена: нужно добавить ID формы Formspree.';
    return;
  }
  const data = new FormData(form);
  const other = String(data.get('otherDrink') || '').trim();
  const drinks = data.getAll('drinks').filter(x => x !== 'Другое');
  if (other) drinks.push(`Другое: ${other}`);
  const payload = {
    _subject: 'Ответ на свадебное приглашение — 21 июля 2027',
    'Имена': data.get('name') || '',
    'Не придут': data.get('absentGuests') || '',
    'Ответ': data.get('attendance') || '',
    'Напитки': drinks.join(', '),
    'Питание': data.get('diet') || '',
    'Пожелания': data.get('wishes') || ''
  };
  send.disabled = true;
  send.textContent = 'ОТПРАВЛЯЕМ…';
  try {
    const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
      method:'POST',
      headers: {'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    message.classList.add('success');
    message.textContent = 'Спасибо! Ответ успешно отправлен ♡';
    form.reset(); updateAttendance();
  } catch(error) {
    console.error(error);
    message.classList.add('error');
    message.textContent = 'Не удалось отправить ответ. Попробуйте ещё раз.';
  } finally {
    send.disabled = false;
    send.textContent = 'ОТПРАВИТЬ ОТВЕТ ↗';
  }
});
