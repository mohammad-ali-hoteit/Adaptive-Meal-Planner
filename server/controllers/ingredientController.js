const Ingredient = require('../models/Ingredient');

const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({});
    res.json(ingredients);
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ message: 'Server error while fetching ingredients.' });
  }
};

module.exports = {
  getIngredients
};
