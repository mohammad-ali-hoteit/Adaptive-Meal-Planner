const mongoose = require('mongoose');

// Either foodId or customMealId, not both
const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
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
  mealType: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  },
  date: {
    type: Date,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for querying user history by date
historySchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('History', historySchema);
