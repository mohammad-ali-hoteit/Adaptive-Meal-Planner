export const ROLES = {
  MAIN_PROTEIN: "Main Protein",
  CARB: "Carb Source",
  FAT: "Healthy Fat",
  VEG: "Vegetable/Fiber",
  DAIRY: "Dairy",
  FRUIT: "Fruit",
  SIDE: "Side",
  DRINK: "Drink",
  SWEET: "Sweet Component"
};

const CATEGORY_COMPAT = {
  "protein|protein": 70,   "protein|bakery": 90,        "protein|dairy": 95,
  "protein|legumes": 60,   "protein|sweet_spreads": 20, "protein|side": 80,
  "protein|vegetables": 85,"protein|healthy_fats": 75,  "protein|fruit": 30,
  "protein|milk_drinks": 55,"protein|oats": 65,

  "bakery|bakery": 50,     "bakery|dairy": 88,          "bakery|legumes": 70,
  "bakery|sweet_spreads": 90,"bakery|side": 80,         "bakery|vegetables": 75,
  "bakery|healthy_fats": 80,"bakery|fruit": 60,         "bakery|milk_drinks": 70,
  "bakery|oats": 55,

  "dairy|dairy": 60,       "dairy|legumes": 65,         "dairy|sweet_spreads": 55,
  "dairy|side": 75,        "dairy|vegetables": 80,      "dairy|healthy_fats": 70,
  "dairy|fruit": 75,       "dairy|milk_drinks": 60,     "dairy|oats": 85,

  "legumes|legumes": 50,   "legumes|sweet_spreads": 15, "legumes|side": 75,
  "legumes|vegetables": 85,"legumes|healthy_fats": 65,  "legumes|fruit": 20,
  "legumes|milk_drinks": 30,"legumes|oats": 40,

  "sweet_spreads|sweet_spreads": 50,"sweet_spreads|side": 20,
  "sweet_spreads|vegetables": 15,"sweet_spreads|healthy_fats": 40,
  "sweet_spreads|fruit": 80,"sweet_spreads|milk_drinks": 65,"sweet_spreads|oats": 85,

  "side|side": 55,         "side|vegetables": 80,       "side|healthy_fats": 70,
  "side|fruit": 25,        "side|milk_drinks": 40,      "side|oats": 35,

  "vegetables|vegetables": 60,"vegetables|healthy_fats": 85,"vegetables|fruit": 30,
  "vegetables|milk_drinks": 35,"vegetables|oats": 45,

  "healthy_fats|healthy_fats": 55,"healthy_fats|fruit": 70,
  "healthy_fats|milk_drinks": 60,"healthy_fats|oats": 80,

  "fruit|fruit": 50,       "fruit|milk_drinks": 85,     "fruit|oats": 85,

  "milk_drinks|milk_drinks": 40,"milk_drinks|oats": 90,

  "oats|oats": 50
};

const PAIR_OVERRIDES = {
  "Boiled Egg|Labneh": 95,
  "Boiled Egg|Toast Bread": 90,
  "Boiled Egg|Lebanese Bread": 90,
  "Boiled Egg|Apricot Jam": 20,
  "Boiled Egg|Olives": 80,
  "Labneh|Lebanese Bread": 92,
  "Labneh|Cucumber": 85,
  "Oats|Milk": 92,
  "Oats|Banana": 88,
  "Halloumi Cheese|Toast Bread": 88,
  "Akkawi Cheese|Lebanese Bread": 88,
  "Makdous|Lebanese Bread": 85,
  "Avocado|Toast Bread": 87
};

function categoryScore(catA, catB) {
  if (catA === catB) return CATEGORY_COMPAT[`${catA}|${catA}`] ?? 60;
  const keyA = `${catA}|${catB}`;
  const keyB = `${catB}|${catA}`;
  return CATEGORY_COMPAT[keyA] ?? CATEGORY_COMPAT[keyB] ?? 50;
}

function getCompatibility(a, b) {
  if (a === b) return 100;
  const overrideKey1 = `${a.name}|${b.name}`;
  const overrideKey2 = `${b.name}|${a.name}`;
  if (PAIR_OVERRIDES[overrideKey1] !== undefined) return PAIR_OVERRIDES[overrideKey1];
  if (PAIR_OVERRIDES[overrideKey2] !== undefined) return PAIR_OVERRIDES[overrideKey2];

  let score = categoryScore(a.category, b.category);

  const sweetInvolved = a.tasteProfile === "sweet" || b.tasteProfile === "sweet";
  const savoryInvolved = a.tasteProfile === "savory" || b.tasteProfile === "savory";
  const carrierInvolved = [a.category, b.category].some(c => c === "bakery" || c === "dairy" || c === "oats");
  
  if (sweetInvolved && savoryInvolved && !carrierInvolved) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

function compatibilityScoreForMeal(items) {
  if (items.length <= 1) return 100;
  let total = 0, pairs = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      total += getCompatibility(items[i], items[j]);
      pairs++;
    }
  }
  return pairs === 0 ? 100 : total / pairs;
}

function realismScoreForMeal(items) {
  let score = 100;
  const n = items.length;

  if (n < 2) score -= 40;
  if (n > 6) score -= (n - 6) * 12;

  const hasMain = items.some(i => i.role === ROLES.MAIN_PROTEIN || i.role === ROLES.CARB);
  if (!hasMain) score -= 40;

  const sweetCount = items.filter(i => i.tasteProfile === "sweet").length;
  const savoryCount = items.filter(i => i.tasteProfile === "savory").length;
  if (sweetCount > 0 && savoryCount > 1) score -= 25;

  const roleCounts = {};
  items.forEach(i => { roleCounts[i.role] = (roleCounts[i.role] || 0) + 1; });
  Object.values(roleCounts).forEach(c => { if (c > 2) score -= 10; });

  return Math.max(0, Math.min(100, score));
}

const TEMPLATES = [
  {
    name: "Breakfast",
    slots: [
      { role: ROLES.MAIN_PROTEIN, required: true },
      { role: ROLES.CARB, required: true },
      { role: ROLES.DAIRY, required: false },
      { role: ROLES.FAT, required: false },
      { role: ROLES.VEG, required: false },
      { role: ROLES.SIDE, required: false },
      { role: ROLES.FRUIT, required: false },
      { role: ROLES.DRINK, required: false }
    ]
  },
  {
    name: "Lunch/Dinner",
    slots: [
      { role: ROLES.MAIN_PROTEIN, required: true },
      { role: ROLES.CARB, required: true },
      { role: ROLES.VEG, required: false },
      { role: ROLES.FAT, required: false },
      { role: ROLES.DAIRY, required: false }
    ]
  },
  {
    name: "Light Snack",
    slots: [
      { role: ROLES.CARB, required: true },
      { role: ROLES.FAT, required: false },
      { role: ROLES.FRUIT, required: false },
      { role: ROLES.DAIRY, required: false }
    ]
  }
];

function groupByRole(items) {
  const map = {};
  items.forEach(i => {
    (map[i.role] = map[i.role] || []).push(i);
  });
  return map;
}

export function buildCandidateMeals(selectedItems) {
  const byRole = groupByRole(selectedItems);
  const candidates = [];
  const seenKeys = new Set();

  TEMPLATES.forEach(template => {
    const requiredOk = template.slots
      .filter(s => s.required)
      .every(s => (byRole[s.role] || []).length > 0);
    if (!requiredOk) return;

    const slotOptions = template.slots.map(slot => {
      const pool = (byRole[slot.role] || [])
        .slice()
        .sort((a, b) => (b.priority || 5) - (a.priority || 5))
        .slice(0, 3);
      return slot.required ? pool : [null, ...pool];
    });

    let combos = [[]];
    for (const options of slotOptions) {
      const next = [];
      for (const combo of combos) {
        for (const opt of options) {
          next.push([...combo, opt]);
          if (next.length > 3000) break;
        }
        if (next.length > 3000) break;
      }
      combos = next;
    }

    combos.forEach(combo => {
      const items = combo.filter(Boolean);
      const unique = [...new Set(items)];
      if (unique.length === 0 || unique.length !== items.length) return;

      const key = unique.map(i => i.name).sort().join("|");
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      candidates.push({ template: template.name, items: unique });
    });
  });

  const fallbackKey = selectedItems.map(i => i.name).sort().join("|");
  if (!seenKeys.has(fallbackKey)) {
    seenKeys.add(fallbackKey);
    candidates.push({ template: "Available Ingredients", items: [...selectedItems] });
  }

  return candidates;
}

function allowedQuantities(item) {
  const vals = [];
  for (let v = item.minQuantity; v <= item.maxQuantity + 1e-9; v += item.step) {
    vals.push(Math.round(v * 1000) / 1000);
  }
  return vals.length ? vals : [item.minQuantity];
}

function computeTotals(items, quantities) {
  let cal = 0, p = 0, c = 0, f = 0;
  items.forEach((it, idx) => {
    const q = quantities[idx];
    cal += it.calories * q;
    p += it.protein * q;
    c += it.carbs * q;
    f += it.fat * q;
  });
  return { cal, p, c, f };
}

function weightedMacroError(totals, targets) {
  const calErr = Math.abs(totals.cal - targets.cal) / (targets.cal || 1);
  const pErr = Math.abs(totals.p - targets.p) / (targets.p || 1);
  const cErr = Math.abs(totals.c - targets.c) / (targets.c || 1);
  const fErr = Math.abs(totals.f - targets.f) / (targets.f || 1);
  return calErr * 0.35 + pErr * 0.30 + cErr * 0.20 + fErr * 0.15;
}

function optimizeQuantities(items, targets) {
  const stepLists = items.map(allowedQuantities);
  let quantities = stepLists.map(vals => vals[0]);
  let currentErr = weightedMacroError(computeTotals(items, quantities), targets);

  let improved = true;
  let iterations = 0;
  while (improved && iterations < 40) {
    improved = false;
    iterations++;
    for (let idx = 0; idx < items.length; idx++) {
      let bestVal = quantities[idx];
      let bestErr = currentErr;
      for (const val of stepLists[idx]) {
        const trial = quantities.slice();
        trial[idx] = val;
        const err = weightedMacroError(computeTotals(items, trial), targets);
        if (err < bestErr - 1e-9) {
          bestErr = err;
          bestVal = val;
        }
      }
      if (bestVal !== quantities[idx]) {
        quantities[idx] = bestVal;
        currentErr = bestErr;
        improved = true;
      }
    }
  }

  return { quantities, totals: computeTotals(items, quantities), weightedError: currentErr };
}

function correctCaloriesExact(items, quantities, targets) {
  const corrected = quantities.slice();
  let totals = computeTotals(items, corrected);
  let diff = targets.cal - totals.cal;

  if (Math.abs(diff) < 0.01) return corrected;

  const order = items
    .map((it, idx) => ({ it, idx }))
    .sort((a, b) => {
      const aFlex = (a.it.unit === "gram" || a.it.unit === "ml") ? 0 : 1;
      const bFlex = (b.it.unit === "gram" || b.it.unit === "ml") ? 0 : 1;
      if (aFlex !== bFlex) return aFlex - bFlex;
      return a.it.priority - b.it.priority;
    });

  for (const { it, idx } of order) {
    if (Math.abs(diff) < 0.01) break;
    if (it.calories <= 0) continue;

    const currentQty = corrected[idx];
    const deltaQty = diff / it.calories;
    let newQty = currentQty + deltaQty;
    newQty = Math.max(it.minQuantity, Math.min(it.maxQuantity, newQty));

    const appliedDeltaQty = newQty - currentQty;
    const appliedCal = appliedDeltaQty * it.calories;

    corrected[idx] = Math.round(newQty * 1000) / 1000;
    diff -= appliedCal;
  }

  return corrected;
}

function scoreFromError(err) {
  return Math.max(0, Math.min(100, 100 * (1 - err)));
}

export function evaluateMeal(items, targets) {
  let { quantities } = optimizeQuantities(items, targets);
  quantities = correctCaloriesExact(items, quantities, targets);
  const totals = computeTotals(items, quantities);

  const calErr = Math.abs(totals.cal - targets.cal) / (targets.cal || 1);
  const pErr = Math.abs(totals.p - targets.p) / (targets.p || 1);
  const cErr = Math.abs(totals.c - targets.c) / (targets.c || 1);
  const fErr = Math.abs(totals.f - targets.f) / (targets.f || 1);

  const macroAccuracy = scoreFromError((calErr + cErr + fErr) / 3);
  const proteinAccuracy = scoreFromError(pErr);
  const compatibility = compatibilityScoreForMeal(items);
  const realism = realismScoreForMeal(items);

  const finalScore =
    macroAccuracy * 0.4 +
    proteinAccuracy * 0.2 +
    compatibility * 0.2 +
    realism * 0.2;

  return { items, quantities, totals, macroAccuracy, proteinAccuracy, compatibility, realism, finalScore };
}

export function findOptimalMezzeMeal(selectedItems, targets) {
  const candidates = buildCandidateMeals(selectedItems);
  let best = null;
  candidates.forEach(cand => {
    const evaluated = evaluateMeal(cand.items, targets);
    if (!best || evaluated.finalScore > best.finalScore) {
      best = evaluated;
    }
  });
  return best;
}
