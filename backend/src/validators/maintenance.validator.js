const { body, param, query } = require('express-validator');

const TYPES = ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'PREDICTIVE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['REQUESTED', 'PENDING', 'APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const FREQUENCIES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'CUSTOM'];

const create = [
  body('assetId').isUUID().withMessage('Valid asset ID is required'),
  body('type').optional().isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(', ')}`),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  body('scheduledDate').optional().isISO8601().withMessage('Scheduled date must be a valid date'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('technicianId').optional().isUUID().withMessage('Valid technician ID is required'),
  body('vendorId').optional().isUUID().withMessage('Valid vendor ID is required'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be a positive number'),
  body('issue').optional().trim(),
  body('notes').optional().trim(),
  body('isRecurring').optional().isBoolean(),
  body('frequency').optional().isIn(FREQUENCIES).withMessage(`Frequency must be one of: ${FREQUENCIES.join(', ')}`),
];

const update = [
  param('id').isUUID().withMessage('Valid maintenance ID is required'),
  body('type').optional().isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(', ')}`),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  body('scheduledDate').optional({ values: 'null' }).isISO8601().withMessage('Scheduled date must be a valid date'),
  body('startDate').optional({ values: 'null' }).isISO8601().withMessage('Start date must be a valid date'),
  body('technicianId').optional({ values: 'null' }).isUUID().withMessage('Valid technician ID is required'),
  body('vendorId').optional({ values: 'null' }).isUUID().withMessage('Valid vendor ID is required'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be a positive number'),
  body('laborCost').optional().isFloat({ min: 0 }).withMessage('Labor cost must be a positive number'),
  body('partsCost').optional().isFloat({ min: 0 }).withMessage('Parts cost must be a positive number'),
  body('vendorCost').optional().isFloat({ min: 0 }).withMessage('Vendor cost must be a positive number'),
  body('issue').optional().trim(),
  body('resolution').optional().trim(),
  body('partsUsed').optional().trim(),
  body('notes').optional().trim(),
  body('isRecurring').optional().isBoolean(),
  body('frequency').optional({ values: 'null' }).isIn(FREQUENCIES).withMessage(`Frequency must be one of: ${FREQUENCIES.join(', ')}`),
];

const updateStatus = [
  param('id').isUUID().withMessage('Valid maintenance ID is required'),
  body('status').isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('resolution').optional().trim(),
  body('partsUsed').optional().trim(),
  body('laborCost').optional().isFloat({ min: 0 }),
  body('partsCost').optional().isFloat({ min: 0 }),
  body('vendorCost').optional().isFloat({ min: 0 }),
];

const assignTechnician = [
  param('id').isUUID().withMessage('Valid maintenance ID is required'),
  body('technicianId').isUUID().withMessage('Valid technician ID is required'),
];

const addAttachment = [
  param('id').isUUID().withMessage('Valid maintenance ID is required'),
  body('fileName').trim().notEmpty().withMessage('File name is required'),
  body('filePath').trim().notEmpty().withMessage('File path is required'),
  body('fileType').trim().notEmpty().withMessage('File type is required'),
  body('fileSize').isInt({ min: 0 }).withMessage('File size must be a positive integer'),
];

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  query('type').optional().isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(', ')}`),
  query('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  query('assetId').optional().isUUID(),
  query('technicianId').optional().isUUID(),
  query('vendorId').optional().isUUID(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('search').optional().trim(),
];

const createVendor = [
  body('name').trim().notEmpty().withMessage('Vendor name is required'),
  body('contactPerson').optional().trim(),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('isPreferred').optional().isBoolean(),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('notes').optional().trim(),
];

const updateVendor = [
  param('id').isUUID().withMessage('Valid vendor ID is required'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('contactPerson').optional().trim(),
  body('email').optional({ values: 'null' }).isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('isPreferred').optional().isBoolean(),
  body('isActive').optional().isBoolean(),
  body('rating').optional({ values: 'null' }).isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('notes').optional().trim(),
];

module.exports = { create, update, updateStatus, assignTechnician, addAttachment, list, createVendor, updateVendor };
