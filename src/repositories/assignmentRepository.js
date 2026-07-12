const prisma = require('../config/database');
const BaseRepository = require('./baseRepository');

class AssignmentRepository extends BaseRepository {
  constructor(dbClient = prisma) {
    super('assetAssignment');
    this.db = dbClient;
    this.model = dbClient.assetAssignment;
  }

  async findActiveAssignment(assetId) {
    return this.model.findFirst({
      where: {
        assetId,
        returnedAt: null,
        acceptanceStatus: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
      include: {
        asset: true,
        user: true,
      },
    });
  }

  async findHistory(params = {}) {
    const { page = 1, limit = 10, assetId, userId, acceptanceStatus } = params;
    const where = {};
    if (assetId) where.assetId = assetId;
    if (userId) where.userId = userId;
    if (acceptanceStatus) where.acceptanceStatus = acceptanceStatus;

    return this.findWithPagination({
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: true,
        user: true,
      },
    });
  }
}

module.exports = AssignmentRepository;
