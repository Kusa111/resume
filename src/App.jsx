import { useMemo, useState } from 'react';
import { paronymDictionary } from './data/paronyms';
import { storage } from './lib/storage';
import { getTodayKey, loadTasks } from './lib/tasks';

const tabs = [
  { id: 'train', label: 'Тренировка' },
  { id: 'stats', label: 'Статистика' },
  { id: 'favorites', label: 'Избранное' },
  { id: 'review', label: 'Повторение' }
];

const getRandomIndex = (length, previousIndex = -1) => {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  while (next === previousIndex) next = Math.floor(Math.random() * length);
  return next;
};

export function App() {
  const [activeTab, setActiveTab] = useState('train');
  const [favorites, setFavorites] = useState(storage.getFavorites());
  const [statsByDate, setStatsByDate] = useState(storage.getStats());
  const [customTasks] = useState(storage.getCustomTasks());
  const tasks = useMemo(() => loadTasks(customTasks), [customTasks]);
  const [taskIndex, setTaskIndex] = useState(() => getRandomIndex(tasks.length));
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  const currentTask = tasks[taskIndex % tasks.length];
  const todayStats = statsByDate[getTodayKey()] || { solved: 0, correct: 0, wrong: 0 };
  const accuracy = todayStats.solved ? Math.round((todayStats.correct / todayStats.solved) * 100) : 0;

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
    if (!userAnswer.trim()) return;
    const normalized = userAnswer.trim().toLowerCase();
    const correct = currentTask.correct.toLowerCase();
    const isCorrect = normalized === correct;
    const info = paronymDictionary[currentTask.lemma] || {};
    addStat(isCorrect);
    setFeedback({
      isCorrect,
      correct: currentTask.correct,
      pair: `${currentTask.lemma} — ${info.pair || '—'}`,
      explanation: info.explanation || 'Краткое объяснение пока не добавлено.',
      lemma: currentTask.lemma
    });
  };

  const nextTask = () => {
    setTaskIndex((current) => getRandomIndex(tasks.length, current % tasks.length));
    setUserAnswer('');
    setFeedback(null);
  };

  const toggleFavorite = (lemma) => {
    const next = favorites.includes(lemma) ? favorites.filter((x) => x !== lemma) : [...favorites, lemma];
    setFavorites(next);
    storage.setFavorites(next);
  };

  return (
    <div className="app-shell">
      <main className="main centered-main">
        <section className="hero-card compact-hero">
          <div>
            <span className="badge">Русский язык · задание №5</span>
            <h1>Тренажёр паронимов</h1>
            <p>Случайные задания в формате ЕГЭ: решай, получай короткое объяснение и сохраняй сложные пары.</p>
          </div>
          <div className="today-panel">
            <span>Сегодня</span>
            <strong>{todayStats.solved}</strong>
            <p>{accuracy}% точность</p>
          </div>
        </section>

        {activeTab === 'train' && <section className="panel train-panel centered-panel">
          <div className="section-head">
            <div><span className="muted">Источник</span><h2>{currentTask.source}</h2></div>
            <span className="counter">случайная подборка</span>
          </div>

          <div className="task-card">
            <p className="task-label">Выберите подходящий пароним</p>
            <p className="sentence">{currentTask.sentence}</p>
            <div className="options">
              {currentTask.options.map((option) => <button key={option} className={userAnswer === option ? 'option selected' : 'option'} onClick={() => setUserAnswer(option)}>{option}</button>)}
            </div>
            <div className="answer-bar">
              <input placeholder="Или введите ответ вручную" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} />
              <button className="primary" onClick={submitAnswer}>Проверить</button>
              <button className="secondary" onClick={nextTask}>Следующее</button>
            </div>
          </div>

          {feedback && <div className={feedback.isCorrect ? 'feedback ok' : 'feedback bad'}>
            <div><span>{feedback.isCorrect ? 'Верно' : 'Неверно'}</span><h3>Правильный ответ: {feedback.correct}</h3></div>
            <p><b>{feedback.pair}</b></p>
            <p>{feedback.explanation}</p>
            <button className="favorite-btn" onClick={() => toggleFavorite(feedback.lemma)}>{favorites.includes(feedback.lemma) ? '❤️ В избранном' : '♡ Добавить в избранное'}</button>
          </div>}
        </section>}

        {activeTab === 'stats' && <section className="panel centered-panel"><div className="section-head"><div><span className="muted">Прогресс</span><h2>Статистика по дням</h2></div></div>{Object.keys(statsByDate).length === 0 ? <Empty text="Пока нет решённых заданий." /> : <div className="stat-grid">{Object.entries(statsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, s]) => <div className="stat-card" key={date}><b>{date}</b><span>Решено: {s.solved}</span><span>Верно: {s.correct}</span><span>Ошибок: {s.wrong}</span><strong>{s.solved ? Math.round((s.correct / s.solved) * 100) : 0}%</strong></div>)}</div>}</section>}

        {activeTab === 'favorites' && <section className="panel centered-panel"><div className="section-head"><div><span className="muted">Сохранённое</span><h2>Избранные паронимы</h2></div></div>{favorites.length === 0 ? <Empty text="Сохраняй сложные пары после проверки ответа." /> : <div className="list">{favorites.map((lemma) => <div key={lemma} className="list-item"><div><b>{lemma} — {paronymDictionary[lemma]?.pair}</b><p>{paronymDictionary[lemma]?.explanation}</p></div><button className="secondary" onClick={() => toggleFavorite(lemma)}>Удалить</button></div>)}</div>}</section>}

        {activeTab === 'review' && <section className="panel centered-panel"><div className="section-head"><div><span className="muted">Карточки</span><h2>Повторение избранного</h2></div></div>{favorites.length === 0 ? <Empty text="В избранном пока нет паронимов." /> : <div className="review-card"><span>{(reviewIndex % favorites.length) + 1} / {favorites.length}</span><h3>{favorites[reviewIndex % favorites.length]}</h3><details><summary>Показать значение</summary><p>{paronymDictionary[favorites[reviewIndex % favorites.length]]?.explanation}</p></details><button className="primary" onClick={() => setReviewIndex((i) => i + 1)}>Следующая карточка</button></div>}</section>}
      </main>

      <nav className="mobile-nav site-nav">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav>
    </div>
  );
}

function Empty({ text }) { return <div className="empty"><p>{text}</p></div>; }
