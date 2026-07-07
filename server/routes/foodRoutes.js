const express = require('express');
const router = express.Router();
const { getAllFoods, searchFoods, getSuggestedFoods, getFoodById, addFoodToDay } = require('../controllers/foodController');

router.get('/', getAllFoods);
router.get('/search', searchFoods);
router.get('/suggestions', getSuggestedFoods);
router.get('/:id', getFoodById);
router.post('/add-to-day', addFoodToDay);

module.exports = router;
