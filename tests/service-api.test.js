const request = require('supertest');
const { app } = require('../index');

describe('Service API - GET /api/service/getAllServices', () => {
  test('should return services array with correct structure', async () => {
    const response = await request(app)
      .get('/api/service/getAllServices');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      const service = response.body[0];
      
      // Check all required fields exist
      expect(service).toHaveProperty('_id');
      expect(service).toHaveProperty('serviceName');
      expect(service).toHaveProperty('category');
      expect(service).toHaveProperty('price');
      
      // Check price object structure
      expect(service.price).toHaveProperty('min');
      expect(service.price).toHaveProperty('max');
      expect(typeof service.price.min).toBe('number');
      expect(typeof service.price.max).toBe('number');
      
      // Check no extra fields
      const expectedKeys = ['_id', 'serviceName', 'category', 'price'];
      const actualKeys = Object.keys(service);
      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    }
  });
});
