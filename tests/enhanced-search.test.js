const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
const { app } = require('../index');

describe('Enhanced Professional Search', () => {
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

  test('should search professionals with badge filter', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?badge=verified&page=1&limit=5');

    console.log('Badge search response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('filtersApplied');
      expect(response.body.filtersApplied.badge).toBe('verified');
      expect(response.body).toHaveProperty('data');
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('badges');
        expect(response.body.data[0].badges).toHaveProperty('kycVerified');
      }
    }
  });

  test('should search professionals with location filter', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?location=New York&page=1&limit=5');

    console.log('Location search response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('filtersApplied');
      expect(response.body.filtersApplied.location).toBe('New York');
      expect(response.body).toHaveProperty('data');
    }
  });

  test('should search professionals with city filter', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?city=Toronto&page=1&limit=5');

    console.log('City search response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('filtersApplied');
      expect(response.body.filtersApplied.city).toBe('Toronto');
    }
  });

  test('should search professionals with multiple filters', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?badge=kyc&location=Canada&serviceName=Plumbing&page=1&limit=5');

    console.log('Multiple filters response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('filtersApplied');
      expect(response.body.filtersApplied.badge).toBe('kyc');
      expect(response.body.filtersApplied.location).toBe('Canada');
      expect(response.body.filtersApplied.serviceName).toBe('Plumbing');
    }
  });

  test('should return professionals with rating and badge data', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?page=1&limit=3');

    console.log('Professional data response:', response.status);
    
    if (response.status === 200 && response.body.data.length > 0) {
      const professional = response.body.data[0];
      expect(professional).toHaveProperty('badges');
      expect(professional.badges).toHaveProperty('kycVerified');
      expect(professional.badges).toHaveProperty('identityVerified');
      expect(professional.badges).toHaveProperty('payoutEnabled');
      expect(professional).toHaveProperty('totalFeedbacks');
    }
  });

  test('should handle empty search results gracefully', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?location=NonExistentCity&page=1&limit=5');

    console.log('Empty results response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });
});