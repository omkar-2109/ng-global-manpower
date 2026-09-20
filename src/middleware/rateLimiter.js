const rateLimit = require('express-rate-limit');

// General rate limiter for website visits
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Strict limiter for candidate lead submissions to prevent bot spam
const leadSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Max 15 lead submissions per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many application submissions. Please try again after a few minutes.'
  }
});

// Strict limiter for admin login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 failed login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. For security reasons, please try again in 15 minutes.'
  }
});

module.exports = {
  generalLimiter,
  leadSubmissionLimiter,
  loginLimiter
};
