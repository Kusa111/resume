import { modeMeta, tasks } from './data.js';

const state = {
  mode: null,
  deck: [],
  index: 0,
  streak: 0,
  solved: 0,
  locked: false
};

const els = {
  modeScreen: document.querySelector('#mode-screen'),
  trainerScreen: document.querySelector('#trainer-screen'),
  modeButtons: document.querySelectorAll('[data-mode]'),
  currentMode: document.querySelector('#current-mode'),
  streak: document.querySelector('#streak'),
  wordCard: document.querySelector('#word-card'),
  maskedWord: document.querySelector('#masked-word'),
  result: document.querySelector('#result-message'),
  form: document.querySelector('#answer-form'),
  input: document.querySelector('#answer-input'),
  check: document.querySelector('#check-button'),
  skip: document.querySelector('#skip-button'),
  changeMode: document.querySelector('#change-mode'),
  backTop: document.querySelector('#back-top'),
  successBanner: document.querySelector('#success-banner')
};

const normalize = (value) => value.trim().toLocaleLowerCase('ru-RU').replace(/йо/g, 'ё');
const bestKey = (mode) => `ege-words:best-streak:${mode}`;
const getBest = (mode) => Number(localStorage.getItem(bestKey(mode)) || 0);
const setBest = (mode, value) => localStorage.setItem(bestKey(mode), String(value));

function shuffle(list) {
  return [...list]
    .map((item) => ({ item, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

function currentTask() {
  return state.deck[state.index];
}

function startMode(mode) {
  state.mode = mode;
  state.deck = shuffle(tasks[mode]);
  state.index = 0;
  state.streak = 0;
  state.solved = 0;
  state.locked = false;
  els.modeScreen.classList.add('hidden');
  els.trainerScreen.classList.remove('hidden');
  renderTask();
}

function showModes() {
  els.trainerScreen.classList.add('hidden');
  els.modeScreen.classList.remove('hidden');
  state.locked = false;
  window.clearTimeout(showModes.nextTimer);
}

function updateHeader() {
  els.currentMode.textContent = modeMeta[state.mode].title;
  els.streak.textContent = state.streak;
}

function renderTask() {
  const task = currentTask();
  state.locked = false;
  els.wordCard.className = 'word-card bump';
  els.successBanner.classList.add('hidden');
  els.maskedWord.textContent = task.masked;
  els.result.classList.add('hidden');
  els.result.textContent = '';
  els.input.value = '';
  els.input.disabled = false;
  els.check.disabled = false;
  updateHeader();
  window.setTimeout(() => els.wordCard.classList.remove('bump'), 260);
  window.setTimeout(() => els.input.focus({ preventScroll: true }), 80);
}

function submitAnswer() {
  if (state.locked) return;
  const task = currentTask();
  const answer = normalize(els.input.value);
  if (!answer) return;

  state.locked = true;
  state.solved += 1;
  els.input.disabled = true;
  els.check.disabled = true;

  const isCorrect = answer === normalize(task.answer);
  if (isCorrect) {
    state.streak += 1;
    if (state.streak > getBest(state.mode)) setBest(state.mode, state.streak);
    els.successBanner.classList.remove('hidden');
    updateHeader();
    showModes.nextTimer = window.setTimeout(nextTask, 620);
    return;
  }

  state.streak = 0;
  els.wordCard.classList.add('bad');
  els.result.textContent = `Правильно: ${task.original}`;
  els.result.classList.remove('hidden');
  updateHeader();
}

function nextTask() {
  window.clearTimeout(showModes.nextTimer);
  state.index += 1;
  if (state.index >= state.deck.length) {
    state.deck = shuffle(tasks[state.mode]);
    state.index = 0;
  }
  renderTask();
}

function skipTask() {
  if (state.locked) {
    nextTask();
    return;
  }
  state.streak = 0;
  state.solved += 1;
  nextTask();
}

els.modeButtons.forEach((button) => button.addEventListener('click', () => startMode(button.dataset.mode)));
els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitAnswer();
});
els.skip.addEventListener('click', skipTask);
els.changeMode.addEventListener('click', showModes);
els.backTop.addEventListener('click', showModes);
