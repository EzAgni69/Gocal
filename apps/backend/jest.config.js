const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'backend',
  rootDir: '.',
  testEnvironment: 'node',
  // Run tests serially to prevent mock contamination between test suites
  // that use jest.mock() with module-level mocks (e.g. adminVendorRoutes.test.ts)
  maxWorkers: 1,
};
