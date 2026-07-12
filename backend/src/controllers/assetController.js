const prisma = require('../config/prisma');
const assetService = require('../services/assetService');
const { generateQRCode, generateBarcode, generateCompositeBarcodeQR } = require('../utils/codeGenerator');
const { processSingleFileUpload, processMultipleFilesUpload, deleteFile } = require('../utils/upload');
const { 
  importFromCSV, 
  createMockCSVTemplate, 
  previewCSVRecords,
  generateImportReport 
} = require('../utils/csvImporter');
const { 
  logAssetChange, 
  getAssetChanges 
} = require('../utils/auditLog');
const { validationResult } = require('express-validator');

async function validateCategoryExists(categoryId) {
  const category = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new Error('Category not found');
  }
  return true;
}

async function validateDepartmentExists(departmentId) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) {
    throw new Error('Department not found');
  }
  return true;
}

async function validateEmployeeExists(employeeId) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new Error('Employee not found');
  }
  return true;
}

async function generateUniqueBarcode(aslAssetTag) {
  let barcode;
  let attempts = 0;
  const maxAttempts = 5;

  do {
    barcode = generateBarcode(aslAssetTag, 'CODE128', 2, 100).toString();
    attempts++;
  } while (attempts < maxAttempts);

  return barcode;
}

async function createAsset(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const {
      name,
      assetTag,
      serialNumber,
      barcode,
      qrcode,
      vendor,
      purchaseDate,
      purchaseCost,
      warranty,
      warrantyExpires,
      departmentId,
      assignedEmployeeId,
      currentLocation,
      categoryId,
      lifecycleState,
      status = 'Available',
      condition,
      notes,
      purchaseOrderNumber,
      orderDate
    } = req.body;

    await validateCategoryExists(categoryId);
    if (departmentId) await validateDepartmentExists(departmentId);
    if (assignedEmployeeId) await validateEmployeeExists(assignedEmployeeId);

    const existingAssetWithTag = assetTag ? await assetRepository.findByAssetTag(assetTag) : null;
    if (existingAssetWithTag) {
      return res.status(409).json({ message: 'Asset tag already exists' });
    }

    const assetData = {
      name,
      assetTag: assetTag || generateUniqueBarcode(assetId),
      serialNumber,
      barcode: barcode || null,
      qrcode: qrcode || null,
      vendor: vendor || null,
      purchaseDate: new Date(purchaseDate),
      purchaseCost: parseFloat(purchaseCost),
      warranty: warranty || null,
      warrantyExpires: warrantyExpires ? new Date(warrantyExpires) : null,
      departmentId: departmentId || null,
      assignedEmployeeId: assignedEmployeeId || null,
      currentLocation: currentLocation,
      categoryId: categoryId,
      lifecycleState: lifecycleState || 'NEW',
      status: status,
      condition: condition || 'Good',
      notes: notes || null,
      purchaseOrderNumber: purchaseOrderNumber || null,
      orderDate: orderDate ? new Date(orderDate) : null
    };

    const newAsset = await assetRepository.create(assetData);

    let oldValues = {};
    let newValues = assetData;

    await logAssetChange(
      newAsset.id,
      'CREATE',
      oldValues,
      newValues,
      req.user.id,
      req.user.role
    );

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      newAsset
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    if (error.message === 'Category not found' || 
        error.message === 'Department not found' || 
        error.message === 'Employee not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getAsset(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { id } = req.params;
    const includeAttachments = req.query.attachments === 'true';
    const includeAuditLogs = req.query.audit === 'true';

    let asset = await assetRepository.findById(id);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (includeAttachments) {
      const attachments = await assetRepository.getAttachments(id);
      asset.attachments = attachments;
    }

    if (includeAuditLogs) {
      const changes = await getAssetChanges(id);
      asset.auditLogs = changes;
    }

    res.json({
      success: true,
      asset
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function listAssets(req, res) {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const searchOptions = {
      ...options,
      query: {
        name: req.query.name,
        assetTag: req.query.assetTag,
        serialNumber: req.query.serialNumber,
        barcode: req.query.barcode,
        vendor: req.query.vendor,
        serialNumber: req.query.serialNumber,
        departmentId: req.query.departmentId,
        categoryId: req.query.categoryId,
        status: req.query.status,
        lifecycleState: req.query.lifecycleState,
        location: req.query.currentLocation
      }
    };

    const result = await assetRepository.search(searchOptions.query, searchOptions);

    res.json({
      success: true,
      message: 'Assets retrieved successfully',
      assets: result.assets,
      meta: result.meta
    });
  } catch (error) {
    console.error('Error listing assets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateAsset(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const asset = await assetRepository.findById(id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const oldValues = { ...asset };

    const validateFields = ['categoryId', 'departmentId', 'assignedEmployeeId'];
    for (const field of validateFields) {
      if (updateData[field]) {
        if (field === 'categoryId') await validateCategoryExists(updateData[field]);
        if (field === 'departmentId') await validateDepartmentExists(updateData[field]);
        if (field === 'assignedEmployeeId') await validateEmployeeExists(updateData[field]);
      }
    }

    if (updateData.assetTag) {
      const existing = await assetRepository.findByAssetTag(updateData.assetTag);
      if (existing && existing.id !== id) {
        return res.status(409).json({ message: 'Asset tag already exists' });
      }
    }

    if (updateData.purchaseDate) {
      updateData.purchaseDate = new Date(updateData.purchaseDate);
    }

    if (updateData.warrantyExpires) {
      updateData.warrantyExpires = new Date(updateData.warrantyExpires);
    }

    if (updateData.orderDate) {
      updateData.orderDate = new Date(updateData.orderDate);
    }

    const updatedAsset = await assetRepository.update(id, updateData);
    const newValues = updatedAsset;

    await logAssetChange(
      id,
      'UPDATE',
      oldValues,
      newValues,
      req.user.id,
      req.user.role
    );

    res.json({
      success: true,
      message: 'Asset updated successfully',
      updatedAsset
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    if (error.message === 'Category not found' || 
        error.message === 'Department not found' || 
        error.message === 'Employee not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteAsset(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { id } = req.params;

    const asset = await assetRepository.findById(id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const deleted = await assetRepository.deleteAsset(id);

    const oldValues = { ...asset };
    const newValues = null;

    await logAssetChange(
      id,
      'DELETE',
      oldValues,
      newValues,
      req.user.id,
      req.user.role
    );

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting asset:', error);
    if (error.message === 'Category not found' || 
        error.message === 'Department not found' || 
        error.message === 'Employee not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function generateCodes(req, res) {
  try {
    const { assetId } = req.params;
    const { codeFormat = 'composite', options = {} } = req.body;

    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    let codes;

    switch (codeFormat.toLowerCase()) {
      case 'qr':
        codes = await generateQRCode(assetId, {
          name: asset.name,
          assetTag: asset.assetTag,
          serialNumber: asset.serialNumber,
          status: asset.status
        });
        break;
      
      case 'barcode':
        codes = await generateBarcode(assetId, 'CODE128', options.width || 2, options.height || 100);
        break;
      
      case 'composite':
        codes = await generateCompositeBarcodeQR(assetId, {
          name: asset.name,
          assetTag: asset.assetTag,
          serialNumber: asset.serialNumber,
          status: asset.status
        });
        break;
      
      default:
        return res.status(400).json({ message: 'Invalid code format. Supported: qr, barcode, composite' });
    }

    res.json({
      success: true,
      message: 'Codes generated successfully',
      codes
    });
  } catch (error) {
    console.error('Error generating codes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function uploadAttachment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { assetId } = req.params;
    const { fileName } = req.body;

    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const attachment = await assetRepository.addAttachment(assetId, {
      fileName: fileName || req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      attachment
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function listAttachments(req, res) {
  try {
    const { assetId } = req.params;

    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const attachments = await assetRepository.getAttachments(assetId);

    res.json({
      success: true,
      attachments
    });
  } catch (error) {
    console.error('Error listing attachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteAttachment(req, res) {
  try {
    const { assetId, attachmentId } = req.params;

    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const attachment = await assetRepository.deleteAttachment(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    await deleteFile(attachment.filePath);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function importAssetsFromCSV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file provided' });
    }

    const { categoryIdMapping = {}, departmentIdMapping = {} } = req.body;
    const { db } = prisma;
    const result = await importFromCSV(req.file, categoryIdMapping, departmentIdMapping, db);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'CSV import failed',
        errors: result.errors
      });
    }

    const report = generateImportReport(result);

    res.json({
      success: true,
      message: 'Assets imported successfully',
      report,
      validatedRecords: result.validatedRecords
    });
  } catch (error) {
    console.error('Error importing assets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function importPreview(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file provided' });
    }

    const preview = await previewCSVRecords(req.file);

    res.json(preview);
  } catch (error) {
    console.error('Error previewing CSV:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function downloadCSVTemplate(req, res) {
  try {
    const template = await createMockCSVTemplate();

    res.json(template);
  } catch (error) {
    console.error('Error generating CSV template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getAssetStats(req, res) {
  try {
    const stats = await assetRepository.getStats();

    res.json({
      success: true,
      message: 'Asset statistics retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Error getting asset stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getAssetHistory(req, res) {
  try {
    const { id } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const history = await getAssetChanges(id, options);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting asset history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getAuditLogs(req, res) {
  try {
    const filters = {
      entityType: 'Asset',
      entityId: req.params.id || undefined,
      action: req.query.action || undefined,
      actorId: req.query.actorId || undefined,
      changedByRole: req.query.role || undefined,
      startDate: req.query.startDate || undefined,
      endDate: req.query.endDate || undefined
    };

    const options = {
      sortBy: req.query.sortBy || 'changedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const logs = await getAuditLogs(filters, options);

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createAsset,
  getAsset,
  listAssets,
  updateAsset,
  deleteAsset,
  generateCodes,
  uploadAttachment,
  listAttachments,
  deleteAttachment,
  importAssetsFromCSV,
  importPreview,
  downloadCSVTemplate,
  getAssetStats,
  getAssetHistory,
  getAuditLogs
};