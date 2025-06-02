const jwt = require('jsonwebtoken');
const { getSafeRedisClient, isRedisAvailable } = require('../config/redis');

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and manages refresh token logic
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Token not provided'
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'royal-golf-secret');
      
      // Check if token is blacklisted in Redis (if available)
      const redisClient = getSafeRedisClient();
      if (redisClient) {
        try {
          const isBlacklisted = await redisClient.get(`blacklist:${token}`);
          
          if (isBlacklisted) {
            return res.status(401).json({
              error: 'Token invalid',
              message: 'Token has been revoked'
            });
          }
        } catch (redisError) {
          console.warn('Redis blacklist check failed:', redisError.message);
        }
      }

      // Check token expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please refresh your token'
        });
      }

      // Add user info to request object
      req.user = {
        id: decoded.userId,
        userType: decoded.userType || 'staff', // Default to staff for backward compatibility
        username: decoded.username,
        email: decoded.email,
        roles: decoded.roles,
        roleCategories: decoded.roleCategories,
        permissions: decoded.permissions
      };

      // Update last activity in Redis (if available)
      if (redisClient) {
        try {
          await redisClient.setEx(
            `user_activity:${decoded.userId}`, 
            3600, // 1 hour TTL
            new Date().toISOString()
          );
        } catch (redisError) {
          console.warn('Redis activity tracking failed:', redisError.message);
        }
      }

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please refresh your token'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Token is malformed or invalid'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    if (allowedRoles.length === 0) {
      return next(); // No role restriction
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      // Log access denied in audit trail
      const { query } = require('../config/database');
      try {
        await query(
          `INSERT INTO rbac_audit_log (user_id, action, resource, result, ip_address) 
           VALUES ($1, 'access_attempt', $2, 'denied', $3)`,
          [req.user.id, req.originalUrl, req.ip]
        );
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      
      return res.status(403).json({
        error: 'Access denied',
        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
        userRoles: userRoles
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * @param {string} requiredPermission - Permission required to access the route
 * @param {object} options - Additional options for permission checking
 */
const requirePermission = (requiredPermission, options = {}) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const userPermissions = req.user.permissions || {};
    const hasPermission = userPermissions[requiredPermission];
    
    if (!hasPermission) {
      // Log permission denied in audit trail
      const { query } = require('../config/database');
      try {
        await query(
          `INSERT INTO rbac_audit_log (user_id, action, resource, permission_checked, result, ip_address) 
           VALUES ($1, 'permission_check', $2, $3, 'denied', $4)`,
          [req.user.id, req.originalUrl, requiredPermission, req.ip]
        );
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      
      return res.status(403).json({
        error: 'Access denied',
        message: `Permission '${requiredPermission}' required`
      });
    }

    // Check constraints if permission has them
    if (typeof hasPermission === 'object' && hasPermission.max_amount && options.amount) {
      if (options.amount > hasPermission.max_amount) {
        return res.status(403).json({
          error: 'Access denied',
          message: `Amount exceeds permission limit. Max allowed: ${hasPermission.max_amount}`
        });
      }
    }

    // Log successful permission check
    const { query } = require('../config/database');
    try {
      await query(
        `INSERT INTO rbac_audit_log (user_id, action, resource, permission_checked, result, ip_address) 
         VALUES ($1, 'permission_check', $2, $3, 'granted', $4)`,
        [req.user.id, req.originalUrl, requiredPermission, req.ip]
      );
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    next();
  };
};

/**
 * Role category authorization middleware
 * @param {string[]} allowedCategories - Array of role categories that can access the route
 */
const requireRoleCategory = (allowedCategories = []) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    if (allowedCategories.length === 0) {
      return next(); // No category restriction
    }

    const userCategories = req.user.roleCategories || [];
    const hasRequiredCategory = allowedCategories.some(category => userCategories.includes(category));
    
    if (!hasRequiredCategory) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Role category restriction. Required categories: ${allowedCategories.join(', ')}`,
        userCategories: userCategories
      });
    }

    next();
  };
};

/**
 * Helper function to check if user has any of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 */
const hasAnyPermission = (permissions = []) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const userPermissions = req.user.permissions || {};
    const hasPermission = permissions.some(permission => userPermissions[permission]);
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Access denied',
        message: `One of these permissions required: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Rate limiting per user middleware
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
const userRateLimit = (maxRequests = 60, windowMs = 60000) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    // Only apply rate limiting if Redis is available
    if (!isRedisAvailable()) {
      console.warn('Redis not available, skipping rate limiting');
      return next();
    }

    try {
      const redisClient = getSafeRedisClient();
      if (!redisClient) {
        return next(); // Skip if Redis becomes unavailable
      }

      const key = `rate_limit:${req.user.id}`;
      const current = await redisClient.incr(key);
      
      if (current === 1) {
        await redisClient.expire(key, Math.ceil(windowMs / 1000));
      }
      
      if (current > maxRequests) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
          retryAfter: await redisClient.ttl(key)
        });
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current),
        'X-RateLimit-Reset': new Date(Date.now() + (await redisClient.ttl(key) * 1000))
      });
      
      next();
    } catch (error) {
      console.error('User rate limit error:', error);
      next(); // Continue on error to avoid blocking requests
    }
  };
};

module.exports = {
  authMiddleware,
  authorize,
  requirePermission,
  requireRoleCategory,
  hasAnyPermission,
  userRateLimit
};
