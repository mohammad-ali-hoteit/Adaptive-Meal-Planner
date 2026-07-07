const express = require('express');
const router = express.Router();
const { getProgress, updatePlan } = require('../controllers/progressController');

router.get('/', getProgress);
router.put('/plan', updatePlan);

module.exports = router;
