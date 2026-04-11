import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          baseUrl: '..',
          paths: {
            '@client': ['client/src'],
            '@client/*': ['client/src/*'],
            '@gradion/shared': ['shared/src/index.ts'],
            '@gradion/shared/*': ['shared/src/*'],
          },
        },
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^@faker-js/faker$': '<rootDir>/src/test/__mocks__/@faker-js/faker.ts',
    '^@client/lib/env$': '<rootDir>/src/test/__mocks__/lib/env.ts',
    '^@client/(.*)$': '<rootDir>/src/$1',
    '^@client$': '<rootDir>/src',
    '^@gradion/shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@gradion/shared$': '<rootDir>/../shared/src/index.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp|mp4|lottie)$': '<rootDir>/src/test/__mocks__/fileMock.ts',
  },
  transformIgnorePatterns: [
    'node_modules/.pnpm/[^/]+/node_modules/(?!(framer-motion|@motionone|lucide-react|@tanstack|sonner|@lottiefiles|lottie-react|@radix-ui|@faker-js)/)',
    'node_modules/(?!(\\.pnpm|framer-motion|@motionone|lucide-react|@tanstack|sonner|@lottiefiles|lottie-react|@radix-ui|@faker-js)/)',
  ],
  testMatch: ['<rootDir>/src/test/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/components/pages/**/*.{ts,tsx}',
    '!src/components/pages/**/*.types.ts',
  ],
};

export default config;
