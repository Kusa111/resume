import { modeMeta, tasks } from './data.js';

const state = {
  mode: null,
  deck: [],
  index: 0,
  streak: 0,
  locked: false,
  startedAt: null,
  timerId: null
};

const els = {
  modeScreen: document.querySelector('#mode-screen'),
  trainerScreen: document.querySelector('#trainer-screen'),
  modeButtons: document.querySelectorAll('[data-mode]'),
  currentMode: document.querySelector('#current-mode'),
  streak: document.querySelector('#streak'),
  streakPill: document.querySelector('.streak-pill'),
  timer: document.querySelector('#timer'),
  maskedWord: document.querySelector('#masked-word'),
  result: document.querySelector('#result-message'),
  choices: document.querySelector('#choice-row'),
  backTop: document.querySelector('#back-top'),
  successBanner: document.querySelector('#success-banner')
};

const normalize = (value) => String(value || '').trim().toLocaleLowerCase('ru-RU').replace(/йо/g, 'ё');
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

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function tickTimer() {
  if (!state.startedAt || !els.timer) return;
  els.timer.textContent = formatTime(Date.now() - state.startedAt);
}

function startTimer() {
  window.clearInterval(state.timerId);
  state.startedAt = Date.now();
  tickTimer();
  state.timerId = window.setInterval(tickTimer, 1000);
}

function startMode(mode) {
  const deck = tasks[mode] || [];
  if (!deck.length) return;

  state.mode = mode;
  state.deck = shuffle(deck);
  state.index = 0;
  state.streak = 0;
  state.locked = false;
  els.modeScreen.classList.add('hidden');
  els.trainerScreen.classList.remove('hidden');
  startTimer();
  renderTask();
}

function showModes(event) {
  if (event) event.preventDefault();
  els.trainerScreen.classList.add('hidden');
  els.modeScreen.classList.remove('hidden');
  state.locked = false;
  window.clearTimeout(showModes.nextTimer);
  window.clearInterval(state.timerId);
}

function updateStreakVisual() {
  const pill = els.streakPill;
  if (!pill) return;

  pill.classList.remove('streak-1', 'streak-2', 'streak-3', 'streak-4', 'streak-5');

  if (state.streak >= 25) pill.classList.add('streak-5');
  else if (state.streak >= 20) pill.classList.add('streak-4');
  else if (state.streak >= 15) pill.classList.add('streak-3');
  else if (state.streak >= 10) pill.classList.add('streak-2');
  else if (state.streak >= 5) pill.classList.add('streak-1');
}

function updateHeader() {
  els.currentMode.textContent = modeMeta[state.mode]?.title || 'Тренировка';
  els.streak.textContent = state.streak;
  updateStreakVisual();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function focusMaskedToken(masked) {
  const parts = String(masked).split(/\s+/).filter(Boolean);
  const target = parts.find((part) => part.includes('_')) || masked;
  return target.replace(/^[()«»"'.,;:!?—-]+|[()«»"'.,;:!?—-]+$/g, '');
}

function renderMaskedWord(masked) {
  const focused = focusMaskedToken(masked);
  const escaped = escapeHtml(focused);
  els.maskedWord.innerHTML = escaped.replace('_', '<span class="blank-slot" aria-label="пропуск">_</span>');
}

function buildChoices(task) {
  const base = Array.isArray(task.choices) && task.choices.length ? task.choices : [task.answer, 'е'];
  const unique = [];

  [task.answer, ...base].forEach((choice) => {
    if (!unique.some((existing) => normalize(existing) === normalize(choice))) {
      unique.push(choice);
    }
  });

  return shuffle(unique.slice(0, 2));
}

function renderChoices(task) {
  els.choices.innerHTML = '';
  els.choices.classList.add('two-choices');

  buildChoices(task).forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    button.textContent = choice;
    button.addEventListener('click', () => submitAnswer(choice, button));
    els.choices.append(button);
  });
}

function applyWordSize(masked) {
  const focused = focusMaskedToken(masked);
  const compactLength = focused.replace(/\s+/g, '').length;
  els.maskedWord.className = 'masked-word enter';
  els.maskedWord.style.fontSize = '';

  if (compactLength >= 18) {
    els.maskedWord.classList.add('xxlong');
  } else if (compactLength >= 14) {
    els.maskedWord.classList.add('xlong');
  } else if (compactLength >= 10) {
    els.maskedWord.classList.add('long');
  }
}

function fitWordToLine() {
  const word = els.maskedWord;
  if (!word || !word.parentElement) return;

  word.style.fontSize = '';
  const availableWidth = word.parentElement.clientWidth - 6;
  let size = Number.parseFloat(getComputedStyle(word).fontSize);
  const minSize = 30;

  while (word.scrollWidth > availableWidth && size > minSize) {
    size -= 1;
    word.style.fontSize = `${size}px`;
  }
}

function renderTask() {
  const task = currentTask();
  state.locked = false;
  els.successBanner.classList.add('hidden');
  els.result.classList.add('hidden');
  els.result.textContent = '';
  renderMaskedWord(task.masked);
  applyWordSize(task.masked);
  window.requestAnimationFrame(fitWordToLine);
  renderChoices(task);
  updateHeader();
  tickTimer();
  window.setTimeout(() => els.maskedWord.classList.remove('enter'), 180);
}

function submitAnswer(rawAnswer, button) {
  if (state.locked) return;

  const task = currentTask();
  const isCorrect = normalize(rawAnswer) === normalize(task.answer);
  state.locked = true;

  els.choices.querySelectorAll('.choice-button').forEach((choiceButton) => {
    choiceButton.disabled = true;
  });

  if (isCorrect) {
    state.streak += 1;
    if (state.streak > getBest(state.mode)) setBest(state.mode, state.streak);
    button.classList.add('correct');
    updateHeader();
    showModes.nextTimer = window.setTimeout(nextTask, 430);
    return;
  }

  state.streak = 0;
  els.result.textContent = `Правильно: ${task.original}`;
  els.result.classList.remove('hidden');
  updateHeader();
  window.setTimeout(nextTask, 850);
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

window.addEventListener('resize', fitWordToLine);
els.modeButtons.forEach((button) => button.addEventListener('click', () => startMode(button.dataset.mode)));
els.backTop.addEventListener('click', showModes);
