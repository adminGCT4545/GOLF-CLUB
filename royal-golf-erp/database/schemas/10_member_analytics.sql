-- Member Analytics Database Schema
-- PostgreSQL 15+ with UUID support

-- ===============================================================
-- MEMBER ANALYTICS TABLES
-- ===============================================================

-- Member Visit Analytics Table
CREATE TABLE IF NOT EXISTS member_visit_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    visit_date DATE NOT NULL,
    visit_duration_minutes INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    green_fees_spent DECIMAL(10,2) DEFAULT 0,
    fnb_spent DECIMAL(10,2) DEFAULT 0,
    pro_shop_spent DECIMAL(10,2) DEFAULT 0,
    event_spent DECIMAL(10,2) DEFAULT 0,
    visit_type VARCHAR(50) DEFAULT 'golf', -- golf, dining, event, pro_shop
    services_used TEXT[],
    booking_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Member Spending Intelligence Table
CREATE TABLE IF NOT EXISTS member_spending_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_spent DECIMAL(12,2) DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    avg_spend_per_visit DECIMAL(10,2) DEFAULT 0,
    green_fees_total DECIMAL(10,2) DEFAULT 0,
    fnb_total DECIMAL(10,2) DEFAULT 0,
    pro_shop_total DECIMAL(10,2) DEFAULT 0,
    event_total DECIMAL(10,2) DEFAULT 0,
    spending_trend VARCHAR(20) DEFAULT 'stable', -- increasing, decreasing, stable
    member_value_segment VARCHAR(50) DEFAULT 'regular', -- high_value, regular, occasional, inactive
    engagement_score INTEGER DEFAULT 50, -- 0-100 scale
    retention_risk_score INTEGER DEFAULT 0, -- 0-100 scale, higher = more risk
    last_visit_date DATE,
    preferred_services TEXT[],
    spending_patterns JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, period_start, period_end)
);

-- Financial Access Constraints Table (for RBAC)
CREATE TABLE IF NOT EXISTS financial_access_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    access_level VARCHAR(20) DEFAULT 'restricted', -- full, limited, restricted
    department_restrictions TEXT[] DEFAULT '{}',
    amount_limit DECIMAL(12,2) DEFAULT 1000,
    date_range_limit INTEGER DEFAULT 30, -- days
    can_view_member_details BOOLEAN DEFAULT false,
    can_export_data BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI Dashboard Metrics Table
CREATE TABLE IF NOT EXISTS kpi_dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL, -- revenue, members, engagement, retention
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_date DATE NOT NULL,
    department VARCHAR(50),
    calculation_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Period Summary Table
CREATE TABLE IF NOT EXISTS financial_period_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    net_profit DECIMAL(15,2) DEFAULT 0,
    member_revenue DECIMAL(15,2) DEFAULT 0,
    green_fee_revenue DECIMAL(15,2) DEFAULT 0,
    fnb_revenue DECIMAL(15,2) DEFAULT 0,
    pro_shop_revenue DECIMAL(15,2) DEFAULT 0,
    active_members_count INTEGER DEFAULT 0,
    new_members_count INTEGER DEFAULT 0,
    churned_members_count INTEGER DEFAULT 0,
    avg_spend_per_member DECIMAL(10,2) DEFAULT 0,
    member_retention_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- MOCK REVENUE TRACKING TABLES (for analytics)
-- ===============================================================

-- Green Fee Transactions Table
CREATE TABLE IF NOT EXISTS green_fee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    transaction_date DATE NOT NULL,
    round_type VARCHAR(50) DEFAULT '18_holes', -- 18_holes, 9_holes, practice
    total_amount DECIMAL(10,2) NOT NULL,
    cart_fee DECIMAL(8,2) DEFAULT 0,
    guest_count INTEGER DEFAULT 0,
    course_id UUID REFERENCES courses(id),
    weather_conditions VARCHAR(100),
    booking_id UUID REFERENCES bookings(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membership Revenue Table
CREATE TABLE IF NOT EXISTS membership_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    payment_date DATE NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- monthly_dues, initiation_fee, annual_fee
    amount DECIMAL(10,2) NOT NULL,
    membership_tier_id UUID REFERENCES membership_tiers(id),
    payment_method VARCHAR(50) DEFAULT 'auto_charge',
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- F&B Revenue Tracking Table
CREATE TABLE IF NOT EXISTS fnb_revenue_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    transaction_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    location VARCHAR(100) DEFAULT 'clubhouse', -- clubhouse, pro_shop, cart_service
    order_type VARCHAR(50) DEFAULT 'dine_in', -- dine_in, takeout, catering
    items_ordered JSONB,
    tip_amount DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pro Shop Revenue Tracking Table
CREATE TABLE IF NOT EXISTS pro_shop_revenue_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    transaction_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    items_purchased JSONB,
    discount_applied DECIMAL(8,2) DEFAULT 0,
    staff_member_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- EXPENSE TRACKING TABLES (for ERP analytics)
-- ===============================================================

-- Maintenance Expenses Table
CREATE TABLE IF NOT EXISTS maintenance_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- course, equipment, facility, landscaping
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    vendor_name VARCHAR(200),
    department VARCHAR(50) DEFAULT 'maintenance',
    approval_status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Utility Expenses Table
CREATE TABLE IF NOT EXISTS utility_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    utility_type VARCHAR(50) NOT NULL, -- electricity, water, gas, internet, phone
    total_amount DECIMAL(10,2) NOT NULL,
    usage_amount DECIMAL(15,3),
    usage_unit VARCHAR(20), -- kwh, gallons, therms, etc.
    provider_name VARCHAR(200),
    account_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departmental Payroll Table
CREATE TABLE IF NOT EXISTS departmental_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    department VARCHAR(100) NOT NULL,
    employee_count INTEGER NOT NULL,
    gross_pay DECIMAL(12,2) NOT NULL,
    benefits_cost DECIMAL(10,2) DEFAULT 0,
    taxes_withheld DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- VIEWS FOR ANALYTICS
-- ===============================================================

-- Member Spending Summary View
CREATE OR REPLACE VIEW member_spending_summary AS
SELECT 
    m.id as member_id,
    m.first_name || ' ' || m.last_name as member_name,
    m.member_number,
    mt.name as membership_tier,
    m.join_date,
    m.status,
    COALESCE(SUM(gft.total_amount), 0) as green_fees_total,
    COALESCE(SUM(frt.total_amount), 0) as fnb_total,
    COALESCE(SUM(prt.total_amount), 0) as pro_shop_total,
    COALESCE(SUM(ft.amount), 0) as other_charges,
    COALESCE(SUM(gft.total_amount), 0) + 
    COALESCE(SUM(frt.total_amount), 0) + 
    COALESCE(SUM(prt.total_amount), 0) + 
    COALESCE(SUM(ft.amount), 0) as total_spent,
    COUNT(DISTINCT gft.transaction_date) + 
    COUNT(DISTINCT frt.transaction_date) + 
    COUNT(DISTINCT prt.transaction_date) as visit_count,
    MAX(GREATEST(
        COALESCE(gft.transaction_date, '1900-01-01'::date),
        COALESCE(frt.transaction_date, '1900-01-01'::date),
        COALESCE(prt.transaction_date, '1900-01-01'::date)
    )) as last_visit_date
FROM members m
LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
LEFT JOIN green_fee_transactions gft ON m.id = gft.member_id 
    AND gft.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN fnb_revenue_tracking frt ON m.id = frt.member_id 
    AND frt.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN pro_shop_revenue_tracking prt ON m.id = prt.member_id 
    AND prt.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN financial_transactions ft ON m.id = ft.member_id 
    AND ft.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
    AND ft.status = 'completed'
WHERE m.status = 'active'
GROUP BY m.id, m.first_name, m.last_name, m.member_number, mt.name, m.join_date, m.status;

-- Monthly Revenue Summary View
CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    'green_fees' as revenue_stream,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction
FROM green_fee_transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', transaction_date)

UNION ALL

SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    'fnb' as revenue_stream,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction
FROM fnb_revenue_tracking
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', transaction_date)

UNION ALL

SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    'pro_shop' as revenue_stream,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction
FROM pro_shop_revenue_tracking
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', transaction_date)

UNION ALL

SELECT 
    DATE_TRUNC('month', payment_date) as month,
    'membership' as revenue_stream,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_transaction
FROM membership_revenue
WHERE payment_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', payment_date);

-- ===============================================================
-- INDEXES FOR PERFORMANCE
-- ===============================================================

CREATE INDEX idx_member_visit_analytics_member_date ON member_visit_analytics(member_id, visit_date);
CREATE INDEX idx_member_visit_analytics_date ON member_visit_analytics(visit_date);
CREATE INDEX idx_member_spending_intelligence_member_period ON member_spending_intelligence(member_id, period_start, period_end);
CREATE INDEX idx_green_fee_transactions_member_date ON green_fee_transactions(member_id, transaction_date);
CREATE INDEX idx_green_fee_transactions_date ON green_fee_transactions(transaction_date);
CREATE INDEX idx_membership_revenue_member_date ON membership_revenue(member_id, payment_date);
CREATE INDEX idx_membership_revenue_date ON membership_revenue(payment_date);
CREATE INDEX idx_fnb_revenue_tracking_member_date ON fnb_revenue_tracking(member_id, transaction_date);
CREATE INDEX idx_fnb_revenue_tracking_date ON fnb_revenue_tracking(transaction_date);
CREATE INDEX idx_pro_shop_revenue_tracking_member_date ON pro_shop_revenue_tracking(member_id, transaction_date);
CREATE INDEX idx_pro_shop_revenue_tracking_date ON pro_shop_revenue_tracking(transaction_date);
CREATE INDEX idx_kpi_dashboard_metrics_type_date ON kpi_dashboard_metrics(metric_type, metric_date);
CREATE INDEX idx_financial_period_summary_period ON financial_period_summary(period_start, period_end);

-- ===============================================================
-- TRIGGERS FOR UPDATED_AT
-- ===============================================================

CREATE TRIGGER update_member_visit_analytics_updated_at BEFORE UPDATE ON member_visit_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_spending_intelligence_updated_at BEFORE UPDATE ON member_spending_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_access_constraints_updated_at BEFORE UPDATE ON financial_access_constraints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================================
-- SAMPLE DATA INSERTION
-- ===============================================================

-- Insert sample membership tiers if they don't exist
INSERT INTO membership_tiers (name, description, monthly_dues, initiation_fee, benefits, max_guests, booking_priority)
VALUES 
    ('Premium', 'Premium membership with full access', 350.00, 5000.00, '{"unlimited_golf": true, "guest_privileges": 4, "dining_discounts": 0.15}', 4, 1),
    ('Regular', 'Regular membership with standard access', 250.00, 2500.00, '{"monthly_rounds": 20, "guest_privileges": 2, "dining_discounts": 0.10}', 2, 2),
    ('Basic', 'Basic membership with limited access', 150.00, 1000.00, '{"monthly_rounds": 10, "guest_privileges": 1, "dining_discounts": 0.05}', 1, 3),
    ('Social', 'Social membership for dining and events only', 75.00, 500.00, '{"dining_access": true, "event_access": true, "golf_access": false}', 1, 4)
ON CONFLICT (name) DO NOTHING;

-- Insert sample financial access constraints for admin users
INSERT INTO financial_access_constraints (user_id, access_level, amount_limit, date_range_limit, can_view_member_details, can_export_data)
SELECT 
    gen_random_uuid(),
    'full',
    999999.99,
    365,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM financial_access_constraints);

-- Insert sample KPI metrics
INSERT INTO kpi_dashboard_metrics (metric_type, metric_name, metric_value, metric_date, department)
VALUES 
    ('revenue', 'Total Monthly Revenue', 125750.00, CURRENT_DATE, 'all'),
    ('revenue', 'Green Fee Revenue', 45000.00, CURRENT_DATE, 'golf'),
    ('revenue', 'F&B Revenue', 32500.00, CURRENT_DATE, 'fnb'),
    ('revenue', 'Pro Shop Revenue', 18250.00, CURRENT_DATE, 'pro_shop'),
    ('revenue', 'Membership Revenue', 30000.00, CURRENT_DATE, 'membership'),
    ('members', 'Active Members', 1180.00, CURRENT_DATE, 'all'),
    ('members', 'New Members This Month', 15.00, CURRENT_DATE, 'all'),
    ('members', 'Member Retention Rate', 94.4, CURRENT_DATE, 'all'),
    ('engagement', 'Avg Visits Per Member', 8.3, CURRENT_DATE, 'all'),
    ('engagement', 'Member Satisfaction Score', 87.5, CURRENT_DATE, 'all')
ON CONFLICT DO NOTHING;
