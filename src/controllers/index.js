const {
  organizationService,
  assignmentService,
  notificationService,
} = require('../services');

const OrganizationController = require('./organizationController');
const AssignmentController = require('./assignmentController');
const NotificationController = require('./notificationController');

const organizationController = new OrganizationController(organizationService);
const assignmentController = new AssignmentController(assignmentService);
const notificationController = new NotificationController(notificationService);

module.exports = {
  OrganizationController,
  organizationController,
  AssignmentController,
  assignmentController,
  NotificationController,
  notificationController,
};
