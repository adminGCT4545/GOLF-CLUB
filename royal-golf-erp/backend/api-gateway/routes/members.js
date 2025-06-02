const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { query: dbQuery, transaction } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Member:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         memberNumber:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         membershipTier:
 *           type: string
 *         handicapIndex:
 *           type: number
 *         joinDate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/members:
 *   get:
 *     summary: Get all members
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of members per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of members
 */
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('membershipTier').optional().isString(),
  query('status').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search;
  const membershipTier = req.query.membershipTier;
  const status = req.query.status;

  try {
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR member_number ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (membershipTier) {
      paramCount++;
      whereClause += ` AND mt.name = $${paramCount}`;
      queryParams.push(membershipTier);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND m.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM members m
      LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
      ${whereClause}
    `;
    const countResult = await dbQuery(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get members with pagination
    const membersQuery = `
      SELECT 
        m.id,
        m.member_number,
        m.first_name,
        m.last_name,
        m.email,
        m.phone,
        m.handicap_index,
        m.join_date,
        m.status,
        m.profile_image_url,
        mt.name as membership_tier,
        m.created_at,
        m.updated_at
      FROM members m
      LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    const result = await dbQuery(membersQuery, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/members:
 *   post:
 *     summary: Create a new member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - member_number
 *               - first_name
 *               - last_name
 *               - email
 *               - join_date
 *             properties:
 *               member_number:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               membership_tier:
 *                 type: string
 *               status:
 *                 type: string
 *               join_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Member created successfully
 */
router.post('/', authMiddleware, [
  body('member_number').notEmpty().withMessage('Member number is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('join_date').isISO8601().withMessage('Valid join date is required'),
  body('membership_tier').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']),
  body('phone').optional().isString(),
  body('address').optional().isObject(),
  body('points').optional().isNumeric(),
  body('referral_source').optional().isString(),
  body('notes').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const {
    member_number,
    first_name,
    last_name,
    email,
    phone,
    address,
    membership_tier,
    status = 'active',
    join_date,
    expiration_date,
    points = 0,
    referral_source,
    notes
  } = req.body;

  try {
    // Check if member number or email already exists
    const existingQuery = `
      SELECT id FROM members 
      WHERE member_number = $1 OR email = $2
    `;
    const existingResult = await dbQuery(existingQuery, [member_number, email]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Member number or email already exists'
      });
    }

    // Get membership tier ID if provided
    let membership_tier_id = null;
    if (membership_tier) {
      const tierQuery = 'SELECT id FROM membership_tiers WHERE name = $1';
      const tierResult = await dbQuery(tierQuery, [membership_tier]);
      if (tierResult.rows.length > 0) {
        membership_tier_id = tierResult.rows[0].id;
      }
    }

    // Insert new member
    const insertQuery = `
      INSERT INTO members (
        member_number, first_name, last_name, email, phone, address,
        membership_tier_id, status, join_date, preferences
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const preferences = {
      points: points,
      referral_source: referral_source,
      notes: notes
    };

    const insertResult = await dbQuery(insertQuery, [
      member_number,
      first_name,
      last_name,
      email,
      phone,
      address,
      membership_tier_id,
      status,
      join_date,
      JSON.stringify(preferences)
    ]);

    const newMember = insertResult.rows[0];

    res.status(201).json({
      success: true,
      data: newMember,
      message: 'Member created successfully'
    });

  } catch (error) {
    console.error('Create member error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        error: 'Member number or email already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}));

/**
 * @swagger
 * /api/v1/members/stats:
 *   get:
 *     summary: Get member statistics
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member statistics
 */
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  try {
    // Get overall member statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as totalMembers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activeMembers,
        COUNT(CASE WHEN join_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as newThisMonth,
        COUNT(CASE WHEN join_date <= CURRENT_DATE - INTERVAL '11 months' 
                   AND join_date >= CURRENT_DATE - INTERVAL '12 months' THEN 1 END) as expiringMembers
      FROM members
    `;

    const result = await dbQuery(statsQuery);
    const stats = result.rows[0];

    // Convert string numbers to integers
    const formattedStats = {
      totalMembers: parseInt(stats.totalmembers),
      activeMembers: parseInt(stats.activemembers),
      newThisMonth: parseInt(stats.newthismonth),
      expiringMembers: parseInt(stats.expiringmembers)
    };

    res.json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('Get member stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/members/directory:
 *   get:
 *     summary: Get member directory
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member directory
 */
router.get('/directory', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const directoryQuery = `
      SELECT 
        m.id,
        m.member_number,
        m.first_name,
        m.last_name,
        m.email,
        m.phone,
        m.handicap_index,
        mt.name as membership_tier,
        m.profile_image_url
      FROM members m
      LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
      WHERE m.status = 'active'
      ORDER BY m.last_name, m.first_name
    `;

    const result = await dbQuery(directoryQuery);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get member directory error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/members/{id}:
 *   get:
 *     summary: Get member by ID
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member details
 *       404:
 *         description: Member not found
 */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const memberQuery = `
      SELECT 
        m.*,
        mt.name as membership_tier,
        mt.description as tier_description,
        mt.benefits as tier_benefits
      FROM members m
      LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
      WHERE m.id = $1
    `;

    const result = await dbQuery(memberQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    const member = result.rows[0];

    // Get member's recent bookings
    const bookingsQuery = `
      SELECT 
        b.id,
        b.players_count,
        b.status,
        b.total_amount,
        b.booking_date,
        tt.tee_time,
        c.name as course_name
      FROM bookings b
      JOIN tee_times tt ON b.tee_time_id = tt.id
      JOIN courses c ON tt.course_id = c.id
      WHERE b.member_id = $1
      ORDER BY tt.tee_time DESC
      LIMIT 5
    `;
    const bookingsResult = await dbQuery(bookingsQuery, [id]);

    // Get member's financial summary
    const financialQuery = `
      SELECT 
        COUNT(*) as transaction_count,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_charges,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
      FROM financial_transactions
      WHERE member_id = $1
    `;
    const financialResult = await dbQuery(financialQuery, [id]);

    res.json({
      success: true,
      data: {
        ...member,
        recentBookings: bookingsResult.rows,
        financialSummary: financialResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/members/{id}:
 *   put:
 *     summary: Update member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               handicapIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Member updated successfully
 *       404:
 *         description: Member not found
 */
router.put('/:id', authMiddleware, [
  body('firstName').optional().isString().trim(),
  body('lastName').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isString().trim(),
  body('handicapIndex').optional().isNumeric()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  try {
    // Check if member exists
    const checkQuery = 'SELECT id FROM members WHERE id = $1';
    const checkResult = await dbQuery(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Build update query dynamically
    const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'handicap_index'];
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      handicapIndex: 'handicap_index'
    };

    const updates = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      const dbField = fieldMap[key];
      if (dbField && allowedFields.includes(dbField)) {
        paramCount++;
        updates.push(`${dbField} = $${paramCount}`);
        values.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    paramCount++;
    values.push(id);

    const updateQuery = `
      UPDATE members 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await dbQuery(updateQuery, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Member updated successfully'
    });

  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/members/{id}/stats:
 *   get:
 *     summary: Get individual member statistics
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member statistics
 */
router.get('/:id/stats', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Booking statistics
    const bookingStatsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_rounds,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        AVG(b.total_amount) as avg_round_cost
      FROM bookings b
      WHERE b.member_id = $1
    `;

    // Financial statistics
    const financialStatsQuery = `
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_spent,
        COUNT(*) as total_transactions,
        AVG(CASE WHEN amount > 0 THEN amount ELSE NULL END) as avg_transaction_amount
      FROM financial_transactions
      WHERE member_id = $1
    `;

    // Tournament participation
    const tournamentStatsQuery = `
      SELECT 
        COUNT(DISTINCT er.event_id) as tournaments_participated,
        COUNT(CASE WHEN er.payment_status = 'completed' THEN 1 END) as tournaments_completed
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.member_id = $1 AND e.event_type = 'tournament'
    `;

    const [bookingStats, financialStats, tournamentStats] = await Promise.all([
      dbQuery(bookingStatsQuery, [id]),
      dbQuery(financialStatsQuery, [id]),
      dbQuery(tournamentStatsQuery, [id])
    ]);

    res.json({
      success: true,
      data: {
        bookings: bookingStats.rows[0],
        financial: financialStats.rows[0],
        tournaments: tournamentStats.rows[0]
      }
    });

  } catch (error) {
    console.error('Get member stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/members/{id}/renewal:
 *   post:
 *     summary: Renew member membership
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: integer
 *                 description: Renewal duration in months
 *               payment_method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Membership renewed successfully
 */
router.post('/:id/renewal', authMiddleware, [
  body('duration').isInt({ min: 1, max: 24 }).withMessage('Duration must be between 1 and 24 months'),
  body('payment_method').notEmpty().withMessage('Payment method is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { id } = req.params;
  const { duration, payment_method } = req.body;

  try {
    // Get member and membership tier info
    const memberQuery = `
      SELECT m.*, mt.monthly_dues, mt.name as tier_name
      FROM members m
      JOIN membership_tiers mt ON m.membership_tier_id = mt.id
      WHERE m.id = $1
    `;
    const memberResult = await dbQuery(memberQuery, [id]);

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    const member = memberResult.rows[0];
    const renewalAmount = parseFloat(member.monthly_dues) * duration;

    // Create financial transaction for renewal
    const transactionQuery = `
      INSERT INTO financial_transactions (
        transaction_type, member_id, amount, description, 
        transaction_date, status, reference_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const transactionResult = await dbQuery(transactionQuery, [
      'membership_renewal',
      id,
      renewalAmount,
      `Membership renewal for ${duration} months`,
      new Date().toISOString().split('T')[0],
      'pending',
      `REN-${Date.now()}`
    ]);

    res.json({
      success: true,
      data: {
        member: member,
        transaction: transactionResult.rows[0],
        renewal_amount: renewalAmount
      },
      message: 'Membership renewal initiated'
    });

  } catch (error) {
    console.error('Member renewal error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

module.exports = router;
