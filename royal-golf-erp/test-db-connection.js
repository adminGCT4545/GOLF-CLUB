#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests the PostgreSQL connection with the configured credentials
 */

require('dotenv').config();
const { Pool } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'golf_club_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

async function testConnection() {
  console.log('🏌️ Royal Golf Club ERP - Database Connection Test');
  console.log('================================================');
  console.log();
  
  console.log('📋 Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Password: ${'*'.repeat(dbConfig.password.length)}`);
  console.log();

  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔌 Attempting to connect to PostgreSQL...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test database time
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log(`⏰ Database time: ${timeResult.rows[0].current_time}`);
    
    // Test database version
    const versionResult = await client.query('SELECT version()');
    console.log(`🗄️ PostgreSQL version: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);
    
    // Test if our database exists and has tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log();
    console.log('📊 Database Tables:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      
      // Test sample data
      console.log();
      console.log('📈 Sample Data Check:');
      
      try {
        const memberCount = await client.query('SELECT COUNT(*) FROM members');
        console.log(`   Members: ${memberCount.rows[0].count}`);
        
        const courseCount = await client.query('SELECT COUNT(*) FROM courses');
        console.log(`   Courses: ${courseCount.rows[0].count}`);
        
        const productCount = await client.query('SELECT COUNT(*) FROM products');
        console.log(`   Products: ${productCount.rows[0].count}`);
        
        const tierCount = await client.query('SELECT COUNT(*) FROM membership_tiers');
        console.log(`   Membership Tiers: ${tierCount.rows[0].count}`);
        
        // Test a sample query
        const sampleMember = await client.query(`
          SELECT m.first_name, m.last_name, mt.name as tier_name 
          FROM members m 
          JOIN membership_tiers mt ON m.membership_tier_id = mt.id 
          LIMIT 1
        `);
        
        if (sampleMember.rows.length > 0) {
          const member = sampleMember.rows[0];
          console.log(`   Sample Member: ${member.first_name} ${member.last_name} (${member.tier_name})`);
        }
        
      } catch (dataError) {
        console.log('   ⚠️ Tables exist but may not have data yet');
      }
      
    } else {
      console.log('   ⚠️ No tables found - database may need initialization');
      console.log('   💡 Run: ./setup-database.sh to initialize the database');
    }
    
    client.release();
    
    console.log();
    console.log('🎉 Database connection test completed successfully!');
    console.log('🚀 The Royal Golf Club ERP system is ready to use this database.');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error();
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Troubleshooting tips:');
      console.error('   1. Ensure PostgreSQL is running');
      console.error('   2. Check if the host and port are correct');
      console.error('   3. Verify firewall settings');
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed:');
      console.error('   1. Check username and password');
      console.error('   2. Verify user permissions');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist:');
      console.error('   1. Create the database manually');
      console.error('   2. Or run: ./setup-database.sh');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection().catch(console.error);
