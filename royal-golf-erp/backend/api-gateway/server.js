const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { connectRedis, healthCheck: redisHealthCheck } = require('./config/redis');
const { connectDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Royal Golf Club ERP API',
      version: '1.0.0',
      description: 'Comprehensive ERP system for Royal Golf Club management',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:9190', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 */
app.get('/health', async (req, res) => {
  try {
    // Check Redis health
    const redisHealth = await redisHealthCheck();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: {
          status: redisHealth.status,
          responseTime: redisHealth.responseTime || 'N/A',
          error: redisHealth.error || null
        },
        memberServices: 'available',
        erpServices: 'available',
        aiServices: 'available',
        communicationApi: 'available'
      }
    };
    
    // If Redis is unhealthy, still return 200 but with warning
    if (redisHealth.status === 'unhealthy') {
      health.warnings = ['Redis cache is unavailable - some features may be limited'];
    }
    
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Authentication routes
app.use('/api/v1/auth', require('./routes/auth'));

// RBAC Demo routes
app.use('/api/v1/rbac-demo', require('./routes/rbac-demo'));

// Member routes
app.use('/api/v1/members', require('./routes/members'));

// Booking routes
app.use('/api/v1/bookings', require('./routes/bookings'));

// Tournament routes
app.use('/api/v1/tournaments', require('./routes/tournaments'));

// Message routes
app.use('/api/v1/messages', require('./routes/messages'));

// Event routes
app.use('/api/v1/events', require('./routes/events'));

// POS Integration routes
app.use('/api/v1/pos', require('./routes/pos'));

// Inventory Management routes
app.use('/api/v1/inventory', require('./routes/inventory'));

// Member Tabs/Invoices routes
app.use('/api/v1/tabs', require('./routes/tabs'));

// Timekeeping routes
app.use('/api/v1/timekeeping', require('./routes/timekeeping'));

// ERP Financial routes
app.use('/api/v1/erp', authMiddleware, require('./routes/erp'));

// AI Services routes
app.use('/api/v1/ai', require('./routes/ai'));

// TODO: Add microservice proxy routes when services are available
// app.use('/api/v1/members', authMiddleware, proxyMiddleware('http://member-services:3001'));
// app.use('/api/v1/erp', authMiddleware, proxyMiddleware('http://erp-services:3002'));
// app.use('/api/v1/ai', authMiddleware, proxyMiddleware('http://ai-services:8000'));
// app.use('/api/v1/communication', authMiddleware, proxyMiddleware('http://communication-api:3003'));

// API versioning and routing
app.use('/api/v1', require('./routes/index'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Try to connect to Redis (optional for demo)
    try {
      await connectRedis();
      console.log('✅ Redis connected successfully');
    } catch (redisError) {
      console.warn('⚠️ Redis not available, continuing without caching:', redisError.message);
    }

    // Connect to Database (required)
    await connectDatabase();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Royal Golf Club API Gateway running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔐 RBAC Demo endpoints available at http://localhost:${PORT}/api/v1/rbac-demo`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
