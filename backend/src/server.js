const express = require('express');
const dotenv = require('dotenv');
const logger = require('./logger');
const { Pool } = require('pg');
const ensureDatabaseExists = require('./ensureDatabase');
const { setupRoutes } = require('./routes');
const {
  setupCors,
  setupJsonParsing,
  setupLogging,
  setupSwagger,
  setupStaticFiles,
  setupErrorHandling
} = require('./middleware');

dotenv.config();

(async () => {
  await ensureDatabaseExists();

  const app = express();
  
  // Setup middleware
  setupCors(app);
  setupJsonParsing(app);
  setupLogging(app);
  setupSwagger(app);

  // Setup routes
  setupRoutes(app);

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

  // Setup static files and error handling
  setupStaticFiles(app);
  
  // Catch-all handler for SPA
  const path = require('path');
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'), (err) => {
      if (err) {
        // If dist doesn't exist (dev mode), just send 404
        res.status(404).send('Not found. Please make sure the frontend is built or use the dev server.');
      }
    });
  });

  setupErrorHandling(app);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
  });
})();