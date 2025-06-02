-- Sample Data for Royal Golf Club ERP System

-- Insert Membership Tiers
INSERT INTO membership_tiers (name, description, monthly_dues, initiation_fee, benefits, max_guests, booking_priority) VALUES
('Platinum', 'Premium membership with full access and privileges', 500.00, 5000.00, '{"cart_included": true, "guest_privileges": "unlimited", "tournament_priority": true, "dining_discount": 20}', 6, 1),
('Gold', 'Standard membership with excellent benefits', 350.00, 2500.00, '{"cart_included": false, "guest_privileges": "limited", "tournament_priority": true, "dining_discount": 15}', 4, 2),
('Silver', 'Basic membership with core benefits', 250.00, 1000.00, '{"cart_included": false, "guest_privileges": "limited", "tournament_priority": false, "dining_discount": 10}', 2, 3),
('Corporate', 'Corporate membership for business entertainment', 750.00, 3000.00, '{"cart_included": true, "guest_privileges": "business", "tournament_priority": true, "dining_discount": 25}', 8, 1);

-- Insert Chart of Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
('1000', 'Cash and Cash Equivalents', 'Asset', 'Primary cash accounts'),
('1100', 'Accounts Receivable', 'Asset', 'Member dues and fees receivable'),
('1200', 'Inventory', 'Asset', 'Pro shop and F&B inventory'),
('1300', 'Equipment', 'Asset', 'Golf course and facility equipment'),
('2000', 'Accounts Payable', 'Liability', 'Vendor and supplier payables'),
('2100', 'Accrued Expenses', 'Liability', 'Accrued wages and expenses'),
('3000', 'Member Equity', 'Equity', 'Member capital contributions'),
('4000', 'Membership Revenue', 'Revenue', 'Monthly dues and fees'),
('4100', 'Pro Shop Revenue', 'Revenue', 'Pro shop sales'),
('4200', 'F&B Revenue', 'Revenue', 'Food and beverage sales'),
('4300', 'Tournament Revenue', 'Revenue', 'Tournament entry fees'),
('5000', 'Course Maintenance', 'Expense', 'Golf course maintenance costs'),
('5100', 'Staff Wages', 'Expense', 'Employee wages and benefits'),
('5200', 'Utilities', 'Expense', 'Facility utilities'),
('5300', 'Equipment Maintenance', 'Expense', 'Equipment repair and maintenance');

-- Insert Sample Members
INSERT INTO members (member_number, first_name, last_name, email, phone, membership_tier_id, handicap_index, join_date, address, preferences, emergency_contact) VALUES
('M001', 'John', 'Smith', 'john.smith@email.com', '+1-555-0101', (SELECT id FROM membership_tiers WHERE name = 'Platinum'), 8.5, '2020-01-15', 
 '{"street": "123 Oak Lane", "city": "Royal City", "state": "TX", "zip": "75001"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true}',
 '{"name": "Jane Smith", "relationship": "Spouse", "phone": "+1-555-0102"}'),

('M002', 'Sarah', 'Johnson', 'sarah.johnson@email.com', '+1-555-0201', (SELECT id FROM membership_tiers WHERE name = 'Gold'), 12.3, '2021-03-20',
 '{"street": "456 Pine Street", "city": "Royal City", "state": "TX", "zip": "75002"}',
 '{"communication": "sms", "tee_time_reminders": true, "newsletter": false}',
 '{"name": "Mike Johnson", "relationship": "Spouse", "phone": "+1-555-0202"}'),

('M003', 'Robert', 'Williams', 'robert.williams@email.com', '+1-555-0301', (SELECT id FROM membership_tiers WHERE name = 'Silver'), 15.7, '2022-06-10',
 '{"street": "789 Maple Drive", "city": "Royal City", "state": "TX", "zip": "75003"}',
 '{"communication": "email", "tee_time_reminders": false, "newsletter": true}',
 '{"name": "Lisa Williams", "relationship": "Spouse", "phone": "+1-555-0302"}'),

('M004', 'Emily', 'Davis', 'emily.davis@email.com', '+1-555-0401', (SELECT id FROM membership_tiers WHERE name = 'Gold'), 9.2, '2021-09-05',
 '{"street": "321 Birch Avenue", "city": "Royal City", "state": "TX", "zip": "75004"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true}',
 '{"name": "David Davis", "relationship": "Spouse", "phone": "+1-555-0402"}'),

('M005', 'Michael', 'Brown', 'michael.brown@email.com', '+1-555-0501', (SELECT id FROM membership_tiers WHERE name = 'Corporate'), 6.8, '2020-11-12',
 '{"street": "654 Cedar Court", "city": "Royal City", "state": "TX", "zip": "75005"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true}',
 '{"name": "Corporate Assistant", "relationship": "Business", "phone": "+1-555-0502"}');

-- Insert Courses
INSERT INTO courses (name, description, holes, par, yardage, rating, slope, course_layout) VALUES
('Championship Course', 'Our premier 18-hole championship golf course', 18, 72, 7200, 74.2, 135, 
 '{"holes": [{"number": 1, "par": 4, "yardage": 420, "handicap": 10}, {"number": 2, "par": 3, "yardage": 165, "handicap": 18}]}'),
('Executive Course', 'A shorter 9-hole course perfect for quick rounds', 9, 36, 3200, 68.5, 120,
 '{"holes": [{"number": 1, "par": 4, "yardage": 350, "handicap": 5}, {"number": 2, "par": 3, "yardage": 140, "handicap": 9}]}');

-- Insert Sample Tee Times
INSERT INTO tee_times (course_id, tee_time, max_players, available_spots, green_fee, cart_fee) VALUES
((SELECT id FROM courses WHERE name = 'Championship Course'), '2025-05-30 08:00:00', 4, 4, 85.00, 25.00),
((SELECT id FROM courses WHERE name = 'Championship Course'), '2025-05-30 08:15:00', 4, 4, 85.00, 25.00),
((SELECT id FROM courses WHERE name = 'Championship Course'), '2025-05-30 08:30:00', 4, 4, 85.00, 25.00),
((SELECT id FROM courses WHERE name = 'Executive Course'), '2025-05-30 09:00:00', 4, 4, 45.00, 20.00),
((SELECT id FROM courses WHERE name = 'Executive Course'), '2025-05-30 09:15:00', 4, 4, 45.00, 20.00);

-- Insert Sample Products
INSERT INTO products (sku, name, description, category, subcategory, price, cost, stock_quantity, min_stock_level, supplier_info) VALUES
('GOLF001', 'Titleist Pro V1 Golf Balls (Dozen)', 'Premium golf balls for serious players', 'Golf Equipment', 'Balls', 54.99, 32.00, 50, 10, '{"supplier": "Titleist", "lead_time": "7 days"}'),
('GOLF002', 'Callaway Driver', 'Latest technology driver for maximum distance', 'Golf Equipment', 'Clubs', 499.99, 300.00, 15, 3, '{"supplier": "Callaway", "lead_time": "14 days"}'),
('APPAREL001', 'Golf Polo Shirt - Navy', 'Moisture-wicking polo shirt with club logo', 'Apparel', 'Shirts', 65.00, 25.00, 30, 5, '{"supplier": "Nike Golf", "lead_time": "10 days"}'),
('APPAREL002', 'Golf Shorts - Khaki', 'Comfortable golf shorts with stretch fabric', 'Apparel', 'Bottoms', 75.00, 30.00, 25, 5, '{"supplier": "Under Armour", "lead_time": "10 days"}'),
('FNB001', 'Club Sandwich', 'Triple-decker sandwich with turkey, bacon, and avocado', 'Food & Beverage', 'fnb_mains', 16.50, 6.00, 50, 5, '{"supplier": "Kitchen", "prep_time": "15 minutes", "dietary_tags": [], "spice_level": 0, "cooking_time": 15}'),
('FNB002', 'Caesar Salad', 'Fresh romaine lettuce with house-made dressing and croutons', 'Food & Beverage', 'fnb_salads', 14.00, 5.00, 50, 5, '{"supplier": "Kitchen", "prep_time": "10 minutes", "dietary_tags": ["vegetarian"], "spice_level": 0, "cooking_time": 10}'),
('FNB003', 'Premium Beer', 'Local craft beer selection - rotating taps', 'Food & Beverage', 'fnb_beverages', 8.00, 3.50, 100, 20, '{"supplier": "Local Brewery", "lead_time": "3 days", "dietary_tags": [], "alcohol_content": "5%"}'),
('FNB004', 'Grilled Salmon', 'Atlantic salmon with lemon herb butter and seasonal vegetables', 'Food & Beverage', 'fnb_mains', 28.00, 12.00, 30, 5, '{"supplier": "Kitchen", "prep_time": "20 minutes", "dietary_tags": ["gluten-free"], "spice_level": 0, "cooking_time": 20}'),
('FNB005', 'Margherita Pizza', 'Wood-fired pizza with fresh mozzarella, tomatoes, and basil', 'Food & Beverage', 'fnb_mains', 18.00, 7.00, 40, 5, '{"supplier": "Kitchen", "prep_time": "25 minutes", "dietary_tags": ["vegetarian"], "spice_level": 0, "cooking_time": 25}'),
('FNB006', 'Chicken Wings', 'Buffalo style wings with blue cheese dressing', 'Food & Beverage', 'fnb_appetizers', 14.50, 6.00, 45, 8, '{"supplier": "Kitchen", "prep_time": "18 minutes", "dietary_tags": [], "spice_level": 2, "cooking_time": 18}'),
('FNB007', 'Spinach Artichoke Dip', 'Creamy dip served with tortilla chips', 'Food & Beverage', 'fnb_appetizers', 12.00, 4.50, 35, 5, '{"supplier": "Kitchen", "prep_time": "12 minutes", "dietary_tags": ["vegetarian"], "spice_level": 0, "cooking_time": 12}'),
('FNB008', 'Chocolate Lava Cake', 'Warm chocolate cake with molten center and vanilla ice cream', 'Food & Beverage', 'fnb_desserts', 9.50, 3.00, 25, 3, '{"supplier": "Kitchen", "prep_time": "15 minutes", "dietary_tags": [], "spice_level": 0, "cooking_time": 15}'),
('FNB009', 'Fresh Coffee', 'Locally roasted premium coffee blend', 'Food & Beverage', 'fnb_beverages', 3.50, 1.00, 200, 50, '{"supplier": "Local Roaster", "lead_time": "1 day", "dietary_tags": ["vegan"], "caffeine_content": "high"}'),
('FNB010', 'House Chardonnay', 'Crisp white wine from local vineyard', 'Food & Beverage', 'fnb_beverages', 12.00, 5.00, 60, 10, '{"supplier": "Local Vineyard", "lead_time": "7 days", "dietary_tags": ["vegan"], "alcohol_content": "13%"}'),
('FNB011', 'Veggie Burger', 'Plant-based patty with avocado and sprouts', 'Food & Beverage', 'fnb_mains', 15.00, 6.50, 35, 5, '{"supplier": "Kitchen", "prep_time": "15 minutes", "dietary_tags": ["vegan", "dairy-free"], "spice_level": 0, "cooking_time": 15}'),
('FNB012', 'Soup of the Day', 'Chef''s daily soup selection', 'Food & Beverage', 'fnb_soups', 8.50, 3.00, 40, 5, '{"supplier": "Kitchen", "prep_time": "5 minutes", "dietary_tags": [], "spice_level": 1, "cooking_time": 5}');

-- Insert Sample Events
INSERT INTO events (name, description, event_type, start_date, end_date, location, max_participants, registration_fee, organizer_id) VALUES
('Monthly Member Tournament', 'Competitive tournament for all skill levels', 'tournament', '2025-06-15 08:00:00', '2025-06-15 16:00:00', 'Championship Course', 60, 50.00, (SELECT id FROM members WHERE member_number = 'M001')),
('Summer Social Mixer', 'Casual networking event with dinner and drinks', 'social', '2025-07-20 18:00:00', '2025-07-20 22:00:00', 'Clubhouse Dining Room', 80, 25.00, (SELECT id FROM members WHERE member_number = 'M002')),
('Junior Golf Clinic', 'Golf instruction for young players', 'clinic', '2025-06-01 10:00:00', '2025-06-01 14:00:00', 'Practice Range', 20, 15.00, (SELECT id FROM members WHERE member_number = 'M004'));

-- Insert Sample Financial Transactions
INSERT INTO financial_transactions (transaction_type, member_id, account_id, amount, description, transaction_date, status, reference_number) VALUES
('membership_dues', (SELECT id FROM members WHERE member_number = 'M001'), (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), 500.00, 'Monthly membership dues - May 2025', '2025-05-01', 'completed', 'INV-2025-001'),
('membership_dues', (SELECT id FROM members WHERE member_number = 'M002'), (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), 350.00, 'Monthly membership dues - May 2025', '2025-05-01', 'completed', 'INV-2025-002'),
('pro_shop_sale', (SELECT id FROM members WHERE member_number = 'M003'), (SELECT id FROM chart_of_accounts WHERE account_code = '4100'), 54.99, 'Pro shop purchase - Golf balls', '2025-05-15', 'completed', 'SALE-2025-001'),
('tournament_fee', (SELECT id FROM members WHERE member_number = 'M001'), (SELECT id FROM chart_of_accounts WHERE account_code = '4300'), 50.00, 'Tournament entry fee', '2025-05-20', 'pending', 'TOUR-2025-001');

-- Insert Sample Staff
INSERT INTO staff (employee_id, first_name, last_name, email, phone, position, department, hire_date, salary, permissions) VALUES
('EMP001', 'James', 'Wilson', 'james.wilson@royalgolf.com', '+1-555-1001', 'General Manager', 'Administration', '2019-01-15', 85000.00, '{"admin": true, "financial": true, "member_management": true}'),
('EMP002', 'Maria', 'Garcia', 'maria.garcia@royalgolf.com', '+1-555-1002', 'Pro Shop Manager', 'Pro Shop', '2020-03-10', 45000.00, '{"pro_shop": true, "inventory": true}'),
('EMP003', 'David', 'Thompson', 'david.thompson@royalgolf.com', '+1-555-1003', 'Head Golf Professional', 'Golf Operations', '2018-06-01', 65000.00, '{"golf_operations": true, "tournaments": true, "instruction": true}'),
('EMP004', 'Lisa', 'Anderson', 'lisa.anderson@royalgolf.com', '+1-555-1004', 'Food & Beverage Manager', 'F&B', '2021-02-15', 50000.00, '{"fnb": true, "events": true}'),
('EMP005', 'Robert', 'Martinez', 'robert.martinez@royalgolf.com', '+1-555-1005', 'Course Superintendent', 'Maintenance', '2017-09-20', 60000.00, '{"maintenance": true, "equipment": true}');

-- Insert Sample Bookings
INSERT INTO bookings (member_id, tee_time_id, players_count, guest_names, status, total_amount, special_requests) VALUES
((SELECT id FROM members WHERE member_number = 'M001'), 
 (SELECT id FROM tee_times WHERE tee_time = '2025-05-30 08:00:00'), 
 4, ARRAY['Guest Player 1', 'Guest Player 2', 'Guest Player 3'], 'confirmed', 440.00, 'Cart for all players'),
((SELECT id FROM members WHERE member_number = 'M002'), 
 (SELECT id FROM tee_times WHERE tee_time = '2025-05-30 08:15:00'), 
 2, ARRAY['Spouse'], 'confirmed', 220.00, 'Prefer morning tee time');

-- Insert Sample Orders
INSERT INTO orders (order_number, member_id, order_type, status, subtotal, tax_amount, total_amount, payment_method) VALUES
('ORD-2025-001', (SELECT id FROM members WHERE member_number = 'M003'), 'pro_shop', 'completed', 54.99, 4.40, 59.39, 'credit_card'),
('ORD-2025-002', (SELECT id FROM members WHERE member_number = 'M004'), 'fnb', 'pending', 30.50, 2.44, 32.94, 'member_account');

-- Insert Sample Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2025-001'), 
 (SELECT id FROM products WHERE sku = 'GOLF001'), 1, 54.99, 54.99),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-002'), 
 (SELECT id FROM products WHERE sku = 'FNB001'), 1, 16.50, 16.50),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-002'), 
 (SELECT id FROM products WHERE sku = 'FNB002'), 1, 14.00, 14.00);

-- Insert Sample Messages
INSERT INTO messages (sender_id, recipient_id, subject, content, message_type) VALUES
((SELECT id FROM members WHERE member_number = 'M001'), 
 (SELECT id FROM members WHERE member_number = 'M002'), 
 'Golf Game This Weekend', 
 'Hi Sarah, would you like to join us for a round this Saturday morning? We have a 8:00 AM tee time.', 
 'direct'),
((SELECT id FROM members WHERE member_number = 'M002'), 
 (SELECT id FROM members WHERE member_number = 'M001'), 
 'Re: Golf Game This Weekend', 
 'Sounds great John! Count me in. Should I bring my own cart or share?', 
 'direct');

-- Insert Sample Notifications
INSERT INTO notifications (member_id, title, content, notification_type, priority) VALUES
((SELECT id FROM members WHERE member_number = 'M001'), 
 'Tee Time Confirmation', 
 'Your tee time for May 30th at 8:00 AM has been confirmed.', 
 'booking', 'normal'),
((SELECT id FROM members WHERE member_number = 'M002'), 
 'Monthly Statement Available', 
 'Your May 2025 statement is now available in your member portal.', 
 'billing', 'normal'),
((SELECT id FROM members WHERE member_number = 'M003'), 
 'Tournament Registration Open', 
 'Registration is now open for the Monthly Member Tournament on June 15th.', 
 'event', 'high');

-- Update tee time availability based on bookings
UPDATE tee_times SET available_spots = 0 WHERE id IN (
    SELECT tee_time_id FROM bookings WHERE status = 'confirmed'
);
