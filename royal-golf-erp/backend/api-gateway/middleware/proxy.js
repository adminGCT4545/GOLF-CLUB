const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Custom proxy middleware for routing requests to microservices
 * @param {string} target - Target service URL
 * @param {object} options - Additional proxy options
 */
const proxyMiddleware = (target, options = {}) => {
  const defaultOptions = {
    target,
    changeOrigin: true,
    timeout: 30000, // 30 seconds
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${target}:`, err.message);
      
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'The requested service is temporarily unavailable',
          service: target,
          timestamp: new Date().toISOString()
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add correlation ID for request tracing
      const correlationId = req.headers['x-correlation-id'] || 
                           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      proxyReq.setHeader('X-Correlation-ID', correlationId);
      
      // Forward user information to microservices
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-Member-Number', req.user.memberNumber);
        proxyReq.setHeader('X-Membership-Tier', req.user.membershipTier);
        proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
      }
      
      // Add request metadata
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
      proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
      
      console.log(`Proxying ${req.method} ${req.originalUrl} to ${target}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add response headers
      proxyRes.headers['X-Powered-By'] = 'Royal Golf Club ERP';
      proxyRes.headers['X-Response-Time'] = Date.now() - req.startTime;
      
      // Log response
      console.log(`Response from ${target}: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
    },
    ...options
  };

  return createProxyMiddleware(defaultOptions);
};

/**
 * Health check proxy for service health monitoring
 * @param {string} serviceName - Name of the service
 * @param {string} healthEndpoint - Health check endpoint URL
 */
const healthCheckProxy = (serviceName, healthEndpoint) => {
  return async (req, res, next) => {
    try {
      const response = await axios.get(healthEndpoint, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Royal-Golf-Gateway-Health-Check'
        }
      });
      
      res.json({
        service: serviceName,
        status: 'healthy',
        responseTime: response.headers['x-response-time'] || 'N/A',
        timestamp: new Date().toISOString(),
        details: response.data
      });
    } catch (error) {
      res.status(503).json({
        service: serviceName,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Load balancer middleware for multiple service instances
 * @param {string[]} targets - Array of target service URLs
 * @param {string} strategy - Load balancing strategy ('round-robin', 'random')
 */
const loadBalancer = (targets, strategy = 'round-robin') => {
  let currentIndex = 0;
  
  const getNextTarget = () => {
    switch (strategy) {
      case 'random':
        return targets[Math.floor(Math.random() * targets.length)];
      case 'round-robin':
      default:
        const target = targets[currentIndex];
        currentIndex = (currentIndex + 1) % targets.length;
        return target;
    }
  };

  return (req, res, next) => {
    const target = getNextTarget();
    req.proxyTarget = target;
    
    // Use the proxy middleware with the selected target
    const proxy = proxyMiddleware(target);
    proxy(req, res, next);
  };
};

/**
 * Circuit breaker middleware to handle service failures
 * @param {string} serviceName - Name of the service
 * @param {object} options - Circuit breaker options
 */
const circuitBreaker = (serviceName, options = {}) => {
  const {
    failureThreshold = 5,
    resetTimeout = 60000, // 1 minute
    monitoringPeriod = 60000 // 1 minute
  } = options;

  let failures = 0;
  let lastFailureTime = null;
  let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

  return (req, res, next) => {
    const now = Date.now();

    // Reset failures if monitoring period has passed
    if (lastFailureTime && (now - lastFailureTime) > monitoringPeriod) {
      failures = 0;
      lastFailureTime = null;
    }

    // Check circuit breaker state
    if (state === 'OPEN') {
      if (now - lastFailureTime > resetTimeout) {
        state = 'HALF_OPEN';
        console.log(`Circuit breaker for ${serviceName} is now HALF_OPEN`);
      } else {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: `Circuit breaker is OPEN for ${serviceName}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to monitor responses
    res.end = function(chunk, encoding) {
      if (res.statusCode >= 500) {
        failures++;
        lastFailureTime = now;
        
        if (failures >= failureThreshold) {
          state = 'OPEN';
          console.log(`Circuit breaker for ${serviceName} is now OPEN`);
        }
      } else if (state === 'HALF_OPEN') {
        // Success in half-open state, reset circuit breaker
        state = 'CLOSED';
        failures = 0;
        lastFailureTime = null;
        console.log(`Circuit breaker for ${serviceName} is now CLOSED`);
      }
      
      // Call original end function
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

/**
 * Request timeout middleware
 * @param {number} timeout - Timeout in milliseconds
 */
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    req.startTime = Date.now();
    
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: `Request timed out after ${timeout}ms`,
          timestamp: new Date().toISOString()
        });
      }
    }, timeout);

    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      clearTimeout(timeoutId);
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

/**
 * Service discovery middleware
 * Dynamically discovers available service instances
 */
const serviceDiscovery = () => {
  const services = new Map();
  
  // Register a service instance
  const registerService = (serviceName, instance) => {
    if (!services.has(serviceName)) {
      services.set(serviceName, []);
    }
    services.get(serviceName).push(instance);
  };

  // Get available instances for a service
  const getServiceInstances = (serviceName) => {
    return services.get(serviceName) || [];
  };

  // Health check all registered services
  const healthCheckServices = async () => {
    for (const [serviceName, instances] of services.entries()) {
      for (const instance of instances) {
        try {
          await axios.get(`${instance.url}/health`, { timeout: 5000 });
          instance.healthy = true;
        } catch (error) {
          instance.healthy = false;
          console.warn(`Service ${serviceName} instance ${instance.url} is unhealthy`);
        }
      }
    }
  };

  // Start periodic health checks
  setInterval(healthCheckServices, 30000); // Every 30 seconds

  return {
    registerService,
    getServiceInstances,
    healthCheckServices
  };
};

module.exports = {
  proxyMiddleware,
  healthCheckProxy,
  loadBalancer,
  circuitBreaker,
  requestTimeout,
  serviceDiscovery
};
