-- Royal Golf Club - ERP Financial Integration Mock Data
-- Comprehensive test data for the financial ERP system

-- ===============================================================
-- VENDORS DATA
-- ===============================================================

INSERT INTO vendors (vendor_name, vendor_type, contact_info, payment_terms, tax_id, is_active) VALUES
('TurfCare Equipment', 'supplier', '{"contact_person": "Mike Johnson", "phone": "+1-555-7001", "email": "mike@turfcare.com", "address": "123 Equipment Blvd, Dallas, TX"}', 'Net 30', 'TX-12345678', true),
('Green Solutions Chemical', 'supplier', '{"contact_person": "Sarah Chen", "phone": "+1-555-7002", "email": "sarah@greensolutions.com", "address": "456 Chemical Ave, Austin, TX"}', 'Net 15', 'TX-23456789', true),
('Dallas Electric Utility', 'utility', '{"contact_person": "Customer Service", "phone": "+1-555-7003", "email": "service@dallaselectric.com", "address": "789 Power St, Dallas, TX"}', 'Due on Receipt', 'TX-34567890', true),
('Royal Water Works', 'utility', '{"contact_person": "Billing Dept", "phone": "+1-555-7004", "email": "billing@royalwater.com", "address": "321 Water Way, Royal City, TX"}', 'Due on Receipt', 'TX-45678901', true),
('Elite Catering Services', 'service', '{"contact_person": "Chef Maria", "phone": "+1-555-7005", "email": "maria@elitecatering.com", "address": "654 Culinary Rd, Royal City, TX"}', 'Net 10', 'TX-56789012', true),
('ProGolf Maintenance', 'contractor', '{"contact_person": "Tom Wilson", "phone": "+1-555-7006", "email": "tom@progolfmaint.com", "address": "987 Course Ln, Golf City, TX"}', 'Net 30', 'TX-67890123', true);

-- ===============================================================
-- GREEN FEE TRANSACTIONS (REVENUE PHASE 1)
-- ===============================================================

INSERT INTO green_fee_transactions (member_id, transaction_date, round_type, green_fee_amount, cart_rental_amount, guest_fees, total_amount, payment_method, weather_conditions, tee_time, booking_id) VALUES
-- May 2025 transactions
((SELECT id FROM members WHERE member_number = 'M001'), '2025-05-01 08:00:00', '18-hole', 85.00, 25.00, 0.00, 110.00, 'member_account', 'Sunny, 72°F', '08:00', NULL),
((SELECT id FROM members WHERE member_number = 'M002'), '2025-05-02 09:15:00', '18-hole', 85.00, 25.00, 85.00, 195.00, 'credit_card', 'Partly Cloudy, 68°F', '09:15', NULL),
((SELECT id FROM members WHERE member_number = 'M003'), '2025-05-03 07:30:00', '9-hole', 45.00, 20.00, 0.00, 65.00, 'member_account', 'Clear, 70°F', '07:30', NULL),
((SELECT id FROM members WHERE member_number = 'M004'), '2025-05-04 14:00:00', 'twilight', 60.00, 20.00, 60.00, 140.00, 'cash', 'Sunny, 78°F', '14:00', NULL),
((SELECT id FROM members WHERE member_number = 'M005'), '2025-05-05 10:30:00', '18-hole', 85.00, 25.00, 170.00, 280.00, 'corporate_account', 'Overcast, 65°F', '10:30', NULL),

-- April 2025 transactions
((SELECT id FROM members WHERE member_number = 'M001'), '2025-04-15 08:15:00', '18-hole', 85.00, 25.00, 0.00, 110.00, 'member_account', 'Sunny, 75°F', '08:15', NULL),
((SELECT id FROM members WHERE member_number = 'M002'), '2025-04-20 16:00:00', 'twilight', 60.00, 20.00, 0.00, 80.00, 'credit_card', 'Clear, 80°F', '16:00', NULL),
((SELECT id FROM members WHERE member_number = 'M003'), '2025-04-25 11:00:00', '9-hole', 45.00, 20.00, 45.00, 110.00, 'member_account', 'Partly Cloudy, 72°F', '11:00', NULL),

-- March 2025 transactions
((SELECT id FROM members WHERE member_number = 'M004'), '2025-03-10 09:00:00', '18-hole', 85.00, 25.00, 0.00, 110.00, 'credit_card', 'Cool, 62°F', '09:00', NULL),
((SELECT id FROM members WHERE member_number = 'M005'), '2025-03-22 13:30:00', '18-hole', 85.00, 25.00, 255.00, 365.00, 'corporate_account', 'Mild, 68°F', '13:30', NULL);

-- ===============================================================
-- F&B REVENUE TRACKING (REVENUE PHASE 1)
-- ===============================================================

INSERT INTO fnb_revenue_tracking (member_id, order_id, transaction_date, location, items, subtotal, tax_amount, tip_amount, total_amount, cost_of_goods, server_id) VALUES
-- May 2025 F&B transactions
((SELECT id FROM members WHERE member_number = 'M001'), NULL, '2025-05-01 12:30:00', 'restaurant', 
 '[{"item": "Club Sandwich", "quantity": 1, "price": 16.50}, {"item": "Premium Beer", "quantity": 2, "price": 8.00}]', 
 32.50, 2.60, 6.50, 41.50, 12.50, (SELECT id FROM staff WHERE employee_id = 'EMP007')),

((SELECT id FROM members WHERE member_number = 'M002'), NULL, '2025-05-02 19:15:00', 'restaurant', 
 '[{"item": "Grilled Salmon", "quantity": 1, "price": 28.00}, {"item": "House Chardonnay", "quantity": 1, "price": 12.00}]', 
 40.00, 3.20, 8.00, 51.20, 17.00, (SELECT id FROM staff WHERE employee_id = 'EMP007')),

((SELECT id FROM members WHERE member_number = 'M003'), NULL, '2025-05-03 13:00:00', 'bar', 
 '[{"item": "Chicken Wings", "quantity": 1, "price": 14.50}, {"item": "Premium Beer", "quantity": 3, "price": 8.00}]', 
 38.50, 3.08, 7.00, 48.58, 15.00, (SELECT id FROM staff WHERE employee_id = 'EMP007')),

((SELECT id FROM members WHERE member_number = 'M004'), NULL, '2025-05-04 18:45:00', 'restaurant', 
 '[{"item": "Margherita Pizza", "quantity": 2, "price": 18.00}, {"item": "Caesar Salad", "quantity": 1, "price": 14.00}]', 
 50.00, 4.00, 10.00, 64.00, 21.00, (SELECT id FROM staff WHERE employee_id = 'EMP007')),

((SELECT id FROM members WHERE member_number = 'M005'), NULL, '2025-05-05 20:00:00', 'banquet', 
 '[{"item": "Corporate Dinner Package", "quantity": 8, "price": 45.00}]', 
 360.00, 28.80, 72.00, 460.80, 160.00, (SELECT id FROM staff WHERE employee_id = 'EMP007')),

-- April 2025 F&B transactions
((SELECT id FROM members WHERE member_number = 'M001'), NULL, '2025-04-15 14:30:00', 'restaurant', 
 '[{"item": "Veggie Burger", "quantity": 1, "price": 15.00}, {"item": "Fresh Coffee", "quantity": 1, "price": 3.50}]', 
 18.50, 1.48, 3.50, 23.48, 7.50, (SELECT id FROM staff WHERE employee_id = 'EMP007')),

((SELECT id FROM members WHERE member_number = 'M002'), NULL, '2025-04-20 17:30:00', 'bar', 
 '[{"item": "Spinach Artichoke Dip", "quantity": 1, "price": 12.00}, {"item": "Premium Beer", "quantity": 2, "price": 8.00}]', 
 28.00, 2.24, 5.60, 35.84, 11.50, (SELECT id FROM staff WHERE employee_id = 'EMP007'));

-- ===============================================================
-- PRO SHOP REVENUE TRACKING (REVENUE PHASE 1)
-- ===============================================================

INSERT INTO pro_shop_revenue_tracking (member_id, order_id, transaction_date, items, subtotal, tax_amount, discount_amount, total_amount, cost_of_goods, staff_id) VALUES
-- May 2025 Pro Shop transactions
((SELECT id FROM members WHERE member_number = 'M001'), NULL, '2025-05-01 16:00:00', 
 '[{"item": "Titleist Pro V1 Golf Balls", "quantity": 2, "price": 54.99}]', 
 109.98, 8.80, 0.00, 118.78, 64.00, (SELECT id FROM staff WHERE employee_id = 'EMP006')),

((SELECT id FROM members WHERE member_number = 'M002'), NULL, '2025-05-02 11:30:00', 
 '[{"item": "Golf Polo Shirt - Navy", "quantity": 1, "price": 65.00}, {"item": "Golf Shorts - Khaki", "quantity": 1, "price": 75.00}]', 
 140.00, 11.20, 14.00, 137.20, 55.00, (SELECT id FROM staff WHERE employee_id = 'EMP006')),

((SELECT id FROM members WHERE member_number = 'M003'), NULL, '2025-05-03 15:45:00', 
 '[{"item": "Callaway Driver", "quantity": 1, "price": 499.99}]', 
 499.99, 40.00, 0.00, 539.99, 300.00, (SELECT id FROM staff WHERE employee_id = 'EMP006')),

((SELECT id FROM members WHERE member_number = 'M004'), NULL, '2025-05-04 10:15:00', 
 '[{"item": "Golf Polo Shirt - Navy", "quantity": 2, "price": 65.00}]', 
 130.00, 10.40, 13.00, 127.40, 50.00, (SELECT id FROM staff WHERE employee_id = 'EMP006')),

-- April 2025 Pro Shop transactions
((SELECT id FROM members WHERE member_number = 'M005'), NULL, '2025-04-18 14:20:00', 
 '[{"item": "Titleist Pro V1 Golf Balls", "quantity": 3, "price": 54.99}, {"item": "Golf Shorts - Khaki", "quantity": 2, "price": 75.00}]', 
 314.97, 25.20, 0.00, 340.17, 156.00, (SELECT id FROM staff WHERE employee_id = 'EMP006'));

-- ===============================================================
-- MEMBERSHIP REVENUE (REVENUE PHASE 1)
-- ===============================================================

INSERT INTO membership_revenue (member_id, payment_date, payment_type, amount, period_start, period_end, payment_method, status, transaction_reference) VALUES
-- May 2025 membership payments
((SELECT id FROM members WHERE member_number = 'M001'), '2025-05-01 00:00:00', 'dues', 500.00, '2025-05-01', '2025-05-31', 'auto_pay', 'completed', 'AUTO-2025-M001-05'),
((SELECT id FROM members WHERE member_number = 'M002'), '2025-05-01 00:00:00', 'dues', 350.00, '2025-05-01', '2025-05-31', 'auto_pay', 'completed', 'AUTO-2025-M002-05'),
((SELECT id FROM members WHERE member_number = 'M003'), '2025-05-01 00:00:00', 'dues', 250.00, '2025-05-01', '2025-05-31', 'auto_pay', 'completed', 'AUTO-2025-M003-05'),
((SELECT id FROM members WHERE member_number = 'M004'), '2025-05-01 00:00:00', 'dues', 350.00, '2025-05-01', '2025-05-31', 'auto_pay', 'completed', 'AUTO-2025-M004-05'),
((SELECT id FROM members WHERE member_number = 'M005'), '2025-05-01 00:00:00', 'dues', 750.00, '2025-05-01', '2025-05-31', 'auto_pay', 'completed', 'AUTO-2025-M005-05'),

-- April 2025 membership payments
((SELECT id FROM members WHERE member_number = 'M001'), '2025-04-01 00:00:00', 'dues', 500.00, '2025-04-01', '2025-04-30', 'auto_pay', 'completed', 'AUTO-2025-M001-04'),
((SELECT id FROM members WHERE member_number = 'M002'), '2025-04-01 00:00:00', 'dues', 350.00, '2025-04-01', '2025-04-30', 'auto_pay', 'completed', 'AUTO-2025-M002-04'),
((SELECT id FROM members WHERE member_number = 'M003'), '2025-04-01 00:00:00', 'dues', 250.00, '2025-04-01', '2025-04-30', 'auto_pay', 'completed', 'AUTO-2025-M003-04'),
((SELECT id FROM members WHERE member_number = 'M004'), '2025-04-01 00:00:00', 'dues', 350.00, '2025-04-01', '2025-04-30', 'auto_pay', 'completed', 'AUTO-2025-M004-04'),
((SELECT id FROM members WHERE member_number = 'M005'), '2025-04-01 00:00:00', 'dues', 750.00, '2025-04-01', '2025-04-30', 'auto_pay', 'completed', 'AUTO-2025-M005-04'),

-- March 2025 membership payments
((SELECT id FROM members WHERE member_number = 'M001'), '2025-03-01 00:00:00', 'dues', 500.00, '2025-03-01', '2025-03-31', 'auto_pay', 'completed', 'AUTO-2025-M001-03'),
((SELECT id FROM members WHERE member_number = 'M002'), '2025-03-01 00:00:00', 'dues', 350.00, '2025-03-01', '2025-03-31', 'auto_pay', 'completed', 'AUTO-2025-M002-03'),
((SELECT id FROM members WHERE member_number = 'M003'), '2025-03-01 00:00:00', 'dues', 250.00, '2025-03-01', '2025-03-31', 'auto_pay', 'completed', 'AUTO-2025-M003-03'),
((SELECT id FROM members WHERE member_number = 'M004'), '2025-03-01 00:00:00', 'dues', 350.00, '2025-03-01', '2025-03-31', 'auto_pay', 'completed', 'AUTO-2025-M004-03'),
((SELECT id FROM members WHERE member_number = 'M005'), '2025-03-01 00:00:00', 'dues', 750.00, '2025-03-01', '2025-03-31', 'auto_pay', 'completed', 'AUTO-2025-M005-03');

-- ===============================================================
-- MAINTENANCE EXPENSES (EXPENSE PHASE 2)
-- ===============================================================

INSERT INTO maintenance_expenses (expense_date, category, subcategory, vendor_id, description, amount, cost_center, approval_status, approved_by, approved_at, invoice_number, metadata) VALUES
-- May 2025 maintenance expenses
('2025-05-01', 'equipment', 'mowers', (SELECT id FROM vendors WHERE vendor_name = 'TurfCare Equipment'), 'Replacement parts for fairway mowers', 1250.00, 'course_maintenance', 'approved', (SELECT id FROM staff WHERE employee_id = 'EMP002'), '2025-05-01 14:30:00', 'INV-TC-2025-001', '{"urgency": "medium", "affected_holes": [1,2,3,4,5]}'),

('2025-05-03', 'chemicals', 'fertilizer', (SELECT id FROM vendors WHERE vendor_name = 'Green Solutions Chemical'), 'Spring fertilizer application - Greens', 850.00, 'course_maintenance', 'approved', (SELECT id FROM staff WHERE employee_id = 'EMP002'), '2025-05-03 09:15:00', 'INV-GS-2025-008', '{"application_date": "2025-05-05", "coverage_area": "18 greens"}'),

('2025-05-05', 'irrigation', 'sprinkler_repair', (SELECT id FROM vendors WHERE vendor_name = 'ProGolf Maintenance'), 'Repair sprinkler heads on holes 7, 12, 15', 680.00, 'course_maintenance', 'approved', (SELECT id FROM staff WHERE employee_id = 'EMP002'), '2025-05-05 16:45:00', 'INV-PGM-2025-003', '{"holes_affected": [7, 12, 15], "repair_type": "sprinkler_heads"}'),

('2025-05-10', 'labor', 'seasonal_staff', NULL, 'Additional groundskeeping staff for peak season', 2400.00, 'course_maintenance', 'approved', (SELECT id FROM staff WHERE employee_id = 'EMP001'), '2025-05-10 11:00:00', 'PAY-SEASON-2025-05', '{"staff_count": 3, "duration_weeks": 4, "hourly_rate": 20}'),

-- April 2025 maintenance expenses
('2025-04-15', 'equipment', 'cart_maintenance', (SELECT id FROM vendors WHERE vendor_name = 'TurfCare Equipment'), 'Golf cart fleet maintenance and battery replacement', 1800.00, 'course_maintenance', 'approved', (SELECT id FROM staff WHERE employee_id = 'EMP002'), '2025-04-15 13:20:00', 'INV-TC-2025-002', '{"carts_serviced": 25, "batteries_replaced": 8}'),

('2025-04-22', 'chemicals', 'pest_control', (SELECT id FROM vendors WHERE vendor_name = 'Green Solutions Chemical'), 'Pest control treatment for grubs and insects', 450.00, 'course_maintenance', 'approved', (SELECT id FROM staff WHERE employee_id = 'EMP002'), '2025-04-22 10:30:00', 'INV-GS-2025-012', '{"treatment_type": "grub_control", "coverage": "full_course"}');

-- ===============================================================
-- UTILITY EXPENSES (EXPENSE PHASE 2)
-- ===============================================================

INSERT INTO utility_expenses (billing_period_start, billing_period_end, utility_type, usage_amount, usage_unit, cost_per_unit, total_amount, vendor_id, meter_reading_start, meter_reading_end) VALUES
-- May 2025 utilities
('2025-05-01', '2025-05-31', 'electricity', 15420.50, 'kWh', 0.12, 1850.46, (SELECT id FROM vendors WHERE vendor_name = 'Dallas Electric Utility'), 125430.0, 140850.5),
('2025-05-01', '2025-05-31', 'water', 125000.00, 'gallons', 0.004, 500.00, (SELECT id FROM vendors WHERE vendor_name = 'Royal Water Works'), 450230.0, 575230.0),

-- April 2025 utilities
('2025-04-01', '2025-04-30', 'electricity', 12850.25, 'kWh', 0.12, 1542.03, (SELECT id FROM vendors WHERE vendor_name = 'Dallas Electric Utility'), 112579.75, 125430.0),
('2025-04-01', '2025-04-30', 'water', 98000.00, 'gallons', 0.004, 392.00, (SELECT id FROM vendors WHERE vendor_name = 'Royal Water Works'), 352230.0, 450230.0),

-- March 2025 utilities
('2025-03-01', '2025-03-31', 'electricity', 11200.75, 'kWh', 0.12, 1344.09, (SELECT id FROM vendors WHERE vendor_name = 'Dallas Electric Utility'), 101379.0, 112579.75),
('2025-03-01', '2025-03-31', 'water', 87500.00, 'gallons', 0.004, 350.00, (SELECT id FROM vendors WHERE vendor_name = 'Royal Water Works'), 264730.0, 352230.0);

-- ===============================================================
-- DEPARTMENTAL PAYROLL (EXPENSE PHASE 2)
-- ===============================================================

INSERT INTO departmental_payroll (employee_id, pay_period_start, pay_period_end, department, cost_center, regular_hours, overtime_hours, regular_rate, overtime_rate, gross_pay, taxes, benefits, net_pay, allocation_percentage) VALUES
-- May 2025 payroll - Week 1
((SELECT id FROM staff WHERE employee_id = 'EMP001'), '2025-05-01', '2025-05-15', 'management', 'administration', 80.0, 0.0, 50.00, 75.00, 4000.00, 1200.00, 400.00, 2400.00, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP002'), '2025-05-01', '2025-05-15', 'management', 'administration', 80.0, 5.0, 45.00, 67.50, 3937.50, 1181.25, 350.00, 2406.25, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP003'), '2025-05-01', '2025-05-15', 'front_desk', 'guest_services', 80.0, 2.0, 18.00, 27.00, 1494.00, 448.20, 150.00, 895.80, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP004'), '2025-05-01', '2025-05-15', 'kitchen', 'fnb', 80.0, 8.0, 16.00, 24.00, 1472.00, 441.60, 140.00, 890.40, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP005'), '2025-05-01', '2025-05-15', 'front_desk', 'guest_services', 80.0, 0.0, 17.00, 25.50, 1360.00, 408.00, 130.00, 822.00, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP006'), '2025-05-01', '2025-05-15', 'pro_shop', 'retail', 80.0, 4.0, 19.00, 28.50, 1634.00, 490.20, 160.00, 983.80, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP007'), '2025-05-01', '2025-05-15', 'fnb', 'fnb', 80.0, 6.0, 15.50, 23.25, 1379.50, 413.85, 130.00, 835.65, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP008'), '2025-05-01', '2025-05-15', 'course_operations', 'golf_services', 80.0, 0.0, 14.00, 21.00, 1120.00, 336.00, 110.00, 674.00, 100.0),

-- May 2025 payroll - Week 2
((SELECT id FROM staff WHERE employee_id = 'EMP001'), '2025-05-16', '2025-05-31', 'management', 'administration', 80.0, 0.0, 50.00, 75.00, 4000.00, 1200.00, 400.00, 2400.00, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP002'), '2025-05-16', '2025-05-31', 'management', 'administration', 80.0, 3.0, 45.00, 67.50, 3802.50, 1140.75, 350.00, 2311.75, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP003'), '2025-05-16', '2025-05-31', 'front_desk', 'guest_services', 80.0, 0.0, 18.00, 27.00, 1440.00, 432.00, 150.00, 858.00, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP004'), '2025-05-16', '2025-05-31', 'kitchen', 'fnb', 80.0, 6.0, 16.00, 24.00, 1424.00, 427.20, 140.00, 856.80, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP005'), '2025-05-16', '2025-05-31', 'front_desk', 'guest_services', 80.0, 1.0, 17.00, 25.50, 1385.50, 415.65, 130.00, 839.85, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP006'), '2025-05-16', '2025-05-31', 'pro_shop', 'retail', 80.0, 2.0, 19.00, 28.50, 1577.00, 473.10, 160.00, 943.90, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP007'), '2025-05-16', '2025-05-31', 'fnb', 'fnb', 80.0, 4.0, 15.50, 23.25, 1333.00, 399.90, 130.00, 803.10, 100.0),
((SELECT id FROM staff WHERE employee_id = 'EMP008'), '2025-05-16', '2025-05-31', 'course_operations', 'golf_services', 80.0, 2.0, 14.00, 21.00, 1162.00, 348.60, 110.00, 703.40, 100.0);

-- ===============================================================
-- MEMBER VISIT ANALYTICS (ANALYTICS PHASE 3)
-- ===============================================================

INSERT INTO member_visit_analytics (member_id, visit_date, check_in_time, check_out_time, activities, total_spent, golf_spend, fnb_spend, pro_shop_spend, weather_conditions, visit_duration_minutes) VALUES
-- May 2025 visit analytics
((SELECT id FROM members WHERE member_number = 'M001'), '2025-05-01', '2025-05-01 07:45:00', '2025-05-01 16:30:00', '["golf", "dining", "pro_shop"]', 270.28, 110.00, 41.50, 118.78, 'Sunny, 72°F', 525),
((SELECT id FROM members WHERE member_number = 'M002'), '2025-05-02', '2025-05-02 08:45:00', '2025-05-02 20:00:00', '["golf", "dining", "pro_shop"]', 383.40, 195.00, 51.20, 137.20, 'Partly Cloudy, 68°F', 675),
((SELECT id FROM members WHERE member_number = 'M003'), '2025-05-03', '2025-05-03 07:15:00', '2025-05-03 17:45:00', '["golf", "dining", "pro_shop"]', 653.57, 65.00, 48.58, 539.99, 'Clear, 70°F', 630),
((SELECT id FROM members WHERE member_number = 'M004'), '2025-05-04', '2025-05-04 09:30:00', '2025-05-04 19:30:00', '["golf", "dining", "pro_shop"]', 331.40, 140.00, 64.00, 127.40, 'Sunny, 78°F', 600),
((SELECT id FROM members WHERE member_number = 'M005'), '2025-05-05', '2025-05-05 10:00:00', '2025-05-05 22:00:00', '["golf", "dining"]', 740.80, 280.00, 460.80, 0.00, 'Overcast, 65°F', 720),

-- April 2025 visit analytics
((SELECT id FROM members WHERE member_number = 'M001'), '2025-04-15', '2025-04-15 08:00:00', '2025-04-15 15:30:00', '["golf", "dining"]', 133.48, 110.00, 23.48, 0.00, 'Sunny, 75°F', 450),
((SELECT id FROM members WHERE member_number = 'M002'), '2025-04-20', '2025-04-20 15:30:00', '2025-04-20 18:30:00', '["golf", "dining"]', 115.84, 80.00, 35.84, 0.00, 'Clear, 80°F', 180),
((SELECT id FROM members WHERE member_number = 'M003'), '2025-04-25', '2025-04-25 10:30:00', '2025-04-25 14:00:00', '["golf"]', 110.00, 110.00, 0.00, 0.00, 'Partly Cloudy, 72°F', 210),

-- March 2025 visit analytics
((SELECT id FROM members WHERE member_number = 'M004'), '2025-03-10', '2025-03-10 08:45:00', '2025-03-10 13:15:00', '["golf"]', 110.00, 110.00, 0.00, 0.00, 'Cool, 62°F', 270),
((SELECT id FROM members WHERE member_number = 'M005'), '2025-03-22', '2025-03-22 13:00:00', '2025-03-22 17:30:00', '["golf"]', 365.00, 365.00, 0.00, 0.00, 'Mild, 68°F', 270);

-- ===============================================================
-- MEMBER SPENDING INTELLIGENCE (ANALYTICS PHASE 3)
-- ===============================================================

INSERT INTO member_spending_intelligence (member_id, analysis_period, period_start, period_end, total_spent, avg_spend_per_visit, visit_frequency, golf_spend_percentage, fnb_spend_percentage, pro_shop_spend_percentage, preferred_activities, spending_trend, retention_risk_score, ltv_prediction) VALUES
-- Q2 2025 member intelligence
((SELECT id FROM members WHERE member_number = 'M001'), 'quarterly', '2025-04-01', '2025-06-30', 903.76, 301.25, 3, 55.2, 18.1, 26.7, '["golf", "dining", "pro_shop"]', 'increasing', 0.15, 12500.00),
((SELECT id FROM members WHERE member_number = 'M002'), 'quarterly', '2025-04-01', '2025-06-30', 499.24, 166.41, 3, 55.0, 17.4, 27.6, '["golf", "dining", "pro_shop"]', 'stable', 0.25, 8500.00),
((SELECT id FROM members WHERE member_number = 'M003'), 'quarterly', '2025-04-01', '2025-06-30', 763.57, 381.79, 2, 23.1, 6.4, 70.5, '["golf", "pro_shop"]', 'increasing', 0.10, 15000.00),
((SELECT id FROM members WHERE member_number = 'M004'), 'quarterly', '2025-04-01', '2025-06-30', 441.40, 220.70, 2, 56.7, 14.5, 28.8, '["golf", "dining", "pro_shop"]', 'stable', 0.20, 9000.00),
((SELECT id FROM members WHERE member_number = 'M005'), 'quarterly', '2025-04-01', '2025-06-30', 1105.80, 368.60, 3, 77.7, 22.3, 0.0, '["golf", "dining"]', 'stable', 0.05, 18000.00);

-- ===============================================================
-- MEMBER LIFECYCLE TRACKING (ANALYTICS PHASE 3)
-- ===============================================================

INSERT INTO member_lifecycle_tracking (member_id, lifecycle_stage, stage_date, previous_stage, retention_score, engagement_score, satisfaction_score, factors, automated_flags, notes) VALUES
-- Current lifecycle stages
((SELECT id FROM members WHERE member_number = 'M001'), 'active', '2025-05-01', 'active', 0.95, 0.88, 0.92, '{"high_spend": true, "regular_visitor": true, "uses_multiple_services": true}', '{"high_value": true, "vip_treatment": true}', 'Platinum member with excellent engagement across all services'),
((SELECT id FROM members WHERE member_number = 'M002'), 'active', '2025-05-01', 'active', 0.85, 0.75, 0.80, '{"moderate_spend": true, "regular_visitor": true, "prefers_dining": true}', '{"standard_service": true}', 'Gold member with consistent activity patterns'),
((SELECT id FROM members WHERE member_number = 'M003'), 'active', '2025-05-01', 'active', 0.90, 0.70, 0.85, '{"equipment_purchaser": true, "occasional_visitor": false, "pro_shop_focused": true}', '{"equipment_offers": true}', 'Silver member who makes significant pro shop purchases'),
((SELECT id FROM members WHERE member_number = 'M004'), 'active', '2025-05-01', 'active', 0.82, 0.72, 0.78, '{"social_visitor": true, "family_oriented": true, "moderate_spend": true}', '{"family_events": true}', 'Gold member with family-focused activities'),
((SELECT id FROM members WHERE member_number = 'M005'), 'active', '2025-05-01', 'active', 0.98, 0.85, 0.95, '{"corporate_member": true, "high_spend": true, "business_entertainment": true}', '{"corporate_vip": true, "business_services": true}', 'Corporate member with high-value business entertainment usage');

-- ===============================================================
-- KPI DASHBOARD METRICS (REAL-TIME ANALYTICS)
-- ===============================================================

INSERT INTO kpi_dashboard_metrics (metric_type, metric_name, metric_value, metric_date, department, calculation_metadata) VALUES
-- May 2025 KPIs
('revenue', 'daily_total_revenue', 1265.45, '2025-05-01', 'all', '{"green_fees": 110.00, "fnb": 41.50, "pro_shop": 118.78, "membership": 1000.00}'),
('revenue', 'daily_total_revenue', 2077.60, '2025-05-02', 'all', '{"green_fees": 195.00, "fnb": 51.20, "pro_shop": 137.20, "membership": 700.00}'),
('revenue', 'daily_total_revenue', 1513.57, '2025-05-03', 'all', '{"green_fees": 65.00, "fnb": 48.58, "pro_shop": 539.99, "membership": 600.00}'),
('revenue', 'daily_total_revenue', 1031.40, '2025-05-04', 'all', '{"green_fees": 140.00, "fnb": 64.00, "pro_shop": 127.40, "membership": 700.00}'),
('revenue', 'daily_total_revenue', 1490.80, '2025-05-05', 'all', '{"green_fees": 280.00, "fnb": 460.80, "pro_shop": 0.00, "membership": 750.00}'),

-- Department specific KPIs
('revenue', 'pro_shop_daily_margin', 285.19, '2025-05-01', 'pro_shop', '{"gross_revenue": 539.99, "cost_of_goods": 254.80, "margin_percentage": 52.8}'),
('revenue', 'fnb_daily_margin', 198.38, '2025-05-01', 'fnb', '{"gross_revenue": 256.08, "cost_of_goods": 57.70, "margin_percentage": 77.5}'),
('expense', 'daily_maintenance_cost', 850.00, '2025-05-03', 'course_maintenance', '{"category": "chemicals", "vendor": "Green Solutions Chemical"}'),
('expense', 'daily_utility_cost', 61.63, '2025-05-01', 'facilities', '{"electricity": 59.69, "water": 16.13}'),

-- Member engagement KPIs
('member_engagement', 'daily_active_members', 5, '2025-05-01', 'all', '{"unique_visitors": 5, "repeat_visitors": 2, "new_visitors": 0}'),
('member_engagement', 'average_visit_duration', 570, '2025-05-01', 'all', '{"duration_minutes": 570, "activities_per_visit": 2.8}'),
('member_engagement', 'member_satisfaction_score', 0.85, '2025-05-01', 'all', '{"survey_responses": 12, "average_rating": 4.25}');

-- ===============================================================
-- FINANCIAL PERIOD SUMMARY (REPORTING)
-- ===============================================================

INSERT INTO financial_period_summary (period_type, period_start, period_end, total_revenue, total_expenses, net_income, revenue_breakdown, expense_breakdown, member_metrics) VALUES
-- May 2025 monthly summary
('monthly', '2025-05-01', '2025-05-31', 7378.82, 8355.99, -977.17, 
 '{"green_fees": 790.00, "fnb": 666.08, "pro_shop": 922.74, "membership": 5000.00}',
 '{"maintenance": 5180.00, "utilities": 2350.46, "payroll": 825.53}',
 '{"active_members": 5, "average_spend_per_member": 1475.76, "visit_frequency": 2.4}'),

-- April 2025 monthly summary  
('monthly', '2025-04-01', '2025-04-30', 6029.35, 6284.03, -254.68,
 '{"green_fees": 190.00, "fnb": 59.32, "pro_shop": 340.17, "membership": 5439.86}',
 '{"maintenance": 2250.00, "utilities": 1934.03, "payroll": 2100.00}',
 '{"active_members": 3, "average_spend_per_member": 1206.67, "visit_frequency": 1.0}'),

-- March 2025 monthly summary
('monthly', '2025-03-01', '2025-03-31', 6169.09, 5894.09, 275.00,
 '{"green_fees": 475.00, "fnb": 0.00, "pro_shop": 0.00, "membership": 5694.09}',
 '{"maintenance": 0.00, "utilities": 1694.09, "payroll": 4200.00}',
 '{"active_members": 2, "average_spend_per_member": 237.50, "visit_frequency": 1.0}');

-- ===============================================================
-- FINANCIAL ACCESS CONSTRAINTS (RBAC INTEGRATION)
-- ===============================================================

-- Note: These would reference the existing RBAC users table
-- For now, using placeholder user IDs that would map to the RBAC system

INSERT INTO financial_access_constraints (user_id, access_level, department_restrictions, amount_limit, date_range_limit) VALUES
-- Owner - Full access
('00000000-0000-0000-0000-000000000001', 'full', ARRAY[]::TEXT[], NULL, NULL),

-- Manager - Departmental access
('00000000-0000-0000-0000-000000000002', 'departmental', ARRAY['pro_shop', 'fnb', 'course_maintenance'], 10000.00, 365),

-- Cashier - Limited access
('00000000-0000-0000-0000-000000000003', 'read_only', ARRAY['fnb'], 1000.00, 30),

-- Pro Shop Staff - Department specific
('00000000-0000-0000-0000-000000000006', 'departmental', ARRAY['pro_shop'], 5000.00, 90),

-- F&B Staff - Department specific  
('00000000-0000-0000-0000-000000000007', 'departmental', ARRAY['fnb'], 2000.00, 60);