// client/src/utils/optimizer/ConstraintEngine.js
const REFERENCE_CAL = 600;

export function getDynamicConstraints(ingredient, targetCal, step) {
  const scale = Math.max(0.3, targetCal / REFERENCE_CAL);

  if (ingredient.unit === "piece") {
    return {
      min: Math.max(1, Math.round((ingredient.min_limit || 1) * Math.min(scale, 2))),
      max: Math.max(1, Math.round((ingredient.max_limit || 5) * Math.min(scale, 3))),
    };
  }

  // Scale limits, but NEVER allow 0. Minimum must be at least one step size!
  const scaledMin = Math.max(step, Math.round((ingredient.min_limit || 10) * scale));
  const scaledMax = Math.max(scaledMin + step, Math.round((ingredient.max_limit || 200) * scale));

  // Ensure scaledMin aligns with step
  const alignedMin = Math.ceil(scaledMin / step) * step;
  const alignedMax = Math.floor(scaledMax / step) * step;

  return { 
    min: Math.max(step, alignedMin), 
    max: Math.max(Math.max(step, alignedMin), alignedMax) 
  };
}
