const request = require('supertest');
const { app } = require('../index');
const UserDTO = require('../dto/UserDTO');
const ServiceDTO = require('../dto/ServiceDTO');

describe('DTO Response Validation', () => {
  let authToken;
  let testUserId;

  // Helper to compare objects
  const compareObjects = (actual, expected, path = '') => {
    const errors = [];
    
    // Check for extra fields in actual
    Object.keys(actual).forEach(key => {
      if (!(key in expected)) {
        errors.push(`Extra field at ${path}${key}`);
      }
    });
    
    // Check for missing fields and type mismatches
    Object.keys(expected).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      
      if (!(key in actual)) {
        errors.push(`Missing field: ${fullPath}`);
      } else if (actual[key] !== null && expected[key] !== null) {
        const actualType = Array.isArray(actual[key]) ? 'array' : typeof actual[key];
        const expectedType = Array.isArray(expected[key]) ? 'array' : typeof expected[key];
        
        if (actualType !== expectedType) {
          errors.push(`Type mismatch at ${fullPath}: expected ${expectedType}, got ${actualType}`);
        } else if (actualType === 'object' && !Array.isArray(actual[key])) {
          errors.push(...compareObjects(actual[key], expected[key], `${fullPath}.`));
        }
      }
    });
    
    return errors;
  };

  describe('UserDTO Validation', () => {
    test('Login response matches UserDTO.toResponse()', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      if (response.status === 200 && response.body.user) {
        const mockUser = {
          _id: 'test',
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
          email: 'test@example.com',
          role: 'Client',
          services: [],
          availabilty: 'Available',
          bio: null,
          skills: null,
          yearsOfExperience: null,
          hourlyRate: null,
          certificates: null,
          identityVerified: false,
          isClientIdentityVerified: false,
          isClientIdentitySubmited: false,
          isProfessionalKycVerified: false,
          isProfessionalKycSubmited: false
        };

        const dtoStructure = UserDTO.toResponse(mockUser);
        const errors = compareObjects(response.body.user, dtoStructure);
        
        if (errors.length > 0) {
          console.log('DTO Structure:', Object.keys(dtoStructure));
          console.log('API Response:', Object.keys(response.body.user));
          console.log('Errors:', errors);
        }
        
        expect(errors).toEqual([]);
      }
    });

    test('Get profile response matches UserDTO.toResponse()', async () => {
      // First login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      if (loginRes.status === 200) {
        authToken = loginRes.body.token;
        
        const response = await request(app)
          .get('/api/mechanic/profile')
          .set('Authorization', `Bearer ${authToken}`);

        if (response.status === 200) {
          const mockUser = {
            _id: 'test',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            email: 'test@example.com',
            role: 'Client',
            services: [],
            availabilty: 'Available',
            bio: null,
            skills: null,
            yearsOfExperience: null,
            hourlyRate: null,
            certificates: null,
            identityVerified: false,
            isClientIdentityVerified: false,
            isClientIdentitySubmited: false,
            isProfessionalKycVerified: false,
            isProfessionalKycSubmited: false
          };

          const dtoStructure = UserDTO.toResponse(mockUser);
          const errors = compareObjects(response.body, dtoStructure);
          
          if (errors.length > 0) {
            console.log('DTO Structure:', Object.keys(dtoStructure));
            console.log('API Response:', Object.keys(response.body));
            console.log('Errors:', errors);
          }
          
          expect(errors).toEqual([]);
        }
      }
    });

    test('Toggle availability response matches UserDTO.toAvailabilityResponse()', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'professional@example.com',
          password: 'password123'
        });

      if (loginRes.status === 200) {
        authToken = loginRes.body.token;
        
        const response = await request(app)
          .put('/api/auth/availabilty')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ availabilty: 'Available' });

        if (response.status === 200) {
          const mockUser = {
            _id: 'test',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            email: 'test@example.com',
            role: 'Professional',
            services: [],
            availabilty: 'Available',
            bio: null,
            skills: null,
            yearsOfExperience: null,
            hourlyRate: null,
            certificates: null,
            identityVerified: false,
            isClientIdentityVerified: false,
            isClientIdentitySubmited: false,
            isProfessionalKycVerified: false,
            isProfessionalKycSubmited: false,
            specialization: null
          };

          const dtoStructure = UserDTO.toAvailabilityResponse(mockUser);
          const errors = compareObjects(response.body.user, dtoStructure);
          
          if (errors.length > 0) {
            console.log('DTO Structure:', Object.keys(dtoStructure));
            console.log('API Response:', Object.keys(response.body.user));
            console.log('Errors:', errors);
          }
          
          expect(errors).toEqual([]);
        }
      }
    });
  });

  describe('ServiceDTO Validation', () => {
    test('Service response matches ServiceDTO.toResponse()', async () => {
      const response = await request(app)
        .get('/api/service');

      if (response.status === 200 && response.body.length > 0) {
        const mockService = {
          _id: 'test',
          serviceName: 'Test Service',
          category: 'Test Category',
          price: { min: 50, max: 100 }
        };

        const dtoStructure = ServiceDTO.toResponse(mockService);
        const errors = compareObjects(response.body[0], dtoStructure);
        
        if (errors.length > 0) {
          console.log('DTO Structure:', dtoStructure);
          console.log('API Response:', response.body[0]);
          console.log('Errors:', errors);
        }
        
        expect(errors).toEqual([]);
      }
    });
  });
});
