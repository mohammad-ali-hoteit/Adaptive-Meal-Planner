// ══════════════════════════════════════════════════════════════════
//  ADAPTIVE MEAL PLANNER — TIME SCHEDULE ALGORITHM
// ══════════════════════════════════════════════════════════════════

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
  // Parses "07:00 AM" or "07:00" (24h) into minutes
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
  // Input: [{ label, startTime: "09:00", endTime: "12:00" }, ...]
  // HTML input uses 24h format for time type inputs "09:00"
  return busyPeriodsArray.map(bp => {
    let sH = parseInt(bp.startTime.split(':')[0]);
    let sM = parseInt(bp.startTime.split(':')[1]);
    let eH = parseInt(bp.endTime.split(':')[0]);
    let eM = parseInt(bp.endTime.split(':')[1]);
    return [sH * 60 + sM, eH * 60 + eM];
  }).filter(([s, e]) => s < e); // Basic validation
}

export function getFreeIntervals(wakeMin, sleepMin, busyIntervals) {
  const free = [];
  let cursor = wakeMin;
  
  // Ensure busyIntervals are sorted and don't overlap (basic merge)
  let mergedBusy = [...busyIntervals].sort((a,b) => a[0] - b[0]);
  let cleanBusy = [];
  for (let b of mergedBusy) {
    if (cleanBusy.length === 0) cleanBusy.push(b);
    else {
      let last = cleanBusy[cleanBusy.length - 1];
      if (b[0] <= last[1]) last[1] = Math.max(last[1], b[1]);
      else cleanBusy.push(b);
    }
  }

  for (const [s, e] of cleanBusy) {
    if (cursor < s) free.push([cursor, s]);
    cursor = e;
  }
  if (cursor < sleepMin) free.push([cursor, sleepMin]);
  return free;
}

function findOptimalMealTime(ideal, freeIntervals, afterMin, beforeMin, minGapAfter, minGapBefore) {
  const windowStart = afterMin + minGapAfter;
  const windowEnd = beforeMin - minGapBefore;

  if (windowStart >= windowEnd) {
    return Math.round(ideal);
  }

  const validWindows = [];
  for (const [s, e] of freeIntervals) {
    const overlapStart = Math.max(s, windowStart);
    const overlapEnd = Math.min(e, windowEnd);
    if (overlapEnd > overlapStart) {
      validWindows.push([overlapStart, overlapEnd]);
    }
  }

  if (validWindows.length === 0) {
    return Math.round(ideal); // Fallback if no strict window is valid
  }

  let bestTime = null;
  let minDistance = Infinity;

  for (const [s, e] of validWindows) {
    if (ideal >= s && ideal < e) {
      return Math.round(ideal);
    }
    
    if (ideal < s) {
      const distance = s - ideal;
      if (distance < minDistance) {
        minDistance = distance;
        bestTime = Math.round(s);
      }
    } else if (ideal >= e) {
      const distance = ideal - (e - 1);
      if (distance < minDistance) {
        minDistance = distance;
        bestTime = Math.round(e - 1);
      }
    }
  }
  return bestTime;
}

function calculateCalorieDistribution(meals, sleepMin, totalCal, busyIntervals) {
  const ranges = {
    breakfast: { min: 0.20, max: 0.35 },
    lunch:     { min: 0.30, max: 0.40 },
    dinner:    { min: 0.20, max: 0.30 },
    snack:     { min: 0.08, max: 0.15 }
  };

  const baseWeights = {
    breakfast: 0.30,
    lunch: 0.38,
    dinner: 0.25,
    snack: 0.07
  };

  let scores = meals.map((meal, index) => {
    const nextTime = index < meals.length - 1 ? meals[index + 1].time : sleepMin;
    const gap = nextTime - meal.time;
    let score = baseWeights[meal.type];

    if (gap > 300) score *= 1.15;
    
    if (meal.type === "dinner") {
      const untilSleep = sleepMin - meal.time;
      if (untilSleep < 180) score *= 0.8;
    }

    let busyAfter = 0;
    for (const [s,e] of busyIntervals) {
      if (s > meal.time && s < nextTime) busyAfter += e - s;
    }
    if (busyAfter > 240) score *= 1.15;

    return score;
  });

  const totalScore = scores.reduce((a,b)=>a+b,0);
  let calories = meals.map((meal,i) => {
    let cal = (scores[i] / totalScore) * totalCal;
    const range = ranges[meal.type];
    const min = totalCal * range.min;
    const max = totalCal * range.max;
    return Math.round(Math.min(max, Math.max(min, cal)));
  });

  let diff = totalCal - calories.reduce((a,b)=>a+b,0);
  let safety = 0;

  while(diff !== 0 && safety < 100){
    for(let i=0;i<calories.length;i++){
      const type = meals[i].type;
      const max = totalCal * ranges[type].max;
      if(diff > 0 && calories[i] < max){ calories[i] += 10; diff -= 10; }
      if(diff < 0 && calories[i] > 100){ calories[i] -= 10; diff += 10; }
      if(diff === 0) break;
    }
    safety++;
  }

  return calories;
}

export function generateMealSchedule(wakeMin, sleepMin, busyIntervals, totalCal) {
  const freeIntervals = getFreeIntervals(wakeMin, sleepMin, busyIntervals);

  // Breakfast
  const breakfastIdeal = wakeMin + 45;
  const breakfastTime = findOptimalMealTime(breakfastIdeal, freeIntervals, wakeMin, sleepMin, 30, 180) || breakfastIdeal;

  // Dinner
  const dinnerIdeal = sleepMin - 150;
  const dinnerTime = findOptimalMealTime(dinnerIdeal, freeIntervals, wakeMin, sleepMin, 240, 120) || dinnerIdeal;

  // Lunch
  const lunchIdeal = Math.round((breakfastTime + dinnerTime) / 2);
  const lunchTime = findOptimalMealTime(lunchIdeal, freeIntervals, breakfastTime, dinnerTime, 120, 120) || lunchIdeal;

  const gapBL = lunchTime - breakfastTime;
  const gapLD = dinnerTime - lunchTime;
  const needSnack1 = gapBL > 5 * 60;
  const needSnack2 = gapLD > 4.5 * 60;

  let snack1Time = null;
  let snack2Time = null;

  if (needSnack1) {
    const snack1Ideal = Math.round((breakfastTime + lunchTime) / 2);
    snack1Time = findOptimalMealTime(snack1Ideal, freeIntervals, breakfastTime, lunchTime, 90, 90) || snack1Ideal;
  }

  if (needSnack2) {
    const snack2Ideal = Math.round((lunchTime + dinnerTime) / 2);
    snack2Time = findOptimalMealTime(snack2Ideal, freeIntervals, lunchTime, dinnerTime, 90, 90) || snack2Ideal;
  }

  const meals = [];
  meals.push({ type: 'breakfast', time: breakfastTime, name: 'Breakfast', icon: '🥞' });
  
  if (needSnack1 && snack1Time !== null) {
    meals.push({ type: 'snack', time: snack1Time, name: 'Snack', icon: '🍎' });
  }
  
  meals.push({ type: 'lunch', time: lunchTime, name: 'Lunch', icon: '🥗' });
  
  if (needSnack2 && snack2Time !== null) {
    meals.push({ type: 'snack', time: snack2Time, name: 'Snack', icon: '🥪' });
  }
  
  meals.push({ type: 'dinner', time: dinnerTime, name: 'Dinner', icon: '🍲' });

  meals.sort((a, b) => a.time - b.time);

  const calories = calculateCalorieDistribution(meals, sleepMin, totalCal, busyIntervals);
  meals.forEach((meal, index) => {
    meal.calories = calories[index];
    meal.timeStr = toTimeStr(meal.time);
  });

  return {
    meals,
    freeIntervals,
    busyIntervals,
    wakeMin,
    sleepMin
  };
}
