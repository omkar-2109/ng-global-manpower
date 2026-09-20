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
const { initializeDatabase } = require('./src/models/dbInit');

// Route modules
const webRoutes = require('./src/routes/webRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const apiRoutes = require('./src/routes/apiRoutes');

const app = express();

// 1. Initialize & Seed Database
initializeDatabase();

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

// Also alias legacy folder paths just in case
app.use('/assets', express.static(path.join(__dirname, 'public')));
app.use('/NG_Global_Manpower_Logo_Kit', express.static(path.join(__dirname, 'public/brand')));

// 6. Global View Context & Optional Auth
app.use(optionalAuth);
app.use((req, res, next) => {
  res.locals.appName = env.appName;
  res.locals.appUrl = env.appUrl;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.user = req.user || null;
  next();
});

// 7. Mount Application Routes
app.use('/', webRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// 8. 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// 9. Start Server
const server = app.listen(env.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ${env.appName} running on port ${env.port}`);
  console.log(`🌐 Environment: ${env.nodeEnv}`);
  console.log(`🔗 Local URL:   ${env.appUrl}`);
  console.log(`🛡️ Admin Portal: ${env.appUrl}/admin/login`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
