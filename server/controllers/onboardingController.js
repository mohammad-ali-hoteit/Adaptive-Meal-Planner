const User = require('../models/User');
const UserMetrics = require('../models/UserMetrics');
const UserSettings = require('../models/UserSettings');
const PlanSettings = require('../models/PlanSettings');

// @desc Complete onboarding and save all settings/metrics
const completeOnboarding = async (req, res) => {
  try {
    const { 
      age, gender, weight, targetWeight, worksOut, height, neck, waist, 
      wakeTime, sleepTime, busyPeriods, planDuration, startDate,
      targetFatPercent, targetSMM, activityLevel
    } = req.body;

    const userId = req.user._id;

    // 1. Save User Metrics
    await UserMetrics.findOneAndUpdate(
      { userId },
      { age, gender, weight, height, neck, waist },
      { upsert: true, new: true }
    );

    // 2. Save User Settings (Schedule)
    await UserSettings.findOneAndUpdate(
      { userId },
      { wakeTime, sleepTime, busyPeriods },
      { upsert: true, new: true }
    );

    // 3. Save Plan Settings
    await PlanSettings.findOneAndUpdate(
      { userId },
      { planDuration, startDate: new Date(startDate) },
      { upsert: true, new: true }
    );

    // 4. Mark user as onboarded
    const user = await User.findById(userId);
    if (user) {
      user.isOnboarded = true;
      await user.save();
    }

    res.json({ success: true, message: 'Onboarding completed successfully' });
  } catch (error) {
    console.error('Error during onboarding completion:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { completeOnboarding };
