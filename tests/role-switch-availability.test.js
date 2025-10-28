const request = require('supertest');
const { app } = require('../index');

describe('Role Switch and Available Professionals', () => {
  let accessToken;
  const testUser = {
    email: 'varselcorp@gmail.com',
    password: '12345678'
  };

  beforeAll(async () => {
    // Wait a bit for DB to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(testUser)
      .timeout(10000);
    
    console.log('Login response:', loginResponse.body);
    
    if (loginResponse.body.success) {
      accessToken = loginResponse.body.accessToken;
    } else {
      throw new Error('Failed to login: ' + loginResponse.body.message);
    }
  }, 15000);

  test('Should login successfully', () => {
    expect(accessToken).toBeDefined();
  });

  test('Should get user debug info', async () => {
    const response = await request(app)
      .get(`/api/auth/debug/${testUser.email}`)
      .timeout(10000);
    
    console.log('Debug info:', response.body);
    expect(response.status).toBe(200);
  }, 15000);

  test('Should switch from Professional to Client', async () => {
    const response = await request(app)
      .put('/api/auth/switch-role')
      .set('Authorization', `Bearer ${accessToken}`)
      .timeout(10000);
    
    console.log('Switch to Client response:', response.body);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  }, 15000);

  test('Should appear in available professionals after switching to Client', async () => {
    const response = await request(app)
      .get('/api/availableMechanics')
      .timeout(10000);
    
    console.log('Available professionals:', response.body);
    
    // Check if our test user appears in the list
    const userInList = response.body.data?.find(user => 
      user.email === testUser.email
    );
    
    console.log('Test user in available list:', userInList);
    expect(userInList).toBeDefined();
  }, 15000);

  test('Should switch back from Client to Professional', async () => {
    const response = await request(app)
      .put('/api/auth/switch-role')
      .set('Authorization', `Bearer ${accessToken}`)
      .timeout(10000);
    
    console.log('Switch to Professional response:', response.body);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  }, 15000);

  test('Should still appear in available professionals after switching back', async () => {
    const response = await request(app)
      .get('/api/availableMechanics')
      .timeout(10000);
    
    console.log('Available professionals after switch back:', response.body);
    
    // Check if our test user still appears in the list
    const userInList = response.body.data?.find(user => 
      user.email === testUser.email
    );
    
    console.log('Test user still in available list:', userInList);
    expect(userInList).toBeDefined();
  }, 15000);

  test('Should get final user debug info', async () => {
    const response = await request(app)
      .get(`/api/auth/debug/${testUser.email}`)
      .timeout(10000);
    
    console.log('Final debug info:', response.body);
    expect(response.status).toBe(200);
  }, 15000);
});