-- Royal Golf Club F&B Menu Data
-- Insert comprehensive F&B menu items into products table

-- Insert F&B Menu Items
INSERT INTO products (sku, name, description, category, subcategory, price, cost, stock_quantity, min_stock_level, is_active) VALUES

-- APPETIZERS & STARTERS - Sri Lankan Specialties
('FNB-APP-001', 'Isso Vadai', 'Crispy lentil fritters with prawns', 'fnb_appetizers', 'sri_lankan', 850.00, 320.00, 50, 5, true),
('FNB-APP-002', 'Fish Cutlets', 'Spiced fish croquettes with curry leaves', 'fnb_appetizers', 'sri_lankan', 750.00, 280.00, 40, 5, true),
('FNB-APP-003', 'Vegetable Roti', 'Thin flatbread with spiced vegetables', 'fnb_appetizers', 'sri_lankan', 450.00, 180.00, 30, 5, true),
('FNB-APP-004', 'Pol Sambol & Papadum', 'Coconut relish with crispy lentil wafers', 'fnb_appetizers', 'sri_lankan', 350.00, 140.00, 60, 10, true),
('FNB-APP-005', 'Ulundu Vadai', 'Black gram lentil donuts', 'fnb_appetizers', 'sri_lankan', 400.00, 150.00, 50, 5, true),
('FNB-APP-006', 'Isso Thel Dhala', 'Fried spiced prawns', 'fnb_appetizers', 'sri_lankan', 1200.00, 480.00, 25, 3, true),
('FNB-APP-007', 'Mutton Rolls', 'Pastry rolls filled with spiced mutton', 'fnb_appetizers', 'sri_lankan', 650.00, 260.00, 35, 5, true),
('FNB-APP-008', 'Chicken Lollipops Sri Lankan Style', 'Drumettes with curry spices', 'fnb_appetizers', 'sri_lankan', 750.00, 300.00, 40, 5, true),
('FNB-APP-009', 'Beef Smore', 'Sri Lankan beef curry puffs', 'fnb_appetizers', 'sri_lankan', 580.00, 230.00, 30, 5, true),
('FNB-APP-010', 'Koththu Roti Bites', 'Mini portions of chopped roti with curry', 'fnb_appetizers', 'sri_lankan', 650.00, 260.00, 25, 3, true),
('FNB-APP-011', 'Cuttlefish Curry Bites', 'Spiced cuttlefish in coconut curry', 'fnb_appetizers', 'sri_lankan', 950.00, 380.00, 20, 3, true),
('FNB-APP-012', 'String Hoppers with Curry', 'Steamed rice noodle cakes', 'fnb_appetizers', 'sri_lankan', 550.00, 220.00, 30, 5, true),
('FNB-APP-013', 'Hoppers (Plain)', 'Bowl-shaped fermented rice pancakes', 'fnb_appetizers', 'sri_lankan', 150.00, 60.00, 100, 10, true),
('FNB-APP-014', 'Egg Hoppers', 'Hoppers with egg cooked in center', 'fnb_appetizers', 'sri_lankan', 200.00, 80.00, 80, 10, true),
('FNB-APP-015', 'Coconut Prawns', 'Prawns in spiced coconut coating', 'fnb_appetizers', 'sri_lankan', 1150.00, 460.00, 20, 3, true),

-- APPETIZERS & STARTERS - Western
('FNB-APP-016', 'Buffalo Wings', 'Classic spicy chicken wings with ranch', 'fnb_appetizers', 'western', 980.00, 390.00, 50, 5, true),
('FNB-APP-017', 'Mozzarella Sticks', 'Breaded cheese sticks with marinara', 'fnb_appetizers', 'western', 850.00, 340.00, 40, 5, true),
('FNB-APP-018', 'Loaded Potato Skins', 'With bacon, cheese, and sour cream', 'fnb_appetizers', 'western', 920.00, 370.00, 30, 5, true),
('FNB-APP-019', 'Spinach & Artichoke Dip', 'Served with tortilla chips', 'fnb_appetizers', 'western', 750.00, 300.00, 25, 3, true),
('FNB-APP-020', 'Calamari Rings', 'Crispy fried squid with aioli', 'fnb_appetizers', 'western', 1100.00, 440.00, 30, 3, true),
('FNB-APP-021', 'Chicken Quesadillas', 'With peppers, onions, and cheese', 'fnb_appetizers', 'western', 880.00, 350.00, 35, 5, true),
('FNB-APP-022', 'Bruschetta', 'Toasted bread with tomato and basil', 'fnb_appetizers', 'western', 650.00, 260.00, 40, 5, true),
('FNB-APP-023', 'Shrimp Cocktail', 'Chilled prawns with cocktail sauce', 'fnb_appetizers', 'western', 1350.00, 540.00, 20, 3, true),
('FNB-APP-024', 'Nachos Grande', 'Loaded tortilla chips with all fixings', 'fnb_appetizers', 'western', 950.00, 380.00, 30, 5, true),
('FNB-APP-025', 'Bacon-Wrapped Scallops', 'Pan-seared with herb butter', 'fnb_appetizers', 'western', 1450.00, 580.00, 15, 2, true),
('FNB-APP-026', 'Stuffed Mushrooms', 'With cream cheese and herbs', 'fnb_appetizers', 'western', 780.00, 310.00, 25, 3, true),
('FNB-APP-027', 'Chicken Satay', 'Grilled skewers with peanut sauce', 'fnb_appetizers', 'western', 850.00, 340.00, 30, 5, true),
('FNB-APP-028', 'Mini Sliders', 'Beef patties with cheese and pickles', 'fnb_appetizers', 'western', 950.00, 380.00, 25, 3, true),
('FNB-APP-029', 'Onion Rings', 'Beer-battered and golden fried', 'fnb_appetizers', 'western', 650.00, 260.00, 40, 5, true),
('FNB-APP-030', 'Deviled Eggs', 'Classic preparation with paprika', 'fnb_appetizers', 'western', 580.00, 230.00, 30, 5, true),

-- SOUPS - Sri Lankan
('FNB-SOUP-001', 'Sour Fish Curry Soup', 'Tangy fish broth with vegetables', 'fnb_soups', 'sri_lankan', 650.00, 260.00, 30, 5, true),
('FNB-SOUP-002', 'Rasam', 'Spiced tamarind and tomato soup', 'fnb_soups', 'sri_lankan', 450.00, 180.00, 40, 5, true),
('FNB-SOUP-003', 'Chicken Soup Sri Lankan Style', 'With curry spices and coconut', 'fnb_soups', 'sri_lankan', 550.00, 220.00, 35, 5, true),
('FNB-SOUP-004', 'Lentil Soup (Parippu)', 'Yellow lentils with turmeric', 'fnb_soups', 'sri_lankan', 380.00, 150.00, 50, 10, true),
('FNB-SOUP-005', 'Crab Soup', 'Spiced crab bisque with coconut milk', 'fnb_soups', 'sri_lankan', 850.00, 340.00, 20, 3, true),

-- SOUPS - Western
('FNB-SOUP-006', 'Chicken Noodle Soup', 'Classic comfort soup', 'fnb_soups', 'western', 580.00, 230.00, 40, 5, true),
('FNB-SOUP-007', 'Tomato Basil Soup', 'Creamy tomato with fresh basil', 'fnb_soups', 'western', 520.00, 210.00, 45, 5, true),
('FNB-SOUP-008', 'French Onion Soup', 'With gruyere cheese crouton', 'fnb_soups', 'western', 650.00, 260.00, 30, 5, true),
('FNB-SOUP-009', 'Clam Chowder', 'New England style cream base', 'fnb_soups', 'western', 750.00, 300.00, 25, 3, true),
('FNB-SOUP-010', 'Minestrone', 'Italian vegetable and pasta soup', 'fnb_soups', 'western', 550.00, 220.00, 35, 5, true),
('FNB-SOUP-011', 'Mushroom Bisque', 'Creamy wild mushroom soup', 'fnb_soups', 'western', 620.00, 250.00, 30, 5, true),
('FNB-SOUP-012', 'Beef Barley Soup', 'Hearty soup with tender beef', 'fnb_soups', 'western', 680.00, 270.00, 25, 3, true),

-- SALADS - Traditional Sri Lankan
('FNB-SAL-001', 'Gotukola Sambol', 'Pennywort herb salad', 'fnb_salads', 'sri_lankan', 420.00, 170.00, 40, 5, true),
('FNB-SAL-002', 'Cucumber Curry', 'Spiced cucumber with coconut', 'fnb_salads', 'sri_lankan', 380.00, 150.00, 50, 10, true),
('FNB-SAL-003', 'Kos Mallum', 'Shredded jackfruit salad', 'fnb_salads', 'sri_lankan', 450.00, 180.00, 35, 5, true),
('FNB-SAL-004', 'Coconut Sambol', 'Fresh coconut with chili and lime', 'fnb_salads', 'sri_lankan', 320.00, 130.00, 60, 10, true),
('FNB-SAL-005', 'Green Bean Salad', 'With mustard seeds and curry leaves', 'fnb_salads', 'sri_lankan', 380.00, 150.00, 45, 5, true),

-- SALADS - Western
('FNB-SAL-006', 'Caesar Salad', 'Romaine, parmesan, croutons, anchovies', 'fnb_salads', 'western', 750.00, 300.00, 40, 5, true),
('FNB-SAL-007', 'Greek Salad', 'Mixed greens with feta and olives', 'fnb_salads', 'western', 680.00, 270.00, 35, 5, true),
('FNB-SAL-008', 'Cobb Salad', 'Chicken, bacon, eggs, blue cheese', 'fnb_salads', 'western', 950.00, 380.00, 25, 3, true),
('FNB-SAL-009', 'Spinach Salad', 'With strawberries and poppy seed dressing', 'fnb_salads', 'western', 720.00, 290.00, 30, 5, true),
('FNB-SAL-010', 'Niçoise Salad', 'Tuna, olives, eggs, green beans', 'fnb_salads', 'western', 850.00, 340.00, 25, 3, true),
('FNB-SAL-011', 'Caprese Salad', 'Tomato, mozzarella, basil', 'fnb_salads', 'western', 780.00, 310.00, 30, 5, true),
('FNB-SAL-012', 'Asian Chicken Salad', 'With sesame ginger dressing', 'fnb_salads', 'western', 850.00, 340.00, 25, 3, true),
('FNB-SAL-013', 'Waldorf Salad', 'Apples, celery, walnuts, mayo', 'fnb_salads', 'western', 650.00, 260.00, 30, 5, true),

-- MAIN COURSES - Sri Lankan Curries & Rice
('FNB-MAIN-001', 'Chicken Curry', 'Traditional Sri Lankan preparation', 'fnb_mains', 'sri_lankan_curry', 1250.00, 500.00, 40, 5, true),
('FNB-MAIN-002', 'Fish Curry', 'With coconut milk and curry leaves', 'fnb_mains', 'sri_lankan_curry', 1380.00, 550.00, 35, 5, true),
('FNB-MAIN-003', 'Beef Curry', 'Slow-cooked with aromatic spices', 'fnb_mains', 'sri_lankan_curry', 1450.00, 580.00, 30, 3, true),
('FNB-MAIN-004', 'Mutton Curry', 'Tender lamb in rich gravy', 'fnb_mains', 'sri_lankan_curry', 1650.00, 660.00, 25, 3, true),
('FNB-MAIN-005', 'Pork Curry', 'Spiced with black pepper and fennel', 'fnb_mains', 'sri_lankan_curry', 1350.00, 540.00, 30, 3, true),
('FNB-MAIN-006', 'Dhal Curry', 'Lentils in turmeric and coconut', 'fnb_mains', 'sri_lankan_curry', 650.00, 260.00, 50, 10, true),
('FNB-MAIN-007', 'Jackfruit Curry', 'Young jackfruit in spiced gravy', 'fnb_mains', 'sri_lankan_curry', 750.00, 300.00, 40, 5, true),
('FNB-MAIN-008', 'Potato Curry', 'With curry leaves and coconut', 'fnb_mains', 'sri_lankan_curry', 550.00, 220.00, 60, 10, true),
('FNB-MAIN-009', 'Green Bean Curry', 'In coconut milk', 'fnb_mains', 'sri_lankan_curry', 580.00, 230.00, 50, 10, true),
('FNB-MAIN-010', 'Eggplant Curry', 'Sri Lankan brinjal preparation', 'fnb_mains', 'sri_lankan_curry', 620.00, 250.00, 45, 5, true),
('FNB-MAIN-011', 'Rice & Curry Full Meal', 'Selection of 5 curries with rice', 'fnb_mains', 'sri_lankan_rice', 1650.00, 660.00, 30, 5, true),
('FNB-MAIN-012', 'Lamprais', 'Dutch Burgher rice packet in banana leaf', 'fnb_mains', 'sri_lankan_rice', 1450.00, 580.00, 25, 3, true),
('FNB-MAIN-013', 'Biriyani', 'Fragrant basmati rice with meat', 'fnb_mains', 'sri_lankan_rice', 1350.00, 540.00, 30, 5, true),
('FNB-MAIN-014', 'Koththu Roti', 'Chopped roti with vegetables and meat', 'fnb_mains', 'sri_lankan_rice', 1150.00, 460.00, 35, 5, true),

-- MAIN COURSES - Western
('FNB-MAIN-015', 'Grilled Ribeye Steak', '12oz with garlic butter', 'fnb_mains', 'steaks', 4500.00, 1800.00, 15, 2, true),
('FNB-MAIN-016', 'Filet Mignon', '8oz tenderloin with béarnaise', 'fnb_mains', 'steaks', 5200.00, 2080.00, 12, 2, true),
('FNB-MAIN-017', 'New York Strip', '10oz with herb crust', 'fnb_mains', 'steaks', 4200.00, 1680.00, 15, 2, true),
('FNB-MAIN-018', 'Grilled Salmon', 'Atlantic salmon with lemon dill', 'fnb_mains', 'seafood', 2950.00, 1180.00, 25, 3, true),
('FNB-MAIN-019', 'Lobster Tail', 'Butter-poached with drawn butter', 'fnb_mains', 'seafood', 5800.00, 2320.00, 10, 2, true),
('FNB-MAIN-020', 'Fish & Chips', 'Beer-battered cod with fries', 'fnb_mains', 'comfort_food', 1850.00, 740.00, 30, 5, true),
('FNB-MAIN-021', 'Chicken Parmesan', 'Breaded cutlet with marinara', 'fnb_mains', 'comfort_food', 2200.00, 880.00, 25, 3, true),
('FNB-MAIN-022', 'BBQ Ribs', 'Slow-cooked pork ribs with sauce', 'fnb_mains', 'comfort_food', 2650.00, 1060.00, 20, 3, true),

-- BURGERS & SANDWICHES
('FNB-BURG-001', 'Club Sandwich', 'Triple-decker with turkey and bacon', 'fnb_burgers', 'sandwiches', 1450.00, 580.00, 40, 5, true),
('FNB-BURG-002', 'Philly Cheesesteak', 'Sliced steak with peppers and cheese', 'fnb_burgers', 'sandwiches', 1650.00, 660.00, 30, 5, true),
('FNB-BURG-003', 'Classic Burger', '8oz beef patty with fixings', 'fnb_burgers', 'burgers', 1550.00, 620.00, 35, 5, true),
('FNB-BURG-004', 'Cheeseburger', 'With your choice of cheese', 'fnb_burgers', 'burgers', 1650.00, 660.00, 35, 5, true),
('FNB-BURG-005', 'BBQ Bacon Burger', 'With barbecue sauce and bacon', 'fnb_burgers', 'burgers', 1750.00, 700.00, 30, 5, true),

-- PIZZA
('FNB-PIZZA-001', 'Margherita Pizza', 'Tomato, mozzarella, basil', 'fnb_pizza', 'classic', 1450.00, 580.00, 30, 5, true),
('FNB-PIZZA-002', 'Pepperoni Pizza', 'Classic with pepperoni', 'fnb_pizza', 'classic', 1650.00, 660.00, 25, 3, true),
('FNB-PIZZA-003', 'Supreme Pizza', 'Loaded with multiple toppings', 'fnb_pizza', 'specialty', 1950.00, 780.00, 20, 3, true),
('FNB-PIZZA-004', 'Meat Lovers Pizza', 'Multiple meats and cheese', 'fnb_pizza', 'specialty', 2150.00, 860.00, 15, 2, true),

-- DESSERTS - Sri Lankan
('FNB-DES-001', 'Wattalappam', 'Coconut custard with jaggery', 'fnb_desserts', 'sri_lankan', 450.00, 180.00, 50, 10, true),
('FNB-DES-002', 'Kokis', 'Deep-fried crispy sweet spirals', 'fnb_desserts', 'sri_lankan', 380.00, 150.00, 60, 10, true),
('FNB-DES-003', 'Love Cake', 'Dutch Burgher honey cake', 'fnb_desserts', 'sri_lankan', 520.00, 210.00, 40, 5, true),
('FNB-DES-004', 'Bibikkan', 'Rich coconut cake with cashews', 'fnb_desserts', 'sri_lankan', 480.00, 190.00, 35, 5, true),

-- DESSERTS - Western
('FNB-DES-005', 'Chocolate Lava Cake', 'Warm cake with molten center', 'fnb_desserts', 'western', 650.00, 260.00, 30, 5, true),
('FNB-DES-006', 'Tiramisu', 'Classic Italian coffee dessert', 'fnb_desserts', 'western', 750.00, 300.00, 25, 3, true),
('FNB-DES-007', 'Cheesecake', 'New York style with berry sauce', 'fnb_desserts', 'western', 680.00, 270.00, 30, 5, true),
('FNB-DES-008', 'Crème Brûlée', 'Vanilla custard with caramelized sugar', 'fnb_desserts', 'western', 720.00, 290.00, 25, 3, true),

-- BEVERAGES - Traditional Sri Lankan
('FNB-BEV-001', 'King Coconut Water', 'Fresh from the nut', 'fnb_beverages', 'traditional', 250.00, 100.00, 100, 20, true),
('FNB-BEV-002', 'Faluda', 'Rose-flavored drink with noodles', 'fnb_beverages', 'traditional', 380.00, 150.00, 50, 10, true),
('FNB-BEV-003', 'Wood Apple Juice', 'Fresh tropical fruit juice', 'fnb_beverages', 'traditional', 320.00, 130.00, 60, 10, true),
('FNB-BEV-004', 'Lime Juice', 'Fresh squeezed with mint', 'fnb_beverages', 'traditional', 280.00, 110.00, 80, 15, true),

-- BEVERAGES - Tea & Coffee
('FNB-BEV-005', 'Ceylon Black Tea', 'Premium Sri Lankan tea', 'fnb_beverages', 'hot_drinks', 180.00, 70.00, 200, 50, true),
('FNB-BEV-006', 'Cappuccino', 'Espresso with steamed milk foam', 'fnb_beverages', 'hot_drinks', 350.00, 140.00, 100, 20, true),
('FNB-BEV-007', 'Latte', 'Espresso with steamed milk', 'fnb_beverages', 'hot_drinks', 380.00, 150.00, 100, 20, true),
('FNB-BEV-008', 'Mocha', 'Chocolate espresso drink', 'fnb_beverages', 'hot_drinks', 420.00, 170.00, 80, 15, true),

-- BEVERAGES - Soft Drinks
('FNB-BEV-009', 'Coca-Cola', 'Classic cola', 'fnb_beverages', 'soft_drinks', 180.00, 70.00, 200, 50, true),
('FNB-BEV-010', 'Sprite', 'Lemon-lime soda', 'fnb_beverages', 'soft_drinks', 180.00, 70.00, 200, 50, true),
('FNB-BEV-011', 'Orange Juice', 'Fresh squeezed', 'fnb_beverages', 'fresh_juices', 320.00, 130.00, 80, 15, true),
('FNB-BEV-012', 'Mango Juice', 'Rich tropical flavor', 'fnb_beverages', 'fresh_juices', 350.00, 140.00, 60, 10, true),

-- BEVERAGES - Smoothies
('FNB-BEV-013', 'Mango Smoothie', 'Blended mango with yogurt', 'fnb_beverages', 'smoothies', 450.00, 180.00, 40, 5, true),
('FNB-BEV-014', 'Strawberry Banana Smoothie', 'Classic fruit blend', 'fnb_beverages', 'smoothies', 420.00, 170.00, 40, 5, true),
('FNB-BEV-015', 'Chocolate Milkshake', 'Rich and creamy', 'fnb_beverages', 'milkshakes', 420.00, 170.00, 50, 10, true),

-- ALCOHOLIC BEVERAGES - Sri Lankan Spirits
('FNB-ALC-001', 'Arrack', 'Traditional coconut palm spirit', 'fnb_alcohol', 'local_spirits', 450.00, 180.00, 50, 10, true),
('FNB-ALC-002', 'Lion Lager', 'Sri Lankan beer', 'fnb_alcohol', 'local_beer', 380.00, 150.00, 100, 20, true),
('FNB-ALC-003', 'Anchor Beer', 'Local brewery beer', 'fnb_alcohol', 'local_beer', 350.00, 140.00, 100, 20, true),

-- ALCOHOLIC BEVERAGES - International
('FNB-ALC-004', 'Heineken', 'Dutch premium lager', 'fnb_alcohol', 'international_beer', 480.00, 190.00, 80, 15, true),
('FNB-ALC-005', 'Corona', 'Mexican beer with lime', 'fnb_alcohol', 'international_beer', 520.00, 210.00, 70, 15, true),
('FNB-ALC-006', 'Jack Daniel''s', 'Tennessee whiskey', 'fnb_alcohol', 'whiskey', 650.00, 260.00, 30, 5, true),
('FNB-ALC-007', 'Grey Goose', 'Premium French vodka', 'fnb_alcohol', 'vodka', 850.00, 340.00, 25, 3, true),

-- ALCOHOLIC BEVERAGES - Wine
('FNB-ALC-008', 'Chardonnay (Glass)', 'California white wine', 'fnb_alcohol', 'wine_white', 650.00, 260.00, 50, 10, true),
('FNB-ALC-009', 'Cabernet Sauvignon (Glass)', 'California red wine', 'fnb_alcohol', 'wine_red', 750.00, 300.00, 50, 10, true),
('FNB-ALC-010', 'Champagne (Glass)', 'French sparkling wine', 'fnb_alcohol', 'sparkling', 1200.00, 480.00, 30, 5, true),

-- ALCOHOLIC BEVERAGES - Cocktails
('FNB-ALC-011', 'Mojito', 'Rum, mint, lime, soda', 'fnb_alcohol', 'cocktails', 650.00, 260.00, 40, 5, true),
('FNB-ALC-012', 'Piña Colada', 'Rum, coconut, pineapple', 'fnb_alcohol', 'cocktails', 720.00, 290.00, 35, 5, true),
('FNB-ALC-013', 'Margarita', 'Tequila, lime, triple sec', 'fnb_alcohol', 'cocktails', 680.00, 270.00, 40, 5, true),
('FNB-ALC-014', 'Old Fashioned', 'Bourbon, sugar, bitters', 'fnb_alcohol', 'cocktails', 780.00, 310.00, 30, 5, true),

-- HOUSE SPECIALTY COCKTAILS
('FNB-ALC-015', 'Ceylon Spice Martini', 'Gin with local spices', 'fnb_alcohol', 'house_specials', 850.00, 340.00, 25, 3, true),
('FNB-ALC-016', 'Arrack Punch', 'Traditional Sri Lankan cocktail', 'fnb_alcohol', 'house_specials', 750.00, 300.00, 30, 5, true),
('FNB-ALC-017', 'Golf Club Gimlet', 'House twist on classic', 'fnb_alcohol', 'house_specials', 720.00, 290.00, 30, 5, true),
('FNB-ALC-018', '19th Hole Refresher', 'Bourbon-based cooler', 'fnb_alcohol', 'house_specials', 820.00, 330.00, 25, 3, true),
('FNB-ALC-019', 'Hole-in-One', 'Celebratory champagne cocktail', 'fnb_alcohol', 'house_specials', 950.00, 380.00, 20, 3, true);

-- Update the inventory_movements table to track initial F&B stock
INSERT INTO inventory_movements (product_id, movement_type, quantity_change, reference_type, notes)
SELECT 
    p.id,
    'adjustment',
    p.stock_quantity,
    'initial_stock',
    'Initial F&B menu stock entry'
FROM products p 
WHERE p.sku LIKE 'FNB-%' AND p.stock_quantity > 0;