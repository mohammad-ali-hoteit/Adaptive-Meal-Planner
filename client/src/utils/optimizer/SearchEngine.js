// client/src/utils/optimizer/SearchEngine.js
import { generateQuantitySteps } from './StepGenerator.js';
import { sumMacros } from './NutritionCalculator.js';
import { computeWeightedError } from './WeightedErrorCalculator.js';

function findClosestStep(steps, target) {
  let closest = steps[0];
  let minDiff = Math.abs(target - closest);
  for (const s of steps) {
    const diff = Math.abs(target - s);
    if (diff < minDiff) { 
      minDiff = diff; 
      closest = s; 
    }
  }
  return closest;
}

export function optimizeMultiIngredient(ingredients, target) {
  const n = ingredients.length;
  const allSteps = ingredients.map(ing => generateQuantitySteps(ing, target.calories));

  // 1. Initialize quantities using proportional target sharing
  // We give each ingredient an equal share of the calories to start.
  let currentQuantities = ingredients.map((ing, i) => {
    const steps = allSteps[i];
    const calorieShare = target.calories / n;
    
    if (ing.calories <= 0) return steps[0];
    
    let idealQty = ing.unit === "piece" 
      ? calorieShare / ing.calories 
      : (calorieShare / ing.calories) * 100;
      
    return findClosestStep(steps, idealQty);
  });

  // 2. Multidimensional Coordinate Descent
  // Iteratively optimize one dimension (ingredient quantity) while holding others fixed.
  for (let pass = 0; pass < 8; pass++) {
    let improved = false;
    
    for (let i = 0; i < n; i++) {
      let bestQ = currentQuantities[i];
      let bestLocalError = computeWeightedError(sumMacros(ingredients, currentQuantities), target);

      for (const candidateQ of allSteps[i]) {
        // Skip checking the same quantity
        if (candidateQ === currentQuantities[i]) continue;
        
        const testQuantities = [...currentQuantities];
        testQuantities[i] = candidateQ;
        const macros = sumMacros(ingredients, testQuantities);
        
        // Dynamic Branch Pruning: if this single coordinate change blows calories 
        // completely out of proportion (>150% target), skip it.
        if (macros.calories > target.calories * 1.5) continue;

        const error = computeWeightedError(macros, target);
        if (error < bestLocalError) {
          bestLocalError = error;
          bestQ = candidateQ;
          improved = true;
        }
      }
      currentQuantities[i] = bestQ;
    }
    
    // Early stopping: if a full pass across all ingredients yielded no improvements,
    // we have found the local minima.
    if (!improved) break;
  }

  const bestQuantities = currentQuantities;
  const bestMacros = sumMacros(ingredients, bestQuantities);
  const bestError = computeWeightedError(bestMacros, target);

  return { bestQuantities, bestMacros, bestError };
}
