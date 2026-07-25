// ══════════════════════════════════════════════════════════════════
//  ADAPTIVE MEAL PLANNER — TIME SCHEDULE ALGORITHM (ADVANCED)
// ══════════════════════════════════════════════════════════════════

export const ACTIVITY_PROFILES = {
  office: {
      id: 'office',
      label: 'Office Work',
      badge: 'activity-office',
      macroTargets: { carbs: 0.40, protein: 0.30, fat: 0.30 },
      mealMultiplier: { breakfast: 1.0, lunch: 1.0, dinner: 0.9, snack: 1.0 },
      color: '#4fc3f7',
      adjustmentType: 'balanced'
  },
  moderate: {
      id: 'moderate',
      label: 'Moderate Work',
      badge: 'activity-moderate',
      macroTargets: { carbs: 0.48, protein: 0.30, fat: 0.22 },
      mealMultiplier: { breakfast: 1.1, lunch: 1.2, dinner: 0.9, snack: 0.9 },
      color: '#81c784',
      adjustmentType: 'balanced'
  },
  hard: {
      id: 'hard',
      label: 'Hard Physical Work',
      badge: 'activity-hard',
      macroTargets: { carbs: 0.55, protein: 0.30, fat: 0.15 },
      mealMultiplier: { breakfast: 1.2, lunch: 1.3, dinner: 0.8, snack: 0.9 },
      color: '#ffb74d',
      adjustmentType: 'pre-workout'
  },
  study: {
      id: 'study',
      label: 'Study / Mental Work',
      badge: 'activity-study',
      macroTargets: { carbs: 0.45, protein: 0.30, fat: 0.25 },
      mealMultiplier: { breakfast: 1.1, lunch: 0.95, dinner: 0.95, snack: 1.0 },
      color: '#ce93d8',
      adjustmentType: 'balanced'
  },
  gym: {
      id: 'gym',
      label: 'Gym / Training',
      badge: 'activity-gym',
      macroTargets: { carbs: 0.50, protein: 0.32, fat: 0.18 },
      mealMultiplier: { breakfast: 1.0, lunch: 1.2, dinner: 0.9, snack: 1.0 },
      color: '#ef5350',
      adjustmentType: 'pre-workout'
  }
};

export function getActivityProfile(typeId) {
  return ACTIVITY_PROFILES[typeId] || ACTIVITY_PROFILES.office;
}

const MEAL_DURATION = 20; // minutes for main meals
const SNACK_DURATION = 10; // minutes for snacks

// --- HELPERS ---
export function toMinutes(h, m, period) {
  let hours = parseInt(h);
  const mins = parseInt(m);
  if (period === 'AM') {
      if (hours === 12) hours = 0;
  } else {
      if (hours !== 12) hours += 12;
  }
  return hours * 60 + mins;
}

export function toTimeStr(totalMins) {
  totalMins = ((totalMins % 1440) + 1440) % 1440;
  const h24 = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const period = h24 < 12 ? 'AM' : 'PM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function parseTimeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match12) return toMinutes(match12[1], match12[2], match12[3].toUpperCase());
  
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  return 0;
}

export function parseBusyPeriods(busyPeriodsArray) {
  return busyPeriodsArray.map(bp => {
    let sH = parseInt(bp.startTime.split(':')[0]);
    let sM = parseInt(bp.startTime.split(':')[1]);
    let eH = parseInt(bp.endTime.split(':')[0]);
    let eM = parseInt(bp.endTime.split(':')[1]);
    let s = sH * 60 + sM;
    let e = eH * 60 + eM;
    if (e < s) e += 1440;
    return { start: s, end: e, type: bp.type || 'office' };
  }).filter(bp => bp.start < bp.end);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function getFreeIntervals(wakeMin, sleepMin, busyIntervals) {
  const free = [];
  let cursor = wakeMin;
  
  // Clean busy intervals
  let cleanBusy = [];
  for (const bi of busyIntervals) {
      if (bi.start < sleepMin && bi.end > wakeMin) {
          cleanBusy.push({
              start: Math.max(bi.start, wakeMin),
              end: Math.min(bi.end, sleepMin),
              type: bi.type
          });
      }
  }
  cleanBusy.sort((a, b) => a.start - b.start);

  for (const bi of cleanBusy) {
      if (cursor < bi.start) free.push([cursor, bi.start]);
      cursor = Math.max(cursor, bi.end);
  }
  if (cursor < sleepMin) free.push([cursor, sleepMin]);
  return free;
}

function findOptimalMealInterval(idealTime, freeIntervals, beforeTime, afterTime, minGapBefore, minGapAfter, duration) {
  const windowStart = beforeTime + minGapBefore;
  const windowEnd = afterTime - minGapAfter - duration;

  if (windowStart >= windowEnd) return null;

  const validWindows = [];
  for (const [s, e] of freeIntervals) {
      const overlapStart = Math.max(s, windowStart);
      const overlapEnd = Math.min(e, windowEnd);
      if (overlapEnd > overlapStart && (overlapEnd - overlapStart) >= duration) {
          validWindows.push([overlapStart, overlapEnd]);
      }
  }

  if (validWindows.length === 0) return null;

  let bestStart = null;
  let minDistance = Infinity;

  for (const [s, e] of validWindows) {
      const candidate = clamp(idealTime, s, e - duration);
      
      if (idealTime >= s && idealTime <= e - duration) {
          return { start: Math.round(idealTime), end: Math.round(idealTime + duration) };
      }

      const distance = Math.abs(candidate - idealTime);
      if (distance < minDistance) {
          minDistance = distance;
          bestStart = Math.round(candidate);
      }
  }

  if (bestStart === null) return null;
  // Apply 5-minute rounding
  let roundedStart = Math.round(bestStart / 5) * 5;
  
  // ensure rounded still fits
  const fits = validWindows.some(([s, e]) => roundedStart >= s && roundedStart + duration <= e);
  if (!fits) {
    if (bestStart === validWindows[0][0]) roundedStart = Math.ceil(bestStart / 5) * 5;
    else roundedStart = Math.floor(bestStart / 5) * 5;
  }

  return { start: roundedStart, end: Math.round(roundedStart + duration) };
}

function isMealIntervalValid(mealStart, mealEnd, freeIntervals) {
  for (const [s, e] of freeIntervals) {
      if (mealStart >= s && mealEnd <= e) return true;
  }
  return false;
}

// --- MACROS ---
function findActivityBefore(time, activities, windowMinutes) {
  let closest = null;
  let closestDistance = Infinity;
  for (const activity of activities) {
      if (activity.end <= time && activity.end >= time - windowMinutes) {
          const distance = time - activity.end;
          if (distance < closestDistance) {
              closestDistance = distance;
              closest = activity;
          }
      }
  }
  return closest;
}

function findActivityAfter(time, activities, windowMinutes) {
  let closest = null;
  let closestDistance = Infinity;
  for (const activity of activities) {
      if (activity.start >= time && activity.start <= time + windowMinutes) {
          const distance = activity.start - time;
          if (distance < closestDistance) {
              closestDistance = distance;
              closest = activity;
          }
      }
  }
  return closest;
}

function hasLongPhysicalActivity(activities, time, thresholdMinutes) {
  for (const activity of activities) {
      if (activity.type === 'hard' || activity.type === 'moderate' || activity.type === 'gym') {
          const duration = activity.end - activity.start;
          if (duration >= thresholdMinutes) {
              if (time >= activity.start - 60 && time <= activity.end + 60) {
                  return true;
              }
          }
      }
  }
  return false;
}

function calculateAdaptiveMacros(mealType, mealTime, mealCalories, activities, sleepMin, userGoal) {
  let proteinPct = 0.30;
  let carbsPct = 0.45;
  let fatPct = 0.25;
  
  let adjustmentReason = 'Balanced profile';
  let badgeType = 'balanced';

  const activityBefore = findActivityBefore(mealTime, activities, 180);
  const activityAfter = findActivityAfter(mealTime, activities, 180);
  
  const hasGymBefore = activityBefore && (activityBefore.type === 'gym' || activityBefore.type === 'hard');
  const hasGymAfter = activityAfter && (activityAfter.type === 'gym' || activityAfter.type === 'hard');
  const hasMentalBefore = activityBefore && activityBefore.type === 'study';
  
  const timeToSleep = sleepMin - mealTime;
  const isNearSleep = timeToSleep < 180 && timeToSleep > 0;

  if (hasGymBefore) {
      proteinPct = 0.27; carbsPct = 0.58; fatPct = 0.15;
      adjustmentReason = 'Pre-workout: increased carbs for energy';
      badgeType = 'pre-workout';
  }
  else if (hasGymAfter) {
      proteinPct = 0.35; carbsPct = 0.47; fatPct = 0.18;
      adjustmentReason = 'Post-workout: increased protein for recovery';
      badgeType = 'post-workout';
  }
  else if (hasMentalBefore) {
      proteinPct = 0.30; carbsPct = 0.50; fatPct = 0.20;
      adjustmentReason = 'Mental work: slightly more carbs for brain function';
      badgeType = 'mental';
  }
  else if (hasLongPhysicalActivity(activities, mealTime, 120)) {
      proteinPct = 0.32; carbsPct = 0.50; fatPct = 0.18;
      adjustmentReason = 'Physical work period: balanced with more carbs';
      badgeType = 'pre-workout';
  }
  else if (isNearSleep && mealType === 'dinner') {
      proteinPct = 0.35; carbsPct = 0.35; fatPct = 0.30;
      adjustmentReason = 'Pre-sleep: reduced carbs, higher protein and fat';
      badgeType = 'balanced';
  }
  else if (mealType === 'snack') {
      if (hasGymBefore) {
          proteinPct = 0.25; carbsPct = 0.55; fatPct = 0.20;
          adjustmentReason = 'Pre-workout snack: energy boost';
          badgeType = 'pre-workout';
      } else if (hasGymAfter) {
          proteinPct = 0.40; carbsPct = 0.40; fatPct = 0.20;
          adjustmentReason = 'Post-workout snack: recovery';
          badgeType = 'post-workout';
      } else {
          proteinPct = 0.35; carbsPct = 0.40; fatPct = 0.25;
          adjustmentReason = 'Satiety snack: higher protein';
          badgeType = 'balanced';
      }
  }
  
  if (userGoal === 'loss') {
      proteinPct = Math.min(proteinPct + 0.02, 0.40);
      carbsPct = Math.max(carbsPct - 0.03, 0.30);
      fatPct = Math.max(fatPct - 0.01, 0.15);
  } else if (userGoal === 'gain') {
      carbsPct = Math.min(carbsPct + 0.03, 0.60);
      fatPct = Math.max(fatPct - 0.02, 0.15);
  }
  
  const total = proteinPct + carbsPct + fatPct;
  proteinPct = proteinPct / total;
  carbsPct = carbsPct / total;
  fatPct = fatPct / total;
  
  const proteinCal = mealCalories * proteinPct;
  const carbsCal = mealCalories * carbsPct;
  const fatCal = mealCalories * fatPct;
  
  const proteinG = proteinCal / 4;
  const carbsG = carbsCal / 4;
  const fatG = fatCal / 9;
  
  return {
      proteinPct: Math.round(proteinPct * 100),
      carbsPct: Math.round(carbsPct * 100),
      fatPct: Math.round(fatPct * 100),
      proteinG: Math.round(proteinG * 10) / 10,
      carbsG: Math.round(carbsG * 10) / 10,
      fatG: Math.round(fatG * 10) / 10,
      reason: adjustmentReason,
      badge: badgeType
  };
}

// --- CALORIE DISTRIBUTION ---
function distributeCalories(meals, dailyCalories, busyIntervals, sleepMin) {
  const n = meals.length;
  if (n === 0) return [];

  const ranges = {
      breakfast: { min: 0.15, max: 0.35 },
      lunch: { min: 0.25, max: 0.45 },
      dinner: { min: 0.15, max: 0.35 },
      snack: { min: 0.05, max: 0.20 }
  };

  const baseWeights = { breakfast: 0.30, lunch: 0.38, dinner: 0.25, snack: 0.07 };

  let mealWeights = meals.map((meal, index) => {
      const nextTime = index < meals.length - 1 ? meals[index + 1].start : sleepMin;
      let weight = baseWeights[meal.type];

      let upcomingActivity = null;
      let activityDuration = 0;
      for (const bi of busyIntervals) {
          if (bi.start > meal.start && bi.start < nextTime) {
              const overlapStart = Math.max(bi.start, meal.start);
              const overlapEnd = Math.min(bi.end, nextTime);
              if (overlapEnd > overlapStart) {
                  const duration = overlapEnd - overlapStart;
                  if (duration > activityDuration) {
                      activityDuration = duration;
                      upcomingActivity = bi.type;
                  }
              }
          }
      }

      if (upcomingActivity) {
          const profile = getActivityProfile(upcomingActivity);
          const multiplier = profile.mealMultiplier[meal.type] || 1.0;
          weight *= multiplier;
      }

      if (meal.type === 'dinner') {
          const untilSleep = sleepMin - meal.start;
          if (untilSleep < 180) weight *= 0.8;
      }
      if (meal.type === 'lunch') weight *= 1.1;

      return weight;
  });

  const totalWeight = mealWeights.reduce((a, b) => a + b, 0);
  let calories = meals.map((meal, i) => {
      let cal = (mealWeights[i] / totalWeight) * dailyCalories;
      const range = ranges[meal.type];
      const min = dailyCalories * range.min;
      const max = dailyCalories * range.max;
      return Math.round(Math.min(max, Math.max(min, cal)));
  });

  let currentSum = calories.reduce((a, b) => a + b, 0);
  let diff = dailyCalories - currentSum;
  let safety = 0;

  while (diff !== 0 && safety < 200) {
      for (let i = 0; i < calories.length && diff !== 0; i++) {
          const type = meals[i].type;
          const minCal = dailyCalories * ranges[type].min;
          const maxCal = dailyCalories * ranges[type].max;

          if (diff > 0 && calories[i] < maxCal) {
              const increment = Math.min(1, diff);
              calories[i] += increment;
              diff -= increment;
          } else if (diff < 0 && calories[i] > minCal) {
              const decrement = Math.min(1, Math.abs(diff));
              calories[i] -= decrement;
              diff += decrement;
          }
      }
      safety++;
  }

  if (diff !== 0) {
      const lastIdx = calories.length - 1;
      calories[lastIdx] += diff;
      calories[lastIdx] = Math.round(calories[lastIdx]);
  }

  calories = calories.map(c => Math.round(c));

  let finalSum = calories.reduce((a, b) => a + b, 0);
  if (finalSum !== dailyCalories) {
      const lastIdx = calories.length - 1;
      calories[lastIdx] += (dailyCalories - finalSum);
      calories[lastIdx] = Math.round(calories[lastIdx]);
  }

  return calories;
}

// ══════════════════════════════════════════════════════════════════
//  MAIN GENERATOR
// ══════════════════════════════════════════════════════════════════

export function generateMealSchedule(wakeMin, sleepMin, rawBusyIntervals, userMacros, allowSnacks = true, userGoal = 'loss') {
  if (sleepMin < wakeMin) sleepMin += 1440;

  const busyIntervals = rawBusyIntervals.map(bi => {
      let s = bi.start;
      let e = bi.end;
      if (s < wakeMin && s < 12 * 60) s += 1440;
      if (e < wakeMin && e < 12 * 60) e += 1440;
      return { start: s, end: e, type: bi.type || 'office' };
  });

  const freeIntervals = getFreeIntervals(wakeMin, sleepMin, busyIntervals);
  const dailyCalories = userMacros.totalCal || 2000;

  // 1. Breakfast
  const breakfastIdeal = wakeMin + 30;
  const breakfast = findOptimalMealInterval(breakfastIdeal, freeIntervals, wakeMin, sleepMin, 30, 180, MEAL_DURATION)
      || { start: wakeMin + 30, end: wakeMin + 30 + MEAL_DURATION };

  // 2. Dinner
  const dinnerIdeal = sleepMin - 150;
  const dinner = findOptimalMealInterval(dinnerIdeal, freeIntervals, wakeMin, sleepMin, 240, 120, MEAL_DURATION)
      || { start: sleepMin - 150, end: sleepMin - 150 + MEAL_DURATION };

  // 3. Lunch
  const lunchIdeal = Math.round((breakfast.end + dinner.start) / 2);
  const lunch = findOptimalMealInterval(lunchIdeal, freeIntervals, breakfast.end, dinner.start, 120, 120, MEAL_DURATION)
      || { start: lunchIdeal, end: lunchIdeal + MEAL_DURATION };

  // 4. Snacks
  const gapBL = lunch.start - breakfast.end;
  const gapLD = dinner.start - lunch.end;

  const needSnack1 = allowSnacks && gapBL > 5 * 60;
  const needSnack2 = allowSnacks && gapLD > 4.5 * 60;

  let snack1 = null;
  let snack2 = null;

  if (needSnack1) {
      const s1Ideal = Math.round((breakfast.end + lunch.start) / 2);
      snack1 = findOptimalMealInterval(s1Ideal, freeIntervals, breakfast.end, lunch.start, 90, 90, SNACK_DURATION)
          || { start: s1Ideal, end: s1Ideal + SNACK_DURATION };
  }
  if (needSnack2) {
      const s2Ideal = Math.round((lunch.end + dinner.start) / 2);
      snack2 = findOptimalMealInterval(s2Ideal, freeIntervals, lunch.end, dinner.start, 90, 90, SNACK_DURATION)
          || { start: s2Ideal, end: s2Ideal + SNACK_DURATION };
  }

  // 5. Assembly
  const meals = [];
  meals.push({ type: 'breakfast', start: breakfast.start, end: breakfast.end, name: 'Breakfast', icon: '🥞', duration: MEAL_DURATION });
  if (needSnack1 && snack1) meals.push({ type: 'snack', start: snack1.start, end: snack1.end, name: 'Snack', icon: '🍎', duration: SNACK_DURATION });
  meals.push({ type: 'lunch', start: lunch.start, end: lunch.end, name: 'Lunch', icon: '🥗', duration: MEAL_DURATION });
  if (needSnack2 && snack2) meals.push({ type: 'snack', start: snack2.start, end: snack2.end, name: 'Snack', icon: '🥪', duration: SNACK_DURATION });
  meals.push({ type: 'dinner', start: dinner.start, end: dinner.end, name: 'Dinner', icon: '🍲', duration: MEAL_DURATION });

  meals.sort((a, b) => a.start - b.start);

  // 6. Calorie Distribution
  const calories = distributeCalories(meals, dailyCalories, busyIntervals, sleepMin);

  // 7. Adaptive Macros
  meals.forEach((meal, idx) => {
      meal.calories = calories[idx];
      meal.time = meal.start; // for backwards compatibility with UI
      meal.timeStr = toTimeStr(meal.start);

      const macroResult = calculateAdaptiveMacros(meal.type, meal.start, meal.calories, busyIntervals, sleepMin, userGoal);
      meal.macros = {
          pro: macroResult.proteinG,
          carb: macroResult.carbsG,
          fat: macroResult.fatG
      };
      meal.macroPct = {
          pro: macroResult.proteinPct,
          carb: macroResult.carbsPct,
          fat: macroResult.fatPct
      };
      meal.macroReason = macroResult.reason;
      meal.macroBadge = macroResult.badge;
  });

  return { meals, freeIntervals, busyIntervals, wakeMin, sleepMin };
}
