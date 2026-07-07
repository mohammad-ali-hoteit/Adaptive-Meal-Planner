const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAllFoods, searchFoods, getSuggestedFoods, getFoodById, addFoodToDay } = require('../controllers/foodController');

router.get('/', protect, getAllFoods);
router.get('/search', protect, searchFoods);
router.get('/suggestions', protect, getSuggestedFoods);
router.get('/:id', protect, getFoodById);
router.post('/add-to-day', protect, addFoodToDay);

module.exports = router;
