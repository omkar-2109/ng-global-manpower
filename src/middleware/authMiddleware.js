const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

function requireAuth(req, res, next) {
  let token = null;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }
  // 2. Check Authorization Header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
    }
    if (req.path === '/login' || req.originalUrl.startsWith('/admin/login') || req.originalUrl.startsWith('/auth/login')) {
      return next();
    }
    const target = req.originalUrl.startsWith('/admin/login') ? '/admin/dashboard' : req.originalUrl;
    return res.redirect(`/admin/login?redirect=${encodeURIComponent(target)}`);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
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
      role: user.role
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

// Optional auth - populates req.user if present, but doesn't block
function optionalAuth(req, res, next) {
  let token = (req.cookies && req.cookies.auth_token) || 
              (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);

  if (token) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = User.findById(decoded.id);
      if (user) {
        req.user = user;
        res.locals.currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    } catch {
      // ignore invalid token in optional auth
    }
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
