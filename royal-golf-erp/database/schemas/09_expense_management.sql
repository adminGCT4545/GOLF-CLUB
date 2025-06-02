-- Royal Golf Club - Expense Management System Schema
-- Comprehensive expense reporting, tracking, and management system
-- Supports automated workflows, receipt management, and compliance

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================================================
-- EXPENSE MANAGEMENT CORE TABLES
-- ===============================================================

-- Expense Categories
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_receipt BOOLEAN DEFAULT true,
    max_amount_limit DECIMAL(10,2),
    approval_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Expense Policies
CREATE TABLE expense_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(100) NOT NULL,
    max_amount_without_approval DECIMAL(10,2) DEFAULT 500.00,
    receipt_required_threshold DECIMAL(10,2) DEFAULT 25.00,
    approval_workflow VARCHAR(50) DEFAULT 'department_head',
    reimbursement_timeline_days INTEGER DEFAULT 14,
    allowed_categories TEXT[], -- Array of allowed category names
    currency VARCHAR(3) DEFAULT 'USD',
    active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    notes TEXT
);

-- Main Expense Reports Table
CREATE TABLE expense_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
    receipt_url TEXT,
    receipt_filename VARCHAR(255),
    receipt_filesize INTEGER,
    submitted_by UUID NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    rejection_reason TEXT,
    reimbursed_at TIMESTAMP,
    reimbursed_by UUID REFERENCES users(id),
    reimbursement_method VARCHAR(50),
    reimbursement_reference VARCHAR(100),
    
    -- Policy compliance fields
    policy_compliant BOOLEAN DEFAULT true,
    policy_violations TEXT[],
    auto_approved BOOLEAN DEFAULT false,
    
    -- Financial integration
    accounting_code VARCHAR(50),
    cost_center VARCHAR(50),
    budget_line_item VARCHAR(100),
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Audit Log
CREATE TABLE expense_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- SUBMITTED, APPROVED, REJECTED, MODIFIED, REIMBURSED
    performed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    old_values JSONB, -- Previous values for modifications
    new_values JSONB, -- New values for modifications
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipt Processing Log
CREATE TABLE expense_receipt_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
    original_filename VARCHAR(255),
    processed_filename VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processed, failed
    
    -- OCR Results
    ocr_extracted_amount DECIMAL(10,2),
    ocr_extracted_date DATE,
    ocr_extracted_vendor VARCHAR(200),
    ocr_confidence_score DECIMAL(3,2),
    ocr_raw_text TEXT,
    
    -- Processing metadata
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    processing_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Approval Workflows
CREATE TABLE expense_approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
    workflow_step INTEGER NOT NULL DEFAULT 1,
    approver_id UUID NOT NULL REFERENCES users(id),
    approver_role VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, skipped
    approved_at TIMESTAMP,
    notes TEXT,
    is_final_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Templates (for recurring expenses)
CREATE TABLE expense_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    default_amount DECIMAL(10,2),
    recurrence_pattern VARCHAR(50), -- monthly, quarterly, yearly, custom
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Budget Tracking
CREATE TABLE expense_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    category VARCHAR(100),
    budget_period VARCHAR(20), -- monthly, quarterly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    allocated_amount DECIMAL(12,2) NOT NULL,
    spent_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2),
    warning_threshold DECIMAL(5,2) DEFAULT 80.00, -- Percentage
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- INDEXES FOR PERFORMANCE
-- ===============================================================

-- Primary lookup indexes
CREATE INDEX idx_expense_reports_submitted_by_date ON expense_reports(submitted_by, expense_date DESC);
CREATE INDEX idx_expense_reports_status_date ON expense_reports(status, expense_date DESC);
CREATE INDEX idx_expense_reports_category_date ON expense_reports(category, expense_date DESC);
CREATE INDEX idx_expense_reports_amount ON expense_reports(amount);
CREATE INDEX idx_expense_reports_submitted_at ON expense_reports(submitted_at DESC);

-- Audit trail indexes
CREATE INDEX idx_expense_audit_log_expense_id ON expense_audit_log(expense_id, created_at DESC);
CREATE INDEX idx_expense_audit_log_performed_by ON expense_audit_log(performed_by, created_at DESC);
CREATE INDEX idx_expense_audit_log_action ON expense_audit_log(action, created_at DESC);

-- Workflow indexes
CREATE INDEX idx_expense_approval_workflows_expense_id ON expense_approval_workflows(expense_id, workflow_step);
CREATE INDEX idx_expense_approval_workflows_approver ON expense_approval_workflows(approver_id, status);

-- Budget tracking indexes
CREATE INDEX idx_expense_budgets_period ON expense_budgets(period_start, period_end);
CREATE INDEX idx_expense_budgets_department ON expense_budgets(department, period_start);

-- Full-text search indexes
CREATE INDEX idx_expense_reports_search ON expense_reports USING gin(to_tsvector('english', title || ' ' || description));

-- ===============================================================
-- TRIGGERS AND FUNCTIONS
-- ===============================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expense_reports_updated_at 
    BEFORE UPDATE ON expense_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at 
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_templates_updated_at 
    BEFORE UPDATE ON expense_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_budgets_updated_at 
    BEFORE UPDATE ON expense_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger
CREATE OR REPLACE FUNCTION create_expense_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the change
    INSERT INTO expense_audit_log (
        expense_id, 
        action, 
        performed_by, 
        old_values, 
        new_values,
        notes
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'CREATED'
            WHEN TG_OP = 'UPDATE' THEN 'MODIFIED'
            WHEN TG_OP = 'DELETE' THEN 'DELETED'
        END,
        COALESCE(NEW.submitted_by, OLD.submitted_by),
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
        CASE 
            WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 
                'Status changed from ' || OLD.status || ' to ' || NEW.status
            ELSE NULL
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_reports_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expense_reports
    FOR EACH ROW EXECUTE FUNCTION create_expense_audit_log();

-- Budget tracking update function
CREATE OR REPLACE FUNCTION update_expense_budget()
RETURNS TRIGGER AS $$
DECLARE
    budget_record expense_budgets%ROWTYPE;
BEGIN
    -- Find applicable budget
    SELECT * INTO budget_record
    FROM expense_budgets 
    WHERE (department IS NULL OR department = (
        SELECT department FROM users WHERE id = NEW.submitted_by
    ))
    AND (category IS NULL OR category = NEW.category)
    AND NEW.expense_date BETWEEN period_start AND period_end
    LIMIT 1;
    
    -- Update budget if found and expense is approved
    IF FOUND AND NEW.status = 'approved' THEN
        UPDATE expense_budgets 
        SET 
            spent_amount = spent_amount + NEW.amount,
            remaining_amount = allocated_amount - (spent_amount + NEW.amount),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = budget_record.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_on_approval
    AFTER UPDATE OF status ON expense_reports
    FOR EACH ROW 
    WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
    EXECUTE FUNCTION update_expense_budget();

-- Policy compliance check function
CREATE OR REPLACE FUNCTION check_expense_policy_compliance()
RETURNS TRIGGER AS $$
DECLARE
    policy_record expense_policies%ROWTYPE;
    violations TEXT[] := '{}';
    category_record expense_categories%ROWTYPE;
BEGIN
    -- Get active policy
    SELECT * INTO policy_record
    FROM expense_policies 
    WHERE active = true 
    ORDER BY effective_date DESC 
    LIMIT 1;
    
    -- Get category details
    SELECT * INTO category_record
    FROM expense_categories 
    WHERE name = NEW.category AND is_active = true;
    
    -- Check policy violations
    IF FOUND THEN
        -- Check amount limits
        IF NEW.amount > policy_record.max_amount_without_approval THEN
            violations := violations || 'Amount exceeds auto-approval limit';
        END IF;
        
        -- Check receipt requirement
        IF policy_record.receipt_required_threshold IS NOT NULL 
           AND NEW.amount >= policy_record.receipt_required_threshold 
           AND NEW.receipt_url IS NULL THEN
            violations := violations || 'Receipt required for this amount';
        END IF;
        
        -- Check category requirements
        IF category_record.requires_receipt AND NEW.receipt_url IS NULL THEN
            violations := violations || 'Receipt required for this category';
        END IF;
        
        -- Check category amount limits
        IF category_record.max_amount_limit IS NOT NULL 
           AND NEW.amount > category_record.max_amount_limit THEN
            violations := violations || 'Amount exceeds category limit';
        END IF;
    END IF;
    
    -- Update compliance fields
    NEW.policy_violations := violations;
    NEW.policy_compliant := (array_length(violations, 1) IS NULL);
    
    -- Auto-approve if compliant and under limit
    IF NEW.policy_compliant AND NEW.amount <= COALESCE(policy_record.max_amount_without_approval, 0) THEN
        NEW.auto_approved := true;
        NEW.status := 'approved';
        NEW.approved_at := CURRENT_TIMESTAMP;
        NEW.approved_by := NEW.submitted_by;
        NEW.approval_notes := 'Auto-approved based on company policy';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_policy_compliance
    BEFORE INSERT OR UPDATE ON expense_reports
    FOR EACH ROW EXECUTE FUNCTION check_expense_policy_compliance();

-- ===============================================================
-- VIEWS FOR REPORTING AND ANALYTICS
-- ===============================================================

-- Expense summary view
CREATE VIEW v_expense_summary AS
SELECT 
    DATE_TRUNC('month', expense_date) as expense_month,
    category,
    status,
    COUNT(*) as expense_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) as expenses_with_receipts,
    COUNT(CASE WHEN auto_approved THEN 1 END) as auto_approved_count
FROM expense_reports
WHERE expense_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', expense_date), category, status;

-- User expense analytics view
CREATE VIEW v_user_expense_analytics AS
SELECT 
    u.id as user_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.department,
    COUNT(er.id) as total_expenses,
    SUM(CASE WHEN er.status = 'approved' THEN er.amount ELSE 0 END) as approved_amount,
    SUM(CASE WHEN er.status = 'pending' THEN er.amount ELSE 0 END) as pending_amount,
    AVG(CASE WHEN er.status = 'approved' THEN er.amount END) as avg_approved_amount,
    COUNT(CASE WHEN er.receipt_url IS NOT NULL THEN 1 END) as expenses_with_receipts,
    MAX(er.submitted_at) as last_expense_date
FROM users u
LEFT JOIN expense_reports er ON u.id = er.submitted_by 
    AND er.expense_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY u.id, u.first_name, u.last_name, u.department;

-- Budget utilization view
CREATE VIEW v_budget_utilization AS
SELECT 
    eb.*,
    ROUND((spent_amount / allocated_amount * 100), 2) as utilization_percentage,
    CASE 
        WHEN (spent_amount / allocated_amount * 100) >= warning_threshold THEN 'warning'
        WHEN (spent_amount / allocated_amount * 100) >= 100 THEN 'exceeded'
        ELSE 'normal'
    END as budget_status,
    (allocated_amount - spent_amount) as remaining_budget
FROM expense_budgets eb
WHERE period_end >= CURRENT_DATE;

-- Compliance dashboard view
CREATE VIEW v_expense_compliance AS
SELECT 
    DATE_TRUNC('month', expense_date) as month,
    COUNT(*) as total_expenses,
    COUNT(CASE WHEN policy_compliant THEN 1 END) as compliant_expenses,
    COUNT(CASE WHEN NOT policy_compliant THEN 1 END) as non_compliant_expenses,
    ROUND(
        COUNT(CASE WHEN policy_compliant THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100, 
        2
    ) as compliance_rate,
    COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) as expenses_with_receipts,
    ROUND(
        COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100, 
        2
    ) as receipt_compliance_rate
FROM expense_reports
WHERE expense_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', expense_date)
ORDER BY month DESC;

-- ===============================================================
-- INITIAL DATA SETUP
-- ===============================================================

-- Insert default expense categories
INSERT INTO expense_categories (name, description, requires_receipt, max_amount_limit) VALUES
('Equipment', 'Golf and maintenance equipment purchases', true, 5000.00),
('Maintenance', 'Course and facility maintenance expenses', true, 2000.00),
('Office Supplies', 'General office and administrative supplies', false, 500.00),
('Marketing', 'Marketing and promotional expenses', true, 1000.00),
('Travel', 'Business travel and accommodation', true, 3000.00),
('Utilities', 'Utility bills and services', true, NULL),
('Professional Services', 'Legal, accounting, consulting services', true, NULL),
('Training', 'Employee training and development', true, 1500.00),
('Insurance', 'Insurance premiums and claims', true, NULL),
('Technology', 'Software, hardware, and IT services', true, 2500.00);

-- Insert default expense policy
INSERT INTO expense_policies (
    policy_name, 
    max_amount_without_approval, 
    receipt_required_threshold,
    approval_workflow,
    reimbursement_timeline_days,
    allowed_categories,
    notes
) VALUES (
    'Royal Golf Club Default Policy',
    500.00,
    25.00,
    'department_head',
    14,
    ARRAY['Equipment', 'Maintenance', 'Office Supplies', 'Marketing', 'Travel', 'Utilities', 'Professional Services', 'Training', 'Insurance', 'Technology'],
    'Standard expense policy for Royal Golf Club employees'
);

-- Add financial access constraints for admin users (if users table exists)
-- INSERT INTO financial_access_constraints (user_id, access_level, amount_limit, date_range_limit)
-- SELECT id, 'full', NULL, NULL FROM users WHERE role = 'admin';

-- Create sample budget for current year
INSERT INTO expense_budgets (
    budget_name,
    department,
    budget_period,
    period_start,
    period_end,
    allocated_amount,
    created_by
) VALUES 
('Annual Equipment Budget', 'Maintenance', 'yearly', DATE_TRUNC('year', CURRENT_DATE), DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day', 25000.00, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Annual Office Supplies Budget', 'Administration', 'yearly', DATE_TRUNC('year', CURRENT_DATE), DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day', 5000.00, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Annual Marketing Budget', 'Marketing', 'yearly', DATE_TRUNC('year', CURRENT_DATE), DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day', 15000.00, (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- ===============================================================
-- PERMISSIONS AND SECURITY
-- ===============================================================

-- Row Level Security policies can be added here based on the existing RBAC system
-- This would restrict users to only see their own expenses unless they have appropriate permissions

-- Example RLS policy (uncomment if RLS is enabled):
-- ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY expense_reports_user_policy ON expense_reports
--     USING (submitted_by = current_user_id() OR has_permission(current_user_id(), 'expense_approval'));

COMMENT ON TABLE expense_reports IS 'Main table for employee expense reports and reimbursement requests';
COMMENT ON TABLE expense_categories IS 'Categories for organizing and controlling expense types';
COMMENT ON TABLE expense_policies IS 'Company policies governing expense submission and approval';
COMMENT ON TABLE expense_audit_log IS 'Audit trail for all expense-related actions and changes';
COMMENT ON TABLE expense_approval_workflows IS 'Multi-step approval workflows for expense reports';
COMMENT ON TABLE expense_budgets IS 'Budget tracking and management for departments and categories';
