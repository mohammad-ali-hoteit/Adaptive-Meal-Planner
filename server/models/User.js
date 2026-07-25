const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // ── Auth ──────────────────────────────────────────────
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  isOnboarded: { type: Boolean, default: false },

  // ── Body Metrics (from Onboarding) ────────────────────
  metrics: {
    age:           { type: Number },
    race:          { type: String, default: 'White' },   // 'White' | 'Black'
    gender:        { type: String },                     // 'male' | 'female'
    weight:        { type: Number },                     // kg
    targetWeight:  { type: Number },                     // kg
    height:        { type: Number },                     // cm
    neck:          { type: Number },                     // cm
    waist:         { type: Number },                     // cm
    hip:           { type: Number },                     // cm (females)
    worksOut:      { type: Boolean, default: false },
    activityLevel: { type: String, default: 'light' },   // sedentary | light | moderate | active
    bodyFat:       { type: Number },                     // calculated
    smm:           { type: Number },                     // skeletal muscle mass (calculated)
  },

  // ── Goals (from StepGoal) ─────────────────────────────
  goals: {
    targetFatPercent:    { type: Number },
    targetSMM:           { type: Number },
    targetFatCategory:   { type: String },
    targetMuscleCategory:{ type: String },
    lossRate:            { type: Number, default: 0.5 },  // kg/week
    planDuration:        { type: Number, default: 30 },   // days
    startDate:           { type: String },
    strategy:            { type: String }                  // FAT_LOSS | BODY_RECOMPOSITION | CONTROLLED_BULK | MAINTENANCE
  },

  // ── Calculated Macros ─────────────────────────────────
  totalCal:  { type: Number, default: 2000 },
  totalPro:  { type: Number, default: 150 },
  totalCarb: { type: Number, default: 200 },
  totalFat:  { type: Number, default: 65 },

  // ── Default Schedule ──────────────────────────────────
  schedule: {
    wakeTime:    { type: String, default: '07:00' },
    sleepTime:   { type: String, default: '23:00' },
    busyPeriods: [{
      label:     { type: String },
      startTime: { type: String },
      endTime:   { type: String },
      type:      { type: String, default: 'office' }  // office | moderate | hard | study | gym
    }]
  },

  // ── Preferences ───────────────────────────────────────
  preferences: {
    darkMode:      { type: Boolean, default: false },
    notifications: { type: Boolean, default: true }
  },

  // ── Streak ────────────────────────────────────────────
  currentStreak:  { type: Number, default: 0 },
  lastActiveDate: { type: String }

}, { timestamps: true });

// ── Hash password before save ───────────────────────────
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Compare password method ─────────────────────────────
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
