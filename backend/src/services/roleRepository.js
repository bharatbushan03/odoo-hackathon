const prisma = require('../config/prisma');

class RoleRepository {
  /**
   * Create a new role
   */
  async create(data) {
    return await prisma.role.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        isSystem: data.isSystem || false,
      },
    });
  }

  /**
   * Find role by ID
   */
  async findById(id) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Find role by name and organization
   */
  async findByNameAndOrganization(name, organizationId) {
    return await prisma.role.findFirst({
      where: {
        name,
        organizationId,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Find all roles with filtering, pagination, search, and sorting
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      organizationId,
      isSystem,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    // Build where clause
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (isSystem !== undefined) {
      where.isSystem = isSystem;
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      data: roles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update role
   */
  async update(id, data)update(id, data) {
    return await prisma.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isSystem !== undefined && { isSystem: data.isSystem }),
      },
    });
  }

  /**
   * Delete role
   */
  async delete(id) {
    return await prisma.role.delete({
      where: { id },
    });
  }

  /**
   * Add permission to role
   */
  async addPermission(roleId, permissionId) {
    // Check if the permission is already assigned to the role
    const existing = await prisma.rolePermission.findFirst({
      where: {
        roleId,
        permissionId,
      },
    });

    if (existing) {
      return existing; // Already assigned
    }

    return await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Remove permission from role
   */
  async removePermission(roleId, permissionId) {
    return await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Get permissions for a role
   */
  async getPermissions(roleId) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map(rp => rp.permission);
  }

  /**
   * Check if role has a specific permission
   */
  async hasPermission(roleId, permissionId) {
    const count = await prisma.rolePermission.count({
      where: {
        roleId,
        permissionId,
      },
    });

    return count > 0;
  }
}

module.exports = new RoleRepository();
