const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true,
  },
  notifications: {
    type: Boolean,
    default: true,
  },
  mealReminders: {
    type: Boolean,
    default: true,
  },
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark'],
  },
  wakeTime: {
    type: String,
    default: '07:00'
  },
  sleepTime: {
    type: String,
    default: '23:00'
  },
  busyPeriods: {
    type: [{
      label: String,
      startTime: String,
      endTime: String
    }],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', userSettingsSchema);
