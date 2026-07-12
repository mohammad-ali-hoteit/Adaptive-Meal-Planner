require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  for (let c of collections) {
    const doc = await mongoose.connection.db.collection(c.name).findOne();
    if (doc) {
      console.log(`\nSample from ${c.name}:`);
      console.log(JSON.stringify(doc, null, 2));
    }
  }

  process.exit();
}
check();
