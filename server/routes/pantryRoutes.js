const express = require('express');
const router = express.Router();
const { generateFromPantry } = require('../controllers/pantryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateFromPantry);

module.exports = router;
