const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveOnboarding = async (req, res) => {
  try {
    const { formData, results } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.metrics = {
      age:           formData.age,
      race:          formData.race || 'White',
      gender:        formData.gender,
      weight:        formData.weight,
      targetWeight:  formData.targetWeight,
      height:        formData.height,
      neck:          formData.neck,
      waist:         formData.waist,
      hip:           formData.hip,
      worksOut:      formData.worksOut || false,
      activityLevel: formData.activityLevel || 'light',
      bodyFat:       formData._calculatedBF || 0,
      smm:           formData._calculatedSMM || 0,
    };

    user.goals = {
      targetFatPercent:     formData.targetFatPercent,
      targetSMM:            formData.targetSMM,
      targetFatCategory:    formData.targetFatCategory,
      targetMuscleCategory: formData.targetMuscleCategory,
      lossRate:             formData.lossRate || 0.5,
      planDuration:         formData.planDuration || 30,
      startDate:            formData.startDate,
      strategy:             formData.strategy || ''
    };

    user.totalCal  = results.calories || 2000;
    user.totalPro  = results.protein  || 150;
    user.totalCarb = results.carbs    || 200;
    user.totalFat  = results.fat      || 65;

    if (formData.wakeTime || formData.sleepTime) {
      user.schedule = {
        wakeTime:    formData.wakeTime || '07:00',
        sleepTime:   formData.sleepTime || '23:00',
        busyPeriods: formData.busyPeriods || []
      };
    }

    user.isOnboarded = true;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, user: userObj });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ message: 'Server error during onboarding.' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { wakeTime, sleepTime, busyPeriods, userMacros } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.schedule = {
      wakeTime:    wakeTime    || user.schedule.wakeTime,
      sleepTime:   sleepTime   || user.schedule.sleepTime,
      busyPeriods: busyPeriods || user.schedule.busyPeriods
    };

    if (userMacros) {
      if (userMacros.totalCal)  user.totalCal  = userMacros.totalCal;
      if (userMacros.totalPro)  user.totalPro  = userMacros.totalPro;
      if (userMacros.totalCarb) user.totalCarb = userMacros.totalCarb;
      if (userMacros.totalFat)  user.totalFat  = userMacros.totalFat;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, user: userObj });
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name) user.name = name;
    if (preferences) {
      user.preferences = {
        darkMode:      preferences.darkMode      ?? user.preferences.darkMode,
        notifications: preferences.notifications ?? user.preferences.notifications
      };
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, user: userObj });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const DailyLog = require('../models/DailyLog');
    const CustomMeal = require('../models/CustomMeal');

    await DailyLog.deleteMany({ userId: req.userId });
    await CustomMeal.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);

    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  saveOnboarding,
  updateSettings,
  updateProfile,
  deleteAccount
};
