// client/src/utils/optimizer/SingleIngredientSolver.js
import { getStepSize } from './StepGenerator.js';

export function solveSingleIngredient(ingredient, target) {
  let quantity;

  if (ingredient.unit === "piece") {
    if (ingredient.calories <= 0) quantity = 1;
    else quantity = Math.round(target.calories / ingredient.calories);
    quantity = Math.max(1, quantity);
  } else {
    if (ingredient.calories <= 0) quantity = 10;
    else quantity = (target.calories / ingredient.calories) * 100;
    
    const step = getStepSize(ingredient);
    // Round to nearest logical step, but NEVER allow zero.
    quantity = Math.max(step, Math.round(quantity / step) * step);
  }

  return quantity;
}
