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
      ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Ingredient',
      },
      grams: {
        type: Number,
        required: true,
        min: 1,
      },
    }],
    validate: {
      validator: (v) => v.length >= 1,
      message: 'At least one ingredient is required',
    },
  },
  // Controls whether this meal appears on the Community Meals page
  // Default true = all meals are shared. Users can set to false for private meals.
  isPublic: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Index for filtering by user and public status
customMealSchema.index({ userId: 1 });
customMealSchema.index({ isPublic: 1 });

module.exports = mongoose.model('CustomMeal', customMealSchema);
