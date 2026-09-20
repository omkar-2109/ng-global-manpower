const authService = require('../services/authService');
const env = require('../config/env');

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

      // Set secure HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

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
    res.clearCookie('auth_token');
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, message: 'Logged out successfully.' });
    }
    res.redirect('/admin/login?loggedOut=true');
  }
};

module.exports = authController;
