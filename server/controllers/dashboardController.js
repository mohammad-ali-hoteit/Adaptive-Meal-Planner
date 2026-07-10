const DailyLog = require('../models/DailyLog');
const CustomMeal = require('../models/CustomMeal');

const getTodayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// @desc Get daily log for today
const getDailyMeals = async (req, res) => {
  try {
    const today = getTodayStart();
    let log = await DailyLog.findOne({ userId: req.user._id, date: today })
      .populate('mealsAssigned.customMealId')
      .populate('mealsAssigned.foodId');

    if (!log) {
      log = await DailyLog.create({
        userId: req.user._id,
        date: today,
        mealsAssigned: [
          { mealType: 'breakfast' },
          { mealType: 'lunch' },
          { mealType: 'dinner' },
          { mealType: 'snack' }
        ],
        mealsCompleted: [],
        waterGlasses: 0
      });
    }

    res.json({ success: true, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc Update meal time (Actually this just sets schedule in UserSettings in UI, but if we need a specific daily override we can do it here. For now returning success)
const updateMealTime = async (req, res) => {
  res.json({ success: true, message: 'Time updated' });
};

// @desc Assign custom meal or food to a slot
const assignMealToSlot = async (req, res) => {
  try {
    const { mealType, customMealId, foodId } = req.body;
    const today = getTodayStart();
    let log = await DailyLog.findOne({ userId: req.user._id, date: today });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

    const slotIndex = log.mealsAssigned.findIndex(m => m.mealType === mealType);
    if (slotIndex >= 0) {
      log.mealsAssigned[slotIndex].customMealId = customMealId || null;
      log.mealsAssigned[slotIndex].foodId = foodId || null;
    } else {
      log.mealsAssigned.push({ mealType, customMealId, foodId });
    }

    await log.save();
    await log.populate('mealsAssigned.customMealId');
    await log.populate('mealsAssigned.foodId');

    res.json({ success: true, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc Complete a meal
const completeMeal = async (req, res) => {
  try {
    const { mealType } = req.body;
    const today = getTodayStart();
    let log = await DailyLog.findOne({ userId: req.user._id, date: today });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

    if (!log.mealsCompleted.find(m => m.mealType === mealType)) {
      log.mealsCompleted.push({ mealType, completedAt: new Date() });
      await log.save();
    }
    
    await log.populate('mealsAssigned.customMealId');
    await log.populate('mealsAssigned.foodId');

    res.json({ success: true, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc Remove meal from slot
const removeMealFromSlot = async (req, res) => {
  try {
    const { mealType } = req.body;
    const today = getTodayStart();
    let log = await DailyLog.findOne({ userId: req.user._id, date: today });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

    const slotIndex = log.mealsAssigned.findIndex(m => m.mealType === mealType);
    if (slotIndex >= 0) {
      log.mealsAssigned[slotIndex].customMealId = null;
      log.mealsAssigned[slotIndex].foodId = null;
    }

    // Uncomplete it if removed
    log.mealsCompleted = log.mealsCompleted.filter(m => m.mealType !== mealType);

    await log.save();
    await log.populate('mealsAssigned.customMealId');
    await log.populate('mealsAssigned.foodId');

    res.json({ success: true, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateWater = async (req, res) => {
  try {
    const { waterGlasses } = req.body;
    const today = getTodayStart();
    let log = await DailyLog.findOneAndUpdate(
      { userId: req.user._id, date: today },
      { waterGlasses },
      { new: true, upsert: true }
    );
    res.json({ success: true, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getWeeklyLogs = async (req, res) => {
  try {
    const today = getTodayStart();
    // Get logs from today to 6 days in future
    const end = new Date(today);
    end.setDate(end.getDate() + 7);

    const logs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: today, $lt: end }
    }).populate('mealsAssigned.customMealId').populate('mealsAssigned.foodId');

    res.json({ success: true, logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getDailyMeals, getWeeklyLogs, updateMealTime, assignMealToSlot, completeMeal, removeMealFromSlot, updateWater };
