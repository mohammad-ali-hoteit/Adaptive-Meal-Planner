const mongoose = require('mongoose');

// Extensible — more measurements can be added later
const userMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true,
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 1,
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female'],
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: 1,
  },
  neck: {
    type: Number,
    required: [true, 'Neck measurement is required'],
    min: 1,
  },
  waist: {
    type: Number,
    required: [true, 'Waist measurement is required'],
    min: 1,
  },
}, { timestamps: true });

module.exports = mongoose.model('UserMetrics', userMetricsSchema);
