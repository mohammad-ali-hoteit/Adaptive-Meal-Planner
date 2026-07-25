const CustomMeal = require('../models/CustomMeal');

const getMeals = async (req, res) => {
  try {
    const meals = await CustomMeal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, meals });
  } catch (err) {
    console.error('Get meals error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const createMeal = async (req, res) => {
  try {
    const { name, mealType, image, calories, protein, carbs, fat, ingredients } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Meal name is required.' });
    }

    const meal = new CustomMeal({
      userId: req.userId,
      name:   name.trim(),
      mealType: mealType || 'Breakfast',
      image:    image || '',
      calories: calories || 0,
      protein:  protein  || 0,
      carbs:    carbs    || 0,
      fat:      fat      || 0,
      ingredients: ingredients || []
    });

    await meal.save();
    res.status(201).json({ success: true, meal });
  } catch (err) {
    console.error('Create meal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateMeal = async (req, res) => {
  try {
    const meal = await CustomMeal.findOne({ _id: req.params.id, userId: req.userId });
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found.' });
    }

    const { name, mealType, image, calories, protein, carbs, fat, ingredients } = req.body;

    if (name)        meal.name        = name.trim();
    if (mealType)    meal.mealType    = mealType;
    if (image !== undefined) meal.image = image;
    if (calories !== undefined) meal.calories = calories;
    if (protein  !== undefined) meal.protein  = protein;
    if (carbs    !== undefined) meal.carbs    = carbs;
    if (fat      !== undefined) meal.fat      = fat;
    if (ingredients) meal.ingredients = ingredients;

    await meal.save();
    res.json({ success: true, meal });
  } catch (err) {
    console.error('Update meal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteMeal = async (req, res) => {
  try {
    const meal = await CustomMeal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found.' });
    }
    res.json({ success: true, message: 'Meal deleted.' });
  } catch (err) {
    console.error('Delete meal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal
};
