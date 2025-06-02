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
 *     Tournament:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         maxParticipants:
 *           type: integer
 *         registrationFee:
 *           type: number
 *         status:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/tournaments:
 *   get:
 *     summary: Get tournaments
 *     tags: [Tournaments]
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
 *         description: Number of tournaments per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by tournament status
 *     responses:
 *       200:
 *         description: List of tournaments
 */
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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
  const { status } = req.query;

  try {
    let whereClause = "WHERE e.event_type = 'tournament'";
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND e.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      LEFT JOIN tournaments t ON e.id = t.event_id
      ${whereClause}
    `;
    const countResult = await dbQuery(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get tournaments with pagination
    const tournamentsQuery = `
      SELECT 
        e.id,
        e.name,
        e.description,
        e.start_date,
        e.end_date,
        e.location,
        e.max_participants,
        e.registration_fee,
        e.status,
        e.organizer_id,
        t.tournament_format,
        t.handicap_system,
        t.scoring_system,
        t.rounds_count,
        t.entry_fee,
        t.prize_structure,
        m.first_name as organizer_first_name,
        m.last_name as organizer_last_name,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as registered_count
      FROM events e
      LEFT JOIN tournaments t ON e.id = t.event_id
      LEFT JOIN members m ON e.organizer_id = m.id
      ${whereClause}
      ORDER BY e.start_date ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    const result = await dbQuery(tournamentsQuery, queryParams);

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
    console.error('Get tournaments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/tournaments/{id}:
 *   get:
 *     summary: Get tournament by ID
 *     tags: [Tournaments]
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
 *         description: Tournament details
 *       404:
 *         description: Tournament not found
 */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const tournamentQuery = `
      SELECT 
        e.*,
        t.tournament_format,
        t.handicap_system,
        t.scoring_system,
        t.rounds_count,
        t.entry_fee,
        t.prize_structure,
        t.rules,
        m.first_name as organizer_first_name,
        m.last_name as organizer_last_name,
        m.email as organizer_email
      FROM events e
      LEFT JOIN tournaments t ON e.id = t.event_id
      LEFT JOIN members m ON e.organizer_id = m.id
      WHERE e.id = $1 AND e.event_type = 'tournament'
    `;

    const result = await dbQuery(tournamentQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const tournament = result.rows[0];

    // Get tournament rounds
    const roundsQuery = `
      SELECT 
        tr.*,
        c.name as course_name,
        c.holes,
        c.par
      FROM tournament_rounds tr
      LEFT JOIN courses c ON tr.course_id = c.id
      WHERE tr.tournament_id = $1
      ORDER BY tr.round_number
    `;
    const roundsResult = await dbQuery(roundsQuery, [tournament.id]);

    // Get registered participants
    const participantsQuery = `
      SELECT 
        er.*,
        m.first_name,
        m.last_name,
        m.member_number,
        m.handicap_index
      FROM event_registrations er
      JOIN members m ON er.member_id = m.id
      WHERE er.event_id = $1
      ORDER BY er.registration_date
    `;
    const participantsResult = await dbQuery(participantsQuery, [id]);

    res.json({
      success: true,
      data: {
        ...tournament,
        rounds: roundsResult.rows,
        participants: participantsResult.rows
      }
    });

  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/tournaments/{id}/register:
 *   post:
 *     summary: Register for tournament
 *     tags: [Tournaments]
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
      // Check if tournament exists and is open for registration
      const tournamentQuery = `
        SELECT 
          e.*,
          (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as current_registrations
        FROM events e
        WHERE e.id = $1 AND e.event_type = 'tournament' AND e.status = 'scheduled'
      `;
      
      const tournamentResult = await client.query(tournamentQuery, [id]);
      
      if (tournamentResult.rows.length === 0) {
        throw new Error('Tournament not found or not open for registration');
      }

      const tournament = tournamentResult.rows[0];

      // Check if already registered
      const existingQuery = `
        SELECT id FROM event_registrations 
        WHERE event_id = $1 AND member_id = $2
      `;
      const existingResult = await client.query(existingQuery, [id, memberId]);
      
      if (existingResult.rows.length > 0) {
        throw new Error('Already registered for this tournament');
      }

      // Check capacity
      if (tournament.max_participants && tournament.current_registrations >= tournament.max_participants) {
        throw new Error('Tournament is full');
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
      message: 'Tournament registration successful'
    });

  } catch (error) {
    console.error('Tournament registration error:', error);
    
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
 * /api/v1/tournaments/{id}/register:
 *   delete:
 *     summary: Unregister from tournament
 *     tags: [Tournaments]
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
      message: 'Tournament unregistration successful'
    });

  } catch (error) {
    console.error('Tournament unregistration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/tournaments/{id}/leaderboard:
 *   get:
 *     summary: Get tournament leaderboard
 *     tags: [Tournaments]
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
 *         description: Tournament leaderboard
 */
router.get('/:id/leaderboard', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const leaderboardQuery = `
      SELECT 
        m.id as member_id,
        m.first_name,
        m.last_name,
        m.member_number,
        m.handicap_index,
        SUM(s.total_score) as total_score,
        SUM(s.handicap_score) as total_handicap_score,
        COUNT(s.id) as rounds_played,
        RANK() OVER (ORDER BY SUM(s.total_score) ASC) as position
      FROM members m
      JOIN event_registrations er ON m.id = er.member_id
      LEFT JOIN scores s ON m.id = s.member_id
      LEFT JOIN tournament_rounds tr ON s.tournament_round_id = tr.id
      WHERE er.event_id = $1 AND (tr.tournament_id = $1 OR tr.tournament_id IS NULL)
      GROUP BY m.id, m.first_name, m.last_name, m.member_number, m.handicap_index
      ORDER BY total_score ASC NULLS LAST
    `;

    const result = await dbQuery(leaderboardQuery, [id]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/tournaments/{tournamentId}/rounds/{roundId}/scores:
 *   post:
 *     summary: Submit score for tournament round
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - holeScores
 *             properties:
 *               holeScores:
 *                 type: array
 *                 items:
 *                   type: integer
 *               penalties:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Score submitted successfully
 */
router.post('/:tournamentId/rounds/:roundId/scores', authMiddleware, [
  body('holeScores').isArray().custom((value) => {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('Hole scores must be a non-empty array');
    }
    if (!value.every(score => Number.isInteger(score) && score > 0)) {
      throw new Error('All hole scores must be positive integers');
    }
    return true;
  }),
  body('penalties').optional().isInt({ min: 0 }),
  body('notes').optional().isString().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { tournamentId, roundId } = req.params;
  const { holeScores, penalties = 0, notes } = req.body;
  const memberId = req.user.userId;

  try {
    const result = await transaction(async (client) => {
      // Verify round belongs to tournament and member is registered
      const verifyQuery = `
        SELECT tr.*, er.id as registration_id
        FROM tournament_rounds tr
        JOIN event_registrations er ON tr.tournament_id = er.event_id
        WHERE tr.id = $1 AND tr.tournament_id = $2 AND er.member_id = $3
      `;
      
      const verifyResult = await client.query(verifyQuery, [roundId, tournamentId, memberId]);
      
      if (verifyResult.rows.length === 0) {
        throw new Error('Round not found or member not registered for tournament');
      }

      // Check if score already exists
      const existingQuery = `
        SELECT id FROM scores 
        WHERE tournament_round_id = $1 AND member_id = $2
      `;
      const existingResult = await client.query(existingQuery, [roundId, memberId]);
      
      if (existingResult.rows.length > 0) {
        throw new Error('Score already submitted for this round');
      }

      const totalScore = holeScores.reduce((sum, score) => sum + score, 0) + penalties;

      // Insert score
      const scoreQuery = `
        INSERT INTO scores (tournament_round_id, member_id, hole_scores, total_score, penalties, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const scoreResult = await client.query(scoreQuery, [
        roundId,
        memberId,
        holeScores,
        totalScore,
        penalties,
        notes
      ]);

      return scoreResult.rows[0];
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Score submitted successfully'
    });

  } catch (error) {
    console.error('Submit score error:', error);
    
    if (error.message.includes('not found') || error.message.includes('already submitted')) {
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

module.exports = router;
