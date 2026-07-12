const fs = require('fs');

const path = 'foods/dinner_breakfast_launch_info.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const mappings = {
  'Laban Emo': ['laban', 'bœuf', 'oignon', 'ail'],
  'Kousa bel Laban': ['courgette', 'bœuf', 'laban', 'ail'],
  'Pizza Margherita': ['sauce tomate', 'mozzarella'],
  'Greek Salad': ['laitue', 'tomate', 'concombre', 'olives', 'oignon'],
  'Molokhia': ['corète potagère', 'poulet', 'ail', 'coriandre'],
  'Gombo avec de la viande': ['gombo', 'bœuf', 'tomate', 'oignon'],
  'Haricot avec de la viande': ['haricot vert', 'bœuf', 'tomate', 'oignon'],
  'Épinard avec viande': ['épinard', 'bœuf', 'oignon'],
  'Pois avec de la viande': ['pois', 'bœuf', 'carotte'],
  'Chou-fleur avec de la viande': ['chou-fleur', 'bœuf'],
  'Chekh Mehche': ['aubergine', 'bœuf', 'oignon', 'tomate'],
  'Poulet grillé': ['poulet'],
  'Viande grillée': ['bœuf'],
  'Poisson grillé': ['poisson'],
  'Filet de poisson grillé': ['filet de poisson'],
  'Kebbe': ['bœuf', 'boulgour', 'oignon', 'pin'],
  'Tuna Sandwich': ['baguette', 'thon en conserve', 'laitue'],
  'Pasta au thon': ['pasta', 'thon en conserve', 'maïs'],
  'Pizza au thon': ['sauce tomate', 'mozzarella', 'thon en conserve'],
  'Salade thon-avocat': ['thon en conserve', 'avocat', 'laitue', 'citron'],
  'Salade Niçoise': ['laitue', 'tomate', 'œufs', 'thon en conserve', 'olives', 'pomme de terre'],
  'Frikkeh': ['blé', 'poulet', 'amendes'],
  'Moujadara': ['lentilles', 'riz', 'oignon'],
  'Riz et fèves': ['riz', 'fève'],
  'Riz et pois avec viande': ['riz', 'pois', 'bœuf'],
  'Boulgour et tomate': ['boulgour', 'tomate', 'oignon'],
  'Falafel': ['pois chiches', 'fève', 'coriandre', 'ail'],
  'Courgette farcie': ['courgette', 'riz', 'bœuf', 'tomate'],
  'Chou-fleur farci': ['chou-fleur', 'bœuf', 'oignon'],
  'Feuilles de vignes farcies': ['feuille de vignes', 'riz', 'bœuf', 'citron'],
  'Sfi7a': ['bœuf', 'tomate', 'oignon', 'pin'],
  'Fatayer épinard': ['épinard', 'oignon', 'citron'],
  'Soupe de lentilles': ['lentilles orange', 'carotte', 'oignon']
};

let fixedCount = 0;
data.meals_lunch.forEach(meal => {
  if (meal.ingredients.length === 0 && mappings[meal.name]) {
    meal.ingredients = mappings[meal.name];
    fixedCount++;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Fixed ${fixedCount} meals in meals_lunch.`);
