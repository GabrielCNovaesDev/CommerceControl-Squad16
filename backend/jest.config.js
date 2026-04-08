module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/controllers/**/*.js',
    'src/middlewares/**/*.js',
    '!src/server.js',
  ],
  coverageThreshold: {
    './src/services/financeService.js': {
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
