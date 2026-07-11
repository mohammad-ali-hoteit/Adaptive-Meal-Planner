const express = require('express');
const router = express.Router();
const { getDailyMeals, getWeeklyLogs, updateMealTime, assignMealToSlot, completeMeal, removeMealFromSlot, updateWater, overrideSchedule } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/daily-meals', getDailyMeals);
router.get('/weekly-logs', getWeeklyLogs);
router.put('/meal-time', updateMealTime);
router.post('/assign-meal', assignMealToSlot);
router.post('/complete-meal', completeMeal);
router.delete('/remove-meal', removeMealFromSlot);
router.post('/override-schedule', overrideSchedule);
router.post('/water', updateWater);

module.exports = router;
