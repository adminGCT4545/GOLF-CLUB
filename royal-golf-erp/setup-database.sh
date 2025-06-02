#!/bin/bash

# Royal Golf Club ERP Database Setup Script
# This script sets up the PostgreSQL database with the correct schema and sample data

set -e

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="golf_club_db"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo "🏌️ Royal Golf Club ERP Database Setup"
echo "======================================"

# Check if PostgreSQL is running
echo "📡 Checking PostgreSQL connection..."
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
    echo "❌ PostgreSQL is not running or not accessible at $DB_HOST:$DB_PORT"
    echo "Please ensure PostgreSQL is running and accessible with the provided credentials."
    exit 1
fi

echo "✅ PostgreSQL is running and accessible"

# Create database if it doesn't exist
echo "🗄️ Creating database '$DB_NAME' if it doesn't exist..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

echo "✅ Database '$DB_NAME' is ready"

# Run schema initialization
echo "📋 Initializing database schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schemas/01_init.sql

echo "✅ Database schema initialized"

# Insert sample data
echo "📊 Inserting sample data..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schemas/02_sample_data.sql

echo "✅ Sample data inserted"

# Verify setup
echo "🔍 Verifying database setup..."
MEMBER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM members;")
COURSE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM courses;")
PRODUCT_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM products;")

echo "📈 Database Statistics:"
echo "   - Members: $MEMBER_COUNT"
echo "   - Courses: $COURSE_COUNT"
echo "   - Products: $PRODUCT_COUNT"

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📝 Connection Details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""
echo "🚀 You can now start the Royal Golf Club ERP services."
echo "   Run: ./deploy.sh start"
echo "   Or: npm start (for individual services)"
