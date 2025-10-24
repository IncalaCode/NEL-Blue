const request = require('supertest');
const { app } = require('../index');
const mongoose = require('mongoose');

describe('Job hasCurrentUserApplied Test', () => {
  let authToken;
  let jobId;

  beforeAll(async () => {
    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'varselcorp@gmail.com',
        password: '12345678'
      });

    console.log('Login response:', loginResponse.body);
    authToken = loginResponse.body.accessToken;
  }, 10000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should get recent jobs and check hasCurrentUserApplied', async () => {
    const response = await request(app)
      .get('/api/jobs/recent')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Recent jobs response:', JSON.stringify(response.body, null, 2));
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    if (response.body.jobs.length > 0) {
      jobId = response.body.jobs[0]._id;
      console.log('First job hasCurrentUserApplied:', response.body.jobs[0].additionalPayload.hasCurrentUserApplied);
      expect(response.body.jobs[0].additionalPayload).toHaveProperty('hasCurrentUserApplied');
    }
  }, 10000);

  test('should apply for job if available', async () => {
    if (!jobId) {
      console.log('No job available to apply for');
      return;
    }

    const applyResponse = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Apply response:', applyResponse.body);
    
    // Check if application was successful or already applied
    expect([200, 400]).toContain(applyResponse.status);
  }, 10000);

  test('should check hasCurrentUserApplied after applying', async () => {
    if (!jobId) {
      console.log('No job available to check');
      return;
    }

    const response = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Job details after apply:', {
      jobId: jobId,
      hasCurrentUserApplied: response.body.additionalPayload?.hasCurrentUserApplied
    });

    expect(response.status).toBe(200);
    expect(response.body.additionalPayload).toHaveProperty('hasCurrentUserApplied');
  }, 10000);

  test('should check recent jobs after applying', async () => {
    const response = await request(app)
      .get('/api/jobs/recent')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Recent jobs after apply:');
    response.body.jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}: hasCurrentUserApplied = ${job.additionalPayload.hasCurrentUserApplied}`);
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  }, 10000);
});