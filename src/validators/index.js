const { z } = require('zod');

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

module.exports = {
  paginationSchema,
};
