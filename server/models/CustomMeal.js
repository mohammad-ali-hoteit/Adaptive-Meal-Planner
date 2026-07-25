const mongoose = require('mongoose');

const CustomMealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  name:     { type: String, required: true, trim: true },
  mealType: { type: String, default: 'Breakfast' },  // Breakfast, Lunch, Dinner, Snack
  image:    { type: String, default: '' },            // base64 data URL or external URL

  // ── Calculated totals ─────────────────────────────────
  calories: { type: Number, default: 0 },
  protein:  { type: Number, default: 0 },
  carbs:    { type: Number, default: 0 },
  fat:      { type: Number, default: 0 },

  // ── Ingredients breakdown ─────────────────────────────
  ingredients: [{
    foodId: { type: String },
    name:   { type: String },
    grams:  { type: Number, default: 100 }
  }]

}, { timestamps: true });

// Index for fast user-based queries
CustomMealSchema.index({ userId: 1 });

module.exports = mongoose.model('CustomMeal', CustomMealSchema);
