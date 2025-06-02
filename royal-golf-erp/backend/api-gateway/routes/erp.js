const express = require('express');
const { query } = require('../config/database');
const { checkUserPermission, logUserAction } = require('../utils/rbac');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RevenueSummary:
 *       type: object
 *       properties:
 *         total_revenue:
 *           type: number
 *         revenue_streams:
 *           type: array
 *           items:
 *             type: object
 *         period:
 *           type: string
 *     ExpenseSummary:
 *       type: object
 *       properties:
 *         total_expenses:
 *           type: number
 *         expense_categories:
 *           type: array
 *           items:
 *             type: object
 *     MemberAnalytics:
 *       type: object
 *       properties:
 *         member_metrics:
 *           type: object
 *         spending_patterns:
 *           type: array
 *         retention_data:
 *           type: object
 */

/**
 * Middleware to check financial access permissions
 */
const checkFinancialAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has financial access permission
    const hasAccess = await checkUserPermission(userId, 'financial_data_access');
    if (!hasAccess) {
      await logUserAction(userId, 'ACCESS_DENIED', 'Financial ERP', 'DENIED', req.ip);
      return res.status(403).json({ error: 'Insufficient permissions for financial data' });
    }

    // Get user's financial access constraints
    const constraintsResult = await query(`
      SELECT access_level, department_restrictions, amount_limit, date_range_limit
      FROM financial_access_constraints 
      WHERE user_id = $1
    `, [userId]);

    req.user.financialAccess = constraintsResult.rows[0] || {
      access_level: 'restricted',
      department_restrictions: [],
      amount_limit: 1000,
      date_range_limit: 30
    };

    next();
  } catch (error) {
    console.error('Financial access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===============================================================
// EXECUTIVE DASHBOARD ENDPOINTS
// ===============================================================

/**
 * @swagger
 * /api/v1/erp/executive/dashboard:
 *   get:
 *     summary: Get executive dashboard data
 *     tags: [ERP - Executive]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Executive dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   $ref: '#/components/schemas/RevenueSummary'
 *                 expenses:
 *                   $ref: '#/components/schemas/ExpenseSummary'
 *                 members:
 *                   $ref: '#/components/schemas/MemberAnalytics'
 */
router.get('/executive/dashboard', checkFinancialAccess, async (req, res) => {
  try {
    const { access_level, date_range_limit } = req.user.financialAccess;
    
    // Calculate date range based on user's access level
    const dateLimit = date_range_limit || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateLimit);

    // Get revenue summary
    const revenueSummary = await query(`
      SELECT 
        'green_fees' as stream,
        SUM(total_amount) as current_total,
        COUNT(*) as transaction_count
      FROM green_fee_transactions 
      WHERE transaction_date >= $1
      
      UNION ALL
      
      SELECT 
        'membership' as stream,
        SUM(amount) as current_total,
        COUNT(*) as transaction_count
      FROM membership_revenue 
      WHERE payment_date >= $1
      
      UNION ALL
      
      SELECT 
        'fnb' as stream,
        SUM(total_amount) as current_total,
        COUNT(*) as transaction_count
      FROM fnb_revenue_tracking 
      WHERE transaction_date >= $1
      
      UNION ALL
      
      SELECT 
        'pro_shop' as stream,
        SUM(total_amount) as current_total,
        COUNT(*) as transaction_count
      FROM pro_shop_revenue_tracking 
      WHERE transaction_date >= $1
    `, [startDate]);

    // Get expense summary
    const expenseSummary = await query(`
      SELECT 
        'maintenance' as category,
        SUM(amount) as total
      FROM maintenance_expenses 
      WHERE expense_date >= $1
      
      UNION ALL
      
      SELECT 
        'utilities' as category,
        SUM(total_amount) as total
      FROM utility_expenses 
      WHERE billing_period_start >= $1
      
      UNION ALL
      
      SELECT 
        'payroll' as category,
        SUM(gross_pay) as total
      FROM departmental_payroll 
      WHERE pay_period_start >= $1
    `, [startDate]);

    // Get member metrics
    const memberMetrics = await query(`
      SELECT 
        COUNT(DISTINCT member_id) as active_members,
        AVG(total_spent) as avg_spend_per_visit,
        SUM(total_spent) as total_member_spend
      FROM member_visit_analytics 
      WHERE visit_date >= $1
    `, [startDate]);

    // Get KPI metrics
    const kpiMetrics = await query(`
      SELECT metric_name, metric_value, metric_date
      FROM kpi_dashboard_metrics 
      WHERE metric_date >= $1
      ORDER BY metric_date DESC
      LIMIT 50
    `, [startDate]);

    const dashboardData = {
      revenue: {
        streams: revenueSummary.rows,
        total: revenueSummary.rows.reduce((sum, row) => sum + parseFloat(row.current_total || 0), 0)
      },
      expenses: {
        categories: expenseSummary.rows,
        total: expenseSummary.rows.reduce((sum, row) => sum + parseFloat(row.total || 0), 0)
      },
      members: memberMetrics.rows[0] || {},
      kpis: kpiMetrics.rows,
      access_level: access_level,
      date_range: dateLimit
    };

    await logUserAction(req.user.id, 'VIEW', 'Executive Dashboard', 'SUCCESS', req.ip);
    res.json(dashboardData);

  } catch (error) {
    console.error('Executive dashboard error:', error);
    await logUserAction(req.user.id, 'VIEW', 'Executive Dashboard', 'ERROR', req.ip, { error: error.message });
    res.status(500).json({ error: 'Failed to load executive dashboard' });
  }
});

// ===============================================================
// REVENUE MANAGEMENT ENDPOINTS
// ===============================================================

/**
 * @swagger
 * /api/v1/erp/revenue/summary:
 *   get:
 *     summary: Get revenue summary data
 *     tags: [ERP - Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, quarterly, yearly]
 *         description: Time period for analysis
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue summary data
 */
router.get('/revenue/summary', checkFinancialAccess, async (req, res) => {
  try {
    const { period = 'monthly', start_date, end_date } = req.query;
    const { date_range_limit } = req.user.financialAccess;

    // Calculate date range
    let startDate = start_date ? new Date(start_date) : new Date();
    let endDate = end_date ? new Date(end_date) : new Date();

    if (!start_date) {
      startDate.setDate(startDate.getDate() - (date_range_limit || 90));
    }

    // Get revenue data from all streams
    const revenueData = await query(`
      WITH revenue_summary AS (
        SELECT 
          DATE_TRUNC($1, transaction_date) as period,
          'green_fees' as stream,
          SUM(total_amount) as amount,
          COUNT(*) as transactions
        FROM green_fee_transactions 
        WHERE transaction_date BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC($1, transaction_date)
        
        UNION ALL
        
        SELECT 
          DATE_TRUNC($1, payment_date) as period,
          'membership' as stream,
          SUM(amount) as amount,
          COUNT(*) as transactions
        FROM membership_revenue 
        WHERE payment_date BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC($1, payment_date)
        
        UNION ALL
        
        SELECT 
          DATE_TRUNC($1, transaction_date) as period,
          'fnb' as stream,
          SUM(total_amount) as amount,
          COUNT(*) as transactions
        FROM fnb_revenue_tracking 
        WHERE transaction_date BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC($1, transaction_date)
        
        UNION ALL
        
        SELECT 
          DATE_TRUNC($1, transaction_date) as period,
          'pro_shop' as stream,
          SUM(total_amount) as amount,
          COUNT(*) as transactions
        FROM pro_shop_revenue_tracking 
        WHERE transaction_date BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC($1, transaction_date)
      )
      SELECT 
        period,
        stream,
        amount,
        transactions,
        SUM(amount) OVER (PARTITION BY stream ORDER BY period) as cumulative
      FROM revenue_summary
      ORDER BY period, stream
    `, [period, startDate, endDate]);

    res.json({
      period: period,
      date_range: { start: startDate, end: endDate },
      revenue_data: revenueData.rows,
      summary: {
        total_revenue: revenueData.rows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0),
        total_transactions: revenueData.rows.reduce((sum, row) => sum + parseInt(row.transactions || 0), 0)
      }
    });

  } catch (error) {
    console.error('Revenue summary error:', error);
    res.status(500).json({ error: 'Failed to load revenue summary' });
  }
});

/**
 * @swagger
 * /api/v1/erp/revenue/streams:
 *   get:
 *     summary: Get detailed revenue stream data
 *     tags: [ERP - Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stream_type
 *         schema:
 *           type: string
 *         description: Filter by revenue stream type
 *     responses:
 *       200:
 *         description: Revenue stream details
 */
router.get('/revenue/streams', checkFinancialAccess, async (req, res) => {
  try {
    const { stream_type, department } = req.query;
    const { date_range_limit } = req.user.financialAccess;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (date_range_limit || 30));

    let streamData = [];

    // Green Fees
    if (!stream_type || stream_type === 'green_fees') {
      const greenFees = await query(`
        SELECT 
          'green_fees' as stream_type,
          SUM(total_amount) as total_revenue,
          COUNT(*) as transaction_count,
          AVG(total_amount) as avg_transaction,
          round_type,
          COUNT(*) as round_count
        FROM green_fee_transactions 
        WHERE transaction_date >= $1
        GROUP BY round_type
        ORDER BY total_revenue DESC
      `, [startDate]);
      
      streamData.push(...greenFees.rows);
    }

    // Membership Revenue
    if (!stream_type || stream_type === 'membership') {
      const membership = await query(`
        SELECT 
          'membership' as stream_type,
          SUM(amount) as total_revenue,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_transaction,
          payment_type as category,
          COUNT(*) as payment_count
        FROM membership_revenue 
        WHERE payment_date >= $1
        GROUP BY payment_type
        ORDER BY total_revenue DESC
      `, [startDate]);
      
      streamData.push(...membership.rows);
    }

    // F&B Revenue
    if (!stream_type || stream_type === 'fnb') {
      const fnb = await query(`
        SELECT 
          'fnb' as stream_type,
          SUM(total_amount) as total_revenue,
          COUNT(*) as transaction_count,
          AVG(total_amount) as avg_transaction,
          location as category,
          COUNT(*) as order_count
        FROM fnb_revenue_tracking 
        WHERE transaction_date >= $1
        GROUP BY location
        ORDER BY total_revenue DESC
      `, [startDate]);
      
      streamData.push(...fnb.rows);
    }

    // Pro Shop Revenue
    if (!stream_type || stream_type === 'pro_shop') {
      const proShop = await query(`
        SELECT 
          'pro_shop' as stream_type,
          SUM(total_amount) as total_revenue,
          COUNT(*) as transaction_count,
          AVG(total_amount) as avg_transaction,
          'retail' as category,
          COUNT(*) as sale_count
        FROM pro_shop_revenue_tracking 
        WHERE transaction_date >= $1
        GROUP BY 'retail'
        ORDER BY total_revenue DESC
      `, [startDate]);
      
      streamData.push(...proShop.rows);
    }

    res.json({
      stream_type: stream_type || 'all',
      date_range: startDate,
      streams: streamData,
      summary: {
        total_revenue: streamData.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0),
        total_transactions: streamData.reduce((sum, row) => sum + parseInt(row.transaction_count || 0), 0)
      }
    });

  } catch (error) {
    console.error('Revenue streams error:', error);
    res.status(500).json({ error: 'Failed to load revenue streams' });
  }
});

// ===============================================================
// EXPENSE MANAGEMENT ENDPOINTS
// ===============================================================

/**
 * @swagger
 * /api/v1/erp/expenses:
 *   get:
 *     summary: Get all expense reports
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, reimbursed]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of expense reports
 */
router.get('/expenses', checkFinancialAccess, async (req, res) => {
  try {
    const { status, department, user_id, start_date, end_date, limit = 50, offset = 0 } = req.query;
    const { date_range_limit } = req.user.financialAccess;

    // Build dynamic WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Date range constraints
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - (date_range_limit || 90));
    
    const startDateFilter = start_date ? new Date(start_date) : defaultStartDate;
    const endDateFilter = end_date ? new Date(end_date) : new Date();
    
    whereConditions.push(`e.expense_date BETWEEN ${paramIndex} AND ${paramIndex + 1}`);
    queryParams.push(startDateFilter, endDateFilter);
    paramIndex += 2;

    if (status) {
      whereConditions.push(`e.status = ${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (department) {
      whereConditions.push(`u.department = ${paramIndex}`);
      queryParams.push(department);
      paramIndex++;
    }

    if (user_id) {
      whereConditions.push(`e.submitted_by = ${paramIndex}`);
      queryParams.push(user_id);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const expenseReports = await query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.amount,
        e.category,
        e.expense_date,
        e.status,
        e.receipt_url,
        e.submitted_at,
        e.approved_at,
        e.approved_by,
        e.rejection_reason,
        e.reimbursed_at,
        u.first_name || ' ' || u.last_name as submitted_by_name,
        u.department,
        u.email as submitter_email,
        approver.first_name || ' ' || approver.last_name as approved_by_name
      FROM expense_reports e
      JOIN users u ON e.submitted_by = u.id
      LEFT JOIN users approver ON e.approved_by = approver.id
      ${whereClause}
      ORDER BY e.submitted_at DESC
      LIMIT ${paramIndex} OFFSET ${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    // Get total count for pagination
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM expense_reports e
      JOIN users u ON e.submitted_by = u.id
      ${whereClause}
    `, queryParams);

    await logUserAction(req.user.id, 'VIEW', 'Expense Reports', 'SUCCESS', req.ip);
    
    res.json({
      expenses: expenseReports.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].total)
      },
      filters: { status, department, user_id, start_date, end_date }
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    await logUserAction(req.user.id, 'VIEW', 'Expense Reports', 'ERROR', req.ip, { error: error.message });
    res.status(500).json({ error: 'Failed to load expense reports' });
  }
});

/**
 * @swagger
 * /api/v1/erp/expenses:
 *   post:
 *     summary: Submit a new expense report
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - category
 *               - expense_date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: decimal
 *               category:
 *                 type: string
 *               expense_date:
 *                 type: string
 *                 format: date
 *               receipt_data:
 *                 type: string
 *                 description: Base64 encoded receipt image
 *     responses:
 *       201:
 *         description: Expense report created successfully
 */
router.post('/expenses', async (req, res) => {
  try {
    const { title, description, amount, category, expense_date, receipt_data } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!title || !amount || !category || !expense_date) {
      return res.status(400).json({ error: 'Missing required fields: title, amount, category, expense_date' });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Check company policies
    const policies = await query(`
      SELECT max_amount_without_approval, receipt_required_threshold
      FROM expense_policies 
      WHERE active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    const policy = policies.rows[0] || { max_amount_without_approval: 500, receipt_required_threshold: 25 };
    
    // Determine if receipt is required
    const receiptRequired = amount >= policy.receipt_required_threshold;
    if (receiptRequired && !receipt_data) {
      return res.status(400).json({ 
        error: `Receipt is required for expenses over ${policy.receipt_required_threshold}` 
      });
    }

    // Determine initial status based on amount
    const initialStatus = amount > policy.max_amount_without_approval ? 'pending' : 'approved';
    
    // Handle receipt upload (simplified - in production, use proper file storage)
    let receiptUrl = null;
    if (receipt_data) {
      // Simulate receipt processing
      receiptUrl = `/uploads/receipts/${Date.now()}-${userId}.jpg`;
      // In production: save receipt_data to file system or cloud storage
    }

    // Insert expense report
    const newExpense = await query(`
      INSERT INTO expense_reports (
        title, description, amount, category, expense_date, 
        status, receipt_url, submitted_by, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [title, description, amount, category, expense_date, initialStatus, receiptUrl, userId]);

    // If auto-approved, set approval details
    if (initialStatus === 'approved') {
      await query(`
        UPDATE expense_reports 
        SET approved_by = $1, approved_at = NOW(), approval_notes = 'Auto-approved (under policy limit)'
        WHERE id = $2
      `, [userId, newExpense.rows[0].id]);
    }

    // Create audit log
    await query(`
      INSERT INTO expense_audit_log (expense_id, action, performed_by, notes, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [newExpense.rows[0].id, 'SUBMITTED', userId, `Expense submitted with status: ${initialStatus}`]);

    await logUserAction(userId, 'CREATE', 'Expense Report', 'SUCCESS', req.ip, { 
      expense_id: newExpense.rows[0].id, 
      amount: amount 
    });

    res.status(201).json({
      expense: newExpense.rows[0],
      message: initialStatus === 'approved' ? 'Expense submitted and auto-approved' : 'Expense submitted for approval'
    });

  } catch (error) {
    console.error('Submit expense error:', error);
    await logUserAction(req.user?.id, 'CREATE', 'Expense Report', 'ERROR', req.ip, { error: error.message });
    res.status(500).json({ error: 'Failed to submit expense report' });
  }
});

/**
 * @swagger
 * /api/v1/erp/expenses/{id}:
 *   get:
 *     summary: Get expense report details
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expense report details
 */
router.get('/expenses/:id', checkFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Get expense details with submitter and approver info
    const expense = await query(`
      SELECT 
        e.*,
        u.first_name || ' ' || u.last_name as submitted_by_name,
        u.department,
        u.email as submitter_email,
        approver.first_name || ' ' || approver.last_name as approved_by_name,
        approver.email as approver_email
      FROM expense_reports e
      JOIN users u ON e.submitted_by = u.id
      LEFT JOIN users approver ON e.approved_by = approver.id
      WHERE e.id = $1
    `, [id]);

    if (expense.rows.length === 0) {
      return res.status(404).json({ error: 'Expense report not found' });
    }

    // Get audit trail
    const auditTrail = await query(`
      SELECT 
        al.*,
        u.first_name || ' ' || u.last_name as performed_by_name
      FROM expense_audit_log al
      JOIN users u ON al.performed_by = u.id
      WHERE al.expense_id = $1
      ORDER BY al.created_at DESC
    `, [id]);

    await logUserAction(userId, 'VIEW', 'Expense Report Detail', 'SUCCESS', req.ip, { expense_id: id });

    res.json({
      expense: expense.rows[0],
      audit_trail: auditTrail.rows
    });

  } catch (error) {
    console.error('Get expense detail error:', error);
    res.status(500).json({ error: 'Failed to load expense details' });
  }
});

/**
 * @swagger
 * /api/v1/erp/expenses/{id}/approve:
 *   post:
 *     summary: Approve an expense report
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense approved successfully
 */
router.post('/expenses/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has approval permissions
    const hasApprovalPermission = await checkUserPermission(userId, 'expense_approval');
    if (!hasApprovalPermission) {
      return res.status(403).json({ error: 'Insufficient permissions to approve expenses' });
    }

    // Get current expense status
    const expense = await query('SELECT * FROM expense_reports WHERE id = $1', [id]);
    if (expense.rows.length === 0) {
      return res.status(404).json({ error: 'Expense report not found' });
    }

    if (expense.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Expense is not in pending status' });
    }

    // Update expense status
    await query(`
      UPDATE expense_reports 
      SET status = 'approved', approved_by = $1, approved_at = NOW(), approval_notes = $2
      WHERE id = $3
    `, [userId, notes, id]);

    // Create audit log
    await query(`
      INSERT INTO expense_audit_log (expense_id, action, performed_by, notes, created_at)
      VALUES ($1, 'APPROVED', $2, $3, NOW())
    `, [id, userId, notes || 'Expense approved']);

    await logUserAction(userId, 'APPROVE', 'Expense Report', 'SUCCESS', req.ip, { expense_id: id });

    res.json({ message: 'Expense approved successfully' });

  } catch (error) {
    console.error('Approve expense error:', error);
    await logUserAction(req.user?.id, 'APPROVE', 'Expense Report', 'ERROR', req.ip, { 
      expense_id: req.params.id, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to approve expense' });
  }
});

/**
 * @swagger
 * /api/v1/erp/expenses/{id}/reject:
 *   post:
 *     summary: Reject an expense report
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense rejected successfully
 */
router.post('/expenses/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Check if user has approval permissions
    const hasApprovalPermission = await checkUserPermission(userId, 'expense_approval');
    if (!hasApprovalPermission) {
      return res.status(403).json({ error: 'Insufficient permissions to reject expenses' });
    }

    // Get current expense status
    const expense = await query('SELECT * FROM expense_reports WHERE id = $1', [id]);
    if (expense.rows.length === 0) {
      return res.status(404).json({ error: 'Expense report not found' });
    }

    if (expense.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Expense is not in pending status' });
    }

    // Update expense status
    await query(`
      UPDATE expense_reports 
      SET status = 'rejected', approved_by = $1, approved_at = NOW(), rejection_reason = $2
      WHERE id = $3
    `, [userId, reason, id]);

    // Create audit log
    await query(`
      INSERT INTO expense_audit_log (expense_id, action, performed_by, notes, created_at)
      VALUES ($1, 'REJECTED', $2, $3, NOW())
    `, [id, userId, reason]);

    await logUserAction(userId, 'REJECT', 'Expense Report', 'SUCCESS', req.ip, { expense_id: id });

    res.json({ message: 'Expense rejected successfully' });

  } catch (error) {
    console.error('Reject expense error:', error);
    await logUserAction(req.user?.id, 'REJECT', 'Expense Report', 'ERROR', req.ip, { 
      expense_id: req.params.id, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to reject expense' });
  }
});

/**
 * @swagger
 * /api/v1/erp/expenses/categories:
 *   get:
 *     summary: Get expense categories
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expense categories
 */
router.get('/expenses/categories', async (req, res) => {
  try {
    const categories = await query(`
      SELECT 
        id,
        name,
        description,
        is_active,
        requires_receipt,
        max_amount_limit
      FROM expense_categories 
      WHERE is_active = true
      ORDER BY name
    `);

    res.json({ categories: categories.rows });

  } catch (error) {
    console.error('Get expense categories error:', error);
    res.status(500).json({ error: 'Failed to load expense categories' });
  }
});

/**
 * @swagger
 * /api/v1/erp/expenses/policies:
 *   get:
 *     summary: Get expense policies
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current expense policies
 */
router.get('/expenses/policies', async (req, res) => {
  try {
    const policies = await query(`
      SELECT *
      FROM expense_policies 
      WHERE active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const defaultPolicies = {
      max_amount_without_approval: 500,
      receipt_required_threshold: 25,
      approval_workflow: 'department_head',
      reimbursement_timeline_days: 14,
      allowed_categories: ['Equipment', 'Maintenance', 'Office', 'Marketing', 'Travel'],
      currency: 'USD'
    };

    res.json({ 
      policies: policies.rows[0] || defaultPolicies,
      compliance_rules: [
        'All expenses over $25 require receipt attachment',
        'Expenses over $500 require manager approval',
        'Travel expenses require pre-approval',
        'Receipts must be submitted within 30 days'
      ]
    });

  } catch (error) {
    console.error('Get expense policies error:', error);
    res.status(500).json({ error: 'Failed to load expense policies' });
  }
});

/**
 * @swagger
 * /api/v1/erp/expenses/dashboard:
 *   get:
 *     summary: Get expense management dashboard data
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense dashboard KPIs and data
 */
router.get('/expenses/dashboard', checkFinancialAccess, async (req, res) => {
  try {
    const { date_range_limit } = req.user.financialAccess;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (date_range_limit || 30));

    // Get expense KPIs
    const kpis = await query(`
      SELECT 
        COUNT(*) as total_expenses,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'reimbursed' THEN 1 ELSE 0 END) as reimbursed_count,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        AVG(amount) as avg_expense_amount,
        COUNT(DISTINCT submitted_by) as active_submitters
      FROM expense_reports 
      WHERE expense_date >= $1
    `, [startDate]);

    // Get expenses by category
    const categoryBreakdown = await query(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM expense_reports 
      WHERE expense_date >= $1
      GROUP BY category
      ORDER BY total_amount DESC
    `, [startDate]);

    // Get recent activity
    const recentActivity = await query(`
      SELECT 
        e.id,
        e.title,
        e.amount,
        e.status,
        e.submitted_at,
        u.first_name || ' ' || u.last_name as submitted_by_name
      FROM expense_reports e
      JOIN users u ON e.submitted_by = u.id
      WHERE e.expense_date >= $1
      ORDER BY e.submitted_at DESC
      LIMIT 10
    `, [startDate]);

    // Calculate compliance rate
    const complianceData = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN receipt_url IS NOT NULL OR amount < 25 THEN 1 ELSE 0 END) as compliant
      FROM expense_reports 
      WHERE expense_date >= $1
    `, [startDate]);

    const complianceRate = complianceData.rows[0].total > 0 
      ? (complianceData.rows[0].compliant / complianceData.rows[0].total * 100).toFixed(1)
      : 100;

    await logUserAction(req.user.id, 'VIEW', 'Expense Dashboard', 'SUCCESS', req.ip);

    res.json({
      kpis: kpis.rows[0],
      category_breakdown: categoryBreakdown.rows,
      recent_activity: recentActivity.rows,
      compliance_rate: parseFloat(complianceRate),
      date_range: {
        start: startDate,
        end: new Date()
      }
    });

  } catch (error) {
    console.error('Expense dashboard error:', error);
    await logUserAction(req.user.id, 'VIEW', 'Expense Dashboard', 'ERROR', req.ip, { error: error.message });
    res.status(500).json({ error: 'Failed to load expense dashboard' });
  }
});

/**
 * @swagger
 * /api/v1/erp/expenses/summary:
 *   get:
 *     summary: Get expense summary data
 *     tags: [ERP - Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense summary data
 */
router.get('/expenses/summary', checkFinancialAccess, async (req, res) => {
  try {
    const { category, department, period = 'monthly' } = req.query;
    const { date_range_limit } = req.user.financialAccess;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (date_range_limit || 90));

    // Get maintenance expenses
    const maintenance = await query(`
      SELECT 
        'maintenance' as expense_type,
        category,
        SUM(amount) as total_amount,
        COUNT(*) as expense_count,
        AVG(amount) as avg_expense
      FROM maintenance_expenses 
      WHERE expense_date >= $1
      GROUP BY category
      ORDER BY total_amount DESC
    `, [startDate]);

    // Get utility expenses
    const utilities = await query(`
      SELECT 
        'utilities' as expense_type,
        utility_type as category,
        SUM(total_amount) as total_amount,
        COUNT(*) as expense_count,
        AVG(total_amount) as avg_expense
      FROM utility_expenses 
      WHERE billing_period_start >= $1
      GROUP BY utility_type
      ORDER BY total_amount DESC
    `, [startDate]);

    // Get payroll expenses
    const payroll = await query(`
      SELECT 
        'payroll' as expense_type,
        department as category,
        SUM(gross_pay) as total_amount,
        COUNT(*) as expense_count,
        AVG(gross_pay) as avg_expense
      FROM departmental_payroll 
      WHERE pay_period_start >= $1
      GROUP BY department
      ORDER BY total_amount DESC
    `, [startDate]);

    const allExpenses = [...maintenance.rows, ...utilities.rows, ...payroll.rows];

    res.json({
      period: period,
      date_range: startDate,
      expenses: allExpenses,
      summary: {
        total_expenses: allExpenses.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0),
        total_items: allExpenses.reduce((sum, row) => sum + parseInt(row.expense_count || 0), 0),
        by_type: {
          maintenance: maintenance.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0),
          utilities: utilities.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0),
          payroll: payroll.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0)
        }
      }
    });

  } catch (error) {
    console.error('Expense summary error:', error);
    res.status(500).json({ error: 'Failed to load expense summary' });
  }
});

// ===============================================================
// MEMBER ANALYTICS ENDPOINTS
// ===============================================================

/**
 * @swagger
 * /api/v1/erp/members/analytics/overview:
 *   get:
 *     summary: Get member analytics overview
 *     tags: [ERP - Member Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member analytics overview
 */
router.get('/members/analytics/overview', checkFinancialAccess, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const { date_range_limit } = req.user.financialAccess;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (date_range_limit || 90));

    // Get member metrics
    const memberMetrics = await query(`
      WITH member_stats AS (
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
          COUNT(CASE WHEN join_date >= $1 THEN 1 END) as new_members_period
        FROM members
      ),
      spending_stats AS (
        SELECT 
          AVG(ft.amount) as avg_spend_per_member,
          COUNT(DISTINCT ft.member_id) as spending_members
        FROM financial_transactions ft
        WHERE ft.transaction_date >= $1
          AND ft.status = 'completed'
      ),
      booking_stats AS (
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(DISTINCT member_id) as booking_members
        FROM bookings 
        WHERE booking_date >= $1
          AND status IN ('confirmed', 'completed')
      )
      SELECT 
        ms.total_members,
        ms.active_members,
        ms.new_members_period,
        COALESCE(ss.avg_spend_per_member, 0) as avg_spend_per_member,
        COALESCE(bs.total_bookings::float / bs.booking_members, 0) as avg_visits_per_month,
        CASE 
          WHEN ms.total_members > 0 THEN 
            (ms.active_members::float / ms.total_members * 100)
          ELSE 0 
        END as retention_rate,
        CASE 
          WHEN ms.total_members > 0 THEN 
            (ms.new_members_period::float / ms.total_members * 100)
          ELSE 0 
        END as growth_rate
      FROM member_stats ms
      CROSS JOIN spending_stats ss
      CROSS JOIN booking_stats bs
    `, [startDate]);

    res.json({
      period: period,
      date_range: startDate,
      metrics: memberMetrics.rows[0] || {}
    });

  } catch (error) {
    console.error('Member analytics overview error:', error);
    res.status(500).json({ error: 'Failed to load member analytics overview' });
  }
});

/**
 * @swagger
 * /api/v1/erp/members/spending-patterns:
 *   get:
 *     summary: Get member spending pattern analysis
 *     tags: [ERP - Member Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member spending patterns
 */
router.get('/members/spending-patterns', checkFinancialAccess, async (req, res) => {
  try {
    const { member_id, segment, period = 'monthly', tier } = req.query;
    const { date_range_limit } = req.user.financialAccess;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (date_range_limit || 90));

    // Build dynamic WHERE clauses
    let memberWhere = 'WHERE 1=1';
    let params = [startDate];
    let paramIndex = 2;

    if (member_id) {
      memberWhere += ` AND m.id = ${paramIndex}`;
      params.push(member_id);
      paramIndex++;
    }

    if (tier && tier !== 'all') {
      memberWhere += ` AND LOWER(mt.name) = LOWER(${paramIndex})`;
      params.push(tier);
      paramIndex++;
    }

    // Get member spending data
    const spendingData = await query(`
      WITH member_spending AS (
        SELECT 
          m.id as member_id,
          m.first_name || ' ' || m.last_name as member_name,
          m.member_number,
          mt.name as membership_tier,
          m.join_date,
          m.status,
          m.handicap_index,
          COALESCE(SUM(CASE WHEN ft.transaction_type = 'green_fee' THEN ft.amount ELSE 0 END), 0) as green_fees_spent,
          COALESCE(SUM(CASE WHEN ft.transaction_type = 'fnb' THEN ft.amount ELSE 0 END), 0) as fnb_spent,
          COALESCE(SUM(CASE WHEN ft.transaction_type = 'pro_shop' THEN ft.amount ELSE 0 END), 0) as pro_shop_spent,
          COALESCE(SUM(CASE WHEN ft.transaction_type = 'event' THEN ft.amount ELSE 0 END), 0) as event_spent,
          COALESCE(SUM(ft.amount), 0) as total_spent,
          COUNT(DISTINCT ft.transaction_date) as visit_count
        FROM members m
        LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
        LEFT JOIN financial_transactions ft ON m.id = ft.member_id 
          AND ft.transaction_date >= $1 
          AND ft.status = 'completed'
        ${memberWhere.replace('WHERE 1=1', '').trim()}
        GROUP BY m.id, m.first_name, m.last_name, m.member_number, mt.name, m.join_date, m.status, m.handicap_index
      ),
      recent_visits AS (
        SELECT 
          member_id,
          MAX(booking_date) as last_visit
        FROM bookings 
        WHERE booking_date >= $1
          AND status IN ('confirmed', 'completed')
        GROUP BY member_id
      )
      SELECT 
        ms.*,
        CASE 
          WHEN ms.visit_count > 0 THEN (ms.total_spent / ms.visit_count)
          ELSE 0 
        END as avg_spend_per_visit,
        COALESCE(rv.last_visit, '1900-01-01'::date) as last_visit
      FROM member_spending ms
      LEFT JOIN recent_visits rv ON ms.member_id = rv.member_id
      ORDER BY ms.total_spent DESC
      LIMIT 100
    `, params);

    res.json({
      period: period,
      date_range: startDate,
      spending_data: spendingData.rows,
      summary: {
        total_members_analyzed: spendingData.rows.length,
        avg_member_spend: spendingData.rows.reduce((sum, row) => sum + parseFloat(row.total_spent || 0), 0) / spendingData.rows.length || 0,
        total_revenue_analyzed: spendingData.rows.reduce((sum, row) => sum + parseFloat(row.total_spent || 0), 0)
      }
    });

  } catch (error) {
    console.error('Member spending patterns error:', error);
    res.status(500).json({ error: 'Failed to load member spending patterns' });
  }
});

/**
 * @swagger
 * /api/v1/erp/members/segmentation:
 *   get:
 *     summary: Get member segmentation data
 *     tags: [ERP - Member Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member segmentation analysis
 */
router.get('/members/segmentation', checkFinancialAccess, async (req, res) => {
  try {
    const { date_range_limit } = req.user.financialAccess;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (date_range_limit || 90));

    // Get membership tier breakdown
    const tierBreakdown = await query(`
      WITH tier_spending AS (
        SELECT 
          mt.name as tier_name,
          COUNT(m.id) as member_count,
          COALESCE(AVG(ft.amount), 0) as avg_spend,
          COALESCE(SUM(ft.amount), 0) as total_revenue
        FROM membership_tiers mt
        LEFT JOIN members m ON mt.id = m.membership_tier_id AND m.status = 'active'
        LEFT JOIN financial_transactions ft ON m.id = ft.member_id 
          AND ft.transaction_date >= $1 
          AND ft.status = 'completed'
        GROUP BY mt.id, mt.name
      ),
      total_members AS (
        SELECT COUNT(*) as total FROM members WHERE status = 'active'
      )
      SELECT 
        ts.tier_name as segment,
        ts.member_count as count,
        ts.avg_spend,
        ts.total_revenue,
        CASE 
          WHEN tm.total > 0 THEN (ts.member_count::float / tm.total * 100)
          ELSE 0 
        END as percentage
      FROM tier_spending ts
      CROSS JOIN total_members tm
      ORDER BY ts.total_revenue DESC
    `, [startDate]);

    // Get engagement segmentation
    const engagementSegments = await query(`
      WITH member_engagement AS (
        SELECT 
          m.id,
          COUNT(b.id) as booking_count,
          COALESCE(SUM(ft.amount), 0) as total_spent
        FROM members m
        LEFT JOIN bookings b ON m.id = b.member_id 
          AND b.booking_date >= $1
          AND b.status IN ('confirmed', 'completed')
        LEFT JOIN financial_transactions ft ON m.id = ft.member_id 
          AND ft.transaction_date >= $1 
          AND ft.status = 'completed'
        WHERE m.status = 'active'
        GROUP BY m.id
      ),
      segments AS (
        SELECT 
          CASE 
            WHEN booking_count >= 10 AND total_spent >= 2000 THEN 'High Value'
            WHEN booking_count >= 5 AND total_spent >= 1000 THEN 'Regular'
            WHEN booking_count >= 1 AND total_spent >= 100 THEN 'Occasional'
            ELSE 'Inactive'
          END as segment,
          COUNT(*) as member_count,
          AVG(total_spent) as avg_spend,
          SUM(total_spent) as total_revenue
        FROM member_engagement
        GROUP BY 
          CASE 
            WHEN booking_count >= 10 AND total_spent >= 2000 THEN 'High Value'
            WHEN booking_count >= 5 AND total_spent >= 1000 THEN 'Regular'
            WHEN booking_count >= 1 AND total_spent >= 100 THEN 'Occasional'
            ELSE 'Inactive'
          END
      ),
      total_members AS (
        SELECT COUNT(*) as total FROM members WHERE status = 'active'
      )
      SELECT 
        s.segment,
        s.member_count as count,
        s.avg_spend,
        s.total_revenue,
        CASE 
          WHEN tm.total > 0 THEN (s.member_count::float / tm.total * 100)
          ELSE 0 
        END as percentage
      FROM segments s
      CROSS JOIN total_members tm
      ORDER BY s.total_revenue DESC
    `, [startDate]);

    res.json({
      date_range: startDate,
      tier_breakdown: tierBreakdown.rows,
      engagement_segments: engagementSegments.rows
    });

  } catch (error) {
    console.error('Member segmentation error:', error);
    res.status(500).json({ error: 'Failed to load member segmentation' });
  }
});

/**
 * @swagger
 * /api/v1/erp/members/engagement-metrics:
 *   get:
 *     summary: Get member engagement trends
 *     tags: [ERP - Member Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member engagement trends
 */
router.get('/members/engagement-metrics', checkFinancialAccess, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const { date_range_limit } = req.user.financialAccess;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (date_range_limit || 180)); // 6 months default

    // Get monthly engagement trends
    const engagementTrends = await query(`
      WITH monthly_data AS (
        SELECT 
          DATE_TRUNC('month', generate_series) as month
        FROM generate_series($1, CURRENT_DATE, '1 month')
      ),
      new_members AS (
        SELECT 
          DATE_TRUNC('month', join_date) as month,
          COUNT(*) as new_members
        FROM members 
        WHERE join_date >= $1
        GROUP BY DATE_TRUNC('month', join_date)
      ),
      active_members AS (
        SELECT 
          DATE_TRUNC('month', b.booking_date) as month,
          COUNT(DISTINCT b.member_id) as active_members,
          COUNT(b.id) as total_bookings
        FROM bookings b
        WHERE b.booking_date >= $1
          AND b.status IN ('confirmed', 'completed')
        GROUP BY DATE_TRUNC('month', b.booking_date)
      ),
      member_spending AS (
        SELECT 
          DATE_TRUNC('month', ft.transaction_date) as month,
          AVG(ft.amount) as avg_spend_per_member
        FROM financial_transactions ft
        WHERE ft.transaction_date >= $1
          AND ft.status = 'completed'
        GROUP BY DATE_TRUNC('month', ft.transaction_date)
      )
      SELECT 
        TO_CHAR(md.month, 'Mon') as month,
        COALESCE(nm.new_members, 0) as new_members,
        COALESCE(am.active_members, 0) as active_members,
        COALESCE(am.total_bookings, 0) as total_bookings,
        COALESCE(ms.avg_spend_per_member, 0) as avg_spend_per_member,
        0 as churned_members -- This would need more complex logic to track churned members
      FROM monthly_data md
      LEFT JOIN new_members nm ON md.month = nm.month
      LEFT JOIN active_members am ON md.month = am.month
      LEFT JOIN member_spending ms ON md.month = ms.month
      ORDER BY md.month
    `, [startDate]);

    res.json({
      period: period,
      date_range: startDate,
      engagement_trends: engagementTrends.rows
    });

  } catch (error) {
    console.error('Member engagement metrics error:', error);
    res.status(500).json({ error: 'Failed to load member engagement metrics' });
  }
});

// ===============================================================
// KPI AND REPORTING ENDPOINTS
// ===============================================================

/**
 * @swagger
 * /api/v1/erp/kpi/metrics:
 *   get:
 *     summary: Get KPI dashboard metrics
 *     tags: [ERP - KPI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPI metrics data
 */
router.get('/kpi/metrics', checkFinancialAccess, async (req, res) => {
  try {
    const { metric_type, date, department } = req.query;
    const { date_range_limit } = req.user.financialAccess;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (date_range_limit || 30));

    const kpiMetrics = await query(`
      SELECT 
        metric_type,
        metric_name,
        metric_value,
        metric_date,
        department,
        calculation_metadata
      FROM kpi_dashboard_metrics 
      WHERE metric_date >= $1
      ${metric_type ? 'AND metric_type = $2' : ''}
      ${department ? `AND department = $${metric_type ? 3 : 2}` : ''}
      ORDER BY metric_date DESC, metric_type
      LIMIT 200
    `, metric_type 
      ? (department ? [startDate, metric_type, department] : [startDate, metric_type])
      : (department ? [startDate, department] : [startDate])
    );

    // Get financial period summary
    const periodSummary = await query(`
      SELECT *
      FROM financial_period_summary 
      WHERE period_start >= $1
      ORDER BY period_start DESC
      LIMIT 10
    `, [startDate]);

    res.json({
      date_range: startDate,
      kpi_metrics: kpiMetrics.rows,
      period_summary: periodSummary.rows,
      filters: {
        metric_type: metric_type || 'all',
        department: department || 'all'
      }
    });

  } catch (error) {
    console.error('KPI metrics error:', error);
    res.status(500).json({ error: 'Failed to load KPI metrics' });
  }
});

// ===============================================================
// EXPORT FUNCTIONALITY
// ===============================================================

/**
 * @swagger
 * /api/v1/erp/export/{reportType}:
 *   get:
 *     summary: Export financial reports
 *     tags: [ERP - Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [executive-summary, revenue-analytics, expense-report, member-analytics]
 *     responses:
 *       200:
 *         description: Exported report file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/:reportType', checkFinancialAccess, async (req, res) => {
  try {
    const { reportType } = req.params;
    const { period = 'monthly' } = req.query;

    // For now, return a simple JSON export - in production, you'd generate Excel/PDF
    let exportData = {};

    switch (reportType) {
      case 'executive-summary':
        exportData = {
          report: 'Executive Summary',
          period: period,
          generated_at: new Date().toISOString(),
          data: 'Executive summary data would be here'
        };
        break;
      case 'revenue-analytics':
        exportData = {
          report: 'Revenue Analytics',
          period: period,
          generated_at: new Date().toISOString(),
          data: 'Revenue analytics data would be here'
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${period}_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

module.exports = router;
