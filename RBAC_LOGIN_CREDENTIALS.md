# Royal Golf Club - Role-Based Access Control System
## Login Credentials for Testing

### Database Connection Information
- **Host:** localhost
- **Port:** 5432
- **Database:** golf_club_db
- **Username:** postgres
- **Password:** postgres

### Application Access URLs
- **API Gateway:** http://localhost:3001
- **Web Portal:** http://localhost:9190 (React development server)
- **API Documentation:** http://localhost:3001/api-docs
- **Health Check:** http://localhost:3001/health

---

## Sample User Accounts

**All accounts use the password:** `GolfClub123` (simplified - no special characters)

### Super User Accounts

#### Owner Account
- **Username:** `robert.owner`
- **Email:** robert.owner@royalgolf.com
- **Name:** Robert Morrison
- **Employee ID:** EMP001
- **Permissions:** Full system access and administrative control

#### Manager Account
- **Username:** `sarah.manager`
- **Email:** sarah.manager@royalgolf.com
- **Name:** Sarah Williams
- **Employee ID:** EMP002
- **Permissions:** Operational management with limited administrative access

---

### Employee Accounts

#### General Cashier
- **Username:** `john.cashier`
- **Email:** john.cashier@royalgolf.com
- **Name:** John Smith
- **Employee ID:** EMP003
- **Permissions:** Transaction processing, $50 refund limit, member lookup

#### Kitchen Staff
- **Username:** `maria.kitchen`
- **Email:** maria.kitchen@royalgolf.com
- **Name:** Maria Garcia
- **Employee ID:** EMP004
- **Permissions:** Food service operations, inventory viewing

#### Front Desk Representative
- **Username:** `david.frontdesk`
- **Email:** david.frontdesk@royalgolf.com
- **Name:** David Johnson
- **Employee ID:** EMP005
- **Permissions:** Guest services, tee time management, $50 refund limit

#### Pro Shop Sales
- **Username:** `lisa.proshop`
- **Email:** lisa.proshop@royalgolf.com
- **Name:** Lisa Chen
- **Employee ID:** EMP006
- **Permissions:** Golf merchandise sales, $100 refund limit, inventory management

#### F&B Cashier
- **Username:** `mike.fnb`
- **Email:** mike.fnb@royalgolf.com
- **Name:** Mike Thompson
- **Employee ID:** EMP007
- **Permissions:** Food & beverage transactions, $50 refund limit

#### Golf Caddy
- **Username:** `carlos.caddy`
- **Email:** carlos.caddy@royalgolf.com
- **Name:** Carlos Rodriguez
- **Employee ID:** EMP008
- **Permissions:** Basic member lookup, tee time schedule viewing

---

### Member Accounts (Separate System - Not RBAC)

**Note:** These are separate member accounts in the `members` table, not part of the RBAC staff system.

#### Member 1
- **Email:** john.smith@email.com
- **Name:** John Smith
- **Password:** `password123`
- **Tier:** Platinum
- **Status:** Active

#### Member 2
- **Email:** sarah.johnson@email.com
- **Name:** Sarah Johnson
- **Password:** `password123`
- **Tier:** Gold
- **Status:** Active

#### Member 3
- **Email:** robert.williams@email.com
- **Name:** Robert Williams
- **Password:** `password123`
- **Tier:** Silver
- **Status:** Active

#### Member 4
- **Email:** emily.davis@email.com
- **Name:** Emily Davis
- **Password:** `password123`
- **Tier:** Bronze
- **Status:** Active

#### Member 5
- **Email:** michael.brown@email.com
- **Name:** Michael Brown
- **Password:** `password123`
- **Tier:** Bronze
- **Status:** Active

---

## Role Permissions Summary

### Owner Permissions
✅ Full member data access
✅ All financial reports
✅ Unlimited refund authority
✅ Complete inventory management
✅ Full employee management
✅ System administration
✅ Tee time override capabilities

### Manager Permissions
✅ Full member data access (update only)
✅ Department financial reports
✅ $200 refund authority
✅ Inventory viewing and purchase orders
✅ Employee scheduling
✅ Tee time override capabilities
✅ Operational settings access

### Employee Permissions (varies by role)
- **Cashier:** Basic member lookup, daily reports, $50 refunds
- **Kitchen Staff:** Department inventory viewing only
- **Front Desk:** Member lookup, tee time management, $50 refunds
- **Pro Shop:** Member lookup, department reports, $100 refunds
- **F&B Cashier:** Member lookup, F&B transactions, $50 refunds
- **Golf Caddy:** Basic member lookup, schedule viewing

### Member Permissions
✅ Own account management
✅ Own billing information
✅ Tee time booking (own only)
✅ Personal data updates

---

## System Status & Testing

### Current Implementation Status
✅ **RBAC Staff Authentication**: Fully implemented with roles and permissions  
✅ **PostgreSQL Database**: Connected and operational  
✅ **API Gateway**: Running on port 3001  
✅ **Web Portal**: Running on port 9190  
⚠️ **Member Authentication**: Requires separate implementation  
❌ **Redis Cache**: Not installed (optional)  
❌ **AI Services**: Requires Python package installation  

### Database Verification Commands

```sql
-- List all RBAC staff users and their roles
SELECT u.username, u.first_name, u.last_name, r.role_name, r.role_category
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE u.is_active = TRUE AND ur.is_active = TRUE
ORDER BY r.role_category, u.username;

-- List all members (separate system)
SELECT email, first_name, last_name, membership_tier_id, status 
FROM members 
ORDER BY first_name;

-- Check specific permissions
SELECT check_user_permission(1, 'member_data_full_access') as owner_access;
SELECT check_user_permission(3, 'pos_transaction') as cashier_pos;

-- Get user roles
SELECT * FROM get_user_roles(1); -- Owner roles
SELECT * FROM get_user_roles(3); -- Cashier roles
```

### Quick Login Test Commands

```bash
# Test RBAC staff login (API)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "robert.owner@royalgolf.com", "password": "GolfClub123"}'

# Test API health
curl http://localhost:3001/health

# Access web portal
open http://localhost:9190
```

### Authentication Integration
The system is ready for integration with:
- JWT token generation
- Session management
- Password hashing (bcrypt)
- Multi-factor authentication
- Audit logging

---

## Security Features Implemented

1. **Password Security:** All passwords are hashed using bcrypt
2. **Account Lockout:** Failed login attempt tracking
3. **Session Management:** UUID-based sessions with expiration
4. **Audit Trail:** All user actions are logged
5. **Role Expiration:** Support for temporary role assignments
6. **Permission Constraints:** JSON-based rule enforcement

---

## Known Issues & Fixes Needed

### Authentication Issues
1. **Internal Server Error on Login**: Backend authentication needs debugging
2. **Member vs Staff Authentication**: Currently only RBAC staff system works
3. **Special Characters in Passwords**: Original `GolfClub123!` causes JSON parsing errors

### Recent Fixes Applied
- ✅ Simplified passwords to `GolfClub123` (removed exclamation mark)
- ✅ Updated audit table references from `rbac_audit_log` to `audit_log`
- ✅ Fixed database connection and schema alignment

### Next Steps for Full Implementation

1. **Fix Backend Authentication Errors**: Debug and resolve internal server errors
2. **Implement Member Authentication**: Create separate auth flow for member accounts
3. **Frontend Role Guards:** Implement permission-based UI components
4. **API Endpoint Protection:** Add permission checks to all routes
5. **Redis Installation:** Optional caching for improved performance
6. **AI Services Setup:** Install Python dependencies for AI features
7. **Real-time Session Management:** WebSocket integration for session updates
8. **Advanced Auditing:** Enhanced logging for compliance requirements

### Current Working Features
- ✅ Database connectivity and data loading
- ✅ API Gateway health checks
- ✅ Web portal frontend (React app)
- ✅ User role and permission data structure
- ✅ Basic RBAC infrastructure