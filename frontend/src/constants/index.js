export const TRANSACTION_TYPES = {
  PURCHASE: 'purchase',
  PAYMENT: 'payment',
  CASH_ADVANCE: 'cash_advance',
  BALANCE_TRANSFER: 'balance_transfer',
  FEE: 'fee',
  INTEREST: 'interest'
};

export const TRANSACTION_CATEGORIES = {
  FOOD: 'Food & Dining',
  TRANSPORT: 'Transportation',
  SHOPPING: 'Shopping',
  ENTERTAINMENT: 'Entertainment',
  BILLS: 'Bills & Utilities',
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education',
  TRAVEL: 'Travel',
  OTHER: 'Other'
};

export const ACCOUNT_TYPES = {
  SAVINGS: 'savings',
  CURRENT: 'current',
  CREDIT_CARD: 'credit_card',
  CASH: 'cash'
};

export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

export const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR' },
  USD: { symbol: '$', code: 'USD' },
  EUR: { symbol: '€', code: 'EUR' }
};

export const DEFAULT_CURRENCY = CURRENCIES.INR;

export const PAGINATION_LIMITS = [10, 25, 50, 100];

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  ACCOUNTS: '/api/accounts',
  TRANSACTIONS: '/api/transactions',
  CATEGORIES: '/api/categories',
  BUDGETS: '/api/budgets',
  REPORTS: '/api/reports',
  CREDIT_CARDS: '/api/credit-cards',
  CASH_SOURCES: '/api/cash-sources'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.'
};

export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully!',
  UPDATED: 'Updated successfully!',
  DELETED: 'Deleted successfully!',
  SAVED: 'Saved successfully!'
};
