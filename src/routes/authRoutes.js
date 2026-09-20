const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validate, loginValidation } = require('../middleware/validator');

router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, validate(loginValidation), authController.login);
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

module.exports = router;
