// client/src/utils/optimizer/StepGenerator.js
import { getDynamicConstraints } from './ConstraintEngine.js';

export function getStepSize(ingredient) {
  if (ingredient.unit === "piece") return 1;

  const cat = ingredient.category;
  switch (cat) {
    case "Condiments & Spices": return 1;
    case "Fats, Oils & Sweeteners": return 5;
    case "Vegetables & Greens":
    case "Fruits": return 15;
    case "Bakery & Manakeesh":
    case "Grains, Cereals & Legumes":
    case "Meats, Poultry & Seafood":
    case "Dairy, Eggs & Cheese": return 10;
    case "Drinks": return 25;
    default: return 10;
  }
}

export function generateQuantitySteps(ingredient, targetCal) {
  const step = getStepSize(ingredient);
  const { min, max } = getDynamicConstraints(ingredient, targetCal, step);
  const steps = [];

  // NO ZERO. Minimum is `min` which is guaranteed >= step (or >= 1 for pieces).
  for (let q = min; q <= max; q += step) {
    steps.push(q);
  }

  if (steps.length === 0 || steps[steps.length - 1] !== max) {
    steps.push(max);
  }

  return steps;
}
