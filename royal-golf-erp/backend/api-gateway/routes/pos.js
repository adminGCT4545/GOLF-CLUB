const express = require('express');
const { query, transaction } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     POSTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         transaction_number:
 *           type: string
 *         terminal_id:
 *           type: string
 *           format: uuid
 *         member_id:
 *           type: string
 *           format: uuid
 *         total_amount:
 *           type: number
 *         payment_method:
 *           type: string
 *           enum: [cash, credit_card, debit_card, member_account, gift_card]
 *         created_at:
 *           type: string
 *           format: date-time
 */

// ===================
// POS TRANSACTION ROUTES
// ===================

/**
 * @swagger
 * /api/v1/pos/transactions:
 *   post:
 *     summary: Create a new POS transaction
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - terminal_id
 *               - items
 *               - payment_method
 *             properties:
 *               terminal_id:
 *                 type: string
 *                 format: uuid
 *               member_id:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                     unit_price:
 *                       type: number
 *               payment_method:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, member_account, gift_card]
 *               payment_reference:
 *                 type: string
 *               discount_amount:
 *                 type: number
 *               tip_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/transactions', authMiddleware, async (req, res) => {
  try {
    const {
      terminal_id,
      member_id,
      items,
      payment_method,
      payment_reference,
      discount_amount = 0,
      tip_amount = 0
    } = req.body;

    const staff_id = req.user.id;

    await transaction(async (client) => {
      // Validate terminal exists and is active
      const terminalResult = await client.query(
        'SELECT * FROM pos_terminals WHERE id = $1 AND status = $2',
        [terminal_id, 'active']
      );

      if (terminalResult.rows.length === 0) {
        throw new Error('Terminal not found or inactive');
      }

      // Calculate transaction totals
      let subtotal = 0;
      let total_tax = 0;

      // Validate products and calculate totals
      for (const item of items) {
        const productResult = await client.query(
          'SELECT * FROM products WHERE id = $1 AND is_active = true',
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found or inactive`);
        }

        const product = productResult.rows[0];
        
        // Check stock availability
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        const line_total = item.quantity * item.unit_price;
        const line_tax = line_total * 0.0875; // 8.75% tax rate from schema
        
        subtotal += line_total;
        total_tax += line_tax;
      }

      const total_amount = subtotal + total_tax + tip_amount - discount_amount;

      // Generate transaction number
      const transactionCountResult = await client.query(
        'SELECT COUNT(*) + 1 as next_number FROM pos_transactions WHERE DATE(created_at) = CURRENT_DATE'
      );
      const transaction_number = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(transactionCountResult.rows[0].next_number).padStart(4, '0')}`;

      // Get current shift
      const shiftResult = await client.query(
        'SELECT id FROM cash_drawer_shifts WHERE terminal_id = $1 AND status = $2 ORDER BY shift_start DESC LIMIT 1',
        [terminal_id, 'open']
      );

      const shift_id = shiftResult.rows.length > 0 ? shiftResult.rows[0].id : null;

      // Determine sale type based on products
      let sale_type = 'mixed';
      const productTypes = await client.query(
        `SELECT DISTINCT 
          CASE 
            WHEN category LIKE '%fnb%' OR category LIKE '%food%' OR category LIKE '%beverage%' THEN 'fnb'
            WHEN category LIKE '%pro%' OR category LIKE '%golf%' OR category LIKE '%apparel%' THEN 'proshop'
            ELSE 'other'
          END as type
        FROM products 
        WHERE id = ANY($1)`,
        [items.map(item => item.product_id)]
      );

      if (productTypes.rows.length === 1) {
        sale_type = productTypes.rows[0].type;
      }

      // Create transaction record
      const transactionResult = await client.query(`
        INSERT INTO pos_transactions (
          transaction_number, terminal_id, shift_id, member_id, staff_id,
          transaction_type, subtotal, tax_amount, discount_amount, tip_amount,
          total_amount, payment_method, payment_reference, sale_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        transaction_number, terminal_id, shift_id, member_id, staff_id,
        'sale', subtotal, total_tax, discount_amount, tip_amount,
        total_amount, payment_method, payment_reference, sale_type
      ]);

      const newTransaction = transactionResult.rows[0];

      // Create transaction items and update inventory
      for (const item of items) {
        // Create transaction item
        await client.query(`
          INSERT INTO pos_transaction_items (transaction_id, product_id, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5)
        `, [newTransaction.id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);

        // Update product stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // Create inventory movement record
        await client.query(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity_change, reference_id, reference_type, staff_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [item.product_id, 'sale', -item.quantity, newTransaction.id, 'pos_transaction', staff_id]);
      }

      // If member account payment, create financial transaction
      if (payment_method === 'member_account' && member_id) {
        await client.query(`
          INSERT INTO financial_transactions (
            transaction_type, member_id, amount, description, status, reference_number
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, ['pos_charge', member_id, total_amount, `POS Transaction ${transaction_number}`, 'pending', transaction_number]);
      }

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction: newTransaction,
        transaction_number: transaction_number,
        total_amount: total_amount
      });
    });
  } catch (error) {
    console.error('Error creating POS transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/pos/transactions:
 *   get:
 *     summary: Get POS transactions with filtering
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: terminal_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: staff_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sale_type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of POS transactions
 */
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const { date_from, date_to, terminal_id, staff_id, sale_type, page = 1, limit = 50 } = req.query;
    
    let conditions = ['pt.transaction_type = $1'];
    let params = ['sale'];
    let paramCount = 1;

    if (date_from) {
      paramCount++;
      conditions.push(`DATE(pt.created_at) >= $${paramCount}`);
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      conditions.push(`DATE(pt.created_at) <= $${paramCount}`);
      params.push(date_to);
    }

    if (terminal_id) {
      paramCount++;
      conditions.push(`pt.terminal_id = $${paramCount}`);
      params.push(terminal_id);
    }

    if (staff_id) {
      paramCount++;
      conditions.push(`pt.staff_id = $${paramCount}`);
      params.push(staff_id);
    }

    if (sale_type) {
      paramCount++;
      conditions.push(`pt.sale_type = $${paramCount}`);
      params.push(sale_type);
    }

    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const transactionsQuery = `
      SELECT 
        pt.*,
        CONCAT(s.first_name, ' ', s.last_name) as staff_name,
        CONCAT(m.first_name, ' ', m.last_name) as member_name,
        m.member_number,
        ter.terminal_name,
        ter.location as terminal_location
      FROM pos_transactions pt
      LEFT JOIN staff s ON pt.staff_id = s.id
      LEFT JOIN members m ON pt.member_id = m.id
      LEFT JOIN pos_terminals ter ON pt.terminal_id = ter.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY pt.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await query(transactionsQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pos_transactions pt
      WHERE ${conditions.slice(0, -2).join(' AND ')}
    `;
    const countResult = await query(countQuery, params.slice(0, -2));

    res.json({
      transactions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching POS transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/pos/transactions/{id}/refund:
 *   post:
 *     summary: Process transaction refund
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refund_amount
 *               - reason
 *             properties:
 *               refund_amount:
 *                 type: number
 *               reason:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.post('/transactions/:id/refund', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_amount, reason, items = [] } = req.body;
    const staff_id = req.user.id;

    await transaction(async (client) => {
      // Get original transaction
      const originalResult = await client.query(
        'SELECT * FROM pos_transactions WHERE id = $1 AND transaction_type = $2',
        [id, 'sale']
      );

      if (originalResult.rows.length === 0) {
        throw new Error('Original transaction not found');
      }

      const originalTransaction = originalResult.rows[0];

      if (refund_amount > originalTransaction.total_amount) {
        throw new Error('Refund amount cannot exceed original transaction amount');
      }

      // Generate refund transaction number
      const refundCountResult = await client.query(
        'SELECT COUNT(*) + 1 as next_number FROM pos_transactions WHERE DATE(created_at) = CURRENT_DATE AND transaction_type = $1',
        ['refund']
      );
      const refund_number = `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(refundCountResult.rows[0].next_number).padStart(4, '0')}`;

      // Create refund transaction
      const refundResult = await client.query(`
        INSERT INTO pos_transactions (
          transaction_number, terminal_id, shift_id, member_id, staff_id,
          transaction_type, original_transaction_id, subtotal, tax_amount, 
          total_amount, payment_method, sale_type, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        refund_number, originalTransaction.terminal_id, originalTransaction.shift_id,
        originalTransaction.member_id, staff_id, 'refund', id,
        -refund_amount, 0, -refund_amount, originalTransaction.payment_method,
        originalTransaction.sale_type, reason
      ]);

      // Process item returns and restore inventory
      for (const item of items) {
        // Create refund item record
        await client.query(`
          INSERT INTO pos_transaction_items (transaction_id, product_id, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5)
        `, [refundResult.rows[0].id, item.product_id, -item.quantity, 0, 0]);

        // Restore inventory
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // Create inventory movement record
        await client.query(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity_change, reference_id, reference_type, staff_id, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [item.product_id, 'return', item.quantity, refundResult.rows[0].id, 'pos_refund', staff_id, `Refund: ${reason}`]);
      }

      res.json({
        message: 'Refund processed successfully',
        refund_transaction: refundResult.rows[0],
        refund_amount: refund_amount
      });
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// TERMINAL MANAGEMENT ROUTES
// ===================

/**
 * @swagger
 * /api/v1/pos/terminals:
 *   get:
 *     summary: Get all POS terminals
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of POS terminals
 */
router.get('/terminals', authMiddleware, async (req, res) => {
  try {
    const terminalsQuery = `
      SELECT 
        pt.*,
        cds.id as current_shift_id,
        cds.staff_id as current_staff_id,
        CONCAT(s.first_name, ' ', s.last_name) as current_staff_name
      FROM pos_terminals pt
      LEFT JOIN cash_drawer_shifts cds ON pt.id = cds.terminal_id AND cds.status = 'open'
      LEFT JOIN staff s ON cds.staff_id = s.id
      ORDER BY pt.location, pt.terminal_name
    `;

    const result = await query(terminalsQuery);

    res.json({
      terminals: result.rows
    });
  } catch (error) {
    console.error('Error fetching terminals:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/pos/terminals/{id}/open-shift:
 *   post:
 *     summary: Open cash drawer shift
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - opening_cash
 *             properties:
 *               opening_cash:
 *                 type: number
 *     responses:
 *       200:
 *         description: Shift opened successfully
 */
router.post('/terminals/:id/open-shift', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { opening_cash } = req.body;
    const staff_id = req.user.id;

    // Check if terminal already has an open shift
    const existingShift = await query(
      'SELECT id FROM cash_drawer_shifts WHERE terminal_id = $1 AND status = $2',
      [id, 'open']
    );

    if (existingShift.rows.length > 0) {
      return res.status(400).json({ error: 'Terminal already has an open shift' });
    }

    const result = await query(`
      INSERT INTO cash_drawer_shifts (terminal_id, staff_id, opening_cash)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, staff_id, opening_cash]);

    // Update terminal current shift
    await query(
      'UPDATE pos_terminals SET current_shift_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [result.rows[0].id, id]
    );

    res.json({
      message: 'Shift opened successfully',
      shift: result.rows[0]
    });
  } catch (error) {
    console.error('Error opening shift:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/pos/terminals/{id}/close-shift:
 *   post:
 *     summary: Close cash drawer shift
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - closing_cash
 *             properties:
 *               closing_cash:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shift closed successfully
 */
router.post('/terminals/:id/close-shift', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { closing_cash, notes = '' } = req.body;

    await transaction(async (client) => {
      // Get current open shift
      const shiftResult = await client.query(
        'SELECT * FROM cash_drawer_shifts WHERE terminal_id = $1 AND status = $2',
        [id, 'open']
      );

      if (shiftResult.rows.length === 0) {
        throw new Error('No open shift found for this terminal');
      }

      const shift = shiftResult.rows[0];

      // Calculate shift totals
      const salesResult = await client.query(`
        SELECT 
          COUNT(*) as transaction_count,
          COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN total_amount ELSE 0 END), 0) as total_sales,
          COALESCE(SUM(CASE WHEN transaction_type = 'refund' THEN -total_amount ELSE 0 END), 0) as total_refunds,
          COALESCE(SUM(CASE WHEN transaction_type = 'sale' AND payment_method IN ('credit_card', 'debit_card') THEN total_amount ELSE 0 END), 0) as card_sales,
          COALESCE(SUM(CASE WHEN transaction_type = 'sale' AND payment_method = 'member_account' THEN total_amount ELSE 0 END), 0) as member_account_sales
        FROM pos_transactions 
        WHERE shift_id = $1
      `, [shift.id]);

      const sales = salesResult.rows[0];
      const expected_cash = shift.opening_cash + (sales.total_sales - sales.card_sales - sales.member_account_sales) - sales.total_refunds;
      const cash_difference = closing_cash - expected_cash;

      // Update shift record
      await client.query(`
        UPDATE cash_drawer_shifts 
        SET shift_end = CURRENT_TIMESTAMP,
            closing_cash = $1,
            expected_cash = $2,
            cash_difference = $3,
            total_sales = $4,
            total_refunds = $5,
            card_sales = $6,
            member_account_sales = $7,
            transaction_count = $8,
            notes = $9,
            status = 'closed'
        WHERE id = $10
      `, [
        closing_cash, expected_cash, cash_difference, sales.total_sales,
        sales.total_refunds, sales.card_sales, sales.member_account_sales,
        sales.transaction_count, notes, shift.id
      ]);

      // Clear terminal current shift
      await client.query(
        'UPDATE pos_terminals SET current_shift_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      res.json({
        message: 'Shift closed successfully',
        shift_summary: {
          opening_cash: shift.opening_cash,
          closing_cash: closing_cash,
          expected_cash: expected_cash,
          cash_difference: cash_difference,
          total_sales: sales.total_sales,
          total_refunds: sales.total_refunds,
          transaction_count: parseInt(sales.transaction_count)
        }
      });
    });
  } catch (error) {
    console.error('Error closing shift:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// SALES REPORTS ROUTES
// ===================

/**
 * @swagger
 * /api/v1/pos/reports/daily-sales:
 *   get:
 *     summary: Get daily sales report
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daily sales report
 */
router.get('/reports/daily-sales', authMiddleware, async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const salesQuery = `
      SELECT 
        COUNT(CASE WHEN transaction_type = 'sale' THEN 1 END) as total_transactions,
        COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN total_amount ELSE 0 END), 0) as gross_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'refund' THEN -total_amount ELSE 0 END), 0) as total_refunds,
        COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN total_amount ELSE 0 END) + 
                 SUM(CASE WHEN transaction_type = 'refund' THEN total_amount ELSE 0 END), 0) as net_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'sale' AND sale_type = 'proshop' THEN total_amount ELSE 0 END), 0) as proshop_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'sale' AND sale_type = 'fnb' THEN total_amount ELSE 0 END), 0) as fnb_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'sale' AND payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'sale' AND payment_method IN ('credit_card', 'debit_card') THEN total_amount ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'sale' AND payment_method = 'member_account' THEN total_amount ELSE 0 END), 0) as member_account_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(tip_amount), 0) as total_tips,
        COALESCE(AVG(CASE WHEN transaction_type = 'sale' THEN total_amount END), 0) as avg_transaction
      FROM pos_transactions 
      WHERE DATE(created_at) = $1
    `;

    const result = await query(salesQuery, [date]);

    // Get top selling products for the day
    const topProductsQuery = `
      SELECT 
        p.name,
        p.sku,
        SUM(pti.quantity) as quantity_sold,
        SUM(pti.total_price) as revenue
      FROM pos_transaction_items pti
      JOIN pos_transactions pt ON pti.transaction_id = pt.id
      JOIN products p ON pti.product_id = p.id
      WHERE DATE(pt.created_at) = $1 AND pt.transaction_type = 'sale'
      GROUP BY p.id, p.name, p.sku
      ORDER BY quantity_sold DESC
      LIMIT 10
    `;

    const topProductsResult = await query(topProductsQuery, [date]);

    res.json({
      date: date,
      summary: result.rows[0],
      top_products: topProductsResult.rows
    });
  } catch (error) {
    console.error('Error generating daily sales report:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// MEMBER PURCHASE HISTORY ROUTES
// ===================

/**
 * @swagger
 * /api/v1/pos/member/{memberId}/purchases:
 *   get:
 *     summary: Get member purchase history
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [pro_shop, fnb, all]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Member purchase history
 */
router.get('/member/:memberId/purchases', authMiddleware, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { category = 'all', limit = 20, offset = 0 } = req.query;

    let categoryCondition = '';
    let params = [memberId, parseInt(limit), parseInt(offset)];
    let paramCount = 3;

    if (category !== 'all') {
      paramCount++;
      categoryCondition = `AND pt.sale_type = ${paramCount}`;
      params.push(category === 'pro_shop' ? 'proshop' : category);
    }

    const purchasesQuery = `
      SELECT 
        pt.id,
        pt.transaction_number,
        pt.total_amount,
        pt.payment_method,
        pt.sale_type,
        pt.created_at as order_date,
        pt.subtotal,
        pt.tax_amount,
        pt.discount_amount,
        pt.tip_amount,
        array_agg(
          json_build_object(
            'product_id', p.id,
            'name', p.name,
            'sku', p.sku,
            'category', p.category,
            'quantity', pti.quantity,
            'unit_price', pti.unit_price,
            'total_price', pti.total_price
          )
        ) as items
      FROM pos_transactions pt
      JOIN pos_transaction_items pti ON pt.id = pti.transaction_id
      JOIN products p ON pti.product_id = p.id
      WHERE pt.member_id = $1 
        AND pt.transaction_type = 'sale'
        ${categoryCondition}
      GROUP BY pt.id, pt.transaction_number, pt.total_amount, pt.payment_method, 
               pt.sale_type, pt.created_at, pt.subtotal, pt.tax_amount, 
               pt.discount_amount, pt.tip_amount
      ORDER BY pt.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(purchasesQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT pt.id) as total
      FROM pos_transactions pt
      WHERE pt.member_id = $1 
        AND pt.transaction_type = 'sale'
        ${categoryCondition}
    `;
    const countParams = category !== 'all' ? [memberId, category === 'pro_shop' ? 'proshop' : category] : [memberId];
    const countResult = await query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error fetching member purchases:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/v1/pos/member/{memberId}/spending-summary:
 *   get:
 *     summary: Get member spending summary
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year, all]
 *           default: year
 *     responses:
 *       200:
 *         description: Member spending summary
 */
router.get('/member/:memberId/spending-summary', authMiddleware, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { period = 'year' } = req.query;

    let dateCondition = '';
    switch (period) {
      case 'week':
        dateCondition = "AND pt.created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateCondition = "AND pt.created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'quarter':
        dateCondition = "AND pt.created_at >= CURRENT_DATE - INTERVAL '90 days'";
        break;
      case 'year':
        dateCondition = "AND pt.created_at >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      case 'all':
      default:
        dateCondition = '';
        break;
    }

    const summaryQuery = `
      SELECT 
        COUNT(CASE WHEN pt.transaction_type = 'sale' THEN 1 END) as total_transactions,
        COALESCE(SUM(CASE WHEN pt.transaction_type = 'sale' THEN pt.total_amount ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN pt.transaction_type = 'sale' AND pt.sale_type = 'proshop' THEN pt.total_amount ELSE 0 END), 0) as proshop_spent,
        COALESCE(SUM(CASE WHEN pt.transaction_type = 'sale' AND pt.sale_type = 'fnb' THEN pt.total_amount ELSE 0 END), 0) as fnb_spent,
        COALESCE(AVG(CASE WHEN pt.transaction_type = 'sale' THEN pt.total_amount END), 0) as avg_transaction_amount,
        COALESCE(SUM(CASE WHEN pt.transaction_type = 'refund' THEN -pt.total_amount ELSE 0 END), 0) as total_refunds
      FROM pos_transactions pt
      WHERE pt.member_id = $1 ${dateCondition}
    `;

    const result = await query(summaryQuery, [memberId]);

    // Get favorite products
    const favoritesQuery = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.sale_type,
        SUM(pti.quantity) as total_quantity,
        SUM(pti.total_price) as total_spent_on_product,
        COUNT(DISTINCT pt.id) as purchase_frequency
      FROM pos_transaction_items pti
      JOIN pos_transactions pt ON pti.transaction_id = pt.id
      JOIN products p ON pti.product_id = p.id
      WHERE pt.member_id = $1 
        AND pt.transaction_type = 'sale'
        ${dateCondition}
      GROUP BY p.id, p.name, p.category, p.sale_type
      ORDER BY total_quantity DESC
      LIMIT 5
    `;

    const favoritesResult = await query(favoritesQuery, [memberId]);

    res.json({
      success: true,
      data: {
        summary: result.rows[0],
        favorite_products: favoritesResult.rows,
        period: period
      }
    });
  } catch (error) {
    console.error('Error fetching member spending summary:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
