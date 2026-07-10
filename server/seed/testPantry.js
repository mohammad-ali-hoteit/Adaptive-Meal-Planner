const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Food = require('../models/Food');
const { generateFromPantry } = require('../controllers/pantryController');

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nutrisync');
  
  // Pick a couple of foods
  const foods = await Food.find().limit(3);
  const ingredientIds = foods.map(f => f._id.toString());
  
  console.log('Testing with IDs:', ingredientIds);

  const req = {
    body: {
      ingredientIds,
      mealTime: 'breakfast',
      targetCalories: 500
    }
  };

  const res = {
    status: (code) => {
      console.log('STATUS:', code);
      return res;
    },
    json: (data) => {
      console.log('JSON RESULT:', JSON.stringify(data, null, 2));
    }
  };

  try {
    await generateFromPantry(req, res);
  } catch (err) {
    console.error('FATAL ERROR:', err);
  }
  process.exit();
};

test();
