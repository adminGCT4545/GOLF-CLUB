-- Insert 25 new members into the Royal Golf Club database
-- This script assumes the database schema is already set up with membership tiers

-- Insert 25 new members with diverse and realistic data
INSERT INTO members (member_number, first_name, last_name, email, phone, membership_tier_id, handicap_index, join_date, address, preferences, emergency_contact, status) VALUES

-- Member 006 - Platinum
('M006', 'Alexander', 'Rodriguez', 'alexander.rodriguez@email.com', '+1-555-0601', 
 (SELECT id FROM membership_tiers WHERE name = 'Platinum'), 4.2, '2023-01-15',
 '{"street": "1247 Augusta Drive", "city": "Royal City", "state": "TX", "zip": "75006"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["morning"]}',
 '{"name": "Maria Rodriguez", "relationship": "Spouse", "phone": "+1-555-0602"}', 'active'),

-- Member 007 - Gold
('M007', 'Jennifer', 'Thompson', 'jennifer.thompson@email.com', '+1-555-0701',
 (SELECT id FROM membership_tiers WHERE name = 'Gold'), 11.8, '2023-03-22',
 '{"street": "856 Pebble Beach Lane", "city": "Royal City", "state": "TX", "zip": "75007"}',
 '{"communication": "sms", "tee_time_reminders": true, "newsletter": false, "preferred_tee_times": ["afternoon"]}',
 '{"name": "Mark Thompson", "relationship": "Spouse", "phone": "+1-555-0702"}', 'active'),

-- Member 008 - Silver
('M008', 'Christopher', 'Anderson', 'christopher.anderson@email.com', '+1-555-0801',
 (SELECT id FROM membership_tiers WHERE name = 'Silver'), 18.5, '2023-05-10',
 '{"street": "423 Fairway Circle", "city": "Royal City", "state": "TX", "zip": "75008"}',
 '{"communication": "email", "tee_time_reminders": false, "newsletter": true, "preferred_tee_times": ["weekend"]}',
 '{"name": "Susan Anderson", "relationship": "Spouse", "phone": "+1-555-0802"}', 'active'),

-- Member 009 - Corporate
('M009', 'Victoria', 'Martinez', 'victoria.martinez@techcorp.com', '+1-555-0901',
 (SELECT id FROM membership_tiers WHERE name = 'Corporate'), 7.3, '2023-02-28',
 '{"street": "1534 Executive Blvd", "city": "Royal City", "state": "TX", "zip": "75009"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["morning", "afternoon"]}',
 '{"name": "TechCorp HR", "relationship": "Business", "phone": "+1-555-0902"}', 'active'),

-- Member 010 - Platinum
('M010', 'Daniel', 'White', 'daniel.white@email.com', '+1-555-1001',
 (SELECT id FROM membership_tiers WHERE name = 'Platinum'), 2.1, '2022-11-05',
 '{"street": "2187 Champions Way", "city": "Royal City", "state": "TX", "zip": "75010"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["early_morning"]}',
 '{"name": "Rachel White", "relationship": "Spouse", "phone": "+1-555-1002"}', 'active'),

-- Member 011 - Gold
('M011', 'Amanda', 'Taylor', 'amanda.taylor@email.com', '+1-555-1101',
 (SELECT id FROM membership_tiers WHERE name = 'Gold'), 14.2, '2023-07-18',
 '{"street": "967 Birdie Lane", "city": "Royal City", "state": "TX", "zip": "75011"}',
 '{"communication": "sms", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["morning"]}',
 '{"name": "James Taylor", "relationship": "Spouse", "phone": "+1-555-1102"}', 'active'),

-- Member 012 - Silver
('M012', 'Kevin', 'Wilson', 'kevin.wilson@email.com', '+1-555-1201',
 (SELECT id FROM membership_tiers WHERE name = 'Silver'), 22.7, '2024-01-08',
 '{"street": "345 Dogleg Drive", "city": "Royal City", "state": "TX", "zip": "75012"}',
 '{"communication": "email", "tee_time_reminders": false, "newsletter": false, "preferred_tee_times": ["afternoon"]}',
 '{"name": "Linda Wilson", "relationship": "Spouse", "phone": "+1-555-1202"}', 'active'),

-- Member 013 - Gold
('M013', 'Rachel', 'Moore', 'rachel.moore@email.com', '+1-555-1301',
 (SELECT id FROM membership_tiers WHERE name = 'Gold'), 9.6, '2023-04-12',
 '{"street": "678 Sand Trap Court", "city": "Royal City", "state": "TX", "zip": "75013"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["morning", "weekend"]}',
 '{"name": "Brian Moore", "relationship": "Spouse", "phone": "+1-555-1302"}', 'active'),

-- Member 014 - Corporate
('M014', 'Benjamin', 'Clark', 'benjamin.clark@financecorp.com', '+1-555-1401',
 (SELECT id FROM membership_tiers WHERE name = 'Corporate'), 12.4, '2023-06-30',
 '{"street": "1098 Business Park Dr", "city": "Royal City", "state": "TX", "zip": "75014"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["afternoon"]}',
 '{"name": "FinanceCorp Admin", "relationship": "Business", "phone": "+1-555-1402"}', 'active'),

-- Member 015 - Silver
('M015', 'Jessica', 'Lewis', 'jessica.lewis@email.com', '+1-555-1501',
 (SELECT id FROM membership_tiers WHERE name = 'Silver'), 16.8, '2024-02-14',
 '{"street": "543 Green Valley Road", "city": "Royal City", "state": "TX", "zip": "75015"}',
 '{"communication": "sms", "tee_time_reminders": true, "newsletter": false, "preferred_tee_times": ["weekend"]}',
 '{"name": "Michael Lewis", "relationship": "Spouse", "phone": "+1-555-1502"}', 'active'),

-- Member 016 - Platinum
('M016', 'Thomas', 'Garcia', 'thomas.garcia@email.com', '+1-555-1601',
 (SELECT id FROM membership_tiers WHERE name = 'Platinum'), 1.8, '2022-08-20',
 '{"street": "2456 Eagle Ridge Parkway", "city": "Royal City", "state": "TX", "zip": "75016"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["early_morning", "morning"]}',
 '{"name": "Elena Garcia", "relationship": "Spouse", "phone": "+1-555-1602"}', 'active'),

-- Member 017 - Gold
('M017', 'Michelle', 'Hall', 'michelle.hall@email.com', '+1-555-1701',
 (SELECT id FROM membership_tiers WHERE name = 'Gold'), 13.5, '2023-09-25',
 '{"street": "789 Tournament Trail", "city": "Royal City", "state": "TX", "zip": "75017"}',
 '{"communication": "email", "tee_time_reminders": false, "newsletter": true, "preferred_tee_times": ["afternoon"]}',
 '{"name": "David Hall", "relationship": "Spouse", "phone": "+1-555-1702"}', 'active'),

-- Member 018 - Silver
('M018', 'Ryan', 'Young', 'ryan.young@email.com', '+1-555-1801',
 (SELECT id FROM membership_tiers WHERE name = 'Silver'), 19.2, '2024-03-05',
 '{"street": "132 Mulligan Street", "city": "Royal City", "state": "TX", "zip": "75018"}',
 '{"communication": "sms", "tee_time_reminders": true, "newsletter": false, "preferred_tee_times": ["morning"]}',
 '{"name": "Ashley Young", "relationship": "Spouse", "phone": "+1-555-1802"}', 'active'),

-- Member 019 - Corporate
('M019', 'Nicole', 'Allen', 'nicole.allen@lawfirm.com', '+1-555-1901',
 (SELECT id FROM membership_tiers WHERE name = 'Corporate'), 8.9, '2023-08-14',
 '{"street": "3021 Professional Plaza", "city": "Royal City", "state": "TX", "zip": "75019"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["afternoon", "weekend"]}',
 '{"name": "Law Firm Partners", "relationship": "Business", "phone": "+1-555-1902"}', 'active'),

-- Member 020 - Gold
('M020', 'Andrew', 'King', 'andrew.king@email.com', '+1-555-2001',
 (SELECT id FROM membership_tiers WHERE name = 'Gold'), 10.7, '2023-10-12',
 '{"street": "654 Clubhouse Drive", "city": "Royal City", "state": "TX", "zip": "75020"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["morning"]}',
 '{"name": "Sarah King", "relationship": "Spouse", "phone": "+1-555-2002"}', 'active'),

-- Member 021 - Silver
('M021', 'Lisa', 'Wright', 'lisa.wright@email.com', '+1-555-2101',
 (SELECT id FROM membership_tiers WHERE name = 'Silver'), 25.3, '2024-04-20',
 '{"street": "876 Rough Lane", "city": "Royal City", "state": "TX", "zip": "75021"}',
 '{"communication": "sms", "tee_time_reminders": false, "newsletter": true, "preferred_tee_times": ["weekend"]}',
 '{"name": "Robert Wright", "relationship": "Spouse", "phone": "+1-555-2102"}', 'active'),

-- Member 022 - Platinum
('M022', 'Matthew', 'Lopez', 'matthew.lopez@email.com', '+1-555-2201',
 (SELECT id FROM membership_tiers WHERE name = 'Platinum'), 3.4, '2022-12-18',
 '{"street": "1789 Masters Boulevard", "city": "Royal City", "state": "TX", "zip": "75022"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["early_morning"]}',
 '{"name": "Carmen Lopez", "relationship": "Spouse", "phone": "+1-555-2202"}', 'active'),

-- Member 023 - Gold
('M023', 'Stephanie', 'Hill', 'stephanie.hill@email.com', '+1-555-2301',
 (SELECT id FROM membership_tiers WHERE name = 'Gold'), 15.1, '2023-11-08',
 '{"street": "456 Pond View Avenue", "city": "Royal City", "state": "TX", "zip": "75023"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": false, "preferred_tee_times": ["afternoon"]}',
 '{"name": "Gregory Hill", "relationship": "Spouse", "phone": "+1-555-2302"}', 'active'),

-- Member 024 - Corporate
('M024', 'Jonathan', 'Scott', 'jonathan.scott@consulting.com', '+1-555-2401',
 (SELECT id FROM membership_tiers WHERE name = 'Corporate'), 6.1, '2023-12-15',
 '{"street": "2345 Corporate Center", "city": "Royal City", "state": "TX", "zip": "75024"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["morning", "afternoon"]}',
 '{"name": "Consulting Group", "relationship": "Business", "phone": "+1-555-2402"}', 'active'),

-- Member 025 - Silver
('M025', 'Lauren', 'Green', 'lauren.green@email.com', '+1-555-2501',
 (SELECT id FROM membership_tiers WHERE name = 'Silver'), 20.9, '2024-05-02',
 '{"street": "987 Cart Path Lane", "city": "Royal City", "state": "TX", "zip": "75025"}',
 '{"communication": "sms", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["weekend"]}',
 '{"name": "Christopher Green", "relationship": "Spouse", "phone": "+1-555-2502"}', 'active'),

-- Member 026 - Gold
('M026', 'Brandon', 'Adams', 'brandon.adams@email.com', '+1-555-2601',
 (SELECT id FROM membership_tiers WHERE name = 'Gold'), 11.3, '2024-01-25',
 '{"street": "741 Windmill Drive", "city": "Royal City", "state": "TX", "zip": "75026"}',
 '{"communication": "email", "tee_time_reminders": false, "newsletter": true, "preferred_tee_times": ["morning"]}',
 '{"name": "Emma Adams", "relationship": "Spouse", "phone": "+1-555-2602"}', 'active'),

-- Member 027 - Silver
('M027', 'Samantha', 'Baker', 'samantha.baker@email.com', '+1-555-2701',
 (SELECT id FROM membership_tiers WHERE name = 'Silver'), 17.4, '2024-06-10',
 '{"street": "258 Hazard Hill Road", "city": "Royal City", "state": "TX", "zip": "75027"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": false, "preferred_tee_times": ["afternoon", "weekend"]}',
 '{"name": "Tyler Baker", "relationship": "Spouse", "phone": "+1-555-2702"}', 'active'),

-- Member 028 - Platinum
('M028', 'Patrick', 'Gonzalez', 'patrick.gonzalez@email.com', '+1-555-2801',
 (SELECT id FROM membership_tiers WHERE name = 'Platinum'), 5.7, '2022-10-30',
 '{"street": "1472 Championship Circle", "city": "Royal City", "state": "TX", "zip": "75028"}',
 '{"communication": "email", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["early_morning", "morning"]}',
 '{"name": "Isabella Gonzalez", "relationship": "Spouse", "phone": "+1-555-2802"}', 'active'),

-- Member 029 - Gold
('M029', 'Kimberly', 'Nelson', 'kimberly.nelson@email.com', '+1-555-2901',
 (SELECT id FROM membership_tiers WHERE name = 'Gold'), 12.8, '2024-02-08',
 '{"street": "963 Tee Box Trail", "city": "Royal City", "state": "TX", "zip": "75029"}',
 '{"communication": "sms", "tee_time_reminders": true, "newsletter": true, "preferred_tee_times": ["morning", "weekend"]}',
 '{"name": "William Nelson", "relationship": "Spouse", "phone": "+1-555-2902"}', 'active'),

-- Member 030 - Silver
('M030', 'Justin', 'Carter', 'justin.carter@email.com', '+1-555-3001',
 (SELECT id FROM membership_tiers WHERE name = 'Silver'), 24.1, '2024-07-22',
 '{"street": "159 Back Nine Boulevard", "city": "Royal City", "state": "TX", "zip": "75030"}',
 '{"communication": "email", "tee_time_reminders": false, "newsletter": false, "preferred_tee_times": ["weekend"]}',
 '{"name": "Megan Carter", "relationship": "Spouse", "phone": "+1-555-3002"}', 'active');

-- Insert corresponding financial transactions for membership dues
-- Generate membership dues for each new member for current month
INSERT INTO financial_transactions (transaction_type, member_id, account_id, amount, description, transaction_date, status, reference_number) 
SELECT 'membership_dues', m.id, a.id, 
  CASE 
    WHEN mt.name = 'Platinum' THEN 500.00
    WHEN mt.name = 'Gold' THEN 350.00
    WHEN mt.name = 'Silver' THEN 250.00
    WHEN mt.name = 'Corporate' THEN 750.00
    ELSE 250.00
  END as amount,
  'Monthly membership dues - December 2024',
  '2024-12-01',
  'completed',
  'INV-2024-' || LPAD(SUBSTRING(m.member_number FROM 2)::text, 3, '0')
FROM members m
JOIN membership_tiers mt ON m.membership_tier_id = mt.id
CROSS JOIN chart_of_accounts a
WHERE m.member_number IN ('M006', 'M007', 'M008', 'M009', 'M010', 'M011', 'M012', 'M013', 'M014', 'M015', 
                          'M016', 'M017', 'M018', 'M019', 'M020', 'M021', 'M022', 'M023', 'M024', 'M025',
                          'M026', 'M027', 'M028', 'M029', 'M030')
AND a.account_code = '4000';

-- Verification query to check inserted data
SELECT 
    m.member_number,
    m.first_name,
    m.last_name,
    m.email,
    mt.name as membership_tier,
    m.handicap_index,
    m.join_date,
    m.status
FROM members m
LEFT JOIN membership_tiers mt ON m.membership_tier_id = mt.id
WHERE m.member_number LIKE 'M0%'
ORDER BY m.member_number;
