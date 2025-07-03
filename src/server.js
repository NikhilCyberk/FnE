// Ensure you have a .env file in the project root with the following content:
// DATABASE_URL=postgresql://fneuser:fnepassword@localhost:5432/fnedb
// JWT_SECRET=your_jwt_secret
//
// If running with Docker Compose, the database will be available at the above URL.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const authRoutes = require('./routes/auth');
const accountsRoutes = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const budgetsRoutes = require('./routes/budgets');
const reportsRoutes = require('./routes/reports');
const logger = require('./logger');
const { Pool } = require('pg');
const creditCardRoutes = require('./routes/creditCard');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
console.log('DATABASE_URL:', process.env.DATABASE_URL);
// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FnE API',
      version: '1.0.0',
      description: 'Finance & Expense API documentation',
    },
    servers: [
      { url: 'http://localhost:3000' },
    ],
  },
  apis: ['./src/routes/*.js', './src/server.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} from ${req.ip}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * @swagger
 * /api/db-health:
 *   get:
 *     summary: Check database connection health
 *     description: Returns success if the backend can connect to the PostgreSQL database.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
app.get('/api/db-health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'success', message: 'Database connection successful.' });
  } catch (err) {
    logger.error('Database health check failed:', err);
    res.status(500).json({ status: 'error', message: 'Database connection failed.', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/categories', require('./routes/categories'));
app.use('/api/budget-categories', require('./routes/budgetCategories'));
app.use('/api/user', require('./routes/user'));
app.use('/api/credit-cards', creditCardRoutes);

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
}); 