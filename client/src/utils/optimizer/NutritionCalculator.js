// client/src/utils/optimizer/NutritionCalculator.js
export function getMacrosForQuantity(ingredient, quantity) {
  if (ingredient.unit === "piece") {
    return {
      calories: (ingredient.calories || 0) * quantity,
      protein:  (ingredient.protein || 0)  * quantity,
      carbs:    (ingredient.carbs || 0)    * quantity,
      fat:      (ingredient.fat || 0)      * quantity
    };
  }

  const factor = quantity / 100;
  return {
    calories: (ingredient.calories || 0) * factor,
    protein:  (ingredient.protein || 0)  * factor,
    carbs:    (ingredient.carbs || 0)    * factor,
    fat:      (ingredient.fat || 0)      * factor
  };
}

export function sumMacros(ingredients, quantities) {
  let calories = 0, protein = 0, carbs = 0, fat = 0;

  for (let i = 0; i < ingredients.length; i++) {
    const m = getMacrosForQuantity(ingredients[i], quantities[i]);
    calories += m.calories;
    protein  += m.protein;
    carbs    += m.carbs;
    fat      += m.fat;
  }

  return { calories, protein, carbs, fat };
}
