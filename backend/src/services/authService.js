const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const logger = require('../logger');
const { isValidEmail, isValidPassword, isValidName } = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

class AuthService {
  async register(userData) {
    const { email, password, firstName, lastName, phone, dateOfBirth, timezone, preferredCurrency } = userData;
    
    // Validate input
    if (!isValidEmail(email) || !isValidPassword(password) || !isValidName(firstName) || !isValidName(lastName)) {
      throw new Error('Valid email, password (min 6 chars), first name, and last name are required.');
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      throw new Error('User already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const result = await pool.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, phone, 
        date_of_birth, timezone, preferred_currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, first_name, last_name`,
      [
        email, 
        hashedPassword, 
        firstName, 
        lastName, 
        phone || null,
        dateOfBirth || null,
        timezone || 'UTC',
        preferredCurrency || 'INR'
      ]
    );

    const newUser = result.rows[0];
    logger.info('Register success', { userId: newUser.id });
    
    // Generate JWT token
    const token = this.generateToken(newUser);
    
    return {
      message: 'User registered successfully.',
      token,
      user: this.sanitizeUser(newUser)
    };
  }

  async login(credentials) {
    const { email, password } = credentials;
    
    // Validate input
    if (!isValidEmail(email) || !isValidPassword(password)) {
      throw new Error('Valid email and password (min 6 chars) are required.');
    }

    // Find user
    const userResult = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, is_active, failed_login_attempts, account_locked_until FROM users WHERE email = $1', 
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid credentials.');
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.account_locked_until && new Date() < user.account_locked_until) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    // Check if account is active
    if (!user.is_active) {
      throw new Error('Account is deactivated.');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      await this.handleFailedLogin(user);
      throw new Error('Invalid credentials.');
    }

    // Reset failed login attempts on successful login
    await this.resetFailedLoginAttempts(user.id);

    const token = this.generateToken(user);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  async getProfile(userId) {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, date_of_birth, timezone, preferred_currency, locale, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found.');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      timezone: user.timezone,
      preferredCurrency: user.preferred_currency,
      locale: user.locale,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    };
  }

  async updateProfile(userId, updateData) {
    const { firstName, lastName, phone, dateOfBirth, timezone, preferredCurrency, locale } = updateData;

    // Validate input
    if (!isValidName(firstName) || !isValidName(lastName)) {
      throw new Error('Valid first name and last name are required.');
    }

    const result = await pool.query(
      `UPDATE users SET 
        first_name = $1, last_name = $2, phone = $3, date_of_birth = $4, 
        timezone = $5, preferred_currency = $6, locale = $7 
       WHERE id = $8 RETURNING *`,
      [firstName, lastName, phone, dateOfBirth, timezone, preferredCurrency, locale, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found.');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      timezone: user.timezone,
      preferredCurrency: user.preferred_currency,
      locale: user.locale,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    };
  }

  async changePassword(userId, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    if (!isValidPassword(newPassword)) {
      throw new Error('New password must be at least 6 characters long.');
    }

    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found.');
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!valid) {
      throw new Error('Current password is incorrect.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    return { message: 'Password changed successfully.' };
  }

  generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    };
  }

  async handleFailedLogin(user) {
    const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
    let lockUntil = null;
    
    if (newFailedAttempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }

    await pool.query(
      'UPDATE users SET failed_login_attempts = $1, account_locked_until = $2 WHERE id = $3',
      [newFailedAttempts, lockUntil, user.id]
    );
  }

  async resetFailedLoginAttempts(userId) {
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token.');
    }
  }
}

module.exports = new AuthService();
