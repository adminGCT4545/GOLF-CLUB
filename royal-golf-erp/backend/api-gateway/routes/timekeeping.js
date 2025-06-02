const express = require('express');
const { query, transaction } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TimeClockEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         employee_id:
 *           type: string
 *           format: uuid
 *         clock_in:
 *           type: string
 *           format: date-time
 *         clock_out:
 *           type: string
 *           format: date-time
 *         total_hours:
 *           type: number
 *         overtime_hours:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, modified]
 */

// ===================
// CLOCK OPERATIONS ROUTES
// ===================

/**
 * @swagger
 * /api/v1/timekeeping/clock-in:
 *   post:
 *     summary: Employee clock in
 *     tags: [Timekeeping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *             properties:
 *               employee_id:
 *                 type: string
 *                 format: uuid
 *               department:
 *                 type: string
 *               shift_type:
 *                 type: string
 *                 enum: [regular, weekend, holiday, overtime]
 *     responses:
 *       201:
 *         description: Employee clocked in successfully
 *       400:
 *         description: Employee already clocked in or invalid data
 */
router.post('/clock-in', authMiddleware, async (req, res) => {
  try {
    const { employee_id, department = 'general', shift_type = 'regular' } = req.body;

    // Verify employee exists and is active
    const employeeResult = await query(
      'SELECT * FROM staff WHERE id = $1 AND is_active = true',
      [employee_id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found or inactive' });
    }

    // Check if employee is already clocked in
    const existingEntry = await query(
      'SELECT * FROM time_clock_entries WHERE employee_id = $1 AND clock_out IS NULL',
      [employee_id]
    );

    if (existingEntry.rows.length > 0) {
      return res.status(400).json({ error: 'Employee is already clocked in' });
    }

    const result = await query(`
      INSERT INTO time_clock_entries (employee_id, clock_in, department, shift_type)
      VALUES ($1, CURRENT_TIMESTAMP, $2, $3)
      RETURNING *
    `, [employee_id, department, shift_type]);

    res.status(201).json({
      message: 'Employee clocked in successfully',
      time_entry: result.rows[0]
    });
  } catch (error) {
    console.error('Error clocking in employee:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/timekeeping/clock-out:
 *   post:
 *     summary: Employee clock out
 *     tags: [Timekeeping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *             properties:
 *               employee_id:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee clocked out successfully
 */
router.post('/clock-out', authMiddleware, async (req, res) => {
  try {
    const { employee_id, notes = '' } = req.body;

    await transaction(async (client) => {
      // Get open time entry
      const entryResult = await client.query(
        'SELECT * FROM time_clock_entries WHERE employee_id = $1 AND clock_out IS NULL',
        [employee_id]
      );

      if (entryResult.rows.length === 0) {
        throw new Error('No open time entry found for employee');
      }

      const entry = entryResult.rows[0];
      const clock_out_time = new Date();
      const clock_in_time = new Date(entry.clock_in);
      
      // Calculate total hours
      let total_hours = (clock_out_time - clock_in_time) / (1000 * 60 * 60);
      
      // Subtract break time if applicable
      const breakResult = await client.query(
        'SELECT SUM(duration_minutes) as total_break_minutes FROM break_records WHERE time_entry_id = $1 AND break_end IS NOT NULL',
        [entry.id]
      );

      if (breakResult.rows.length > 0 && breakResult.rows[0].total_break_minutes) {
        const break_hours = breakResult.rows[0].total_break_minutes / 60;
        total_hours -= break_hours;
      }

      // Calculate regular and overtime hours
      const regular_hours = Math.min(total_hours, 8);
      const overtime_hours = Math.max(0, total_hours - 8);

      // Update time entry
      const updatedEntry = await client.query(`
        UPDATE time_clock_entries 
        SET clock_out = $1, 
            total_hours = $2, 
            regular_hours = $3, 
            overtime_hours = $4, 
            notes = $5
        WHERE id = $6
        RETURNING *
      `, [clock_out_time, total_hours, regular_hours, overtime_hours, notes, entry.id]);

      res.json({
        message: 'Employee clocked out successfully',
        time_entry: updatedEntry.rows[0],
        summary: {
          total_hours: total_hours.toFixed(2),
          regular_hours: regular_hours.toFixed(2),
          overtime_hours: overtime_hours.toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Error clocking out employee:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/timekeeping/break-start:
 *   post:
 *     summary: Start break
 *     tags: [Timekeeping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *             properties:
 *               employee_id:
 *                 type: string
 *                 format: uuid
 *               break_type:
 *                 type: string
 *                 enum: [regular, lunch, sick, personal]
 *     responses:
 *       201:
 *         description: Break started successfully
 */
router.post('/break-start', authMiddleware, async (req, res) => {
  try {
    const { employee_id, break_type = 'regular' } = req.body;

    await transaction(async (client) => {
      // Get current time entry
      const entryResult = await client.query(
        'SELECT * FROM time_clock_entries WHERE employee_id = $1 AND clock_out IS NULL',
        [employee_id]
      );

      if (entryResult.rows.length === 0) {
        throw new Error('Employee is not currently clocked in');
      }

      const time_entry_id = entryResult.rows[0].id;

      // Check if employee is already on break
      const activeBreak = await client.query(
        'SELECT * FROM break_records WHERE time_entry_id = $1 AND break_end IS NULL',
        [time_entry_id]
      );

      if (activeBreak.rows.length > 0) {
        throw new Error('Employee is already on break');
      }

      // Start break
      const breakResult = await client.query(`
        INSERT INTO break_records (time_entry_id, break_start, break_type)
        VALUES ($1, CURRENT_TIMESTAMP, $2)
        RETURNING *
      `, [time_entry_id, break_type]);

      res.status(201).json({
        message: 'Break started successfully',
        break_record: breakResult.rows[0]
      });
    });
  } catch (error) {
    console.error('Error starting break:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/timekeeping/break-end:
 *   post:
 *     summary: End break
 *     tags: [Timekeeping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *             properties:
 *               employee_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Break ended successfully
 */
router.post('/break-end', authMiddleware, async (req, res) => {
  try {
    const { employee_id } = req.body;

    await transaction(async (client) => {
      // Get current time entry
      const entryResult = await client.query(
        'SELECT * FROM time_clock_entries WHERE employee_id = $1 AND clock_out IS NULL',
        [employee_id]
      );

      if (entryResult.rows.length === 0) {
        throw new Error('Employee is not currently clocked in');
      }

      const time_entry_id = entryResult.rows[0].id;

      // Get active break
      const breakResult = await client.query(
        'SELECT * FROM break_records WHERE time_entry_id = $1 AND break_end IS NULL',
        [time_entry_id]
      );

      if (breakResult.rows.length === 0) {
        throw new Error('Employee is not currently on break');
      }

      const break_record = breakResult.rows[0];
      const break_end_time = new Date();
      const break_start_time = new Date(break_record.break_start);
      const duration_minutes = Math.round((break_end_time - break_start_time) / (1000 * 60));

      // End break
      const updatedBreak = await client.query(`
        UPDATE break_records 
        SET break_end = $1, duration_minutes = $2
        WHERE id = $3
        RETURNING *
      `, [break_end_time, duration_minutes, break_record.id]);

      res.json({
        message: 'Break ended successfully',
        break_record: updatedBreak.rows[0],
        duration_minutes: duration_minutes
      });
    });
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// TIMESHEET MANAGEMENT ROUTES
// ===================

/**
 * @swagger
 * /api/v1/timekeeping/timesheets:
 *   get:
 *     summary: Get timesheets with filtering
 *     tags: [Timekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, modified]
 *     responses:
 *       200:
 *         description: List of timesheets
 */
router.get('/timesheets', authMiddleware, async (req, res) => {
  try {
    const { 
      employee_id, 
      department, 
      date_from, 
      date_to, 
      status, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    let conditions = [];
    let params = [];
    let paramCount = 0;

    if (employee_id) {
      paramCount++;
      conditions.push(`tce.employee_id = $${paramCount}`);
      params.push(employee_id);
    }

    if (department) {
      paramCount++;
      conditions.push(`tce.department = $${paramCount}`);
      params.push(department);
    }

    if (date_from) {
      paramCount++;
      conditions.push(`DATE(tce.clock_in) >= $${paramCount}`);
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      conditions.push(`DATE(tce.clock_in) <= $${paramCount}`);
      params.push(date_to);
    }

    if (status) {
      paramCount++;
      conditions.push(`tce.status = $${paramCount}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const timesheetsQuery = `
      SELECT 
        tce.*,
        CONCAT(s.first_name, ' ', s.last_name) as employee_name,
        s.employee_id as employee_number,
        s.position,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name,
        COALESCE(SUM(br.duration_minutes), 0) as total_break_minutes
      FROM time_clock_entries tce
      LEFT JOIN staff s ON tce.employee_id = s.id
      LEFT JOIN staff approver ON tce.approved_by = approver.id
      LEFT JOIN break_records br ON tce.id = br.time_entry_id
      ${whereClause}
      GROUP BY tce.id, s.first_name, s.last_name, s.employee_id, s.position, approver.first_name, approver.last_name
      ORDER BY tce.clock_in DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await query(timesheetsQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM time_clock_entries tce
      LEFT JOIN staff s ON tce.employee_id = s.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, params.slice(0, -2));

    res.json({
      timesheets: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/timekeeping/timesheets/{id}:
 *   put:
 *     summary: Update timesheet
 *     tags: [Timekeeping]
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
 *               clock_in:
 *                 type: string
 *                 format: date-time
 *               clock_out:
 *                 type: string
 *                 format: date-time
 *               total_hours:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timesheet updated successfully
 */
router.put('/timesheets/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { clock_in, clock_out, total_hours, notes } = req.body;

    await transaction(async (client) => {
      // Get current timesheet
      const currentResult = await client.query(
        'SELECT * FROM time_clock_entries WHERE id = $1',
        [id]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Timesheet not found');
      }

      const current = currentResult.rows[0];

      // Build update query dynamically
      const updateFields = [];
      const params = [];
      let paramCount = 0;

      if (clock_in) {
        paramCount++;
        updateFields.push(`clock_in = $${paramCount}`);
        params.push(clock_in);
      }

      if (clock_out) {
        paramCount++;
        updateFields.push(`clock_out = $${paramCount}`);
        params.push(clock_out);
      }

      if (total_hours !== undefined) {
        paramCount++;
        updateFields.push(`total_hours = $${paramCount}`);
        params.push(total_hours);

        // Calculate regular and overtime
        const regular_hours = Math.min(total_hours, 8);
        const overtime_hours = Math.max(0, total_hours - 8);

        paramCount++;
        updateFields.push(`regular_hours = $${paramCount}`);
        params.push(regular_hours);

        paramCount++;
        updateFields.push(`overtime_hours = $${paramCount}`);
        params.push(overtime_hours);
      }

      if (notes !== undefined) {
        paramCount++;
        updateFields.push(`notes = $${paramCount}`);
        params.push(notes);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Mark as modified if not already approved
      if (current.status === 'pending') {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        params.push('modified');
      }

      paramCount++;
      params.push(id);

      const updateQuery = `
        UPDATE time_clock_entries 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(updateQuery, params);

      res.json({
        message: 'Timesheet updated successfully',
        timesheet: result.rows[0]
      });
    });
  } catch (error) {
    console.error('Error updating timesheet:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/timekeeping/approve/{id}:
 *   post:
 *     summary: Approve timesheet
 *     tags: [Timekeeping]
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
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timesheet approved/rejected successfully
 */
router.post('/approve/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { action = 'approve', notes = '' } = req.body;
    const approved_by = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approve or reject' });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const result = await query(`
      UPDATE time_clock_entries 
      SET status = $1, 
          approved_by = $2, 
          approved_at = CURRENT_TIMESTAMP,
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $3
            ELSE notes || '\n' || $3
          END
      WHERE id = $4 AND status IN ('pending', 'modified')
      RETURNING *
    `, [status, approved_by, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timesheet not found or already processed' });
    }

    res.json({
      message: `Timesheet ${action}d successfully`,
      timesheet: result.rows[0]
    });
  } catch (error) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// REPORTING ROUTES
// ===================

/**
 * @swagger
 * /api/v1/timekeeping/reports/weekly:
 *   get:
 *     summary: Get weekly time reports
 *     tags: [Timekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: week_start
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weekly time report
 */
router.get('/reports/weekly', authMiddleware, async (req, res) => {
  try {
    const { 
      week_start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      department 
    } = req.query;

    const week_end = new Date(new Date(week_start).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let conditions = ['DATE(tce.clock_in) BETWEEN $1 AND $2'];
    let params = [week_start, week_end];
    let paramCount = 2;

    if (department) {
      paramCount++;
      conditions.push(`tce.department = $${paramCount}`);
      params.push(department);
    }

    const weeklyQuery = `
      SELECT 
        tce.employee_id,
        CONCAT(s.first_name, ' ', s.last_name) as employee_name,
        s.employee_id as employee_number,
        tce.department,
        COUNT(*) as days_worked,
        COALESCE(SUM(tce.total_hours), 0) as total_hours,
        COALESCE(SUM(tce.regular_hours), 0) as regular_hours,
        COALESCE(SUM(tce.overtime_hours), 0) as overtime_hours,
        COALESCE(AVG(tce.total_hours), 0) as avg_daily_hours
      FROM time_clock_entries tce
      LEFT JOIN staff s ON tce.employee_id = s.id
      WHERE ${conditions.join(' AND ')}
      AND tce.clock_out IS NOT NULL
      GROUP BY tce.employee_id, s.first_name, s.last_name, s.employee_id, tce.department
      ORDER BY total_hours DESC
    `;

    const result = await query(weeklyQuery, params);

    // Get department summary
    const deptSummaryQuery = `
      SELECT 
        tce.department,
        COUNT(DISTINCT tce.employee_id) as employee_count,
        COALESCE(SUM(tce.total_hours), 0) as total_hours,
        COALESCE(SUM(tce.overtime_hours), 0) as overtime_hours
      FROM time_clock_entries tce
      WHERE ${conditions.join(' AND ')}
      AND tce.clock_out IS NOT NULL
      GROUP BY tce.department
      ORDER BY total_hours DESC
    `;

    const deptResult = await query(deptSummaryQuery, params);

    res.json({
      period: {
        week_start: week_start,
        week_end: week_end
      },
      employee_summary: result.rows,
      department_summary: deptResult.rows,
      totals: {
        total_employees: result.rows.length,
        total_hours: result.rows.reduce((sum, emp) => sum + parseFloat(emp.total_hours), 0),
        total_overtime: result.rows.reduce((sum, emp) => sum + parseFloat(emp.overtime_hours), 0)
      }
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/timekeeping/reports/payroll:
 *   get:
 *     summary: Get payroll export data
 *     tags: [Timekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pay_period_start
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: pay_period_end
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Payroll export data
 */
router.get('/reports/payroll', authMiddleware, async (req, res) => {
  try {
    const { 
      pay_period_start = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pay_period_end = new Date().toISOString().split('T')[0]
    } = req.query;

    const payrollQuery = `
      SELECT 
        s.employee_id,
        CONCAT(s.first_name, ' ', s.last_name) as employee_name,
        s.position,
        s.department,
        s.salary / (52 * 40) as hourly_rate, -- Convert annual salary to hourly
        COUNT(*) as pay_period_days,
        COALESCE(SUM(tce.total_hours), 0) as total_hours,
        COALESCE(SUM(tce.regular_hours), 0) as regular_hours,
        COALESCE(SUM(tce.overtime_hours), 0) as overtime_hours,
        ROUND((s.salary / (52 * 40)) * SUM(tce.regular_hours), 2) as regular_pay,
        ROUND((s.salary / (52 * 40)) * 1.5 * SUM(tce.overtime_hours), 2) as overtime_pay,
        ROUND((s.salary / (52 * 40)) * (SUM(tce.regular_hours) + (SUM(tce.overtime_hours) * 1.5)), 2) as gross_pay
      FROM time_clock_entries tce
      JOIN staff s ON tce.employee_id = s.id
      WHERE DATE(tce.clock_in) BETWEEN $1 AND $2
      AND tce.clock_out IS NOT NULL
      AND tce.status = 'approved'
      AND s.is_active = true
      GROUP BY s.id, s.employee_id, s.first_name, s.last_name, s.position, s.department, s.salary
      ORDER BY s.employee_id
    `;

    const result = await query(payrollQuery, [pay_period_start, pay_period_end]);

    const totals = {
      total_employees: result.rows.length,
      total_hours: result.rows.reduce((sum, emp) => sum + parseFloat(emp.total_hours), 0),
      total_regular_hours: result.rows.reduce((sum, emp) => sum + parseFloat(emp.regular_hours), 0),
      total_overtime_hours: result.rows.reduce((sum, emp) => sum + parseFloat(emp.overtime_hours), 0),
      total_regular_pay: result.rows.reduce((sum, emp) => sum + parseFloat(emp.regular_pay), 0),
      total_overtime_pay: result.rows.reduce((sum, emp) => sum + parseFloat(emp.overtime_pay), 0),
      total_gross_pay: result.rows.reduce((sum, emp) => sum + parseFloat(emp.gross_pay), 0)
    };

    res.json({
      pay_period: {
        start_date: pay_period_start,
        end_date: pay_period_end
      },
      payroll_data: result.rows,
      totals: totals
    });
  } catch (error) {
    console.error('Error generating payroll report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/timekeeping/reports/overtime:
 *   get:
 *     summary: Get overtime reports
 *     tags: [Timekeeping]
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
 *     responses:
 *       200:
 *         description: Overtime report
 */
router.get('/reports/overtime', authMiddleware, async (req, res) => {
  try {
    const { 
      date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_to = new Date().toISOString().split('T')[0]
    } = req.query;

    const overtimeQuery = `
      SELECT 
        tce.employee_id,
        CONCAT(s.first_name, ' ', s.last_name) as employee_name,
        s.employee_id as employee_number,
        s.department,
        DATE(tce.clock_in) as work_date,
        tce.total_hours,
        tce.overtime_hours,
        ROUND((s.salary / (52 * 40)) * 1.5 * tce.overtime_hours, 2) as overtime_pay
      FROM time_clock_entries tce
      JOIN staff s ON tce.employee_id = s.id
      WHERE DATE(tce.clock_in) BETWEEN $1 AND $2
      AND tce.overtime_hours > 0
      AND tce.clock_out IS NOT NULL
      ORDER BY tce.overtime_hours DESC, tce.clock_in DESC
    `;

    const result = await query(overtimeQuery, [date_from, date_to]);

    // Group by employee for summary
    const employeeSummary = {};
    result.rows.forEach(row => {
      const empId = row.employee_id;
      if (!employeeSummary[empId]) {
        employeeSummary[empId] = {
          employee_name: row.employee_name,
          employee_number: row.employee_number,
          department: row.department,
          total_overtime_hours: 0,
          total_overtime_pay: 0,
          overtime_days: 0
        };
      }
      employeeSummary[empId].total_overtime_hours += parseFloat(row.overtime_hours);
      employeeSummary[empId].total_overtime_pay += parseFloat(row.overtime_pay);
      employeeSummary[empId].overtime_days += 1;
    });

    res.json({
      period: {
        date_from: date_from,
        date_to: date_to
      },
      overtime_details: result.rows,
      employee_summary: Object.values(employeeSummary),
      totals: {
        total_overtime_hours: result.rows.reduce((sum, row) => sum + parseFloat(row.overtime_hours), 0),
        total_overtime_pay: result.rows.reduce((sum, row) => sum + parseFloat(row.overtime_pay), 0),
        employees_with_overtime: Object.keys(employeeSummary).length
      }
    });
  } catch (error) {
    console.error('Error generating overtime report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/timekeeping/current-status:
 *   get:
 *     summary: Get current employee status (who's clocked in)
 *     tags: [Timekeeping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current employee status
 */
router.get('/current-status', authMiddleware, async (req, res) => {
  try {
    const statusQuery = `
      SELECT 
        tce.employee_id,
        CONCAT(s.first_name, ' ', s.last_name) as employee_name,
        s.employee_id as employee_number,
        tce.department,
        tce.clock_in,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - tce.clock_in)) / 3600 as hours_worked,
        CASE 
          WHEN EXISTS(SELECT 1 FROM break_records br WHERE br.time_entry_id = tce.id AND br.break_end IS NULL) 
          THEN 'on_break' 
          ELSE 'working' 
        END as current_status
      FROM time_clock_entries tce
      JOIN staff s ON tce.employee_id = s.id
      WHERE tce.clock_out IS NULL
      ORDER BY tce.clock_in
    `;

    const result = await query(statusQuery);

    res.json({
      current_time: new Date().toISOString(),
      employees_clocked_in: result.rows,
      summary: {
        total_clocked_in: result.rows.length,
        on_break: result.rows.filter(emp => emp.current_status === 'on_break').length,
        working: result.rows.filter(emp => emp.current_status === 'working').length
      }
    });
  } catch (error) {
    console.error('Error fetching current status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;