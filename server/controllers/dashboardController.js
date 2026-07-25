const User = require('../models/User');
const DailyLog = require('../models/DailyLog');

// ── Helper: Get or create daily log ─────────────────────
const getOrCreateLog = async (userId, date) => {
  let log = await DailyLog.findOne({ userId, date });
  if (!log) {
    log = await DailyLog.create({ userId, date });
  }
  return log;
};

// ── Helper: Update streak ───────────────────────────────
const updateStreak = async (userId, dateStr) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    if (user.lastActiveDate === dateStr) return; // Already counted today

    // Check if yesterday was active
    const today = new Date(dateStr);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (user.lastActiveDate === yesterdayStr) {
      user.currentStreak = (user.currentStreak || 0) + 1;
    } else if (user.lastActiveDate !== dateStr) {
      user.currentStreak = 1; // Reset streak
    }

    user.lastActiveDate = dateStr;
    await user.save();
  } catch (err) {
    console.error('Streak update error:', err);
  }
};

const getDailyLog = async (req, res) => {
  try {
    const log = await getOrCreateLog(req.userId, req.params.date);
    res.json({ success: true, log });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getWeeklyLogs = async (req, res) => {
  try {
    const start = new Date(req.params.startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(dateStr);
    }

    const logs = await DailyLog.find({
      userId: req.userId,
      date: { $in: dates }
    });

    // Create a map for easy lookup
    const logMap = {};
    logs.forEach(log => { logMap[log.date] = log; });

    // Return all 7 days (with empty logs for days without data)
    const weekLogs = dates.map(date => logMap[date] || { date, waterGlasses: 0, mealsAssigned: [], mealsCompleted: [] });

    res.json({ success: true, logs: weekLogs });
  } catch (err) {
    console.error('Get weekly error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateWater = async (req, res) => {
  try {
    const { waterGlasses, date } = req.body;
    const log = await getOrCreateLog(req.userId, date);

    log.waterGlasses = waterGlasses;
    await log.save();

    // Update streak
    await updateStreak(req.userId, date);

    res.json({ success: true, log });
  } catch (err) {
    console.error('Water update error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const assignMeal = async (req, res) => {
  try {
    const { date, mealType, snackIndex, foodId, customMealId, snapshotMacros } = req.body;
    const log = await getOrCreateLog(req.userId, date);

    // Remove any existing assignment for this slot
    log.mealsAssigned = log.mealsAssigned.filter(m => {
      if (mealType === 'snack') return !(m.mealType === 'snack' && m.snackIndex === snackIndex);
      return m.mealType !== mealType;
    });

    // Add new assignment
    log.mealsAssigned.push({
      mealType,
      snackIndex,
      foodId,
      customMealId,
      snapshotMacros
    });

    await log.save();

    // Update streak
    await updateStreak(req.userId, date);

    res.json({ success: true, log });
  } catch (err) {
    console.error('Assign meal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const completeMeal = async (req, res) => {
  try {
    const { mealType, snackIndex, date } = req.body;
    const log = await getOrCreateLog(req.userId, date);

    log.mealsCompleted.push({ mealType, snackIndex });
    await log.save();

    // Update streak
    await updateStreak(req.userId, date);

    res.json({ success: true, log });
  } catch (err) {
    console.error('Complete meal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const removeMeal = async (req, res) => {
  try {
    const { mealType, snackIndex, date } = req.body;
    const log = await getOrCreateLog(req.userId, date);

    // Remove from assigned
    log.mealsAssigned = log.mealsAssigned.filter(m => {
      if (mealType === 'snack') return !(m.mealType === 'snack' && (m.snackIndex ?? 0) === (snackIndex ?? 0));
      return m.mealType !== mealType;
    });

    // Also remove from completed
    log.mealsCompleted = log.mealsCompleted.filter(m => {
      if (mealType === 'snack') return !(m.mealType === 'snack' && (m.snackIndex ?? 0) === (snackIndex ?? 0));
      return m.mealType !== mealType;
    });

    await log.save();
    res.json({ success: true, log });
  } catch (err) {
    console.error('Remove meal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const scheduleOverride = async (req, res) => {
  try {
    const { date, wakeTime, sleepTime, busyPeriods } = req.body;
    const log = await getOrCreateLog(req.userId, date);

    log.scheduleOverride = {
      wakeTime:    wakeTime    || '07:00',
      sleepTime:   sleepTime   || '23:00',
      busyPeriods: busyPeriods || []
    };

    await log.save();
    res.json({ success: true, log });
  } catch (err) {
    console.error('Schedule override error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getDailyLog,
  getWeeklyLogs,
  updateWater,
  assignMeal,
  completeMeal,
  removeMeal,
  scheduleOverride
};
