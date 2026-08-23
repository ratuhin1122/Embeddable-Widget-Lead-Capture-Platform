const express = require('express');
const router = express.Router();
const WidgetsService = require('../logic/widgets.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { createWidgetSchema, updateWidgetSchema } = require('../../validators/schemas');

/**
 * GET /api/widgets/:id/config
 * PUBLIC endpoint — serves widget config with cache headers.
 * No authentication required.
 */
router.get('/:id/config', async (req, res, next) => {
  try {
    const config = await WidgetsService.getPublicConfig(req.params.id);

    // Short-lived cache for config (5 minutes)
    res.set('Cache-Control', 'public, max-age=300');
    res.set('Access-Control-Allow-Origin', '*');

    res.json(config);
  } catch (err) {
    next(err);
  }
});

// ── All routes below require authentication ──
router.use(authenticate);

/**
 * POST /api/widgets
 * Create a new widget.
 */
router.post('/', async (req, res, next) => {
  try {
    const parsed = createWidgetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const widget = await WidgetsService.create(req.user.id, parsed.data);
    const snippet = WidgetsService.getEmbedSnippet(widget.id);

    res.status(201).json({
      widget,
      embed_snippet: snippet,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/widgets
 * List all widgets for the authenticated user.
 */
router.get('/', async (req, res, next) => {
  try {
    const widgets = await WidgetsService.listByUser(req.user.id);
    res.json({ widgets });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/widgets/:id
 * Get a single widget (tenant-isolated).
 */
router.get('/:id', async (req, res, next) => {
  try {
    const widget = await WidgetsService.getByIdForUser(req.params.id, req.user.id);
    const snippet = WidgetsService.getEmbedSnippet(widget.id);

    res.json({ widget, embed_snippet: snippet });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/widgets/:id
 * Update a widget (tenant-isolated).
 */
router.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateWidgetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const widget = await WidgetsService.update(req.params.id, req.user.id, parsed.data);
    res.json({ widget });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/widgets/:id
 * Delete a widget (tenant-isolated).
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await WidgetsService.delete(req.params.id, req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
