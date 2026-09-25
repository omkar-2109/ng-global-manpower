const express = require('express');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const env = require('./src/config/env');
const { securityHeaders } = require('./src/middleware/security');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { notFoundHandler, globalErrorHandler } = require('./src/middleware/errorHandler');
const { optionalAuth } = require('./src/middleware/authMiddleware');
const subdomainMiddleware = require('./src/middleware/subdomainMiddleware');
const { initializeDatabase } = require('./src/models/dbInit');

// Route modules
const webRoutes = require('./src/routes/webRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const agentRoutes = require('./src/routes/agentRoutes');
const apiRoutes = require('./src/routes/apiRoutes');
const agentController = require('./src/controllers/agentController');
const jobService = require('./src/services/jobService');
const db = require('./src/config/db');

const app = express();

// 1. Initialize & Seed Database (Strict HR Admin & Sample Agent)
initializeDatabase();
db.syncWithSupabase().catch(err => console.warn('[Supabase] Initial sync note:', err.message));

// 2. View Engine Configuration (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 3. Global Security & Optimization Middleware
app.use(securityHeaders);
app.use(compression());
app.use(generalLimiter);

// 4. Request Logging & Parsers
if (env.isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(cors());
app.use(cookieParser(env.cookieSecret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Static Assets with Cache-Control
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: env.isProduction ? '7d' : '0',
  etag: true
}));

// Also alias legacy folder paths and upload directories
app.use('/assets', express.static(path.join(__dirname, 'public')));
app.use('/NG_Global_Manpower_Logo_Kit', express.static(path.join(__dirname, 'public/brand')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 6. Subdomain Routing & Global View Context
app.use(optionalAuth);
app.use(subdomainMiddleware);
app.use((req, res, next) => {
  res.locals.appName = env.appName;
  res.locals.appUrl = env.appUrl;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.user = req.user || null;
  res.locals.currentUser = req.user || null;
  res.locals.agent = req.agent || null;
  res.locals.currentAgent = req.agent || null;
  
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  const port = (req.headers.host || '').split(':')[1];
  const portSuffix = port ? `:${port}` : '';
  const proto = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
  const isLocal = host === 'localhost' || host.endsWith('.localhost');
  const isIpOrRender = /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.endsWith('.onrender.com');

  let rootDomain = host;
  if (isLocal) {
    rootDomain = `localhost${portSuffix}`;
  } else if (!isIpOrRender) {
    const parts = host.split('.');
    rootDomain = parts.length >= 3 ? parts.slice(1).join('.') : host;
  }
  res.locals.rootHostname = rootDomain;

  // Subdomain URL builder helper
  res.locals.getSubdomainUrl = function(subdomain, targetPath = '/') {
    const cleanPath = targetPath.startsWith('/') ? targetPath : '/' + targetPath;
    if (isLocal) {
      if (!subdomain) return `${proto}://localhost${portSuffix}${cleanPath}`;
      return `${proto}://${subdomain}.localhost${portSuffix}${cleanPath}`;
    }
    if (isIpOrRender) {
      return cleanPath;
    }
    if (!subdomain) {
      return `${proto}://${rootDomain}${cleanPath}`;
    }
    return `${proto}://${subdomain}.${rootDomain}${cleanPath}`;
  };

  res.locals.adminUrl = res.locals.getSubdomainUrl('admin', '/admin/dashboard');
  res.locals.adminLoginUrl = res.locals.getSubdomainUrl('admin', '/admin/login');
  res.locals.agentLoginUrl = res.locals.getSubdomainUrl('agents', '/agent/login');
  res.locals.agentPortalUrl = res.locals.getSubdomainUrl('agents', '/agent/dashboard');
  res.locals.publicSiteUrl = res.locals.getSubdomainUrl('', '/');
  res.locals.getAgentLandingUrl = function(username) {
    return res.locals.getSubdomainUrl(username, '/');
  };

  try {
    res.locals.tickerJobs = jobService.getActiveJobs().slice(0, 10);
  } catch (err) {
    res.locals.tickerJobs = [];
  }
  next();
});

// 7. Mount Application Routes
app.use('/', webRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/agent', agentRoutes);
app.use('/api', apiRoutes);

// Public Verified Agency Profiles ([username].url or /agency/:username)
app.get('/agency/:username', agentController.showAgencyProfile);
app.post('/agency/:username/apply', agentController.handlePublicCandidateApplication);

// 8. 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// 9. Start Server
const server = app.listen(env.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ${env.appName} running on port ${env.port}`);
  console.log(`🌐 Environment: ${env.nodeEnv}`);
  console.log(`🔗 Local URL:   ${env.appUrl}`);
  console.log(`🛡️ Admin Portal: ${env.appUrl}/admin/login (Strict HR Credentials)`);
  console.log(`🤝 Agent Portal: ${env.appUrl}/agent/login (Subdomain: agents.url)`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
