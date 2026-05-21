import { paronymDictionary, seedTasks } from '../data/paronyms';

export const getTodayKey = () => new Date().toISOString().slice(0, 10);

export const generateTask = () => {
  const lemmas = Object.keys(paronymDictionary);
  const lemma = lemmas[Math.floor(Math.random() * lemmas.length)];
  const pair = paronymDictionary[lemma].pair;
  const [a, b] = Math.random() > 0.5 ? [lemma, pair] : [pair, lemma];
  const correct = Math.random() > 0.5 ? a : b;

  return {
    id: `g-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    source: 'Автогенерация (словник паронимов)',
    sentence: `Выберите пароним: «Вставьте подходящее слово в контекст: ____ употреблён(о) в нормативном значении».`,
    options: [a, b],
    correct,
    lemma
  };
};

export const loadTasks = (customTasks) => [...seedTasks, ...customTasks];
