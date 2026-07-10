const DailyLog = require('../models/DailyLog');

// @desc Get full history of daily logs
const getHistory = async (req, res) => {
  try {
    const logs = await DailyLog.find({ userId: req.user._id })
      .sort({ date: -1 })
      .populate('mealsAssigned.customMealId')
      .populate('mealsAssigned.foodId');
    
    res.json({ success: true, history: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getHistory };
