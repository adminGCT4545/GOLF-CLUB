-- Royal Golf Club - ERP Financial Integration Schema
-- Comprehensive financial management system extension
-- Follows the COMPREHENSIVE_ERP_INTEGRATION_PLAN.md

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================================================
-- PHASE 1: REVENUE MANAGEMENT TABLES
-- ===============================================================

-- Green Fee Revenue Tracking
CREATE TABLE green_fee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    transaction_date TIMESTAMP NOT NULL,
    round_type VARCHAR(50) NOT NULL, -- 18-hole, 9-hole, twilight
    green_fee_amount DECIMAL(10,2) NOT NULL,
    cart_rental_amount DECIMAL(10,2) DEFAULT 0,
    guest_fees DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    weather_conditions VARCHAR(100),
    tee_time TIME,
    booking_id UUID REFERENCES bookings(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- F&B Revenue Integration (extends existing)
CREATE TABLE fnb_revenue_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    order_id UUID REFERENCES orders(id), -- Reference to existing order system
    transaction_date TIMESTAMP NOT NULL,
    location VARCHAR(50) NOT NULL, -- restaurant, bar, banquet, catering
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    cost_of_goods DECIMAL(10,2),
    gross_margin DECIMAL(10,2),
    server_id UUID REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pro Shop Revenue Integration
CREATE TABLE pro_shop_revenue_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    order_id UUID REFERENCES orders(id), -- Reference to existing order system
    transaction_date TIMESTAMP NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    cost_of_goods DECIMAL(10,2),
    gross_margin DECIMAL(10,2),
    staff_id UUID REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membership Revenue Tracking
CREATE TABLE membership_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- dues, initiation, guest_fees, cart_fees
    amount DECIMAL(10,2) NOT NULL,
    period_start DATE,
    period_end DATE,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'completed',
    transaction_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- PHASE 2: EXPENSE MANAGEMENT TABLES
-- ===============================================================

-- Vendors Table (supporting table for expenses)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name VARCHAR(200) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL, -- supplier, contractor, utility, service
    contact_info JSONB,
    payment_terms VARCHAR(50),
    tax_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course Maintenance Expenses
CREATE TABLE maintenance_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- equipment, chemicals, irrigation, labor
    subcategory VARCHAR(100),
    vendor_id UUID REFERENCES vendors(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    cost_center VARCHAR(50) NOT NULL,
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES staff(id),
    approved_at TIMESTAMP,
    invoice_number VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Utility Expense Tracking
CREATE TABLE utility_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    utility_type VARCHAR(50) NOT NULL, -- water, electricity, gas, waste, internet
    usage_amount DECIMAL(10,2),
    usage_unit VARCHAR(20),
    cost_per_unit DECIMAL(10,4),
    total_amount DECIMAL(10,2) NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    meter_reading_start DECIMAL(10,2),
    meter_reading_end DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Integration (extends existing HR)
CREATE TABLE departmental_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES staff(id) NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    cost_center VARCHAR(50),
    regular_hours DECIMAL(5,2) NOT NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    regular_rate DECIMAL(8,2) NOT NULL,
    overtime_rate DECIMAL(8,2),
    gross_pay DECIMAL(10,2) NOT NULL,
    taxes DECIMAL(10,2) NOT NULL,
    benefits DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL,
    allocation_percentage DECIMAL(5,2) DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- PHASE 3: MEMBER ANALYTICS TABLES
-- ===============================================================

-- Member Visit Analytics
CREATE TABLE member_visit_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) NOT NULL,
    visit_date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    activities JSONB NOT NULL, -- golf, dining, pro_shop, events
    total_spent DECIMAL(10,2) DEFAULT 0,
    golf_spend DECIMAL(10,2) DEFAULT 0,
    fnb_spend DECIMAL(10,2) DEFAULT 0,
    pro_shop_spend DECIMAL(10,2) DEFAULT 0,
    weather_conditions VARCHAR(100),
    visit_duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Member Spending Intelligence
CREATE TABLE member_spending_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) NOT NULL,
    analysis_period VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_spent DECIMAL(10,2) NOT NULL,
    avg_spend_per_visit DECIMAL(10,2),
    visit_frequency INTEGER,
    golf_spend_percentage DECIMAL(5,2),
    fnb_spend_percentage DECIMAL(5,2),
    pro_shop_spend_percentage DECIMAL(5,2),
    preferred_activities JSONB,
    spending_trend VARCHAR(20), -- increasing, decreasing, stable
    retention_risk_score DECIMAL(3,2),
    ltv_prediction DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Member Lifecycle Tracking
CREATE TABLE member_lifecycle_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) NOT NULL,
    lifecycle_stage VARCHAR(50) NOT NULL, -- prospect, new, active, at_risk, churned
    stage_date DATE NOT NULL,
    previous_stage VARCHAR(50),
    retention_score DECIMAL(3,2),
    engagement_score DECIMAL(3,2),
    satisfaction_score DECIMAL(3,2),
    factors JSONB, -- Factors influencing stage change
    automated_flags JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- KPI AGGREGATION TABLES
-- ===============================================================

-- Real-time KPI Dashboard Data
CREATE TABLE kpi_dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL, -- revenue, expense, member_engagement
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_date DATE NOT NULL,
    department VARCHAR(50),
    calculation_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Summary by Period
CREATE TABLE financial_period_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue DECIMAL(12,2) NOT NULL,
    total_expenses DECIMAL(12,2) NOT NULL,
    net_income DECIMAL(12,2) NOT NULL,
    revenue_breakdown JSONB, -- by department/stream
    expense_breakdown JSONB, -- by category
    member_metrics JSONB, -- engagement stats
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- RBAC INTEGRATION FOR FINANCIAL DATA
-- ===============================================================

-- Financial Access Permissions (extends existing RBAC)
-- These would be added to the existing permissions table in sample data

-- Add financial permission constraints for RBAC
CREATE TABLE financial_access_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References RBAC users table
    access_level VARCHAR(50) NOT NULL, -- full, departmental, read_only, restricted
    department_restrictions TEXT[], -- Departments user can access
    amount_limit DECIMAL(10,2), -- Maximum transaction amount viewable
    date_range_limit INTEGER, -- Days back user can view
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- INDEXES FOR PERFORMANCE
-- ===============================================================

-- Revenue tracking indexes
CREATE INDEX idx_green_fee_transactions_member_date ON green_fee_transactions(member_id, transaction_date);
CREATE INDEX idx_green_fee_transactions_date ON green_fee_transactions(transaction_date);
CREATE INDEX idx_fnb_revenue_tracking_member_date ON fnb_revenue_tracking(member_id, transaction_date);
CREATE INDEX idx_fnb_revenue_tracking_location_date ON fnb_revenue_tracking(location, transaction_date);
CREATE INDEX idx_pro_shop_revenue_tracking_member_date ON pro_shop_revenue_tracking(member_id, transaction_date);
CREATE INDEX idx_membership_revenue_member_payment ON membership_revenue(member_id, payment_date);

-- Expense tracking indexes
CREATE INDEX idx_maintenance_expenses_date_category ON maintenance_expenses(expense_date, category);
CREATE INDEX idx_maintenance_expenses_vendor ON maintenance_expenses(vendor_id);
CREATE INDEX idx_utility_expenses_type_period ON utility_expenses(utility_type, billing_period_start);
CREATE INDEX idx_departmental_payroll_employee_period ON departmental_payroll(employee_id, pay_period_start);

-- Member analytics indexes
CREATE INDEX idx_member_visit_analytics_member_date ON member_visit_analytics(member_id, visit_date);
CREATE INDEX idx_member_spending_intelligence_member_period ON member_spending_intelligence(member_id, period_start);
CREATE INDEX idx_member_lifecycle_tracking_member_stage ON member_lifecycle_tracking(member_id, lifecycle_stage);

-- KPI indexes
CREATE INDEX idx_kpi_dashboard_metrics_type_date ON kpi_dashboard_metrics(metric_type, metric_date);
CREATE INDEX idx_financial_period_summary_period ON financial_period_summary(period_type, period_start);

-- ===============================================================
-- TRIGGERS FOR AUTOMATIC CALCULATIONS
-- ===============================================================

-- Update gross margin calculation for F&B revenue
CREATE OR REPLACE FUNCTION calculate_fnb_gross_margin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cost_of_goods IS NOT NULL THEN
        NEW.gross_margin = NEW.subtotal - NEW.cost_of_goods;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fnb_gross_margin
    BEFORE INSERT OR UPDATE ON fnb_revenue_tracking
    FOR EACH ROW EXECUTE FUNCTION calculate_fnb_gross_margin();

-- Update gross margin calculation for Pro Shop revenue
CREATE OR REPLACE FUNCTION calculate_proshop_gross_margin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cost_of_goods IS NOT NULL THEN
        NEW.gross_margin = NEW.subtotal - NEW.cost_of_goods;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proshop_gross_margin
    BEFORE INSERT OR UPDATE ON pro_shop_revenue_tracking
    FOR EACH ROW EXECUTE FUNCTION calculate_proshop_gross_margin();

-- Update timestamps for ERP tables
CREATE TRIGGER update_green_fee_transactions_updated_at 
    BEFORE UPDATE ON green_fee_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================================
-- VIEWS FOR COMMON FINANCIAL REPORTS
-- ===============================================================

-- Revenue Summary View
CREATE VIEW v_revenue_summary AS
SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    'green_fees' as revenue_stream,
    SUM(total_amount) as total_amount,
    COUNT(*) as transaction_count,
    AVG(total_amount) as avg_transaction
FROM green_fee_transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', transaction_date)

UNION ALL

SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    'fnb' as revenue_stream,
    SUM(total_amount) as total_amount,
    COUNT(*) as transaction_count,
    AVG(total_amount) as avg_transaction
FROM fnb_revenue_tracking
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', transaction_date)

UNION ALL

SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    'pro_shop' as revenue_stream,
    SUM(total_amount) as total_amount,
    COUNT(*) as transaction_count,
    AVG(total_amount) as avg_transaction
FROM pro_shop_revenue_tracking
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', transaction_date)

UNION ALL

SELECT 
    DATE_TRUNC('month', payment_date) as month,
    'membership' as revenue_stream,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count,
    AVG(amount) as avg_transaction
FROM membership_revenue
WHERE payment_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', payment_date);

-- Member Performance View
CREATE VIEW v_member_performance AS
SELECT 
    m.id,
    m.member_number,
    m.first_name || ' ' || m.last_name as member_name,
    mt.name as membership_tier,
    COALESCE(SUM(gft.total_amount), 0) as golf_spend,
    COALESCE(SUM(fnb.total_amount), 0) as fnb_spend,
    COALESCE(SUM(ps.total_amount), 0) as proshop_spend,
    COALESCE(SUM(mr.amount), 0) as membership_payments,
    COALESCE(COUNT(DISTINCT mva.visit_date), 0) as visit_count,
    COALESCE(AVG(mva.total_spent), 0) as avg_visit_spend
FROM members m
JOIN membership_tiers mt ON m.membership_tier_id = mt.id
LEFT JOIN green_fee_transactions gft ON m.id = gft.member_id 
    AND gft.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
LEFT JOIN fnb_revenue_tracking fnb ON m.id = fnb.member_id 
    AND fnb.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
LEFT JOIN pro_shop_revenue_tracking ps ON m.id = ps.member_id 
    AND ps.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
LEFT JOIN membership_revenue mr ON m.id = mr.member_id 
    AND mr.payment_date >= CURRENT_DATE - INTERVAL '12 months'
LEFT JOIN member_visit_analytics mva ON m.id = mva.member_id 
    AND mva.visit_date >= CURRENT_DATE - INTERVAL '12 months'
WHERE m.status = 'active'
GROUP BY m.id, m.member_number, m.first_name, m.last_name, mt.name;