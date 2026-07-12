process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const docs = await db.collection('foods').find({}).toArray();
  
  let missing = [];
  let urls = {};
  let duplicates = {};
  let malformed = [];

  docs.forEach(d => {
    const name = d.name && d.name.en ? d.name.en : (d.name || 'Unknown');
    const url = d.image_url || d.image || d.image_name;
    
    if (!url || url.trim() === '') {
      missing.push(name);
    } else {
      if (!url.startsWith('http')) {
        malformed.push({ name, url });
      }
      if (urls[url]) {
        if (!duplicates[url]) duplicates[url] = [urls[url]];
        duplicates[url].push(name);
      } else {
        urls[url] = name;
      }
    }
  });

  console.log('=== MISSING IMAGES (No URL) ===');
  console.log(missing.join(', ') || 'None');
  
  console.log('\n=== MALFORMED URLS (Relative/Broken) ===');
  console.log(malformed.map(m => `${m.name}: ${m.url}`).join('\n') || 'None');

  console.log('\n=== DUPLICATE URLS (Same image for multiple items) ===');
  let hasDups = false;
  for (const url in duplicates) {
    console.log(`\nURL: ${url}\nShared by: ${duplicates[url].join(', ')}`);
    hasDups = true;
  }
  if (!hasDups) console.log('None');
  
  process.exit();
}
run();
