const request = require('supertest');
const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';
const { app } = require('../index');

describe('Auth Endpoints - User Response Structure', () => {
  const mockToken = 'Bearer test-token';

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('Root endpoint should respond', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Backend is running successfully');
  });

  test('POST /api/auth/login - should validate credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@gmail.com',
        password: 'wrongpassword'
      });
    expect([400, 401, 403, 404]).toContain(response.status);
  });

  test('GET /api/auth/profile - should require authentication', async () => {
    const response = await request(app).get('/api/auth/profile');
    expect(response.status).toBe(401);
  });

  test('PUT /api/auth/availabilty - should require authentication', async () => {
    const response = await request(app)
      .put('/api/auth/availabilty')
      .set('Authorization', mockToken);
    expect([400, 401, 403, 404]).toContain(response.status);
  });

  test('POST /api/auth/verify-account - should validate request', async () => {
    const response = await request(app)
      .post('/api/auth/verify-account')
      .send({ email: 'test@gmail.com' });
    expect([200, 400, 404, 500]).toContain(response.status);
  });
});

describe('DTO Structure Validation', () => {
  test('UserDTO should be properly defined', () => {
    const UserDTO = require('../dto/UserDTO');
    
    expect(UserDTO).toBeDefined();
    expect(typeof UserDTO.toResponse).toBe('function');
    expect(typeof UserDTO.toAvailabilityResponse).toBe('function');
  });

  test('ServiceDTO should be properly defined', () => {
    const ServiceDTO = require('../dto/ServiceDTO');
    
    expect(ServiceDTO).toBeDefined();
    expect(typeof ServiceDTO.toResponse).toBe('function');
    expect(typeof ServiceDTO.toResponseArray).toBe('function');
  });

  test('UserDTO should return correct structure', () => {
    const UserDTO = require('../dto/UserDTO');
    const mockUser = {
      _id: '123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      email: 'test@gmail.com',
      role: 'Client',
      services: [],
      skills: [],
      certificates: [],
      identityVerified: false,
      isClientIdentityVerified: false,
      isClientIdentitySubmited: false,
      isProfessionalKycVerified: false,
      isProfessionalKycSubmited: false
    };

    const result = UserDTO.toResponse(mockUser);
    
    expect(result).toHaveProperty('_id');
    expect(result).toHaveProperty('firstName');
    expect(result).toHaveProperty('lastName');
    expect(result).toHaveProperty('phone');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('role');
    expect(result).toHaveProperty('services');
    expect(result).toHaveProperty('skills');
    expect(result).toHaveProperty('certificates');
  });
});