const mongoose = require('mongoose');

const userResultsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true,
  },
  results: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('UserResults', userResultsSchema);
