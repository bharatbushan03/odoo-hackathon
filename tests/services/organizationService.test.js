const OrganizationService = require('../../src/services/organizationService');
const { mockOrganization } = require('../utils/testHelpers');
const ApiError = require('../../src/utils/ApiError');

describe('OrganizationService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      findByIdActive: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      delete: jest.fn(),
      findActiveWithPagination: jest.fn(),
    };
    service = new OrganizationService(mockRepository);
  });

  describe('createOrganization', () => {
    it('should create organization with valid data', async () => {
      const orgData = { name: 'Test Org', code: 'TEST001' };
      const createdOrg = mockOrganization(orgData);

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdOrg);

      const result = await service.createOrganization(orgData);

      expect(result).toEqual(createdOrg);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        code: 'TEST001',
        deletedAt: null,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(orgData);
    });

    it('should throw conflict error if code already exists', async () => {
      const orgData = { name: 'Test Org', code: 'TEST001' };
      mockRepository.findOne.mockResolvedValue(mockOrganization({ code: 'TEST001' }));

      await expect(service.createOrganization(orgData)).rejects.toThrow(ApiError);
      await expect(service.createOrganization(orgData)).rejects.toThrow('already exists');
    });
  });

  describe('getOrganizationById', () => {
    it('should get organization by id', async () => {
      const org = mockOrganization({ id: 'org-123' });
      mockRepository.findByIdActive.mockResolvedValue(org);

      const result = await service.getOrganizationById('org-123');

      expect(result).toEqual(org);
      expect(mockRepository.findByIdActive).toHaveBeenCalledWith('org-123');
    });

    it('should throw not found error if organization does not exist', async () => {
      mockRepository.findByIdActive.mockResolvedValue(null);

      await expect(service.getOrganizationById('nonexistent')).rejects.toThrow(ApiError);
      await expect(service.getOrganizationById('nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('updateOrganization', () => {
    it('should update organization', async () => {
      const org = mockOrganization({ id: 'org-123', code: 'OLD001' });
      const updateData = { name: 'Updated Name' };
      const updatedOrg = { ...org, ...updateData };

      mockRepository.findByIdActive.mockResolvedValue(org);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updatedOrg);

      const result = await service.updateOrganization('org-123', updateData);

      expect(result).toEqual(updatedOrg);
      expect(mockRepository.update).toHaveBeenCalledWith('org-123', updateData);
    });

    it('should throw conflict error if new code already exists', async () => {
      const org = mockOrganization({ id: 'org-123', code: 'OLD001' });
      const existingOrg = mockOrganization({ id: 'org-456', code: 'NEW001' });

      mockRepository.findByIdActive.mockResolvedValue(org);
      mockRepository.findOne.mockResolvedValue(existingOrg);

      await expect(service.updateOrganization('org-123', { code: 'NEW001' })).rejects.toThrow(ApiError);
      await expect(service.updateOrganization('org-123', { code: 'NEW001' })).rejects.toThrow('already exists');
    });

    it('should allow updating to same code', async () => {
      const org = mockOrganization({ id: 'org-123', code: 'SAME001' });
      const updatedOrg = { ...org, name: 'Updated' };

      mockRepository.findByIdActive.mockResolvedValue(org);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updatedOrg);

      const result = await service.updateOrganization('org-123', { code: 'SAME001', name: 'Updated' });

      expect(result).toEqual(updatedOrg);
      // When code is the same, the service doesn't check for duplicates
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('deleteOrganization', () => {
    it('should soft delete organization by default', async () => {
      const org = mockOrganization({ id: 'org-123' });
      mockRepository.findByIdActive.mockResolvedValue(org);
      mockRepository.softDelete.mockResolvedValue({ ...org, deletedAt: new Date() });

      await service.deleteOrganization('org-123');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('org-123');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should hard delete organization when soft=false', async () => {
      const org = mockOrganization({ id: 'org-123' });
      mockRepository.findByIdActive.mockResolvedValue(org);
      mockRepository.delete.mockResolvedValue(org);

      await service.deleteOrganization('org-123', false);

      expect(mockRepository.delete).toHaveBeenCalledWith('org-123');
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw not found error if organization does not exist', async () => {
      mockRepository.findByIdActive.mockResolvedValue(null);

      await expect(service.deleteOrganization('nonexistent')).rejects.toThrow(ApiError);
    });
  });

  describe('listOrganizations', () => {
    it('should list organizations with pagination', async () => {
      const mockOrgs = [mockOrganization(), mockOrganization()];
      const mockMeta = {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockRepository.findActiveWithPagination.mockResolvedValue({
        data: mockOrgs,
        meta: mockMeta,
      });

      const result = await service.listOrganizations({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockOrgs);
      expect(result.meta).toEqual(mockMeta);
      expect(mockRepository.findActiveWithPagination).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('should accept custom orderBy', async () => {
      mockRepository.findActiveWithPagination.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      });

      await service.listOrganizations({ orderBy: { name: 'asc' } });

      expect(mockRepository.findActiveWithPagination).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('updateLogo', () => {
    it('should update organization logo', async () => {
      const org = mockOrganization({ id: 'org-123' });
      const logoPath = '/uploads/logo.jpg';
      const updatedOrg = { ...org, logo: logoPath };

      mockRepository.findByIdActive.mockResolvedValue(org);
      mockRepository.update.mockResolvedValue(updatedOrg);

      const result = await service.updateLogo('org-123', logoPath);

      expect(result).toEqual(updatedOrg);
      expect(mockRepository.update).toHaveBeenCalledWith('org-123', { logo: logoPath });
    });

    it('should throw not found error if organization does not exist', async () => {
      mockRepository.findByIdActive.mockResolvedValue(null);

      await expect(service.updateLogo('nonexistent', '/uploads/logo.jpg')).rejects.toThrow(ApiError);
    });
  });
});
