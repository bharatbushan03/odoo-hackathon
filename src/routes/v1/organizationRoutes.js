const express = require('express');
const { organizationController } = require('../../controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const upload = require('../../middleware/upload');
const { createOrganizationSchema, updateOrganizationSchema } = require('../../validators');
const { UserRole } = require('../../constants');

const router = express.Router();

router.route('/')
  .post(
    authenticate,
    authorize(UserRole.SUPER_ADMIN),
    validate(createOrganizationSchema),
    organizationController.createOrganization
  )
  .get(
    authenticate,
    authorize(UserRole.SUPER_ADMIN),
    organizationController.listOrganizations
  );

router.route('/:id')
  .get(
    authenticate,
    organizationController.getOrganization
  )
  .put(
    authenticate,
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateOrganizationSchema),
    organizationController.updateOrganization
  )
  .delete(
    authenticate,
    authorize(UserRole.SUPER_ADMIN),
    organizationController.deleteOrganization
  );

router.post(
  '/:id/logo',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  upload.single('logo'),
  organizationController.uploadLogo
);

module.exports = router;
