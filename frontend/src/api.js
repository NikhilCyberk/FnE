import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden:', data);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', data);
          break;
        case 422:
          // Validation error
          console.error('Validation error:', data);
          break;
        case 429:
          // Rate limited
          console.error('Rate limited:', data);
          break;
        case 500:
          // Server error
          console.error('Server error:', data);
          break;
        default:
          console.error(`HTTP ${status} error:`, data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
    } else {
      // Other error
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API helper functions
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),
};

export const accountsAPI = {
  getAll: (params) => api.get('/api/accounts', { params }),
  getById: (id) => api.get(`/api/accounts/${id}`),
  create: (accountData) => api.post('/api/accounts', accountData),
  update: (id, accountData) => api.put(`/api/accounts/${id}`, accountData),
  delete: (id) => api.delete(`/api/accounts/${id}`),
  getTypes: () => api.get('/api/accounts/types'),
  getInstitutions: () => api.get('/api/accounts/institutions'),
  getSummary: () => api.get('/api/accounts/summary'),
};

export const transactionsAPI = {
  getAll: (params) => api.get('/api/transactions', { params }),
  getById: (id) => api.get(`/api/transactions/${id}`),
  create: (transactionData) => api.post('/api/transactions', transactionData),
  update: (id, transactionData) => api.put(`/api/transactions/${id}`, transactionData),
  delete: (id) => api.delete(`/api/transactions/${id}`),
  getStats: (params) => api.get('/api/transactions/stats', { params }),
};

export const categoriesAPI = {
  getAll: (params) => api.get('/api/categories', { params }),
  getById: (id) => api.get(`/api/categories/${id}`),
  create: (categoryData) => api.post('/api/categories', categoryData),
  update: (id, categoryData) => api.put(`/api/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/api/categories/${id}`),
  getGroups: () => api.get('/api/categories/groups'),
  getByType: (type) => api.get(`/api/categories/type/${type}`),
};

export const budgetsAPI = {
  getAll: (params) => api.get('/api/budgets', { params }),
  getById: (id) => api.get(`/api/budgets/${id}`),
  create: (budgetData) => api.post('/api/budgets', budgetData),
  update: (id, budgetData) => api.put(`/api/budgets/${id}`, budgetData),
  delete: (id) => api.delete(`/api/budgets/${id}`),
};

export const reportsAPI = {
  getSpendingByCategory: (params) => api.get('/api/reports/spending-by-category', { params }),
  getMonthlySpending: (params) => api.get('/api/reports/monthly-spending', { params }),
  getIncomeVsExpense: (params) => api.get('/api/reports/income-vs-expense', { params }),
};

export const creditCardsAPI = {
  getAll: (params) => api.get('/api/credit-cards', { params }),
  getById: (id) => api.get(`/api/credit-cards/${id}`),
  create: (cardData) => api.post('/api/credit-cards', cardData),
  update: (id, cardData) => api.put(`/api/credit-cards/${id}`, cardData),
  delete: (id) => api.delete(`/api/credit-cards/${id}`),
  getTransactions: (cardId, params) => api.get(`/api/credit-cards/${cardId}/transactions`, { params }),
};

export default api; 