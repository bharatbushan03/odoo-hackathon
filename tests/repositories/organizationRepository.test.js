const OrganizationRepository = require('../../src/repositories/organizationRepository');
const { mockOrganization } = require('../utils/testHelpers');
const prisma = require('../../src/config/database');

describe('OrganizationRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new OrganizationRepository();
  });

  describe('softDelete', () => {
    it('should soft delete an organization by setting deletedAt', async () => {
      const org = mockOrganization({ id: 'org-123' });
      prisma.organization.update.mockResolvedValue({ ...org, deletedAt: new Date() });

      const result = await repository.softDelete('org-123');

      expect(result.deletedAt).toBeDefined();
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('findByIdActive', () => {
    it('should find organization by id where deletedAt is null', async () => {
      const org = mockOrganization({ id: 'org-123', deletedAt: null });
      prisma.organization.findFirst.mockResolvedValue(org);

      const result = await repository.findByIdActive('org-123');

      expect(result).toEqual(org);
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: { id: 'org-123', deletedAt: null },
      });
    });

    it('should return null if organization is soft deleted', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);

      const result = await repository.findByIdActive('org-123');

      expect(result).toBeNull();
    });
  });

  describe('findActiveWithPagination', () => {
    it('should find active organizations with pagination', async () => {
      const mockOrgs = [mockOrganization(), mockOrganization({ id: 'org-2' })];
      prisma.organization.findMany.mockResolvedValue(mockOrgs);
      prisma.organization.count.mockResolvedValue(2);

      const result = await repository.findActiveWithPagination({
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual(mockOrgs);
      expect(result.meta.total).toBe(2);
      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: undefined,
      });
    });

    it('should merge custom where clause with deletedAt null', async () => {
      const mockOrgs = [mockOrganization({ name: 'Test Org' })];
      prisma.organization.findMany.mockResolvedValue(mockOrgs);
      prisma.organization.count.mockResolvedValue(1);

      const result = await repository.findActiveWithPagination({
        where: { name: 'Test Org' },
        page: 1,
        limit: 10,
      });

      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: { name: 'Test Org', deletedAt: null },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: undefined,
      });
    });

    it('should accept custom orderBy', async () => {
      const mockOrgs = [mockOrganization()];
      prisma.organization.findMany.mockResolvedValue(mockOrgs);
      prisma.organization.count.mockResolvedValue(1);

      const result = await repository.findActiveWithPagination({
        orderBy: { name: 'asc' },
      });

      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        include: undefined,
      });
    });
  });
});
