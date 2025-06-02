const express = require('express');
const { query, transaction } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         price:
 *           type: number
 *         stock_quantity:
 *           type: integer
 *         min_stock_level:
 *           type: integer
 *         is_active:
 *           type: boolean
 *     InventoryMovement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         product_id:
 *           type: string
 *           format: uuid
 *         movement_type:
 *           type: string
 *           enum: [sale, purchase, adjustment, waste, return, transfer]
 *         quantity_change:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 */

// ===================
// PRODUCT MANAGEMENT ROUTES
// ===================

/**
 * @swagger
 * /api/v1/inventory/products:
 *   get:
 *     summary: Get products with stock information
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: low_stock_only
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_fnb
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: is_proshop
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of products with stock information
 */
router.get('/products', async (req, res) => {
  try {
    const { category, low_stock_only, search, is_fnb, is_proshop, page = 1, limit = 100 } = req.query;
    
    let conditions = ['p.is_active = true'];
    let params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      conditions.push(`p.category = $${paramCount}`);
      params.push(category);
    }

    if (low_stock_only === 'true') {
      conditions.push('p.stock_quantity <= p.min_stock_level');
    }

    if (search) {
      paramCount++;
      conditions.push(`(p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (is_fnb === 'true') {
      conditions.push(`(p.category LIKE '%fnb%' OR p.category LIKE '%food%' OR p.category LIKE '%beverage%')`);
    }

    if (is_proshop === 'true') {
      conditions.push(`(p.category LIKE '%pro%' OR p.category LIKE '%golf%' OR p.category LIKE '%apparel%')`);
    }

    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const productsQuery = `
      SELECT 
        p.*,
        CASE 
          WHEN p.stock_quantity <= p.min_stock_level THEN true 
          ELSE false 
        END as is_low_stock,
        CASE 
          WHEN p.stock_quantity = 0 THEN true 
          ELSE false 
        END as is_out_of_stock,
        (
          SELECT SUM(im.quantity_change) 
          FROM inventory_movements im 
          WHERE im.product_id = p.id 
          AND im.movement_type = 'sale' 
          AND DATE(im.created_at) >= CURRENT_DATE - INTERVAL '30 days'
        ) as sales_last_30_days
      FROM products p
      WHERE ${conditions.join(' AND ')}
      ORDER BY 
        CASE WHEN p.stock_quantity <= p.min_stock_level THEN 0 ELSE 1 END,
        p.name
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await query(productsQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${conditions.join(' AND ')}
    `;
    const countResult = await query(countQuery, params.slice(0, -2));

    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_count,
        SUM(stock_quantity * cost) as total_inventory_value
      FROM products 
      WHERE is_active = true
    `;
    const statsResult = await query(statsQuery);

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      },
      summary: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/inventory/products:
 *   post:
 *     summary: Create new product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - name
 *               - category
 *               - price
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               price:
 *                 type: number
 *               cost:
 *                 type: number
 *               stock_quantity:
 *                 type: integer
 *               min_stock_level:
 *                 type: integer
 *               supplier_info:
 *                 type: object
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/products', authMiddleware, async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      category,
      subcategory,
      price,
      cost,
      stock_quantity = 0,
      min_stock_level = 0,
      supplier_info = {}
    } = req.body;

    // Check if SKU already exists
    const existingProduct = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existingProduct.rows.length > 0) {
      return res.status(400).json({ error: 'Product with this SKU already exists' });
    }

    const result = await query(`
      INSERT INTO products (
        sku, name, description, category, subcategory, 
        price, cost, stock_quantity, min_stock_level, supplier_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [sku, name, description, category, subcategory, price, cost, stock_quantity, min_stock_level, JSON.stringify(supplier_info)]);

    // Create initial inventory movement if stock_quantity > 0
    if (stock_quantity > 0) {
      await query(`
        INSERT INTO inventory_movements (
          product_id, movement_type, quantity_change, reference_type, staff_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [result.rows[0].id, 'adjustment', stock_quantity, 'initial_stock', req.user.id, 'Initial stock entry']);
    }

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/inventory/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Inventory]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               cost:
 *                 type: number
 *               min_stock_level:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put('/products/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // Build dynamic update query
    const setClause = [];
    const params = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateFields)) {
      if (['name', 'description', 'category', 'subcategory', 'price', 'cost', 'min_stock_level', 'supplier_info'].includes(key)) {
        paramCount++;
        setClause.push(`${key} = $${paramCount}`);
        params.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    paramCount++;
    params.push(id);

    const updateQuery = `
      UPDATE products 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND is_active = true
      RETURNING *
    `;

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// STOCK MANAGEMENT ROUTES
// ===================

/**
 * @swagger
 * /api/v1/inventory/stock-adjustment:
 *   post:
 *     summary: Adjust stock levels
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity_change
 *               - reason
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               quantity_change:
 *                 type: integer
 *               reason:
 *                 type: string
 *               unit_cost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 */
router.post('/stock-adjustment', authMiddleware, async (req, res) => {
  try {
    const { product_id, quantity_change, reason, unit_cost = null } = req.body;
    const staff_id = req.user.id;

    await transaction(async (client) => {
      // Get current product details
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND is_active = true',
        [product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found or inactive');
      }

      const product = productResult.rows[0];
      const new_quantity = product.stock_quantity + quantity_change;

      if (new_quantity < 0) {
        throw new Error('Adjustment would result in negative stock');
      }

      // Update product stock
      await client.query(
        'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [new_quantity, product_id]
      );

      // Create inventory movement record
      const movementResult = await client.query(`
        INSERT INTO inventory_movements (
          product_id, movement_type, quantity_change, unit_cost, 
          reference_type, staff_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [product_id, 'adjustment', quantity_change, unit_cost, 'manual_adjustment', staff_id, reason]);

      res.json({
        message: 'Stock adjusted successfully',
        product_name: product.name,
        old_quantity: product.stock_quantity,
        new_quantity: new_quantity,
        movement: movementResult.rows[0]
      });
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/inventory/low-stock:
 *   get:
 *     summary: Get low stock alerts
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products with low stock
 */
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const lowStockQuery = `
      SELECT 
        p.*,
        (p.min_stock_level - p.stock_quantity) as reorder_quantity,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= (p.min_stock_level * 0.5) THEN 'critical'
          ELSE 'low'
        END as urgency_level
      FROM products p
      WHERE p.is_active = true 
      AND p.stock_quantity <= p.min_stock_level
      ORDER BY 
        CASE 
          WHEN p.stock_quantity = 0 THEN 0
          WHEN p.stock_quantity <= (p.min_stock_level * 0.5) THEN 1
          ELSE 2
        END,
        p.stock_quantity ASC
    `;

    const result = await query(lowStockQuery);

    // Group by urgency level
    const alerts = {
      out_of_stock: result.rows.filter(p => p.urgency_level === 'out_of_stock'),
      critical: result.rows.filter(p => p.urgency_level === 'critical'),
      low: result.rows.filter(p => p.urgency_level === 'low')
    };

    res.json({
      total_alerts: result.rows.length,
      alerts: alerts,
      summary: {
        out_of_stock_count: alerts.out_of_stock.length,
        critical_count: alerts.critical.length,
        low_count: alerts.low.length
      }
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/inventory/movements:
 *   get:
 *     summary: Get inventory movement history
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: movement_type
 *         schema:
 *           type: string
 *           enum: [sale, purchase, adjustment, waste, return, transfer]
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
 *     responses:
 *       200:
 *         description: List of inventory movements
 */
router.get('/movements', authMiddleware, async (req, res) => {
  try {
    const { product_id, movement_type, date_from, date_to, page = 1, limit = 100 } = req.query;
    
    let conditions = [];
    let params = [];
    let paramCount = 0;

    if (product_id) {
      paramCount++;
      conditions.push(`im.product_id = $${paramCount}`);
      params.push(product_id);
    }

    if (movement_type) {
      paramCount++;
      conditions.push(`im.movement_type = $${paramCount}`);
      params.push(movement_type);
    }

    if (date_from) {
      paramCount++;
      conditions.push(`DATE(im.created_at) >= $${paramCount}`);
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      conditions.push(`DATE(im.created_at) <= $${paramCount}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const movementsQuery = `
      SELECT 
        im.*,
        p.name as product_name,
        p.sku,
        CONCAT(s.first_name, ' ', s.last_name) as staff_name
      FROM inventory_movements im
      LEFT JOIN products p ON im.product_id = p.id
      LEFT JOIN staff s ON im.staff_id = s.id
      ${whereClause}
      ORDER BY im.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await query(movementsQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_movements im
      ${whereClause}
    `;
    const countResult = await query(countQuery, params.slice(0, -2));

    res.json({
      movements: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// CATEGORY MANAGEMENT ROUTES
// ===================

/**
 * @swagger
 * /api/v1/inventory/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of product categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categoriesQuery = `
      SELECT 
        category,
        COUNT(*) as product_count,
        SUM(stock_quantity) as total_stock,
        AVG(price) as avg_price
      FROM products 
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `;

    const result = await query(categoriesQuery);

    res.json({
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/inventory/reports/valuation:
 *   get:
 *     summary: Get inventory valuation report
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory valuation report
 */
router.get('/reports/valuation', authMiddleware, async (req, res) => {
  try {
    const valuationQuery = `
      SELECT 
        category,
        COUNT(*) as product_count,
        SUM(stock_quantity) as total_units,
        SUM(stock_quantity * cost) as total_cost_value,
        SUM(stock_quantity * price) as total_retail_value,
        SUM(stock_quantity * (price - cost)) as potential_profit,
        AVG(CASE WHEN min_stock_level > 0 THEN (stock_quantity::float / min_stock_level) ELSE 0 END) as avg_stock_ratio
      FROM products 
      WHERE is_active = true AND cost > 0
      GROUP BY category
      ORDER BY total_cost_value DESC
    `;

    const result = await query(valuationQuery);

    // Get overall totals
    const totalQuery = `
      SELECT 
        COUNT(*) as total_products,
        SUM(stock_quantity) as total_units,
        SUM(stock_quantity * cost) as total_cost_value,
        SUM(stock_quantity * price) as total_retail_value
      FROM products 
      WHERE is_active = true AND cost > 0
    `;

    const totalResult = await query(totalQuery);

    res.json({
      by_category: result.rows,
      overall_totals: totalResult.rows[0]
    });
  } catch (error) {
    console.error('Error generating valuation report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
