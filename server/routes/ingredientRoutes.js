const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');

// GET /api/ingredients
// Returns all ingredients from the database
router.get('/', ingredientController.getIngredients);

module.exports = router;
