const crypto = require('crypto');
const prisma = require('../config/prisma');
const { sign } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/password');
const { roleOut } = require('../utils/format');

const emailOk = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
const authBody = (user, token) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: roleOut[user.role],
  departmentId: user.departmentId,
  token,
});

async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !emailOk(email) || !password || password.length < 8) {
    return res.status(400).json({ message: 'Validation error' });
  }
  try {
    const user = await prisma.employee.create({
      data: { name, email: email.toLowerCase(), password: hashPassword(password), role: 'EMPLOYEE' },
    });
    res.status(201).json(authBody(user, sign(user)));
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Email already registered' });
    throw err;
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await prisma.employee.findUnique({ where: { email: String(email || '').toLowerCase() } });
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json(authBody(user, sign(user)));
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!emailOk(email)) return res.status(400).json({ message: 'Validation error' });
  const user = await prisma.employee.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(404).json({ message: 'Email not found' });
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  res.json({
    message: 'Password reset token generated',
    resetToken: crypto.randomBytes(24).toString('hex'),
    expiresAt: expiresAt.toISOString(),
  });
}

async function me(req, res) {
  const user = await prisma.employee.findUnique({
    where: { id: req.user.id },
    include: { department: true },
  });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleOut[user.role],
    departmentId: user.departmentId,
    department: user.department
      ? { id: user.department.id, name: user.department.name, status: user.department.status === 'ACTIVE' ? 'Active' : 'Inactive' }
      : null,
  });
}

module.exports = { signup, login, forgotPassword, me };
