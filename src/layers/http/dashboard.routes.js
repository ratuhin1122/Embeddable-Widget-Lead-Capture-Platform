const express = require('express');
const router = express.Router();
const DashboardService = require('../logic/dashboard.service');
const { authenticate } = require('../../middleware/auth.middleware');

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/submissions
 * Paginated list of submissions for the authenticated user.
 * Query params: page, limit, widget_id
 */
router.get('/submissions', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const widgetId = req.query.widget_id || null;

    const result = await DashboardService.getSubmissions(req.user.id, {
      page,
      limit,
      widgetId,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/stats
 * Aggregated stats: total submissions, by day, by widget.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await DashboardService.getStats(req.user.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/geo
 * Geo distribution of submissions.
 */
router.get('/geo', async (req, res, next) => {
  try {
    const geo = await DashboardService.getGeoDistribution(req.user.id);
    res.json(geo);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
