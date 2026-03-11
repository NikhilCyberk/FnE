import api from './api';

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  refreshToken: () => api.post('/api/auth/refresh'),
  verifyToken: () => api.get('/api/auth/verify'),
};

export const accountsAPI = {
  getAll: () => api.get('/api/accounts'),
  getById: (id) => api.get(`/api/accounts/${id}`),
  create: (accountData) => api.post('/api/accounts', accountData),
  update: (id, accountData) => api.put(`/api/accounts/${id}`, accountData),
  delete: (id) => api.delete(`/api/accounts/${id}`),
  getBalance: (id) => api.get(`/api/accounts/${id}/balance`),
};

export const transactionsAPI = {
  getAll: (params) => api.get('/api/transactions', params),
  getById: (id) => api.get(`/api/transactions/${id}`),
  create: (transactionData) => api.post('/api/transactions', transactionData),
  update: (id, transactionData) => api.put(`/api/transactions/${id}`, transactionData),
  delete: (id) => api.delete(`/api/transactions/${id}`),
  getSummary: (params) => api.get('/api/transactions/summary', params),
};

export const categoriesAPI = {
  getAll: () => api.get('/api/categories'),
  getById: (id) => api.get(`/api/categories/${id}`),
  create: (categoryData) => api.post('/api/categories', categoryData),
  update: (id, categoryData) => api.put(`/api/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/api/categories/${id}`),
};

export const budgetsAPI = {
  getAll: () => api.get('/api/budgets'),
  getById: (id) => api.get(`/api/budgets/${id}`),
  create: (budgetData) => api.post('/api/budgets', budgetData),
  update: (id, budgetData) => api.put(`/api/budgets/${id}`, budgetData),
  delete: (id) => api.delete(`/api/budgets/${id}`),
  getProgress: (id) => api.get(`/api/budgets/${id}/progress`),
};

export const reportsAPI = {
  getExpenseByCategory: (params) => api.get('/api/reports/expense-by-category', params),
  getIncomeVsExpense: (params) => api.get('/api/reports/income-vs-expense', params),
  getCashFlow: (params) => api.get('/api/reports/cash-flow', params),
  getTopExpenses: (params) => api.get('/api/reports/top-expenses', params),
  getMonthlyTrends: (params) => api.get('/api/reports/monthly-trends', params),
};

export const creditCardsAPI = {
  getAll: () => api.get('/api/credit-cards'),
  getById: (id) => api.get(`/api/credit-cards/${id}`),
  create: (cardData) => api.post('/api/credit-cards', cardData),
  update: (id, cardData) => api.put(`/api/credit-cards/${id}`, cardData),
  delete: (id) => api.delete(`/api/credit-cards/${id}`),
  getTransactions: (id, params) => api.get(`/api/credit-cards/${id}/transactions`, params),
  addTransaction: (id, transactionData) => api.post(`/api/credit-cards/${id}/transactions`, transactionData),
  updateTransaction: (cardId, transactionId, transactionData) => 
    api.put(`/api/credit-cards/${cardId}/transactions/${transactionId}`, transactionData),
  deleteTransaction: (cardId, transactionId) => 
    api.delete(`/api/credit-cards/${cardId}/transactions/${transactionId}`),
  getSummary: (id) => api.get(`/api/credit-cards/${id}/summary`),
};

export const cashSourcesAPI = {
  getAll: () => api.get('/api/cash-sources'),
  getById: (id) => api.get(`/api/cash-sources/${id}`),
  create: (sourceData) => api.post('/api/cash-sources', sourceData),
  update: (id, sourceData) => api.put(`/api/cash-sources/${id}`, sourceData),
  delete: (id) => api.delete(`/api/cash-sources/${id}`),
};

export const loansAPI = {
  getAll: () => api.get('/api/loans'),
  getById: (id) => api.get(`/api/loans/${id}`),
  create: (loanData) => api.post('/api/loans', loanData),
  update: (id, loanData) => api.put(`/api/loans/${id}`, loanData),
  delete: (id) => api.delete(`/api/loans/${id}`),
  getSchedule: (id) => api.get(`/api/loans/${id}/schedule`),
  addPayment: (id, paymentData) => api.post(`/api/loans/${id}/payments`, paymentData),
};
