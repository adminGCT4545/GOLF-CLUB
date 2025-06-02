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
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         eventType:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         maxParticipants:
 *           type: integer
 *         registrationFee:
 *           type: number
 *         status:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get events
 *     tags: [Events]
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
 *         description: Number of events per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by event status
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isString(),
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
  const { type, status } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      whereClause += ` AND e.event_type = $${paramCount}`;
      queryParams.push(type);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND e.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      ${whereClause}
    `;
    const countResult = await dbQuery(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get events with pagination
    const eventsQuery = `
      SELECT 
        e.*,
        m.first_name as organizer_first_name,
        m.last_name as organizer_last_name,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as registered_count
      FROM events e
      LEFT JOIN members m ON e.organizer_id = m.id
      ${whereClause}
      ORDER BY e.start_date ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    const result = await dbQuery(eventsQuery, queryParams);

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
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));



/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
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
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const eventQuery = `
      SELECT 
        e.*,
        m.first_name as organizer_first_name,
        m.last_name as organizer_last_name,
        m.email as organizer_email,
        m.phone as organizer_phone
      FROM events e
      LEFT JOIN members m ON e.organizer_id = m.id
      WHERE e.id = $1
    `;

    const result = await dbQuery(eventQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = result.rows[0];

    // Get registered participants
    const participantsQuery = `
      SELECT 
        er.*,
        m.first_name,
        m.last_name,
        m.member_number,
        m.email,
        m.phone
      FROM event_registrations er
      JOIN members m ON er.member_id = m.id
      WHERE er.event_id = $1
      ORDER BY er.registration_date
    `;
    const participantsResult = await dbQuery(participantsQuery, [id]);

    res.json({
      success: true,
      data: {
        ...event,
        participants: participantsResult.rows
      }
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/events/{id}/register:
 *   post:
 *     summary: Register for event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               additionalInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Registration failed
 */
router.post('/:id/register', authMiddleware, [
  body('additionalInfo').optional().isObject()
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
  const { additionalInfo = {} } = req.body;
  const memberId = req.user.userId;

  try {
    const result = await transaction(async (client) => {
      // Check if event exists and is open for registration
      const eventQuery = `
        SELECT 
          e.*,
          (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as current_registrations
        FROM events e
        WHERE e.id = $1 AND e.status = 'scheduled'
      `;
      
      const eventResult = await client.query(eventQuery, [id]);
      
      if (eventResult.rows.length === 0) {
        throw new Error('Event not found or not open for registration');
      }

      const event = eventResult.rows[0];

      // Check if already registered
      const existingQuery = `
        SELECT id FROM event_registrations 
        WHERE event_id = $1 AND member_id = $2
      `;
      const existingResult = await client.query(existingQuery, [id, memberId]);
      
      if (existingResult.rows.length > 0) {
        throw new Error('Already registered for this event');
      }

      // Check capacity
      if (event.max_participants && event.current_registrations >= event.max_participants) {
        throw new Error('Event is full');
      }

      // Create registration
      const registrationQuery = `
        INSERT INTO event_registrations (event_id, member_id, payment_status, additional_info)
        VALUES ($1, $2, 'pending', $3)
        RETURNING *
      `;

      const registrationResult = await client.query(registrationQuery, [
        id,
        memberId,
        additionalInfo
      ]);

      return registrationResult.rows[0];
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Event registration successful'
    });

  } catch (error) {
    console.error('Event registration error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Already registered') || error.message.includes('full')) {
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
 * /api/v1/events/{id}/register:
 *   delete:
 *     summary: Unregister from event
 *     tags: [Events]
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
 *         description: Unregistration successful
 *       404:
 *         description: Registration not found
 */
router.delete('/:id/register', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const memberId = req.user.userId;

  try {
    const deleteQuery = `
      DELETE FROM event_registrations 
      WHERE event_id = $1 AND member_id = $2
      RETURNING *
    `;

    const result = await dbQuery(deleteQuery, [id, memberId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Event unregistration successful'
    });

  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/events/upcoming:
 *   get:
 *     summary: Get upcoming events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming events
 */
router.get('/upcoming', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const upcomingQuery = `
      SELECT 
        e.*,
        m.first_name as organizer_first_name,
        m.last_name as organizer_last_name,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as registered_count,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.member_id = $1) as is_registered
      FROM events e
      LEFT JOIN members m ON e.organizer_id = m.id
      WHERE e.status = 'scheduled' 
        AND e.start_date > CURRENT_TIMESTAMP
      ORDER BY e.start_date ASC
      LIMIT 10
    `;

    const result = await dbQuery(upcomingQuery, [req.user.userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

module.exports = router;
