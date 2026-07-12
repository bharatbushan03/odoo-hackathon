const prisma = require('../config/prisma');

class DepartmentRepository {
  /**
   * Create a new department
   */
  async create(data) {
    return await prisma.department.create({
      data: {
        name: data.name,
        parentId: data.parentId,
        departmentHeadId: data.departmentHeadId,
        status: data.status || 'ACTIVE',
      },
      include: this.getIncludes(),
    });
  }

  /**
   * Find department by ID
   */
  async findById(id) {
    return await prisma.department.findUnique({
      where: { id },
      include: this.getIncludes(),
    });
  }

  /**
   * Find all departments with filtering, pagination, search, and sorting
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      parentId,
      departmentHeadId,
      sortBy = 'name',
      sortOrder = 'asc',
      includeHierarchy = false,
      includeStats = false,
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    // Build where clause
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (parentId) {
      where.parentId = parentId;
    }

    if (departmentHeadId) {
      where.departmentHeadId = departmentHeadId;
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getIncludes(includeHierarchy, includeStats),
      }),
      prisma.department.count({ where }),
    ]);

    return {
      data: departments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update department
   */
  async update(id, data) {
    return await prisma.department.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.departmentHeadId !== undefined && { departmentHeadId: data.departmentHeadId }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: this.getIncludes(),
    });
  }

  /**
   * Delete department
   */
  async delete(id) {
    return await prisma.department.delete({
      where: { id },
    });
  }

  /**
   * Get department hierarchy (tree structure)
   */
  async getHierarchy(rootId = null) {
    const where = rootId ? { id: rootId } : { parentId: null };
    
    const departments = await prisma.department.findMany({
      where,
      include: this.getIncludes(true),
      orderBy: { name: 'asc' },
    });

    if (rootId && departments.length === 0) {
      return null;
    }

    if (rootId) {
      return await this.buildTree(departments[0]);
    }

    const trees = await Promise.all(
      departments.map(dept => this.buildTree(dept))
    );
    return trees;
  }

  /**
   * Build tree structure for hierarchy
   */
  async buildTree(department) {
    const children = await prisma.department.findMany({
      where: { parentId: department.id },
      include: this.getIncludes(true),
      orderBy: { name: 'asc' },
    });

    const result = {
      ...department,
      children: [],
    };

    if (children.length > 0) {
      result.children = await Promise.all(
        children.map(child => this.buildTree(child))
      );
    }

    return result;
  }

  /**
   * Get department statistics
   */
  async getStatistics(id) {
    const department = await this.findById(id);
    if (!department) {
      return null;
    }

    const [
      employeeCount,
      assetCount,
      childDepartmentCount,
      activeAllocationCount,
    ] = await Promise.all([
      prisma.employee.count({ where: { departmentId: id } }),
      prisma.asset.count({ where: { departmentId: id } }),
      prisma.department.count({ where: { parentId: id, status: 'ACTIVE' } }),
      prisma.allocation.count({
        where: {
          asset: { departmentId: id },
          status: 'ACTIVE',
        },
      }),
    ]);

    // Get all sub-department IDs recursively
    const allSubDepartmentIds = await this.getAllSubDepartmentIds(id);
    
    // Count employees in all sub-departments
    const totalEmployeeCount = await prisma.employee.count({
      where: {
        departmentId: { in: [...allSubDepartmentIds, id] },
      },
    });

    // Count assets in all sub-departments
    const totalAssetCount = await prisma.asset.count({
      where: {
        departmentId: { in: [...allSubDepartmentIds, id] },
      },
    });

    return {
      departmentId: id,
      directStats: {
        employees: employeeCount,
        assets: assetCount,
        childDepartments: childDepartmentCount,
        activeAllocations: activeAllocationCount,
      },
      totalStats: {
        employees: totalEmployeeCount,
        assets: totalAssetCount,
      },
    };
  }

  /**
   * Get all sub-department IDs recursively
   */
  async getAllSubDepartmentIds(parentId, ids = new Set()) {
    const children = await prisma.department.findMany({
      where: { parentId },
      select: { id: true },
    });

    for (const child of children) {
      ids.add(child.id);
      await this.getAllSubDepartmentIds(child.id, ids);
    }

    return Array.from(ids);
  }

  /**
   * Check if setting parentId would create a cycle
   */
  async wouldCycle(id, parentId) {
    if (!parentId) return false;
    
    let currentId = parentId;
    while (currentId) {
      if (currentId === id) return true;
      const parent = await prisma.department.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = parent?.parentId;
    }
    return false;
  }

  /**
   * Check if department can be deleted
   */
  async canDelete(id) {
    const [childCount, employeeCount] = await Promise.all([
      prisma.department.count({
        where: { parentId: id, status: 'ACTIVE' },
      }),
      prisma.employee.count({ where: { departmentId: id } }),
    ]);

    return {
      canDelete: childCount === 0 && employeeCount === 0,
      blockers: {
        activeChildren: childCount,
        employees: employeeCount,
      },
    };
  }

  /**
   * Get departments by head
   */
  async findByHead(headId) {
    return await prisma.department.findMany({
      where: { departmentHeadId: headId },
      include: this.getIncludes(),
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Search departments by name
   */
  async search(query, options = {}) {
    return await this.findAll({
      ...options,
      search: query,
    });
  }

  /**
   * Get includes for queries
   */
  getIncludes(includeHierarchy = false, includeStats = false) {
    const includes = {
      departmentHead: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    };

    if (includeHierarchy) {
      includes.children = {
        include: {
          departmentHead: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      };
    }

    if (includeStats) {
      includes._count = {
        select: {
          employees: true,
          assets: true,
          children: true,
        },
      };
    }

    return includes;
  }
}

module.exports = new DepartmentRepository();