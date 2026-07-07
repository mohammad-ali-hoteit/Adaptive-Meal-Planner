const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    trim: true,
    unique: true,
  },
  caloriesPer100g: {
    type: Number,
    required: [true, 'Calories per 100g is required'],
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
}, { timestamps: true });

// Text index for search functionality
ingredientSchema.index({ name: 'text' });

module.exports = mongoose.model('Ingredient', ingredientSchema);
