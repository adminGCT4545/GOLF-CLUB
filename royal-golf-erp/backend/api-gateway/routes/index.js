const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: API Gateway information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API Gateway information
 */
router.get('/', (req, res) => {
  res.json({
    name: 'Royal Golf Club ERP API Gateway',
    version: '1.0.0',
    description: 'Enterprise Resource Planning system for Royal Golf Club',
    services: {
      memberServices: '/api/v1/members',
      erpServices: '/api/v1/erp',
      aiServices: '/api/v1/ai',
      communicationApi: '/api/v1/communication'
    },
    documentation: '/api-docs',
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/v1/services/health:
 *   get:
 *     summary: Check health of all microservices
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Services health status
 */
router.get('/services/health', async (req, res) => {
  const services = [
    { name: 'Member Services', url: 'http://member-services:3001/health' },
    { name: 'ERP Services', url: 'http://erp-services:3002/health' },
    { name: 'AI Services', url: 'http://ai-services:8000/health' },
    { name: 'Communication API', url: 'http://communication-api:3003/health' }
  ];

  const healthChecks = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const axios = require('axios');
        const response = await axios.get(service.url, { timeout: 5000 });
        return {
          name: service.name,
          status: 'healthy',
          responseTime: response.headers['x-response-time'] || 'N/A',
          details: response.data
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'unhealthy',
          error: error.message
        };
      }
    })
  );

  const results = healthChecks.map((result, index) => ({
    service: services[index].name,
    ...result.value
  }));

  const allHealthy = results.every(result => result.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    overall: allHealthy ? 'healthy' : 'degraded',
    services: results,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
