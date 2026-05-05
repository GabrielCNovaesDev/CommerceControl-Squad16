import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/controllers/**/*.ts',
    'src/middlewares/**/*.ts',
    '!src/server.ts',
  ],
  coverageThreshold: {
    global: {},
    './src/services/financeService.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  clearMocks: true,
};

module.exports = config;
