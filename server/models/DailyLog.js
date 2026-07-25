const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:   { type: String, required: true }, // Format: YYYY-MM-DD

  waterGlasses: { type: Number, default: 0 },

  // ── Schedule override for this specific day ───────────
  scheduleOverride: {
    wakeTime:    { type: String },
    sleepTime:   { type: String },
    busyPeriods: [{
      label:     { type: String },
      startTime: { type: String },
      endTime:   { type: String },
      type:      { type: String, default: 'office' }
    }]
  },

  // ── Assigned meals ────────────────────────────────────
  mealsAssigned: [{
    mealType:    { type: String },  // 'breakfast', 'lunch', 'dinner', 'snack'
    snackIndex:  { type: Number },  // For snack ordering
    foodId:      { type: mongoose.Schema.Types.Mixed },      // Raw food reference
    customMealId:{ type: mongoose.Schema.Types.Mixed },      // Custom meal data
    snapshotMacros: {
      kcal: { type: Number, default: 0 },
      pro:  { type: Number, default: 0 },
      carb: { type: Number, default: 0 },
      fat:  { type: Number, default: 0 }
    },
    assignedAt:  { type: Date, default: Date.now }
  }],

  // ── Completed meals ───────────────────────────────────
  mealsCompleted: [{
    mealType:    { type: String },
    snackIndex:  { type: Number },
    completedAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

// Ensure one log per user per day
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
