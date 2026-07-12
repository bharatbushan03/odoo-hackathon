const {
  organizationService,
  assignmentService,
  notificationService,
  dashboardService,
  authService,
} = require('../services');

const OrganizationController = require('./organizationController');
const AssignmentController = require('./assignmentController');
const NotificationController = require('./notificationController');
const DashboardController = require('./dashboardController');
const AuthController = require('./authController');

const organizationController = new OrganizationController(organizationService);
const assignmentController = new AssignmentController(assignmentService);
const notificationController = new NotificationController(notificationService);
const dashboardController = new DashboardController(dashboardService);
const authController = new AuthController(authService);

module.exports = {
  OrganizationController,
  organizationController,
  AssignmentController,
  assignmentController,
  NotificationController,
  notificationController,
  DashboardController,
  dashboardController,
  AuthController,
  authController,
};
