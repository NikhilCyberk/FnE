const request = require('supertest');
const { testUtils, mockData, assertions, setupTestDatabase, teardownTestDatabase } = require('../utils/testUtils');

describe('Auth Controller', () => {
  let testUser, authToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await testUtils.cleanDatabase();
    testUser = await testUtils.createTestUser();
    authToken = testUtils.generateTestToken(testUser);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = mockData.user({
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      assertions.expectSuccessResponse(response, 201);
      expect(response.body).toHaveProperty('token');
      assertions.expectUserResponse(response, newUser);
    });

    it('should return 400 for invalid email', async () => {
      const invalidUser = mockData.user({ email: 'invalid-email' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      testUtils.expectErrorResponse(response, 400, 'Valid email');
    });

    it('should return 400 for short password', async () => {
      const invalidUser = mockData.user({ password: '123' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      testUtils.expectErrorResponse(response, 400, 'Password must be at least 6 characters');
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateUser = mockData.user({ email: testUser.email });

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      testUtils.expectErrorResponse(response, 409, 'User already exists');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteUser = { email: 'test@example.com' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser);

      testUtils.expectErrorResponse(response, 400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      assertions.expectSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('token');
      assertions.expectUserResponse(response, testUser);
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'invalid@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      testUtils.expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      testUtils.expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email });

      testUtils.expectErrorResponse(response, 400, 'Valid email and password');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await testUtils.authenticatedRequest(
        'GET',
        '/api/auth/profile',
        null,
        authToken
      );

      assertions.expectSuccessResponse(response, 200);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.firstName).toBe(testUser.first_name);
      expect(response.body.data.lastName).toBe(testUser.last_name);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      testUtils.expectErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '9876543210'
      };

      const response = await testUtils.authenticatedRequest(
        'PUT',
        '/api/auth/profile',
        updateData,
        authToken
      );

      assertions.expectSuccessResponse(response, 200);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
      expect(response.body.data.phone).toBe(updateData.phone);
    });

    it('should return 400 for invalid names', async () => {
      const invalidUpdate = {
        firstName: 'A', // Too short
        lastName: 'Valid'
      };

      const response = await testUtils.authenticatedRequest(
        'PUT',
        '/api/auth/profile',
        invalidUpdate,
        authToken
      );

      testUtils.expectErrorResponse(response, 400, 'First name must be between 2 and 50 characters');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await testUtils.authenticatedRequest(
        'POST',
        '/api/auth/change-password',
        passwordData,
        authToken
      );

      assertions.expectSuccessResponse(response, 200);
    });

    it('should return 401 for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await testUtils.authenticatedRequest(
        'POST',
        '/api/auth/change-password',
        passwordData,
        authToken
      );

      testUtils.expectErrorResponse(response, 401, 'Current password is incorrect');
    });

    it('should return 400 for short new password', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: '123' // Too short
      };

      const response = await testUtils.authenticatedRequest(
        'POST',
        '/api/auth/change-password',
        passwordData,
        authToken
      );

      testUtils.expectErrorResponse(response, 400, 'New password must be at least 6 characters');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const response = await testUtils.authenticatedRequest(
        'POST',
        '/api/auth/refresh',
        null,
        authToken
      );

      assertions.expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token');

      testUtils.expectErrorResponse(response, 401, 'Invalid or expired token');
    });
  });
});
