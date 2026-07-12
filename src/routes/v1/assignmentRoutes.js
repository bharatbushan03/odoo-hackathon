const express = require('express');
const { assignmentController } = require('../../controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  assignAssetSchema,
  acceptAssignmentSchema,
  rejectAssignmentSchema,
  returnAssetSchema,
  transferAssetSchema,
} = require('../../validators');
const { UserRole } = require('../../constants');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  validate(assignAssetSchema),
  assignmentController.assignAsset
);

router.post(
  '/transfer',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  validate(transferAssetSchema),
  assignmentController.transferAsset
);

router.get(
  '/history',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN),
  assignmentController.getHistory
);

router.post(
  '/:id/accept',
  authenticate,
  validate(acceptAssignmentSchema),
  assignmentController.acceptAssignment
);

router.post(
  '/:id/reject',
  authenticate,
  validate(rejectAssignmentSchema),
  assignmentController.rejectAssignment
);

router.post(
  '/:id/return',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  validate(returnAssetSchema),
  assignmentController.returnAsset
);

module.exports = router;
