import api from '../services/api';

class BaseRepository {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async findAll(params = {}) {
    return api.get(this.endpoint, { params });
  }

  async findById(id) {
    return api.get(`${this.endpoint}/${id}`);
  }

  async create(data) {
    return api.post(this.endpoint, data);
  }

  async update(id, data) {
    return api.put(`${this.endpoint}/${id}`, data);
  }

  async patch(id, data) {
    return api.patch(`${this.endpoint}/${id}`, data);
  }

  async delete(id) {
    return api.delete(`${this.endpoint}/${id}`);
  }

  async search(query, params = {}) {
    return api.get(`${this.endpoint}/search`, { 
      params: { q: query, ...params } 
    });
  }
}

export class AccountRepository extends BaseRepository {
  constructor() {
    super('/api/accounts');
  }

  async getBalance(id) {
    return api.get(`${this.endpoint}/${id}/balance`);
  }

  async getTransactions(id, params = {}) {
    return api.get(`${this.endpoint}/${id}/transactions`, { params });
  }
}

export class TransactionRepository extends BaseRepository {
  constructor() {
    super('/api/transactions');
  }

  async getSummary(params = {}) {
    return api.get(`${this.endpoint}/summary`, { params });
  }

  async getByCategory(categoryId, params = {}) {
    return api.get(`${this.endpoint}/category/${categoryId}`, { params });
  }

  async getByDateRange(startDate, endDate, params = {}) {
    return api.get(`${this.endpoint}/date-range`, { 
      params: { startDate, endDate, ...params } 
    });
  }
}

export class CategoryRepository extends BaseRepository {
  constructor() {
    super('/api/categories');
  }

  async getByType(type) {
    return api.get(`${this.endpoint}/type/${type}`);
  }
}

export class BudgetRepository extends BaseRepository {
  constructor() {
    super('/api/budgets');
  }

  async getProgress(id) {
    return api.get(`${this.endpoint}/${id}/progress`);
  }

  async getByCategory(categoryId) {
    return api.get(`${this.endpoint}/category/${categoryId}`);
  }
}

export class CreditCardRepository extends BaseRepository {
  constructor() {
    super('/api/credit-cards');
  }

  async getTransactions(id, params = {}) {
    return api.get(`${this.endpoint}/${id}/transactions`, { params });
  }

  async addTransaction(id, transactionData) {
    return api.post(`${this.endpoint}/${id}/transactions`, transactionData);
  }

  async updateTransaction(cardId, transactionId, transactionData) {
    return api.put(`${this.endpoint}/${cardId}/transactions/${transactionId}`, transactionData);
  }

  async deleteTransaction(cardId, transactionId) {
    return api.delete(`${this.endpoint}/${cardId}/transactions/${transactionId}`);
  }

  async getSummary(id) {
    return api.get(`${this.endpoint}/${id}/summary`);
  }
}

export class ReportRepository {
  async getExpenseByCategory(params = {}) {
    return api.get('/api/reports/expense-by-category', { params });
  }

  async getIncomeVsExpense(params = {}) {
    return api.get('/api/reports/income-vs-expense', { params });
  }

  async getCashFlow(params = {}) {
    return api.get('/api/reports/cash-flow', { params });
  }

  async getTopExpenses(params = {}) {
    return api.get('/api/reports/top-expenses', { params });
  }

  async getMonthlyTrends(params = {}) {
    return api.get('/api/reports/monthly-trends', { params });
  }
}

export class UserRepository extends BaseRepository {
  constructor() {
    super('/api/user');
  }

  async getProfile() {
    return api.get(`${this.endpoint}/profile`);
  }

  async updateProfile(data) {
    return api.put(`${this.endpoint}/profile`, data);
  }

  async changePassword(data) {
    return api.post(`${this.endpoint}/change-password`, data);
  }
}

export default {
  AccountRepository,
  TransactionRepository,
  CategoryRepository,
  BudgetRepository,
  CreditCardRepository,
  ReportRepository,
  UserRepository
};
