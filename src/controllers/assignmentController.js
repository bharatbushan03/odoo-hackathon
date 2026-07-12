const { asyncHandler, ResponseWrapper } = require('../utils');

class AssignmentController {
  constructor(assignmentService) {
    this.assignmentService = assignmentService;
  }

  assignAsset = asyncHandler(async (req, res) => {
    const assignment = await this.assignmentService.assignAsset(req.body);
    return ResponseWrapper.created(res, {
      data: assignment,
      message: 'Asset assigned successfully',
    });
  });

  acceptAssignment = asyncHandler(async (req, res) => {
    const { signature } = req.body;
    const assignment = await this.assignmentService.acceptAssignment(req.params.id, req.user.id, signature);
    return ResponseWrapper.success(res, {
      data: assignment,
      message: 'Asset assignment accepted and signed successfully',
    });
  });

  rejectAssignment = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const assignment = await this.assignmentService.rejectAssignment(req.params.id, req.user.id, notes);
    return ResponseWrapper.success(res, {
      data: assignment,
      message: 'Asset assignment rejected successfully',
    });
  });

  returnAsset = asyncHandler(async (req, res) => {
    const assignment = await this.assignmentService.returnAsset(req.params.id, req.body);
    return ResponseWrapper.success(res, {
      data: assignment,
      message: 'Asset marked as returned successfully',
    });
  });

  transferAsset = asyncHandler(async (req, res) => {
    const assignment = await this.assignmentService.transferAsset(req.body);
    return ResponseWrapper.success(res, {
      data: assignment,
      message: 'Asset transfer request created successfully',
    });
  });

  getHistory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { assetId, userId, acceptanceStatus } = req.query;

    const result = await this.assignmentService.getHistory({
      page,
      limit,
      assetId,
      userId,
      acceptanceStatus,
    });

    return ResponseWrapper.paginated(res, {
      data: result.data,
      meta: result.meta,
      message: 'Assignment history retrieved successfully',
    });
  });
}

module.exports = AssignmentController;
