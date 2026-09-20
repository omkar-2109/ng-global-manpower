const helmet = require('helmet');

// Custom CSP allowing required CDNs (Three.js, Confetti, FontAwesome, Google Fonts, Supabase) and inline handlers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // needed for Three.js shader compilation
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net'
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com'
      ],
      styleSrcAttr: ["'unsafe-inline'"],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com',
        'data:'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'http:'
      ],
      connectSrc: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com',
        'https://xlluysszizykztwpnuig.supabase.co',
        'https://*.supabase.co',
        'https://wa.me',
        'https://*.whatsapp.com'
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
});

module.exports = { securityHeaders };
