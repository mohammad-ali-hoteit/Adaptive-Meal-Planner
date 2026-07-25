const DailyLog = require('../models/DailyLog');
const User = require('../models/User');

// ── Helper: Extract consumed macros from a log ──────────
const extractMacrosFromLog = (log) => {
  let cals = 0, pro = 0, carb = 0, fat = 0;
  if (!log || !log.mealsCompleted || !log.mealsAssigned) return { cals, pro, carb, fat, mealsCount: 0 };

  log.mealsCompleted.forEach(mc => {
    const assigned = log.mealsAssigned.find(ma => {
      if (mc.mealType === 'snack') return ma.mealType === 'snack' && ma.snackIndex === mc.snackIndex;
      return ma.mealType === mc.mealType;
    });

    if (assigned?.snapshotMacros) {
      cals += assigned.snapshotMacros.kcal || 0;
      pro  += assigned.snapshotMacros.pro  || 0;
      carb += assigned.snapshotMacros.carb || 0;
      fat  += assigned.snapshotMacros.fat  || 0;
    } else if (assigned?.customMealId) {
      cals += assigned.customMealId.kcal || 0;
      pro  += assigned.customMealId.pro  || 0;
      carb += assigned.customMealId.carb || 0;
      fat  += assigned.customMealId.fat  || 0;
    } else if (assigned?.foodId?.nutrition) {
      cals += assigned.foodId.nutrition.calories   || 0;
      pro  += assigned.foodId.nutrition.protein_g   || 0;
      carb += assigned.foodId.nutrition.carbs_g     || 0;
      fat  += assigned.foodId.nutrition.fat_g       || 0;
    }
  });

  return { cals, pro, carb, fat, mealsCount: log.mealsCompleted.length };
};

const getWeeklyProgress = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    const logs = await DailyLog.find({ userId: req.userId, date: { $in: dates } });
    const logMap = {};
    logs.forEach(l => { logMap[l.date] = l; });

    const user = await User.findById(req.userId);
    const targetCal = user?.totalCal || 2000;

    let totCal = 0, totPro = 0, totCarb = 0, totFat = 0;
    let daysWithData = 0;

    const weeklyData = dates.map(date => {
      const log = logMap[date];
      const macros = extractMacrosFromLog(log);
      const d = new Date(date);

      if (macros.cals > 0) {
        totCal  += macros.cals;
        totPro  += macros.pro;
        totCarb += macros.carb;
        totFat  += macros.fat;
        daysWithData++;
      }

      return {
        date,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        cals:    macros.cals,
        target:  targetCal,
        pct:     Math.min((macros.cals / targetCal) * 100, 100)
      };
    });

    const macroAvgs = daysWithData > 0
      ? {
          cal:  Math.round(totCal  / daysWithData),
          pro:  Math.round(totPro  / daysWithData),
          carb: Math.round(totCarb / daysWithData),
          fat:  Math.round(totFat  / daysWithData),
          calTarget:  targetCal,
          proTarget:  user?.totalPro  || 150,
          carbTarget: user?.totalCarb || 200,
          fatTarget:  user?.totalFat  || 65
        }
      : {
          cal: 0, pro: 0, carb: 0, fat: 0,
          calTarget:  targetCal,
          proTarget:  user?.totalPro  || 150,
          carbTarget: user?.totalCarb || 200,
          fatTarget:  user?.totalFat  || 65
        };

    res.json({ success: true, weeklyData, macroAvgs });
  } catch (err) {
    console.error('Progress weekly error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getStreak = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Count total meals tracked
    const logs = await DailyLog.find({ userId: req.userId });
    let totalMeals = 0;
    logs.forEach(l => {
      totalMeals += (l.mealsCompleted?.length || 0);
    });

      const currentFatMass = user?.metrics?.weight && user?.metrics?.bodyFat 
        ? (user.metrics.weight * (user.metrics.bodyFat / 100)).toFixed(1) 
        : 15;
      
      const targetFatMass = user?.metrics?.weight && user?.goals?.targetFatPercent 
        ? (user.metrics.weight * (user.goals.targetFatPercent / 100)).toFixed(1) 
        : 12;

      res.json({
        success: true,
        streak:       user?.currentStreak || 0,
        totalMeals,
        fatMass: {
          current: currentFatMass,
          target:  targetFatMass
        }
      });
  } catch (err) {
    console.error('Streak error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getHeatmap = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    const logs = await DailyLog.find({ userId: req.userId, date: { $in: dates } });
    const logMap = {};
    logs.forEach(l => { logMap[l.date] = l; });

    const heatmap = dates.map(date => {
      const log = logMap[date];
      let intensity = 0;
      if (log?.mealsCompleted) {
        if (log.mealsCompleted.length >= 3)      intensity = 2;
        else if (log.mealsCompleted.length > 0)  intensity = 1;
      }
      return { date, intensity };
    });

    res.json({ success: true, heatmap });
  } catch (err) {
    console.error('Heatmap error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { year, month } = req.params;
    const paddedMonth = String(month).padStart(2, '0');
    const prefix = `${year}-${paddedMonth}`;

    const logs = await DailyLog.find({
      userId: req.userId,
      date: { $regex: `^${prefix}` }
    });

    res.json({ success: true, logs });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getWeeklyProgress,
  getStreak,
  getHeatmap,
  getHistory
};
