const mongoose = require('mongoose');

const mealScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  mealType: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  },
  suggestedTime: {
    type: String,
    required: true,
  },
  userEditedTime: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Each user can only have one schedule entry per meal type
mealScheduleSchema.index({ userId: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('MealSchedule', mealScheduleSchema);
