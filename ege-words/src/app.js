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
  timer: document.querySelector('#timer'),
  maskedWord: document.querySelector('#masked-word'),
  result: document.querySelector('#result-message'),
  choices: document.querySelector('#choice-row'),
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

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function startTimer() {
  window.clearInterval(state.timerId);
  state.startedAt = Date.now();
  els.timer.textContent = '00:00';
  state.timerId = window.setInterval(() => {
    els.timer.textContent = formatTime(Date.now() - state.startedAt);
  }, 1000);
}

function startMode(mode) {
  state.mode = mode;
  state.deck = shuffle(tasks[mode]);
  state.index = 0;
  state.streak = 0;
  state.locked = false;
  els.modeScreen.classList.add('hidden');
  els.trainerScreen.classList.remove('hidden');
  startTimer();
  renderTask();
}

function showModes() {
  els.trainerScreen.classList.add('hidden');
  els.modeScreen.classList.remove('hidden');
  state.locked = false;
  window.clearTimeout(showModes.nextTimer);
  window.clearInterval(state.timerId);
}

function updateHeader() {
  els.currentMode.textContent = modeMeta[state.mode].title;
  els.streak.textContent = state.streak;
}

function buildChoices(task) {
  const choices = Array.isArray(task.choices) && task.choices.length ? task.choices : [task.answer, 'е', 'и'];
  const unique = [];

  choices.forEach((choice) => {
    if (!unique.some((existing) => normalize(existing) === normalize(choice))) {
      unique.push(choice);
    }
  });

  if (!unique.some((choice) => normalize(choice) === normalize(task.answer))) {
    unique.unshift(task.answer);
  }

  return shuffle(unique).slice(0, 3);
}

function renderChoices(task) {
  els.choices.innerHTML = '';
  const choices = buildChoices(task);
  els.choices.classList.toggle('two-choices', choices.length === 2);

  choices.forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    button.textContent = choice;
    button.addEventListener('click', () => submitAnswer(choice, button));
    els.choices.append(button);
  });
}

function renderTask() {
  const task = currentTask();
  state.locked = false;
  els.successBanner.classList.add('hidden');
  els.result.classList.add('hidden');
  els.result.textContent = '';
  els.maskedWord.textContent = task.masked;
  els.maskedWord.className = 'masked-word enter';
  renderChoices(task);
  updateHeader();
  window.setTimeout(() => els.maskedWord.classList.remove('enter'), 260);
}

function submitAnswer(rawAnswer, button) {
  if (state.locked) return;

  const task = currentTask();
  const isCorrect = normalize(rawAnswer) === normalize(task.answer);
  state.locked = true;

  document.querySelectorAll('.choice-button').forEach((choiceButton) => {
    choiceButton.disabled = true;
  });

  if (isCorrect) {
    state.streak += 1;
    if (state.streak > getBest(state.mode)) setBest(state.mode, state.streak);
    button.classList.add('correct');
    els.successBanner.textContent = `✓ ${task.original}`;
    els.successBanner.classList.remove('hidden');
    updateHeader();
    showModes.nextTimer = window.setTimeout(nextTask, 520);
    return;
  }

  state.streak = 0;
  button.classList.add('wrong');
  els.result.textContent = `Правильно: ${task.original}`;
  els.result.classList.remove('hidden');
  updateHeader();
  window.setTimeout(nextTask, 1050);
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

els.modeButtons.forEach((button) => button.addEventListener('click', () => startMode(button.dataset.mode)));
els.backTop.addEventListener('click', showModes);
