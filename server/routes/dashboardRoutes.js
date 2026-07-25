const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/:date', auth, dashboardController.getDailyLog);
router.get('/weekly/:startDate', auth, dashboardController.getWeeklyLogs);
router.post('/water', auth, dashboardController.updateWater);
router.post('/assign-meal', auth, dashboardController.assignMeal);
router.post('/complete-meal', auth, dashboardController.completeMeal);
router.delete('/remove-meal', auth, dashboardController.removeMeal);
router.put('/schedule-override', auth, dashboardController.scheduleOverride);

module.exports = router;
