const { z } = require('zod');

const assignAssetSchema = z.object({
  assetId: z.string({
    required_error: 'Asset ID is required',
  }).uuid('Invalid Asset ID format'),
  userId: z.string({
    required_error: 'User ID is required',
  }).uuid('Invalid User ID format'),
  notes: z.string().trim().optional().nullable(),
  assignedAt: z.string().datetime({ message: 'Invalid ISO datetime format for assignedAt' }).optional(),
});

const acceptAssignmentSchema = z.object({
  signature: z.string({
    required_error: 'Signature is required',
  }).trim().min(1, 'Signature cannot be empty'),
});

const rejectAssignmentSchema = z.object({
  notes: z.string({
    required_error: 'Rejection reason (notes) is required',
  }).trim().min(1, 'Rejection reason must be at least 1 character long'),
});

const returnAssetSchema = z.object({
  notes: z.string().trim().optional().nullable(),
  returnedAt: z.string().datetime({ message: 'Invalid ISO datetime format for returnedAt' }).optional(),
});

const transferAssetSchema = z.object({
  assetId: z.string({
    required_error: 'Asset ID is required',
  }).uuid('Invalid Asset ID format'),
  fromUserId: z.string({
    required_error: 'Origin User ID (fromUserId) is required',
  }).uuid('Invalid Origin User ID format'),
  toUserId: z.string({
    required_error: 'Destination User ID (toUserId) is required',
  }).uuid('Invalid Destination User ID format'),
  notes: z.string().trim().optional().nullable(),
});

module.exports = {
  assignAssetSchema,
  acceptAssignmentSchema,
  rejectAssignmentSchema,
  returnAssetSchema,
  transferAssetSchema,
};
