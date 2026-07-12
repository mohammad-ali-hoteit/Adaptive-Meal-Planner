process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const FOODS_DIR = path.join(__dirname, '..', 'foods');

// Map of the bad DB values to the actual local files we found
const fileMap = {
  'boiled_egg.jpg': 'breakfast_dinner/boiled_eggs.jpg',
  'toast_bread.jpg': 'breakfast_dinner_ingredients/pain/toast.jpg',
  'lebanese_bread.jpg': 'breakfast_dinner/pita_bread.jpg',
  'akkawi_cheese.jpg': 'breakfast_dinner/akkawi.jpg',
  'halloumi_cheese.jpg': 'breakfast_dinner/halloumi.jpg',
  'boiled_fava_beans.jpg': 'breakfast_dinner_ingredients/principaux/canned_fava_bean.jpg',
  'boiled_chickpeas.jpg': 'breakfast_dinner_ingredients/principaux/canned_chickpeas.jpg',
  'makdous.jpg': 'breakfast_dinner/makdousse.jpg',
  'walnuts.jpg': 'breakfast_dinner/walnut.jpg',
  '/launch/pasta_With_tuna.jpg': 'launch/pasta_with_tuna.jpg',
  '/launch/salade_nicoise.jpg': 'launch/salade_Nicoise.jpg',
};

async function uploadToImageKit(filePath) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const result = await imagekit.upload({
    file: fileBuffer,
    fileName: fileName,
    folder: '/foods',
    useUniqueFileName: false
  });
  return result.url;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const foodsCol = mongoose.connection.db.collection('foods');

  for (const [dbPath, relPath] of Object.entries(fileMap)) {
    const fullPath = path.join(FOODS_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      console.log(`Missing mapped file: ${fullPath}`);
      continue;
    }
    
    console.log(`Uploading ${dbPath} using ${relPath}...`);
    try {
      const url = await uploadToImageKit(fullPath);
      await foodsCol.updateMany(
        { $or: [{ image_url: dbPath }, { image: dbPath }, { image_name: dbPath }] },
        { $set: { image_url: url } }
      );
      console.log(` -> Updated DB with ${url}`);
    } catch (err) {
      console.error(`Error uploading ${relPath}: ${err.message}`);
    }
  }

  process.exit();
}
run();
