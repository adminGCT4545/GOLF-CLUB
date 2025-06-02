const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  authMiddleware, 
  authorize, 
  requirePermission, 
  requireRoleCategory, 
  hasAnyPermission 
} = require('../middleware/auth');
const { 
  checkRefundPermission, 
  logUserAction, 
  getUserPermissions 
} = require('../utils/rbac');

const router = express.Router();

/**
 * @swagger
 * /api/v1/rbac-demo/user-info:
 *   get:
 *     summary: Get current user RBAC information
 *     tags: [RBAC Demo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User RBAC information retrieved successfully
 */
router.get('/user-info', authMiddleware, asyncHandler(async (req, res) => {
  const userPermissions = await getUserPermissions(req.user.id);
  
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      roles: req.user.roles,
      roleCategories: req.user.roleCategories,
      permissions: userPermissions
    }
  });
}));

/**
 * @swagger
 * /api/v1/rbac-demo/members:
 *   get:
 *     summary: Get member list (requires member_data_full_access or member_data_limited permission)
 *     tags: [RBAC Demo]
 *     security:
 *       - bearerAuth: []
 */
router.get('/members', 
  authMiddleware, 
  hasAnyPermission(['member_data_full_access', 'member_data_limited']),
  asyncHandler(async (req, res) => {
    // Log the access
    await logUserAction(req.user.id, 'view_members', '/api/v1/rbac-demo/members', 'granted', req.ip);
    
    // Get member data (limited based on permission)
    const hasFullAccess = req.user.permissions['member_data_full_access'];
    
    let memberQuery;
    if (hasFullAccess) {
      memberQuery = `
        SELECT m.*, mt.name as membership_tier
        FROM members m
        LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
        ORDER BY m.last_name, m.first_name
        LIMIT 10
      `;
    } else {
      memberQuery = `
        SELECT m.first_name, m.last_name, m.email, mt.name as membership_tier
        FROM members m
        LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
        ORDER BY m.last_name, m.first_name
        LIMIT 10
      `;
    }
    
    const result = await query(memberQuery);
    
    res.json({
      success: true,
      accessLevel: hasFullAccess ? 'full' : 'limited',
      members: result.rows
    });
  })
);

/**
 * @swagger
 * /api/v1/rbac-demo/members/{id}:
 *   put:
 *     summary: Update member information (requires member_update permission)
 *     tags: [RBAC Demo]
 *     security:
 *       - bearerAuth: []
 */
router.put('/members/:id', 
  authMiddleware,
  requirePermission('member_update'),
  [
    body('firstName').optional().isLength({ min: 1 }),
    body('lastName').optional().isLength({ min: 1 }),
    body('email').optional().isEmail()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { firstName, lastName, email } = req.body;
    
    // Log the update attempt
    await logUserAction(req.user.id, 'update_member', `/api/v1/rbac-demo/members/${id}`, 'granted', req.ip, {
      memberId: id,
      updates: req.body
    });

    // Update member (simplified for demo)
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (firstName) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (email) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    values.push(id);
    const updateQuery = `
      UPDATE members 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, first_name, last_name, email
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member updated successfully',
      member: result.rows[0]
    });
  })
);

/**
 * @swagger
 * /api/v1/rbac-demo/pos/refund:
 *   post:
 *     summary: Process a refund (requires appropriate refund permission based on amount)
 *     tags: [RBAC Demo]
 *     security:
 *       - bearerAuth: []
 */
router.post('/pos/refund',
  authMiddleware,
  requirePermission('pos_transaction'),
  [
    body('amount').isFloat({ min: 0.01 }),
    body('reason').isLength({ min: 5 }),
    body('transactionId').optional()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { amount, reason, transactionId } = req.body;

    // Check refund permission with amount constraint
    const refundCheck = await checkRefundPermission(req.user.id, amount);
    
    if (!refundCheck.allowed) {
      await logUserAction(req.user.id, 'refund_attempt', '/api/v1/rbac-demo/pos/refund', 'denied', req.ip, {
        amount,
        reason: 'Insufficient refund authority'
      });
      
      return res.status(403).json({
        success: false,
        error: 'Refund not authorized',
        message: 'You do not have permission to process this refund amount'
      });
    }

    // Log successful refund
    await logUserAction(req.user.id, 'refund_processed', '/api/v1/rbac-demo/pos/refund', 'granted', req.ip, {
      amount,
      reason,
      transactionId,
      maxAmount: refundCheck.maxAmount
    });

    // Simulate refund processing
    const refundId = `REF-${Date.now()}`;

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refundId,
        amount,
        reason,
        processedBy: req.user.username,
        processedAt: new Date().toISOString(),
        maxAuthorizedAmount: refundCheck.maxAmount || 'unlimited'
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/rbac-demo/inventory:
 *   get:
 *     summary: Get inventory data (access level depends on permissions)
 *     tags: [RBAC Demo]
 *     security:
 *       - bearerAuth: []
 */
router.get('/inventory',
  authMiddleware,
  hasAnyPermission(['inventory_full_access', 'inventory_view_all', 'inventory_view_department']),
  asyncHandler(async (req, res) => {
    const { permissions } = req.user;
    let accessLevel = 'none';
    let inventoryQuery = '';

    if (permissions['inventory_full_access']) {
      accessLevel = 'full';
      inventoryQuery = `
        SELECT p.*, 
               p.price - p.cost as profit_margin,
               CASE WHEN p.stock_quantity <= p.min_stock_level THEN 'LOW' ELSE 'OK' END as stock_status
        FROM products p 
        ORDER BY p.category, p.name
        LIMIT 10
      `;
    } else if (permissions['inventory_view_all']) {
      accessLevel = 'view_all';
      inventoryQuery = `
        SELECT p.name, p.category, p.stock_quantity, p.min_stock_level,
               CASE WHEN p.stock_quantity <= p.min_stock_level THEN 'LOW' ELSE 'OK' END as stock_status
        FROM products p 
        ORDER BY p.category, p.name
        LIMIT 10
      `;
    } else {
      accessLevel = 'department';
      inventoryQuery = `
        SELECT p.name, p.category, p.stock_quantity,
               CASE WHEN p.stock_quantity <= p.min_stock_level THEN 'LOW' ELSE 'OK' END as stock_status
        FROM products p 
        WHERE p.category IN ('Golf Equipment', 'Apparel')
        ORDER BY p.category, p.name
        LIMIT 10
      `;
    }

    const result = await query(inventoryQuery);
    
    await logUserAction(req.user.id, 'view_inventory', '/api/v1/rbac-demo/inventory', 'granted', req.ip, {
      accessLevel
    });

    res.json({
      success: true,
      accessLevel,
      inventory: result.rows
    });
  })
);

/**
 * @swagger
 * /api/v1/rbac-demo/reports/financial:
 *   get:
 *     summary: Get financial reports (role-based access)
 *     tags: [RBAC Demo]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/financial',
  authMiddleware,
  hasAnyPermission(['financial_reports_full', 'financial_reports_daily', 'financial_reports_department']),
  asyncHandler(async (req, res) => {
    const { permissions } = req.user;
    let reportType = '';
    let reportData = {};

    if (permissions['financial_reports_full']) {
      reportType = 'full';
      reportData = {
        dailyRevenue: 15420.50,
        weeklyRevenue: 87350.25,
        monthlyRevenue: 356789.75,
        yearlyRevenue: 2845632.10,
        expenses: {
          daily: 5230.25,
          weekly: 34567.80,
          monthly: 156789.45
        },
        profitMargin: 24.5
      };
    } else if (permissions['financial_reports_daily']) {
      reportType = 'daily';
      reportData = {
        dailyRevenue: 15420.50,
        transactions: 156,
        averageTransaction: 98.85
      };
    } else {
      reportType = 'department';
      reportData = {
        proShopRevenue: 5680.25,
        fnbRevenue: 3240.75,
        greenFeesRevenue: 6500.00
      };
    }

    await logUserAction(req.user.id, 'view_financial_reports', '/api/v1/rbac-demo/reports/financial', 'granted', req.ip, {
      reportType
    });

    res.json({
      success: true,
      reportType,
      data: reportData,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.username
    });
  })
);

/**
 * @swagger
 * /api/v1/rbac-demo/admin/system-settings:
 *   get:
 *     summary: Get system settings (Super users only)
 *     tags: [RBAC Demo]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/system-settings',
  authMiddleware,
  requireRoleCategory(['super_user']),
  requirePermission('system_admin_full'),
  asyncHandler(async (req, res) => {
    await logUserAction(req.user.id, 'view_system_settings', '/api/v1/rbac-demo/admin/system-settings', 'granted', req.ip);

    res.json({
      success: true,
      settings: {
        systemVersion: '1.0.0-beta',
        databaseStatus: 'healthy',
        activeUsers: 156,
        systemUptime: '15 days, 4 hours',
        backupStatus: 'completed',
        lastBackup: '2025-05-31T03:00:00Z'
      },
      message: 'System settings accessed with full administrative privileges'
    });
  })
);

/**
 * @swagger
 * /api/v1/rbac-demo/employee-only:
 *   get:
 *     summary: Employee-only endpoint
 *     tags: [RBAC Demo]
 *     security:
 *       - bearerAuth: []
 */
router.get('/employee-only',
  authMiddleware,
  requireRoleCategory(['employee', 'super_user']),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'This endpoint is accessible by employees and super users only',
      userRoles: req.user.roles,
      userCategories: req.user.roleCategories
    });
  })
);

module.exports = router;
