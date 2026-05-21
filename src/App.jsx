import { useMemo, useState } from 'react';
import { paronymDictionary } from './data/paronyms';
import { storage } from './lib/storage';
import { generateTask, getTodayKey, loadTasks } from './lib/tasks';

const tabs = ['Тренировка', 'Статистика', 'Избранное', 'Повторение'];

export function App() {
  const [activeTab, setActiveTab] = useState('Тренировка');
  const [favorites, setFavorites] = useState(storage.getFavorites());
  const [statsByDate, setStatsByDate] = useState(storage.getStats());
  const [customTasks, setCustomTasks] = useState(storage.getCustomTasks());
  const [taskIndex, setTaskIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  const tasks = useMemo(() => loadTasks(customTasks), [customTasks]);
  const currentTask = tasks[taskIndex % tasks.length];

  const addStat = (isCorrect) => {
    const key = getTodayKey();
    const prev = statsByDate[key] || { solved: 0, correct: 0, wrong: 0 };
    const next = {
      ...statsByDate,
      [key]: {
        solved: prev.solved + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1)
      }
    };
    setStatsByDate(next);
    storage.setStats(next);
  };

  const submitAnswer = () => {
    const normalized = userAnswer.trim().toLowerCase();
    const correct = currentTask.correct.toLowerCase();
    const isCorrect = normalized === correct;
    addStat(isCorrect);

    const explanation = paronymDictionary[currentTask.lemma]?.explanation || 'Краткое объяснение пока не добавлено.';
    const pairWord = paronymDictionary[currentTask.lemma]?.pair || '—';

    setFeedback({ isCorrect, correct: currentTask.correct, pair: `${currentTask.lemma} — ${pairWord}`, explanation, lemma: currentTask.lemma });
  };

  const nextTask = () => {
    setTaskIndex((i) => i + 1);
    setUserAnswer('');
    setFeedback(null);
  };

  const toggleFavorite = (lemma) => {
    const next = favorites.includes(lemma) ? favorites.filter((x) => x !== lemma) : [...favorites, lemma];
    setFavorites(next);
    storage.setFavorites(next);
  };

  const addCustomTask = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const lemma = form.get('lemma').toString().trim().toLowerCase();
    const correct = form.get('correct').toString().trim().toLowerCase();
    const wrong = form.get('wrong').toString().trim().toLowerCase();
    const sentence = form.get('sentence').toString().trim();
    if (!lemma || !correct || !wrong || !sentence) return;

    const task = { id: `c-${Date.now()}`, source: 'Ручное добавление', sentence, options: [correct, wrong], correct, lemma };
    const next = [...customTasks, task];
    setCustomTasks(next);
    storage.setCustomTasks(next);
    e.currentTarget.reset();
  };

  return <div className="app">{activeTab==='Тренировка' && <section className="card"><h1>ЕГЭ-2026: Задание №5 (паронимы)</h1><p>{currentTask.sentence}</p><div className="options">{currentTask.options.map((o)=><button key={o} className={userAnswer===o?'selected':''} onClick={()=>setUserAnswer(o)}>{o}</button>)}</div><input placeholder="Или введите ответ" value={userAnswer} onChange={(e)=>setUserAnswer(e.target.value)} /> <button onClick={submitAnswer}>Проверить</button> <button onClick={nextTask}>Следующее</button><small>Источник: {currentTask.source}. Подгрузка «свежих» заданий выполняется через ручное добавление или API-адаптер.</small>{feedback && <div className={`feedback ${feedback.isCorrect?'ok':'bad'}`}><h3>{feedback.isCorrect?'Верно':'Неверно'}</h3><p>Правильный ответ: <b>{feedback.correct}</b></p><p>Пара паронимов: <b>{feedback.pair}</b></p><p>{feedback.explanation}</p><button onClick={()=>toggleFavorite(feedback.lemma)}>{favorites.includes(feedback.lemma)?'❤️ Убрать':'🤍 В избранное'}</button></div>}<form onSubmit={addCustomTask} className="inline-form"><h3>Добавить новое задание вручную</h3><input name="sentence" placeholder="Формулировка задания"/><input name="lemma" placeholder="Лемма (напр. стеклянный)"/><input name="correct" placeholder="Правильный вариант"/><input name="wrong" placeholder="Неправильный пароним"/><button type="submit">Добавить</button><button type="button" onClick={()=>setCustomTasks((prev)=>{const next=[...prev, generateTask()]; storage.setCustomTasks(next); return next;})}>+ Сгенерировать задание</button></form></section>}

{activeTab==='Статистика' && <section className="card"><h2>Статистика по датам</h2>{Object.keys(statsByDate).length===0?<p>Пока нет данных.</p>:Object.entries(statsByDate).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,s])=>{const pct=s.solved?Math.round((s.correct/s.solved)*100):0; return <div key={date} className="stat-row"><b>{date}</b><span>Решено: {s.solved}</span><span>Верно: {s.correct}</span><span>Ошибок: {s.wrong}</span><span>{pct}%</span></div>;})}</section>}

{activeTab==='Избранное' && <section className="card"><h2>Избранные паронимы</h2>{favorites.length===0?<p>Пока пусто.</p>:favorites.map((lemma)=><div key={lemma} className="fav-row"><div><b>{lemma} — {paronymDictionary[lemma]?.pair}</b><p>{paronymDictionary[lemma]?.explanation}</p></div><button onClick={()=>toggleFavorite(lemma)}>Удалить</button></div>)}</section>}

{activeTab==='Повторение' && <section className="card"><h2>Повторение (карточки)</h2>{favorites.length===0?<p>Добавьте паронимы в избранное.</p>:<div><p><b>{favorites[reviewIndex % favorites.length]}</b></p><details><summary>Показать значение</summary><p>{paronymDictionary[favorites[reviewIndex % favorites.length]]?.explanation}</p></details><button onClick={()=>setReviewIndex((i)=>i+1)}>Следующая карточка</button></div>}</section>}

<nav className="tabs">{tabs.map((t)=><button key={t} className={activeTab===t?'active':''} onClick={()=>setActiveTab(t)}>{t}</button>)}</nav></div>;
}
