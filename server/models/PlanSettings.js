const mongoose = require('mongoose');

const planSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true,
  },
  planDuration: {
    type: Number,
    required: [true, 'Plan duration is required'],
    min: 1,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
}, { timestamps: true });

module.exports = mongoose.model('PlanSettings', planSettingsSchema);
