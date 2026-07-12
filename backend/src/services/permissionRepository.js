const prisma = require('../config/prisma');

class PermissionRepository {
  /**
   * Create a new permission
   */
  async create(data) {
    return await prisma.permission.create({
      data: {
        module: data.module,
        action: data.action,
        description: data.description,
      },
    });
  }

  /**
   * Find permission by ID
   */
  async findById(id) {
    return await prisma.permission.findUnique({
      where: { id },
    });
  }

  /**
   * Find permission by module and action
   */
  async findByModuleAndAction(module, action) {
    return await prisma.permission.findFirst({
      where: {
        module,
        action,
      },
    });
  }

  /**
   * Find all permissions with filtering, pagination, search, and sorting
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      module,
      sortBy = 'module',
      sortOrder = 'asc',
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    // Build where clause
    if (search) {
      where.OR = [
        { module: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (module) {
      where.module = module;
    }

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.permission.count({ where }),
    ]);

    return {
      data: permissions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update permission
   */
  async update(id, data) {
    return await prisma.permission.update({
      where: { id },
      data: {
        ...(data.module !== undefined && { module: data.module }),
        ...(data.action !== undefined && { action: data.action }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  /**
   * Delete permission
   */
  async delete(id) {
    return await prisma.permission.delete({
      where: { id },
    });
  }

  /**
   * Get permissions by module
   */
  async findByModule(module) {
    return await prisma.permission.findMany({
      where: { module },
      orderBy: { action: 'asc' },
    });
  }
}

module.exports = new PermissionRepository();
