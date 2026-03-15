const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const logger = require('../logger');
const asyncHandler = require('../middleware/asyncHandler');
const { isValidEmail, isValidPassword, isValidName } = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

exports.register = asyncHandler(async (req, res) => {
  logger.info('Register request', { body: req.body });
    const { email, password, firstName, lastName, phone, dateOfBirth, timezone, preferredCurrency } = req.body;
    
    if (!isValidEmail(email) || !isValidPassword(password) || !isValidName(firstName) || !isValidName(lastName)) {
      return res.status(400).json({ error: 'Valid email, password (min 6 chars), first name, and last name are required.' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
    
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
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name
      }
  });
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!isValidEmail(email) || !isValidPassword(password)) {
      return res.status(400).json({ error: 'Valid email and password (min 6 chars) are required.' });
    }

    const userResult = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, is_active, failed_login_attempts, account_locked_until FROM users WHERE email = $1', 
      [email]
    );

    let user;
    if (userResult.rows.length === 0) {
      if (email === 'nikhilkumar7585@gmail.com' && password === '123456') {
        logger.info('Auto-registering demo user');
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUserResult = await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name)
           VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, is_active`,
          [email, hashedPassword, 'Nikhil', 'Kumar']
        );
        const newUser = newUserResult.rows[0];

        // Create default accounts
        const savingsType = await pool.query("SELECT id FROM account_types WHERE name = 'Savings Account'");
        const cashType = await pool.query("SELECT id FROM account_types WHERE name = 'Cash'");

        if (savingsType.rows.length > 0) {
          await pool.query(
            "INSERT INTO accounts (user_id, account_type_id, account_name, balance, currency) VALUES ($1, $2, $3, $4, $5)",
            [newUser.id, savingsType.rows[0].id, 'Savings Account', 10000, 'INR']
          );
        }

        if (cashType.rows.length > 0) {
          await pool.query(
            "INSERT INTO accounts (user_id, account_type_id, account_name, balance, currency) VALUES ($1, $2, $3, $4, $5)",
            [newUser.id, cashType.rows[0].id, 'Cash', 1000, 'INR']
          );
        }

        user = newUser;
      } else {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
    } else {
      user = userResult.rows[0];
    }

    // Check if account is locked
    if (user.account_locked_until && new Date() < user.account_locked_until) {
      return res.status(423).json({ error: 'Account is temporarily locked. Please try again later.' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      // Increment failed login attempts
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;
      
      if (newFailedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await pool.query(
        'UPDATE users SET failed_login_attempts = $1, account_locked_until = $2 WHERE id = $3',
        [newFailedAttempts, lockUntil, user.id]
      );

      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Reset failed login attempts on successful login
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, date_of_birth, timezone, preferred_currency, locale, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
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
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { firstName, lastName, phone, dateOfBirth, timezone, preferredCurrency, locale } = req.body;

    if (!isValidName(firstName) || !isValidName(lastName)) {
      return res.status(400).json({ error: 'Valid first name and last name are required.' });
    }

    const result = await pool.query(
      `UPDATE users SET 
        first_name = $1, last_name = $2, phone = $3, date_of_birth = $4, 
        timezone = $5, preferred_currency = $6, locale = $7 
       WHERE id = $8 RETURNING *`,
      [firstName, lastName, phone, dateOfBirth, timezone, preferredCurrency, locale, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
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
  });
});
