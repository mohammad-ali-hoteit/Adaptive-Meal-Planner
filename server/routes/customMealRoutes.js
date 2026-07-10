const express = require('express');
const router = express.Router();
const { getUserCustomMeals, createCustomMeal, getCustomMealById, updateCustomMeal, deleteCustomMeal } = require('../controllers/customMealController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getUserCustomMeals)
  .post(protect, createCustomMeal);

router.route('/:id')
  .get(protect, getCustomMealById)
  .put(protect, updateCustomMeal)
  .delete(protect, deleteCustomMeal);

module.exports = router;
