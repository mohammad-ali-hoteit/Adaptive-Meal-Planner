const express = require('express');
const router = express.Router();
const { getDailyMeals, updateMealTime, assignMealToSlot, completeMeal, removeMealFromSlot } = require('../controllers/dashboardController');

router.get('/daily-meals', getDailyMeals);
router.put('/meal-time', updateMealTime);
router.post('/assign-meal', assignMealToSlot);
router.post('/complete-meal', completeMeal);
router.delete('/remove-meal', removeMealFromSlot);

module.exports = router;
