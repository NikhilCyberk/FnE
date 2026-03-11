const cors = require('cors');
const express = require('express');
const logger = require('../logger');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('../config/swagger');

const setupCors = (app) => {
  app.use(cors());
};

const setupJsonParsing = (app) => {
  app.use(express.json());
};

const setupLogging = (app) => {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} from ${req.ip}`);
    next();
  });
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

const setupStaticFiles = (app) => {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../../../frontend/dist')));
};

const setupErrorHandling = (app) => {
  app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });
};

module.exports = {
  setupCors,
  setupJsonParsing,
  setupLogging,
  setupSwagger,
  setupStaticFiles,
  setupErrorHandling
};
