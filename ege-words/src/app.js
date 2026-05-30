import { modeMeta, tasks } from './data.js';

const state = {
  mode: null,
  deck: [],
  index: 0,
  streak: 0,
  solved: 0,
  locked: false,
  selectedAnswer: ''
};

const els = {
  modeScreen: document.querySelector('#mode-screen'),
  trainerScreen: document.querySelector('#trainer-screen'),
  modeButtons: document.querySelectorAll('[data-mode]'),
  currentMode: document.querySelector('#current-mode'),
  solved: document.querySelector('#solved-count'),
  streak: document.querySelector('#streak'),
  bestStreak: document.querySelector('#best-streak'),
  wordCard: document.querySelector('#word-card'),
  maskedWord: document.querySelector('#masked-word'),
  context: document.querySelector('#context'),
  result: document.querySelector('#result-message'),
  form: document.querySelector('#answer-form'),
  input: document.querySelector('#answer-input'),
  choices: document.querySelector('#choice-row'),
  check: document.querySelector('#check-button'),
  next: document.querySelector('#next-button'),
  skip: document.querySelector('#skip-button'),
  changeMode: document.querySelector('#change-mode'),
  backTop: document.querySelector('#back-top')
};

const commonChoices = ['е', 'и', 'о', 'а', 'ы', 'ъ', 'ь', 'ё', 'ю'];
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
  state.selectedAnswer = '';
  els.modeScreen.classList.add('hidden');
  els.trainerScreen.classList.remove('hidden');
  renderTask();
}

function showModes() {
  els.trainerScreen.classList.add('hidden');
  els.modeScreen.classList.remove('hidden');
  state.locked = false;
  clearTimeout(showModes.nextTimer);
}

function updateCounters() {
  els.currentMode.textContent = modeMeta[state.mode].title;
  els.solved.textContent = state.solved;
  els.streak.textContent = state.streak;
  els.bestStreak.textContent = getBest(state.mode);
}

function buildChoices(answer) {
  const pool = new Set([answer]);
  const candidates = answer.length > 1 ? ['енн', 'анн', 'янн', 'ем', 'им', 'ущ', 'ющ'] : commonChoices;
  while (pool.size < Math.min(6, candidates.length)) {
    pool.add(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  return shuffle([...pool]).slice(0, 6);
}

function renderTask() {
  const task = currentTask();
  state.locked = false;
  state.selectedAnswer = '';
  els.wordCard.className = 'word-card bump';
  els.maskedWord.textContent = task.masked;
  els.context.textContent = task.hint || '';
  els.context.classList.toggle('hidden', !task.hint);
  els.result.classList.add('hidden');
  els.result.textContent = '';
  els.input.value = '';
  els.input.disabled = false;
  els.check.disabled = false;
  els.next.classList.add('hidden');
  els.skip.classList.remove('hidden');
  renderChoices(task.answer);
  updateCounters();
  window.setTimeout(() => els.wordCard.classList.remove('bump'), 380);
  window.setTimeout(() => els.input.focus({ preventScroll: true }), 80);
}

function renderChoices(answer) {
  els.choices.innerHTML = '';
  buildChoices(answer).forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    button.textContent = choice;
    button.addEventListener('click', () => {
      if (state.locked) return;
      state.selectedAnswer = choice;
      els.input.value = choice;
      document.querySelectorAll('.choice-button').forEach((btn) => btn.classList.remove('selected'));
      button.classList.add('selected');
      submitAnswer(choice);
    });
    els.choices.append(button);
  });
}

function submitAnswer(rawAnswer = els.input.value) {
  if (state.locked) return;
  const task = currentTask();
  const answer = normalize(rawAnswer);
  if (!answer) return;

  state.locked = true;
  els.input.disabled = true;
  els.check.disabled = true;
  state.solved += 1;

  const isCorrect = answer === normalize(task.answer);
  if (isCorrect) {
    state.streak += 1;
    if (state.streak > getBest(state.mode)) setBest(state.mode, state.streak);
    els.wordCard.classList.add('ok');
    els.result.textContent = `Верно: ${task.original}`;
    els.result.classList.remove('hidden');
    updateCounters();
    showModes.nextTimer = window.setTimeout(nextTask, 620);
    return;
  }

  state.streak = 0;
  els.wordCard.classList.add('bad');
  els.result.textContent = `Правильный ответ: «${task.answer}» · ${task.original}`;
  els.result.classList.remove('hidden');
  els.next.classList.remove('hidden');
  els.skip.classList.add('hidden');
  updateCounters();
}

function nextTask() {
  clearTimeout(showModes.nextTimer);
  state.index += 1;
  if (state.index >= state.deck.length) {
    state.deck = shuffle(tasks[state.mode]);
    state.index = 0;
  }
  renderTask();
}

function skipTask() {
  if (state.locked) return;
  state.streak = 0;
  state.solved += 1;
  nextTask();
}

els.modeButtons.forEach((button) => button.addEventListener('click', () => startMode(button.dataset.mode)));
els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitAnswer();
});
els.next.addEventListener('click', nextTask);
els.skip.addEventListener('click', skipTask);
els.changeMode.addEventListener('click', showModes);
els.backTop.addEventListener('click', showModes);
