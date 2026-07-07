const express = require('express');
const router = express.Router();
const { getUserCustomMeals, createCustomMeal, getCustomMealById, updateCustomMeal, deleteCustomMeal } = require('../controllers/customMealController');

router.get('/', getUserCustomMeals);
router.post('/', createCustomMeal);
router.get('/:id', getCustomMealById);
router.put('/:id', updateCustomMeal);
router.delete('/:id', deleteCustomMeal);

module.exports = router;
