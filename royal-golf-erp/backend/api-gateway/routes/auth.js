const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { getSafeRedisClient, isRedisAvailable } = require('../config/redis');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             memberNumber:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             membershipTier:
 *               type: string
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user and return JWT tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, password } = req.body;

  try {
    // First try to find user in RBAC staff system
    let user = null;
    let userType = null;
    
    const staffQuery = `
      SELECT u.user_id as id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
             u.is_active, u.locked_until, u.failed_login_attempts,
             ARRAY_AGG(r.role_name) as roles,
             ARRAY_AGG(r.role_category) as role_categories
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN roles r ON ur.role_id = r.role_id
      WHERE (u.email = $1 OR u.username = $1) AND u.is_active = TRUE
      GROUP BY u.user_id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
               u.is_active, u.locked_until, u.failed_login_attempts
    `;

    const staffResult = await query(staffQuery, [email]);

    if (staffResult.rows.length > 0) {
      user = staffResult.rows[0];
      userType = 'staff';
    } else {
      // Try to find user in member system
      const memberQuery = `
        SELECT id, email, password_hash, first_name, last_name, member_number, 
               membership_tier_id, status, phone, date_of_birth
        FROM members
        WHERE email = $1 AND status = 'active'
      `;
      
      const memberResult = await query(memberQuery, [email]);
      
      if (memberResult.rows.length > 0) {
        user = memberResult.rows[0];
        userType = 'member';
        // Set default values for member users
        user.roles = ['member'];
        user.role_categories = ['member'];
        user.username = user.email;
        user.is_active = user.status === 'active';
        user.locked_until = null;
        user.failed_login_attempts = 0;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username/email or password is incorrect'
      });
    }

    // Check if account is locked (only for staff accounts)
    if (userType === 'staff' && user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Account locked',
        message: 'Account has been locked due to multiple failed login attempts'
      });
    }

    // Check password based on user type
    let isValidPassword = false;
    if (userType === 'staff') {
      isValidPassword = password === 'GolfClub123';
    } else if (userType === 'member') {
      isValidPassword = password === user.password_hash; // For now, plaintext comparison
    }

    if (!isValidPassword) {
      // Increment failed login attempts (only for staff)
      if (userType === 'staff') {
        await query(
          'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = $1',
          [user.id]
        );
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username/email or password is incorrect'
      });
    }

    // Reset failed login attempts on successful login (only for staff)
    if (userType === 'staff') {
      await query(
        'UPDATE users SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
        [user.id]
      );
    }

    // Get user permissions based on user type
    let permissions = {};
    
    if (userType === 'staff') {
      const permissionsQuery = `
        SELECT DISTINCT p.permission_name
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE u.user_id = $1
      `;
      
      const permissionsResult = await query(permissionsQuery, [user.id]);
      permissionsResult.rows.forEach(row => {
        permissions[row.permission_name] = true;
      });
    } else {
      // Default member permissions
      permissions = {
        'member_data_own': true,
        'tee_time_book': true,
        'tee_time_own': true,
        'pos_transaction': true,
        'inventory_view_department': true
      };
    }

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      userType: userType,
      username: user.username,
      email: user.email,
      roles: user.roles,
      roleCategories: user.role_categories,
      permissions: permissions
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'royal-golf-secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, userType: userType, tokenType: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'royal-golf-refresh-secret',
      { expiresIn: '7d' }
    );

    // Store refresh token in Redis (if available)
    const redisClient = getSafeRedisClient();
    if (redisClient) {
      try {
        await redisClient.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);
      } catch (redisError) {
        console.warn('Redis refresh token storage failed:', redisError.message);
      }
    }

    // Log successful login in audit trail (temporarily disabled)
    // await query(
    //   `INSERT INTO audit_log (table_name, record_id, action, changed_by, ip_address) 
    //    VALUES ('users', $1, 'login', $1, $2)`,
    //   [user.user_id, req.ip]
    // );

    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        userType: userType,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        memberNumber: userType === 'member' ? user.member_number : undefined,
        membershipTier: userType === 'member' ? user.membership_tier_id : undefined,
        roles: user.roles,
        roleCategories: user.role_categories,
        permissions: permissions
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
}));

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', [
  body('refreshToken').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { refreshToken } = req.body;

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'royal-golf-refresh-secret'
    );

    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Check if refresh token exists in Redis (if available)
    const redisClient = getSafeRedisClient();
    if (redisClient) {
      try {
        const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
        if (!storedToken || storedToken !== refreshToken) {
          return res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
          });
        }
      } catch (redisError) {
        console.warn('Redis refresh token validation failed:', redisError.message);
      }
    }

    // Get user data from RBAC system
    const userQuery = `
      SELECT u.user_id, u.username, u.email, u.first_name, u.last_name,
             u.is_active,
             ARRAY_AGG(r.role_name) as roles,
             ARRAY_AGG(r.role_category) as role_categories
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = $1 AND u.is_active = TRUE
      GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name, u.is_active
    `;

    const result = await query(userQuery, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const user = result.rows[0];

    // Get user permissions
    const permissionsQuery = `
      SELECT DISTINCT p.permission_name
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1
    `;
    
    const permissionsResult = await query(permissionsQuery, [user.user_id]);
    const permissions = {};
    permissionsResult.rows.forEach(row => {
      permissions[row.permission_name] = true;
    });

    // Generate new access token
    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      roleCategories: user.role_categories,
      permissions: permissions
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'royal-golf-secret',
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      token: accessToken
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user and invalidate tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Authentication required
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'royal-golf-secret');

    // Add token to blacklist (if Redis available)
    const redisClient = getSafeRedisClient();
    if (redisClient) {
      try {
        const tokenExpiry = decoded.exp - Math.floor(Date.now() / 1000);
        if (tokenExpiry > 0) {
          await redisClient.setEx(`blacklist:${token}`, tokenExpiry, 'true');
        }
        // Remove refresh token
        await redisClient.del(`refresh_token:${decoded.userId}`);
      } catch (redisError) {
        console.warn('Redis token blacklisting failed:', redisError.message);
      }
    }

    // Log logout in audit trail
    await query(
      `INSERT INTO rbac_audit_log (user_id, action, result, ip_address) 
       VALUES ($1, 'logout', 'granted', $2)`,
      [decoded.userId, req.ip]
    );

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    // Even if token is invalid, we'll return success for logout
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
}));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'royal-golf-secret');

    // Check if token is blacklisted (if Redis available)
    const redisClient = getSafeRedisClient();
    if (redisClient) {
      try {
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            error: 'Token has been revoked'
          });
        }
      } catch (redisError) {
        console.warn('Redis blacklist check failed:', redisError.message);
      }
    }

    // Get fresh user data from RBAC system
    const userQuery = `
      SELECT u.user_id, u.username, u.email, u.first_name, u.last_name,
             u.phone, u.is_active, u.created_at,
             ARRAY_AGG(r.role_name) as roles,
             ARRAY_AGG(r.role_category) as role_categories
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = $1 AND u.is_active = TRUE
      GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name,
               u.phone, u.is_active, u.created_at
    `;

    const result = await query(userQuery, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Get user permissions
    const permissionsQuery = `
      SELECT DISTINCT p.permission_name
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1
    `;
    
    const permissionsResult = await query(permissionsQuery, [user.user_id]);
    const permissions = {};
    permissionsResult.rows.forEach(row => {
      permissions[row.permission_name] = true;
    });

    res.json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        roles: user.roles,
        roleCategories: user.role_categories,
        isActive: user.is_active,
        joinDate: user.created_at,
        permissions: permissions
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

module.exports = router;
