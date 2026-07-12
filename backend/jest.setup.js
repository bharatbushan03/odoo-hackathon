// Set environment to test
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Extend jest matchers
require('jest-extended');

// Increase timeout for async operations
jest.setTimeout(30000);