const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const UsersRepository = require('../data/users.repository');

const AuthService = {
  /**
   * Register a new user (widget owner).
   */
  async register(email, password) {
    // Check if user exists
    const existing = await UsersRepository.findByEmail(email);
    if (existing) {
      const error = new Error('Email already registered');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await UsersRepository.create(email, passwordHash);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return { user: { id: user.id, email: user.email }, token };
  },

  /**
   * Log in an existing user.
   */
  async login(email, password) {
    const user = await UsersRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return { user: { id: user.id, email: user.email }, token };
  },
};

module.exports = AuthService;
