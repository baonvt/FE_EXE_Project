// Small localStorage wrapper to centralize JSON parsing/stringifying
export const setItem = (key, value) => {
  try {
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, v);
  } catch (err) {
    console.warn('storage.setItem failed', err);
  }
};

export const getItem = (key, defaultValue = null) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch (e) {
      // not JSON, return raw
      return raw;
    }
  } catch (err) {
    console.warn('storage.getItem failed', err);
    return defaultValue;
  }
};

export const removeItem = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn('storage.removeItem failed', err);
  }
};

export default { setItem, getItem, removeItem };
