const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');
const env = require('../config/env');

const authService = {
  // Staff / Admin Login
  login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = User.findByEmail(cleanEmail);

    if (!user) {
      throw new Error('Invalid HR credentials. Access denied.');
    }

    const isValid = User.verifyPassword(password.trim(), user.password_hash);
    if (!isValid) {
      throw new Error('Invalid HR credentials. Access denied.');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'admin',
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
        role: user.role || 'admin'
      }
    };
  },

  // Recruitment Partner Agent Login (via email or username/subdomain)
  agentLogin(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Please enter your Agent Email or Subdomain Handle and password.');
    }

    const clean = identifier.trim().toLowerCase();
    let agent = Agent.findByEmail(clean);
    if (!agent) {
      agent = Agent.findByUsername(clean);
    }

    if (!agent) {
      throw new Error('Invalid Agent credentials. Account not found.');
    }

    if (agent.status !== 'active') {
      throw new Error('This agent account is suspended or under administrative review. Please contact HR.');
    }

    const isValid = Agent.verifyPassword(password.trim(), agent.password_hash);
    if (!isValid) {
      throw new Error('Invalid password. Access denied.');
    }

    const token = jwt.sign(
      {
        id: agent.id,
        email: agent.email,
        username: agent.username,
        agency_name: agent.agency_name,
        name: agent.name,
        role: 'agent'
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      agent: {
        id: agent.id,
        name: agent.name,
        agency_name: agent.agency_name,
        username: agent.username,
        email: agent.email,
        role: 'agent'
      }
    };
  },

  verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
  }
};

module.exports = authService;
