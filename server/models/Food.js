const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, trim: true },
    ar: { type: String, default: '', trim: true },
  },
  meal_type: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'drink'],
  }],
  type: [{
    type: String,
  }],
  size_g: {
    type: Number,
    default: 0,
  },
  nutrition: {
    calories: { type: Number, required: true, min: 0 },
    protein_g: { type: Number, required: true, min: 0 },
    carbs_g: { type: Number, required: true, min: 0 },
    fat_g: { type: Number, required: true, min: 0 },
  },
  ingredients: [{
    type: String,
  }],
  image_name: {
    type: String,
    default: '',
  },
  image_url: {
    type: String,
    default: '',
  },
  unit: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Text index for search
foodSchema.index({ 'name.en': 'text', 'name.ar': 'text' });

module.exports = mongoose.model('Food', foodSchema);
