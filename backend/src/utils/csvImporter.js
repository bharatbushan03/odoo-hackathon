const { parse } = require('csv-parse/sync');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { processFileUpload, validateFile } = require('./upload');

const REQUIRED_HEADERS = [
  'Asset_ID',
  'Asset_Name',
  'Vendor',
  'Purchase_Date',
  'Purchase_Cost',
  'Category',
  'Department'
];

const OPTIONAL_HEADERS = [
  'Serial_Number',
  'Barcode',
  'QR_Code',
  'Warranty',
  'Warranty_Expires',
  'Assigned_Employee',
  'Current_Location',
  'Lifecycle_State',
  'Status',
  'Condition',
  'Notes',
  'Purchase_Order_Number',
  'Order_Date'
];

function validateCSVHeader(headers) {
  const missingHeaders = REQUIRED_HEADERS.filter(header => !headers.includes(header));
  const extraHeaders = headers.filter(header => !REQUIRED_HEADERS.includes(header) && !OPTIONAL_HEADERS.includes(header));

  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
    extraHeaders,
    warnings: []
  };
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function parseNumber(numStr) {
  if (!numStr) return null;
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

function parseString(str) {
  if (!str) return null;
  return str.toString().trim();
}

async function processCSVFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    if (records.length === 0) {
      return {
        success: false,
        errors: ['CSV file is empty']
      };
    }

    return {
      success: true,
      records
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse CSV: ${error.message}`]
    };
  }
}

function validateAssetRecord(record) {
  const errors = [];
  const warnings = [];

  const requiredFields = ['asset_id', 'asset_name', 'vendor', 'purchase_date', 'purchase_cost', 'category'];

  for (const field of requiredFields) {
    if (!record[field]) {
      errors.push(`Required field '${field}' is missing`);
    }
  }

  if (record.purchase_date) {
    const date = parseDate(record.purchase_date);
    if (!date) {
      errors.push(`Invalid date format for purchase_date: ${record.purchase_date}`);
    }
  }

  if (record.purchase_cost) {
    const cost = parseNumber(record.purchase_cost);
    if (cost !== null && (cost <= 0 || isNaN(cost))) {
      errors.push(`Invalid purchase_cost value: ${record.purchase_cost}`);
    }
  }

  if (record.warranty && record.warranty_expires) {
    const warrantyDate = parseDate(record.warranty_expires);
    const purchaseDate = parseDate(record.purchase_date);
    
    if (!warrantyDate) {
      warnings.push(`Invalid warranty_expires date format: ${record.warranty_expires}`);
    } else if (purchaseDate && warrantyDate < purchaseDate) {
      errors.push(`Warranty expires before purchase date`);
    }
  }

  if (record.current_location && record.current_location.length > 255) {
    errors.push('Current_Location exceeds maximum length of 255 characters');
  }

  if (record.lifecycle_state && !['NEW', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DISPOSED'].includes(record.lifecycle_state.toUpperCase())) {
    errors.push(`Invalid Lifecycle_State value: ${record.lifecycle_state}. Must be one of: NEW, IN_USE, MAINTENANCE, RETIRED, DISPOSED`);
  }

  const statusEnum = ['Available', 'Allocated', 'Reserved', 'UnderMaintenance', 'Lost', 'Retired', 'Disposed'];
  if (record.status && !statusEnum.includes(record.status)) {
    errors.push(`Invalid Status value: ${record.status}`);
  }

  const conditionEnum = ['New', 'Good', 'Fair', 'Poor'];
  if (record.condition && !conditionEnum.includes(record.condition)) {
    warnings.push(`Unknown Condition value: ${record.condition}. Supported: ${conditionEnum.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

function normalizeAssetData(record) {
  return {
    assetId: parseString(record.asset_id) || crypto.randomUUID(),
    name: parseString(record.asset_name),
    vendor: parseString(record.vendor),
    serialNumber: parseString(record.serial_number),
    barcode: parseString(record.barcode),
    qrcode: parseString(record.qr_code),
    purchaseDate: parseDate(record.purchase_date),
    purchaseCost: parseNumber(record.purchase_cost),
    warranty: parseString(record.warranty),
    warrantyExpires: parseDate(record.warranty_expires),
    departmentId: parseString(record.department),
    categoryId: parseString(record.category),
    assignedEmployeeId: parseString(record.assigned_employee),
    currentLocation: parseString(record.current_location),
    lifecycleState: record.lifecycle_state ? record.lifecycle_state.toUpperCase() : 'NEW',
    status: record.status || 'Available',
    condition: record.condition || 'Good',
    notes: parseString(record.notes),
    purchaseOrderNumber: parseString(record.purchase_order_number),
    orderDate: parseDate(record.order_date)
  };
}

async function importFromCSV(file, categoryIdMapping = {}, departmentIdMapping = {}) {
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  const filePath = await processFileUpload(file);
  
  const csvProcessing = await processCSVFile(filePath.path);
  if (!csvProcessing.success) {
    throw new Error(csvProcessing.errors.join(', '));
  }

  const { records } = csvProcessing;
  const validatedRecords = [];
  const errors = [];

  for (const record of records) {
    const assetData = normalizeAssetData(record);
    
    const validation = validateAssetRecord(record);
    if (!validation.isValid) {
      errors.push({ row: record['Asset_ID'], message: validation.errors.join(', ') });
      continue;
    }

    if (validation.warnings.length > 0) {
      errors.push({ 
        row: record['Asset_ID'], 
        message: 'Warnings: ' + validation.warnings.join(', ') 
      });
    }

    if (!assetData.categoryId || !categoryIdMapping[assetData.categoryId]) {
      errors.push({ 
        row: record['Asset_ID'], 
        message: `Category '${assetData.categoryId}' not found in mapping` 
      });
      continue;
    }

    if (!assetData.departmentId || !departmentIdMapping[assetData.departmentId]) {
      errors.push({ 
        row: record['Asset_ID'], 
        message: `Department '${assetData.departmentId}' not found in mapping` 
      });
      continue;
    }

    assetData.categoryId = categoryIdMapping[assetData.categoryId];
    assetData.departmentId = departmentIdMapping[assetData.departmentId];
    validatedRecords.push(assetData);
  }

  return {
    success: true,
    importedCount: validatedRecords.length,
    failedCount: records.length - validatedRecords.length,
    errors: errors.length > 0 ? errors : undefined,
    validatedRecords
  };
}

async function createMockCSVTemplate() {
  const headers = [
    ...REQUIRED_HEADERS.map(h => h.replace(/_/g, ' ')),
    ...OPTIONAL_HEADERS.map(h => h.replace(/_/g, ' '))
  ];

  const mockData = [
    {
      'Asset ID': 'AST-001',
      'Asset Name': 'MacBook Pro M2',
      'Vendor': 'Apple',
      'Purchase Date': '2024-01-15',
      'Purchase Cost': '2499.99',
      'Category': 'Laptops',
      'Department': 'IT',
      'Serial Number': 'MQD83LL/A',
      'Barcode': '978-1234567890',
      'QR Code': 'https://example.com/qr/AST-001',
      'Warranty': '2 years',
      'Warranty Expires': '2026-01-15',
      'Assigned Employee': 'John Doe',
      'Current Location': 'IT Department',
      'Lifecycle State': 'In Use',
      'Status': 'Available',
      'Condition': 'Good',
      'Notes': 'Primary work laptop',
      'Purchase Order Number': 'PO-12345',
      'Order Date': '2024-01-10'
    }
  ];

  return {
    success: true,
    headers,
    sampleData: mockData
  };
}

function validateImportMapping(mappings) {
  const errors = [];

  if (!mappings.category || !mappings.department) {
    errors.push('Missing required mappings: category, department');
  }

  if (mappings.vendor && typeof mappings.vendor !== 'string') {
    errors.push('Vendor mapping must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function generateImportReport(result) {
  return {
    importId: crypto.randomUUID(),
    totalRows: result.importedCount + result.failedCount,
    successfulImports: result.importedCount,
    failedImports: result.failedCount,
    errors: result.errors,
    timestamp: new Date().toISOString(),
    status: result.failedCount > 0 ? 'partial_success' : 'success'
  };
}

async function previewCSVRecords(file) {
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  const filePath = await processFileUpload(file);
  
  const sampleProcessing = await processCSVFile(filePath.path);
  if (!sampleProcessing.success) {
    throw new Error(sampleProcessing.errors.join(', '));
  }

  const { records } = sampleProcessing;
  
  const previewLimit = 10;
  const previews = [];

  for (let i = 0; i < Math.min(records.length, previewLimit); i++) {
    const record = records[i];
    previews.push({
      row: i + 2,
      assetId: record.asset_id || 'N/A',
      assetName: record.asset_name || 'N/A',
      vendor: record.vendor || 'N/A',
    });
  }

  return {
    success: true,
    totalRecords: records.length,
    preview,
    headers: Object.keys(records[0] || {})
  };
}

module.exports = {
  REQUIRED_HEADERS,
  OPTIONAL_HEADERS,
  validateCSVHeader,
  parseDate,
  parseNumber,
  parseString,
  processCSVFile,
  validateAssetRecord,
  normalizeAssetData,
  importFromCSV,
  createMockCSVTemplate,
  validateImportMapping,
  generateImportReport,
  previewCSVRecords
};