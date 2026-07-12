process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const foodsCol = db.collection('foods');
  
  const names = ['Fatouch', 'Tabouleh'];
  for (const n of names) {
    const docs = await foodsCol.find({ 'name.en': n }).toArray();
    if (docs.length > 1) {
      for (let i = 1; i < docs.length; i++) {
        await foodsCol.deleteOne({ _id: docs[i]._id });
        console.log(`Deleted duplicate: ${n} (${docs[i]._id})`);
      }
    }
  }

  const soupeDocs = await foodsCol.find({ 'name.en': { $regex: /^Soupe de lentilles$/i } }).toArray();
  if (soupeDocs.length > 1) {
    for (let i = 1; i < soupeDocs.length; i++) {
      await foodsCol.deleteOne({ _id: soupeDocs[i]._id });
      console.log(`Deleted duplicate: ${soupeDocs[i].name.en} (${soupeDocs[i]._id})`);
    }
  }

  process.exit();
}
run();
