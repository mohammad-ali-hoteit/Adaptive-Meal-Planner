require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const docs = await db.collection('foods').find({}).limit(5).toArray();
  docs.forEach(d => {
    console.log(d.name.en, '-> image:', d.image, '| image_url:', d.image_url, '| image_name:', d.image_name);
  });
  process.exit();
}
run();
