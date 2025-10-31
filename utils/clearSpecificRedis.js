require('dotenv').config();
const redis = require('../Middleware/Redis');

async function clearSpecificData(email) {
  try {
    console.log(`🧹 Clearing Redis data for: ${email}`);
    
    const keysToDelete = [
      `signup_data:${email}`,
      `admin_signup_data:${email}`,
      `password_reset:${email}`,
      `two_factor_otp:${email}`,
      `verification_code:${email}`
    ];
    
    let deletedCount = 0;
    for (const key of keysToDelete) {
      const result = await redis.del(key);
      if (result > 0) {
        console.log(`✅ Deleted: ${key}`);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`✅ Total deleted: ${deletedCount} keys`);
    } else {
      console.log('ℹ️  No keys found for this email');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing Redis:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node utils/clearSpecificRedis.js <email>');
  console.log('Example: node utils/clearSpecificRedis.js kalebademkisho@gmail.com');
  process.exit(1);
}

clearSpecificData(email);