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
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         senderId:
 *           type: string
 *         recipientId:
 *           type: string
 *         subject:
 *           type: string
 *         content:
 *           type: string
 *         messageType:
 *           type: string
 *         isRead:
 *           type: boolean
 *         sentAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   get:
 *     summary: Get conversations for current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    const conversationsQuery = `
      WITH latest_messages AS (
        SELECT 
          m1.*,
          CASE 
            WHEN m1.sender_id = $1 THEN m1.recipient_id
            ELSE m1.sender_id
          END as other_user_id
        FROM messages m1
        WHERE m1.sender_id = $1 OR m1.recipient_id = $1
      ),
      ranked_messages AS (
        SELECT 
          lm.*,
          ROW_NUMBER() OVER (PARTITION BY lm.other_user_id ORDER BY lm.sent_at DESC) as rn
        FROM latest_messages lm
      )
      SELECT 
        rm.*,
        mem.first_name as other_user_first_name,
        mem.last_name as other_user_last_name,
        mem.profile_image_url as other_user_avatar,
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.sender_id = rm.other_user_id 
         AND m2.recipient_id = $1 
         AND m2.is_read = false) as unread_count
      FROM ranked_messages rm
      JOIN members mem ON rm.other_user_id = mem.id
      WHERE rm.rn = 1
      ORDER BY rm.sent_at DESC
    `;

    const result = await dbQuery(conversationsQuery, [userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - subject
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation created successfully
 */
router.post('/conversations', authMiddleware, [
  body('recipientId').isUUID(),
  body('subject').isString().trim().isLength({ min: 1, max: 200 }),
  body('content').isString().trim().isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { recipientId, subject, content } = req.body;
  const senderId = req.user.userId;

  try {
    // Check if recipient exists
    const recipientQuery = 'SELECT id FROM members WHERE id = $1';
    const recipientResult = await dbQuery(recipientQuery, [recipientId]);

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    const messageQuery = `
      INSERT INTO messages (sender_id, recipient_id, subject, content, message_type)
      VALUES ($1, $2, $3, $4, 'direct')
      RETURNING *
    `;

    const result = await dbQuery(messageQuery, [senderId, recipientId, subject, content]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/messages/conversations/{conversationId}:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The other user's ID (conversation partner)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages in conversation
 */
router.get('/conversations/:conversationId', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { conversationId } = req.params; // This is the other user's ID
  const userId = req.user.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  try {
    // Get messages between the two users
    const messagesQuery = `
      SELECT 
        m.*,
        sender.first_name as sender_first_name,
        sender.last_name as sender_last_name,
        sender.profile_image_url as sender_avatar,
        recipient.first_name as recipient_first_name,
        recipient.last_name as recipient_last_name
      FROM messages m
      JOIN members sender ON m.sender_id = sender.id
      JOIN members recipient ON m.recipient_id = recipient.id
      WHERE ((m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1))
        AND m.message_type = 'direct'
      ORDER BY m.sent_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await dbQuery(messagesQuery, [userId, conversationId, limit, offset]);

    // Mark messages as read if they were sent to the current user
    const markReadQuery = `
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false
    `;
    await dbQuery(markReadQuery, [conversationId, userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/messages/mass:
 *   post:
 *     summary: Send a mass message to multiple recipients
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientIds
 *               - subject
 *               - content
 *             properties:
 *               recipientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 default: announcement
 *     responses:
 *       201:
 *         description: Mass message sent successfully
 */
router.post('/mass', authMiddleware, [
  body('recipientIds').isArray().withMessage('recipientIds must be an array'),
  body('recipientIds.*').isUUID().withMessage('Each recipient ID must be a valid UUID'),
  body('subject').isString().trim().isLength({ min: 1, max: 200 }),
  body('content').isString().trim().isLength({ min: 1 }),
  body('messageType').optional().isIn(['announcement', 'group']).withMessage('Mass messages must be announcement or group type')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { recipientIds, subject, content, messageType = 'announcement' } = req.body;
  const senderId = req.user.userId;

  if (recipientIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one recipient is required'
    });
  }

  if (recipientIds.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 100 recipients allowed per mass message'
    });
  }

  try {
    // Check if all recipients exist
    const recipientQuery = `
      SELECT id FROM members 
      WHERE id = ANY($1::uuid[])
    `;
    const recipientResult = await dbQuery(recipientQuery, [recipientIds]);

    if (recipientResult.rows.length !== recipientIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more recipients not found'
      });
    }

    // Use transaction to ensure all messages are sent or none
    const client = await transaction();
    
    try {
      const messageInserts = [];
      const values = [];
      let paramCounter = 1;

      recipientIds.forEach((recipientId, index) => {
        const baseIndex = index * 5;
        messageInserts.push(
          `(${paramCounter++}, ${paramCounter++}, ${paramCounter++}, ${paramCounter++}, ${paramCounter++})`
        );
        values.push(senderId, recipientId, subject, content, messageType);
      });

      const massMessageQuery = `
        INSERT INTO messages (sender_id, recipient_id, subject, content, message_type)
        VALUES ${messageInserts.join(', ')}
        RETURNING id, recipient_id
      `;

      const result = await client.query(massMessageQuery, values);
      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: {
          messagesSent: result.rows.length,
          recipientCount: recipientIds.length,
          messageIds: result.rows.map(row => row.id)
        },
        message: `Mass message sent successfully to ${recipientIds.length} recipients`
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Send mass message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 default: direct
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/', authMiddleware, [
  body('recipientId').isUUID(),
  body('subject').optional().isString().trim().isLength({ max: 200 }),
  body('content').isString().trim().isLength({ min: 1 }),
  body('messageType').optional().isIn(['direct', 'group', 'announcement']).withMessage('Invalid message type')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { recipientId, subject, content, messageType = 'direct' } = req.body;
  const senderId = req.user.userId;

  try {
    // Check if recipient exists
    const recipientQuery = 'SELECT id FROM members WHERE id = $1';
    const recipientResult = await dbQuery(recipientQuery, [recipientId]);

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    const messageQuery = `
      INSERT INTO messages (sender_id, recipient_id, subject, content, message_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await dbQuery(messageQuery, [senderId, recipientId, subject, content, messageType]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/messages/{messageId}/read:
 *   put:
 *     summary: Mark message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read
 *       404:
 *         description: Message not found
 */
router.put('/:messageId/read', authMiddleware, asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  try {
    const updateQuery = `
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND recipient_id = $2
      RETURNING *
    `;

    const result = await dbQuery(updateQuery, [messageId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or not authorized'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * @swagger
 * /api/v1/messages/unread-count:
 *   get:
 *     summary: Get unread message count
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message count
 */
router.get('/unread-count', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    const countQuery = `
      SELECT COUNT(*) as unread_count
      FROM messages
      WHERE recipient_id = $1 AND is_read = false
    `;

    const result = await dbQuery(countQuery, [userId]);

    res.json({
      success: true,
      data: {
        unreadCount: parseInt(result.rows[0].unread_count)
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

module.exports = router;
