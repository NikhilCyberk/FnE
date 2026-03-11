const authService = require('../services/authService');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../logger');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               timezone:
 *                 type: string
 *               preferredCurrency:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 */
exports.register = asyncHandler(async (req, res) => {
  logger.info('Register request', { body: req.body });
  
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Registration error', { error: error.message, body: req.body });
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    if (error.message.includes('Valid email, password') || error.message.includes('Valid first name')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 */
exports.login = asyncHandler(async (req, res) => {
  logger.info('Login request', { email: req.body.email });
  
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Login error', { error: error.message, email: req.body.email });
    
    if (error.message.includes('Invalid credentials')) {
      return res.status(401).json({ error: error.message });
    }
    
    if (error.message.includes('Account is temporarily locked')) {
      return res.status(423).json({ error: error.message });
    }
    
    if (error.message.includes('Account is deactivated')) {
      return res.status(401).json({ error: error.message });
    }
    
    if (error.message.includes('Valid email, password')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const profile = await authService.getProfile(userId);
    res.json(profile);
  } catch (error) {
    logger.error('Get profile error', { error: error.message, userId });
    
    if (error.message.includes('User not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               timezone:
 *                 type: string
 *               preferredCurrency:
 *                 type: string
 *               locale:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const updatedProfile = await authService.updateProfile(userId, req.body);
    res.json(updatedProfile);
  } catch (error) {
    logger.error('Update profile error', { error: error.message, userId, body: req.body });
    
    if (error.message.includes('User not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Valid first name and last name')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Current password incorrect
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const result = await authService.changePassword(userId, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Change password error', { error: error.message, userId });
    
    if (error.message.includes('User not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Current password is incorrect')) {
      return res.status(401).json({ error: error.message });
    }
    
    if (error.message.includes('New password must be at least')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid token
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  try {
    const user = authService.verifyToken(req.token);
    const token = authService.generateToken(user);
    res.json({ token });
  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});
