const mongoose = require('mongoose');

const customMealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  ingredients: {
    type: [{
      foodId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Food',
      },
      grams: {
        type: Number,
        required: true,
        min: 0.1,
      },
    }],
    default: []
  },
  slot: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'All'],
    default: 'Lunch',
  },
  kcal: { type: Number, default: 0 },
  pro: { type: Number, default: 0 },
  carb: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  // Controls whether this meal appears on the Community Meals page
  // Default true = all meals are shared. Users can set to false for private meals.
  isPublic: {
    type: Boolean,
    default: true,
  },
  // Distinguishes between explicitly saved Custom Meals vs one-off generated meals for the dashboard
  isPantryGenerated: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// Index for filtering by user and public status
customMealSchema.index({ userId: 1 });
customMealSchema.index({ isPublic: 1 });

module.exports = mongoose.model('CustomMeal', customMealSchema);
