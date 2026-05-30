import { modeMeta, tasks } from './data.js';

const state = {
  mode: null,
  deck: [],
  index: 0,
  streak: 0,
  locked: false
};

const els = {
  modeScreen: document.querySelector('#mode-screen'),
  trainerScreen: document.querySelector('#trainer-screen'),
  modeButtons: document.querySelectorAll('[data-mode]'),
  currentMode: document.querySelector('#current-mode'),
  streak: document.querySelector('#streak'),
  maskedWord: document.querySelector('#masked-word'),
  result: document.querySelector('#result-message'),
  choices: document.querySelector('#choice-row'),
  skip: document.querySelector('#skip-button'),
  changeMode: document.querySelector('#change-mode'),
  backTop: document.querySelector('#back-top'),
  successBanner: document.querySelector('#success-banner')
};

const singleChoices = ['е', 'и', 'о', 'а', 'ы', 'ё', 'у', 'ю', 'ъ', 'ь'];
const multiChoices = ['енн', 'анн', 'янн', 'ем', 'им', 'ущ', 'ющ', 'ащ', 'ящ'];

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

function buildChoices(answer) {
  const normalizedAnswer = normalize(answer);
  const source = normalizedAnswer.length > 1 ? multiChoices : singleChoices;
  const pool = new Set([answer]);

  while (pool.size < 3) {
    const candidate = source[Math.floor(Math.random() * source.length)];
    if (normalize(candidate) !== normalizedAnswer) {
      pool.add(candidate);
    }
  }

  return shuffle([...pool]);
}

function renderChoices(answer) {
  els.choices.innerHTML = '';

  buildChoices(answer).forEach((choice) => {
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
  renderChoices(task.answer);
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

function skipTask() {
  state.streak = 0;
  nextTask();
}

els.modeButtons.forEach((button) => button.addEventListener('click', () => startMode(button.dataset.mode)));
els.skip.addEventListener('click', skipTask);
els.changeMode.addEventListener('click', showModes);
els.backTop.addEventListener('click', showModes);
