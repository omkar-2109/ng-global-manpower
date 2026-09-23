const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Agent = require('../models/Agent');

// Helper to extract JWT token from cookies or Authorization header
function extractToken(req) {
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }
  if (req.cookies && req.cookies.agent_token) {
    return req.cookies.agent_token;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

// Admin / Staff Authentication Guard
function requireAuth(req, res, next) {
  const token = (req.cookies && req.cookies.auth_token) || 
                (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
    }
    const target = req.originalUrl.startsWith('/admin/login') ? '/admin/dashboard' : req.originalUrl;
    return res.redirect(`/admin/login?redirect=${encodeURIComponent(target)}`);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.role === 'agent') {
      // Agents cannot access admin command center
      return res.redirect('/agent/dashboard');
    }

    const user = User.findById(decoded.id);
    if (!user) {
      res.clearCookie('auth_token');
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'User account no longer exists.' });
      }
      return res.redirect('/admin/login');
    }

    req.user = user;
    res.locals.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'admin'
    };

    next();
  } catch (err) {
    res.clearCookie('auth_token');
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    }
    return res.redirect('/admin/login?error=SessionExpired');
  }
}

// Agent Authentication Guard
function requireAgentAuth(req, res, next) {
  const token = (req.cookies && req.cookies.agent_token) || 
                (req.cookies && req.cookies.auth_token) ||
                (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Agent login required.' });
    }
    const target = req.originalUrl.startsWith('/agent/login') ? '/agent/dashboard' : req.originalUrl;
    return res.redirect(`/agent/login?redirect=${encodeURIComponent(target)}`);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const agent = Agent.findById(decoded.id);

    if (!agent || agent.status !== 'active') {
      res.clearCookie('agent_token');
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Agent account inactive or not found.' });
      }
      return res.redirect('/agent/login?error=AccountInactive');
    }

    req.agent = agent;
    req.user = {
      id: agent.id,
      name: agent.name,
      agency_name: agent.agency_name,
      username: agent.username,
      email: agent.email,
      role: 'agent'
    };

    res.locals.currentAgent = req.agent;
    res.locals.currentUser = req.user;

    next();
  } catch (err) {
    res.clearCookie('agent_token');
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Invalid agent session.' });
    }
    return res.redirect('/agent/login?error=SessionExpired');
  }
}

// Optional Auth for public / shared pages
function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      if (decoded.role === 'agent') {
        const agent = Agent.findById(decoded.id);
        if (agent && agent.status === 'active') {
          req.agent = agent;
          req.user = {
            id: agent.id,
            name: agent.name,
            agency_name: agent.agency_name,
            username: agent.username,
            email: agent.email,
            role: 'agent'
          };
          res.locals.currentAgent = agent;
          res.locals.currentUser = req.user;
        }
      } else {
        const user = User.findById(decoded.id);
        if (user) {
          req.user = user;
          res.locals.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'admin'
          };
        }
      }
    } catch {
      // ignore invalid token in optional auth
    }
  }
  next();
}

module.exports = {
  requireAuth,
  requireAgentAuth,
  optionalAuth
};
