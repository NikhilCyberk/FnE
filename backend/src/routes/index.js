const authRoutes = require('./auth');
const accountsRoutes = require('./accounts');
const transactionsRoutes = require('./transactions');
const budgetsRoutes = require('./budgets');
const reportsRoutes = require('./reports');
const creditCardRoutes = require('./creditCard');
const cashSourcesRoutes = require('./cashSources');
const creditCardTransactionsRoutes = require('./creditCardTransactions');

const setupRoutes = (app) => {
  // Health check routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountsRoutes);
  app.use('/api/transactions', transactionsRoutes);
  app.use('/api/budgets', budgetsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/categories', require('./categories'));
  app.use('/api/budget-categories', require('./budgetCategories'));
  app.use('/api/user', require('./user'));
  app.use('/api/credit-cards', creditCardRoutes);
  app.use('/api/credit-cards', creditCardTransactionsRoutes);
  app.use('/api/loans', require('./loans'));
  app.use('/api/cash-sources', cashSourcesRoutes);

  // Root route for API
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to FnE API' });
  });
};

module.exports = { setupRoutes };
