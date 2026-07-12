const prisma = require('../config/prisma');

const formatAsset = (asset) => ({
  id: asset.id,
  assetId: asset.assetId,
  name: asset.name,
  assetTag: asset.assetTag,
  serialNumber: asset.serialNumber,
  barcode: asset.barcode,
  qrcode: asset.qrcode,
  vendor: asset.vendor,
  purchaseDate: asset.purchaseDate,
  purchaseCost: asset.purchaseCost,
  warranty: asset.warranty,
  warrantyExpires: asset.warrantyExpires,
  department: asset.department ? {
    id: asset.department.id,
    name: asset.department.name
  } : null,
  departmentId: asset.departmentId,
  assignedEmployee: asset.assignedEmployee ? {
    id: asset.assignedEmployee.id,
    name: asset.assignedEmployee.name,
    email: asset.assignedEmployee.email
  } : null,
  assignedEmployeeId: asset.assignedEmployeeId,
  currentLocation: asset.currentLocation,
  category: {
    id: asset.category.id,
    name: asset.category.name
  },
  categoryId: asset.categoryId,
  lifecycleState: asset.lifecycleState,
  status: asset.status,
  condition: asset.condition,
  notes: asset.notes,
  purchaseOrderNumber: asset.purchaseOrderNumber,
  orderDate: asset.orderDate,
  attachmentCount: asset.attachments?.length || 0,
  createdAt: asset.createdAt,
  updatedAt: asset.updatedAt
});

const formatAssetList = (asset) => ({
  id: asset.id,
  assetId: asset.assetId,
  name: asset.name,
  assetTag: asset.assetTag,
  serialNumber: asset.serialNumber,
  barcode: asset.barcode,
  qrcode: asset.qrcode,
  vendor: asset.vendor,
  purchaseDate: asset.purchaseDate,
  purchaseCost: asset.purchaseCost,
  department: asset.department ? asset.department.name : null,
  assignedEmployee: asset.assignedEmployee ? asset.assignedEmployee.name : null,
  currentLocation: asset.currentLocation,
  category: asset.category ? asset.category.name : null,
  lifecycleState: asset.lifecycleState,
  status: asset.status,
  condition: asset.condition,
  createdAt: asset.createdAt,
  updatedAt: asset.updatedAt
});

async function findWithPagination(where, options) {
  const {
    skip = 0,
    take = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const orderBy = {};
  orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';

  const [total, assets] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.findMany({
      where,
      include: {
        category: true,
        department: true,
        assignedEmployee: true
      },
      skip,
      take,
      orderBy
    })
  ]);

  return {
    assets: assets.map(formatAssetList),
    meta: {
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil(total / take)
    }
  };
}

async function findById(id) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      department: true,
      assignedEmployee: true,
      attachments: true
    }
  });
  return asset ? formatAsset(asset) : null;
}

async function findByAssetTag(assetTag) {
  const asset = await prisma.asset.findUnique({
    where: { assetTag },
    include: {
      category: true,
      department: true,
      assignedEmployee: true
    }
  });
  return asset ? formatAsset(asset) : null;
}

async function create(data) {
  const asset = await prisma.asset.create({
    data,
    include: {
      category: true,
      department: true,
      assignedEmployee: true
    }
  });
  return formatAsset(asset);
}

async function update(id, data) {
  const asset = await prisma.asset.update({
    where: { id },
    data,
    include: {
      category: true,
      department: true,
      assignedEmployee: true
    }
  });
  return formatAsset(asset);
}

async function deleteAsset(id) {
  const asset = await prisma.asset.findUnique({
    where: { id }
  });
  
  if (!asset) return null;
  
  await prisma.assetAttachment.deleteMany({
    where: { assetId: id }
  });
  
  await prisma.auditLog.deleteMany({
    where: { entityType: 'Asset', entityId: id }
  });
  
  await prisma.asset.delete({
    where: { id }
  });
  
  return { success: true, deletedAsset: formatAsset(asset) };
}

async function search(query, options) {
  const where = {};
  
  if (query.name) {
    where.name = { contains: query.name, mode: 'insensitive' };
  }
  
  if (query.assetTag) {
    where.assetTag = { contains: query.assetTag, mode: 'insensitive' };
  }
  
  if (query.serialNumber) {
    where.serialNumber = { contains: query.serialNumber, mode: 'insensitive' };
  }
  
  if (query.barcode) {
    where.barcode = { contains: query.barcode, mode: 'insensitive' };
  }
  
  if (query.vendor) {
    where.vendor = { contains: query.vendor, mode: 'insensitive' };
  }
  
  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }
  
  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }
  
  if (query.status) {
    where.status = query.status;
  }
  
  if (query.lifecycleState) {
    where.lifecycleState = query.lifecycleState;
  }
  
  if (query.location) {
    where.currentLocation = { contains: query.location, mode: 'insensitive' };
  }
  
  where.deletedAt = null;
  
  return findWithPagination(where, options);
}

async function getStats() {
  const [
    totalAssets,
    byStatus,
    byLifecycleState,
    byCategory
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.asset.groupBy({
      by: ['lifecycleState'],
      _count: true
    }),
    prisma.asset.groupBy({
      by: ['categoryId'],
      _count: true,
      include: {
        category: {
          select: { name: true }
        }
      }
    })
  ]);

  return {
    totalAssets,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {}),
    byLifecycleState: byLifecycleState.reduce((acc, item) => {
      acc[item.lifecycleState] = item._count;
      return acc;
    }, {}),
    byCategory: byCategory.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.category.name,
      count: item._count
    }))
  };
}

async function addAttachment(assetId, attachmentData) {
  const attachment = await prisma.assetAttachment.create({
    data: {
      assetId,
      ...attachmentData
    }
  });
  return attachment;
}

async function getAttachments(assetId) {
  const attachments = await prisma.assetAttachment.findMany({
    where: { assetId },
    orderBy: { uploadedAt: 'desc' }
  });
  return attachments;
}

async function deleteAttachment(attachmentId) {
  const attachment = await prisma.assetAttachment.findUnique({
    where: { id: attachmentId }
  });
  
  if (!attachment) return null;
  
  await prisma.assetAttachment.delete({
    where: { id: attachmentId }
  });
  
  return { success: true };
}

async function createMany(assetsData) {
  const assets = await prisma.asset.createMany({
    assetsData,
    skipDuplicates: true
  });
  return { created: assets.count };
}

module.exports = {
  findById,
  findByAssetTag,
  create,
  update,
  deleteAsset,
  findWithPagination,
  search,
  getStats,
  addAttachment,
  getAttachments,
  deleteAttachment,
  createMany
};