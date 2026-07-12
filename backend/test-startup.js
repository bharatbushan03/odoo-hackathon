#!/usr/bin/env node
/**
 * Module Load Test Script
 * 
 * This script verifies that all key modules can be loaded without errors.
 * It tests routes, controllers, middleware, and configuration files.
 * 
 * Exit codes:
 *   0 - All modules loaded successfully
 *   1 - One or more modules failed to load
 */

require('dotenv').config();

const path = require('path');

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

/**
 * Test if a module can be loaded
 */
function testModule(modulePath, description) {
  totalTests++;
  try {
    require(modulePath);
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${description}`);
    return true;
  } catch (error) {
    failedTests++;
    const errorMessage = `${description}: ${error.message}`;
    failures.push(errorMessage);
    console.log(`${colors.red}✗${colors.reset} ${errorMessage}`);
    if (process.env.VERBOSE) {
      console.log(`  ${colors.yellow}Stack: ${error.stack}${colors.reset}`);
    }
    return false;
  }
}

console.log(`${colors.blue}=== Module Load Test ===${colors.reset}\n`);

// Test database configuration
console.log(`${colors.blue}Testing Database Configuration...${colors.reset}`);
testModule('./src/config/database.js', 'Database config');
testModule('./src/config/jwt.js', 'JWT config');
testModule('./src/config/prisma.js', 'Prisma config');
console.log();

// Test middleware
console.log(`${colors.blue}Testing Middleware...${colors.reset}`);
testModule('./src/middleware/auth.js', 'Auth middleware');
testModule('./src/middleware/errorHandler.js', 'Error handler middleware');
testModule('./src/middleware/rateLimiter.js', 'Rate limiter middleware');
testModule('./src/middleware/validate.js', 'Validation middleware');
console.log();

// Test controllers
console.log(`${colors.blue}Testing Controllers...${colors.reset}`);
testModule('./src/controllers/allocationController.js', 'Allocation controller');
testModule('./src/controllers/assetCategoryController.js', 'Asset category controller');
testModule('./src/controllers/assetController.js', 'Asset controller');
testModule('./src/controllers/audit.controller.js', 'Audit controller');
testModule('./src/controllers/auth.controller.js', 'Auth controller');
testModule('./src/controllers/dashboardController.js', 'Dashboard controller');
testModule('./src/controllers/departmentController.js', 'Department controller');
testModule('./src/controllers/maintenance.controller.js', 'Maintenance controller');
testModule('./src/controllers/notification.controller.js', 'Notification controller');
testModule('./src/controllers/orgController.js', 'Organization controller');
testModule('./src/controllers/vendorController.js', 'Vendor controller');
console.log();

// Test routes
console.log(`${colors.blue}Testing Routes...${colors.reset}`);
testModule('./src/routes/allocationRoutes.js', 'Allocation routes');
testModule('./src/routes/assetCategoryRoutes.js', 'Asset category routes');
testModule('./src/routes/assetRoutes.js', 'Asset routes');
testModule('./src/routes/audit.routes.js', 'Audit routes');
testModule('./src/routes/auth.routes.js', 'Auth routes');
testModule('./src/routes/dashboardRoutes.js', 'Dashboard routes');
testModule('./src/routes/departmentRoutes.js', 'Department routes');
testModule('./src/routes/maintenance.routes.js', 'Maintenance routes');
testModule('./src/routes/notification.routes.js', 'Notification routes');
testModule('./src/routes/orgRoutes.js', 'Organization routes');
testModule('./src/routes/vendor.routes.js', 'Vendor routes');
testModule('./src/routes/index.js', 'Main routes index');
console.log();

// Test repositories
console.log(`${colors.blue}Testing Repositories...${colors.reset}`);
testModule('./src/repositories/employee.repository.js', 'Employee repository');
testModule('./src/repositories/maintenance.repository.js', 'Maintenance repository');
testModule('./src/repositories/maintenanceAttachment.repository.js', 'Maintenance attachment repository');
testModule('./src/repositories/notification.repository.js', 'Notification repository');
testModule('./src/repositories/organization.repository.js', 'Organization repository');
testModule('./src/repositories/refreshToken.repository.js', 'Refresh token repository');
testModule('./src/repositories/vendor.repository.js', 'Vendor repository');
console.log();

// Test services
console.log(`${colors.blue}Testing Services...${colors.reset}`);
testModule('./src/services/assetCategoryRepository.js', 'Asset category repository');
testModule('./src/services/assetService.js', 'Asset service');
testModule('./src/services/auth.service.js', 'Auth service');
console.log();

// Print summary
console.log(`${colors.blue}=== Test Summary ===${colors.reset}`);
console.log(`Total tests: ${totalTests}`);
console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

if (failedTests > 0) {
  console.log(`\n${colors.red}Failed modules:${colors.reset}`);
  failures.forEach((failure, index) => {
    console.log(`  ${index + 1}. ${failure}`);
  });
  console.log(`\n${colors.yellow}Tip: Run with VERBOSE=true for detailed error output${colors.reset}`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}✓ All modules loaded successfully!${colors.reset}`);
  console.log(`${colors.green}✓ Application is ready to start${colors.reset}`);
  process.exit(0);
}
