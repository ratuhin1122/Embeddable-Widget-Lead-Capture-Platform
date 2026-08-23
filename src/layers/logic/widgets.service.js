const WidgetsRepository = require('../data/widgets.repository');
const config = require('../../config');

const WidgetsService = {
  /**
   * Create a new widget for the authenticated user.
   */
  async create(userId, widgetData) {
    return WidgetsRepository.create(userId, widgetData);
  },

  /**
   * Get all widgets for the authenticated user.
   */
  async listByUser(userId) {
    return WidgetsRepository.findAllByUser(userId);
  },

  /**
   * Get a single widget for the authenticated user (tenant-isolated).
   */
  async getByIdForUser(widgetId, userId) {
    const widget = await WidgetsRepository.findByIdAndUser(widgetId, userId);
    if (!widget) {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      throw error;
    }
    return widget;
  },

  /**
   * Get a widget's public config (no auth required).
   * Used by the embed script to render the widget.
   */
  async getPublicConfig(widgetId) {
    const widget = await WidgetsRepository.findById(widgetId);
    if (!widget) {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      throw error;
    }

    // Return only what the embed script needs — no internal fields
    return {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      description: widget.description,
      fields: widget.fields,
      button_text: widget.button_text,
      display_options: widget.display_options,
      version: widget.version,
    };
  },

  /**
   * Update a widget (tenant-isolated).
   */
  async update(widgetId, userId, updateData) {
    const widget = await WidgetsRepository.update(widgetId, userId, updateData);
    if (!widget) {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      throw error;
    }
    return widget;
  },

  /**
   * Delete a widget (tenant-isolated).
   */
  async delete(widgetId, userId) {
    const deleted = await WidgetsRepository.delete(widgetId, userId);
    if (!deleted) {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      throw error;
    }
    return true;
  },

  /**
   * Generate the embed snippet for a widget.
   */
  getEmbedSnippet(widgetId) {
    const baseUrl = `http://localhost:${config.port}`;
    return `<script src="${baseUrl}/widget.js?id=${widgetId}"></script>`;
  },
};

module.exports = WidgetsService;
