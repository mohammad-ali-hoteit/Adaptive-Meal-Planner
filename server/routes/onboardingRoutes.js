const express = require('express');
const router = express.Router();
const { saveMetrics, savePlanSettings, completeOnboarding, getResults } = require('../controllers/onboardingController');

router.post('/metrics', saveMetrics);
router.post('/plan-settings', savePlanSettings);
router.post('/complete', completeOnboarding);
router.get('/results', getResults);

module.exports = router;
