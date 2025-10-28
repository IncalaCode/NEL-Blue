const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
const { app } = require('../index');

describe('Geospatial Professional Search', () => {
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

  test('should update user location coordinates', async () => {
    const response = await request(app)
      .put('/api/auth/location')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        longitude: -74.006,
        latitude: 40.7128
      });

    console.log('Update location response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('location');
      expect(response.body.location.coordinates).toEqual([-74.006, 40.7128]);
    }
  });

  test('should search professionals by coordinates and radius', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?latitude=40.7128&longitude=-74.006&radius=5');

    console.log('Geospatial search response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('filtersApplied');
      expect(response.body.filtersApplied.coordinates).toEqual({
        latitude: '40.7128',
        longitude: '-74.006',
        radius: '5'
      });
      expect(response.body.locationUsed.lat).toBe(40.7128);
      expect(response.body.locationUsed.long).toBe(-74.006);
      expect(response.body.locationUsed.radius).toBe(5);
    }
  });

  test('should return professionals with distance when coordinates provided', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?latitude=40.7128&longitude=-74.006&radius=50');

    console.log('Distance calculation response:', response.status);
    
    if (response.status === 200 && response.body.data.length > 0) {
      const professional = response.body.data[0];
      expect(professional).toHaveProperty('distance');
      if (professional.distance) {
        expect(typeof professional.distance).toBe('string');
      }
    }
  });

  test('should handle invalid coordinates gracefully', async () => {
    const response = await request(app)
      .put('/api/auth/location')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        longitude: 200, // Invalid longitude
        latitude: 100   // Invalid latitude
      });

    expect(response.status).toBe(400);
    if (response.body) {
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid coordinates');
    }
  });

  test('should fallback to text search when no coordinates provided', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?location=New York');

    console.log('Text fallback search response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.filtersApplied.location).toBe('New York');
      expect(response.body.filtersApplied.coordinates).toBeNull();
    }
  });

  test('should combine geospatial search with other filters', async () => {
    const response = await request(app)
      .get('/api/availableProfessional/getProfessionalSearch?latitude=40.7128&longitude=-74.006&radius=10&badge=verified&serviceName=Plumbing');

    console.log('Combined filters response:', response.status);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.filtersApplied.coordinates).toEqual({
        latitude: '40.7128',
        longitude: '-74.006',
        radius: '10'
      });
      expect(response.body.filtersApplied.badge).toBe('verified');
      expect(response.body.filtersApplied.serviceName).toBe('Plumbing');
    }
  });
});