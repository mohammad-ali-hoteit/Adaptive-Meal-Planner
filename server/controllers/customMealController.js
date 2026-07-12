const CustomMeal = require('../models/CustomMeal');
const Food = require('../models/Food');

// Helper to calculate macros based on food dataset and grams
const calculateMacros = async (ingredients) => {
  let kcal = 0, pro = 0, carb = 0, fat = 0;
  
  for (const item of ingredients) {
    const food = await Food.findById(item.foodId);
    if (!food) throw new Error(`Food with ID ${item.foodId} not found`);
    
    // If food.size_g is 0 or missing, assume nutrition is per 100g as a fallback, but db should have size_g.
    const baseSize = food.size_g || 100;
    const ratio = item.grams / baseSize;
    
    kcal += food.nutrition.calories * ratio;
    pro += food.nutrition.protein_g * ratio;
    carb += food.nutrition.carbs_g * ratio;
    fat += food.nutrition.fat_g * ratio;
  }
  
  return {
    kcal: Math.round(kcal),
    pro: Math.round(pro),
    carb: Math.round(carb),
    fat: Math.round(fat)
  };
};

// @desc Get all custom meals for a user
const getUserCustomMeals = async (req, res) => {
  try {
    const meals = await CustomMeal.find({ 
      userId: req.user._id,
      $nor: [
        { isPantryGenerated: true },
        { name: { $regex: /^Smart Meal/i } }
      ]
    }).populate('ingredients.foodId', 'name image_url nutrition size_g').sort('-createdAt');
    res.json({ success: true, meals });
  } catch (error) {
    console.error('Error fetching custom meals:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc Create a custom meal
const createCustomMeal = async (req, res) => {
  try {
    const { name, image, ingredients, slot, isPublic, manualMacros, isPantryGenerated } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    let macros = { kcal: 0, pro: 0, carb: 0, fat: 0 };
    if (ingredients && ingredients.length > 0) {
      macros = await calculateMacros(ingredients);
    } else if (manualMacros) {
      macros = {
        kcal: Number(manualMacros.kcal) || 0,
        pro: Number(manualMacros.pro) || 0,
        carb: Number(manualMacros.carb) || 0,
        fat: Number(manualMacros.fat) || 0
      };
    } else {
      return res.status(400).json({ success: false, message: 'Provide ingredients or manual macros' });
    }

    const meal = await CustomMeal.create({
      userId: req.user._id,
      name,
      image: image || '',
      ingredients: ingredients || [],
      slot: slot || 'Lunch',
      ...macros,
      isPublic: isPublic !== undefined ? isPublic : true,
      isPantryGenerated: isPantryGenerated || false
    });

    res.status(201).json({ success: true, meal });
  } catch (error) {
    console.error('Error creating custom meal:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc Get custom meal by ID
const getCustomMealById = async (req, res) => {
  try {
    const meal = await CustomMeal.findById(req.params.id).populate('ingredients.foodId', 'name image_url nutrition size_g');
    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }
    // Verify ownership or public
    if (meal.userId.toString() !== req.user._id.toString() && !meal.isPublic) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, meal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc Update a custom meal
const updateCustomMeal = async (req, res) => {
  try {
    const { name, image, ingredients, slot, isPublic, manualMacros } = req.body;
    
    let meal = await CustomMeal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }
    if (meal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let macros = { kcal: meal.kcal, pro: meal.pro, carb: meal.carb, fat: meal.fat };
    if (ingredients && ingredients.length > 0) {
      macros = await calculateMacros(ingredients);
      meal.ingredients = ingredients;
    } else if (manualMacros) {
      macros = {
        kcal: Number(manualMacros.kcal) || 0,
        pro: Number(manualMacros.pro) || 0,
        carb: Number(manualMacros.carb) || 0,
        fat: Number(manualMacros.fat) || 0
      };
      meal.ingredients = []; // clear ingredients if switching to manual macros
    }

    meal.name = name || meal.name;
    meal.image = image !== undefined ? image : meal.image;
    meal.slot = slot || meal.slot;
    meal.isPublic = isPublic !== undefined ? isPublic : meal.isPublic;
    
    Object.assign(meal, macros);
    
    await meal.save();
    res.json({ success: true, meal });
  } catch (error) {
    console.error('Error updating custom meal:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc Delete a custom meal
const deleteCustomMeal = async (req, res) => {
  try {
    const meal = await CustomMeal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }
    if (meal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await meal.deleteOne();
    res.json({ success: true, message: 'Meal removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getUserCustomMeals, createCustomMeal, getCustomMealById, updateCustomMeal, deleteCustomMeal };
