const { body, param, query, validationResult } = require('express-validator');
const logger = require('../logger');

// Validation rules
const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  firstName: body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  lastName: body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  phone: body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  
  amount: body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  
  description: body('description')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Description must be between 3 and 500 characters'),
  
  accountType: body('type')
    .isIn(['savings', 'current', 'credit_card', 'cash'])
    .withMessage('Invalid account type'),
  
  transactionType: body('type')
    .isIn(['income', 'expense', 'transfer'])
    .withMessage('Invalid transaction type'),
  
  categoryId: body('categoryId')
    .isUUID()
    .withMessage('Valid category ID is required'),
  
  accountId: body('accountId')
    .isUUID()
    .withMessage('Valid account ID is required'),
  
  date: body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  
  timezone: body('timezone')
    .optional()
    .isIn(['UTC', 'EST', 'PST', 'IST', 'CET', 'JST'])
    .withMessage('Invalid timezone'),
  
  currency: body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY'])
    .withMessage('Invalid currency'),
  
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  id: param('id')
    .isUUID()
    .withMessage('Valid ID is required')
};

// Validation middleware factory
const validate = (rules) => {
  return async (req, res, next) => {
    await Promise.all(rules.map(rule => rule.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }));
      
      logger.warn('Validation error', { 
        errors: errorMessages, 
        url: req.url, 
        method: req.method,
        body: req.body 
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    next();
  };
};

// Predefined validation sets
const validations = {
  register: validate([
    validationRules.email,
    validationRules.password,
    validationRules.firstName,
    validationRules.lastName,
    validationRules.phone,
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    validationRules.timezone,
    validationRules.currency
  ]),
  
  login: validate([
    validationRules.email,
    validationRules.password
  ]),
  
  updateProfile: validate([
    validationRules.firstName,
    validationRules.lastName,
    validationRules.phone,
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    validationRules.timezone,
    validationRules.currency,
    body('locale').optional().isIn(['en-US', 'en-GB', 'hi-IN']).withMessage('Invalid locale')
  ]),
  
  changePassword: validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ]),
  
  createAccount: validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Account name must be between 2 and 100 characters'),
    validationRules.accountType,
    validationRules.amount
  ]),
  
  createTransaction: validate([
    validationRules.description,
    validationRules.amount,
    validationRules.transactionType,
    validationRules.accountId,
    validationRules.categoryId,
    validationRules.date
  ]),
  
  updateTransaction: validate([
    validationRules.description,
    validationRules.amount,
    validationRules.transactionType,
    validationRules.categoryId,
    validationRules.date
  ]),
  
  createCategory: validate([
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters'),
    body('type').optional().isIn(['income', 'expense']).withMessage('Category type must be income or expense'),
    body('color').optional().isHexColor().withMessage('Color must be a valid hex color')
  ]),
  
  createBudget: validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Budget name must be between 2 and 100 characters'),
    validationRules.amount,
    validationRules.categoryId,
    body('period').isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly'),
    validationRules.date
  ]),
  
  listQuery: validate([
    validationRules.page,
    validationRules.limit,
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
    query('sortBy').optional().isIn(['date', 'amount', 'name']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ]),
  
  uuidParam: validate([
    validationRules.id
  ])
};

module.exports = {
  validationRules,
  validate,
  validations
};
