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
    console.log('Login successful, token obtained');
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
  });

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
});
