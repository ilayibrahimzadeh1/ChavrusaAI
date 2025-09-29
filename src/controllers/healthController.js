const config = require('../config');
const logger = require('../utils/logger');
const sessionService = require('../services/sessionService');
const aiService = require('../services/aiService');
const sefariaService = require('../services/sefariaService');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Basic health check endpoint
 */
const healthCheck = catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: require('../../package.json').version,
    requestId: req.requestId
  };

  const responseTime = Date.now() - startTime;
  health.responseTime = `${responseTime}ms`;

  logger.debug('Health check completed', { responseTime, requestId: req.requestId });

  res.status(200).json(health);
});

/**
 * Detailed health check with service status
 */
const detailedHealthCheck = catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  // Check all services
  const serviceChecks = await Promise.allSettled([
    checkAIService(),
    checkSefariaService(),
    checkSessionService()
  ]);

  const [aiCheck, sefariaCheck, sessionCheck] = serviceChecks;

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: require('../../package.json').version,
    services: {
      ai: aiCheck.status === 'fulfilled' ? aiCheck.value : { status: 'unhealthy', error: aiCheck.reason?.message },
      sefaria: sefariaCheck.status === 'fulfilled' ? sefariaCheck.value : { status: 'unhealthy', error: sefariaCheck.reason?.message },
      session: sessionCheck.status === 'fulfilled' ? sessionCheck.value : { status: 'unhealthy', error: sessionCheck.reason?.message }
    },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    requestId: req.requestId
  };

  // Determine overall status
  const unhealthyServices = Object.values(health.services).filter(service => service.status === 'unhealthy');
  if (unhealthyServices.length > 0) {
    health.status = 'degraded';
    if (unhealthyServices.length === Object.keys(health.services).length) {
      health.status = 'unhealthy';
    }
  }

  const responseTime = Date.now() - startTime;
  health.responseTime = `${responseTime}ms`;

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  logger.info('Detailed health check completed', { 
    status: health.status, 
    responseTime, 
    unhealthyServices: unhealthyServices.length,
    requestId: req.requestId 
  });

  res.status(statusCode).json(health);
});

/**
 * Check AI service health
 */
async function checkAIService() {
  try {
    const healthInfo = aiService.getHealthInfo();
    
    // Test connection if API key is configured
    let connectionTest = null;
    if (healthInfo.apiKeyConfigured) {
      try {
        connectionTest = await Promise.race([
          aiService.testConnection(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
      } catch (error) {
        connectionTest = false;
      }
    }

    return {
      status: healthInfo.apiKeyConfigured && connectionTest !== false ? 'healthy' : 'unhealthy',
      ...healthInfo,
      connectionTest,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check Sefaria service health
 */
async function checkSefariaService() {
  try {
    const healthInfo = sefariaService.getHealthInfo();
    
    // Test connection
    let connectionTest = null;
    try {
      connectionTest = await Promise.race([
        sefariaService.testConnection(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (error) {
      connectionTest = false;
    }

    return {
      status: connectionTest ? 'healthy' : 'unhealthy',
      ...healthInfo,
      connectionTest,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check session service health
 */
async function checkSessionService() {
  try {
    const healthInfo = sessionService.getHealthInfo();
    
    return {
      status: 'healthy',
      ...healthInfo,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Readiness check - determines if the app is ready to serve traffic
 */
const readinessCheck = catchAsync(async (req, res) => {
  const checks = {
    config: checkConfiguration(),
    services: await checkCriticalServices()
  };

  const isReady = checks.config.ready && checks.services.ready;

  const response = {
    ready: isReady,
    timestamp: new Date().toISOString(),
    checks,
    requestId: req.requestId
  };

  logger.debug('Readiness check completed', { ready: isReady, requestId: req.requestId });

  res.status(isReady ? 200 : 503).json(response);
});

/**
 * Check configuration validity
 */
function checkConfiguration() {
  try {
    const issues = [];
    
    if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key') {
      issues.push('OpenAI API key not configured');
    }
    
    if (!config.port || config.port < 1 || config.port > 65535) {
      issues.push('Invalid port configuration');
    }

    return {
      ready: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      ready: false,
      issues: [`Configuration error: ${error.message}`]
    };
  }
}

/**
 * Check critical services
 */
async function checkCriticalServices() {
  try {
    // Only check if services can be initialized, not full connectivity
    const issues = [];
    
    // Check if AI service can be initialized
    try {
      aiService.getHealthInfo();
    } catch (error) {
      issues.push(`AI service initialization failed: ${error.message}`);
    }
    
    // Check if Sefaria service can be initialized
    try {
      sefariaService.getHealthInfo();
    } catch (error) {
      issues.push(`Sefaria service initialization failed: ${error.message}`);
    }
    
    // Check if Session service can be initialized
    try {
      sessionService.getHealthInfo();
    } catch (error) {
      issues.push(`Session service initialization failed: ${error.message}`);
    }

    return {
      ready: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      ready: false,
      issues: [`Service check failed: ${error.message}`]
    };
  }
}

/**
 * Liveness check - determines if the app is alive
 */
const livenessCheck = catchAsync(async (req, res) => {
  // Simple check that the process is running and can respond
  const response = {
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    requestId: req.requestId
  };

  res.status(200).json(response);
});

/**
 * Get application metrics
 */
const getMetrics = catchAsync(async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid
    },
    application: {
      environment: config.env,
      version: require('../../package.json').version,
      activeSessions: sessionService.getActiveSessionsCount()
    },
    services: {
      ai: aiService.getHealthInfo(),
      sefaria: sefariaService.getHealthInfo(),
      session: sessionService.getHealthInfo()
    },
    requestId: req.requestId
  };

  logger.debug('Metrics retrieved', { requestId: req.requestId });

  res.status(200).json(metrics);
});

/**
 * Test endpoint for connectivity verification
 */
const testEndpoint = catchAsync(async (req, res) => {
  const response = {
    message: 'Torah Learning App API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: require('../../package.json').version,
    requestId: req.requestId
  };

  logger.debug('Test endpoint accessed', { requestId: req.requestId });

  res.status(200).json(response);
});

module.exports = {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
  getMetrics,
  testEndpoint
};