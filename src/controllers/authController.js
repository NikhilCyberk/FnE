const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// WARNING: Do not use the default JWT secret in production. Always set a strong JWT_SECRET in your environment variables.

// Simple input validation helper
function isValidEmail(email) {
  return typeof email === 'string' && email.includes('@') && email.length <= 255;
}
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    if (!isValidEmail(email) || !isValidPassword(password)) {
      return res.status(400).json({ error: 'Valid email and password (min 6 chars) are required.' });
    }
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5)',
      [email, hashedPassword, firstName, lastName, phone]
    );
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !isValidPassword(password)) {
      return res.status(400).json({ error: 'Valid email and password (min 6 chars) are required.' });
    }
    const userResult = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
}; 