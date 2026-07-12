const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const secret = () => process.env.JWT_SECRET || 'assetflow-dev-secret';

async function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing or invalid JWT' });
  try {
    const payload = jwt.verify(token, secret());
    const user = await prisma.employee.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'Missing or invalid JWT' });
    req.user = { id: user.id, role: user.role, departmentId: user.departmentId };
    next();
  } catch {
    res.status(401).json({ message: 'Missing or invalid JWT' });
  }
}

const requireRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

function sign(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, departmentId: user.departmentId },
    secret(),
    { expiresIn: '8h' },
  );
}

module.exports = { authenticate, requireRoles, sign };
