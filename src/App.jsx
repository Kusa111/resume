import { useMemo, useState } from 'react';
import { paronymDictionary } from './data/paronyms';
import { storage } from './lib/storage';
import { generateTask, getTodayKey, loadTasks } from './lib/tasks';

const tabs = [
  { id: 'train', label: 'Тренировка' },
  { id: 'stats', label: 'Статистика' },
  { id: 'favorites', label: 'Избранное' },
  { id: 'review', label: 'Повторение' }
];

export function App() {
  const [activeTab, setActiveTab] = useState('train');
  const [favorites, setFavorites] = useState(storage.getFavorites());
  const [statsByDate, setStatsByDate] = useState(storage.getStats());
  const [customTasks, setCustomTasks] = useState(storage.getCustomTasks());
  const [taskIndex, setTaskIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  const tasks = useMemo(() => loadTasks(customTasks), [customTasks]);
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">5</div>
          <div>
            <p>ЕГЭ-2026</p>
            <strong>Паронимы</strong>
          </div>
        </div>
        <nav className="desktop-nav">
          {tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
        </nav>
      </aside>

      <main className="main">
        <section className="hero-card">
          <div>
            <span className="badge">Русский язык · задание №5</span>
            <h1>Тренажёр паронимов</h1>
            <p>Выбирай правильный пароним, сразу смотри короткое объяснение и сохраняй сложные пары для повторения.</p>
          </div>
          <div className="today-panel">
            <span>Сегодня</span>
            <strong>{todayStats.solved}</strong>
            <p>{accuracy}% точность</p>
          </div>
        </section>

        {activeTab === 'train' && <section className="panel train-panel">
          <div className="section-head">
            <div><span className="muted">Источник</span><h2>{currentTask.source}</h2></div>
            <span className="counter">{(taskIndex % tasks.length) + 1} / {tasks.length}</span>
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
            <button className="favorite-btn" onClick={() => toggleFavorite(feedback.lemma)}>{favorites.includes(feedback.lemma) ? '❤️ В избранном' : '🤍 Добавить в избранное'}</button>
          </div>}

          <form onSubmit={addCustomTask} className="add-card">
            <div><h3>Добавить своё задание</h3><p>Для новых заданий с ФИПИ, Школково или Умскул.</p></div>
            <input name="sentence" placeholder="Формулировка задания" />
            <div className="form-grid"><input name="lemma" placeholder="Лемма: стеклянный" /><input name="correct" placeholder="Правильный вариант" /><input name="wrong" placeholder="Неверный пароним" /></div>
            <div className="form-actions"><button className="secondary" type="submit">Добавить</button><button className="ghost" type="button" onClick={() => setCustomTasks((prev) => { const next = [...prev, generateTask()]; storage.setCustomTasks(next); return next; })}>Сгенерировать</button></div>
          </form>
        </section>}

        {activeTab === 'stats' && <section className="panel"><div className="section-head"><div><span className="muted">Прогресс</span><h2>Статистика по дням</h2></div></div>{Object.keys(statsByDate).length === 0 ? <Empty text="Пока нет решённых заданий." /> : <div className="stat-grid">{Object.entries(statsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, s]) => <div className="stat-card" key={date}><b>{date}</b><span>Решено: {s.solved}</span><span>Верно: {s.correct}</span><span>Ошибок: {s.wrong}</span><strong>{s.solved ? Math.round((s.correct / s.solved) * 100) : 0}%</strong></div>)}</div>}</section>}

        {activeTab === 'favorites' && <section className="panel"><div className="section-head"><div><span className="muted">Сохранённое</span><h2>Избранные паронимы</h2></div></div>{favorites.length === 0 ? <Empty text="Сохраняй сложные пары после проверки ответа." /> : <div className="list">{favorites.map((lemma) => <div key={lemma} className="list-item"><div><b>{lemma} — {paronymDictionary[lemma]?.pair}</b><p>{paronymDictionary[lemma]?.explanation}</p></div><button className="secondary" onClick={() => toggleFavorite(lemma)}>Удалить</button></div>)}</div>}</section>}

        {activeTab === 'review' && <section className="panel"><div className="section-head"><div><span className="muted">Карточки</span><h2>Повторение избранного</h2></div></div>{favorites.length === 0 ? <Empty text="В избранном пока нет паронимов." /> : <div className="review-card"><span>{reviewIndex + 1} / {favorites.length}</span><h3>{favorites[reviewIndex % favorites.length]}</h3><details><summary>Показать значение</summary><p>{paronymDictionary[favorites[reviewIndex % favorites.length]]?.explanation}</p></details><button className="primary" onClick={() => setReviewIndex((i) => i + 1)}>Следующая карточка</button></div>}</section>}
      </main>

      <nav className="mobile-nav">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav>
    </div>
  );
}

function Empty({ text }) { return <div className="empty"><p>{text}</p></div>; }
