const { z } = require('zod');

const createOrganizationSchema = z.object({
  name: z.string({
    required_error: 'Organization name is required',
  }).trim().min(1, 'Organization name must be at least 1 character long').max(255),
  code: z.string({
    required_error: 'Organization code is required',
  }).trim().min(2, 'Organization code must be at least 2 characters long').max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Code can only contain alphanumeric characters, hyphens, and underscores'),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  website: z.string().trim().optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  fiscalYear: z.string().trim().optional().nullable(),
  timezone: z.string().trim().optional().nullable(),
  workingHours: z.string().trim().optional().nullable(),
});

const updateOrganizationSchema = createOrganizationSchema.partial();

module.exports = {
  createOrganizationSchema,
  updateOrganizationSchema,
};
