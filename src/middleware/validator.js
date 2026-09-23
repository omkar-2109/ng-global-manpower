const { body, validationResult } = require('express-validator');

// Validation runner middleware
function validate(validations) {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // If API request
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    // For web form submissions
    return res.status(400).render('pages/400', {
      title: 'Invalid Submission',
      message: errors.array()[0].msg
    });
  };
}

// Validation schemas
const leadValidation = [
  body('full_name').trim().notEmpty().withMessage('Full Name as in Passport is mandatory.'),
  body('phone').trim().notEmpty().withMessage('Phone / WhatsApp number is mandatory.').isLength({ min: 8, max: 20 }).withMessage('Please enter a valid phone number with country code.'),
  body('city').trim().notEmpty().withMessage('City & State is mandatory.'),
  body('experience').trim().notEmpty().withMessage('Please select your experience level.'),
  body('trade').trim().notEmpty().withMessage('Please select your trade or occupational skill.'),
  body('destination').trim().notEmpty().withMessage('Please select your preferred destination.')
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

const jobValidation = [
  body('title').trim().notEmpty().withMessage('Job title is required.'),
  body('category').trim().notEmpty().withMessage('Trade category is required.'),
  body('country').trim().notEmpty().withMessage('Country destination is required.'),
  body('salary_inr').trim().notEmpty().withMessage('INR salary range is required.')
];

module.exports = {
  validate,
  leadValidation,
  loginValidation,
  jobValidation
};
