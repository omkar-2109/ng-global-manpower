const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const authService = {
  login(email, password) {
    const user = User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isValid = User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  },

  verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
  }
};

module.exports = authService;
