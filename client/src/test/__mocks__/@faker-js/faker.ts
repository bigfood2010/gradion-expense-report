// CJS-compatible faker shim for Jest (avoids ESM-only @faker-js/faker v10 issues)
let _counter = 0;
const uid = () => `${++_counter}-${Math.random().toString(36).slice(2, 10)}`;

export const faker = {
  string: {
    uuid: () =>
      `xxxxxxxx-xxxx-4xxx-yxxx-${uid()}`.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }),
  },
  internet: {
    email: () => `user-${uid()}@example.com`,
  },
  person: {
    fullName: () => `User ${uid()}`,
  },
  commerce: {
    productName: () => `Product ${uid()}`,
  },
};
