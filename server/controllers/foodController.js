const Food = require('../models/Food');

// @desc    Get all foods (with optional mealType filter + pagination)
// @route   GET /api/foods?mealType=breakfast&page=1&limit=40
const getAllFoods = async (req, res, next) => {
  try {
    const { mealType, page = 1, limit = 40 } = req.query;
    const query = {};

    if (mealType && mealType !== 'all') {
      query.meal_type = mealType;
    }

    const foods = await Food.find(query)
      .sort({ 'name.en': 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Food.countDocuments(query);

    res.json({
      success: true,
      foods,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search foods by name (English or Arabic)
// @route   GET /api/foods/search?q=chicken
const searchFoods = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, foods: [] });
    }

    const trimmed = q.trim();
    const foods = await Food.find({
      $or: [
        { 'name.en': { $regex: trimmed, $options: 'i' } },
        { 'name.ar': { $regex: trimmed, $options: 'i' } },
      ],
    })
      .sort({ 'name.en': 1 })
      .limit(30);

    res.json({ success: true, foods });
  } catch (err) {
    next(err);
  }
};

// @desc    Get suggested foods
// @route   GET /api/foods/suggestions
const getSuggestedFoods = async (req, res, next) => {
  try {
    const foods = await Food.find().limit(8);
    res.json({ success: true, foods });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single food by ID
// @route   GET /api/foods/:id
const getFoodById = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      res.status(404);
      throw new Error('Food not found');
    }
    res.json({ success: true, food });
  } catch (err) {
    next(err);
  }
};

// @desc    Add food to daily log (placeholder)
// @route   POST /api/foods/add-to-day
const addFoodToDay = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'Not implemented yet' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllFoods, searchFoods, getSuggestedFoods, getFoodById, addFoodToDay };
