const request = require('supertest');
const app = require('../app');
const { User } = require('../models/user.model');
const { verifyToken } = require('../utils/jwt');

// Mock the User model
jest.mock('../models/user.model');

// Mock jwt utilities
jest.mock('../utils/jwt');

describe('Users Routes', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockAdminId = '507f1f77bcf86cd799439012';
  const mockAnotherUserId = '507f1f77bcf86cd799439013';

  const mockToken = 'Bearer mock.jwt.token';
  const mockAdminToken = 'Bearer mock.admin.jwt.token';
  const mockInvalidToken = 'Bearer invalid.token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        _id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'attendee',
      };

      verifyToken.mockReturnValue({ userId: mockUserId, role: 'attendee' });
      // First call for authentication middleware
      User.findById.mockResolvedValueOnce({ _id: mockUserId, role: 'attendee' });
      // Second call for the actual controller logic
      User.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const response = await request(app).get('/api/v1/users/me').set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        _id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'attendee',
      });
      expect(verifyToken).toHaveBeenCalledWith('mock.jwt.token');
    });

    it('should return 401 if no authorization header', async () => {
      const response = await request(app).get('/api/v1/users/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authorization required');
    });

    it('should return 401 if token is invalid', async () => {
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', mockInvalidToken);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });

    it('should return 401 if user not found in database', async () => {
      verifyToken.mockReturnValue({ userId: mockUserId, role: 'attendee' });
      User.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/users/me').set('Authorization', mockToken);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token (user not found)');
    });

    it('should return 404 if user profile not found', async () => {
      verifyToken.mockReturnValue({ userId: mockUserId, role: 'attendee' });
      User.findById.mockResolvedValueOnce({ _id: mockUserId, role: 'attendee' });
      User.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app).get('/api/v1/users/me').set('Authorization', mockToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated list of users for admin', async () => {
      const mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@example.com', role: 'attendee' },
        { _id: '2', name: 'User 2', email: 'user2@example.com', role: 'organizer' },
      ];

      verifyToken.mockReturnValue({ userId: mockAdminId, role: 'admin' });
      User.findById.mockResolvedValue({ _id: mockAdminId, role: 'admin' });
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });
      User.countDocuments.mockResolvedValue(2);

      const response = await request(app).get('/api/v1/users').set('Authorization', mockAdminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
      });
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
    });

    it('should handle pagination parameters correctly', async () => {
      const mockUsers = [{ _id: '1', name: 'User 1', email: 'user1@example.com' }];

      verifyToken.mockReturnValue({ userId: mockAdminId, role: 'admin' });
      User.findById.mockResolvedValue({ _id: mockAdminId, role: 'admin' });
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });
      User.countDocuments.mockResolvedValue(50);

      const response = await request(app)
        .get('/api/v1/users?page=2&limit=10')
        .set('Authorization', mockAdminToken);

      expect(response.status).toBe(200);
      expect(response.body.meta).toMatchObject({
        page: 2,
        limit: 10,
        total: 50,
      });
    });

    it('should return 401 if no authorization header', async () => {
      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authorization required');
    });

    it('should return 403 if user is not admin', async () => {
      verifyToken.mockReturnValue({ userId: mockUserId, role: 'attendee' });
      User.findById.mockResolvedValue({ _id: mockUserId, role: 'attendee' });

      const response = await request(app).get('/api/v1/users').set('Authorization', mockToken);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Forbidden: insufficient role');
    });

    it('should handle default pagination values', async () => {
      const mockUsers = [];

      verifyToken.mockReturnValue({ userId: mockAdminId, role: 'admin' });
      User.findById.mockResolvedValue({ _id: mockAdminId, role: 'admin' });
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });
      User.countDocuments.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/users').set('Authorization', mockAdminToken);

      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(20);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id for admin', async () => {
      const mockUser = {
        _id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'attendee',
      };

      verifyToken.mockReturnValue({ userId: mockAdminId, role: 'admin' });
      User.findById.mockResolvedValueOnce({ _id: mockAdminId, role: 'admin' });
      User.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const response = await request(app)
        .get(`/api/v1/users/${mockUserId}`)
        .set('Authorization', mockAdminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject(mockUser);
    });

    it('should allow user to access their own profile', async () => {
      const mockUser = {
        _id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'attendee',
      };

      verifyToken.mockReturnValue({ userId: mockUserId, role: 'attendee' });
      User.findById.mockResolvedValueOnce({ _id: mockUserId, role: 'attendee' });
      User.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const response = await request(app)
        .get(`/api/v1/users/${mockUserId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user._id).toBe(mockUserId);
    });

    it('should return 403 if non-admin tries to access another user', async () => {
      verifyToken.mockReturnValue({ userId: mockUserId, role: 'attendee' });
      User.findById.mockResolvedValue({ _id: mockUserId, role: 'attendee' });

      const response = await request(app)
        .get(`/api/v1/users/${mockAnotherUserId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Forbidden: insufficient role');
    });

    it('should return 404 if user not found', async () => {
      verifyToken.mockReturnValue({ userId: mockAdminId, role: 'admin' });
      User.findById.mockResolvedValueOnce({ _id: mockAdminId, role: 'admin' });
      User.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app)
        .get(`/api/v1/users/${mockUserId}`)
        .set('Authorization', mockAdminToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 401 if no authorization header', async () => {
      const response = await request(app).get(`/api/v1/users/${mockUserId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authorization required');
    });

    it('should return 401 if token is invalid', async () => {
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get(`/api/v1/users/${mockUserId}`)
        .set('Authorization', mockInvalidToken);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });

    it('should handle database errors', async () => {
      verifyToken.mockReturnValue({ userId: mockAdminId, role: 'admin' });
      User.findById.mockResolvedValueOnce({ _id: mockAdminId, role: 'admin' });
      User.findById.mockReturnValueOnce({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const response = await request(app)
        .get(`/api/v1/users/${mockUserId}`)
        .set('Authorization', mockAdminToken);

      expect(response.status).toBe(500);
    });
  });
});
