import { solveSingleIngredient } from './SingleIngredientSolver.js';
import { optimizeMultiIngredient } from './SearchEngine.js';
import { getMacrosForQuantity, sumMacros } from './NutritionCalculator.js';
import { computeWeightedError } from './WeightedErrorCalculator.js';
import { formatOptimizationResult, formatQuantity } from './OutputFormatter.js';

export { getMacrosForQuantity, formatQuantity };

export function autoBalanceMeal(mainIngredients, sideIngredients, target) {
  if (!mainIngredients || mainIngredients.length === 0) return null;

  const safeTarget = {
    calories: Math.max(target.calories, 50),
    protein:  Math.max(target.protein, 1),
    carbs:    Math.max(target.carbs, 1),
    fat:      Math.max(target.fat, 1)
  };

  const sides = sideIngredients || [];
  const allIngredients = [...mainIngredients, ...sides];
  const n = allIngredients.length;

  if (n === 1) {
    const qty = solveSingleIngredient(allIngredients[0], safeTarget);
    const macros = getMacrosForQuantity(allIngredients[0], qty);
    const error = computeWeightedError(macros, safeTarget);
    return formatOptimizationResult(mainIngredients, sides, [qty], macros, error);
  }

  const { bestQuantities, bestMacros, bestError } = optimizeMultiIngredient(allIngredients, safeTarget);
  return formatOptimizationResult(mainIngredients, sides, bestQuantities, bestMacros, bestError);
}
