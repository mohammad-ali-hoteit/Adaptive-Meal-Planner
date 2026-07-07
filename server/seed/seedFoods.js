require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
const Food = require('../models/Food');
const meals = require('../../foods/meals.json');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const seedFoods = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing foods
    await Food.deleteMany({});
    console.log('🗑️  Cleared existing foods');

    // Insert from meals.json
    const inserted = await Food.insertMany(meals);
    console.log(`✅ Seeded ${inserted.length} foods from meals.json`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedFoods();
