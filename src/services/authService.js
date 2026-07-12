const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { BaseRepository } = require('../repositories');
const config = require('../config');
const { ApiError } = require('../utils');
const { UserRole } = require('../constants');

class AuthService {
  constructor() {
    this.userRepo = new BaseRepository('user');
  }

  async login(email, password) {
    const user = await this.userRepo.findOne({ email });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );

    return {
      token,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };
  }

  async signup(name, email, password) {
    const existing = await this.userRepo.findOne({ email });
    if (existing) {
      throw ApiError.conflict('Email already registered');
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const employeeId = `EMP${Date.now()}`;

    const user = await this.userRepo.create({
      employeeId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: UserRole.VIEWER,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );

    return {
      token,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };
  }

  async getProfile(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      employeeId: user.employeeId,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async forgotPassword(email) {
    const user = await this.userRepo.findOne({ email });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }
    return { message: 'If the email exists, a reset link has been sent.' };
  }
}

module.exports = AuthService;
