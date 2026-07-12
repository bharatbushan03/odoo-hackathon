const {
  OrganizationRepository,
  AssignmentRepository,
  NotificationRepository,
  DashboardRepository,
} = require('../repositories');

const OrganizationService = require('./organizationService');
const AssignmentService = require('./assignmentService');
const NotificationService = require('./notificationService');
const DashboardService = require('./dashboardService');

const organizationRepository = new OrganizationRepository();
const organizationService = new OrganizationService(organizationRepository);

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);

const assignmentRepository = new AssignmentRepository();
const assignmentService = new AssignmentService(assignmentRepository, notificationService);

const dashboardRepository = new DashboardRepository();
const dashboardService = new DashboardService(dashboardRepository);

module.exports = {
  OrganizationService,
  organizationService,
  NotificationService,
  notificationService,
  AssignmentService,
  assignmentService,
  DashboardService,
  dashboardService,
};
