import { getMacrosForQuantity } from './NutritionCalculator.js';
import { errorToAccuracy } from './WeightedErrorCalculator.js';

export function formatQuantity(ingredient, quantity) {
  if (ingredient.unit === "piece") {
    const rounded = Math.round(quantity);
    return `${rounded} ${rounded === 1 ? 'piece' : 'pieces'}`;
  }
  const unitLabel = ingredient.unit === "100ml" ? "ml" : "g";
  return `${Math.round(quantity)}${unitLabel}`;
}

export function formatOptimizationResult(mainIngredients, sideIngredients, quantities, macros, error) {
  const allIngredients = [...mainIngredients, ...sideIngredients];
  const mainCount = mainIngredients.length;
  
  const mainPart = [];
  const sideParts = [];

  for (let i = 0; i < allIngredients.length; i++) {
    const ing = allIngredients[i];
    const qty = quantities[i];
    const ingMacros = getMacrosForQuantity(ing, qty);
    
    const entry = {
      ingredient: ing,
      quantity: qty,
      unit: ing.unit,
      macros: ingMacros
    };

    if (i < mainCount) mainPart.push(entry);
    else sideParts.push(entry);
  }

  return {
    totalCalories: macros.calories,
    totalProtein:  macros.protein,
    totalCarbs:    macros.carbs,
    totalFat:      macros.fat,
    accuracy:      errorToAccuracy(error),
    error:         error,
    mainPart,
    sideParts,
    isSingleIngredient: allIngredients.length === 1
  };
}
