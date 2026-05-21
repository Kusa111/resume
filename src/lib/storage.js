const read = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const storage = {
  getFavorites: () => read('favorites', []),
  setFavorites: (v) => write('favorites', v),
  getStats: () => read('statsByDate', {}),
  setStats: (v) => write('statsByDate', v),
  getCustomTasks: () => read('customTasks', []),
  setCustomTasks: (v) => write('customTasks', v)
};
