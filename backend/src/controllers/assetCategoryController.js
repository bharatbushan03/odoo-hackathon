const assetCategoryRepository = require('../services/assetCategoryRepository');
const { category, categoryStatusIn, depreciationMethodIn, categoryStatusOut, depreciationMethodOut } = require('../utils/format');

/**
 * Validation helper
 */
function validateCategoryData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.name) {
    errors.push('Category name is required');
  }

  if (data.name && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    errors.push('Category name must be a non-empty string');
  }

  if (data.description && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (data.status && !categoryStatusIn[data.status]) {
    errors.push('Invalid status value. Must be Active or Inactive');
  }

  if (data.depreciationMethod && !depreciationMethodIn[data.depreciationMethod]) {
    errors.push('Invalid depreciation method value. Must be one of: StraightLine, DecliningBalance, DoubleDeclining, SumOfYears, UnitsOfProduction, None');
  }

  if (data.expectedLife !== undefined) {
    const life = parseInt(data.expectedLife);
    if (isNaN(life) || life < 0) {
      errors.push('Expected life must be a positive number');
    }
  }

  if (data.parentId && typeof data.parentId !== 'string') {
    errors.push('Parent category ID must be a string');
  }

  if (data.customFields !== undefined && typeof data.customFields !== 'object') {
    errors.push('Custom fields must be an object');
  }

  return errors;
}

/**
 * Parse query parameters for pagination, filtering, search, and sorting
 */
function parseQueryOptions(req) {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search,
    status: req.query.status ? categoryStatusIn[req.query.status] : undefined,
    parentId: req.query.parentId,
    depreciationMethod: req.query.depreciationMethod ? depreciationMethodIn[req.query.depreciationMethod] : undefined,
    sortBy: req.query.sortBy || 'name',
    sortOrder: req.query.sortOrder || 'asc',
    includeHierarchy: req.query.includeHierarchy === 'true',
    includeStats: req.query.includeStats === 'true',
  };

  // Validate pagination
  if (options.page < 1) options.page = 1;
  if (options.limit < 1 || options.limit > 100) options.limit = 10;

  // Validate sort order
  if (!['asc', 'desc'].includes(options.sortOrder.toLowerCase())) {
    options.sortOrder = 'asc';
  }

  // Validate sort field
  const validSortFields = ['name', 'createdAt', 'updatedAt', 'status', 'depreciationMethod'];
  if (!validSortFields.includes(options.sortBy)) {
    options.sortBy = 'name';
  }

  return options;
}

/**
 * Create a new asset category
 */
async function createCategory(req, res) {
  try {
    const errors = validateCategoryData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const { name, description, parentId, depreciationMethod, expectedLife, image, status, customFields } = req.body;

    // Check if category name already exists
    const existingCategory = await assetCategoryRepository.findByName(name.trim());
    if (existingCategory) {
      return res.status(409).json({ message: 'Category name already exists' });
    }

    // Check if parent category exists
    if (parentId) {
      const parentExists = await assetCategoryRepository.findById(parentId);
      if (!parentExists) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim(),
      parentId,
      depreciationMethod: depreciationMethod ? depreciationMethodIn[depreciationMethod] : 'NONE',
      expectedLife: expectedLife ? parseInt(expectedLife) : null,
      image,
      status: status ? categoryStatusIn[status] : 'ACTIVE',
      customFields: customFields || {},
    };

    const newCategory = await assetCategoryRepository.create(categoryData);
    res.status(201).json(category(newCategory));
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get all categories with pagination, filtering, search, and sorting
 */
async function listCategories(req, res) {
  try {
    const options = parseQueryOptions(req);
    const result = await assetCategoryRepository.findAll(options);
    
    res.json({
      data: result.data.map(category),
      meta: result.meta,
    });
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get category by ID
 */
async function getCategory(req, res) {
  try {
    const includeHierarchy = req.query.includeHierarchy === 'true';
    const includeStats = req.query.includeStats === 'true';
    
    const cat = await assetCategoryRepository.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let response = category(cat);

    if (includeStats) {
      const stats = await assetCategoryRepository.getStatistics(req.params.id);
      response.statistics = stats;
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update category
 */
async function updateCategory(req, res) {
  try {
    const errors = validateCategoryData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const current = await assetCategoryRepository.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updateData = {};

    if (req.body.name !== undefined) {
      // Check if new name already exists (and it's not the same category)
      if (req.body.name.trim() !== current.name) {
        const existingCategory = await assetCategoryRepository.findByName(req.body.name.trim());
        if (existingCategory) {
          return res.status(409).json({ message: 'Category name already exists' });
        }
      }
      updateData.name = req.body.name.trim();
    }

    if (req.body.description !== undefined) {
      updateData.description = req.body.description.trim();
    }

    if (req.body.status !== undefined) {
      updateData.status = categoryStatusIn[req.body.status];
    }

    if (req.body.depreciationMethod !== undefined) {
      updateData.depreciationMethod = depreciationMethodIn[req.body.depreciationMethod];
    }

    if (req.body.expectedLife !== undefined) {
      updateData.expectedLife = req.body.expectedLife ? parseInt(req.body.expectedLife) : null;
    }

    if (req.body.image !== undefined) {
      updateData.image = req.body.image;
    }

    if (req.body.parentId !== undefined) {
      if (req.body.parentId && !(await assetCategoryRepository.findById(req.body.parentId))) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
      if (req.body.parentId && await assetCategoryRepository.wouldCycle(req.params.id, req.body.parentId)) {
        return res.status(409).json({ message: 'Circular parent reference detected' });
      }
      updateData.parentId = req.body.parentId;
    }

    if (req.body.customFields !== undefined) {
      updateData.customFields = req.body.customFields;
    }

    const updated = await assetCategoryRepository.update(req.params.id, updateData);
    res.json(category(updated));
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Delete category
 */
async function deleteCategory(req, res) {
  try {
    const cat = await assetCategoryRepository.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const canDelete = await assetCategoryRepository.canDelete(req.params.id);
    if (!canDelete.canDelete) {
      return res.status(409).json({
        message: 'Cannot delete category',
        blockers: canDelete.blockers,
      });
    }

    await assetCategoryRepository.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get category hierarchy
 */
async function getCategoryHierarchy(req, res) {
  try {
    const rootId = req.query.rootId || null;
    const hierarchy = await assetCategoryRepository.getHierarchy(rootId);
    
    if (!hierarchy) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(hierarchy);
  } catch (error) {
    console.error('Error getting category hierarchy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get category statistics
 */
async function getCategoryStatistics(req, res) {
  try {
    const stats = await assetCategoryRepository.getStatistics(req.params.id);
    
    if (!stats) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting category statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Search categories
 */
async function searchCategories(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const options = parseQueryOptions(req);
    const result = await assetCategoryRepository.search(q, options);
    
    res.json({
      data: result.data.map(category),
      meta: result.meta,
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get root categories
 */
async function getRootCategories(req, res) {
  try {
    const categories = await assetCategoryRepository.findRootCategories();
    res.json(categories.map(category));
  } catch (error) {
    console.error('Error getting root categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get child categories by parent ID
 */
async function getChildCategories(req, res) {
  try {
    const categories = await assetCategoryRepository.findChildCategories(req.params.parentId);
    res.json(categories.map(category));
  } catch (error) {
    console.error('Error getting child categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy,
  getCategoryStatistics,
  searchCategories,
  getRootCategories,
  getChildCategories,
};