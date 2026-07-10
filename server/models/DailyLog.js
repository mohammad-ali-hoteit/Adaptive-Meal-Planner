const mongoose = require('mongoose');

const mealTypeEnum = ['breakfast', 'lunch', 'dinner', 'snack'];

const dailyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  date: {
    type: Date,
    required: true,
  },
  mealsAssigned: [{
    mealType: {
      type: String,
      required: true,
      enum: mealTypeEnum,
    },
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      default: null,
    },
    customMealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomMeal',
      default: null,
    },
  }],
  mealsCompleted: [{
    mealType: {
      type: String,
      required: true,
      enum: mealTypeEnum,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  waterGlasses: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Each user can only have one daily log per date
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
