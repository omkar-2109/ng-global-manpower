const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Agent = require('../models/Agent');

// Helper to extract root domain for wildcard cookie sharing across admin/agent subdomains
function getCookieDomain(req) {
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.endsWith('.onrender.com')) {
    return undefined;
  }
  const parts = host.split('.');
  if (parts.length >= 2) {
    return '.' + parts.slice(-2).join('.');
  }
  return undefined;
}

// Safely clear both host-only and domain wildcard auth cookies
function clearAuthCookie(req, res) {
  res.clearCookie('auth_token');
  const domain = getCookieDomain(req);
  if (domain) {
    res.clearCookie('auth_token', { domain });
  }
}

// Safely clear both host-only and domain wildcard agent cookies
function clearAgentCookie(req, res) {
  res.clearCookie('agent_token');
  const domain = getCookieDomain(req);
  if (domain) {
    res.clearCookie('agent_token', { domain });
  }
}

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
      // Agents cannot access admin command center; direct cleanly to agent portal
      const host = (req.headers.host || '').split(':')[0].toLowerCase();
      const proto = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
      if (host.startsWith('admin.')) {
        const rootDomain = host.replace(/^admin\./, '');
        return res.redirect(`${proto}://agents.${rootDomain}/agent/dashboard`);
      }
      return res.redirect('/agent/dashboard');
    }

    const user = User.findById(decoded.id);
    if (!user) {
      clearAuthCookie(req, res);
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
    clearAuthCookie(req, res);
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
      clearAgentCookie(req, res);
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
    clearAgentCookie(req, res);
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Invalid agent session.' });
    }
    return res.redirect('/agent/login?error=SessionExpired');
  }
}

// Optional Auth for public / shared pages
function optionalAuth(req, res, next) {
  // 1. Check auth_token for admin/staff
  const authToken = (req.cookies && req.cookies.auth_token) || 
                    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, env.jwtSecret);
      if (decoded.role !== 'agent') {
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

  // 2. Check agent_token for recruitment partners
  const agentToken = req.cookies && req.cookies.agent_token;
  if (agentToken) {
    try {
      const decoded = jwt.verify(agentToken, env.jwtSecret);
      if (decoded.role === 'agent') {
        const agent = Agent.findById(decoded.id);
        if (agent && agent.status === 'active') {
          req.agent = agent;
          res.locals.currentAgent = agent;
          // Only assign req.user to agent if not in admin context and no admin user exists
          if (!req.user && !req.isAdminPortal) {
            req.user = {
              id: agent.id,
              name: agent.name,
              agency_name: agent.agency_name,
              username: agent.username,
              email: agent.email,
              role: 'agent'
            };
            res.locals.currentUser = req.user;
          }
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
  optionalAuth,
  getCookieDomain,
  clearAuthCookie,
  clearAgentCookie
};
