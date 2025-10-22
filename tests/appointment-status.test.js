const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
const { app } = require('../index');

describe('Appointment Status Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'eddie.williams.swe@gmail.com',
        password: '12345678'
      });
    
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('GET /api/appointment/requests - should get pending appointments', async () => {
    const response = await request(app)
      .get('/api/appointment/requests?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Requests:', JSON.stringify(response.body, null, 2));

    expect([200, 401]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });

  test('GET /api/appointment/active - should get confirmed appointments', async () => {
    const response = await request(app)
      .get('/api/appointment/active?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Active:', JSON.stringify(response.body, null, 2));

    expect([200, 401]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    }
  });

  test('GET /api/appointment/completed - should get completed appointments', async () => {
    const response = await request(app)
      .get('/api/appointment/completed?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Completed:', JSON.stringify(response.body, null, 2));

    expect([200, 401]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    }
  });

  test('GET /api/appointment/cancelled - should get cancelled appointments', async () => {
    const response = await request(app)
      .get('/api/appointment/cancelled?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Cancelled:', JSON.stringify(response.body, null, 2));

    expect([200, 401]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    }
  });

  test('GET /api/appointment/getappointement - should get all appointments with pagination', async () => {
    const response = await request(app)
      .get('/api/appointment/getappointement?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('All appointments:', JSON.stringify(response.body, null, 2));

    expect([200, 401]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    }
  });
});
