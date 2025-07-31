const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories for the authenticated user
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer]
 *         description: Filter by category type
 *       - in: query
 *         name: includeSystem
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include system categories
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [income, expense, transfer]
 *                       description:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       color:
 *                         type: string
 *                       keywords:
 *                         type: array
 *                         items:
 *                           type: string
 *                       isSystem:
 *                         type: boolean
 *                       isActive:
 *                         type: boolean
 *                       sortOrder:
 *                         type: integer
 *                       groupId:
 *                         type: string
 *                         format: uuid
 *                       groupName:
 *                         type: string
 *                       groupIcon:
 *                         type: string
 *                       groupColor:
 *                         type: string
 *                       parentId:
 *                         type: string
 *                         format: uuid
 *                       parentName:
 *                         type: string
 *                       childCount:
 *                         type: integer
 *                 total:
 *                   type: integer
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Category name
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *                 description: Category type
 *               description:
 *                 type: string
 *                 description: Category description
 *               groupId:
 *                 type: string
 *                 format: uuid
 *                 description: Category group ID
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 description: Hex color code
 *               icon:
 *                 type: string
 *                 description: Icon name or identifier
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords for auto-categorization
 *               sortOrder:
 *                 type: integer
 *                 description: Sort order for display
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: Category name already exists for this type
 */
router.get('/', categoriesController.getCategories);
router.post('/', categoriesController.createCategory);

/**
 * @swagger
 * /api/categories/groups:
 *   get:
 *     summary: Get all category groups
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of category groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   icon:
 *                     type: string
 *                   color:
 *                     type: string
 *                   sortOrder:
 *                     type: integer
 *                   isSystem:
 *                     type: boolean
 */
router.get('/groups', categoriesController.getCategoryGroups);

/**
 * @swagger
 * /api/categories/type/{type}:
 *   get:
 *     summary: Get categories by type with usage statistics
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer]
 *         description: Category type
 *     responses:
 *       200:
 *         description: Categories with usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   icon:
 *                     type: string
 *                   color:
 *                     type: string
 *                   isSystem:
 *                     type: boolean
 *                   transactionCount:
 *                     type: integer
 *                   totalSpent:
 *                     type: number
 *                   totalEarned:
 *                     type: number
 *       400:
 *         description: Invalid category type
 */
router.get('/type/:type', categoriesController.getCategoriesByType);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [income, expense, transfer]
 *                 description:
 *                   type: string
 *                 icon:
 *                   type: string
 *                 color:
 *                   type: string
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: string
 *                 isSystem:
 *                   type: boolean
 *                 isActive:
 *                   type: boolean
 *                 sortOrder:
 *                   type: integer
 *                 groupId:
 *                   type: string
 *                   format: uuid
 *                 groupName:
 *                   type: string
 *                 groupIcon:
 *                   type: string
 *                 groupColor:
 *                   type: string
 *                 parentId:
 *                   type: string
 *                   format: uuid
 *                 parentName:
 *                   type: string
 *                 childCount:
 *                   type: integer
 *       404:
 *         description: Category not found
 *   put:
 *     summary: Update category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Category name
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *                 description: Category type
 *               description:
 *                 type: string
 *                 description: Category description
 *               groupId:
 *                 type: string
 *                 format: uuid
 *                 description: Category group ID
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 description: Hex color code
 *               icon:
 *                 type: string
 *                 description: Icon name or identifier
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords for auto-categorization
 *               sortOrder:
 *                 type: integer
 *                 description: Sort order for display
 *               isActive:
 *                 type: boolean
 *                 description: Whether category is active
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Category not found or not editable
 *       409:
 *         description: Category name already exists for this type
 *   delete:
 *     summary: Delete category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category with transactions or child categories
 *       404:
 *         description: Category not found or not deletable
 */
router.get('/:id', categoriesController.getCategoryById);
router.put('/:id', categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router; 