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
const TARGET_FOLDERS = ['breakfast_dinner', 'breakfast_dinner_ingredients', 'ingredients_launch', 'launch'];

function getAllImages(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllImages(file));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        results.push(file);
      }
    }
  });
  return results;
}

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
  console.log('Gathering local images...');
  const allImages = [];
  TARGET_FOLDERS.forEach(folder => {
    const dir = path.join(FOODS_DIR, folder);
    if (fs.existsSync(dir)) {
      allImages.push(...getAllImages(dir));
    } else {
      console.log('Directory not found:', dir);
    }
  });

  console.log(`Found ${allImages.length} images to upload.`);

  const urlMapping = {}; 
  const fileNameMapping = {}; 

  console.log('Uploading to ImageKit...');
  let uploaded = 0;
  for (let i = 0; i < allImages.length; i += 10) {
    const chunk = allImages.slice(i, i + 10);
    await Promise.all(chunk.map(async filePath => {
      try {
        const url = await uploadToImageKit(filePath);
        const relPath = path.relative(FOODS_DIR, filePath).replace(/\\/g, '/');
        urlMapping[relPath] = url;
        fileNameMapping[path.basename(filePath)] = url;
        uploaded++;
        if (uploaded % 10 === 0) console.log(`Uploaded ${uploaded}/${allImages.length}...`);
      } catch (err) {
        console.error(`Failed to upload ${filePath}:`, err.message);
      }
    }));
  }
  console.log(`Finished uploading. Successful: ${uploaded}`);

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected.');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  let updatedDocs = 0;

  for (const c of collections) {
    const colName = c.name;
    const collection = db.collection(colName);
    const docs = await collection.find({}).toArray();

    for (const doc of docs) {
      let changed = false;

      function updateFields(obj) {
        if (!obj || typeof obj !== 'object') return;
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            const val = obj[key];
            if (urlMapping[val]) {
              obj[key] = urlMapping[val];
              changed = true;
            } else if ((key === 'image' || key === 'image_url' || key === 'image_name') && fileNameMapping[path.basename(val)]) {
              obj[key] = fileNameMapping[path.basename(val)];
              changed = true;
            }
          } else if (typeof obj[key] === 'object') {
            updateFields(obj[key]);
          }
        }
      }

      updateFields(doc);

      if (changed) {
        await collection.updateOne({ _id: doc._id }, { $set: doc });
        updatedDocs++;
      }
    }
    console.log(`Checked collection ${colName}, updated documents if any.`);
  }

  console.log(`Done! Updated ${updatedDocs} documents in total.`);
  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
