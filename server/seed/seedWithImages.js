/**
 * Seeds foods into MongoDB AND uploads images to ImageKit.
 * 
 * Usage:  node seed/seedWithImages.js
 * 
 * What it does:
 *   1. Reads meals.json
 *   2. For each food, finds the matching image in foods/images/
 *   3. Uploads the image to ImageKit
 *   4. Inserts the food into MongoDB with the image_url from ImageKit
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const Food = require('../models/Food');
const imagekit = require('../config/imagekit');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const IMAGES_DIR = path.join(__dirname, '..', '..', 'foods', 'images');
const MEALS_JSON = path.join(__dirname, '..', '..', 'foods', 'meals.json');

// Recursively find a file by name in a directory
function findFileRecursive(dir, fileName) {
  const normalizedTarget = fileName.toLowerCase().trim();

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, fileName);
        if (found) return found;
      } else if (entry.name.toLowerCase().trim() === normalizedTarget) {
        return fullPath;
      }
    }
  } catch (err) {
    // Skip unreadable directories
  }
  return null;
}

// Upload a single image to ImageKit
async function uploadToImageKit(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const result = await imagekit.upload({
    file: fileBuffer,
    fileName: fileName,
    folder: '/foods',
    useUniqueFileName: false,
  });
  return result.url;
}

// Main seed function
async function seedWithImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log('✅ Connected to MongoDB');

    // Load meals data
    const meals = JSON.parse(fs.readFileSync(MEALS_JSON, 'utf-8'));
    console.log(`📋 Found ${meals.length} foods in meals.json`);

    // Clear existing foods
    await Food.deleteMany({});
    console.log('🗑️  Cleared existing foods collection');

    let uploaded = 0;
    let skipped = 0;
    let errors = 0;

    // Process each food
    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i];
      const label = meal.name?.en || `Food #${i + 1}`;
      process.stdout.write(`\r⏳ Processing ${i + 1}/${meals.length}: ${label.padEnd(35)}`);

      let imageUrl = '';

      // Try to find and upload image
      if (meal.image_name) {
        const imagePath = findFileRecursive(IMAGES_DIR, meal.image_name);

        if (imagePath) {
          try {
            imageUrl = await uploadToImageKit(imagePath, meal.image_name);
            uploaded++;
          } catch (uploadErr) {
            console.log(`\n   ⚠️  Upload failed for "${meal.image_name}": ${uploadErr.message}`);
            errors++;
          }
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }

      // Insert food with image_url
      await Food.create({
        ...meal,
        image_url: imageUrl,
      });
    }

    console.log('\n');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Done! ${meals.length} foods inserted into MongoDB`);
    console.log(`📸 Images uploaded: ${uploaded}`);
    console.log(`⏭️  Images skipped: ${skipped}`);
    if (errors > 0) console.log(`❌ Upload errors: ${errors}`);
    console.log('═══════════════════════════════════════');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

seedWithImages();
