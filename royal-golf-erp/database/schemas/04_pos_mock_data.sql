-- Royal Golf Club ERP - POS Mock Data
-- Sample data for F&B and Pro Shop items
-- PostgreSQL 15+ compatible

-- Insert sample F&B products
INSERT INTO products (sku, name, description, category, subcategory, price, cost, stock_quantity, min_stock_level, is_active) VALUES
-- Appetizers
('FNB001', 'Shrimp Cocktail', 'Fresh Gulf shrimp with classic cocktail sauce', 'fnb_appetizers', 'seafood', 16.99, 8.50, 25, 5, true),
('FNB002', 'Buffalo Wings', '8 piece crispy wings with buffalo sauce and ranch', 'fnb_appetizers', 'chicken', 12.99, 6.00, 50, 10, true),
('FNB003', 'Spinach Artichoke Dip', 'Creamy dip served with tortilla chips', 'fnb_appetizers', 'vegetarian', 10.99, 4.50, 30, 8, true),
('FNB004', 'Calamari Rings', 'Golden fried squid rings with marinara sauce', 'fnb_appetizers', 'seafood', 13.99, 7.00, 20, 5, true),
('FNB005', 'Loaded Nachos', 'Tortilla chips with cheese, jalapenos, and sour cream', 'fnb_appetizers', 'vegetarian', 11.99, 5.25, 40, 10, true),

-- Sandwiches & Burgers
('FNB006', 'Club House Burger', '8oz beef patty with lettuce, tomato, cheese, and fries', 'fnb_sandwiches', 'beef', 16.99, 8.50, 35, 8, true),
('FNB007', 'Grilled Chicken Sandwich', 'Marinated chicken breast with avocado and fries', 'fnb_sandwiches', 'chicken', 14.99, 7.50, 40, 10, true),
('FNB008', 'Fish & Chips', 'Beer battered cod with crispy fries and coleslaw', 'fnb_sandwiches', 'seafood', 18.99, 9.75, 25, 6, true),
('FNB009', 'BBQ Pulled Pork', 'Slow cooked pork with BBQ sauce on brioche bun', 'fnb_sandwiches', 'pork', 15.99, 8.00, 30, 7, true),
('FNB010', 'Veggie Wrap', 'Grilled vegetables with hummus in spinach tortilla', 'fnb_sandwiches', 'vegetarian', 12.99, 6.50, 25, 5, true),

-- Salads
('FNB011', 'Caesar Salad', 'Crisp romaine with parmesan, croutons, and dressing', 'fnb_salads', 'vegetarian', 11.99, 5.50, 45, 12, true),
('FNB012', 'Cobb Salad', 'Mixed greens with bacon, chicken, egg, and blue cheese', 'fnb_salads', 'chicken', 15.99, 8.25, 30, 8, true),
('FNB013', 'Greek Salad', 'Tomatoes, olives, feta cheese with olive oil dressing', 'fnb_salads', 'vegetarian', 13.99, 7.00, 35, 10, true),
('FNB014', 'Wedge Salad', 'Iceberg lettuce with bacon and blue cheese dressing', 'fnb_salads', 'vegetarian', 10.99, 5.25, 40, 12, true),

-- Entrees
('FNB015', 'Grilled Salmon', '8oz Atlantic salmon with rice and vegetables', 'fnb_entrees', 'seafood', 26.99, 14.50, 20, 5, true),
('FNB016', 'Ribeye Steak', '12oz USDA Prime with mashed potatoes and asparagus', 'fnb_entrees', 'beef', 34.99, 19.75, 15, 3, true),
('FNB017', 'Chicken Parmesan', 'Breaded chicken with marinara and mozzarella', 'fnb_entrees', 'chicken', 21.99, 11.50, 25, 6, true),
('FNB018', 'Pork Tenderloin', 'Herb crusted pork with apple chutney', 'fnb_entrees', 'pork', 23.99, 12.75, 18, 4, true),
('FNB019', 'Vegetarian Pasta', 'Penne with seasonal vegetables in garlic oil', 'fnb_entrees', 'vegetarian', 17.99, 8.50, 30, 8, true),

-- Beverages - Alcoholic
('FNB020', 'Draft Beer - Light', 'Domestic light beer on tap', 'fnb_beverages', 'beer', 5.99, 2.25, 100, 25, true),
('FNB021', 'Draft Beer - IPA', 'Local craft IPA on tap', 'fnb_beverages', 'beer', 7.99, 3.50, 80, 20, true),
('FNB022', 'House Wine - Red', 'Cabernet Sauvignon by the glass', 'fnb_beverages', 'wine', 8.99, 4.00, 60, 15, true),
('FNB023', 'House Wine - White', 'Chardonnay by the glass', 'fnb_beverages', 'wine', 8.99, 4.00, 60, 15, true),
('FNB024', 'Premium Whiskey', 'Top shelf whiskey neat or on rocks', 'fnb_beverages', 'spirits', 12.99, 6.50, 40, 10, true),

-- Beverages - Non-Alcoholic
('FNB025', 'Fresh Coffee', 'Premium blend served hot', 'fnb_beverages', 'hot', 3.99, 1.50, 200, 50, true),
('FNB026', 'Iced Tea', 'Freshly brewed sweet or unsweetened', 'fnb_beverages', 'cold', 2.99, 1.00, 150, 40, true),
('FNB027', 'Soft Drinks', 'Coca-Cola products', 'fnb_beverages', 'cold', 3.49, 1.25, 200, 50, true),
('FNB028', 'Fresh Orange Juice', 'Squeezed daily', 'fnb_beverages', 'cold', 4.99, 2.50, 80, 20, true),
('FNB029', 'Bottled Water', 'Premium spring water', 'fnb_beverages', 'cold', 2.49, 1.00, 300, 75, true),

-- Desserts
('FNB030', 'Chocolate Cake', 'Rich chocolate layer cake with ganache', 'fnb_desserts', 'chocolate', 8.99, 4.50, 15, 3, true),
('FNB031', 'Cheesecake', 'New York style with berry compote', 'fnb_desserts', 'cheese', 7.99, 4.00, 12, 3, true),
('FNB032', 'Ice Cream Sundae', 'Vanilla ice cream with toppings', 'fnb_desserts', 'ice_cream', 6.99, 3.25, 25, 8, true),
('FNB033', 'Apple Pie', 'Classic American pie with vanilla ice cream', 'fnb_desserts', 'fruit', 7.49, 3.75, 18, 4, true);

-- Insert sample Pro Shop products
INSERT INTO products (sku, name, description, category, subcategory, price, cost, stock_quantity, min_stock_level, is_active) VALUES
-- Golf Balls
('PRO001', 'Titleist Pro V1', 'Premium golf balls - dozen', 'proshop_balls', 'premium', 54.99, 32.50, 48, 12, true),
('PRO002', 'Callaway Chrome Soft', 'Tour performance golf balls - dozen', 'proshop_balls', 'premium', 49.99, 29.50, 36, 10, true),
('PRO003', 'TaylorMade TP5', 'Five-layer tour ball - dozen', 'proshop_balls', 'premium', 52.99, 31.25, 24, 8, true),
('PRO004', 'Bridgestone e6', 'Straight distance golf balls - dozen', 'proshop_balls', 'distance', 39.99, 24.50, 60, 15, true),
('PRO005', 'Srixon Soft Feel', 'Soft compression golf balls - dozen', 'proshop_balls', 'recreational', 29.99, 18.75, 72, 20, true),

-- Golf Clubs
('PRO006', 'Callaway Epic Driver', '460cc titanium driver with adjustable loft', 'proshop_clubs', 'drivers', 449.99, 275.00, 8, 2, true),
('PRO007', 'TaylorMade SIM2 Iron Set', '7 piece iron set (5-PW, AW)', 'proshop_clubs', 'irons', 899.99, 550.00, 6, 2, true),
('PRO008', 'Titleist Vokey Wedge', '56 degree sand wedge', 'proshop_clubs', 'wedges', 179.99, 110.00, 12, 3, true),
('PRO009', 'Odyssey White Hot Putter', 'Blade style putter with alignment aid', 'proshop_clubs', 'putters', 199.99, 125.00, 10, 3, true),
('PRO010', 'Ping G425 Hybrid', '4 hybrid rescue club', 'proshop_clubs', 'hybrids', 269.99, 165.00, 8, 2, true),

-- Golf Apparel - Men
('PRO011', 'Nike Golf Polo - Men', 'Dri-FIT performance polo shirt', 'proshop_apparel', 'mens_shirts', 69.99, 42.50, 24, 6, true),
('PRO012', 'Adidas Golf Pants - Men', 'Ultimate 365 tapered golf pants', 'proshop_apparel', 'mens_pants', 89.99, 55.00, 18, 5, true),
('PRO013', 'Under Armour Golf Shorts - Men', '10 inch inseam performance shorts', 'proshop_apparel', 'mens_shorts', 64.99, 39.50, 30, 8, true),
('PRO014', 'FootJoy Golf Shoes - Men', 'DryJoys Tour waterproof golf shoes', 'proshop_apparel', 'mens_shoes', 179.99, 110.00, 12, 3, true),
('PRO015', 'Titleist Hat - Men', 'Fitted tour cap with logo', 'proshop_apparel', 'mens_hats', 34.99, 21.50, 36, 10, true),

-- Golf Apparel - Women
('PRO016', 'Nike Golf Polo - Women', 'Dri-FIT performance polo shirt', 'proshop_apparel', 'womens_shirts', 69.99, 42.50, 20, 5, true),
('PRO017', 'Adidas Golf Skort - Women', 'Ultimate 365 golf skort with shorts', 'proshop_apparel', 'womens_bottoms', 79.99, 48.50, 16, 4, true),
('PRO018', 'Puma Golf Dress - Women', 'Sleeveless performance golf dress', 'proshop_apparel', 'womens_dresses', 94.99, 58.00, 12, 3, true),
('PRO019', 'FootJoy Golf Shoes - Women', 'Traditions spikeless golf shoes', 'proshop_apparel', 'womens_shoes', 149.99, 92.50, 10, 3, true),
('PRO020', 'Callaway Visor - Women', 'Adjustable performance visor', 'proshop_apparel', 'womens_hats', 29.99, 18.50, 24, 6, true),

-- Golf Accessories
('PRO021', 'Golf Glove - Left Hand', 'Premium cabretta leather glove', 'proshop_accessories', 'gloves', 24.99, 15.50, 48, 12, true),
('PRO022', 'Golf Towel', 'Microfiber towel with carabiner clip', 'proshop_accessories', 'towels', 19.99, 12.25, 60, 15, true),
('PRO023', 'Ball Markers Set', 'Magnetic ball markers - set of 3', 'proshop_accessories', 'markers', 14.99, 9.25, 72, 20, true),
('PRO024', 'Golf Tees', 'Wooden tees - pack of 50', 'proshop_accessories', 'tees', 7.99, 4.95, 120, 30, true),
('PRO025', 'Rangefinder', 'Laser rangefinder with slope compensation', 'proshop_accessories', 'technology', 299.99, 185.00, 6, 2, true),

-- Golf Bags
('PRO026', 'Stand Bag', 'Lightweight 14-way stand bag', 'proshop_bags', 'stand_bags', 199.99, 125.00, 8, 2, true),
('PRO027', 'Cart Bag', '14-way cart bag with multiple pockets', 'proshop_bags', 'cart_bags', 249.99, 155.00, 6, 2, true),
('PRO028', 'Travel Bag', 'Hard case travel bag with wheels', 'proshop_bags', 'travel_bags', 329.99, 205.00, 4, 1, true),
('PRO029', 'Sunday Bag', 'Lightweight carry bag', 'proshop_bags', 'carry_bags', 89.99, 55.50, 12, 3, true),

-- Gift Cards & Merchandise
('PRO030', 'Royal Golf Club Gift Card - $50', 'Gift card for pro shop purchases', 'proshop_gifts', 'gift_cards', 50.00, 50.00, 100, 25, true),
('PRO031', 'Royal Golf Club Gift Card - $100', 'Gift card for pro shop purchases', 'proshop_gifts', 'gift_cards', 100.00, 100.00, 100, 25, true),
('PRO032', 'Royal Golf Club Logo Shirt', 'Cotton shirt with embroidered logo', 'proshop_merchandise', 'shirts', 39.99, 24.50, 30, 8, true),
('PRO033', 'Royal Golf Club Coffee Mug', 'Ceramic mug with club logo', 'proshop_merchandise', 'drinkware', 16.99, 10.50, 48, 12, true),
('PRO034', 'Royal Golf Club Keychain', 'Metal keychain with logo', 'proshop_merchandise', 'accessories', 9.99, 6.25, 96, 25, true);

-- Insert sample POS terminals
INSERT INTO pos_terminals (terminal_name, terminal_code, location, ip_address, status) VALUES
('Pro Shop Main', 'PROSHOP-01', 'pro_shop', '192.168.1.101', 'active'),
('F&B Cashier', 'FNB-01', 'fnb', '192.168.1.102', 'active'),
('Clubhouse Bar', 'BAR-01', 'clubhouse', '192.168.1.103', 'active'),
('Cart Barn', 'CART-01', 'cart_barn', '192.168.1.104', 'active');

-- Insert sample staff members with appropriate departments
INSERT INTO staff (employee_id, first_name, last_name, email, phone, position, department, hire_date, salary, is_active, permissions) VALUES
('EMP001', 'Sarah', 'Johnson', 'sarah.johnson@royalgolf.com', '555-0101', 'Pro Shop Manager', 'pro_shop', '2023-01-15', 45000, true, '{"pos_sales": true, "inventory_management": true, "staff_supervision": true}'),
('EMP002', 'Mike', 'Chen', 'mike.chen@royalgolf.com', '555-0102', 'F&B Manager', 'fnb', '2023-02-01', 42000, true, '{"pos_sales": true, "inventory_management": true, "staff_supervision": true}'),
('EMP003', 'Lisa', 'Rodriguez', 'lisa.rodriguez@royalgolf.com', '555-0103', 'Cashier', 'pro_shop', '2023-03-10', 32000, true, '{"pos_sales": true, "pos_refund_50": true}'),
('EMP004', 'David', 'Wilson', 'david.wilson@royalgolf.com', '555-0104', 'Server', 'fnb', '2023-04-05', 28000, true, '{"pos_sales": true, "table_service": true}'),
('EMP005', 'Emily', 'Davis', 'emily.davis@royalgolf.com', '555-0105', 'Bartender', 'fnb', '2023-05-20', 35000, true, '{"pos_sales": true, "alcohol_service": true}'),
('EMP006', 'James', 'Brown', 'james.brown@royalgolf.com', '555-0106', 'Cart Attendant', 'maintenance', '2023-06-15', 30000, true, '{"cart_maintenance": true, "course_setup": true}');

-- Insert sample members for testing
INSERT INTO members (member_number, first_name, last_name, email, phone, membership_tier_id, handicap_index, join_date, status) VALUES
('M001', 'Robert', 'Smith', 'robert.smith@email.com', '555-1001', (SELECT id FROM membership_tiers LIMIT 1), 12.4, '2020-01-15', 'active'),
('M002', 'Jennifer', 'Williams', 'jennifer.williams@email.com', '555-1002', (SELECT id FROM membership_tiers LIMIT 1), 18.7, '2021-03-22', 'active'),
('M003', 'Michael', 'Johnson', 'michael.johnson@email.com', '555-1003', (SELECT id FROM membership_tiers LIMIT 1), 8.2, '2019-07-10', 'active'),
('M004', 'Jessica', 'Taylor', 'jessica.taylor@email.com', '555-1004', (SELECT id FROM membership_tiers LIMIT 1), 22.1, '2022-02-14', 'active'),
('M005', 'Christopher', 'Anderson', 'christopher.anderson@email.com', '555-1005', (SELECT id FROM membership_tiers LIMIT 1), 15.6, '2020-11-30', 'active');

-- Create sample membership tier if none exists
INSERT INTO membership_tiers (name, description, monthly_dues, initiation_fee, benefits, max_guests, booking_priority) 
SELECT 'Standard', 'Standard golf membership', 150.00, 500.00, '{"cart_included": false, "guest_rounds": 4}', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM membership_tiers LIMIT 1);

-- Update member records to reference the membership tier
UPDATE members SET membership_tier_id = (SELECT id FROM membership_tiers WHERE name = 'Standard' LIMIT 1) 
WHERE membership_tier_id IS NULL;