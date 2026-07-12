require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Move http URLs from image_name to image_url
  const foodsCol = db.collection('foods');
  const docs = await foodsCol.find({ image_name: { $regex: '^http' } }).toArray();
  let updated = 0;
  for (const doc of docs) {
    await foodsCol.updateOne({ _id: doc._id }, { $set: { image_url: doc.image_name } });
    updated++;
  }
  console.log(`Updated ${updated} foods where image_name had the URL.`);

  // Also check if some URLs were put into other fields like 'image' and we should put them in 'image_url'
  const docs2 = await foodsCol.find({ image: { $regex: '^http' } }).toArray();
  for (const doc of docs2) {
    await foodsCol.updateOne({ _id: doc._id }, { $set: { image_url: doc.image } });
  }

  process.exit();
}
run();
