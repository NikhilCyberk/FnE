const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
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
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password (minimum 6 characters)
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *                 description: User's last name
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 description: User's phone number
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: User's date of birth
 *               timezone:
 *                 type: string
 *                 default: UTC
 *                 description: User's timezone
 *               preferredCurrency:
 *                 type: string
 *                 pattern: '^[A-Z]{3}$'
 *                 default: INR
 *                 description: User's preferred currency (3-letter ISO code)
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
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
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account temporarily locked
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 timezone:
 *                   type: string
 *                 preferredCurrency:
 *                   type: string
 *                 locale:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authMiddleware, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
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
 *                 maxLength: 100
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *                 description: User's last name
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 description: User's phone number
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: User's date of birth
 *               timezone:
 *                 type: string
 *                 description: User's timezone
 *               preferredCurrency:
 *                 type: string
 *                 pattern: '^[A-Z]{3}$'
 *                 description: User's preferred currency (3-letter ISO code)
 *               locale:
 *                 type: string
 *                 description: User's locale preference
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 timezone:
 *                   type: string
 *                 preferredCurrency:
 *                   type: string
 *                 locale:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router; 