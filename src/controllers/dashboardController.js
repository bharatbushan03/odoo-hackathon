const { asyncHandler, ResponseWrapper } = require('../utils');

class DashboardController {
  constructor(dashboardService) {
    this.dashboardService = dashboardService;
  }

  getSummary = asyncHandler(async (req, res) => {
    const summary = await this.dashboardService.getSummary();
    return ResponseWrapper.success(res, {
      data: summary,
      message: 'Dashboard summary retrieved successfully',
    });
  });
}

module.exports = DashboardController;
