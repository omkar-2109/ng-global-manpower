require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appName: process.env.APP_NAME || 'NG Global Manpower Services',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'fallback_cookie_secret',
  dbFile: process.env.DB_FILE || './data/ngglobal.sqlite',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '918080025670',
  helplinePhone: process.env.HELPLINE_PHONE || '+91 80800 25670',
  supportEmail: process.env.SUPPORT_EMAIL || 'hr@ngglobalmp.in',
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'hr@ngglobalmp.in',
    password: process.env.DEFAULT_ADMIN_PASSWORD || '918080025670',
    name: process.env.DEFAULT_ADMIN_NAME || 'NG Global HR Director'
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'qwen/qwen3.8-27b:free'
  }
};
