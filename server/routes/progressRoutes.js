const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');

router.get('/weekly', auth, progressController.getWeeklyProgress);
router.get('/streak', auth, progressController.getStreak);
router.get('/heatmap', auth, progressController.getHeatmap);
router.get('/history/:year/:month', auth, progressController.getHistory);

module.exports = router;
