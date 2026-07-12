const prisma = require('../config/prisma');

class VendorRepository {
  /**
   * Create a new vendor
   */
  async create(data) {
    return await prisma.vendor.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        code: data.code,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        taxId: data.taxId,
        paymentTerms: data.paymentTerms,
        isPreferred: data.isPreferred || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
        rating: data.rating || 0,
        status: data.status || 'ACTIVE',
        notes: data.notes,
        website: data.website,
        creditLimit: data.creditLimit,
        currency: data.currency || 'USD',
      },
      include: this.getIncludes(),
    });
  }

  /**
   * Find vendor by ID
   */
  async findById(id) {
    return await prisma.vendor.findUnique({
      where: { id },
      include: this.getIncludes(true),
    });
  }

  /**
   * Find vendor by code
   */
  async findByCode(code) {
    return await prisma.vendor.findUnique({
      where: { code },
      include: this.getIncludes(true),
    });
  }

  /**
   * Find all vendors with filtering, pagination, search, and sorting
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      isActive,
      isPreferred,
      organizationId,
      sortBy = 'name',
      sortOrder = 'asc',
      includeContacts = false,
      includePurchaseOrders = false,
      includeWarranties = false,
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    // Build where clause
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPreferred !== undefined) {
      where.isPreferred = isPreferred;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getIncludes(includeContacts, includePurchaseOrders, includeWarranties),
      }),
      prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update vendor
   */
  async update(id, data) {
    return await prisma.vendor.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
        ...(data.taxId !== undefined && { taxId: data.taxId }),
        ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
        ...(data.isPreferred !== undefined && { isPreferred: data.isPreferred }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
        ...(data.currency !== undefined && { currency: data.currency }),
      },
      include: this.getIncludes(true),
    });
  }

  /**
   * Delete vendor
   */
  async delete(id) {
    return await prisma.vendor.delete({
      where: { id },
    });
  }

  /**
   * Get vendor statistics
   */
  async getStatistics(id) {
    const vendor = await this.findById(id);
    if (!vendor) {
      return null;
    }

    const [
      purchaseOrderCount,
      totalPurchaseAmount,
      warrantyCount,
      activeWarrantyCount,
      assetCount,
    ] = await Promise.all([
      prisma.purchaseOrder.count({ where: { vendorId: id } }),
      prisma.purchaseOrder.aggregate({
        where: { vendorId: id },
        _sum: { totalAmount: true },
      }),
      prisma.warranty.count({ where: { vendorId: id } }),
      prisma.warranty.count({ where: { vendorId: id, status: 'ACTIVE' } }),
      prisma.asset.count({ where: { vendorId: id } }),
    ]);

    return {
      vendorId: id,
      purchaseOrders: {
        total: purchaseOrderCount,
        totalAmount: totalPurchaseAmount._sum.totalAmount || 0,
      },
      warranties: {
        total: warrantyCount,
        active: activeWarrantyCount,
      },
      assets: assetCount,
    };
  }

  /**
   * Update vendor rating
   */
  async updateRating(id, rating) {
    return await prisma.vendor.update({
      where: { id },
      data: { rating },
      include: this.getIncludes(),
    });
  }

  /**
   * Check if vendor can be deleted
   */
  async canDelete(id) {
    const [purchaseOrderCount, warrantyCount, assetCount] = await Promise.all([
      prisma.purchaseOrder.count({ where: { vendorId: id } }),
      prisma.warranty.count({ where: { vendorId: id } }),
      prisma.asset.count({ where: { vendorId: id } }),
    ]);

    return {
      canDelete: purchaseOrderCount === 0 && warrantyCount === 0 && assetCount === 0,
      blockers: {
        purchaseOrders: purchaseOrderCount,
        warranties: warrantyCount,
        assets: assetCount,
      },
    };
  }

  /**
   * Search vendors
   */
  async search(query, options = {}) {
    return await this.findAll({
      ...options,
      search: query,
    });
  }

  /**
   * Get preferred vendors
   */
  async findPreferredVendors(organizationId) {
    return await prisma.vendor.findMany({
      where: {
        organizationId,
        isPreferred: true,
        isActive: true,
      },
      include: this.getIncludes(),
      orderBy: { rating: 'desc' },
    });
  }

  /**
   * Get includes for queries
   */
  getIncludes(includeContacts = false, includePurchaseOrders = false, includeWarranties = false) {
    const includes = {};

    if (includeContacts) {
      includes.contacts = {
        orderBy: { isPrimary: 'desc' },
      };
    }

    if (includePurchaseOrders) {
      includes.purchaseOrders = {
        orderBy: { orderDate: 'desc' },
        take: 10,
      };
    }

    if (includeWarranties) {
      includes.warranties = {
        orderBy: { startDate: 'desc' },
        take: 10,
      };
    }

    return includes;
  }
}

class VendorContactRepository {
  /**
   * Create a new vendor contact
   */
  async create(data) {
    // If this is primary, set all other contacts to non-primary
    if (data.isPrimary) {
      await prisma.vendorContact.updateMany({
        where: { vendorId: data.vendorId },
        data: { isPrimary: false },
      });
    }

    return await prisma.vendorContact.create({
      data: {
        vendorId: data.vendorId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        isPrimary: data.isPrimary || false,
        notes: data.notes,
      },
    });
  }

  /**
   * Find contact by ID
   */
  async findById(id) {
    return await prisma.vendorContact.findUnique({
      where: { id },
      include: { vendor: true },
    });
  }

  /**
   * Find all contacts for a vendor
   */
  async findByVendorId(vendorId) {
    return await prisma.vendorContact.findMany({
      where: { vendorId },
      orderBy: { isPrimary: 'desc' },
    });
  }

  /**
   * Update contact
   */
  async update(id, data) {
    // If setting as primary, update other contacts
    if (data.isPrimary) {
      const contact = await this.findById(id);
      if (contact) {
        await prisma.vendorContact.updateMany({
          where: { vendorId: contact.vendorId, id: { not: id } },
          data: { isPrimary: false },
        });
      }
    }

    return await prisma.vendorContact.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { vendor: true },
    });
  }

  /**
   * Delete contact
   */
  async delete(id) {
    return await prisma.vendorContact.delete({
      where: { id },
    });
  }

  /**
   * Set contact as primary
   */
  async setAsPrimary(id) {
    const contact = await this.findById(id);
    if (!contact) return null;

    await prisma.vendorContact.updateMany({
      where: { vendorId: contact.vendorId },
      data: { isPrimary: false },
    });

    return await prisma.vendorContact.update({
      where: { id },
      data: { isPrimary: true },
      include: { vendor: true },
    });
  }
}

class PurchaseOrderRepository {
  /**
   * Create a new purchase order
   */
  async create(data) {
    return await prisma.purchaseOrder.create({
      data: {
        orderNumber: data.orderNumber,
        vendorId: data.vendorId,
        orderDate: data.orderDate,
        expectedDate: data.expectedDate,
        receivedDate: data.receivedDate,
        status: data.status || 'PENDING',
        totalAmount: data.totalAmount,
        currency: data.currency || 'USD',
        notes: data.notes,
        internalNotes: data.internalNotes,
        items: {
          create: data.items || [],
        },
      },
      include: {
        vendor: true,
        items: {
          include: { asset: true },
        },
      },
    });
  }

  /**
   * Find purchase order by ID
   */
  async findById(id) {
    return await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: {
          include: { asset: true },
        },
      },
    });
  }

  /**
   * Find all purchase orders with filtering and pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      vendorId,
      status,
      startDate,
      endDate,
      sortBy = 'orderDate',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = startDate;
      if (endDate) where.orderDate.lte = endDate;
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          vendor: true,
          items: {
            include: { asset: true },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update purchase order
   */
  async update(id, data) {
    return await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(data.orderNumber !== undefined && { orderNumber: data.orderNumber }),
        ...(data.expectedDate !== undefined && { expectedDate: data.expectedDate }),
        ...(data.receivedDate !== undefined && { receivedDate: data.receivedDate }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.internalNotes !== undefined && { internalNotes: data.internalNotes }),
      },
      include: {
        vendor: true,
        items: {
          include: { asset: true },
        },
      },
    });
  }

  /**
   * Delete purchase order
   */
  async delete(id) {
    return await prisma.purchaseOrder.delete({
      where: { id },
    });
  }
}

class WarrantyRepository {
  /**
   * Create a new warranty
   */
  async create(data) {
    return await prisma.warranty.create({
      data: {
        vendorId: data.vendorId,
        assetId: data.assetId,
        warrantyNumber: data.warrantyNumber,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        coverage: data.coverage,
        terms: data.terms,
        status: data.status || 'ACTIVE',
        notes: data.notes,
      },
      include: {
        vendor: true,
        asset: true,
      },
    });
  }

  /**
   * Find warranty by ID
   */
  async findById(id) {
    return await prisma.warranty.findUnique({
      where: { id },
      include: {
        vendor: true,
        asset: true,
        claims: true,
      },
    });
  }

  /**
   * Find all warranties with filtering and pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      vendorId,
      assetId,
      status,
      type,
      sortBy = 'startDate',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    if (vendorId) where.vendorId = vendorId;
    if (assetId) where.assetId = assetId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [warranties, total] = await Promise.all([
      prisma.warranty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          vendor: true,
          asset: true,
        },
      }),
      prisma.warranty.count({ where }),
    ]);

    return {
      data: warranties,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update warranty
   */
  async update(id, data) {
    return await prisma.warranty.update({
      where: { id },
      data: {
        ...(data.warrantyNumber !== undefined && { warrantyNumber: data.warrantyNumber }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.coverage !== undefined && { coverage: data.coverage }),
        ...(data.terms !== undefined && { terms: data.terms }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        vendor: true,
        asset: true,
        claims: true,
      },
    });
  }

  /**
   * Delete warranty
   */
  async delete(id) {
    return await prisma.warranty.delete({
      where: { id },
    });
  }

  /**
   * Get active warranties for an asset
   */
  async findActiveByAssetId(assetId) {
    return await prisma.warranty.findMany({
      where: {
        assetId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      include: {
        vendor: true,
        asset: true,
      },
      orderBy: { endDate: 'asc' },
    });
  }

  /**
   * Get expiring warranties
   */
  async findExpiring(days = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return await prisma.warranty.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      include: {
        vendor: true,
        asset: true,
      },
      orderBy: { endDate: 'asc' },
    });
  }
}

module.exports = {
  vendorRepository: new VendorRepository(),
  vendorContactRepository: new VendorContactRepository(),
  purchaseOrderRepository: new PurchaseOrderRepository(),
  warrantyRepository: new WarrantyRepository(),
};