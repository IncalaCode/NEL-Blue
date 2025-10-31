require('dotenv').config();
const redis = require('../Middleware/Redis');

async function clearRedisData() {
  try {
    console.log('🧹 Showing Redis data before clearing...');
    
    // Get all keys in Redis
    const allKeys = await redis.keys('*');
    
    if (allKeys.length > 0) {
      console.log(`\n📊 Found ${allKeys.length} keys in Redis:`);
      
      for (const key of allKeys) {
        try {
          const value = await redis.get(key);
          const ttl = await redis.ttl(key);
          
          console.log(`\n🔑 Key: ${key}`);
          console.log(`⏰ TTL: ${ttl === -1 ? 'No expiration' : ttl + ' seconds'}`);
          
          // Try to parse JSON, otherwise show raw value
          try {
            const parsed = JSON.parse(value);
            console.log('📄 Value:', JSON.stringify(parsed, null, 2));
          } catch {
            console.log('📄 Value:', value);
          }
        } catch (err) {
          console.log(`❌ Error reading key ${key}:`, err.message);
        }
      }
      
      console.log('\n🗑️  Clearing all data...');
      await redis.flushall();
      console.log(`✅ Cleared entire Redis database (${allKeys.length} keys deleted)`);
    } else {
      console.log('ℹ️  Redis database is already empty');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing Redis:', error);
    process.exit(1);
  }
}

clearRedisData();