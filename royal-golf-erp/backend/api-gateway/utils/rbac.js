const { query } = require('../config/database');

/**
 * RBAC Utility Functions
 * Provides helper functions for role-based access control
 */

/**
 * Check if user has a specific permission
 * @param {number} userId - User ID
 * @param {string} permission - Permission name to check
 * @returns {Promise<boolean|object>} - True if has permission, object with constraints if applicable
 */
async function checkUserPermission(userId, permission) {
  try {
    const result = await query(`
      SELECT DISTINCT p.permission_name, rp.constraints
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1 AND p.permission_name = $2 AND u.is_active = TRUE
    `, [userId, permission]);

    if (result.rows.length === 0) {
      return false;
    }

    const row = result.rows[0];
    return row.constraints || true;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Get all user roles
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of user roles
 */
async function getUserRoles(userId) {
  try {
    const result = await query(`
      SELECT r.role_name, r.role_category, r.description
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = $1 AND u.is_active = TRUE
    `, [userId]);

    return result.rows;
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

/**
 * Get all user permissions with constraints
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Object with permissions as keys and constraints as values
 */
async function getUserPermissions(userId) {
  try {
    const result = await query(`
      SELECT DISTINCT p.permission_name, p.description, p.module, rp.constraints
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1 AND u.is_active = TRUE
      ORDER BY p.module, p.permission_name
    `, [userId]);

    const permissions = {};
    result.rows.forEach(row => {
      permissions[row.permission_name] = {
        description: row.description,
        module: row.module,
        constraints: row.constraints || true
      };
    });

    return permissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {};
  }
}

/**
 * Check if user has any of the specified roles
 * @param {number} userId - User ID
 * @param {string[]} roles - Array of role names to check
 * @returns {Promise<boolean>} - True if user has any of the roles
 */
async function userHasAnyRole(userId, roles) {
  try {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = $1 AND r.role_name = ANY($2) AND u.is_active = TRUE
    `, [userId, roles]);

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error checking user roles:', error);
    return false;
  }
}

/**
 * Check if user belongs to any of the specified role categories
 * @param {number} userId - User ID
 * @param {string[]} categories - Array of role categories to check
 * @returns {Promise<boolean>} - True if user belongs to any of the categories
 */
async function userHasAnyRoleCategory(userId, categories) {
  try {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = $1 AND r.role_category = ANY($2) AND u.is_active = TRUE
    `, [userId, categories]);

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error checking user role categories:', error);
    return false;
  }
}

/**
 * Log user action in audit trail
 * @param {number} userId - User ID
 * @param {string} action - Action performed
 * @param {string} resource - Resource accessed
 * @param {string} result - Result of the action
 * @param {string} ipAddress - IP address
 * @param {object} additionalData - Additional data to log
 */
async function logUserAction(userId, action, resource, result, ipAddress, additionalData = {}) {
  try {
    await query(`
      INSERT INTO rbac_audit_log (user_id, action, resource, result, ip_address, additional_data)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, action, resource, result, ipAddress, JSON.stringify(additionalData)]);
  } catch (error) {
    console.error('Error logging user action:', error);
  }
}

/**
 * Check refund permission with amount constraint
 * @param {number} userId - User ID
 * @param {number} amount - Refund amount to check
 * @returns {Promise<{allowed: boolean, maxAmount?: number}>} - Refund permission status
 */
async function checkRefundPermission(userId, amount) {
  try {
    // Check for unlimited refund permission first
    const unlimitedResult = await query(`
      SELECT 1 FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1 AND p.permission_name = 'pos_refund_unlimited' AND u.is_active = TRUE
    `, [userId]);

    if (unlimitedResult.rows.length > 0) {
      return { allowed: true };
    }

    // Check for limited refund permissions
    const limitedResult = await query(`
      SELECT p.permission_name, rp.constraints
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1 AND p.permission_name LIKE 'pos_refund_%' AND u.is_active = TRUE
      ORDER BY rp.constraints->'max_amount' DESC NULLS LAST
    `, [userId]);

    for (const row of limitedResult.rows) {
      const maxAmount = row.constraints?.max_amount;
      if (maxAmount && amount <= maxAmount) {
        return { allowed: true, maxAmount };
      }
    }

    return { allowed: false };
  } catch (error) {
    console.error('Error checking refund permission:', error);
    return { allowed: false };
  }
}

module.exports = {
  checkUserPermission,
  getUserRoles,
  getUserPermissions,
  userHasAnyRole,
  userHasAnyRoleCategory,
  logUserAction,
  checkRefundPermission
};
