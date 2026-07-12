const prisma = require('../config/database');
const BaseRepository = require('./baseRepository');

class OrganizationRepository extends BaseRepository {
  constructor(dbClient = prisma) {
    super('organization');
    this.db = dbClient;
    this.model = dbClient.organization;
  }

  async softDelete(id) {
    return this.model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByIdActive(id) {
    return this.model.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findActiveWithPagination(params = {}) {
    const { where = {}, ...rest } = params;
    return this.findWithPagination({
      ...rest,
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }
}

module.exports = OrganizationRepository;
