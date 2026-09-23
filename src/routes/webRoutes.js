const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.get('/', pageController.getHomePage);
router.get('/jobs', pageController.getJobsPage);
router.get('/jobs/:id', pageController.getJobDetailPage);

// Quick redirect to fraud advisory section
router.get('/fraud-advisory', (req, res) => {
  res.redirect('/#fraud-advisory');
});

// Quick redirect to eligibility wizard
router.get('/apply', (req, res) => {
  res.redirect('/#lead-funnel');
});

module.exports = router;
