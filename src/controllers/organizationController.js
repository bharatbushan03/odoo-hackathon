const { asyncHandler, ResponseWrapper } = require('../utils');
const ApiError = require('../utils/ApiError');

class OrganizationController {
  constructor(organizationService) {
    this.organizationService = organizationService;
  }

  createOrganization = asyncHandler(async (req, res) => {
    const org = await this.organizationService.createOrganization(req.body);
    return ResponseWrapper.created(res, {
      data: org,
      message: 'Organization created successfully',
    });
  });

  getOrganization = asyncHandler(async (req, res) => {
    const org = await this.organizationService.getOrganizationById(req.params.id);
    return ResponseWrapper.success(res, {
      data: org,
      message: 'Organization profile retrieved successfully',
    });
  });

  updateOrganization = asyncHandler(async (req, res) => {
    const org = await this.organizationService.updateOrganization(req.params.id, req.body);
    return ResponseWrapper.success(res, {
      data: org,
      message: 'Organization profile updated successfully',
    });
  });

  deleteOrganization = asyncHandler(async (req, res) => {
    const soft = req.query.hard !== 'true';
    await this.organizationService.deleteOrganization(req.params.id, soft);
    return ResponseWrapper.noContent(res);
  });

  listOrganizations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    const result = await this.organizationService.listOrganizations({
      page,
      limit,
      orderBy: { [sort]: order },
    });

    return ResponseWrapper.paginated(res, {
      data: result.data,
      meta: result.meta,
      message: 'Organizations retrieved successfully',
    });
  });

  uploadLogo = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('Logo file is required');
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    const org = await this.organizationService.updateLogo(req.params.id, logoUrl);

    return ResponseWrapper.success(res, {
      data: org,
      message: 'Organization brand logo uploaded successfully',
    });
  });
}

module.exports = OrganizationController;
