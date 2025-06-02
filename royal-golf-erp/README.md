# Royal Golf Club ERP System

A comprehensive Enterprise Resource Planning (ERP) system specifically designed for golf club management, featuring AI-powered capabilities, member engagement tools, and complete operational management.

## 🏌️ Overview

The Royal Golf Club ERP system is an enterprise-grade, AI-powered solution that combines member engagement features with comprehensive ERP capabilities. Built with modern microservices architecture, it leverages local server infrastructure for cost efficiency while maintaining enterprise-level security and performance standards.

## 🚀 Key Features

### Member-Facing Applications
- **Web Portal**: React.js with Material-UI, comprehensive member dashboard, tee time booking, tournament management
- **Mobile App**: React Native (planned) with tee time booking, tournament registration, messaging
- **Real-time Communication**: Internal messaging, push notifications, group chats
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### ERP Core Modules
- **Financial Management**: General ledger, accounts payable/receivable, budget planning
- **Membership Management**: Registration, tiers, dues collection, analytics
- **Operations Management**: F&B operations, pro shop, event management, facilities
- **Inventory Management**: Stock control, purchasing, vendor management

### AI & Machine Learning
- **Multi-Domain RAG**: Operations, Member Services, Financial, and Maintenance knowledge bases
- **LM Studio Integration**: Local LLM deployment for cost-effective AI processing
- **Intelligent Document Processing**: OCR and AI-powered invoice processing
- **Predictive Analytics**: Revenue forecasting, inventory optimization, member retention

### Technology Stack
- **Frontend**: React.js, React Native, Vue.js with TypeScript
- **Backend**: Node.js (Express), Python (FastAPI)
- **Database**: PostgreSQL 15+, Redis 7+, Elasticsearch 8+
- **AI/ML**: LM Studio, ChromaDB, sentence-transformers
- **Infrastructure**: Docker, Nginx, MinIO

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.9+ with pip
- PostgreSQL 15+ database
- Redis server
- LM Studio running on `192.168.0.204:4545` (or update configuration)
- At least 16GB RAM and 4 CPU cores recommended
- 100GB+ storage space

## 🛠️ Installation

### Option 1: Using Existing PostgreSQL Database

If you have an existing PostgreSQL database running locally:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd royal-golf-erp
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials:
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_NAME=golf_club_db
   # DB_USER=postgres
   # DB_PASSWORD=postgres
   ```

3. **Initialize the database**
   ```bash
   # Make setup script executable
   chmod +x setup-database.sh
   
   # Run database setup
   ./setup-database.sh
   ```

4. **Test database connection**
   ```bash
   # Install Node.js dependencies first
   cd backend/api-gateway && npm install && cd ../..
   
   # Test the connection
   node test-db-connection.js
   ```

5. **Install dependencies**
   ```bash
   # Install API Gateway dependencies
   cd backend/api-gateway && npm install && cd ../..
   
   # Install AI Services dependencies
   cd backend/ai-services && pip install -r requirements.txt && cd ../..
   
   # Install Web Portal dependencies
   cd frontend/web-portal && npm install && cd ../..
   ```

6. **Start the application services**
   ```bash
   # Start API Gateway
   cd backend/api-gateway && npm start &
   
   # Start AI Services
   cd backend/ai-services && python main.py &
   
   # Start Web Portal
   cd frontend/web-portal && npm start &
   ```

7. **Verify installation**
   ```bash
   # Test API Gateway
   curl http://localhost:3001/health
   
   # Access Member Web Portal
   open http://localhost:3000
   
   # Access API documentation
   open http://localhost:3001/api-docs
   ```

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Portal    │    │ Admin Dashboard │
│ (React Native)  │    │   (React.js)    │    │    (Vue.js)     │
│   [Planned]     │    │  ✅ IMPLEMENTED │    │   [Planned]     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Nginx (LB/SSL) │
                    │ ✅ IMPLEMENTED  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Node.js)     │
                    │ ✅ IMPLEMENTED  │
                    └─────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                       │                        │
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Member Services│    │ ERP Services  │    │ AI Services   │
│   (Node.js)   │    │  (Node.js)    │    │  (Python)     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                       │                        │
        └───────────────────────┼────────────────────────┘
                                │
        ┌───────────────────────┼────────────────────────┐
        │                       │                        │
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  PostgreSQL   │    │     Redis     │    │ Elasticsearch │
│   Database    │    │     Cache     │    │    Search     │
└───────────────┘    └───────────────┘    └───────────────┘
```

### AI Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   LM Studio     │    │   ChromaDB      │
│ (192.168.0.204) │    │   (4 instances) │
│     :4545       │    │                 │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼───────────────────────┐
                                 │                       │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   AI Services   │    │   Document      │
                    │   (FastAPI)     │    │   Processing    │
                    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Database
DB_PASSWORD=your_secure_password

# JWT Secrets
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# LM Studio
LM_STUDIO_URL=http://192.168.0.204:4545

# External APIs
WHATSAPP_API_KEY=your_whatsapp_key
EMAIL_SERVICE_KEY=your_email_key
SMS_SERVICE_KEY=your_sms_key
```

### LM Studio Setup

1. Install LM Studio on the designated server (192.168.0.204)
2. Load a compatible model (recommended: Llama 2 7B or similar)
3. Start the server on port 4545
4. Verify connection: `curl http://192.168.0.204:4545/v1/models`

## 📚 API Documentation

Once the system is running, access the interactive API documentation:

- **Main API Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health
- **Service Status**: http://localhost:3001/api/v1/services/health

### Authentication

All API endpoints (except auth and health) require JWT authentication:

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.smith@email.com", "password": "password123"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/v1/members
```

### Sample API Calls

```bash
# Get member information
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/v1/members

# Chat with AI
curl -X POST http://localhost:3001/api/v1/ai/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the club policies for guest access?"}'

# Get financial reports
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/v1/erp/financial/reports
```

## 🗄️ Database

### PostgreSQL Configuration

The Royal Golf Club ERP system uses PostgreSQL 15+ as its primary database. You can either use an existing PostgreSQL installation or the containerized version.

#### Database Credentials

Default configuration (update in `.env` file):
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=golf_club_db
DB_USER=postgres
DB_PASSWORD=postgres
```

#### Database Schema

The system includes a comprehensive schema with:
- **Member Management**: Members, membership tiers, preferences
- **Financial System**: Chart of accounts, transactions, invoicing
- **Golf Operations**: Courses, tee times, bookings, tournaments
- **Inventory**: Products, orders, stock management
- **Communication**: Messages, notifications, events
- **Staff Management**: Employee records, permissions
- **Audit Trail**: Complete activity logging

#### Database Setup Scripts

1. **Automated Setup**: `./setup-database.sh`
   - Creates database if it doesn't exist
   - Initializes schema with all tables and indexes
   - Inserts sample data for testing
   - Verifies setup completion

2. **Connection Test**: `node test-db-connection.js`
   - Tests database connectivity
   - Verifies schema exists
   - Shows sample data statistics
   - Provides troubleshooting information

#### Manual Database Setup

If you prefer manual setup:

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres

# Create database
CREATE DATABASE golf_club_db;

# Connect to the new database
\c golf_club_db;

# Run schema files
\i database/schemas/01_init.sql
\i database/schemas/02_sample_data.sql
```

### Sample Data

The system includes comprehensive sample data for testing:

- **Members**: 5 sample members with different membership tiers
- **Staff**: 5 staff members with various roles
- **Financial Data**: Sample transactions and chart of accounts
- **Products**: Pro shop and F&B items
- **Events**: Sample tournaments and social events
- **Bookings**: Sample tee time reservations
- **Messages**: Internal communication examples

### Default Login Credentials

For demo purposes, all users use the password: `password123`

Sample member emails:
- `john.smith@email.com` (Platinum member)
- `sarah.johnson@email.com` (Gold member)
- `robert.williams@email.com` (Silver member)

Sample staff emails:
- `james.wilson@royalgolf.com` (General Manager)
- `maria.garcia@royalgolf.com` (Pro Shop Manager)

### Database Maintenance

#### Backup
```bash
# Create backup
pg_dump -h localhost -U postgres golf_club_db > backup.sql

# Restore backup
psql -h localhost -U postgres golf_club_db < backup.sql
```

#### Performance Monitoring
```bash
# Check database size
psql -h localhost -U postgres -d golf_club_db -c "SELECT pg_size_pretty(pg_database_size('golf_club_db'));"

# Check table sizes
psql -h localhost -U postgres -d golf_club_db -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## 🔍 Monitoring & Logging

### Health Checks

- **System Health**: http://localhost:3001/health
- **Service Health**: http://localhost:3001/api/v1/services/health
- **Nginx Status**: http://localhost:8080/nginx_status

### Logs

```bash
# View API Gateway logs
tail -f backend/api-gateway/logs/app.log

# View AI Services logs
tail -f backend/ai-services/logs/app.log

# View system logs
journalctl -f
```

### Metrics

The system includes built-in monitoring:
- Response times and error rates
- Database connection pooling
- Cache hit rates
- AI service performance

## 🚀 Deployment

### Development

```bash
# Set development environment
export NODE_ENV=development

# Start services in development mode
cd backend/api-gateway && npm run dev &
cd backend/ai-services && python main.py --dev &
cd frontend/web-portal && npm run dev &
```

### Production

```bash
# Set production environment
export NODE_ENV=production

# Build and start services
cd frontend/web-portal && npm run build
cd backend/api-gateway && npm start
cd backend/ai-services && python main.py
```

### Process Management

```bash
# Use PM2 for process management
npm install -g pm2

# Start all services with PM2
pm2 start ecosystem.config.js

# Monitor services
pm2 monit
```

## 🔒 Security

### Features

- **JWT Authentication**: 15-minute access tokens, 7-day refresh tokens
- **Role-based Access Control**: Member, staff, and admin roles
- **Rate Limiting**: API and authentication endpoint protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **HTTPS Support**: SSL/TLS encryption

### Best Practices

1. Change default passwords in `.env`
2. Use strong JWT secrets (64+ characters)
3. Enable SSL in production
4. Regular security updates
5. Monitor access logs
6. Implement backup strategies

## 🧪 Testing

```bash
# Run API tests
cd backend/api-gateway
npm test

# Run AI service tests
cd backend/ai-services
python -m pytest

# Run frontend tests
cd frontend/web-portal
npm test

# Run integration tests
npm run test:integration
```

## 📈 Performance

### Optimization

- **Database Indexing**: Strategic indexes on frequently queried columns
- **Caching**: Multi-layer Redis caching
- **Connection Pooling**: Database connection optimization
- **Asset Optimization**: Gzip compression, CDN-ready
- **Load Balancing**: Nginx with health checks

### Benchmarks

- **API Response Time**: <200ms average
- **Concurrent Users**: 150+ simultaneous users supported
- **Database Performance**: <100ms query response time
- **AI Response Time**: 2-5 seconds for complex queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Troubleshooting

**Common Issues:**

1. **LM Studio Connection Failed**
   - Verify LM Studio is running on 192.168.0.204:4545
   - Check firewall settings
   - Update LM_STUDIO_URL in .env

2. **Database Connection Error**
   - Check PostgreSQL container status
   - Verify database credentials in .env
   - Check available disk space

3. **AI Services Not Responding**
   - Check ChromaDB containers are running
   - Verify Python dependencies
   - Check available memory (AI services require significant RAM)

### Getting Help

- **Documentation**: Check the `/docs` directory
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions for questions

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core ERP functionality
- ✅ AI integration with LM Studio
- ✅ Member web portal (React.js)
- ✅ Authentication system
- ✅ Complete database schema
- ✅ Docker containerization

### Phase 2 (Next)
- 🔄 Mobile application (React Native)
- 🔄 Admin dashboard (Vue.js)
- 🔄 Advanced AI features
- 🔄 WhatsApp integration
- 🔄 Business intelligence dashboards

### Phase 3 (Future)
- 📋 Advanced analytics
- 📋 Multi-club support
- 📋 Cloud deployment options
- 📋 Third-party integrations

---

**Royal Golf Club ERP System** - Transforming golf club management with AI-powered efficiency.
