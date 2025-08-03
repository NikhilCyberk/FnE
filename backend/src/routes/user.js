const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
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
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user profile
 *     tags: [User]
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
 *               avatarUrl:
 *                 type: string
 *                 description: URL to user's avatar image
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
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

/**
 * @swagger
 * /api/user/deactivate:
 *   delete:
 *     summary: Deactivate user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/deactivate', userController.deactivateAccount);

module.exports = router; 