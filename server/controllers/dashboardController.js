const DailyLog = require('../models/DailyLog');
const CustomMeal = require('../models/CustomMeal');

const getTodayStart = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
};

// Helper to parse date string or fallback to today start
const getTargetDate = (dateStr) => {
  if (dateStr) {
    // If dateStr contains T, it's ISO, if not, it's YYYY-MM-DD
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    return new Date(`${dateOnly}T00:00:00Z`);
  }
  return getTodayStart();
};

// @desc Get daily log for a specific date or today
const getDailyMeals = async (req, res) => {
  try {
    const targetDate = getTargetDate(req.query.date);
    let log = await DailyLog.findOne({ userId: req.user._id, date: targetDate })
      .populate('mealsAssigned.customMealId')
      .populate('mealsAssigned.foodId');

    if (!log) {
      log = await DailyLog.create({
        userId: req.user._id,
        date: targetDate,
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

// @desc Override schedule for a specific daily log
const overrideSchedule = async (req, res) => {
  try {
    const { date, scheduleOverride } = req.body;
    const targetDate = getTargetDate(date);
    let log = await DailyLog.findOne({ userId: req.user._id, date: targetDate });
    
    if (!log) {
      log = await DailyLog.create({
        userId: req.user._id,
        date: targetDate,
        mealsAssigned: [
          { mealType: 'breakfast' },
          { mealType: 'lunch' },
          { mealType: 'dinner' },
          { mealType: 'snack' }
        ],
        mealsCompleted: [],
        waterGlasses: 0,
        scheduleOverride
      });
    } else {
      log.scheduleOverride = scheduleOverride;
      await log.save();
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
    const { mealType, customMealId, foodId, date, snackIndex = 0 } = req.body;
    const targetDate = getTargetDate(date);
    let log = await DailyLog.findOne({ userId: req.user._id, date: targetDate });
    
    if (!log) {
      log = await DailyLog.create({
        userId: req.user._id,
        date: targetDate,
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

    let slotIndex = -1;
    let occurrences = 0;
    for (let i = 0; i < log.mealsAssigned.length; i++) {
      if (log.mealsAssigned[i].mealType === mealType) {
        if (occurrences === parseInt(snackIndex, 10)) {
          slotIndex = i;
          break;
        }
        occurrences++;
      }
    }

    if (slotIndex >= 0) {
      log.mealsAssigned[slotIndex].customMealId = customMealId || null;
      log.mealsAssigned[slotIndex].foodId = foodId || null;
    } else {
      while (occurrences < parseInt(snackIndex, 10)) {
        log.mealsAssigned.push({ mealType });
        occurrences++;
      }
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
    const { mealType, date, snackIndex = 0 } = req.body;
    const targetDate = getTargetDate(date);
    let log = await DailyLog.findOne({ userId: req.user._id, date: targetDate });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

    let occurrences = 0;
    let found = false;
    for (let i = 0; i < log.mealsCompleted.length; i++) {
      if (log.mealsCompleted[i].mealType === mealType) {
        if (occurrences === parseInt(snackIndex, 10)) {
          found = true;
          break;
        }
        occurrences++;
      }
    }

    if (!found) {
      // pad missing completions if any
      while (occurrences < parseInt(snackIndex, 10)) {
        // Technically shouldn't happen without completing previous snacks, but safe fallback
        log.mealsCompleted.push({ mealType, completedAt: new Date() });
        occurrences++;
      }
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
    const { mealType, date, snackIndex = 0 } = req.body;
    const targetDate = getTargetDate(date);
    let log = await DailyLog.findOne({ userId: req.user._id, date: targetDate });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

    let occurrences = 0;
    let slotIndex = -1;
    for (let i = 0; i < log.mealsAssigned.length; i++) {
      if (log.mealsAssigned[i].mealType === mealType) {
        if (occurrences === parseInt(snackIndex, 10)) {
          slotIndex = i;
          break;
        }
        occurrences++;
      }
    }

    if (slotIndex >= 0) {
      log.mealsAssigned[slotIndex].customMealId = undefined;
      log.mealsAssigned[slotIndex].foodId = undefined;
      await log.save();
    }// Uncomplete it if removed
    log.mealsCompleted = log.mealsCompleted.filter(m => m.mealType !== mealType);

    log.markModified('mealsAssigned');
    log.markModified('mealsCompleted');

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
    const { waterGlasses, date } = req.body;
    const targetDate = getTargetDate(date);
    let log = await DailyLog.findOneAndUpdate(
      { userId: req.user._id, date: targetDate },
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
    
    // Get logs from 7 days in the past to 7 days in the future
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    
    const end = new Date(today);
    end.setDate(end.getDate() + 7);

    const logs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end }
    }).populate('mealsAssigned.customMealId').populate('mealsAssigned.foodId');

    res.json({ success: true, logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getDailyMeals, getWeeklyLogs, updateMealTime, assignMealToSlot, completeMeal, removeMealFromSlot, updateWater, overrideSchedule };
