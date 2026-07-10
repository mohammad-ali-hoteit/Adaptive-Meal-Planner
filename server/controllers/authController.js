const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      throw new Error('A user with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate token and respond (never return password)
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Generate token and respond
    const token = generateToken(user._id);
    const metrics = await UserMetrics.findOne({ userId: user._id });
    const settings = await UserSettings.findOne({ userId: user._id });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isOnboarded: user.isOnboarded,
        metrics: metrics || null,
        schedule: settings || null
      },
    });
  } catch (err) {
    next(err);
  }
};

const UserMetrics = require('../models/UserMetrics');
const UserSettings = require('../models/UserSettings');

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const metrics = await UserMetrics.findOne({ userId: req.user._id });
    const settings = await UserSettings.findOne({ userId: req.user._id });
    
    res.json({
      success: true,
      user: {
        ...req.user._doc,
        metrics: metrics || null,
        schedule: settings || null
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
