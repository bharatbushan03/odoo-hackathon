const prisma = require('../config/prisma');

class AssetCategoryRepository {
  /**
   * Create a new asset category
   */
  async create(data) {
    return await prisma.assetCategory.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        depreciationMethod: data.depreciationMethod || 'NONE',
        expectedLife: data.expectedLife,
        image: data.image,
        status: data.status || 'ACTIVE',
        customFields: data.customFields || {},
      },
      include: this.getIncludes(),
    });
  }

  /**
   * Find category by ID
   */
  async findById(id) {
    return await prisma.assetCategory.findUnique({
      where: { id },
      include: this.getIncludes(),
    });
  }

  /**
   * Find category by name
   */
  async findByName(name) {
    return await prisma.assetCategory.findUnique({
      where: { name },
      include: this.getIncludes(),
    });
  }

  /**
   * Find all categories with filtering, pagination, search, and sorting
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      parentId,
      depreciationMethod,
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
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (parentId) {
      where.parentId = parentId;
    }

    if (depreciationMethod) {
      where.depreciationMethod = depreciationMethod;
    }

    const [categories, total] = await Promise.all([
      prisma.assetCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getIncludes(includeHierarchy, includeStats),
      }),
      prisma.assetCategory.count({ where }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update category
   */
  async update(id, data) {
    return await prisma.assetCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.depreciationMethod !== undefined && { depreciationMethod: data.depreciationMethod }),
        ...(data.expectedLife !== undefined && { expectedLife: data.expectedLife }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.customFields !== undefined && { customFields: data.customFields }),
      },
      include: this.getIncludes(),
    });
  }

  /**
   * Delete category
   */
  async delete(id) {
    return await prisma.assetCategory.delete({
      where: { id },
    });
  }

  /**
   * Get category hierarchy (tree structure)
   */
  async getHierarchy(rootId = null) {
    const where = rootId ? { id: rootId } : { parentId: null };
    
    const categories = await prisma.assetCategory.findMany({
      where,
      include: this.getIncludes(true),
      orderBy: { name: 'asc' },
    });

    if (rootId && categories.length === 0) {
      return null;
    }

    if (rootId) {
      return await this.buildTree(categories[0]);
    }

    const trees = await Promise.all(
      categories.map(category => this.buildTree(category))
    );
    return trees;
  }

  /**
   * Build tree structure for hierarchy
   */
  async buildTree(category) {
    const children = await prisma.assetCategory.findMany({
      where: { parentId: category.id },
      include: this.getIncludes(true),
      orderBy: { name: 'asc' },
    });

    const result = {
      ...category,
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
   * Get category statistics
   */
  async getStatistics(id) {
    const category = await this.findById(id);
    if (!category) {
      return null;
    }

    const [
      assetCount,
      activeAssetCount,
      totalAssetValue,
    ] = await Promise.all([
      prisma.asset.count({ where: { categoryId: id } }),
      prisma.asset.count({ where: { categoryId: id, status: 'Available' } }),
      prisma.asset.aggregate({
        where: { categoryId: id },
        _sum: { cost: true },
      }),
    ]);

    // Get all sub-category IDs recursively
    const allSubCategoryIds = await this.getAllSubCategoryIds(id);
    
    // Count assets in all sub-categories
    const totalAssetCount = await prisma.asset.count({
      where: {
        categoryId: { in: [...allSubCategoryIds, id] },
      },
    });

    // Get total value of all assets in sub-categories
    const totalValue = await prisma.asset.aggregate({
      where: {
        categoryId: { in: [...allSubCategoryIds, id] },
      },
      _sum: { cost: true },
    });

    return {
      categoryId: id,
      directStats: {
        assets: assetCount,
        activeAssets: activeAssetCount,
        totalValue: totalAssetValue._sum.cost || 0,
      },
      totalStats: {
        assets: totalAssetCount,
        totalValue: totalValue._sum.cost || 0,
      },
    };
  }

  /**
   * Get all sub-category IDs recursively
   */
  async getAllSubCategoryIds(parentId, ids = new Set()) {
    const children = await prisma.assetCategory.findMany({
      where: { parentId },
      select: { id: true },
    });

    for (const child of children) {
      ids.add(child.id);
      await this.getAllSubCategoryIds(child.id, ids);
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
      const parent = await prisma.assetCategory.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = parent?.parentId;
    }
    return false;
  }

  /**
   * Check if category can be deleted
   */
  async canDelete(id) {
    const [childCount, assetCount] = await Promise.all([
      prisma.assetCategory.count({
        where: { parentId: id, status: 'ACTIVE' },
      }),
      prisma.asset.count({ where: { categoryId: id } }),
    ]);

    return {
      canDelete: childCount === 0 && assetCount === 0,
      blockers: {
        activeChildren: childCount,
        assets: assetCount,
      },
    };
  }

  /**
   * Search categories by name or description
   */
  async search(query, options = {}) {
    return await this.findAll({
      ...options,
      search: query,
    });
  }

  /**
   * Get root categories (no parent)
   */
  async findRootCategories() {
    return await prisma.assetCategory.findMany({
      where: { parentId: null },
      include: this.getIncludes(),
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get child categories by parent ID
   */
  async findChildCategories(parentId) {
    return await prisma.assetCategory.findMany({
      where: { parentId },
      include: this.getIncludes(),
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get includes for queries
   */
  getIncludes(includeHierarchy = false, includeStats = false) {
    const includes = {};

    if (includeHierarchy) {
      includes.children = {
        include: this.getIncludes(true, includeStats),
      };
    }

    if (includeStats) {
      includes._count = {
        select: {
          assets: true,
          children: true,
        },
      };
    }

    return includes;
  }
}

module.exports = new AssetCategoryRepository();