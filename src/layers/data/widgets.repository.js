const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');

function formatWidget(widget) {
  if (!widget) return null;
  return {
    ...widget,
    fields: typeof widget.fields === 'string' ? JSON.parse(widget.fields) : widget.fields,
    display_options: typeof widget.display_options === 'string' ? JSON.parse(widget.display_options) : widget.display_options,
    is_active: Boolean(widget.is_active),
  };
}

const WidgetsRepository = {
  /**
   * Create a new widget for a specific user (tenant).
   */
  async create(userId, widgetData) {
    const id = uuidv4();
    const now = new Date();
    await db('widgets').insert({
      id,
      user_id: userId,
      type: widgetData.type,
      title: widgetData.title,
      description: widgetData.description || '',
      fields: JSON.stringify(widgetData.fields || []),
      button_text: widgetData.button_text || 'Submit',
      display_options: JSON.stringify(widgetData.display_options || {}),
      version: 1,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    return this.findByIdAndUser(id, userId);
  },

  /**
   * Get all widgets for a specific user (tenant-isolated).
   */
  async findAllByUser(userId) {
    const rows = await db('widgets').where({ user_id: userId }).orderBy('created_at', 'desc');
    return rows.map(formatWidget);
  },

  /**
   * Get a single widget by ID, scoped to the user (tenant-isolated).
   */
  async findByIdAndUser(widgetId, userId) {
    const row = await db('widgets').where({ id: widgetId, user_id: userId }).first();
    return formatWidget(row);
  },

  /**
   * Get a widget by ID (public — for config endpoint and submission).
   */
  async findById(widgetId) {
    const row = await db('widgets').where({ id: widgetId, is_active: true }).first();
    return formatWidget(row);
  },

  /**
   * Update a widget, scoped to the user (tenant-isolated).
   * Increments version for cache-busting.
   */
  async update(widgetId, userId, updateData) {
    const existing = await this.findByIdAndUser(widgetId, userId);
    if (!existing) return null;

    const payload = {
      updated_at: new Date(),
      version: (existing.version || 1) + 1,
    };
    if (updateData.title !== undefined) payload.title = updateData.title;
    if (updateData.description !== undefined) payload.description = updateData.description;
    if (updateData.type !== undefined) payload.type = updateData.type;
    if (updateData.button_text !== undefined) payload.button_text = updateData.button_text;
    if (updateData.is_active !== undefined) payload.is_active = updateData.is_active;
    if (updateData.fields !== undefined) payload.fields = JSON.stringify(updateData.fields);
    if (updateData.display_options !== undefined) payload.display_options = JSON.stringify(updateData.display_options);

    await db('widgets')
      .where({ id: widgetId, user_id: userId })
      .update(payload);

    return this.findByIdAndUser(widgetId, userId);
  },

  /**
   * Delete a widget, scoped to the user (tenant-isolated).
   */
  async delete(widgetId, userId) {
    const count = await db('widgets')
      .where({ id: widgetId, user_id: userId })
      .del();
    return count > 0;
  },
};

module.exports = WidgetsRepository;
