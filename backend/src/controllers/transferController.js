const prisma = require('../config/prisma');

async function createTransferRequest(req, res) {
  const { assetId, fromHolderType, fromHolderId, fromHolderName, toHolderType, toHolderId, toHolderName, reason } = req.body;
  const requestedById = req.user.id;

  if (!assetId || !fromHolderType || !fromHolderId || !fromHolderName || !toHolderType || !toHolderId || !toHolderName || !reason) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!['employee', 'department'].includes(fromHolderType) || !['employee', 'department'].includes(toHolderType)) {
    return res.status(400).json({ message: 'Invalid holder type' });
  }

  const allocation = await prisma.allocation.findFirst({
    where: {
      assetId,
      holderType: fromHolderType,
      holderId: fromHolderId,
      status: 'ACTIVE',
    },
    include: { asset: true },
  });

  if (!allocation) {
    return res.status(404).json({ message: 'Active allocation not found for this asset and holder' });
  }

  const toHolderExists = toHolderType === 'employee'
    ? await prisma.employee.findUnique({ where: { id: toHolderId } })
    : await prisma.department.findUnique({ where: { id: toHolderId } });

  if (!toHolderExists) {
    return res.status(404).json({ message: 'Target holder not found' });
  }

  const existingPending = await prisma.transferRequest.findFirst({
    where: { assetId, status: 'PENDING' },
  });

  if (existingPending) {
    return res.status(409).json({ message: 'A transfer request for this asset is already pending' });
  }

  const transfer = await prisma.transferRequest.create({
    data: {
      assetId,
      allocationId: allocation.id,
      fromHolderType,
      fromHolderId,
      fromHolderName,
      toHolderType,
      toHolderId,
      toHolderName,
      reason,
      requestedById,
      status: 'PENDING',
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      requestedBy: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(transfer);
}

async function listTransferRequests(req, res) {
  const { status, assetId } = req.query;

  const where = {};
  if (status) where.status = status;
  if (assetId) where.assetId = assetId;

  const transfers = await prisma.transferRequest.findMany({
    where,
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      requestedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(transfers);
}

async function getTransferRequest(req, res) {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: req.params.id },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      requestedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });

  if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });
  res.json(transfer);
}

async function approveTransferRequest(req, res) {
  const { rejectionReason } = req.body;
  const approverId = req.user.id;

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: req.params.id },
    include: { asset: true, allocation: true },
  });

  if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });
  if (transfer.status !== 'PENDING') return res.status(409).json({ message: 'Transfer request already processed' });

  const updated = await prisma.$transaction(async (tx) => {
    const updatedTransfer = await tx.transferRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    await tx.allocation.update({
      where: { id: transfer.allocationId },
      data: {
        holderType: transfer.toHolderType,
        holderId: transfer.toHolderId,
        holderName: transfer.toHolderName,
      },
    });

    if (transfer.toHolderType === 'department') {
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: { departmentId: transfer.toHolderId },
      });
    }

    return updatedTransfer;
  });

  res.json(updated);
}

async function rejectTransferRequest(req, res) {
  const { rejectionReason } = req.body;
  const approverId = req.user.id;

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: req.params.id },
  });

  if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });
  if (transfer.status !== 'PENDING') return res.status(409).json({ message: 'Transfer request already processed' });

  const updated = await prisma.transferRequest.update({
    where: { id: req.params.id },
    data: {
      status: 'REJECTED',
      approvedById: approverId,
      rejectionReason,
      approvedAt: new Date(),
    },
  });

  res.json(updated);
}

async function cancelTransferRequest(req, res) {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: req.params.id },
  });

  if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });
  if (transfer.status !== 'PENDING') return res.status(409).json({ message: 'Cannot cancel non-pending transfer' });
  if (transfer.requestedById !== req.user.id && !['ADMIN', 'ASSET_MANAGER'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized to cancel this transfer' });
  }

  const updated = await prisma.transferRequest.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  res.json(updated);
}

module.exports = {
  createTransferRequest,
  listTransferRequests,
  getTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
  cancelTransferRequest,
};