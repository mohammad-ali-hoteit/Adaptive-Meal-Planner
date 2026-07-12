const fs = require('fs');

const path = 'foods/dinner_breakfast_launch_info.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let changed = 0;
const arrays = ['ingredients_breakfast_dinner', 'meals_breakfast_dinner', 'ingredients_lunch', 'meals_lunch'];

arrays.forEach(arrName => {
  if (data[arrName]) {
    data[arrName].forEach(item => {
      if (item.image && item.image.startsWith('/')) {
        item.image = item.image.substring(1);
        changed++;
        console.log(`Changed in ${arrName}: ${item.name} -> ${item.image}`);
      }
    });
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Total changed: ${changed}`);
