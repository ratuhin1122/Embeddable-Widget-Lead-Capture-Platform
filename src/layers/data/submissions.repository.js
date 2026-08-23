const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');

function formatSubmission(sub) {
  if (!sub) return null;
  return {
    ...sub,
    data: typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data,
    geo_data: sub.geo_data && typeof sub.geo_data === 'string' ? JSON.parse(sub.geo_data) : sub.geo_data,
    honeypot_triggered: Boolean(sub.honeypot_triggered),
  };
}

const SubmissionsRepository = {
  /**
   * Store a new submission.
   */
  async create(submissionData) {
    const id = uuidv4();
    const now = new Date();
    await db('submissions').insert({
      id,
      widget_id: submissionData.widget_id,
      user_id: submissionData.user_id,
      data: JSON.stringify(submissionData.data || {}),
      ip_address: submissionData.ip_address,
      geo_data: submissionData.geo_data ? JSON.stringify(submissionData.geo_data) : null,
      honeypot_triggered: submissionData.honeypot_triggered || false,
      idempotency_key: submissionData.idempotency_key || null,
      created_at: now,
    });
    return this.findById(id);
  },

  async findById(id) {
    const row = await db('submissions').where({ id }).first();
    return formatSubmission(row);
  },

  /**
   * Check if an idempotency key already exists.
   */
  async findByIdempotencyKey(key) {
    const row = await db('submissions').where({ idempotency_key: key }).first();
    return formatSubmission(row);
  },

  /**
   * Get paginated submissions for a user (tenant-isolated).
   */
  async findByUser(userId, { page = 1, limit = 20, widgetId = null } = {}) {
    const query = db('submissions')
      .where({ 'submissions.user_id': userId })
      .orderBy('submissions.created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    if (widgetId) {
      query.where({ 'submissions.widget_id': widgetId });
    }

    const rows = await query
      .join('widgets', 'submissions.widget_id', 'widgets.id')
      .select(
        'submissions.*',
        'widgets.title as widget_title',
        'widgets.type as widget_type'
      );

    return rows.map(formatSubmission);
  },

  /**
   * Count submissions for a user, optionally filtered by widget.
   */
  async countByUser(userId, widgetId = null) {
    const query = db('submissions').where({ user_id: userId });
    if (widgetId) query.where({ widget_id: widgetId });
    const [{ count }] = await query.count('id as count');
    return parseInt(count, 10);
  },

  /**
   * Get submission counts over time (grouped by day) for a user.
   */
  async countByDay(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const isSqlite = db.client.config.client === 'sqlite3';
    const dateExpr = isSqlite ? "date(created_at)" : "DATE(created_at)";

    const rows = await db('submissions')
      .where({ user_id: userId })
      .where('created_at', '>=', since)
      .select(db.raw(`${dateExpr} as date`))
      .count('id as count')
      .groupByRaw(dateExpr)
      .orderBy('date', 'asc');

    return rows.map(r => ({
      date: r.date,
      count: parseInt(r.count, 10),
    }));
  },

  /**
   * Get submission counts per widget for a user.
   */
  async countByWidget(userId) {
    const rows = await db('submissions')
      .where({ 'submissions.user_id': userId })
      .join('widgets', 'submissions.widget_id', 'widgets.id')
      .select('widgets.id as widget_id', 'widgets.title as widget_title')
      .count('submissions.id as count')
      .groupBy('widgets.id', 'widgets.title');

    return rows.map(r => ({
      widget_id: r.widget_id,
      widget_title: r.widget_title,
      count: parseInt(r.count, 10),
    }));
  },

  /**
   * Get geo distribution for a user's submissions.
   */
  async geoDistribution(userId) {
    const rows = await db('submissions')
      .where({ user_id: userId })
      .whereNotNull('geo_data');

    const counts = {};
    for (const r of rows) {
      const geo = typeof r.geo_data === 'string' ? JSON.parse(r.geo_data) : r.geo_data;
      const country = geo?.country || 'Unknown';
      counts[country] = (counts[country] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  },
};

module.exports = SubmissionsRepository;
