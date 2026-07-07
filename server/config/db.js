const mongoose = require('mongoose');
const dns = require('dns');
const { Resolver } = require('dns').promises;

const connectDB = async () => {
  console.log('🔄 Connecting to MongoDB...');

  // Test DNS resolution first
  try {
    console.log('   🔍 Testing DNS resolution...');
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '8.8.4.4']);
    const records = await resolver.resolveSrv('_mongodb._tcp.cluster0.jwgc1im.mongodb.net');
    console.log(`   ✅ DNS resolved: ${records.length} server(s) found`);
  } catch (dnsErr) {
    console.log(`   ⚠️  SRV DNS failed: ${dnsErr.message}`);
    console.log('   🔄 Trying with Google DNS globally...');
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      family: 4,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('');
    console.log('💡 Try these fixes:');
    console.log('   1. Run: ipconfig /flushdns');
    console.log('   2. Switch to mobile hotspot');
    console.log('   3. Check MongoDB Atlas → Network Access → 0.0.0.0/0');
    throw err;
  }
};

module.exports = connectDB;
