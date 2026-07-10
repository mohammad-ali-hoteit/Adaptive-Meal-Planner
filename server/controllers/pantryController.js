const Food = require('../models/Food');

// Helper to categorize food based on its highest macro ratio
const categorizeFood = (food) => {
  if (!food.nutrition) return 'other';
  const { protein_g, carbs_g, fat_g } = food.nutrition;
  
  // Calculate calories from each macro
  const proCal = protein_g * 4;
  const carbCal = carbs_g * 4;
  const fatCal = fat_g * 9;
  
  if (proCal >= carbCal && proCal >= fatCal) return 'protein';
  if (carbCal >= proCal && carbCal >= fatCal) return 'carb';
  if (fatCal >= proCal && fatCal >= carbCal) return 'fat';
  
  return 'other';
};

// Helper to calculate exact grams needed to hit a target calorie amount
// formula: (target_kcal / food_kcal_per_100g) * 100
const calculateGrams = (food, targetKcal) => {
  if (food.nutrition.calories === 0) return 100;
  const safeSize = food.size_g || 100;
  return Math.round((targetKcal / food.nutrition.calories) * safeSize);
};

// @desc Generate intelligent combinations from selected ingredients
const generateFromPantry = async (req, res) => {
  try {
    const { ingredientIds, mealTime, targetCalories } = req.body;

    if (!ingredientIds || !Array.isArray(ingredientIds) || ingredientIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide ingredient IDs' });
    }
    if (!mealTime || !targetCalories) {
      return res.status(400).json({ success: false, message: 'Please provide mealTime and targetCalories' });
    }

    // Fetch all foods
    const foods = await Food.find({ _id: { $in: ingredientIds } });

    if (foods.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid ingredients found' });
    }

    // Categorize ingredients
    const categorized = { protein: [], carb: [], fat: [], other: [] };
    foods.forEach(f => {
      categorized[categorizeFood(f)].push(f);
    });

    const targetKcal = Number(targetCalories);
    const slot = mealTime.toLowerCase();
    
    // Define logic patterns based on meal time
    // For breakfast, we want ALL logical combinations. 
    // Logical structures could be: [Pro, Carb, Fat], [Pro, Carb], [Carb, Fat]
    let structures = [];
    if (slot === 'breakfast') {
      structures = [
        { name: 'Balanced', splits: { protein: 0.3, carb: 0.5, fat: 0.2 } },
        { name: 'High Protein', splits: { protein: 0.6, carb: 0.2, fat: 0.2 } },
        { name: 'Carb & Protein', splits: { protein: 0.4, carb: 0.6, fat: 0 } },
        { name: 'Fat & Protein', splits: { protein: 0.5, carb: 0, fat: 0.5 } },
      ];
    } else if (slot === 'snack') {
      structures = [
        { name: 'Protein Snack', splits: { protein: 0.7, carb: 0.3, fat: 0 } },
        { name: 'Carb Snack', splits: { protein: 0.2, carb: 0.6, fat: 0.2 } },
        { name: 'Fat & Protein', splits: { protein: 0.4, carb: 0, fat: 0.6 } }
      ];
    } else {
      // Lunch / Dinner (Optimized high-value combinations)
      structures = [
        { name: 'Standard Balanced', splits: { protein: 0.4, carb: 0.4, fat: 0.2 } },
        { name: 'Lean Body', splits: { protein: 0.5, carb: 0.3, fat: 0.2 } },
        { name: 'Energy Boost', splits: { protein: 0.3, carb: 0.5, fat: 0.2 } }
      ];
    }

    const combinations = [];

    // For each structure, try to build a combination using available categorized foods
    structures.forEach(structure => {
      const splits = structure.splits;
      const mealIngredients = [];
      let totalKcal = 0;
      let totalPro = 0;
      let totalCarb = 0;
      let totalFat = 0;
      let valid = true;

      Object.keys(splits).forEach(macroType => {
        if (splits[macroType] > 0) {
          // Check if we have a food for this category
          const availableFoods = categorized[macroType];
          if (availableFoods && availableFoods.length > 0) {
            // Pick a random or the first one. For "ALL possible", we could iterate, 
            // but picking the first available allows us to present structural variety.
            // Let's just pick one randomly for this generation cycle, 
            // or iterate over all if we want rigorous combinatorics.
            // To keep it simple but diverse, we use a random selection from the category
            const food = availableFoods[Math.floor(Math.random() * availableFoods.length)];
            const kcalForThisFood = targetKcal * splits[macroType];
            const grams = calculateGrams(food, kcalForThisFood);

            const safeSize = food.size_g || 100;
            const ratio = grams / safeSize;
            const actualKcal = Math.round(food.nutrition.calories * ratio);
            const actualPro = Math.round(food.nutrition.protein_g * ratio);
            const actualCarb = Math.round(food.nutrition.carbs_g * ratio);
            const actualFat = Math.round(food.nutrition.fat_g * ratio);

            totalKcal += actualKcal;
            totalPro += actualPro;
            totalCarb += actualCarb;
            totalFat += actualFat;

            mealIngredients.push({
              id: food._id,
              name: food.name.en,
              image: food.image_url,
              grams,
              kcal: actualKcal,
              pro: actualPro,
              carb: actualCarb,
              fat: actualFat
            });
          } else {
            // If a required macro is missing from the pantry, this specific structure is invalid
            valid = false; 
          }
        }
      });

      if (valid && mealIngredients.length > 0) {
        // Build intelligent name
        const sorted = [...mealIngredients].sort((a, b) => b.grams - a.grams);
        let mealName = `${structure.name} Plate`;
        if (sorted.length === 1) mealName = sorted[0].name;
        if (sorted.length === 2) mealName = `${sorted[0].name} & ${sorted[1].name}`;
        if (sorted.length > 2) mealName = `${sorted[0].name}, ${sorted[1].name} & more`;

        combinations.push({
          name: mealName,
          slot: slot.charAt(0).toUpperCase() + slot.slice(1),
          targetKcal,
          totalKcal,
          totalPro,
          totalCarb,
          totalFat,
          ingredients: mealIngredients
        });
      }
    });

    // If no strict structures matched (e.g. user only gave carbs), build a fallback combination
    if (combinations.length === 0 && foods.length > 0) {
      let totalKcal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
      const mealIngredients = [];
      const splitKcal = targetKcal / foods.length;

      foods.forEach(food => {
        const safeSize = food.size_g || 100;
        const grams = calculateGrams(food, splitKcal);
        const ratio = grams / safeSize;
        mealIngredients.push({
          id: food._id,
          name: food.name.en,
          image: food.image_url,
          grams,
          kcal: Math.round(food.nutrition.calories * ratio),
          pro: Math.round(food.nutrition.protein_g * ratio),
          carb: Math.round(food.nutrition.carbs_g * ratio),
          fat: Math.round(food.nutrition.fat_g * ratio)
        });
        totalKcal += Math.round(food.nutrition.calories * ratio);
        totalPro += Math.round(food.nutrition.protein_g * ratio);
        totalCarb += Math.round(food.nutrition.carbs_g * ratio);
        totalFat += Math.round(food.nutrition.fat_g * ratio);
      });

      combinations.push({
        name: 'Pantry Mix',
        slot: slot.charAt(0).toUpperCase() + slot.slice(1),
        targetKcal,
        totalKcal,
        totalPro,
        totalCarb,
        totalFat,
        ingredients: mealIngredients
      });
    }

    res.json({ success: true, combinations });
  } catch (error) {
    console.error('Pantry Generator Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { generateFromPantry };
