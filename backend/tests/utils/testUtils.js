const request = require('supertest');
const app = require('../../src/server');
const { Pool } = require('pg');

// Test database configuration
const testDbConfig = {
  user: process.env.TEST_DB_USER || 'fneuser',
  host: process.env.TEST_DB_HOST || 'localhost',
  database: process.env.TEST_DB_NAME || 'fnetest',
  password: process.env.TEST_DB_PASSWORD || 'fnepassword',
  port: process.env.TEST_DB_PORT || 5432,
};

// Test database pool
const testPool = new Pool(testDbConfig);

// Test utilities
const testUtils = {
  // Clean database before/after tests
  async cleanDatabase() {
    await testPool.query('TRUNCATE TABLE users, accounts, transactions, categories, budgets RESTART IDENTITY CASCADE');
  },

  // Create test user
  async createTestUser(userData = {}) {
    const defaultUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '1234567890',
      timezone: 'UTC',
      preferredCurrency: 'INR'
    };

    const result = await testPool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, timezone, preferred_currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      Object.values({ ...defaultUser, ...userData })
    );

    return result.rows[0];
  },

  // Create test account
  async createTestAccount(userId, accountData = {}) {
    const defaultAccount = {
      userId,
      name: 'Test Account',
      type: 'savings',
      balance: 1000,
      accountNumber: '1234567890',
      currency: 'INR'
    };

    const result = await testPool.query(
      `INSERT INTO accounts (user_id, name, type, balance, account_number, currency)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      Object.values({ ...defaultAccount, ...accountData })
    );

    return result.rows[0];
  },

  // Create test transaction
  async createTestTransaction(accountId, transactionData = {}) {
    const defaultTransaction = {
      accountId,
      description: 'Test Transaction',
      amount: 100,
      type: 'expense',
      categoryId: 'test-category-id',
      date: new Date().toISOString()
    };

    const result = await testPool.query(
      `INSERT INTO transactions (account_id, description, amount, type, category_id, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      Object.values({ ...defaultTransaction, ...transactionData })
    );

    return result.rows[0];
  },

  // Generate JWT token for testing
  generateTestToken(user) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  },

  // Make authenticated request
  async authenticatedRequest(method, url, data = null, token = null) {
    let req = request(app)[method.toLowerCase()](url);
    
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    if (data) {
      req.send(data);
    }
    
    return req;
  },

  // Expect error response
  expectErrorResponse(response, statusCode, expectedError) {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('error');
    if (expectedError) {
      expect(response.body.error).toContain(expectedError);
    }
  },

  // Expect success response
  expectSuccessResponse(response, statusCode = 200, expectedData = null) {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', true);
    if (expectedData) {
      expect(response.body.data).toMatchObject(expectedData);
    }
  }
};

// Global test setup and teardown
const setupTestDatabase = async () => {
  try {
    await testUtils.cleanDatabase();
    console.log('Test database cleaned and ready');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    process.exit(1);
  }
};

const teardownTestDatabase = async () => {
  try {
    await testPool.end();
    console.log('Test database connections closed');
  } catch (error) {
    console.error('Failed to teardown test database:', error);
  }
};

// Mock data factories
const mockData = {
  user: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
    timezone: 'UTC',
    preferredCurrency: 'INR',
    ...overrides
  }),

  account: (overrides = {}) => ({
    name: 'Test Account',
    type: 'savings',
    balance: 1000,
    accountNumber: '1234567890',
    currency: 'INR',
    ...overrides
  }),

  transaction: (overrides = {}) => ({
    description: 'Test Transaction',
    amount: 100,
    type: 'expense',
    categoryId: 'test-category-id',
    date: new Date().toISOString(),
    ...overrides
  }),

  category: (overrides = {}) => ({
    name: 'Test Category',
    type: 'expense',
    color: '#FF5733',
    ...overrides
  }),

  budget: (overrides = {}) => ({
    name: 'Test Budget',
    amount: 1000,
    categoryId: 'test-category-id',
    period: 'monthly',
    startDate: new Date().toISOString(),
    ...overrides
  })
};

// Test assertions
const assertions = {
  // Validate user response
  expectUserResponse(response, user) {
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(user.email);
    expect(response.body.data.firstName).toBe(user.firstName);
    expect(response.body.data.lastName).toBe(user.lastName);
    expect(response.body.data).not.toHaveProperty('password_hash');
  },

  // Validate account response
  expectAccountResponse(response, account) {
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(account.name);
    expect(response.body.data.type).toBe(account.type);
    expect(response.body.data.balance).toBe(account.balance);
  },

  // Validate transaction response
  expectTransactionResponse(response, transaction) {
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.description).toBe(transaction.description);
    expect(response.body.data.amount).toBe(transaction.amount);
    expect(response.body.data.type).toBe(transaction.type);
  },

  // Validate pagination response
  expectPaginationResponse(response, expectedPage = 1, expectedLimit = 10) {
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page', expectedPage);
    expect(response.body.pagination).toHaveProperty('limit', expectedLimit);
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('totalPages');
  }
};

module.exports = {
  testPool,
  testUtils,
  setupTestDatabase,
  teardownTestDatabase,
  mockData,
  assertions
};
