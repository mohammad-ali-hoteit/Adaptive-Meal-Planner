const fs = require('fs');

const path = 'foods/dinner_breakfast_launch_info.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const ingMap = {};
data.ingredients_breakfast_dinner.forEach(i => {
  ingMap[i.name] = i;
});

const combos = [
  {
    name: 'Lebanese Breakfast Plate',
    image: 'breakfast_dinner/lebanese_breakfast_plate.jpg',
    category: 'combo_meal',
    recipe: [
      { name: 'Akkawi', factor: 1.0 }, 
      { name: 'Olives', factor: 0.5 }, 
      { name: 'Lebanese Bread', factor: 1.0 }, 
      { name: 'Tomato', factor: 1.0 }, 
      { name: 'Cucumber', factor: 1.0 } 
    ]
  },
  {
    name: 'Sweet Breakfast',
    image: 'breakfast_dinner/sweet_breakfast.jpg',
    category: 'combo_meal',
    recipe: [
      { name: 'Toast', factor: 1.0 }, 
      { name: 'Strawberry Jam', factor: 0.3 }, 
      { name: 'Honey', factor: 0.2 }, 
      { name: 'Milk', factor: 2.5 } 
    ]
  },
  {
    name: 'Makdous Plate',
    image: 'breakfast_dinner/makdous_plate.jpg',
    category: 'combo_meal',
    recipe: [
      { name: 'Makdous', factor: 2.0 }, 
      { name: 'Lebanese Bread', factor: 1.0 }, 
      { name: 'Labneh', factor: 1.0 }, 
      { name: 'Olives', factor: 0.5 } 
    ]
  },
  {
    name: 'Simple Egg Plate',
    image: 'breakfast_dinner/simple_egg_plate.jpg',
    category: 'combo_meal',
    recipe: [
      { name: 'Egg', factor: 1.0 }, 
      { name: 'Toast', factor: 1.0 }, 
      { name: 'Tomato', factor: 1.0 }, 
      { name: 'Cucumber', factor: 1.0 } 
    ]
  }
];

const newMeals = combos.map(combo => {
  let cal = 0, pro = 0, car = 0, fat = 0;
  const ingredients = [];
  combo.recipe.forEach(r => {
    const ing = ingMap[r.name];
    if (ing) {
      cal += ing.nutrition.calories * r.factor;
      pro += ing.nutrition.protein_g * r.factor;
      car += ing.nutrition.carbs_g * r.factor;
      fat += ing.nutrition.fat_g * r.factor;
      ingredients.push(r.name);
    } else {
      console.log('Missing ingredient: ' + r.name);
    }
  });

  return {
    name: combo.name,
    image: combo.image,
    category: combo.category,
    size_g: 350,
    unit: 'meal',
    nutrition: {
      calories: Math.round(cal),
      protein_g: Math.round(pro * 10) / 10,
      carbs_g: Math.round(car * 10) / 10,
      fat_g: Math.round(fat * 10) / 10
    },
    ingredients: ingredients
  };
});

data.meals_breakfast_dinner.push(...newMeals);
fs.writeFileSync(path, JSON.stringify(data, null, 2));

console.log(JSON.stringify(newMeals, null, 2));
