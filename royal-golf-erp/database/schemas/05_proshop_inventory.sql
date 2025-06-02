-- Royal Golf Club ERP - Pro Shop Inventory Data
-- Real pro shop inventory based on PRO_SHOP_INVENTORY_LIST.md
-- PostgreSQL 15+ compatible

-- Clear existing mock pro shop data (keep F&B items)
DELETE FROM products WHERE category LIKE 'proshop_%';

-- Insert Golf Clubs - Drivers
INSERT INTO products (sku, name, description, category, subcategory, price, cost, stock_quantity, min_stock_level, is_active) VALUES
('PRO-DRV-001', 'Callaway Rogue ST MAX Driver', '460cc titanium driver with adjustable loft', 'proshop_clubs', 'drivers', 192000, 115200, 5, 2, true),
('PRO-DRV-002', 'TaylorMade Stealth 2 Driver', 'Carbon face driver with speed pocket', 'proshop_clubs', 'drivers', 208000, 124800, 4, 2, true),
('PRO-DRV-003', 'Ping G430 MAX Driver', 'Forgiving driver with sound dampening', 'proshop_clubs', 'drivers', 200000, 120000, 6, 2, true),
('PRO-DRV-004', 'Titleist TSR3 Driver', 'Precision driver with SureFit adjustability', 'proshop_clubs', 'drivers', 224000, 134400, 3, 1, true),
('PRO-DRV-005', 'Cobra LTDx Driver', 'Lightweight driver with PWR-COR technology', 'proshop_clubs', 'drivers', 176000, 105600, 4, 2, true),
('PRO-DRV-006', 'Wilson Staff D9 Driver', 'Game improvement driver', 'proshop_clubs', 'drivers', 128000, 76800, 8, 3, true),
('PRO-DRV-007', 'Beginner Driver Set', 'Complete beginner driver package', 'proshop_clubs', 'drivers', 48000, 28800, 12, 5, true),

-- Insert Golf Clubs - Fairway Woods
('PRO-FW-001', 'TaylorMade Stealth 2 Fairway Wood', 'Carbon crown fairway wood', 'proshop_clubs', 'fairway_woods', 144000, 86400, 6, 2, true),
('PRO-FW-002', 'Callaway Rogue ST MAX Fairway Wood', 'AI designed fairway wood', 'proshop_clubs', 'fairway_woods', 136000, 81600, 5, 2, true),
('PRO-FW-003', 'Ping G430 Fairway Wood', 'Versatile fairway wood', 'proshop_clubs', 'fairway_woods', 152000, 91200, 4, 2, true),
('PRO-FW-004', 'Titleist TSR2 Fairway Wood', 'Tour-inspired fairway wood', 'proshop_clubs', 'fairway_woods', 160000, 96000, 3, 1, true),
('PRO-FW-005', 'Cobra F-MAX Airspeed Fairway Wood', 'Lightweight fairway wood', 'proshop_clubs', 'fairway_woods', 96000, 57600, 8, 3, true),

-- Insert Golf Clubs - Hybrids
('PRO-HYB-001', 'TaylorMade Stealth 2 Rescue', 'Versatile hybrid rescue club', 'proshop_clubs', 'hybrids', 112000, 67200, 6, 2, true),
('PRO-HYB-002', 'Callaway Rogue ST MAX OS Hybrid', 'Oversized hybrid for forgiveness', 'proshop_clubs', 'hybrids', 104000, 62400, 5, 2, true),
('PRO-HYB-003', 'Ping G430 Hybrid', 'High launching hybrid', 'proshop_clubs', 'hybrids', 120000, 72000, 4, 2, true),
('PRO-HYB-004', 'Cleveland Launcher XL Halo Hybrid', 'Easy to hit hybrid', 'proshop_clubs', 'hybrids', 88000, 52800, 8, 3, true),
('PRO-HYB-005', 'Wilson Staff D9 Hybrid', 'Distance hybrid', 'proshop_clubs', 'hybrids', 72000, 43200, 10, 4, true),

-- Insert Golf Clubs - Iron Sets
('PRO-IRN-001', 'Titleist T300 Iron Set (5-PW)', 'Distance iron set with max forgiveness', 'proshop_clubs', 'iron_sets', 480000, 288000, 3, 1, true),
('PRO-IRN-002', 'TaylorMade Stealth 2 Iron Set', 'Speed pocket iron set', 'proshop_clubs', 'iron_sets', 432000, 259200, 4, 1, true),
('PRO-IRN-003', 'Callaway Rogue ST MAX OS Iron Set', 'Oversized iron set', 'proshop_clubs', 'iron_sets', 400000, 240000, 5, 2, true),
('PRO-IRN-004', 'Ping G430 Iron Set', 'Consistent iron set', 'proshop_clubs', 'iron_sets', 456000, 273600, 3, 1, true),
('PRO-IRN-005', 'Mizuno JPX923 Hot Metal Iron Set', 'Forged iron set', 'proshop_clubs', 'iron_sets', 416000, 249600, 2, 1, true),
('PRO-IRN-006', 'Cleveland Launcher XL Iron Set', 'Game improvement iron set', 'proshop_clubs', 'iron_sets', 320000, 192000, 6, 2, true),
('PRO-IRN-007', 'Wilson Staff D9 Iron Set', 'Value iron set', 'proshop_clubs', 'iron_sets', 256000, 153600, 8, 3, true),
('PRO-IRN-008', 'Beginner Iron Set (6-PW)', 'Complete beginner iron package', 'proshop_clubs', 'iron_sets', 96000, 57600, 15, 5, true),

-- Insert Golf Clubs - Wedges
('PRO-WDG-001', 'Titleist Vokey SM9 Wedge', 'Tour proven wedge', 'proshop_clubs', 'wedges', 72000, 43200, 12, 4, true),
('PRO-WDG-002', 'Callaway Jaws MD5 Wedge', 'Aggressive groove wedge', 'proshop_clubs', 'wedges', 64000, 38400, 15, 5, true),
('PRO-WDG-003', 'TaylorMade Hi-Toe 3 Wedge', 'High toe wedge design', 'proshop_clubs', 'wedges', 68000, 40800, 10, 3, true),
('PRO-WDG-004', 'Cleveland RTX 6 ZipCore Wedge', 'ZipCore technology wedge', 'proshop_clubs', 'wedges', 60000, 36000, 18, 6, true),
('PRO-WDG-005', 'Ping Glide 4.0 Wedge', 'Versatile wedge', 'proshop_clubs', 'wedges', 56000, 33600, 20, 7, true),

-- Insert Golf Clubs - Putters
('PRO-PUT-001', 'Scotty Cameron Special Select Newport', 'Premium milled putter', 'proshop_clubs', 'putters', 176000, 105600, 3, 1, true),
('PRO-PUT-002', 'Odyssey White Hot OG Putter', 'White Hot insert putter', 'proshop_clubs', 'putters', 80000, 48000, 8, 3, true),
('PRO-PUT-003', 'TaylorMade Spider Tour X Putter', 'High MOI putter', 'proshop_clubs', 'putters', 120000, 72000, 5, 2, true),
('PRO-PUT-004', 'Ping PLD Milled Anser Putter', 'Precision milled putter', 'proshop_clubs', 'putters', 144000, 86400, 4, 2, true),
('PRO-PUT-005', 'Callaway Odyssey Tri-Hot 5K Putter', 'Triple track putter', 'proshop_clubs', 'putters', 64000, 38400, 10, 3, true),
('PRO-PUT-006', 'Wilson Staff Infinite Putter', 'Alignment aid putter', 'proshop_clubs', 'putters', 48000, 28800, 12, 4, true),

-- Insert Golf Bags - Cart Bags
('PRO-BAG-001', 'Titleist Players 4 Plus StaDry Cart Bag', 'Waterproof cart bag', 'proshop_bags', 'cart_bags', 112000, 67200, 6, 2, true),
('PRO-BAG-002', 'Callaway Chev 14 Cart Bag', '14-way divider cart bag', 'proshop_bags', 'cart_bags', 96000, 57600, 8, 3, true),
('PRO-BAG-003', 'TaylorMade Pro Cart 8.0 Bag', 'Professional cart bag', 'proshop_bags', 'cart_bags', 88000, 52800, 5, 2, true),
('PRO-BAG-004', 'Ping Pioneer Cart Bag', 'Durable cart bag', 'proshop_bags', 'cart_bags', 104000, 62400, 4, 2, true),
('PRO-BAG-005', 'Sun Mountain C-130 Cart Bag', 'Lightweight cart bag', 'proshop_bags', 'cart_bags', 80000, 48000, 10, 3, true),

-- Insert Golf Bags - Stand Bags
('PRO-BAG-006', 'Titleist Players 4 Plus StaDry Stand Bag', 'Waterproof stand bag', 'proshop_bags', 'stand_bags', 128000, 76800, 5, 2, true),
('PRO-BAG-007', 'Ping Hoofer Stand Bag', 'Lightweight stand bag', 'proshop_bags', 'stand_bags', 112000, 67200, 6, 2, true),
('PRO-BAG-008', 'TaylorMade FlexTech Stand Bag', 'Flexible stand system', 'proshop_bags', 'stand_bags', 96000, 57600, 8, 3, true),
('PRO-BAG-009', 'Callaway Hyper Dry C Stand Bag', 'Waterproof stand bag', 'proshop_bags', 'stand_bags', 104000, 62400, 4, 2, true),
('PRO-BAG-010', 'Sun Mountain 4.5 LS Stand Bag', 'Lightweight stand bag', 'proshop_bags', 'stand_bags', 88000, 52800, 7, 3, true),

-- Insert Golf Bags - Travel Bags
('PRO-BAG-011', 'Club Glove Last Bag Collegiate', 'Premium travel bag', 'proshop_bags', 'travel_bags', 176000, 105600, 2, 1, true),
('PRO-BAG-012', 'Titleist Essential Travel Cover', 'Essential travel protection', 'proshop_bags', 'travel_bags', 144000, 86400, 3, 1, true),
('PRO-BAG-013', 'TaylorMade Players Travel Cover', 'Player grade travel bag', 'proshop_bags', 'travel_bags', 128000, 76800, 4, 2, true),
('PRO-BAG-014', 'Callaway Clubhouse Travel Bag', 'Club travel bag', 'proshop_bags', 'travel_bags', 112000, 67200, 5, 2, true),

-- Insert Golf Balls - Premium
('PRO-BALL-001', 'Titleist Pro V1 (Dozen)', 'Tour performance golf ball', 'proshop_balls', 'premium', 19200, 11520, 50, 15, true),
('PRO-BALL-002', 'Titleist Pro V1x (Dozen)', 'High flight tour ball', 'proshop_balls', 'premium', 19200, 11520, 45, 15, true),
('PRO-BALL-003', 'TaylorMade TP5 (Dozen)', 'Five-layer tour ball', 'proshop_balls', 'premium', 18400, 11040, 40, 12, true),
('PRO-BALL-004', 'TaylorMade TP5x (Dozen)', 'Firmer five-layer ball', 'proshop_balls', 'premium', 18400, 11040, 40, 12, true),
('PRO-BALL-005', 'Callaway Chrome Soft (Dozen)', 'Soft feel tour ball', 'proshop_balls', 'premium', 17600, 10560, 60, 20, true),
('PRO-BALL-006', 'Bridgestone Tour B XS (Dozen)', 'Tour level ball', 'proshop_balls', 'premium', 16800, 10080, 35, 10, true),

-- Insert Golf Balls - Mid-Range
('PRO-BALL-007', 'Titleist Tour Speed (Dozen)', 'Fast ball for distance', 'proshop_balls', 'mid_range', 12800, 7680, 80, 25, true),
('PRO-BALL-008', 'TaylorMade Tour Response (Dozen)', 'Tour inspired ball', 'proshop_balls', 'mid_range', 11200, 6720, 90, 30, true),
('PRO-BALL-009', 'Callaway ERC Soft (Dozen)', 'Soft compression ball', 'proshop_balls', 'mid_range', 12000, 7200, 70, 25, true),
('PRO-BALL-010', 'Srixon Soft Feel (Dozen)', 'Soft feel ball', 'proshop_balls', 'mid_range', 9600, 5760, 100, 35, true),
('PRO-BALL-011', 'Bridgestone e6 (Dozen)', 'Straight distance ball', 'proshop_balls', 'mid_range', 10400, 6240, 85, 30, true),

-- Insert Golf Balls - Value
('PRO-BALL-012', 'Wilson Staff Fifty Elite (Dozen)', 'Value performance ball', 'proshop_balls', 'value', 6400, 3840, 120, 40, true),
('PRO-BALL-013', 'Top Flite Gamer (Dozen)', 'Game improvement ball', 'proshop_balls', 'value', 4800, 2880, 150, 50, true),
('PRO-BALL-014', 'Pinnacle Rush (Dozen)', 'Distance ball', 'proshop_balls', 'value', 5600, 3360, 130, 45, true),
('PRO-BALL-015', 'Nitro Maximum Distance (15-pack)', 'Maximum distance ball', 'proshop_balls', 'value', 4000, 2400, 180, 60, true),

-- Insert Golf Apparel - Shirts
('PRO-APP-001', 'Nike Dri-FIT Victory Polo', 'Performance polo shirt', 'proshop_apparel', 'shirts', 11200, 6720, 30, 10, true),
('PRO-APP-002', 'Adidas Ultimate365 Polo', 'Ultimate performance polo', 'proshop_apparel', 'shirts', 9600, 5760, 35, 12, true),
('PRO-APP-003', 'Under Armour Performance Polo', 'Performance fabric polo', 'proshop_apparel', 'shirts', 10400, 6240, 25, 8, true),
('PRO-APP-004', 'Titleist Players Polo', 'Tour player polo', 'proshop_apparel', 'shirts', 12800, 7680, 20, 7, true),
('PRO-APP-005', 'Callaway Opti-Dri Polo', 'Moisture wicking polo', 'proshop_apparel', 'shirts', 8800, 5280, 40, 15, true),
('PRO-APP-006', 'Puma CloudSpun Polo', 'Soft performance polo', 'proshop_apparel', 'shirts', 8000, 4800, 45, 15, true),

-- Insert Golf Apparel - Pants & Shorts
('PRO-APP-007', 'Nike Dri-FIT UV Chino Pants', 'UV protection chino pants', 'proshop_apparel', 'pants', 14400, 8640, 20, 7, true),
('PRO-APP-008', 'Adidas Ultimate365 Pants', 'Performance golf pants', 'proshop_apparel', 'pants', 12800, 7680, 18, 6, true),
('PRO-APP-009', 'Under Armour Match Play Shorts', 'Performance golf shorts', 'proshop_apparel', 'shorts', 9600, 5760, 35, 12, true),
('PRO-APP-010', 'Titleist Players Golf Shorts', 'Tour player shorts', 'proshop_apparel', 'shorts', 11200, 6720, 25, 8, true),
('PRO-APP-011', 'Callaway Opti-Dri Shorts', 'Moisture wicking shorts', 'proshop_apparel', 'shorts', 8000, 4800, 40, 15, true),
('PRO-APP-012', 'Puma Jackpot Shorts', 'Style golf shorts', 'proshop_apparel', 'shorts', 7200, 4320, 50, 18, true),

-- Insert Golf Apparel - Outerwear
('PRO-APP-013', 'Nike Storm-FIT Rain Jacket', 'Waterproof rain jacket', 'proshop_apparel', 'outerwear', 20800, 12480, 10, 3, true),
('PRO-APP-014', 'Adidas Rain Ready Jacket', 'Rain ready jacket', 'proshop_apparel', 'outerwear', 16000, 9600, 12, 4, true),
('PRO-APP-015', 'Under Armour Storm Windbreaker', 'Storm windbreaker', 'proshop_apparel', 'outerwear', 12800, 7680, 15, 5, true),
('PRO-APP-016', 'Titleist Wind Vest', 'Wind resistant vest', 'proshop_apparel', 'outerwear', 14400, 8640, 8, 3, true),
('PRO-APP-017', 'Callaway Storm Proof Jacket', 'Storm proof jacket', 'proshop_apparel', 'outerwear', 18400, 11040, 6, 2, true),

-- Insert Golf Apparel - Hats & Visors
('PRO-APP-018', 'Nike Legacy91 Golf Hat', 'Classic golf hat', 'proshop_apparel', 'hats', 4800, 2880, 60, 20, true),
('PRO-APP-019', 'Adidas Tour Visor', 'Performance visor', 'proshop_apparel', 'hats', 4000, 2400, 80, 25, true),
('PRO-APP-020', 'Under Armour Jordan Spieth Hat', 'Signature player hat', 'proshop_apparel', 'hats', 5600, 3360, 40, 15, true),
('PRO-APP-021', 'Titleist Tour Performance Hat', 'Tour performance hat', 'proshop_apparel', 'hats', 6400, 3840, 30, 10, true),
('PRO-APP-022', 'Callaway TA Performance Hat', 'Technical performance hat', 'proshop_apparel', 'hats', 4800, 2880, 50, 18, true),

-- Insert Golf Shoes - Spiked
('PRO-SHOE-001', 'Nike Air Zoom Infinity Tour', 'Tour level spiked shoes', 'proshop_shoes', 'spiked', 24000, 14400, 15, 5, true),
('PRO-SHOE-002', 'Adidas CodeChaos 22', 'Performance spiked shoes', 'proshop_shoes', 'spiked', 20800, 12480, 18, 6, true),
('PRO-SHOE-003', 'FootJoy Pro/SL', 'Professional spiked shoes', 'proshop_shoes', 'spiked', 22400, 13440, 12, 4, true),
('PRO-SHOE-004', 'Under Armour HOVR Drive', 'HOVR technology shoes', 'proshop_shoes', 'spiked', 19200, 11520, 20, 7, true),
('PRO-SHOE-005', 'Puma Ignite Fasten8', 'Fasten8 closure system', 'proshop_shoes', 'spiked', 16000, 9600, 25, 8, true),

-- Insert Golf Shoes - Spikeless
('PRO-SHOE-006', 'Nike Roshe G', 'Casual spikeless shoes', 'proshop_shoes', 'spikeless', 12800, 7680, 30, 10, true),
('PRO-SHOE-007', 'Adidas Tech Response SL', 'Technical spikeless shoes', 'proshop_shoes', 'spikeless', 11200, 6720, 35, 12, true),
('PRO-SHOE-008', 'FootJoy Flex', 'Flexible spikeless shoes', 'proshop_shoes', 'spikeless', 14400, 8640, 25, 8, true),
('PRO-SHOE-009', 'Skechers Go Golf Elite 4', 'Comfort spikeless shoes', 'proshop_shoes', 'spikeless', 9600, 5760, 40, 15, true),
('PRO-SHOE-010', 'Puma Grip Fusion', 'Fusion grip technology', 'proshop_shoes', 'spikeless', 8800, 5280, 45, 15, true),

-- Insert Gloves
('PRO-GLV-001', 'FootJoy StaSof (Single)', 'Premium leather glove', 'proshop_gloves', 'leather', 4800, 2880, 100, 30, true),
('PRO-GLV-002', 'Titleist Players Glove', 'Tour player glove', 'proshop_gloves', 'leather', 5600, 3360, 80, 25, true),
('PRO-GLV-003', 'Callaway OptiGrip Glove', 'Enhanced grip glove', 'proshop_gloves', 'synthetic', 4000, 2400, 120, 40, true),
('PRO-GLV-004', 'TaylorMade Tour Preferred Glove', 'Tour preferred glove', 'proshop_gloves', 'leather', 4800, 2880, 90, 30, true),
('PRO-GLV-005', 'Nike Tour Classic Glove', 'Classic tour glove', 'proshop_gloves', 'leather', 3200, 1920, 150, 50, true),

-- Insert Golf Accessories - Rangefinders & GPS
('PRO-ACC-001', 'Bushnell Tour V5 Rangefinder', 'Precision laser rangefinder', 'proshop_accessories', 'rangefinders', 112000, 67200, 8, 3, true),
('PRO-ACC-002', 'Garmin Approach S62 GPS Watch', 'Premium GPS watch', 'proshop_accessories', 'gps', 192000, 115200, 4, 2, true),
('PRO-ACC-003', 'Shot Scope V3 GPS Watch', 'Performance tracking watch', 'proshop_accessories', 'gps', 80000, 48000, 6, 2, true),
('PRO-ACC-004', 'Bushnell Phantom 2 GPS', 'Compact GPS device', 'proshop_accessories', 'gps', 48000, 28800, 12, 4, true),
('PRO-ACC-005', 'Voice Caddie T9 GPS', 'Voice GPS device', 'proshop_accessories', 'gps', 32000, 19200, 15, 5, true),

-- Insert Golf Accessories - Training Aids
('PRO-ACC-006', 'Swing Analyzer (Garmin TruSwing)', 'Swing analysis device', 'proshop_accessories', 'training', 64000, 38400, 10, 3, true),
('PRO-ACC-007', 'Putting Mat (6ft Premium)', 'Premium putting practice mat', 'proshop_accessories', 'training', 16000, 9600, 20, 7, true),
('PRO-ACC-008', 'Alignment Sticks (Set of 2)', 'Training alignment sticks', 'proshop_accessories', 'training', 4800, 2880, 50, 15, true),
('PRO-ACC-009', 'Impact Tape (Roll)', 'Impact analysis tape', 'proshop_accessories', 'training', 1600, 960, 100, 30, true),
('PRO-ACC-010', 'Swing Tempo Trainer', 'Tempo training device', 'proshop_accessories', 'training', 8000, 4800, 30, 10, true),
('PRO-ACC-011', 'Putting Mirror', 'Putting alignment mirror', 'proshop_accessories', 'training', 6400, 3840, 25, 8, true),

-- Insert Golf Accessories - Tees & Ball Markers
('PRO-ACC-012', 'Wooden Tees (Bag of 100)', 'Traditional wooden tees', 'proshop_accessories', 'tees', 800, 480, 200, 50, true),
('PRO-ACC-013', 'Pride Professional Tees (Bag of 50)', 'Professional grade tees', 'proshop_accessories', 'tees', 1600, 960, 150, 40, true),
('PRO-ACC-014', 'Castle Tees Plastic (Bag of 20)', 'Durable plastic tees', 'proshop_accessories', 'tees', 1200, 720, 180, 60, true),
('PRO-ACC-015', 'Ball Markers (Set of 3)', 'Premium ball markers', 'proshop_accessories', 'markers', 2400, 1440, 100, 30, true),
('PRO-ACC-016', 'Divot Tool with Ball Marker', 'Combination divot tool', 'proshop_accessories', 'markers', 3200, 1920, 80, 25, true),

-- Insert Golf Accessories - Towels & Cleaning
('PRO-ACC-017', 'Titleist Players Towel', 'Premium golf towel', 'proshop_accessories', 'towels', 4800, 2880, 60, 20, true),
('PRO-ACC-018', 'Callaway Tri-Fold Towel', 'Convenient tri-fold design', 'proshop_accessories', 'towels', 3200, 1920, 80, 25, true),
('PRO-ACC-019', 'Club Cleaning Kit', 'Complete club cleaning kit', 'proshop_accessories', 'cleaning', 6400, 3840, 40, 15, true),
('PRO-ACC-020', 'Ball Washer (Portable)', 'Portable ball washer', 'proshop_accessories', 'cleaning', 4000, 2400, 50, 18, true),
('PRO-ACC-021', 'Groove Cleaner Tool', 'Club groove cleaning tool', 'proshop_accessories', 'cleaning', 1600, 960, 120, 40, true),

-- Insert Golf Accessories - Umbrellas
('PRO-ACC-022', 'Titleist Tour Single Canopy Umbrella', 'Tour grade umbrella', 'proshop_accessories', 'umbrellas', 12800, 7680, 25, 8, true),
('PRO-ACC-023', 'Callaway 60" Golf Umbrella', 'Large golf umbrella', 'proshop_accessories', 'umbrellas', 9600, 5760, 35, 12, true),
('PRO-ACC-024', 'TaylorMade Single Canopy Umbrella', 'Single canopy umbrella', 'proshop_accessories', 'umbrellas', 8000, 4800, 40, 15, true),
('PRO-ACC-025', 'Nike 62" Windproof Umbrella', 'Windproof golf umbrella', 'proshop_accessories', 'umbrellas', 11200, 6720, 30, 10, true),

-- Insert Course Accessories - Push/Pull Carts
('PRO-CART-001', 'Clicgear 4.0 Push Cart', 'Premium push cart', 'proshop_carts', 'push_carts', 80000, 48000, 8, 3, true),
('PRO-CART-002', 'Sun Mountain Speed Cart GX', 'Speed cart with accessories', 'proshop_carts', 'push_carts', 64000, 38400, 10, 4, true),
('PRO-CART-003', 'Bag Boy Express DLX Pro', 'Deluxe push cart', 'proshop_carts', 'push_carts', 48000, 28800, 12, 5, true),
('PRO-CART-004', 'CaddyTek SuperLite Deluxe', 'Lightweight push cart', 'proshop_carts', 'push_carts', 32000, 19200, 15, 6, true),

-- Insert Course Accessories - Coolers & Hydration
('PRO-COOL-001', 'YETI Roadie 24 Cooler', 'Premium portable cooler', 'proshop_coolers', 'coolers', 16000, 9600, 20, 7, true),
('PRO-COOL-002', 'Hydro Flask Golf Tumbler', 'Insulated golf tumbler', 'proshop_coolers', 'hydration', 6400, 3840, 50, 15, true),
('PRO-COOL-003', 'Insulated Water Bottle', 'Golf water bottle', 'proshop_coolers', 'hydration', 4800, 2880, 80, 25, true),
('PRO-COOL-004', 'Golf Cart Cooler Bag', 'Cart mounted cooler bag', 'proshop_coolers', 'coolers', 8000, 4800, 30, 10, true),

-- Insert Gift Items
('PRO-GIFT-001', 'Golf Ball Display Case', 'Display case for golf balls', 'proshop_gifts', 'display', 4800, 2880, 25, 8, true),
('PRO-GIFT-002', 'Personalized Ball Markers', 'Custom engraved ball markers', 'proshop_gifts', 'markers', 3200, 1920, 40, 15, true),
('PRO-GIFT-003', 'Golf-themed Cufflinks', 'Elegant golf cufflinks', 'proshop_gifts', 'accessories', 8000, 4800, 15, 5, true),
('PRO-GIFT-004', 'Mini Desktop Golf Game', 'Desktop putting game', 'proshop_gifts', 'games', 2400, 1440, 50, 18, true),
('PRO-GIFT-005', 'Golf Club Bottle Opener', 'Club shaped bottle opener', 'proshop_gifts', 'accessories', 1600, 960, 80, 25, true),

-- Insert Maintenance & Repair Services
('PRO-SVC-001', 'Grip Installation', 'Professional grip installation service', 'proshop_services', 'repair', 3200, 1600, 999, 1, true),
('PRO-SVC-002', 'Club Re-shafting', 'Professional club re-shafting service', 'proshop_services', 'repair', 16000, 8000, 999, 1, true),
('PRO-SVC-003', 'Loft/Lie Adjustment', 'Club loft and lie angle adjustment', 'proshop_services', 'repair', 4800, 2400, 999, 1, true),
('PRO-SVC-004', 'Club Refinishing', 'Club head refinishing service', 'proshop_services', 'repair', 8000, 4000, 999, 1, true),

-- Insert Grip Supplies
('PRO-GRIP-001', 'Golf Pride Tour Velvet Grip', 'Premium velvet grip', 'proshop_grips', 'velvet', 2400, 1440, 60, 20, true),
('PRO-GRIP-002', 'Lamkin Crossline Grip', 'Classic crossline grip', 'proshop_grips', 'rubber', 2000, 1200, 80, 25, true),
('PRO-GRIP-003', 'Golf Pride MCC Grip', 'Multi-compound grip', 'proshop_grips', 'multi_compound', 3200, 1920, 40, 15, true),
('PRO-GRIP-004', 'Winn DriTac Grip', 'Cushioned DriTac grip', 'proshop_grips', 'cushioned', 2800, 1680, 50, 18, true);
