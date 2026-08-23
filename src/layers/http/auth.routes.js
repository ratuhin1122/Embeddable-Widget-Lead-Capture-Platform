const express = require('express');
const router = express.Router();
const AuthService = require('../logic/auth.service');
const { registerSchema, loginSchema } = require('../../validators/schemas');

/**
 * POST /api/auth/register
 * Register a new widget owner.
 */
router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const result = await AuthService.register(parsed.data.email, parsed.data.password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Log in and receive a JWT.
 */
router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const result = await AuthService.login(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
