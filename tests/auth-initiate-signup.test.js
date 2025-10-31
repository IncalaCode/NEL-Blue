const request = require('supertest');
const express = require('express');

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.EMAIL_FROM = 'test@example.com';
process.env.accessTokenSecret = 'test_access_secret';
process.env.refreshTokenSecret = 'test_refresh_secret';

// Mock dependencies
jest.mock('../Models/User.model');
jest.mock('../Middleware/Redis');
jest.mock('../config/brevo');
jest.mock('../utils/emailTemplates');
jest.mock('stripe', () => {
  return jest.fn(() => ({
    identity: {
      verificationSessions: {
        create: jest.fn()
      }
    }
  }));
});

const { initiateSignup } = require('../Controller/Auth.controller');

const User = require('../Models/User.model');
const redis = require('../Middleware/Redis');
const transporter = require('../config/nodemailer');

// Create Express app for testing
const app = express();
app.use(express.json());
app.post('/initiate-signup', initiateSignup);

describe('initiateSignup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully initiate signup for Client', async () => {
    // Mock User.findOne to return null (user doesn't exist)
    User.findOne.mockResolvedValue(null);
    
    // Mock transporter.sendMail
    transporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
    
    // Mock redis.set
    redis.set.mockResolvedValue('OK');

    const clientData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'password123',
      role: 'Client',
      country: 'USA'
    };

    const response = await request(app)
      .post('/initiate-signup')
      .send(clientData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Verification code sent successfully');
    expect(User.findOne).toHaveBeenCalledWith({ email: 'john@gmail.com' });
    expect(transporter.sendMail).toHaveBeenCalled();
    expect(redis.set).toHaveBeenCalled();
  });

  it('should fail when user already exists', async () => {
    // Mock User.findOne to return existing user
    User.findOne.mockResolvedValue({ email: 'existing@gmail.com' });

    const userData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'existing@gmail.com',
      password: 'password123',
      role: 'Client'
    };

    const response = await request(app)
      .post('/initiate-signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User already exists');
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it('should fail for Professional without certificates', async () => {
    User.findOne.mockResolvedValue(null);

    const professionalData = {
      firstName: 'Pro',
      lastName: 'User',
      email: 'pro@gmail.com',
      password: 'password123',
      role: 'Professional'
    };

    const response = await request(app)
      .post('/initiate-signup')
      .send(professionalData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Certificates are required for professional users');
  });

  it('should handle email sending failure', async () => {
    User.findOne.mockResolvedValue(null);
    transporter.sendMail.mockRejectedValue(new Error('Email service down'));

    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'Client'
    };

    const response = await request(app)
      .post('/initiate-signup')
      .send(userData);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Something went wrong');
  });

  it('should handle Redis failure', async () => {
    User.findOne.mockResolvedValue(null);
    transporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
    redis.set.mockRejectedValue(new Error('Redis connection failed'));

    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'Client'
    };

    const response = await request(app)
      .post('/initiate-signup')
      .send(userData);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Something went wrong');
  });
});