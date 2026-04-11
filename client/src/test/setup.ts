import '@testing-library/jest-dom';

// Polyfill import.meta.env for Vite modules running under Jest
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_BASE_URL: 'http://localhost:4000/api/v1',
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false,
      },
    },
  },
  writable: true,
});
