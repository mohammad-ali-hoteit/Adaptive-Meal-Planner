// client/src/utils/calculations.js

// ==========================================
// 1. EXACT MATHEMATICAL FORMULAS
// ==========================================

export function navyBodyFatMale(height, waist, neck) {
    if (waist - neck <= 0) return 5.0;
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
}

export function navyBodyFatFemale(height, waist, hip, neck) {
    if ((waist + hip - neck) <= 0) return 12.0;
    return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
}

export function heymsfieldMuscleMale(weight, height, age, waist, R = 0) {
    return 0.47 * weight + 0.03 * height + 0.012 * age - 0.001 * Math.pow(age, 2) - 0.29 * waist + 1.6 * R + 13.5;
}

export function heymsfieldMuscleFemale(weight, height, age, waist, R = 0) {
    return 0.26 * weight + 0.07 * height - 0.098 * age + 0.0004 * Math.pow(age, 2) - 0.14 * waist + 1.2 * R + 4.9;
}

// ==========================================
// 2. CONSTANTS & NORMS
// ==========================================

export const fatNormsByAge = {
    male: {
        "18-24": { very_low: { max: 6.0 },  low: { min: 6.1,  max: 10.0 }, normal: { min: 10.1, max: 18.0 }, high: { min: 18.1, max: 22.0 }, very_high: { min: 22.1 } },
        "25-34": { very_low: { max: 8.0 },  low: { min: 8.1,  max: 13.0 }, normal: { min: 13.1, max: 21.0 }, high: { min: 21.1, max: 25.0 }, very_high: { min: 25.1 } },
        "35-44": { very_low: { max: 10.0 }, low: { min: 10.1, max: 16.0 }, normal: { min: 16.1, max: 23.0 }, high: { min: 23.1, max: 27.0 }, very_high: { min: 27.1 } },
        "45-54": { very_low: { max: 12.0 }, low: { min: 12.1, max: 18.0 }, normal: { min: 18.1, max: 25.0 }, high: { min: 25.1, max: 29.0 }, very_high: { min: 29.1 } },
        "55-64": { very_low: { max: 14.0 }, low: { min: 14.1, max: 20.0 }, normal: { min: 20.1, max: 26.0 }, high: { min: 26.1, max: 30.0 }, very_high: { min: 30.1 } },
        "65+"  : { very_low: { max: 15.0 }, low: { min: 15.1, max: 22.0 }, normal: { min: 22.1, max: 28.0 }, high: { min: 28.1, max: 32.0 }, very_high: { min: 32.1 } }
    },
    female: {
        "18-24": { very_low: { max: 13.0 }, low: { min: 13.1, max: 17.0 }, normal: { min: 17.1, max: 25.0 }, high: { min: 25.1, max: 29.0 }, very_high: { min: 29.1 } },
        "25-34": { very_low: { max: 14.0 }, low: { min: 14.1, max: 20.0 }, normal: { min: 20.1, max: 28.0 }, high: { min: 28.1, max: 33.0 }, very_high: { min: 33.1 } },
        "35-44": { very_low: { max: 16.0 }, low: { min: 16.1, max: 22.0 }, normal: { min: 22.1, max: 30.0 }, high: { min: 30.1, max: 35.0 }, very_high: { min: 35.1 } },
        "45-54": { very_low: { max: 18.0 }, low: { min: 18.1, max: 24.0 }, normal: { min: 24.1, max: 32.0 }, high: { min: 32.1, max: 37.0 }, very_high: { min: 37.1 } },
        "55-64": { very_low: { max: 20.0 }, low: { min: 20.1, max: 26.0 }, normal: { min: 26.1, max: 34.0 }, high: { min: 34.1, max: 39.0 }, very_high: { min: 39.1 } },
        "65+"  : { very_low: { max: 21.0 }, low: { min: 21.1, max: 28.0 }, normal: { min: 28.1, max: 36.0 }, high: { min: 36.1, max: 41.0 }, very_high: { min: 41.1 } }
    }
};

export const smmiNormsByAge = {
    male: {
        "18-24": { very_low: { max: 7.5 }, low: { min: 7.6,  max: 9.0 },  normal: { min: 9.1,  max: 11.5 }, high: { min: 11.6, max: 13.5 }, very_high: { min: 13.6 } },
        "25-34": { very_low: { max: 7.5 }, low: { min: 7.6,  max: 9.0 },  normal: { min: 9.1,  max: 11.5 }, high: { min: 11.6, max: 13.5 }, very_high: { min: 13.6 } },
        "35-44": { very_low: { max: 7.3 }, low: { min: 7.4,  max: 8.8 },  normal: { min: 8.9,  max: 11.3 }, high: { min: 11.4, max: 13.2 }, very_high: { min: 13.3 } },
        "45-54": { very_low: { max: 7.0 }, low: { min: 7.1,  max: 8.5 },  normal: { min: 8.6,  max: 11.0 }, high: { min: 11.1, max: 12.8 }, very_high: { min: 12.9 } },
        "55-64": { very_low: { max: 6.7 }, low: { min: 6.8,  max: 8.2 },  normal: { min: 8.3,  max: 10.5 }, high: { min: 10.6, max: 12.3 }, very_high: { min: 12.4 } },
        "65+"  : { very_low: { max: 6.4 }, low: { min: 6.5,  max: 7.8 },  normal: { min: 7.9,  max: 10.0 }, high: { min: 10.1, max: 11.8 }, very_high: { min: 11.9 } }
    },
    female: {
        "18-24": { very_low: { max: 5.6 }, low: { min: 5.7,  max: 6.7 },  normal: { min: 6.8,  max: 8.7 },  high: { min: 8.8,  max: 10.2 }, very_high: { min: 10.3 } },
        "25-34": { very_low: { max: 5.6 }, low: { min: 5.7,  max: 6.7 },  normal: { min: 6.8,  max: 8.7 },  high: { min: 8.8,  max: 10.2 }, very_high: { min: 10.3 } },
        "35-44": { very_low: { max: 5.4 }, low: { min: 5.5,  max: 6.5 },  normal: { min: 6.6,  max: 8.4 },  high: { min: 8.5,  max: 9.9 },  very_high: { min: 10.0 } },
        "45-54": { very_low: { max: 5.2 }, low: { min: 5.3,  max: 6.2 },  normal: { min: 6.3,  max: 8.1 },  high: { min: 8.2,  max: 9.5 },  very_high: { min: 9.6 } },
        "55-64": { very_low: { max: 4.9 }, low: { min: 5.0,  max: 5.9 },  normal: { min: 6.0,  max: 7.7 },  high: { min: 7.8,  max: 9.1 },  very_high: { min: 9.2 } },
        "65+"  : { very_low: { max: 4.6 }, low: { min: 4.7,  max: 5.5 },  normal: { min: 5.6,  max: 7.3 },  high: { min: 7.4,  max: 8.6 },  very_high: { min: 8.7 } }
    }
};

export const PHYSIOLOGICAL_LIMITS = {
    MAX_SMMI_MALE: 15.0,       
    MAX_SMMI_FEMALE: 11.5,     
    ABS_MIN_FAT_PERCENT: 3.0,  
    MIN_BRAIN_CARBS_G: 30.0,   
    ANABOLIC_EFFICIENCY: 0.8,  
    KCAL_PER_KG_FAT: 7700.0,   
    DAYS_PER_WEEK: 7.0         
};

export const MACRO_COEFFICIENTS = {
    PROTEIN_CUT: 2.5,          
    PROTEIN_BULK: 2.0,         
    PROTEIN_DEFAULT: 2.2,      
    
    FAT_STANDARD: 0.9,         
    FAT_LOW_LIMIT: 0.7,        
    
    KCAL_PER_GRAM_PROT: 4,     
    KCAL_PER_GRAM_FAT: 9,      
    KCAL_PER_GRAM_CARB: 4      
};

export const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
};

export const ENERGY_STRATEGIES = {
    BULK_SURPLUS_KCAL: 300,    
    RECOMP_DEFICIT_PCT: 0.05   
};

export const STRATEGY_GOALS = {
    MAINTENANCE: "MAINTENANCE",
    FAT_LOSS: "FAT_LOSS",
    BODY_RECOMPOSITION: "BODY_RECOMPOSITION",
    CONTROLLED_BULK: "CONTROLLED_BULK"
};

// ==========================================
// 3. HELPERS
// ==========================================

export function getAllowedFatTargets(fNorms) {
    // You can only target Low (Athletic) or Normal (Healthy).
    return [
       { id: 'low', label: 'Athletic / Low', min: fNorms.low.min, max: fNorms.low.max },
       { id: 'normal', label: 'Healthy Normal', min: fNorms.normal.min, max: fNorms.normal.max }
    ];
}

export function getAllowedMuscleTargets(currentMuscleStatus, mNorms) {
    const levels = ['very_low', 'low', 'normal', 'high', 'very_high'];
    const currentIndex = levels.indexOf(currentMuscleStatus);
    // You can never decrease muscle. If you are very_low(0) or low(1), you must target at least normal(2).
    const minTargetIndex = Math.max(2, currentIndex); 
    
    const allowed = [];
    if (minTargetIndex <= 2) allowed.push({ id: 'normal', label: 'Normal Muscle', min: mNorms.normal.min, max: mNorms.normal.max });
    if (minTargetIndex <= 3) allowed.push({ id: 'high', label: 'High Muscle', min: mNorms.high.min, max: mNorms.high.max });
    if (minTargetIndex <= 4) allowed.push({ id: 'very_high', label: 'Very High Muscle', min: mNorms.very_high.min, max: mNorms.very_high.min + 2.0 }); // Add arbitrary max for very high
    
    return allowed;
}

export function smmiToKg(smmi, heightCm) {
    const hMeters = heightCm / 100;
    return smmi * (hMeters * hMeters);
}

export function getAgeGroup(age) {
    if (age >= 18 && age <= 24) return "18-24";
    if (age >= 25 && age <= 34) return "25-34";
    if (age >= 35 && age <= 44) return "35-44";
    if (age >= 45 && age <= 54) return "45-54";
    if (age >= 55 && age <= 64) return "55-64";
    if (age >= 65) return "65+";
    return "25-34"; 
}

export function getFatStatus(bf, norms) {
    if (bf <= norms.very_low.max) return "very_low";
    if (bf <= norms.low.max) return "low";
    if (bf <= norms.normal.max) return "normal";
    if (bf <= norms.high.max) return "high";
    return "very_high";
}

export function getMuscleStatus(smmi, norms) {
    if (smmi <= norms.very_low.max) return "very_low";
    if (smmi <= norms.low.max) return "low";
    if (smmi <= norms.normal.max) return "normal";
    if (smmi <= norms.high.max) return "high";
    return "very_high";
}

export function determineGoalStrategy(fatDelta, muscleDelta) {
    if (fatDelta < -0.5) return STRATEGY_GOALS.FAT_LOSS;
    if (muscleDelta > 0.5 && Math.abs(fatDelta) <= 1.0) return STRATEGY_GOALS.BODY_RECOMPOSITION;
    if (muscleDelta > 0.5 && fatDelta > 0.5) return STRATEGY_GOALS.CONTROLLED_BULK;
    return STRATEGY_GOALS.MAINTENANCE;
}

export function calculateTargetWeight(currentLeanMass, muscleDelta, targetBF) {
    const dynamicAnabolicGain = muscleDelta > 0 ? muscleDelta * PHYSIOLOGICAL_LIMITS.ANABOLIC_EFFICIENCY : muscleDelta;
    const estimatedFinalLeanMass = currentLeanMass + dynamicAnabolicGain;
    return estimatedFinalLeanMass / (1.0 - (targetBF / 100.0));
}

export function calculateTargetCalories(strategy, lossRate, tdee, bmr) {
    let calories = tdee;
    switch(strategy) {
        case STRATEGY_GOALS.FAT_LOSS:
            const deficit = lossRate * (PHYSIOLOGICAL_LIMITS.KCAL_PER_KG_FAT / PHYSIOLOGICAL_LIMITS.DAYS_PER_WEEK);
            calories = tdee - deficit;
            break;
        case STRATEGY_GOALS.BODY_RECOMPOSITION:
            calories = tdee * (1.0 - ENERGY_STRATEGIES.RECOMP_DEFICIT_PCT);
            break;
        case STRATEGY_GOALS.CONTROLLED_BULK:
            calories = tdee + ENERGY_STRATEGIES.BULK_SURPLUS_KCAL;
            break;
        default:
            calories = tdee;
            break;
    }
    if (calories < bmr) {
        calories = bmr;
    }
    return calories;
}

export function calculateMacronutrients(dailyCalories, currentLeanMassKg, tdee) {
    let proteinFactor = MACRO_COEFFICIENTS.PROTEIN_DEFAULT;
    if (dailyCalories < tdee) proteinFactor = MACRO_COEFFICIENTS.PROTEIN_CUT;
    if (dailyCalories > tdee) proteinFactor = MACRO_COEFFICIENTS.PROTEIN_BULK;

    let gProtein = currentLeanMassKg * proteinFactor;
    let gFat = currentLeanMassKg * MACRO_COEFFICIENTS.FAT_STANDARD;

    let proteinCalories = gProtein * MACRO_COEFFICIENTS.KCAL_PER_GRAM_PROT;
    let fatCalories = gFat * MACRO_COEFFICIENTS.KCAL_PER_GRAM_FAT;
    let remainingCalories = dailyCalories - (proteinCalories + fatCalories);

    if (remainingCalories < 0) {
        gFat = currentLeanMassKg * MACRO_COEFFICIENTS.FAT_LOW_LIMIT;
        fatCalories = gFat * MACRO_COEFFICIENTS.KCAL_PER_GRAM_FAT;
        remainingCalories = dailyCalories - (proteinCalories + fatCalories);
    }

    let gCarbs = remainingCalories / MACRO_COEFFICIENTS.KCAL_PER_GRAM_CARB;
    if (gCarbs < PHYSIOLOGICAL_LIMITS.MIN_BRAIN_CARBS_G) {
        gCarbs = PHYSIOLOGICAL_LIMITS.MIN_BRAIN_CARBS_G;
    }

    const totalCalcKcal = (gProtein * MACRO_COEFFICIENTS.KCAL_PER_GRAM_PROT) + 
                         (gFat * MACRO_COEFFICIENTS.KCAL_PER_GRAM_FAT) + 
                         (gCarbs * MACRO_COEFFICIENTS.KCAL_PER_GRAM_CARB);

    const pPct = Math.round(((gProtein * MACRO_COEFFICIENTS.KCAL_PER_GRAM_PROT) / totalCalcKcal) * 100);
    const lPct = Math.round(((gFat * MACRO_COEFFICIENTS.KCAL_PER_GRAM_FAT) / totalCalcKcal) * 100);
    const cPct = 100 - pPct - lPct;

    return { gProtein, gFat, gCarbs, pPct, lPct, cPct };
}
