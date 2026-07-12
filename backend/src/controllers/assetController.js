const prisma = require('../config/prisma');
const { assetFull, assetList, conditionIn, assetStatusIn } = require('../utils/format');

async function nextTag(tx) {
  const latest = await tx.asset.findFirst({ orderBy: { assetTag: 'desc' }, select: { assetTag: true } });
  const n = latest ? Number(latest.assetTag.replace('AF-', '')) + 1 : 1;
  return `AF-${String(n).padStart(4, '0')}`;
}

async function createAsset(req, res) {
  const { name, categoryId, serialNumber = null, acquisitionDate, cost, condition = 'Good', location, shared = false, bookable = false } = req.body;
  const acquired = new Date(acquisitionDate);
  if (!name || !categoryId || Number.isNaN(acquired.getTime()) || !(cost > 0) || !conditionIn[condition] || !location) {
    return res.status(400).json({ message: 'Validation error' });
  }
  try {
    const a = await prisma.$transaction(async (tx) => {
      if (!(await tx.assetCategory.findUnique({ where: { id: categoryId } }))) {
        const err = new Error('Category not found');
        err.status = 404;
        throw err;
      }
      return tx.asset.create({
        data: {
          name,
          categoryId,
          serialNumber,
          acquisitionDate: acquired,
          cost: Number(cost),
          condition: conditionIn[condition],
          location,
          shared: Boolean(shared),
          bookable: Boolean(bookable),
          status: 'Available',
          assetTag: await nextTag(tx),
        },
      });
    });
    res.status(201).json(assetFull(a));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Asset unique field already exists' });
    throw err;
  }
}

async function listAssets(req, res) {
  const where = {};
  if (req.query.tag) where.assetTag = { contains: req.query.tag, mode: 'insensitive' };
  if (req.query.serial) where.serialNumber = { contains: req.query.serial, mode: 'insensitive' };
  if (req.query.categoryId) where.categoryId = req.query.categoryId;
  if (req.query.departmentId) where.departmentId = req.query.departmentId;
  if (req.query.location) where.location = { contains: req.query.location, mode: 'insensitive' };
  if (req.query.status && assetStatusIn[req.query.status]) where.status = assetStatusIn[req.query.status];
  const rows = await prisma.asset.findMany({
    where,
    include: { category: true, department: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows.map(assetList));
}

module.exports = { createAsset, listAssets };
