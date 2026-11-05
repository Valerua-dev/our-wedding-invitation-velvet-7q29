const openBtn = document.getElementById('openBtn');
const book = document.getElementById('book');
const invitation = document.getElementById('invitation');
const backTop = document.getElementById('backTop');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let opening = false;

openBtn.addEventListener('click', () => {
  if (opening) return;
  opening = true;
  openBtn.disabled = true;
  book.classList.add('opened');
  window.setTimeout(() => {
    invitation.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    openBtn.disabled = false;
    opening = false;
  }, reducedMotion.matches ? 0 : 1650);
});

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// 21 июля 2027, 10:30 по времени Белгорода (UTC+3).
const weddingTime = Date.parse('2027-07-21T10:30:00+03:00');
function updateCountdown() {
  const delta = Math.max(0, weddingTime - Date.now());
  const days = Math.floor(delta / 86400000);
  const hours = Math.floor((delta % 86400000) / 3600000);
  const minutes = Math.floor((delta % 3600000) / 60000);
  const seconds = Math.floor((delta % 60000) / 1000);
  for (const [id, value] of Object.entries({ days, hours, minutes, seconds })) {
    document.getElementById(id).textContent = String(value).padStart(2, '0');
  }
}
updateCountdown();
setInterval(updateCountdown, 1000);

window.addEventListener('scroll', () => backTop.classList.toggle('show', window.scrollY > 550), { passive: true });
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' }));

// Подключение Formspree: создайте форму и вставьте ID из её endpoint.
// Например, если endpoint https://formspree.io/f/abcdwxyz, укажите abcdwxyz.
const FORMSPREE_FORM_ID = 'YOUR_FORM_ID';
const form = document.getElementById('rsvpForm');
const formMessage = document.getElementById('formMessage');
const submitButton = document.getElementById('sendResponseButton');
const otherDrinkCheck = document.getElementById('otherDrinkCheck');
const otherDrinkField = document.getElementById('otherDrinkField');
const otherDrinkText = document.getElementById('otherDrinkText');

function updateOtherDrink() {
  const selected = otherDrinkCheck.checked;
  otherDrinkField.hidden = !selected;
  otherDrinkCheck.setAttribute('aria-expanded', String(selected));
  otherDrinkText.disabled = !selected;
  otherDrinkText.required = selected;
  if (!selected) otherDrinkText.value = '';
}
otherDrinkCheck.addEventListener('change', updateOtherDrink);
updateOtherDrink();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.className = 'form-message';
  formMessage.textContent = '';

  if (FORMSPREE_FORM_ID === 'YOUR_FORM_ID') {
    formMessage.classList.add('error');
    formMessage.textContent = 'Отправка ещё не подключена. Организаторам нужно добавить ID формы Formspree в script.js.';
    return;
  }

  const data = new FormData(form);
  const drinks = data.getAll('drinks').map(String);
  const otherDrink = String(data.get('otherDrink') || '').trim();
  const payload = {
    _subject: 'Свадьба 21.07.2027 — новый ответ гостя',
    'Приглашённые (имена через запятую)': String(data.get('name') || '').trim(),
    'Кто из приглашённых не сможет прийти': String(data.get('absentGuests') || '').trim(),
    'Присутствие': String(data.get('attendance') || ''),
    'Напитки': drinks.filter(item => item !== 'Другое').concat(otherDrink ? ['Другое: ' + otherDrink] : []).join(', ') || 'Не указаны',
    'Особенности питания': String(data.get('diet') || ''),
    'Пожелания': String(data.get('wishes') || '')
  };

  submitButton.disabled = true;
  submitButton.textContent = 'ОТПРАВЛЯЕМ…';
  try {
    const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    formMessage.classList.add('success');
    formMessage.textContent = 'Спасибо! Ваш ответ отправлен организаторам свадьбы ♡';
    form.reset();
    updateOtherDrink();
  } catch (error) {
    console.error('Ошибка отправки анкеты:', error);
    formMessage.classList.add('error');
    formMessage.textContent = 'Не получилось отправить ответ. Проверьте интернет и попробуйте ещё раз. Если ошибка повторится, свяжитесь с нами напрямую.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'ОТПРАВИТЬ ОТВЕТ ↗';
  }
});
