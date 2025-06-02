const redis = require('redis');

let redisClient;

/**
 * Redis Configuration
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  database: process.env.REDIS_DB || 0
};

/**
 * Connect to Redis
 */
const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        connectTimeout: 5000,
        commandTimeout: 5000,
        reconnectStrategy: (retries) => {
          // Limit to 3 retry attempts, then give up
          if (retries >= 3) {
            console.log('❌ Redis connection failed after 3 attempts, continuing without Redis');
            return false;
          }
          // Exponential backoff with max delay of 1 second
          const delay = Math.min(retries * 200, 1000);
          console.log(`Redis reconnect attempt ${retries} in ${delay}ms`);
          return delay;
        }
      },
      password: redisConfig.password,
      database: redisConfig.database
    });

    // Event handlers
    redisClient.on('connect', () => {
      console.log('🔄 Connecting to Redis...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connection established');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Reconnecting to Redis...');
    });

    // Connect to Redis with timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    
    // Test the connection
    await redisClient.ping();
    console.log('Redis ping successful');
    
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    throw error;
  }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
};

/**
 * Safe Redis client wrapper that handles unavailable Redis gracefully
 */
const getSafeRedisClient = () => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return null;
    }
    return redisClient;
  } catch (error) {
    console.warn('Redis client not available:', error.message);
    return null;
  }
};

/**
 * Check if Redis is available
 */
const isRedisAvailable = () => {
  return redisClient && redisClient.isOpen;
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
};

/**
 * Redis health check
 */
const healthCheck = async () => {
  const client = getSafeRedisClient();
  if (!client) {
    return {
      status: 'unhealthy',
      error: 'Redis client not available',
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    const start = Date.now();
    await client.ping();
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Cache wrapper functions with safe Redis operations
 */
const cache = {
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  set: async (key, value, ttl = 3600) => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache set operation');
      return false;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await client.setEx(key, ttl, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   */
  get: async (key) => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache get operation');
      return null;
    }
    
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  del: async (key) => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache delete operation');
      return false;
    }
    
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   */
  exists: async (key) => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache exists operation');
      return false;
    }
    
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  /**
   * Set expiration for a key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   */
  expire: async (key, ttl) => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache expire operation');
      return false;
    }
    
    try {
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  },

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   */
  ttl: async (key) => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache TTL operation');
      return -1;
    }
    
    try {
      return await client.ttl(key);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  },

  /**
   * Increment a numeric value
   * @param {string} key - Cache key
   */
  incr: async (key) => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache increment operation');
      return 0;
    }
    
    try {
      return await client.incr(key);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  },

  /**
   * Get keys matching a pattern
   * @param {string} pattern - Key pattern
   */
  keys: async (pattern) => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache keys operation');
      return [];
    }
    
    try {
      return await client.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  },

  /**
   * Clear all cache
   */
  flushAll: async () => {
    const client = getSafeRedisClient();
    if (!client) {
      console.warn('Redis not available for cache flush operation');
      return false;
    }
    
    try {
      await client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
};

/**
 * Session management functions
 */
const session = {
  /**
   * Create a session
   * @param {string} sessionId - Session ID
   * @param {object} data - Session data
   * @param {number} ttl - Time to live in seconds
   */
  create: async (sessionId, data, ttl = 86400) => {
    return await cache.set(`session:${sessionId}`, data, ttl);
  },

  /**
   * Get session data
   * @param {string} sessionId - Session ID
   */
  get: async (sessionId) => {
    return await cache.get(`session:${sessionId}`);
  },

  /**
   * Update session data
   * @param {string} sessionId - Session ID
   * @param {object} data - Updated session data
   * @param {number} ttl - Time to live in seconds
   */
  update: async (sessionId, data, ttl = 86400) => {
    return await cache.set(`session:${sessionId}`, data, ttl);
  },

  /**
   * Destroy a session
   * @param {string} sessionId - Session ID
   */
  destroy: async (sessionId) => {
    return await cache.del(`session:${sessionId}`);
  },

  /**
   * Extend session TTL
   * @param {string} sessionId - Session ID
   * @param {number} ttl - Time to live in seconds
   */
  extend: async (sessionId, ttl = 86400) => {
    return await cache.expire(`session:${sessionId}`, ttl);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  getSafeRedisClient,
  isRedisAvailable,
  closeRedis,
  healthCheck,
  cache,
  session
};
