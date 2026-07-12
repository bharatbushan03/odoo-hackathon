// Mock dependencies before importing app
jest.mock('../../src/config/database');
jest.mock('../../src/config/logger');

// Import the actual app
const app = require('../../src/app');

module.exports = app;
