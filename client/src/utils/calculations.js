export const navyBodyFatMale = (height, waist, neck) => {
  return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
};

export const navyBodyFatFemale = (height, waist, hip, neck) => {
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
};

export const heymsfieldMuscleMale = (weight, height, age, waist) => {
  const heightM = height / 100;
  return 0.244 * weight + 7.80 * heightM + 6.6 - 0.098 * age - 3.3; 
};

export const heymsfieldMuscleFemale = (weight, height, age, waist) => {
  const heightM = height / 100;
  return 0.244 * weight + 7.80 * heightM - 0.098 * age - 3.3; 
};

export const fatNormsByAge = {
  male: {
    '18-29': { very_low: { min: 0, max: 8 }, low: { min: 8.1, max: 14 }, normal: { min: 14.1, max: 20 }, high: { min: 20.1, max: 24 }, very_high: { min: 24.1, max: 100 } },
    '30-39': { very_low: { min: 0, max: 11 }, low: { min: 11.1, max: 17 }, normal: { min: 17.1, max: 23 }, high: { min: 23.1, max: 27 }, very_high: { min: 27.1, max: 100 } },
    '40-49': { very_low: { min: 0, max: 13 }, low: { min: 13.1, max: 19 }, normal: { min: 19.1, max: 25 }, high: { min: 25.1, max: 29 }, very_high: { min: 29.1, max: 100 } },
    '50+': { very_low: { min: 0, max: 15 }, low: { min: 15.1, max: 21 }, normal: { min: 21.1, max: 27 }, high: { min: 27.1, max: 31 }, very_high: { min: 31.1, max: 100 } },
  },
  female: {
    '18-29': { very_low: { min: 0, max: 14 }, low: { min: 14.1, max: 20 }, normal: { min: 20.1, max: 28 }, high: { min: 28.1, max: 32 }, very_high: { min: 32.1, max: 100 } },
    '30-39': { very_low: { min: 0, max: 15 }, low: { min: 15.1, max: 21 }, normal: { min: 21.1, max: 29 }, high: { min: 29.1, max: 33 }, very_high: { min: 33.1, max: 100 } },
    '40-49': { very_low: { min: 0, max: 17 }, low: { min: 17.1, max: 23 }, normal: { min: 23.1, max: 31 }, high: { min: 31.1, max: 35 }, very_high: { min: 35.1, max: 100 } },
    '50+': { very_low: { min: 0, max: 18 }, low: { min: 18.1, max: 25 }, normal: { min: 25.1, max: 33 }, high: { min: 33.1, max: 37 }, very_high: { min: 37.1, max: 100 } },
  }
};

export const smmiNormsByAge = {
  male: {
    '18-29': { very_low: { min: 0, max: 10.5 }, low: { min: 10.6, max: 11.5 }, normal: { min: 11.6, max: 13.5 }, high: { min: 13.6, max: 15.0 }, very_high: { min: 15.1, max: 100 } },
    '30-39': { very_low: { min: 0, max: 10.0 }, low: { min: 10.1, max: 11.0 }, normal: { min: 11.1, max: 13.0 }, high: { min: 13.1, max: 14.5 }, very_high: { min: 14.6, max: 100 } },
    '40-49': { very_low: { min: 0, max: 9.5 }, low: { min: 9.6, max: 10.5 }, normal: { min: 10.6, max: 12.5 }, high: { min: 12.6, max: 14.0 }, very_high: { min: 14.1, max: 100 } },
    '50+': { very_low: { min: 0, max: 9.0 }, low: { min: 9.1, max: 10.0 }, normal: { min: 10.1, max: 12.0 }, high: { min: 12.1, max: 13.5 }, very_high: { min: 13.6, max: 100 } },
  },
  female: {
    '18-29': { very_low: { min: 0, max: 7.5 }, low: { min: 7.6, max: 8.5 }, normal: { min: 8.6, max: 10.0 }, high: { min: 10.1, max: 11.5 }, very_high: { min: 11.6, max: 100 } },
    '30-39': { very_low: { min: 0, max: 7.0 }, low: { min: 7.1, max: 8.0 }, normal: { min: 8.1, max: 9.5 }, high: { min: 9.6, max: 11.0 }, very_high: { min: 11.1, max: 100 } },
    '40-49': { very_low: { min: 0, max: 6.5 }, low: { min: 6.6, max: 7.5 }, normal: { min: 7.6, max: 9.0 }, high: { min: 9.1, max: 10.5 }, very_high: { min: 10.6, max: 100 } },
    '50+': { very_low: { min: 0, max: 6.0 }, low: { min: 6.1, max: 7.0 }, normal: { min: 7.1, max: 8.5 }, high: { min: 8.6, max: 10.0 }, very_high: { min: 10.1, max: 100 } },
  }
};

export const getAgeGroup = (age) => {
  if (age < 30) return '18-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  return '50+';
};

export const getFatStatus = (bf, norms) => {
  if (bf <= norms.very_low.max) return 'very_low';
  if (bf <= norms.low.max) return 'low';
  if (bf <= norms.normal.max) return 'normal';
  if (bf <= norms.high.max) return 'high';
  return 'very_high';
};

export const getMuscleStatus = (smmi, norms) => {
  if (smmi <= norms.very_low.max) return 'very_low';
  if (smmi <= norms.low.max) return 'low';
  if (smmi <= norms.normal.max) return 'normal';
  if (smmi <= norms.high.max) return 'high';
  return 'very_high';
};

export const STRATEGY_GOALS = {
  FAT_LOSS: 'FAT_LOSS',
  BODY_RECOMPOSITION: 'BODY_RECOMPOSITION',
  CONTROLLED_BULK: 'CONTROLLED_BULK',
  MAINTENANCE: 'MAINTENANCE'
};

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
};

export const getAllowedFatTargets = (norms) => [
  { id: 'low', label: 'Athletic / Low', min: norms.low.min, max: norms.low.max },
  { id: 'normal', label: 'Healthy Normal', min: norms.normal.min, max: norms.normal.max }
];

export const getAllowedMuscleTargets = (currentStatus, norms) => {
  return [
    { id: 'normal', label: 'Healthy Muscle', min: norms.normal.min, max: norms.normal.max },
    { id: 'high', label: 'High Muscularity', min: norms.high.min, max: norms.high.max }
  ];
};

export const smmiToKg = (smmi, heightCm) => {
  const heightM = heightCm / 100;
  return smmi * (heightM * heightM);
};

export const determineGoalStrategy = (fatDelta, muscleDelta) => {
  if (fatDelta < -1) return STRATEGY_GOALS.FAT_LOSS;
  if (fatDelta >= -1 && fatDelta <= 1 && muscleDelta > 1) return STRATEGY_GOALS.CONTROLLED_BULK;
  if (fatDelta <= 0 && muscleDelta > 0) return STRATEGY_GOALS.BODY_RECOMPOSITION;
  return STRATEGY_GOALS.MAINTENANCE;
};

export const calculateTargetWeight = (currentLeanMass, muscleDelta, targetFatPercent) => {
  const newLeanMass = currentLeanMass + muscleDelta;
  return newLeanMass / (1 - (targetFatPercent / 100));
};

export const calculateTargetCalories = (strategy, lossRateKg, tdee, bmr) => {
  if (strategy === STRATEGY_GOALS.FAT_LOSS) {
    const dailyDeficit = (lossRateKg * 7700) / 7;
    return Math.max(bmr, tdee - dailyDeficit);
  }
  if (strategy === STRATEGY_GOALS.CONTROLLED_BULK) return tdee + 300;
  if (strategy === STRATEGY_GOALS.BODY_RECOMPOSITION) return tdee - 200;
  return tdee;
};

export const calculateMacronutrients = (calories, leanMass, tdee) => {
  const gProtein = leanMass * 2.2;
  const pCals = gProtein * 4;
  const fCals = calories * 0.25;
  const gFat = fCals / 9;
  const cCals = calories - pCals - fCals;
  const gCarbs = cCals > 0 ? cCals / 4 : 0;
  return {
    gProtein, gFat, gCarbs,
    pPct: Math.round((pCals / calories) * 100),
    lPct: Math.round((fCals / calories) * 100),
    cPct: cCals > 0 ? Math.round((cCals / calories) * 100) : 0
  };
};
