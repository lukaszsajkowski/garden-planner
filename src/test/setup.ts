import '@testing-library/jest-dom/vitest';

afterEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* brak localStorage w środowisku */
  }
});
