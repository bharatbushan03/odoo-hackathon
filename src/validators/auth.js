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

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

module.exports = {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
};
