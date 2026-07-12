module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    }
  }
};