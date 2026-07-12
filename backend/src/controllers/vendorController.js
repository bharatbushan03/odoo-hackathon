const {
  vendorRepository,
  vendorContactRepository,
  purchaseOrderRepository,
  warrantyRepository,
} = require('../services/vendorRepository');

/**
 * Validation helper for vendor data
 */
function validateVendorData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.name) {
    errors.push('Vendor name is required');
  }

  if (data.name && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    errors.push('Vendor name must be a non-empty string');
  }

  if (!isUpdate && !data.code) {
    errors.push('Vendor code is required');
  }

  if (data.code && (typeof data.code !== 'string' || data.code.trim().length === 0)) {
    errors.push('Vendor code must be a non-empty string');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.rating !== undefined) {
    const rating = parseFloat(data.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push('Rating must be between 0 and 5');
    }
  }

  if (data.creditLimit !== undefined) {
    const limit = parseFloat(data.creditLimit);
    if (isNaN(limit) || limit < 0) {
      errors.push('Credit limit must be a positive number');
    }
  }

  if (data.status && !['ACTIVE', 'INACTIVE', 'BLOCKED', 'UNDER_REVIEW'].includes(data.status)) {
    errors.push('Invalid status value');
  }

  return errors;
}

/**
 * Validation helper for vendor contact data
 */
function validateContactData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.name) {
    errors.push('Contact name is required');
  }

  if (data.name && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    errors.push('Contact name must be a non-empty string');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.vendorId && typeof data.vendorId !== 'string') {
    errors.push('Vendor ID must be a string');
  }

  return errors;
}

/**
 * Validation helper for purchase order data
 */
function validatePurchaseOrderData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.orderNumber) {
    errors.push('Order number is required');
  }

  if (!isUpdate && !data.vendorId) {
    errors.push('Vendor ID is required');
  }

  if (!isUpdate && !data.orderDate) {
    errors.push('Order date is required');
  }

  if (!isUpdate && !data.totalAmount) {
    errors.push('Total amount is required');
  }

  if (data.totalAmount !== undefined) {
    const amount = parseFloat(data.totalAmount);
    if (isNaN(amount) || amount < 0) {
      errors.push('Total amount must be a positive number');
    }
  }

  if (data.status && !['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'].includes(data.status)) {
    errors.push('Invalid status value');
  }

  if (data.items && !Array.isArray(data.items)) {
    errors.push('Items must be an array');
  }

  return errors;
}

/**
 * Validation helper for warranty data
 */
function validateWarrantyData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.vendorId) {
    errors.push('Vendor ID is required');
  }

  if (!isUpdate && !data.assetId) {
    errors.push('Asset ID is required');
  }

  if (!isUpdate && !data.startDate) {
    errors.push('Start date is required');
  }

  if (!isUpdate && !data.endDate) {
    errors.push('End date is required');
  }

  if (!isUpdate && !data.type) {
    errors.push('Warranty type is required');
  }

  if (data.type && !['STANDARD', 'EXTENDED', 'MANUFACTURER', 'THIRD_PARTY'].includes(data.type)) {
    errors.push('Invalid warranty type');
  }

  if (data.status && !['ACTIVE', 'EXPIRED', 'CANCELLED', 'CLAIMED'].includes(data.status)) {
    errors.push('Invalid status value');
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
    status: req.query.status,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    isPreferred: req.query.isPreferred === 'true' ? true : req.query.isPreferred === 'false' ? false : undefined,
    sortBy: req.query.sortBy || 'name',
    sortOrder: req.query.sortOrder || 'asc',
    includeContacts: req.query.includeContacts === 'true',
    includePurchaseOrders: req.query.includePurchaseOrders === 'true',
    includeWarranties: req.query.includeWarranties === 'true',
  };

  // Validate pagination
  if (options.page < 1) options.page = 1;
  if (options.limit < 1 || options.limit > 100) options.limit = 10;

  // Validate sort order
  if (!['asc', 'desc'].includes(options.sortOrder.toLowerCase())) {
    options.sortOrder = 'asc';
  }

  // Validate sort field
  const validSortFields = ['name', 'code', 'rating', 'createdAt', 'updatedAt'];
  if (!validSortFields.includes(options.sortBy)) {
    options.sortBy = 'name';
  }

  return options;
}

// ==================== VENDOR CONTROLLERS ====================

/**
 * Create a new vendor
 */
async function createVendor(req, res) {
  try {
    const errors = validateVendorData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    // Check if vendor code already exists
    const existingVendor = await vendorRepository.findByCode(req.body.code);
    if (existingVendor) {
      return res.status(409).json({ message: 'Vendor code already exists' });
    }

    const vendorData = {
      ...req.body,
      name: req.body.name.trim(),
      code: req.body.code.trim(),
    };

    const newVendor = await vendorRepository.create(vendorData);
    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Vendor code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get all vendors with pagination, filtering, search, and sorting
 */
async function listVendors(req, res) {
  try {
    const options = parseQueryOptions(req);
    options.organizationId = req.user.organizationId; // Assuming user has organizationId
    
    const result = await vendorRepository.findAll(options);
    res.json(result);
  } catch (error) {
    console.error('Error listing vendors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get vendor by ID
 */
async function getVendor(req, res) {
  try {
    const vendor = await vendorRepository.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Error getting vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update vendor
 */
async function updateVendor(req, res) {
  try {
    const errors = validateVendorData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const current = await vendorRepository.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Check if code is being changed and if it already exists
    if (req.body.code && req.body.code !== current.code) {
      const existingVendor = await vendorRepository.findByCode(req.body.code);
      if (existingVendor) {
        return res.status(409).json({ message: 'Vendor code already exists' });
      }
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.code !== undefined) updateData.code = req.body.code.trim();
    if (req.body.contactPerson !== undefined) updateData.contactPerson = req.body.contactPerson;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.city !== undefined) updateData.city = req.body.city;
    if (req.body.state !== undefined) updateData.state = req.body.state;
    if (req.body.country !== undefined) updateData.country = req.body.country;
    if (req.body.zipCode !== undefined) updateData.zipCode = req.body.zipCode;
    if (req.body.taxId !== undefined) updateData.taxId = req.body.taxId;
    if (req.body.paymentTerms !== undefined) updateData.paymentTerms = req.body.paymentTerms;
    if (req.body.isPreferred !== undefined) updateData.isPreferred = req.body.isPreferred;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    if (req.body.rating !== undefined) updateData.rating = parseFloat(req.body.rating);
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.website !== undefined) updateData.website = req.body.website;
    if (req.body.creditLimit !== undefined) updateData.creditLimit = parseFloat(req.body.creditLimit);
    if (req.body.currency !== undefined) updateData.currency = req.body.currency;

    const updated = await vendorRepository.update(req.params.id, updateData);
    res.json(updated);
  } catch (error) {
    console.error('Error updating vendor:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Vendor code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Delete vendor
 */
async function deleteVendor(req, res) {
  try {
    const vendor = await vendorRepository.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const canDelete = await vendorRepository.canDelete(req.params.id);
    if (!canDelete.canDelete) {
      return res.status(409).json({
        message: 'Cannot delete vendor',
        blockers: canDelete.blockers,
      });
    }

    await vendorRepository.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get vendor statistics
 */
async function getVendorStatistics(req, res) {
  try {
    const stats = await vendorRepository.getStatistics(req.params.id);
    
    if (!stats) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting vendor statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update vendor rating
 */
async function updateVendorRating(req, res) {
  try {
    const { rating } = req.body;
    if (rating === undefined || rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    const updated = await vendorRepository.updateRating(req.params.id, parseFloat(rating));
    res.json(updated);
  } catch (error) {
    console.error('Error updating vendor rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Search vendors
 */
async function searchVendors(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const options = parseQueryOptions(req);
    options.organizationId = req.user.organizationId;
    
    const result = await vendorRepository.search(q, options);
    res.json(result);
  } catch (error) {
    console.error('Error searching vendors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get preferred vendors
 */
async function getPreferredVendors(req, res) {
  try {
    const vendors = await vendorRepository.findPreferredVendors(req.user.organizationId);
    res.json(vendors);
  } catch (error) {
    console.error('Error getting preferred vendors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ==================== VENDOR CONTACT CONTROLLERS ====================

/**
 * Create a new vendor contact
 */
async function createVendorContact(req, res) {
  try {
    const errors = validateContactData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const contactData = {
      ...req.body,
      name: req.body.name.trim(),
    };

    const newContact = await vendorContactRepository.create(contactData);
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error creating vendor contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get all contacts for a vendor
 */
async function getVendorContacts(req, res) {
  try {
    const contacts = await vendorContactRepository.findByVendorId(req.params.vendorId);
    res.json(contacts);
  } catch (error) {
    console.error('Error getting vendor contacts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get contact by ID
 */
async function getVendorContact(req, res) {
  try {
    const contact = await vendorContactRepository.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Vendor contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error getting vendor contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update vendor contact
 */
async function updateVendorContact(req, res) {
  try {
    const errors = validateContactData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.position !== undefined) updateData.position = req.body.position;
    if (req.body.isPrimary !== undefined) updateData.isPrimary = req.body.isPrimary;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;

    const updated = await vendorContactRepository.update(req.params.id, updateData);
    res.json(updated);
  } catch (error) {
    console.error('Error updating vendor contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Delete vendor contact
 */
async function deleteVendorContact(req, res) {
  try {
    await vendorContactRepository.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting vendor contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Set contact as primary
 */
async function setPrimaryContact(req, res) {
  try {
    const updated = await vendorContactRepository.setAsPrimary(req.params.id);
    if (!updated) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error setting primary contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ==================== PURCHASE ORDER CONTROLLERS ====================

/**
 * Create a new purchase order
 */
async function createPurchaseOrder(req, res) {
  try {
    const errors = validatePurchaseOrderData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const orderData = {
      ...req.body,
      orderNumber: req.body.orderNumber.trim(),
    };

    const newOrder = await purchaseOrderRepository.create(orderData);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Order number already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get all purchase orders
 */
async function listPurchaseOrders(req, res) {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      vendorId: req.query.vendorId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy || 'orderDate',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await purchaseOrderRepository.findAll(options);
    res.json(result);
  } catch (error) {
    console.error('Error listing purchase orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get purchase order by ID
 */
async function getPurchaseOrder(req, res) {
  try {
    const order = await purchaseOrderRepository.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error getting purchase order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update purchase order
 */
async function updatePurchaseOrder(req, res) {
  try {
    const errors = validatePurchaseOrderData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const updateData = {};
    if (req.body.orderNumber !== undefined) updateData.orderNumber = req.body.orderNumber.trim();
    if (req.body.expectedDate !== undefined) updateData.expectedDate = req.body.expectedDate;
    if (req.body.receivedDate !== undefined) updateData.receivedDate = req.body.receivedDate;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.totalAmount !== undefined) updateData.totalAmount = parseFloat(req.body.totalAmount);
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.internalNotes !== undefined) updateData.internalNotes = req.body.internalNotes;

    const updated = await purchaseOrderRepository.update(req.params.id, updateData);
    res.json(updated);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Delete purchase order
 */
async function deletePurchaseOrder(req, res) {
  try {
    await purchaseOrderRepository.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ==================== WARRANTY CONTROLLERS ====================

/**
 * Create a new warranty
 */
async function createWarranty(req, res) {
  try {
    const errors = validateWarrantyData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const warrantyData = {
      ...req.body,
      warrantyNumber: req.body.warrantyNumber?.trim(),
    };

    const newWarranty = await warrantyRepository.create(warrantyData);
    res.status(201).json(newWarranty);
  } catch (error) {
    console.error('Error creating warranty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get all warranties
 */
async function listWarranties(req, res) {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      vendorId: req.query.vendorId,
      assetId: req.query.assetId,
      status: req.query.status,
      type: req.query.type,
      sortBy: req.query.sortBy || 'startDate',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await warrantyRepository.findAll(options);
    res.json(result);
  } catch (error) {
    console.error('Error listing warranties:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get warranty by ID
 */
async function getWarranty(req, res) {
  try {
    const warranty = await warrantyRepository.findById(req.params.id);
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    res.json(warranty);
  } catch (error) {
    console.error('Error getting warranty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update warranty
 */
async function updateWarranty(req, res) {
  try {
    const errors = validateWarrantyData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const updateData = {};
    if (req.body.warrantyNumber !== undefined) updateData.warrantyNumber = req.body.warrantyNumber.trim();
    if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate;
    if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.coverage !== undefined) updateData.coverage = req.body.coverage;
    if (req.body.terms !== undefined) updateData.terms = req.body.terms;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;

    const updated = await warrantyRepository.update(req.params.id, updateData);
    res.json(updated);
  } catch (error) {
    console.error('Error updating warranty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Delete warranty
 */
async function deleteWarranty(req, res) {
  try {
    await warrantyRepository.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting warranty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get active warranties for an asset
 */
async function getAssetWarranties(req, res) {
  try {
    const warranties = await warrantyRepository.findActiveByAssetId(req.params.assetId);
    res.json(warranties);
  } catch (error) {
    console.error('Error getting asset warranties:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get expiring warranties
 */
async function getExpiringWarranties(req, res) {
  try {
    const days = parseInt(req.query.days) || 30;
    const warranties = await warrantyRepository.findExpiring(days);
    res.json(warranties);
  } catch (error) {
    console.error('Error getting expiring warranties:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  // Vendor controllers
  createVendor,
  listVendors,
  getVendor,
  updateVendor,
  deleteVendor,
  getVendorStatistics,
  updateVendorRating,
  searchVendors,
  getPreferredVendors,
  
  // Vendor contact controllers
  createVendorContact,
  getVendorContacts,
  getVendorContact,
  updateVendorContact,
  deleteVendorContact,
  setPrimaryContact,
  
  // Purchase order controllers
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  
  // Warranty controllers
  createWarranty,
  listWarranties,
  getWarranty,
  updateWarranty,
  deleteWarranty,
  getAssetWarranties,
  getExpiringWarranties,
};