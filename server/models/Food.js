const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
  },
  calories: {
    type: Number,
    required: [true, 'Calories is required'],
    min: 0,
  },
  protein: {
    type: Number,
    required: [true, 'Protein is required'],
    min: 0,
  },
  carbs: {
    type: Number,
    required: [true, 'Carbs is required'],
    min: 0,
  },
  fat: {
    type: Number,
    required: [true, 'Fat is required'],
    min: 0,
  },
  mealTypeTags: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  }],
  image: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Text index for search functionality
foodSchema.index({ name: 'text' });

module.exports = mongoose.model('Food', foodSchema);
