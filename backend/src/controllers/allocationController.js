const prisma = require('../config/prisma');
const { allocation } = require('../utils/format');

async function holder(holderType, holderId) {
  if (holderType === 'employee') {
    const e = await prisma.employee.findUnique({ where: { id: holderId } });
    return e && { id: e.id, name: e.name, type: 'employee' };
  }
  if (holderType === 'department') {
    const d = await prisma.department.findUnique({ where: { id: holderId } });
    return d && { id: d.id, name: d.name, type: 'department' };
  }
  return null;
}

async function createAllocation(req, res) {
  const { assetId, holderType, holderId, expectedReturnDate = null } = req.body;
  if (!assetId || !holderId || !['employee', 'department'].includes(holderType)) {
    return res.status(400).json({ message: 'Validation error' });
  }
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  const h = await holder(holderType, holderId);
  if (!h) return res.status(404).json({ message: 'Holder not found' });

  const active = await prisma.allocation.findFirst({
    where: { assetId, status: 'ACTIVE' },
    include: { asset: true },
  });
  if (active) {
    return res.status(409).json({
      error: 'ALLOCATION_CONFLICT',
      message: `Asset ${active.asset.assetTag} is currently allocated and cannot be re-allocated.`,
      currentHolder: { type: active.holderType, id: active.holderId, name: active.holderName },
      assetId,
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const a = await tx.allocation.create({
      data: {
        assetId,
        holderType,
        holderId,
        holderName: h.name,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      },
      include: { asset: true },
    });
    await tx.asset.update({ where: { id: assetId }, data: { status: 'Allocated', departmentId: holderType === 'department' ? holderId : null } });
    return a;
  });
  res.status(201).json(allocation(created, h.name));
}

async function returnAllocation(req, res) {
  const current = await prisma.allocation.findUnique({ where: { id: req.params.id }, include: { asset: true } });
  if (!current) return res.status(404).json({ message: 'Allocation not found' });
  if (current.status === 'RETURNED') return res.status(409).json({ message: 'Asset already returned' });
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const a = await tx.allocation.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED', actualReturnDate: now },
      include: { asset: true },
    });
    await tx.asset.update({ where: { id: current.assetId }, data: { status: 'Available' } });
    return a;
  });
  res.json({
    id: updated.id,
    assetId: updated.assetId,
    assetTag: updated.asset.assetTag,
    actualReturnDate: updated.actualReturnDate.toISOString(),
    status: 'Returned',
  });
}

module.exports = { createAllocation, returnAllocation };
