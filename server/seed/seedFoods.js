require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Food = require('../models/Food');
const foods = require('./foods.json');

const seedFoods = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing foods
    await Food.deleteMany({});
    console.log('🗑️  Cleared existing foods');

    // Insert seed data
    const inserted = await Food.insertMany(foods);
    console.log(`✅ Seeded ${inserted.length} foods`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedFoods();
