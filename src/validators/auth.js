const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupOrgSchema = z.object({
  orgName: z.string().min(1, 'Organization name is required').max(255),
  orgCode: z.string().min(2, 'Organization code must be at least 2 characters').max(10, 'Organization code must be at most 10 characters').regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens, and underscores'),
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must contain an uppercase letter').regex(/[a-z]/, 'Password must contain a lowercase letter').regex(/[0-9]/, 'Password must contain a number'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

module.exports = {
  loginSchema,
  signupSchema,
  signupOrgSchema,
  forgotPasswordSchema,
};
