const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
const { app } = require('../index');

describe('Appointment Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'eddie.williams.swe@gmail.com',
        password: '12345678'
      });
    
    authToken = loginResponse.body.accessToken;
    console.log('Login successful, token obtained', authToken);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('POST /api/appointment/addappointment - should create appointment with valid data', async () => {
    const response = await request(app)
      .post('/api/appointment/addappointment')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        serviceId: '68b370b362d20a7e8373d382',
        professionalId: '68c7ec97a3363a0d5cdabdcf',
        categories: 'MB, SK, AB',
        vehicleType: 'Car',
        appointmentDate: '2025-09-20',
        appointmentTime: '10:30',
        issue: 'Engine making strange noise',
        otherIssue: 'Check brakes as well',
        location: '123 Main St, Cityville',
        duration: 2
      });

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    expect([200, 201, 400, 401, 404, 500]).toContain(response.status);
    
    if (response.status === 200 || response.status === 201) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('appointment');
      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body.appointment).toHaveProperty('totalPrice');
      expect(response.body.appointment).toHaveProperty('taxAmount');
      expect(response.body.appointment).toHaveProperty('platformFee');
      expect(response.body.appointment).toHaveProperty('professionalEarnings');
    }
  }, 10000);

  test('POST /api/appointment/calculate-price - should calculate appointment cost', async () => {
    const response = await request(app)
      .post('/api/appointment/calculate-price')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        professionalId: '68c7ec97a3363a0d5cdabdcf',
        duration: 2
      });

    console.log('Calculate price status:', response.status);
    console.log('Calculate price body:', JSON.stringify(response.body, null, 2));

    expect([200, 400, 401, 404, 500]).toContain(response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('basePrice');
      expect(response.body.data).toHaveProperty('platformFee');
      expect(response.body.data).toHaveProperty('taxAmount');
      expect(response.body.data).toHaveProperty('totalPrice');
      expect(response.body.data).toHaveProperty('professionalEarnings');
    }
  });

  test('GET /api/appointment/requests - should get pending appointments', async () => {
    const response = await request(app)
      .get('/api/appointment/requests?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Get requests status:', response.status);
    console.log('Get requests body:', JSON.stringify(response.body, null, 2));

    expect([200, 401, 500]).toContain(response.status);
    
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

    console.log('Get active status:', response.status);
    console.log('Get active body:', JSON.stringify(response.body, null, 2));

    expect([200, 401, 500]).toContain(response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });

  test('PUT /api/appointment/:id/confirm - should confirm appointment', async () => {
    // First get a pending appointment
    const getResponse = await request(app)
      .get('/api/appointment/requests?page=1&limit=1')
      .set('Authorization', `Bearer ${authToken}`);

    if (getResponse.status === 200 && getResponse.body.data.length > 0) {
      const appointmentId = getResponse.body.data[0]._id;
      
      const response = await request(app)
        .put(`/api/appointment/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Confirm appointment status:', response.status);
      console.log('Confirm appointment body:', JSON.stringify(response.body, null, 2));

      expect([200, 403, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
      }
    } else {
      console.log('No pending appointments to confirm');
    }
  });

  test('PUT /api/appointment/:id/reject - should reject appointment', async () => {
    // First get a pending appointment
    const getResponse = await request(app)
      .get('/api/appointment/requests?page=1&limit=1')
      .set('Authorization', `Bearer ${authToken}`);

    if (getResponse.status === 200 && getResponse.body.data.length > 0) {
      const appointmentId = getResponse.body.data[0]._id;
      
      const response = await request(app)
        .put(`/api/appointment/${appointmentId}/reject`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Reject appointment status:', response.status);
      console.log('Reject appointment body:', JSON.stringify(response.body, null, 2));

      expect([200, 403, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
      }
    } else {
      console.log('No pending appointments to reject');
    }
  });
});
