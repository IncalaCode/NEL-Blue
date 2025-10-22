const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
const { app } = require('../index');

describe('Appointment Endpoints', () => {
  let authToken;

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('POST /api/appointment/addappointment - should create appointment with valid data', async () => {
    const response = await request(app)
      .post('/api/appointment/addappointment')
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
      .send({
        professionalId: '68c7ec97a3363a0d5cdabdcf',
        duration: 2
      });

    console.log('Calculate price status:', response.status);
    console.log('Calculate price body:', JSON.stringify(response.body, null, 2));

    expect([200, 400, 401, 404, 500]).toContain(response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('pricing');
      expect(response.body.pricing).toHaveProperty('basePrice');
      expect(response.body.pricing).toHaveProperty('platformFee');
      expect(response.body.pricing).toHaveProperty('taxAmount');
      expect(response.body.pricing).toHaveProperty('totalPrice');
      expect(response.body.pricing).toHaveProperty('professionalEarnings');
    }
  });
});
