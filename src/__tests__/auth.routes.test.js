const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { User } = require('../models/user.model');
const { signToken } = require('../utils/jwt');

// Mock the User model
jest.mock('../models/user.model');

// Mock bcryptjs
jest.mock('bcryptjs');

// Mock jwt utilities
jest.mock('../utils/jwt');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'attendee',
        toJSON: function () {
          return { _id: this._id, name: this.name, email: this.email, role: this.role };
        },
      };

      const mockToken = 'mock.jwt.token';

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('hashed_password');
      signToken.mockReturnValue(mockToken);

      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: 'attendee',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token', mockToken);
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(User.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed_password',
        role: 'attendee',
      });
      expect(signToken).toHaveBeenCalledWith({
        userId: mockUser._id,
        role: mockUser.role,
      });
    });

    it('should return 409 if email already exists', async () => {
      const existingUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
      };

      User.findOne.mockResolvedValue(existingUser);

      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message', 'Email already in use.');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'john@example.com',
        // missing name and password
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should handle database errors during registration', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));
      bcrypt.hash.mockResolvedValue('hashed_password');

      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed_password',
        role: 'attendee',
        toJSON: function () {
          return { _id: this._id, name: this.name, email: this.email, role: this.role };
        },
      };

      const mockToken = 'mock.jwt.token';

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      signToken.mockReturnValue(mockToken);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token', mockToken);
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashed_password');
      expect(signToken).toHaveBeenCalledWith({
        userId: mockUser._id,
        role: mockUser.role,
      });
    });

    it('should return 401 if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'notfound@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'notfound@example.com' });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return 401 if password is incorrect', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        password: 'hashed_password',
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
      expect(bcrypt.compare).toHaveBeenCalledWith('WrongPassword123!', 'hashed_password');
      expect(signToken).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        // missing password
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'invalid-email',
        password: 'Password123!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should handle database errors during login', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(500);
    });
  });
});
