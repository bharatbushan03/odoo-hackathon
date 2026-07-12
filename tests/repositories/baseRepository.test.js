const BaseRepository = require('../../src/repositories/baseRepository');
const prisma = require('../../src/config/database');

describe('BaseRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new BaseRepository('user');
  });

  describe('findById', () => {
    it('should find a record by id', async () => {
      const mockUser = { id: 'user-123', name: 'Test User' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should return null if record not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find a record by where clause', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findOne({ email: 'test@example.com' });

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if no record matches', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findOne({ email: 'nonexistent@example.com' });

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find multiple records', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
      ];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await repository.findMany();

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({});
    });

    it('should accept query parameters', async () => {
      const mockUsers = [{ id: 'user-1', name: 'User 1' }];
      const params = {
        where: { isActive: true },
        take: 10,
        skip: 0,
      };
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await repository.findMany(params);

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith(params);
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const newUserData = { name: 'New User', email: 'new@example.com' };
      const createdUser = { id: 'user-123', ...newUserData };
      prisma.user.create.mockResolvedValue(createdUser);

      const result = await repository.create(newUserData);

      expect(result).toEqual(createdUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: newUserData,
      });
    });
  });

  describe('update', () => {
    it('should update a record by id', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = { id: 'user-123', ...updateData };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update('user-123', updateData);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete a record by id', async () => {
      const deletedUser = { id: 'user-123', name: 'Deleted User' };
      prisma.user.delete.mockResolvedValue(deletedUser);

      const result = await repository.delete('user-123');

      expect(result).toEqual(deletedUser);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });
  });

  describe('count', () => {
    it('should count records', async () => {
      prisma.user.count.mockResolvedValue(10);

      const result = await repository.count();

      expect(result).toBe(10);
      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should count records with where clause', async () => {
      prisma.user.count.mockResolvedValue(5);

      const result = await repository.count({ isActive: true });

      expect(result).toBe(5);
      expect(prisma.user.count).toHaveBeenCalledWith({ where: { isActive: true } });
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated results with default params', async () => {
      const mockData = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
      ];
      prisma.user.findMany.mockResolvedValue(mockData);
      prisma.user.count.mockResolvedValue(2);

      const result = await repository.findWithPagination();

      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: undefined,
      });
    });

    it('should accept custom pagination params', async () => {
      const mockData = [{ id: 'user-1', name: 'User 1' }];
      const params = {
        page: 2,
        limit: 5,
        where: { isActive: true },
        orderBy: { name: 'asc' },
      };
      prisma.user.findMany.mockResolvedValue(mockData);
      prisma.user.count.mockResolvedValue(12);

      const result = await repository.findWithPagination(params);

      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual({
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 5,
        take: 5,
        orderBy: { name: 'asc' },
        include: undefined,
      });
    });

    it('should include relations when specified', async () => {
      const mockData = [{ id: 'user-1', name: 'User 1', department: { name: 'IT' } }];
      const params = {
        include: { department: true },
      };
      prisma.user.findMany.mockResolvedValue(mockData);
      prisma.user.count.mockResolvedValue(1);

      const result = await repository.findWithPagination(params);

      expect(result.data).toEqual(mockData);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { department: true },
      });
    });

    it('should calculate hasNextPage correctly', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({ id: `user-${i}` }));
      prisma.user.findMany.mockResolvedValue(mockData);
      prisma.user.count.mockResolvedValue(25);

      const result = await repository.findWithPagination({ page: 2, limit: 10 });

      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
    });

    it('should calculate hasPreviousPage correctly', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({ id: `user-${i}` }));
      prisma.user.findMany.mockResolvedValue(mockData);
      prisma.user.count.mockResolvedValue(10);

      const result = await repository.findWithPagination({ page: 1, limit: 10 });

      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });
  });
});
