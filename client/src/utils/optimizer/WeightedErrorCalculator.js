// client/src/utils/optimizer/WeightedErrorCalculator.js

// W_PRO > W_CAL/W_CARB > W_FAT according to the prompt
const W_CAL  = 2.0;
const W_PRO  = 3.0;
const W_CARB = 2.0;
const W_FAT  = 1.0;

export function computeWeightedError(actual, target) {
  const EPS = 0.001;
  const calErr  = Math.pow((actual.calories - target.calories) / Math.max(target.calories, EPS), 2);
  const proErr  = Math.pow((actual.protein  - target.protein)  / Math.max(target.protein, EPS),  2);
  const carbErr = Math.pow((actual.carbs    - target.carbs)    / Math.max(target.carbs, EPS),    2);
  const fatErr  = Math.pow((actual.fat      - target.fat)      / Math.max(target.fat, EPS),      2);

  return (W_CAL * calErr) + (W_PRO * proErr) + (W_CARB * carbErr) + (W_FAT * fatErr);
}

export function errorToAccuracy(error) {
  return Math.max(0, Math.min(100, 100 * Math.exp(-error * 2.5)));
}
