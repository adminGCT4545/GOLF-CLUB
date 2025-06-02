-- Royal Golf Club ERP - POS Integration Schema
-- PostgreSQL 15+ with UUID support
-- Integration with existing schema from 01_init.sql

-- Enable additional extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create additional custom types for POS
CREATE TYPE transaction_type AS ENUM ('sale', 'refund', 'tab_payment', 'void');
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'member_account', 'gift_card');
CREATE TYPE tab_status AS ENUM ('open', 'closed', 'paid', 'cancelled');
CREATE TYPE terminal_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE movement_type AS ENUM ('sale', 'purchase', 'adjustment', 'waste', 'return', 'transfer');
CREATE TYPE shift_type AS ENUM ('regular', 'weekend', 'holiday', 'overtime');
CREATE TYPE time_entry_status AS ENUM ('pending', 'approved', 'rejected', 'modified');
CREATE TYPE break_type AS ENUM ('regular', 'lunch', 'sick', 'personal');

-- ==========================================
-- POS CORE TABLES
-- ==========================================

-- POS Terminals
CREATE TABLE pos_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_name VARCHAR(100) NOT NULL,
    terminal_code VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(100) NOT NULL, -- 'pro_shop', 'fnb', 'clubhouse', 'cart_barn'
    ip_address INET,
    mac_address VARCHAR(17),
    status terminal_status DEFAULT 'active',
    current_shift_id UUID,
    last_sync TIMESTAMP,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cash Drawer Shifts
CREATE TABLE cash_drawer_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID REFERENCES pos_terminals(id),
    staff_id UUID REFERENCES staff(id),
    shift_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shift_end TIMESTAMP,
    opening_cash DECIMAL(10,2) DEFAULT 0,
    closing_cash DECIMAL(10,2),
    expected_cash DECIMAL(10,2),
    cash_difference DECIMAL(10,2),
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_refunds DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    member_account_sales DECIMAL(12,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'reconciled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POS Transactions
CREATE TABLE pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    terminal_id UUID REFERENCES pos_terminals(id),
    shift_id UUID REFERENCES cash_drawer_shifts(id),
    member_id UUID REFERENCES members(id),
    staff_id UUID REFERENCES staff(id),
    transaction_type transaction_type NOT NULL,
    original_transaction_id UUID REFERENCES pos_transactions(id), -- For refunds/voids
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0.0875, -- 8.75% default tax rate
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tip_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_reference VARCHAR(100),
    sale_type VARCHAR(50) NOT NULL, -- 'proshop', 'fnb', 'mixed'
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    change_amount DECIMAL(10,2) DEFAULT 0,
    receipt_printed BOOLEAN DEFAULT false,
    voided BOOLEAN DEFAULT false,
    voided_by UUID REFERENCES staff(id),
    voided_reason TEXT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POS Sale Items Table
CREATE TABLE pos_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES pos_sales(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Movements Table
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) NOT NULL,
    movement_type inventory_movement_type NOT NULL,
    quantity_change INTEGER NOT NULL, -- positive for additions, negative for subtractions
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_id UUID, -- could reference pos_sales.id, invoice_items.id, etc.
    reference_type VARCHAR(50), -- 'sale', 'invoice', 'adjustment', etc.
    notes TEXT,
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Timekeeping Table
CREATE TABLE employee_timekeeping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES staff(id) NOT NULL,
    clock_in_time TIMESTAMP NOT NULL,
    clock_out_time TIMESTAMP,
    break_start_time TIMESTAMP,
    break_end_time TIMESTAMP,
    total_hours DECIMAL(4,2), -- calculated when clocking out
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    hourly_rate DECIMAL(8,2),
    total_pay DECIMAL(10,2),
    approved_by UUID REFERENCES staff(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions Table (for tracking all payments)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    reference_id UUID NOT NULL, -- pos_sales.id or member_invoices.id
    reference_type VARCHAR(50) NOT NULL, -- 'sale' or 'invoice'
    member_id UUID REFERENCES members(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    card_last_four VARCHAR(4), -- last 4 digits of card if card payment
    authorization_code VARCHAR(50), -- from payment processor
    processor_response JSONB, -- full response from payment processor
    processed_by UUID REFERENCES staff(id),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refunded BOOLEAN DEFAULT false,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refunded_at TIMESTAMP,
    refunded_by UUID REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Management Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    payment_terms VARCHAR(100),
    discount_terms VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders Table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery DATE,
    actual_delivery DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, ordered, received, cancelled
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES staff(id),
    received_by UUID REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Items Table
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES purchase_orders(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Sales Summary Table (for reporting)
CREATE TABLE daily_sales_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    proshop_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    fnb_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_collected DECIMAL(12,2) NOT NULL DEFAULT 0,
    discounts_given DECIMAL(12,2) NOT NULL DEFAULT 0,
    cash_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    card_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    member_account_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    voided_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    voided_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_member_invoices_member_id ON member_invoices(member_id);
CREATE INDEX idx_member_invoices_status ON member_invoices(status);
CREATE INDEX idx_member_invoices_due_date ON member_invoices(due_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX idx_pos_sales_cashier_id ON pos_sales(cashier_id);
CREATE INDEX idx_pos_sales_sale_date ON pos_sales(sale_date);
CREATE INDEX idx_pos_sales_member_id ON pos_sales(member_id);
CREATE INDEX idx_pos_sale_items_sale_id ON pos_sale_items(sale_id);
CREATE INDEX idx_pos_sale_items_product_id ON pos_sale_items(product_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_employee_timekeeping_employee_id ON employee_timekeeping(employee_id);
CREATE INDEX idx_employee_timekeeping_clock_in ON employee_timekeeping(clock_in_time);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(reference_id, reference_type);
CREATE INDEX idx_payment_transactions_member_id ON payment_transactions(member_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_is_fnb ON products(is_fnb);
CREATE INDEX idx_products_is_proshop ON products(is_proshop);

-- Add triggers for updated_at timestamps on new tables
CREATE TRIGGER update_member_invoices_updated_at BEFORE UPDATE ON member_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_sales_summary_updated_at BEFORE UPDATE ON daily_sales_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for automated tasks

-- Function to update daily sales summary
CREATE OR REPLACE FUNCTION update_daily_sales_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_sales_summary (
        business_date,
        total_sales,
        proshop_sales,
        fnb_sales,
        tax_collected,
        discounts_given,
        cash_sales,
        card_sales,
        member_account_sales,
        transaction_count,
        voided_sales,
        voided_count
    )
    SELECT 
        target_date,
        COALESCE(SUM(CASE WHEN voided = false THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN voided = false AND sale_type IN ('proshop', 'mixed') THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN voided = false AND sale_type IN ('fnb', 'mixed') THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN voided = false THEN tax_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN voided = false THEN discount_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN voided = false AND payment_method = 'cash' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN voided = false AND payment_method = 'card' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN voided = false AND payment_method = 'member_account' THEN total_amount ELSE 0 END), 0),
        COUNT(CASE WHEN voided = false THEN 1 END),
        COALESCE(SUM(CASE WHEN voided = true THEN total_amount ELSE 0 END), 0),
        COUNT(CASE WHEN voided = true THEN 1 END)
    FROM pos_sales 
    WHERE DATE(sale_date) = target_date
    ON CONFLICT (business_date) 
    DO UPDATE SET
        total_sales = EXCLUDED.total_sales,
        proshop_sales = EXCLUDED.proshop_sales,
        fnb_sales = EXCLUDED.fnb_sales,
        tax_collected = EXCLUDED.tax_collected,
        discounts_given = EXCLUDED.discounts_given,
        cash_sales = EXCLUDED.cash_sales,
        card_sales = EXCLUDED.card_sales,
        member_account_sales = EXCLUDED.member_account_sales,
        transaction_count = EXCLUDED.transaction_count,
        voided_sales = EXCLUDED.voided_sales,
        voided_count = EXCLUDED.voided_count,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update inventory when sales occur
CREATE OR REPLACE FUNCTION create_inventory_movement_for_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Create inventory movement record for each sale item
    INSERT INTO inventory_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reference_id,
        reference_type,
        created_by
    )
    SELECT 
        psi.product_id,
        'sale'::inventory_movement_type,
        -psi.quantity,
        p.stock_quantity,
        p.stock_quantity - psi.quantity,
        NEW.id,
        'sale',
        NEW.cashier_id
    FROM pos_sale_items psi
    JOIN products p ON psi.product_id = p.id
    WHERE psi.sale_id = NEW.id;
    
    -- Update product stock quantities
    UPDATE products 
    SET stock_quantity = stock_quantity - psi.quantity,
        updated_at = CURRENT_TIMESTAMP
    FROM pos_sale_items psi
    WHERE products.id = psi.product_id 
    AND psi.sale_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic inventory updates
CREATE TRIGGER trigger_create_inventory_movement_for_sale
    AFTER INSERT ON pos_sales
    FOR EACH ROW EXECUTE FUNCTION create_inventory_movement_for_sale();

-- Insert default product categories
INSERT INTO product_categories (name, description, display_order) VALUES
('Food & Beverage', 'Restaurant and bar items', 1),
('Golf Equipment', 'Golf clubs, balls, and accessories', 2),
('Golf Apparel', 'Golf clothing and footwear', 3),
('Pro Shop Accessories', 'Golf accessories and gifts', 4),
('Beverages', 'Alcoholic and non-alcoholic drinks', 5),
('Snacks', 'Light food items and snacks', 6);

-- Insert F&B subcategories
INSERT INTO product_categories (name, description, parent_category_id, display_order) 
SELECT 'Appetizers', 'Starter items', id, 1 FROM product_categories WHERE name = 'Food & Beverage';

INSERT INTO product_categories (name, description, parent_category_id, display_order) 
SELECT 'Main Courses', 'Entree items', id, 2 FROM product_categories WHERE name = 'Food & Beverage';

INSERT INTO product_categories (name, description, parent_category_id, display_order) 
SELECT 'Desserts', 'Sweet treats and desserts', id, 3 FROM product_categories WHERE name = 'Food & Beverage';

INSERT INTO product_categories (name, description, parent_category_id, display_order) 
SELECT 'Hot Beverages', 'Coffee, tea, and hot drinks', id, 4 FROM product_categories WHERE name = 'Beverages';

INSERT INTO product_categories (name, description, parent_category_id, display_order) 
SELECT 'Cold Beverages', 'Soft drinks, juices, and cold drinks', id, 5 FROM product_categories WHERE name = 'Beverages';

INSERT INTO product_categories (name, description, parent_category_id, display_order) 
SELECT 'Alcoholic Beverages', 'Beer, wine, and spirits', id, 6 FROM product_categories WHERE name = 'Beverages';