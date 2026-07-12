const ApiError = require('../utils/ApiError');

class OrganizationService {
  constructor(organizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  createOrganization = async (data) => {
    const existing = await this.organizationRepository.findOne({
      code: data.code,
      deletedAt: null,
    });
    if (existing) {
      throw ApiError.conflict(`Organization with code '${data.code}' already exists`);
    }
    return this.organizationRepository.create(data);
  };

  getOrganizationById = async (id) => {
    const org = await this.organizationRepository.findByIdActive(id);
    if (!org) {
      throw ApiError.notFound(`Organization with ID '${id}' not found`);
    }
    return org;
  };

  updateOrganization = async (id, data) => {
    const org = await this.getOrganizationById(id);

    if (data.code && data.code !== org.code) {
      const existing = await this.organizationRepository.findOne({
        code: data.code,
        deletedAt: null,
        NOT: {
          id: id,
        },
      });
      if (existing) {
        throw ApiError.conflict(`Organization with code '${data.code}' already exists`);
      }
    }

    return this.organizationRepository.update(id, data);
  };

  deleteOrganization = async (id, soft = true) => {
    await this.getOrganizationById(id);
    if (soft) {
      return this.organizationRepository.softDelete(id);
    }
    return this.organizationRepository.delete(id);
  };

  listOrganizations = async (params) => {
    return this.organizationRepository.findActiveWithPagination(params);
  };

  updateLogo = async (id, logoPath) => {
    await this.getOrganizationById(id);
    return this.organizationRepository.update(id, { logo: logoPath });
  };
}

module.exports = OrganizationService;
