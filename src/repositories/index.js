const prisma = require('../config/database');

class BaseRepository {
  constructor(modelName) {
    this.model = prisma[modelName];
  }

  async findById(id) {
    return this.model.findUnique({ where: { id } });
  }

  async findOne(where) {
    return this.model.findFirst({ where });
  }

  async findMany(params = {}) {
    return this.model.findMany(params);
  }

  async create(data) {
    return this.model.create({ data });
  }

  async update(id, data) {
    return this.model.update({ where: { id }, data });
  }

  async delete(id) {
    return this.model.delete({ where: { id } });
  }

  async count(where = {}) {
    return this.model.count({ where });
  }

  async findWithPagination(params = {}) {
    const { page = 1, limit = 10, where = {}, orderBy = { createdAt: 'desc' }, include } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      this.model.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}

module.exports = { BaseRepository };
