const { z } = require('zod');
const { createOrganizationSchema, updateOrganizationSchema } = require('./organization');
const {
  assignAssetSchema,
  acceptAssignmentSchema,
  rejectAssignmentSchema,
  returnAssetSchema,
  transferAssetSchema,
} = require('./assignment');
const { loginSchema, signupSchema, signupOrgSchema, forgotPasswordSchema } = require('./auth');

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

module.exports = {
  paginationSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  assignAssetSchema,
  acceptAssignmentSchema,
  rejectAssignmentSchema,
  returnAssetSchema,
  transferAssetSchema,
  loginSchema,
  signupSchema,
  signupOrgSchema,
  forgotPasswordSchema,
};
