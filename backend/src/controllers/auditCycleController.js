const prisma = require('../config/prisma');

async function createAudit(req, res) {
  const { name, description, departmentId, startDate, endDate } = req.body;

  if (!name || !startDate) {
    return res.status(400).json({ message: 'Name and startDate are required' });
  }

  const audit = await prisma.audit.create({
    data: {
      name,
      description,
      departmentId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: 'PLANNED',
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(audit);
}

async function listAudits(req, res) {
  const { status, departmentId } = req.query;

  const where = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;

  const audits = await prisma.audit.findMany({
    where,
    include: {
      department: { select: { id: true, name: true } },
      closedBy: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(audits);
}

async function getAudit(req, res) {
  const audit = await prisma.audit.findUnique({
    where: { id: req.params.id },
    include: {
      department: { select: { id: true, name: true } },
      closedBy: { select: { id: true, name: true } },
      items: {
        include: {
          asset: { select: { id: true, assetTag: true, name: true, location: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!audit) return res.status(404).json({ message: 'Audit not found' });
  res.json(audit);
}

async function updateAudit(req, res) {
  const { name, description, departmentId, startDate, endDate, status } = req.body;

  const audit = await prisma.audit.findUnique({ where: { id: req.params.id } });
  if (!audit) return res.status(404).json({ message: 'Audit not found' });

  const updated = await prisma.audit.update({
    where: { id: req.params.id },
    data: {
      name,
      description,
      departmentId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  res.json(updated);
}

async function closeAudit(req, res) {
  const audit = await prisma.audit.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });

  if (!audit) return res.status(404).json({ message: 'Audit not found' });
  if (audit.status === 'CLOSED') return res.status(409).json({ message: 'Audit already closed' });

  const flaggedItems = audit.items.filter(i => i.status === 'MISSING' || i.status === 'DAMAGED');

  const updated = await prisma.$transaction(async (tx) => {
    const closedAudit = await tx.audit.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: req.user.id,
        endDate: audit.endDate || new Date(),
      },
    });

    return closedAudit;
  });

  res.json({
    ...updated,
    flaggedCount: flaggedItems.length,
    message: `Audit closed. ${flaggedItems.length} items flagged.`,
  });
}

async function addAuditItem(req, res) {
  const { assetId, status, notes } = req.body;

  if (!assetId || !status) {
    return res.status(400).json({ message: 'assetId and status are required' });
  }

  const audit = await prisma.audit.findUnique({ where: { id: req.params.id } });
  if (!audit) return res.status(404).json({ message: 'Audit not found' });
  if (audit.status === 'CLOSED') return res.status(409).json({ message: 'Cannot add items to closed audit' });

  const existing = await prisma.auditItem.findUnique({
    where: { auditId_assetId: { auditId: req.params.id, assetId } },
  });

  if (existing) {
    return res.status(409).json({ message: 'Asset already in this audit' });
  }

  const item = await prisma.auditItem.create({
    data: {
      auditId: req.params.id,
      assetId,
      status,
      notes,
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, location: true } },
    },
  });

  res.status(201).json(item);
}

async function updateAuditItem(req, res) {
  const { status, notes, verified } = req.body;

  const item = await prisma.auditItem.findUnique({ where: { id: req.params.itemId } });
  if (!item) return res.status(404).json({ message: 'Audit item not found' });

  const data = { status, notes };
  if (verified) {
    data.verifiedById = req.user.id;
    data.verifiedAt = new Date();
  }

  const updated = await prisma.auditItem.update({
    where: { id: req.params.itemId },
    data,
    include: {
      asset: { select: { id: true, assetTag: true, name: true, location: true } },
      verifiedBy: { select: { id: true, name: true } },
    },
  });

  res.json(updated);
}

module.exports = {
  createAudit,
  listAudits,
  getAudit,
  updateAudit,
  closeAudit,
  addAuditItem,
  updateAuditItem,
};