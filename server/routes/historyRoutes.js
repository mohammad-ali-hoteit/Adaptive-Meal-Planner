const express = require('express');
const router = express.Router();
const { logFood, getHistory, getHistoryByDate } = require('../controllers/historyController');

router.get('/', getHistory);
router.post('/', logFood);
router.get('/:date', getHistoryByDate);

module.exports = router;
