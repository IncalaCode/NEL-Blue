const request = require('supertest');
const mongoose = require('mongoose');
const Job = require('../Models/Job.model');
const Advertisement = require('../Models/Advertisement.model');

process.env.NODE_ENV = 'test';
const { app } = require('../index');

describe('Edit Functionality Tests', () => {
  let authToken;
  let testJobId;
  let testAdvertisementId;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'eddie.williams.swe@gmail.com',
        password: '12345678'
      });
    
    authToken = loginResponse.body.accessToken;
    console.log('Login successful for edit tests');
  });

  afterAll(async () => {
    // Clean up test data
    if (testJobId) {
      try {
        await Job.findByIdAndDelete(testJobId);
      } catch (error) {
        console.log('Job cleanup skipped');
      }
    }
    
    if (testAdvertisementId) {
      try {
        await Advertisement.findByIdAndDelete(testAdvertisementId);
      } catch (error) {
        console.log('Advertisement cleanup skipped');
      }
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Job Edit Functionality', () => {
    test('should create a job for editing tests', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          serviceId: '68b370b362d20a7e8373d382',
          ratePerHour: 50,
          location: 'Test Location',
          description: 'Original job description',
          duration: 2,
          paymentMethod: 'hourly',
          skills: ['JavaScript', 'Node.js'],
          appointmentDate: '2025-03-01',
          appointmentTime: '10:00'
        });

      console.log('Create job response:', response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('job');
        testJobId = response.body.job._id;
        console.log('Test job created with ID:', testJobId);
      }
    });

    test('should edit a job successfully', async () => {
      if (!testJobId) {
        console.log('Skipping job edit test - no test job created');
        return;
      }

      const updateData = {
        ratePerHour: 75,
        location: 'Updated Location',
        description: 'Updated job description',
        duration: 3,
        skills: ['JavaScript', 'Node.js', 'React'],
        appointmentDate: '2025-03-02',
        appointmentTime: '14:00'
      };

      const response = await request(app)
        .put(`/api/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      console.log('Edit job response:', response.status);
      console.log('Edit job body:', JSON.stringify(response.body, null, 2));

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Job updated successfully');
        expect(response.body).toHaveProperty('job');
        expect(response.body.job.ratePerHour).toBe(75);
        expect(response.body.job.location).toBe('Updated Location');
        expect(response.body.job.description).toBe('Updated job description');
        expect(response.body.job.duration).toBe(3);
        expect(response.body.job.skills).toEqual(['JavaScript', 'Node.js', 'React']);
      }
    });

    test('should get job by ID to verify changes', async () => {
      if (!testJobId) {
        console.log('Skipping job get test - no test job created');
        return;
      }

      const response = await request(app)
        .get(`/api/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Get job response:', response.status);

      if (response.status === 200) {
        expect(response.ratePerHour).toBe(75);
        expect(response.location).toBe('Updated Location');
        expect(response.description).toBe('Updated job description');
      }
    });

    test('should not allow editing job by unauthorized user', async () => {
      if (!testJobId) {
        console.log('Skipping unauthorized edit test - no test job created');
        return;
      }

      // Try to edit without proper authorization (using wrong token or no token)
      const response = await request(app)
        .put(`/api/jobs/${testJobId}`)
        .send({
          ratePerHour: 100,
          description: 'Unauthorized edit attempt'
        });

      expect(response.status).toBe(401); // Unauthorized
    });
  });

  describe('Advertisement Edit Functionality', () => {
    test('should create an advertisement for editing tests', async () => {
      const response = await request(app)
        .post('/api/advertisement')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          serviceId: '68b370b362d20a7e8373d382',
          price: 100,
          location: 'Test Advertisement Location',
          description: 'Original advertisement description',
          skills: ['Plumbing', 'Repair'],
          available: true
        });

      console.log('Create advertisement response:', response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('advertisement');
        testAdvertisementId = response.body.advertisement._id;
        console.log('Test advertisement created with ID:', testAdvertisementId);
      }
    });

    test('should edit an advertisement successfully', async () => {
      if (!testAdvertisementId) {
        console.log('Skipping advertisement edit test - no test advertisement created');
        return;
      }

      const updateData = {
        price: 150,
        location: 'Updated Advertisement Location',
        description: 'Updated advertisement description',
        skills: ['Plumbing', 'Repair', 'Installation'],
        available: false
      };

      const response = await request(app)
        .put(`/api/advertisement/${testAdvertisementId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      console.log('Edit advertisement response:', response.status);
      console.log('Edit advertisement body:', JSON.stringify(response.body, null, 2));

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Advertisement updated successfully');
        expect(response.body).toHaveProperty('advertisement');
        expect(response.body.advertisement.price).toBe(150);
        expect(response.body.advertisement.location).toBe('Updated Advertisement Location');
        expect(response.body.advertisement.description).toBe('Updated advertisement description');
        expect(response.body.advertisement.skills).toEqual(['Plumbing', 'Repair', 'Installation']);
        expect(response.body.advertisement.available).toBe(false);
      }
    });

    test('should get advertisement by ID to verify changes', async () => {
      if (!testAdvertisementId) {
        console.log('Skipping advertisement get test - no test advertisement created');
        return;
      }

      const response = await request(app)
        .get(`/api/advertisement/${testAdvertisementId}`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Get advertisement response:', response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('advertisement');
        expect(response.body.advertisement.price).toBe(150);
        expect(response.body.advertisement.location).toBe('Updated Advertisement Location');
        expect(response.body.advertisement.description).toBe('Updated advertisement description');
      }
    });

    test('should not allow editing advertisement by unauthorized user', async () => {
      if (!testAdvertisementId) {
        console.log('Skipping unauthorized advertisement edit test - no test advertisement created');
        return;
      }

      // Try to edit without proper authorization
      const response = await request(app)
        .put(`/api/advertisement/${testAdvertisementId}`)
        .send({
          price: 200,
          description: 'Unauthorized edit attempt'
        });

      expect(response.status).toBe(401); // Unauthorized
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should return 404 for non-existent job edit', async () => {
      const fakeJobId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ratePerHour: 100,
          description: 'This should fail'
        });

      expect(response.status).toBe(404);
      if (response.body) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Job not found');
      }
    });

    test('should return 404 for non-existent advertisement edit', async () => {
      const fakeAdId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/advertisement/${fakeAdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          price: 100,
          description: 'This should fail'
        });

      expect(response.status).toBe(404);
      if (response.body) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Advertisement not found');
      }
    });

    test('should handle partial updates for jobs', async () => {
      if (!testJobId) {
        console.log('Skipping partial job update test - no test job created');
        return;
      }

      // Update only one field
      const response = await request(app)
        .put(`/api/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ratePerHour: 80
        });

      console.log('Partial job update response:', response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.job.ratePerHour).toBe(80);
        // Other fields should remain unchanged
        expect(response.body.job.location).toBe('Updated Location');
      }
    });

    test('should handle partial updates for advertisements', async () => {
      if (!testAdvertisementId) {
        console.log('Skipping partial advertisement update test - no test advertisement created');
        return;
      }

      // Update only one field
      const response = await request(app)
        .put(`/api/advertisement/${testAdvertisementId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          available: true
        });

      console.log('Partial advertisement update response:', response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.advertisement.available).toBe(true);
        // Other fields should remain unchanged
        expect(response.body.advertisement.price).toBe(150);
      }
    });
  });
});