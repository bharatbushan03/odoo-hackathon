const departmentRepository = require('../services/departmentRepository');
const { department, deptStatusIn, roleIn } = require('../utils/format');

/**
 * Validation helper
 */
function validateDepartmentData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.name) {
    errors.push('Department name is required');
  }

  if (data.name && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    errors.push('Department name must be a non-empty string');
  }

  if (data.status && !deptStatusIn[data.status]) {
    errors.push('Invalid status value');
  }

  if (data.parentId && typeof data.parentId !== 'string') {
    errors.push('Parent department ID must be a string');
  }

  if (data.departmentHeadId && typeof data.departmentHeadId !== 'string') {
    errors.push('Department head ID must be a string');
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
    status: req.query.status ? req.query.status.toUpperCase() : undefined,
    parentId: req.query.parentId,
    departmentHeadId: req.query.departmentHeadId,
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
  const validSortFields = ['name', 'createdAt', 'updatedAt', 'status'];
  if (!validSortFields.includes(options.sortBy)) {
    options.sortBy = 'name';
  }

  return options;
}

/**
 * Create a new department
 */
async function createDepartment(req, res) {
  try {
    const errors = validateDepartmentData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const { name, parentId, departmentHeadId, status } = req.body;

    // Check if parent department exists
    if (parentId) {
      const parentExists = await departmentRepository.findById(parentId);
      if (!parentExists) {
        return res.status(400).json({ message: 'Parent department not found' });
      }
    }

    // Check if department head exists and has appropriate role
    if (departmentHeadId) {
      const prisma = require('../config/prisma');
      const head = await prisma.employee.findUnique({
        where: { id: departmentHeadId },
      });
      if (!head) {
        return res.status(400).json({ message: 'Department head not found' });
      }
      if (head.role !== 'DEPT_HEAD' && head.role !== 'ADMIN') {
        return res.status(400).json({ message: 'Department head must have DEPT_HEAD or ADMIN role' });
      }
    }

    const departmentData = {
      name: name.trim(),
      parentId,
      departmentHeadId,
      status: status ? deptStatusIn[status] : 'ACTIVE',
    };

    const newDepartment = await departmentRepository.create(departmentData);
    res.status(201).json(department(newDepartment));
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get all departments with pagination, filtering, search, and sorting
 */
async function listDepartments(req, res) {
  try {
    const options = parseQueryOptions(req);
    const result = await departmentRepository.findAll(options);
    
    res.json({
      data: result.data.map(department),
      meta: result.meta,
    });
  } catch (error) {
    console.error('Error listing departments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get department by ID
 */
async function getDepartment(req, res) {
  try {
    const includeHierarchy = req.query.includeHierarchy === 'true';
    const includeStats = req.query.includeStats === 'true';
    
    const dept = await departmentRepository.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    let response = department(dept);

    if (includeStats) {
      const stats = await departmentRepository.getStatistics(req.params.id);
      response.statistics = stats;
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting department:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update department
 */
async function updateDepartment(req, res) {
  try {
    const errors = validateDepartmentData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const current = await departmentRepository.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const updateData = {};

    if (req.body.name !== undefined) {
      updateData.name = req.body.name.trim();
    }

    if (req.body.status !== undefined) {
      updateData.status = deptStatusIn[req.body.status];
    }

    if (req.body.parentId !== undefined) {
      if (req.body.parentId && !(await departmentRepository.findById(req.body.parentId))) {
        return res.status(400).json({ message: 'Parent department not found' });
      }
      if (req.body.parentId && await departmentRepository.wouldCycle(req.params.id, req.body.parentId)) {
        return res.status(409).json({ message: 'Circular parent reference detected' });
      }
      updateData.parentId = req.body.parentId;
    }

    if (req.body.departmentHeadId !== undefined) {
      if (req.body.departmentHeadId) {
        const prisma = require('../config/prisma');
        const head = await prisma.employee.findUnique({
          where: { id: req.body.departmentHeadId },
        });
        if (!head) {
          return res.status(400).json({ message: 'Department head not found' });
        }
        if (head.role !== 'DEPT_HEAD' && head.role !== 'ADMIN') {
          return res.status(400).json({ message: 'Department head must have DEPT_HEAD or ADMIN role' });
        }
      }
      updateData.departmentHeadId = req.body.departmentHeadId;
    }

    const updated = await departmentRepository.update(req.params.id, updateData);
    res.json(department(updated));
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Delete department
 */
async function deleteDepartment(req, res) {
  try {
    const dept = await departmentRepository.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const canDelete = await departmentRepository.canDelete(req.params.id);
    if (!canDelete.canDelete) {
      return res.status(409).json({
        message: 'Cannot delete department',
        blockers: canDelete.blockers,
      });
    }

    await departmentRepository.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get department hierarchy
 */
async function getDepartmentHierarchy(req, res) {
  try {
    const rootId = req.query.rootId || null;
    const hierarchy = await departmentRepository.getHierarchy(rootId);
    
    if (!hierarchy) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(hierarchy);
  } catch (error) {
    console.error('Error getting department hierarchy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get department statistics
 */
async function getDepartmentStatistics(req, res) {
  try {
    const stats = await departmentRepository.getStatistics(req.params.id);
    
    if (!stats) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting department statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Search departments
 */
async function searchDepartments(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const options = parseQueryOptions(req);
    const result = await departmentRepository.search(q, options);
    
    res.json({
      data: result.data.map(department),
      meta: result.meta,
    });
  } catch (error) {
    console.error('Error searching departments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get departments by head
 */
async function getDepartmentsByHead(req, res) {
  try {
    const departments = await departmentRepository.findByHead(req.params.headId);
    res.json(departments.map(department));
  } catch (error) {
    console.error('Error getting departments by head:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Set department head
 */
async function setDepartmentHead(req, res) {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const dept = await departmentRepository.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const prisma = require('../config/prisma');
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }

    if (employee.role !== 'DEPT_HEAD' && employee.role !== 'ADMIN') {
      return res.status(400).json({ message: 'Employee must have DEPT_HEAD or ADMIN role' });
    }

    const updated = await departmentRepository.update(req.params.id, {
      departmentHeadId: employeeId,
    });

    res.json(department(updated));
  } catch (error) {
    console.error('Error setting department head:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Remove department head
 */
async function removeDepartmentHead(req, res) {
  try {
    const dept = await departmentRepository.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const updated = await departmentRepository.update(req.params.id, {
      departmentHeadId: null,
    });

    res.json(department(updated));
  } catch (error) {
    console.error('Error removing department head:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentHierarchy,
  getDepartmentStatistics,
  searchDepartments,
  getDepartmentsByHead,
  setDepartmentHead,
  removeDepartmentHead,
};