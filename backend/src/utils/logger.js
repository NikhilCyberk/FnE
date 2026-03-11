const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

// Security logging
const securityLogger = {
  logLoginAttempt: (email, success, ip, userAgent) => {
    logger.info('Login Attempt', {
      email,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  logFailedLogin: (email, reason, ip, userAgent) => {
    logger.warn('Failed Login', {
      email,
      reason,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  logAccountLock: (email, ip, lockDuration) => {
    logger.warn('Account Locked', {
      email,
      ip,
      lockDuration,
      timestamp: new Date().toISOString()
    });
  },
  
  logPasswordChange: (userId, ip) => {
    logger.info('Password Changed', {
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  logSuspiciousActivity: (activity, details) => {
    logger.error('Suspicious Activity', {
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logDataAccess: (userId, resource, action, ip) => {
    logger.info('Data Access', {
      userId,
      resource,
      action,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

// Database logging
const dbLogger = {
  logQuery: (query, params, duration) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Database Query', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        params: params ? JSON.stringify(params).substring(0, 100) : null,
        duration: `${duration}ms`
      });
    }
  },
  
  logConnectionError: (error) => {
    logger.error('Database Connection Error', {
      error: error.message,
      stack: error.stack
    });
  },
  
  logTransactionError: (transaction, error) => {
    logger.error('Database Transaction Error', {
      transaction,
      error: error.message,
      stack: error.stack
    });
  }
};

// Business logic logging
const businessLogger = {
  logUserRegistration: (userId, email) => {
    logger.info('User Registration', {
      userId,
      email,
      timestamp: new Date().toISOString()
    });
  },
  
  logTransactionCreated: (transactionId, userId, amount, type) => {
    logger.info('Transaction Created', {
      transactionId,
      userId,
      amount,
      type,
      timestamp: new Date().toISOString()
    });
  },
  
  logBudgetExceeded: (budgetId, userId, budgetAmount, spentAmount) => {
    logger.warn('Budget Exceeded', {
      budgetId,
      userId,
      budgetAmount,
      spentAmount,
      timestamp: new Date().toISOString()
    });
  },
  
  logAccountCreation: (accountId, userId, accountType) => {
    logger.info('Account Created', {
      accountId,
      userId,
      accountType,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logging
const performanceLogger = {
  logSlowQuery: (query, duration, threshold = 1000) => {
    if (duration > threshold) {
      logger.warn('Slow Query Detected', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration: `${duration}ms`,
        threshold: `${threshold}ms`
      });
    }
  },
  
  logMemoryUsage: () => {
    const usage = process.memoryUsage();
    logger.debug('Memory Usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`
    });
  },
  
  logCpuUsage: () => {
    const usage = process.cpuUsage();
    logger.debug('CPU Usage', {
      user: usage.user,
      system: usage.system
    });
  }
};

// Error logging with context
const contextualLogger = {
  logError: (error, context = {}) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  },
  
  logValidationError: (field, value, rule, context = {}) => {
    logger.warn('Validation Error', {
      field,
      value,
      rule,
      context,
      timestamp: new Date().toISOString()
    });
  }
};

// Audit logging for compliance
const auditLogger = {
  logFinancialTransaction: (transaction) => {
    logger.info('Financial Transaction', {
      transactionId: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      timestamp: new Date().toISOString(),
      audit: true
    });
  },
  
  logDataModification: (userId, table, recordId, changes) => {
    logger.info('Data Modification', {
      userId,
      table,
      recordId,
      changes,
      timestamp: new Date().toISOString(),
      audit: true
    });
  },
  
  logPermissionChange: (adminId, targetUserId, oldPermissions, newPermissions) => {
    logger.info('Permission Change', {
      adminId,
      targetUserId,
      oldPermissions,
      newPermissions,
      timestamp: new Date().toISOString(),
      audit: true
    });
  }
};

// Health check logging
const healthLogger = {
  logHealthCheck: (service, status, responseTime = null, details = null) => {
    const logData = {
      service,
      status,
      timestamp: new Date().toISOString()
    };
    
    if (responseTime) {
      logData.responseTime = `${responseTime}ms`;
    }
    
    if (details) {
      logData.details = details;
    }
    
    if (status === 'healthy') {
      logger.info('Health Check', logData);
    } else {
      logger.warn('Health Check Failed', logData);
    }
  }
};

module.exports = {
  logger,
  stream,
  requestLogger,
  securityLogger,
  dbLogger,
  businessLogger,
  performanceLogger,
  contextualLogger,
  auditLogger,
  healthLogger
};
