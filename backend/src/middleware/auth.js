const jwt = require('jsonwebtoken');
const { accessToken: accessTokenConfig } = require('../config/jwt');
const AppError = require('../utils/AppError');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Access denied. No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, accessTokenConfig.secret);
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, organizationId: true, status: true, emailVerified: true },
    });

    if (!employee) {
      return next(new AppError('User not found', 401));
    }

    req.user = employee;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
