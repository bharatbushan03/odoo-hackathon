const prisma = require('../config/prisma');
const { department, category, employee, deptStatusIn, roleIn } = require('../utils/format');

async function wouldCycle(id, parentId) {
  for (let next = parentId; next;) {
    if (next === id) return true;
    const parent = await prisma.department.findUnique({ where: { id: next }, select: { parentId: true } });
    next = parent?.parentId;
  }
  return false;
}

async function createDepartment(req, res) {
  const { name, parentDepartmentId, status = 'Active' } = req.body;
  const parentId = req.body.parentId ?? parentDepartmentId ?? null;
  if (!name || !deptStatusIn[status]) return res.status(400).json({ message: 'Validation error' });
  if (parentId && !(await prisma.department.findUnique({ where: { id: parentId } }))) {
    return res.status(400).json({ message: 'Validation error' });
  }
  const d = await prisma.department.create({ data: { name, parentId, status: deptStatusIn[status] } });
  res.status(201).json(department(d));
}

async function listDepartments(req, res) {
  const where = req.query.parentId ? { parentId: req.query.parentId } : {};
  const rows = await prisma.department.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(rows.map(department));
}

async function getDepartment(req, res) {
  const d = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!d) return res.status(404).json({ message: 'Department not found' });
  res.json(department(d));
}

async function updateDepartment(req, res) {
  const current = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ message: 'Department not found' });
  const data = {};
  if ('name' in req.body) data.name = req.body.name;
  if ('status' in req.body) {
    if (!deptStatusIn[req.body.status]) return res.status(400).json({ message: 'Validation error' });
    data.status = deptStatusIn[req.body.status];
  }
  if ('parentId' in req.body) {
    if (req.body.parentId && !(await prisma.department.findUnique({ where: { id: req.body.parentId } }))) {
      return res.status(400).json({ message: 'Validation error' });
    }
    if (req.body.parentId && await wouldCycle(req.params.id, req.body.parentId)) {
      return res.status(409).json({ message: 'Circular parent reference' });
    }
    data.parentId = req.body.parentId;
  }
  if ('parentDepartmentId' in req.body) {
    if (req.body.parentDepartmentId && !(await prisma.department.findUnique({ where: { id: req.body.parentDepartmentId } }))) {
      return res.status(400).json({ message: 'Validation error' });
    }
    if (req.body.parentDepartmentId && await wouldCycle(req.params.id, req.body.parentDepartmentId)) {
      return res.status(409).json({ message: 'Circular parent reference' });
    }
    data.parentId = req.body.parentDepartmentId;
  }
  const d = await prisma.department.update({ where: { id: req.params.id }, data });
  res.json(department(d));
}

async function deleteDepartment(req, res) {
  const d = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!d) return res.status(404).json({ message: 'Department not found' });
  const blockers = await prisma.$transaction([
    prisma.department.count({ where: { parentId: req.params.id, status: 'ACTIVE' } }),
    prisma.employee.count({ where: { departmentId: req.params.id } }),
  ]);
  if (blockers[0] || blockers[1]) return res.status(409).json({ message: 'Department has active children or employees' });
  await prisma.department.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

async function createCategory(req, res) {
  const { name, description = null, customFields = {} } = req.body;
  if (!name || (customFields !== null && typeof customFields !== 'object')) return res.status(400).json({ message: 'Validation error' });
  try {
    const c = await prisma.assetCategory.create({ data: { name, description, customFields } });
    res.status(201).json(category(c));
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Category name already exists' });
    throw err;
  }
}

async function listCategories(req, res) {
  const rows = await prisma.assetCategory.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(rows.map(category));
}

async function getCategory(req, res) {
  const c = await prisma.assetCategory.findUnique({ where: { id: req.params.id } });
  if (!c) return res.status(404).json({ message: 'Category not found' });
  res.json(category(c));
}

async function updateCategory(req, res) {
  try {
    const c = await prisma.assetCategory.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.description !== undefined ? { description: req.body.description } : {}),
        ...(req.body.customFields !== undefined ? { customFields: req.body.customFields } : {}),
      },
    });
    res.json(category(c));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Category not found' });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Category name already exists' });
    throw err;
  }
}

async function deleteCategory(req, res) {
  const c = await prisma.assetCategory.findUnique({ where: { id: req.params.id } });
  if (!c) return res.status(404).json({ message: 'Category not found' });
  if (await prisma.asset.count({ where: { categoryId: req.params.id } })) return res.status(409).json({ message: 'Category has assets' });
  await prisma.assetCategory.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

async function listEmployees(req, res) {
  const where = {};
  if (req.query.departmentId) where.departmentId = req.query.departmentId;
  if (req.query.role && roleIn[req.query.role]) where.role = roleIn[req.query.role];
  const rows = await prisma.employee.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(rows.map(employee));
}

async function updateEmployee(req, res) {
  if ('role' in req.body) return res.status(400).json({ message: 'Use promote endpoint to change role' });
  try {
    const e = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.email !== undefined ? { email: req.body.email.toLowerCase() } : {}),
        ...(req.body.departmentId !== undefined ? { departmentId: req.body.departmentId } : {}),
      },
    });
    res.json(employee(e));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Employee not found' });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Email already in use' });
    if (err.code === 'P2003') return res.status(400).json({ message: 'Validation error' });
    throw err;
  }
}

async function promoteEmployee(req, res) {
  const role = roleIn[req.body.role];
  if (!['ASSET_MANAGER', 'DEPT_HEAD'].includes(role)) return res.status(400).json({ message: 'Validation error' });
  try {
    const e = await prisma.employee.update({ where: { id: req.params.id }, data: { role } });
    res.json(employee(e));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Employee not found' });
    throw err;
  }
}

module.exports = {
  createDepartment, listDepartments, getDepartment, updateDepartment, deleteDepartment,
  createCategory, listCategories, getCategory, updateCategory, deleteCategory,
  listEmployees, updateEmployee, promoteEmployee,
};
