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
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         memberId:
 *           type: string
 *         teeTimeId:
 *           type: string
 *         playersCount:
 *           type: integer
 *         guestNames:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *         totalAmount:
 *           type: number
 *         bookingDate:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get bookings
 *     tags: [Bookings]
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
 *         description: Number of bookings per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by booking status
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *         description: Filter by member ID
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  query('memberId').optional().isUUID()
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
  const { status, memberId } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND b.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (memberId) {
      paramCount++;
      whereClause += ` AND b.member_id = $${paramCount}`;
      queryParams.push(memberId);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `;
    const countResult = await dbQuery(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get bookings with pagination
    const bookingsQuery = `
      SELECT 
        b.*,
        m.first_name,
        m.last_name,
        m.member_number,
        tt.tee_time,
        c.name as course_name,
        c.holes as course_holes
      FROM bookings b
      JOIN members m ON b.member_id = m.id
      JOIN tee_times tt ON b.tee_time_id = tt.id
      JOIN courses c ON tt.course_id = c.id
      ${whereClause}
      ORDER BY tt.tee_time DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    const result = await dbQuery(bookingsQuery, queryParams);

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
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teeTimeId
 *               - playersCount
 *             properties:
 *               teeTimeId:
 *                 type: string
 *               playersCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *               guestNames:
 *                 type: array
 *                 items:
 *                   type: string
 *               specialRequests:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error or tee time not available
 */
router.post('/', authMiddleware, [
  body('teeTimeId').isUUID(),
  body('playersCount').isInt({ min: 1, max: 4 }),
  body('guestNames').optional().isArray(),
  body('specialRequests').optional().isString().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { teeTimeId, playersCount, guestNames = [], specialRequests } = req.body;
  const memberId = req.user.userId; // From auth middleware

  try {
    const result = await transaction(async (client) => {
      // Check tee time availability
      const teeTimeQuery = `
        SELECT tt.*, c.name as course_name 
        FROM tee_times tt
        JOIN courses c ON tt.course_id = c.id
        WHERE tt.id = $1 AND tt.is_available = true AND tt.available_spots >= $2
      `;
      
      const teeTimeResult = await client.query(teeTimeQuery, [teeTimeId, playersCount]);
      
      if (teeTimeResult.rows.length === 0) {
        throw new Error('Tee time not available or insufficient spots');
      }

      const teeTime = teeTimeResult.rows[0];

      // Calculate total amount
      const totalAmount = (teeTime.green_fee || 0) * playersCount + (teeTime.cart_fee || 0) * Math.ceil(playersCount / 2);

      // Create booking
      const bookingQuery = `
        INSERT INTO bookings (member_id, tee_time_id, players_count, guest_names, status, total_amount, special_requests)
        VALUES ($1, $2, $3, $4, 'confirmed', $5, $6)
        RETURNING *
      `;

      const bookingResult = await client.query(bookingQuery, [
        memberId,
        teeTimeId,
        playersCount,
        guestNames,
        totalAmount,
        specialRequests
      ]);

      // Update tee time availability
      const updateTeeTimeQuery = `
        UPDATE tee_times 
        SET available_spots = available_spots - $1,
            is_available = CASE WHEN available_spots - $1 <= 0 THEN false ELSE true END
        WHERE id = $2
      `;
      
      await client.query(updateTeeTimeQuery, [playersCount, teeTimeId]);

      return bookingResult.rows[0];
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Create booking error:', error);
    
    if (error.message === 'Tee time not available or insufficient spots') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   put:
 *     summary: Update booking
 *     tags: [Bookings]
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
 *               playersCount:
 *                 type: integer
 *               guestNames:
 *                 type: array
 *                 items:
 *                   type: string
 *               specialRequests:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       404:
 *         description: Booking not found
 */
router.put('/:id', authMiddleware, [
  body('playersCount').optional().isInt({ min: 1, max: 4 }),
  body('guestNames').optional().isArray(),
  body('specialRequests').optional().isString().trim()
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
    // Check if booking exists and belongs to user
    const checkQuery = `
      SELECT b.*, tt.green_fee, tt.cart_fee 
      FROM bookings b
      JOIN tee_times tt ON b.tee_time_id = tt.id
      WHERE b.id = $1 AND (b.member_id = $2 OR $3 = ANY(ARRAY['admin', 'manager']))
    `;
    
    const userRoles = req.user.roles || [];
    const checkResult = await dbQuery(checkQuery, [id, req.user.userId, userRoles]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or access denied'
      });
    }

    const booking = checkResult.rows[0];

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (updateData.playersCount !== undefined) {
      paramCount++;
      updates.push(`players_count = $${paramCount}`);
      values.push(updateData.playersCount);

      // Recalculate total amount
      const newTotal = booking.green_fee * updateData.playersCount + 
                      booking.cart_fee * Math.ceil(updateData.playersCount / 2);
      paramCount++;
      updates.push(`total_amount = $${paramCount}`);
      values.push(newTotal);
    }

    if (updateData.guestNames !== undefined) {
      paramCount++;
      updates.push(`guest_names = $${paramCount}`);
      values.push(updateData.guestNames);
    }

    if (updateData.specialRequests !== undefined) {
      paramCount++;
      updates.push(`special_requests = $${paramCount}`);
      values.push(updateData.specialRequests);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    paramCount++;
    values.push(id);

    const updateQuery = `
      UPDATE bookings 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await dbQuery(updateQuery, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     summary: Cancel booking
 *     tags: [Bookings]
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
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await transaction(async (client) => {
      // Get booking details
      const bookingQuery = `
        SELECT b.*, tt.id as tee_time_id
        FROM bookings b
        JOIN tee_times tt ON b.tee_time_id = tt.id
        WHERE b.id = $1 AND (b.member_id = $2 OR $3 = ANY(ARRAY['admin', 'manager']))
      `;
      
      const userRoles = req.user.roles || [];
      const bookingResult = await client.query(bookingQuery, [id, req.user.userId, userRoles]);

      if (bookingResult.rows.length === 0) {
        throw new Error('Booking not found or access denied');
      }

      const booking = bookingResult.rows[0];

      // Update booking status to cancelled
      const cancelQuery = `
        UPDATE bookings 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const cancelResult = await client.query(cancelQuery, [id]);

      // Restore tee time availability
      const restoreQuery = `
        UPDATE tee_times 
        SET available_spots = available_spots + $1,
            is_available = true
        WHERE id = $2
      `;
      
      await client.query(restoreQuery, [booking.players_count, booking.tee_time_id]);

      return cancelResult.rows[0];
    });

    res.json({
      success: true,
      data: result,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    
    if (error.message === 'Booking not found or access denied') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/bookings/availability:
 *   get:
 *     summary: Get tee time availability
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available tee times
 */
router.get('/availability', authMiddleware, [
  query('date').isDate(),
  query('courseId').optional().isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { date, courseId } = req.query;

  try {
    let whereClause = 'WHERE DATE(tt.tee_time) = $1 AND tt.is_available = true AND tt.available_spots > 0';
    let queryParams = [date];
    let paramCount = 1;

    if (courseId) {
      paramCount++;
      whereClause += ` AND tt.course_id = $${paramCount}`;
      queryParams.push(courseId);
    }

    const availabilityQuery = `
      SELECT 
        tt.*,
        c.name as course_name,
        c.holes as course_holes,
        c.par as course_par
      FROM tee_times tt
      JOIN courses c ON tt.course_id = c.id
      ${whereClause}
      ORDER BY tt.tee_time ASC
    `;

    const result = await dbQuery(availabilityQuery, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/bookings/upcoming:
 *   get:
 *     summary: Get upcoming bookings for current user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming bookings
 */
router.get('/upcoming', authMiddleware, asyncHandler(async (req, res) => {
  const memberId = req.user.userId;

  try {
    const upcomingQuery = `
      SELECT 
        b.*,
        tt.tee_time,
        c.name as course_name,
        c.holes as course_holes
      FROM bookings b
      JOIN tee_times tt ON b.tee_time_id = tt.id
      JOIN courses c ON tt.course_id = c.id
      WHERE b.member_id = $1 
        AND b.status IN ('confirmed', 'pending')
        AND tt.tee_time > CURRENT_TIMESTAMP
      ORDER BY tt.tee_time ASC
      LIMIT 10
    `;

    const result = await dbQuery(upcomingQuery, [memberId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get upcoming bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

module.exports = router;
