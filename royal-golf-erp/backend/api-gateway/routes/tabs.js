const express = require('express');
const { query, transaction } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MemberTab:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tab_number:
 *           type: string
 *         member_id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [open, closed, paid, cancelled]
 *         total_amount:
 *           type: number
 *         opened_at:
 *           type: string
 *           format: date-time
 *     TabItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tab_id:
 *           type: string
 *           format: uuid
 *         product_id:
 *           type: string
 *           format: uuid
 *         quantity:
 *           type: integer
 *         unit_price:
 *           type: number
 *         total_price:
 *           type: number
 */

// ===================
// TAB OPERATIONS ROUTES
// ===================

/**
 * @swagger
 * /api/v1/tabs/open:
 *   post:
 *     summary: Open new member tab
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - member_id
 *             properties:
 *               member_id:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tab opened successfully
 *       400:
 *         description: Member already has open tab or invalid data
 */
router.post('/open', authMiddleware, async (req, res) => {
  try {
    const { member_id, notes = '' } = req.body;
    const opened_by = req.user.id;

    // Check if member exists and is active
    const memberResult = await query(
      'SELECT * FROM members WHERE id = $1 AND status = $2',
      [member_id, 'active']
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found or inactive' });
    }

    // Check if member already has an open tab
    const existingTab = await query(
      'SELECT id FROM member_tabs WHERE member_id = $1 AND status = $2',
      [member_id, 'open']
    );

    if (existingTab.rows.length > 0) {
      return res.status(400).json({ error: 'Member already has an open tab' });
    }

    // Generate tab number
    const tabCountResult = await query(
      'SELECT COUNT(*) + 1 as next_number FROM member_tabs WHERE DATE(opened_at) = CURRENT_DATE'
    );
    const tab_number = `TAB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(tabCountResult.rows[0].next_number).padStart(4, '0')}`;

    const result = await query(`
      INSERT INTO member_tabs (tab_number, member_id, opened_by, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [tab_number, member_id, opened_by, notes]);

    res.status(201).json({
      message: 'Tab opened successfully',
      tab: result.rows[0]
    });
  } catch (error) {
    console.error('Error opening tab:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/tabs/member/{memberId}:
 *   get:
 *     summary: Get member's tabs
 *     tags: [Tabs]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, paid, cancelled]
 *     responses:
 *       200:
 *         description: Member's tabs
 */
router.get('/member/:memberId', authMiddleware, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status } = req.query;

    let conditions = ['mt.member_id = $1'];
    let params = [memberId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      conditions.push(`mt.status = $${paramCount}`);
      params.push(status);
    }

    const tabsQuery = `
      SELECT 
        mt.*,
        CONCAT(m.first_name, ' ', m.last_name) as member_name,
        m.member_number,
        CONCAT(s.first_name, ' ', s.last_name) as opened_by_name,
        COUNT(ti.id) as item_count
      FROM member_tabs mt
      LEFT JOIN members m ON mt.member_id = m.id
      LEFT JOIN staff s ON mt.opened_by = s.id
      LEFT JOIN tab_items ti ON mt.id = ti.tab_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY mt.id, m.first_name, m.last_name, m.member_number, s.first_name, s.last_name
      ORDER BY mt.opened_at DESC
    `;

    const result = await query(tabsQuery, params);

    res.json({
      tabs: result.rows
    });
  } catch (error) {
    console.error('Error fetching member tabs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/tabs/{id}/add-item:
 *   post:
 *     summary: Add item to tab
 *     tags: [Tabs]
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
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *               special_instructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to tab successfully
 */
router.post('/:id/add-item', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, special_instructions = '' } = req.body;
    const added_by = req.user.id;

    await transaction(async (client) => {
      // Verify tab exists and is open
      const tabResult = await client.query(
        'SELECT * FROM member_tabs WHERE id = $1 AND status = $2',
        [id, 'open']
      );

      if (tabResult.rows.length === 0) {
        throw new Error('Tab not found or not open');
      }

      // Get product details
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND is_active = true',
        [product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found or inactive');
      }

      const product = productResult.rows[0];

      // Check stock availability for physical products
      if (product.stock_quantity < quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      const unit_price = product.price;
      const total_price = quantity * unit_price;
      const tax_amount = total_price * 0.0875; // 8.75% tax rate

      // Add item to tab
      const itemResult = await client.query(`
        INSERT INTO tab_items (tab_id, product_id, quantity, unit_price, total_price, added_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [id, product_id, quantity, unit_price, total_price, added_by, special_instructions]);

      // Update tab totals
      await client.query(`
        UPDATE member_tabs 
        SET subtotal = subtotal + $1, 
            tax_amount = tax_amount + $2, 
            total_amount = total_amount + $3
        WHERE id = $4
      `, [total_price, tax_amount, total_price + tax_amount, id]);

      // Update product stock (for physical products)
      if (product.category !== 'service') {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [quantity, product_id]
        );

        // Create inventory movement record
        await client.query(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity_change, reference_id, reference_type, staff_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [product_id, 'sale', -quantity, id, 'member_tab', added_by]);
      }

      res.json({
        message: 'Item added to tab successfully',
        item: itemResult.rows[0],
        added_amount: total_price + tax_amount
      });
    });
  } catch (error) {
    console.error('Error adding item to tab:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/tabs/{id}/remove-item/{itemId}:
 *   delete:
 *     summary: Remove item from tab
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item removed from tab successfully
 */
router.delete('/:id/remove-item/:itemId', authMiddleware, async (req, res) => {
  try {
    const { id, itemId } = req.params;

    await transaction(async (client) => {
      // Get item details
      const itemResult = await client.query(
        'SELECT * FROM tab_items WHERE id = $1 AND tab_id = $2',
        [itemId, id]
      );

      if (itemResult.rows.length === 0) {
        throw new Error('Item not found in tab');
      }

      const item = itemResult.rows[0];

      // Verify tab is still open
      const tabResult = await client.query(
        'SELECT * FROM member_tabs WHERE id = $1 AND status = $2',
        [id, 'open']
      );

      if (tabResult.rows.length === 0) {
        throw new Error('Tab not found or not open');
      }

      const tax_amount = item.total_price * 0.0875;

      // Remove item from tab
      await client.query('DELETE FROM tab_items WHERE id = $1', [itemId]);

      // Update tab totals
      await client.query(`
        UPDATE member_tabs 
        SET subtotal = subtotal - $1, 
            tax_amount = tax_amount - $2, 
            total_amount = total_amount - $3
        WHERE id = $4
      `, [item.total_price, tax_amount, item.total_price + tax_amount, id]);

      // Restore product stock
      const productResult = await client.query(
        'SELECT category FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length > 0 && productResult.rows[0].category !== 'service') {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // Create inventory movement record
        await client.query(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity_change, reference_id, reference_type, staff_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [item.product_id, 'return', item.quantity, id, 'tab_item_removal', req.user.id]);
      }

      res.json({
        message: 'Item removed from tab successfully',
        removed_amount: item.total_price + tax_amount
      });
    });
  } catch (error) {
    console.error('Error removing item from tab:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/tabs/{id}/close:
 *   post:
 *     summary: Close tab (convert to invoice)
 *     tags: [Tabs]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tab closed successfully
 */
router.post('/:id/close', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = '' } = req.body;

    await transaction(async (client) => {
      // Get tab details
      const tabResult = await client.query(
        'SELECT * FROM member_tabs WHERE id = $1 AND status = $2',
        [id, 'open']
      );

      if (tabResult.rows.length === 0) {
        throw new Error('Tab not found or not open');
      }

      const tab = tabResult.rows[0];

      if (tab.total_amount <= 0) {
        throw new Error('Cannot close tab with no items');
      }

      // Update tab status to closed
      await client.query(`
        UPDATE member_tabs 
        SET status = 'closed', 
            closed_at = CURRENT_TIMESTAMP,
            notes = COALESCE(notes, '') || $1
        WHERE id = $2
      `, [notes ? `\nClosed: ${notes}` : '', id]);

      // Create financial transaction for the member
      await client.query(`
        INSERT INTO financial_transactions (
          transaction_type, member_id, amount, description, status, reference_number
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'tab_charge', 
        tab.member_id, 
        tab.total_amount, 
        `Tab charges: ${tab.tab_number}`, 
        'pending', 
        tab.tab_number
      ]);

      res.json({
        message: 'Tab closed successfully and added to member account',
        tab_number: tab.tab_number,
        total_amount: tab.total_amount
      });
    });
  } catch (error) {
    console.error('Error closing tab:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/tabs/{id}/payment:
 *   post:
 *     summary: Process tab payment
 *     tags: [Tabs]
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
 *               - payment_amount
 *               - payment_method
 *             properties:
 *               payment_amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, member_account, gift_card]
 *               payment_reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */
router.post('/:id/payment', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_amount, payment_method, payment_reference = '' } = req.body;
    const processed_by = req.user.id;

    await transaction(async (client) => {
      // Get tab details
      const tabResult = await client.query(
        'SELECT * FROM member_tabs WHERE id = $1 AND status IN ($2, $3)',
        [id, 'open', 'closed']
      );

      if (tabResult.rows.length === 0) {
        throw new Error('Tab not found or already paid');
      }

      const tab = tabResult.rows[0];

      if (payment_amount > tab.total_amount) {
        throw new Error('Payment amount cannot exceed tab total');
      }

      // Create payment record
      const paymentResult = await client.query(`
        INSERT INTO tab_payments (tab_id, payment_amount, payment_method, payment_reference, processed_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [id, payment_amount, payment_method, payment_reference, processed_by]);

      // Check if tab is fully paid
      const totalPaid = await client.query(
        'SELECT COALESCE(SUM(payment_amount), 0) as total_paid FROM tab_payments WHERE tab_id = $1',
        [id]
      );

      const amountPaid = parseFloat(totalPaid.rows[0].total_paid);
      const tabTotal = parseFloat(tab.total_amount);

      let newStatus = tab.status;
      if (amountPaid >= tabTotal) {
        newStatus = 'paid';
        
        // Update any related financial transaction to completed
        await client.query(`
          UPDATE financial_transactions 
          SET status = 'completed' 
          WHERE reference_number = $1 AND transaction_type = 'tab_charge'
        `, [tab.tab_number]);
      }

      // Update tab status if fully paid
      await client.query(
        'UPDATE member_tabs SET status = $1 WHERE id = $2',
        [newStatus, id]
      );

      res.json({
        message: 'Payment processed successfully',
        payment: paymentResult.rows[0],
        tab_status: newStatus,
        remaining_balance: Math.max(0, tabTotal - amountPaid)
      });
    });
  } catch (error) {
    console.error('Error processing tab payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// INVOICE MANAGEMENT ROUTES
// ===================

/**
 * @swagger
 * /api/v1/tabs/invoices:
 *   get:
 *     summary: Get all unpaid invoices
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: member_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, paid, cancelled]
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/invoices', authMiddleware, async (req, res) => {
  try {
    const { member_id, status = 'closed' } = req.query;
    
    let conditions = ['mt.status = $1'];
    let params = [status];
    let paramCount = 1;

    if (member_id) {
      paramCount++;
      conditions.push(`mt.member_id = $${paramCount}`);
      params.push(member_id);
    }

    const invoicesQuery = `
      SELECT 
        mt.*,
        CONCAT(m.first_name, ' ', m.last_name) as member_name,
        m.member_number,
        m.email,
        COUNT(ti.id) as item_count,
        COALESCE(SUM(tp.payment_amount), 0) as amount_paid,
        (mt.total_amount - COALESCE(SUM(tp.payment_amount), 0)) as balance_due
      FROM member_tabs mt
      LEFT JOIN members m ON mt.member_id = m.id
      LEFT JOIN tab_items ti ON mt.id = ti.tab_id
      LEFT JOIN tab_payments tp ON mt.id = tp.tab_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY mt.id, m.first_name, m.last_name, m.member_number, m.email
      ORDER BY mt.closed_at DESC
    `;

    const result = await query(invoicesQuery, params);

    res.json({
      invoices: result.rows
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/tabs/member/{memberId}/invoices:
 *   get:
 *     summary: Get member invoices
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member's invoices
 */
router.get('/member/:memberId/invoices', authMiddleware, async (req, res) => {
  try {
    const { memberId } = req.params;

    const invoicesQuery = `
      SELECT 
        mt.*,
        COUNT(ti.id) as item_count,
        COALESCE(SUM(tp.payment_amount), 0) as amount_paid,
        (mt.total_amount - COALESCE(SUM(tp.payment_amount), 0)) as balance_due
      FROM member_tabs mt
      LEFT JOIN tab_items ti ON mt.id = ti.tab_id
      LEFT JOIN tab_payments tp ON mt.id = tp.tab_id
      WHERE mt.member_id = $1 AND mt.status IN ('closed', 'paid')
      GROUP BY mt.id
      ORDER BY mt.closed_at DESC
    `;

    const result = await query(invoicesQuery, [memberId]);

    // Get member financial summary
    const summaryQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as unpaid_invoices,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN total_amount ELSE 0 END), 0) as total_unpaid,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_paid_ytd
      FROM member_tabs 
      WHERE member_id = $1 AND EXTRACT(YEAR FROM opened_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    const summaryResult = await query(summaryQuery, [memberId]);

    res.json({
      invoices: result.rows,
      summary: summaryResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching member invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/tabs/invoices/{id}/pay:
 *   post:
 *     summary: Pay invoice
 *     tags: [Tabs]
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
 *               - payment_method
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, member_account, gift_card]
 *               payment_reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice paid successfully
 */
router.post('/invoices/:id/pay', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, payment_reference = '' } = req.body;
    const processed_by = req.user.id;

    await transaction(async (client) => {
      // Get invoice details
      const invoiceResult = await client.query(
        'SELECT * FROM member_tabs WHERE id = $1 AND status = $2',
        [id, 'closed']
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found or already paid');
      }

      const invoice = invoiceResult.rows[0];

      // Check if already partially paid
      const paidResult = await client.query(
        'SELECT COALESCE(SUM(payment_amount), 0) as amount_paid FROM tab_payments WHERE tab_id = $1',
        [id]
      );

      const amount_paid = parseFloat(paidResult.rows[0].amount_paid);
      const balance_due = parseFloat(invoice.total_amount) - amount_paid;

      if (balance_due <= 0) {
        throw new Error('Invoice is already fully paid');
      }

      // Create payment record for the full balance
      const paymentResult = await client.query(`
        INSERT INTO tab_payments (tab_id, payment_amount, payment_method, payment_reference, processed_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [id, balance_due, payment_method, payment_reference, processed_by]);

      // Update tab status to paid
      await client.query(
        'UPDATE member_tabs SET status = $1 WHERE id = $2',
        ['paid', id]
      );

      // Update any related financial transaction to completed
      await client.query(`
        UPDATE financial_transactions 
        SET status = 'completed' 
        WHERE reference_number = $1 AND transaction_type = 'tab_charge'
      `, [invoice.tab_number]);

      res.json({
        message: 'Invoice paid successfully',
        payment: paymentResult.rows[0],
        amount_paid: balance_due
      });
    });
  } catch (error) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/tabs/{id}/details:
 *   get:
 *     summary: Get tab details with items
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tab details with items
 */
router.get('/:id/details', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get tab details
    const tabQuery = `
      SELECT 
        mt.*,
        CONCAT(m.first_name, ' ', m.last_name) as member_name,
        m.member_number,
        m.email,
        CONCAT(s.first_name, ' ', s.last_name) as opened_by_name
      FROM member_tabs mt
      LEFT JOIN members m ON mt.member_id = m.id
      LEFT JOIN staff s ON mt.opened_by = s.id
      WHERE mt.id = $1
    `;

    const tabResult = await query(tabQuery, [id]);

    if (tabResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tab not found' });
    }

    // Get tab items
    const itemsQuery = `
      SELECT 
        ti.*,
        p.name as product_name,
        p.sku,
        p.category,
        CONCAT(s.first_name, ' ', s.last_name) as added_by_name
      FROM tab_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      LEFT JOIN staff s ON ti.added_by = s.id
      WHERE ti.tab_id = $1
      ORDER BY ti.added_at
    `;

    const itemsResult = await query(itemsQuery, [id]);

    // Get payment history
    const paymentsQuery = `
      SELECT 
        tp.*,
        CONCAT(s.first_name, ' ', s.last_name) as processed_by_name
      FROM tab_payments tp
      LEFT JOIN staff s ON tp.processed_by = s.id
      WHERE tp.tab_id = $1
      ORDER BY tp.processed_at
    `;

    const paymentsResult = await query(paymentsQuery, [id]);

    res.json({
      tab: tabResult.rows[0],
      items: itemsResult.rows,
      payments: paymentsResult.rows,
      summary: {
        item_count: itemsResult.rows.length,
        total_paid: paymentsResult.rows.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0),
        balance_due: parseFloat(tabResult.rows[0].total_amount) - paymentsResult.rows.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching tab details:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;