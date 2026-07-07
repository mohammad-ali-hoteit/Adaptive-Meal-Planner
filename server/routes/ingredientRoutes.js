const express = require('express');
const router = express.Router();
const { searchIngredients } = require('../controllers/ingredientController');

router.get('/search', searchIngredients);

module.exports = router;
