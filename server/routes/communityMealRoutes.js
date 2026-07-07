const express = require('express');
const router = express.Router();
const { getAllCommunityMeals, getCommunityMealById, copyMealToMyMeals, addCommunityMealToDay } = require('../controllers/communityMealController');

router.get('/', getAllCommunityMeals);
router.get('/:id', getCommunityMealById);
router.post('/:id/copy', copyMealToMyMeals);
router.post('/:id/add-to-day', addCommunityMealToDay);

module.exports = router;
