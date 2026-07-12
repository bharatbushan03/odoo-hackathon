const { body, param, query } = require('express-validator');

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['ASSIGNMENT', 'MAINTENANCE', 'WARRANTY_EXPIRY', 'APPROVAL_REQUEST', 'APPROVED', 'REJECTED', 'SYSTEM']),
  query('isRead').optional().isBoolean().withMessage('isRead must be a boolean'),
];

const markRead = [
  param('id').isUUID().withMessage('Valid notification ID is required'),
];

const markAllRead = [
  body('type').optional().isIn(['ASSIGNMENT', 'MAINTENANCE', 'WARRANTY_EXPIRY', 'APPROVAL_REQUEST', 'APPROVED', 'REJECTED', 'SYSTEM']),
];

const remove = [
  param('id').isUUID().withMessage('Valid notification ID is required'),
];

module.exports = { list, markRead, markAllRead, remove };
