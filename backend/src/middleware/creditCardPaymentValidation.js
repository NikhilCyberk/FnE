const { body, param } = require('express-validator');

// Payment validation rules
const validatePayment = [
  param('id').isUUID().withMessage('Valid credit card ID is required'),
  
  body('paymentAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be at least 0.01'),
    
  body('paymentMethod')
    .isIn(['bank_transfer', 'check', 'online', 'auto'])
    .withMessage('Invalid payment method'),
    
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid payment date format'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
    
  body('isMinimumPayment')
    .optional()
    .isBoolean()
    .withMessage('isMinimumPayment must be a boolean')
];

// Schedule payment validation rules
const validateScheduledPayment = [
  body('creditCardId')
    .isUUID()
    .withMessage('Valid credit card ID is required'),
    
  body('paymentAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be at least 0.01'),
    
  body('paymentMethod')
    .isIn(['bank_transfer', 'check', 'online'])
    .withMessage('Invalid payment method'),
    
  body('scheduleType')
    .isIn(['weekly', 'biweekly', 'monthly'])
    .withMessage('Invalid schedule type'),
    
  body('nextPaymentDate')
    .isISO8601()
    .withMessage('Valid next payment date is required'),
    
  body('autoPayMinimum')
    .optional()
    .isBoolean()
    .withMessage('autoPayMinimum must be a boolean')
];

module.exports = {
  validatePayment,
  validateScheduledPayment
};
