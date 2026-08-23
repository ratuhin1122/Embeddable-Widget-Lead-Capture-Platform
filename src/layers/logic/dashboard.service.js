const SubmissionsRepository = require('../data/submissions.repository');

const DashboardService = {
  /**
   * Get paginated submissions for the authenticated user.
   */
  async getSubmissions(userId, { page, limit, widgetId }) {
    const [submissions, total] = await Promise.all([
      SubmissionsRepository.findByUser(userId, { page, limit, widgetId }),
      SubmissionsRepository.countByUser(userId, widgetId),
    ]);

    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get aggregated stats for the dashboard.
   */
  async getStats(userId) {
    const [total, byDay, byWidget] = await Promise.all([
      SubmissionsRepository.countByUser(userId),
      SubmissionsRepository.countByDay(userId, 30),
      SubmissionsRepository.countByWidget(userId),
    ]);

    return {
      total_submissions: total,
      submissions_by_day: byDay,
      submissions_by_widget: byWidget,
    };
  },

  /**
   * Get geo distribution of submissions.
   */
  async getGeoDistribution(userId) {
    const distribution = await SubmissionsRepository.geoDistribution(userId);
    return { geo_distribution: distribution };
  },
};

module.exports = DashboardService;
