const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const Food = require('../models/Food');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nutrisync');
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const seedLogs = async () => {
  await connectDB();
  
  try {
    // 1. Get first user
    const user = await User.findOne();
    if (!user) {
      console.log('No user found to seed logs for.');
      process.exit(0);
    }
    console.log(`Seeding data for user: ${user.name} (${user._id})`);

    // 2. Get some random foods to use for meals
    const allFoods = await Food.find().limit(20);
    if (allFoods.length === 0) {
      console.log('No foods found in DB to use for meals.');
      process.exit(0);
    }

    // 3. Delete existing logs for this user to avoid duplicates
    await DailyLog.deleteMany({ userId: user._id });
    console.log('Cleared existing logs for user.');

    // 4. Generate logs for the past 14 days and next 3 days
    const logsToCreate = [];
    
    for (let i = -14; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split('T')[0];

      // Base macros for a day
      const targetCalories = 2000;
      let totalKcal = 0;
      let totalPro = 0;
      let totalCarb = 0;
      let totalFat = 0;

      const meals = [];
      const slots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
      
      // Randomly decide how many meals they ate that day
      const mealsEaten = i > 0 ? 0 : Math.floor(Math.random() * 3) + 2; // Past days: 2-4 meals. Future days: 0 meals

      for (let m = 0; m < mealsEaten; m++) {
        const slot = slots[m];
        const food = allFoods[Math.floor(Math.random() * allFoods.length)];
        
        // Random amount between 1 and 2
        const amount = 1 + Math.random();
        const kcal = Math.round(food.nutrition.calories * amount);
        const pro = Math.round(food.nutrition.protein_g * amount);
        const carb = Math.round(food.nutrition.carbs_g * amount);
        const fat = Math.round(food.nutrition.fat_g * amount);

        meals.push({
          slot: slot,
          foodItem: food._id,
          amount: Math.round(amount * food.size_g), // grams
          calories: kcal,
          protein: pro,
          carbs: carb,
          fat: fat,
          completed: true,
          time: m === 0 ? '08:00' : m === 1 ? '13:00' : m === 2 ? '19:00' : '16:00'
        });

        totalKcal += kcal;
        totalPro += pro;
        totalCarb += carb;
        totalFat += fat;
      }

      // Random water glasses (0 to 8)
      const water = i > 0 ? 0 : Math.floor(Math.random() * 9);

      logsToCreate.push({
        userId: user._id,
        date: dateString,
        meals: meals,
        totalCalories: totalKcal,
        totalProtein: totalPro,
        totalCarbs: totalCarb,
        totalFat: totalFat,
        waterGlasses: water
      });
    }

    await DailyLog.insertMany(logsToCreate);
    console.log(`Successfully seeded ${logsToCreate.length} DailyLog records!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding logs:', error);
    process.exit(1);
  }
};

seedLogs();
