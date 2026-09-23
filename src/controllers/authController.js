const authService = require('../services/authService');
const env = require('../config/env');

// Helper to extract root domain for wildcard cookie sharing across admin subdomains
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

const authController = {
  showLogin(req, res) {
    if (req.user) {
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', {
      title: 'Recruiter & Staff Sign In | NG Global Manpower',
      error: req.query.error || null,
      redirect: req.query.redirect || '/admin/dashboard'
    });
  },

  async login(req, res, next) {
    try {
      const { email, password, redirect } = req.body;
      const { token, user } = authService.login(email, password);

      const cookieOpts = {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };
      const cookieDomain = getCookieDomain(req);
      if (cookieDomain) cookieOpts.domain = cookieDomain;

      // Set secure HTTP-only cookie with wildcard domain support
      res.cookie('auth_token', token, cookieOpts);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Logged in successfully.', user, token });
      }

      const targetUrl = redirect && redirect.startsWith('/') ? redirect : '/admin/dashboard';
      res.redirect(targetUrl);
    } catch (err) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ success: false, message: err.message });
      }
      res.render('admin/login', {
        title: 'Recruiter & Staff Sign In | NG Global Manpower',
        error: err.message,
        redirect: req.body.redirect || '/admin/dashboard'
      });
    }
  },

  logout(req, res) {
    const cookieDomain = getCookieDomain(req);
    res.clearCookie('auth_token', cookieDomain ? { domain: cookieDomain } : {});
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, message: 'Logged out successfully.' });
    }
    res.redirect('/admin/login?loggedOut=true');
  }
};

module.exports = authController;
