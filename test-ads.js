const request = require('supertest');
const { app } = require('./index');

async function testAdvertisementEndpoints() {
  try {
    console.log('Testing GET /api/advertisement (Feed)...');
    const feedResponse = await request(app)
      .get('/api/advertisement?page=1&limit=10');
    
    console.log('Feed Status:', feedResponse.status);
    console.log('Feed Response:', feedResponse.body);
    
    console.log('\nTesting GET /api/advertisement/my-own (requires auth)...');
    const myResponse = await request(app)
      .get('/api/advertisement/my-own?page=1&limit=10');
    
    console.log('My Own Status:', myResponse.status);
    console.log('My Own Response:', myResponse.body);
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testAdvertisementEndpoints();