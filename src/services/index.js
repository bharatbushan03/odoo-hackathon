const {
  OrganizationRepository,
  AssignmentRepository,
  NotificationRepository,
} = require('../repositories');

const OrganizationService = require('./organizationService');
const AssignmentService = require('./assignmentService');
const NotificationService = require('./notificationService');

const organizationRepository = new OrganizationRepository();
const organizationService = new OrganizationService(organizationRepository);

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);

const assignmentRepository = new AssignmentRepository();
const assignmentService = new AssignmentService(assignmentRepository, notificationService);

module.exports = {
  OrganizationService,
  organizationService,
  NotificationService,
  notificationService,
  AssignmentService,
  assignmentService,
};
