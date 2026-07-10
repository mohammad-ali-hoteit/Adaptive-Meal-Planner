const UserSettings = require('../models/UserSettings');

// @desc Get user settings
const getSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user._id });
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const User = require('../models/User');
const UserMetrics = require('../models/UserMetrics');

// @desc Update user settings, profile, and metrics
const updateSettings = async (req, res) => {
  try {
    const { name, email, weight, height, targetCalories, wakeTime, sleepTime, busyPeriods } = req.body;
    
    // Update User
    if (name || email) {
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      await User.findByIdAndUpdate(req.user._id, updateData);
    }

    // Update UserMetrics
    if (weight || height || targetCalories) {
      const metricData = {};
      if (weight) metricData.weight = weight;
      if (height) metricData.height = height;
      if (targetCalories) metricData.targetCalories = targetCalories;
      await UserMetrics.findOneAndUpdate(
        { userId: req.user._id },
        { $set: metricData },
        { new: true, upsert: true }
      );
    }

    // Update UserSettings
    if (wakeTime || sleepTime || busyPeriods) {
      const settingsData = {};
      if (wakeTime) settingsData.wakeTime = wakeTime;
      if (sleepTime) settingsData.sleepTime = sleepTime;
      if (busyPeriods) settingsData.busyPeriods = busyPeriods;
      await UserSettings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: settingsData },
        { new: true, upsert: true }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getSettings, updateSettings };
