const helmet = require('helmet');

// Custom CSP allowing required CDNs (Three.js, Confetti, FontAwesome, Google Fonts)
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
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com'
      ],
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
        'https://wa.me',
        'https://*.whatsapp.com'
      ],
      connectSrc: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com'
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
});

module.exports = { securityHeaders };
