# KYNSEY-POS - Point of Sale System

A modern point-of-sale (POS) system designed for small retail stores, cafes, and restaurants. KYNSEY-POS provides an intuitive, reliable, and cost-effective solution for managing sales, inventory, and basic business operations.

## Features

- **Modern Dashboard Interface**: Clean, intuitive dashboard with real-time sales data
- **Fast Sales Processing**: Quickly process sales with minimal clicks
- **Inventory Management**: Track stock levels and receive low stock alerts
- **Employee Management**: Role-based access control (superuser/admin/manager/cashier)
- **Sales Reports**: Basic sales reporting and analytics
- **Multi-Currency Support**: Built-in support for multiple currencies (USD, EUR, GBP, LKR)
- **Responsive Design**: Works on various screen sizes and devices

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Styled Components for styling
- Chart.js for data visualization
- Zustand for state management
- Axios for API calls

### Backend
- Node.js with Express
- PostgreSQL database
- Sequelize ORM
- JWT authentication
- bcrypt for password hashing

## Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd POS_SYSTEM
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials if different from defaults.

4. **Set up PostgreSQL database:**
   ```bash
   # Use the automated setup script
   cd database
   ./setup.sh
   
   # Or manually:
   createdb simplepos
   npm run db:reset
   npm run db:seed
   ```

5. **Start the application:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Default Login Credentials
- **Admin User:**
  - Username: `admin`
  - Password: `password`
- **Cashier User:**
  - Username: `cashier`
  - Password: `password`

## Project Structure

The project has been organized for better maintainability and follows standard conventions:

```
POS_SYSTEM/
├── README.md                    # Main project documentation
├── PROJECT_STRUCTURE.md         # Detailed structure guide
├── package.json                 # Root package.json with scripts
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── docs/                       # Documentation files
│   ├── DEVELOPMENT_GUIDE.md
│   ├── RBAC_DOCUMENTATION.md
│   └── RBAC_SETUP_README.md
├── scripts/                    # Utility scripts
│   ├── cleanup.js
│   ├── start.js
│   └── setup/                 # Setup scripts
│       ├── setup.sh
│       └── setup-rbac.sh
├── database/                   # Database setup and migrations
│   ├── README.md
│   ├── schema.sql
│   ├── seed_data.sql          # Sample restaurant menu data
│   ├── setup.sh
│   ├── employee_datasets.sql
│   ├── rbac_setup.sql
│   └── migrations/            # Database migrations
├── backend/                    # Node.js backend API
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
└── frontend/                   # React frontend application
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── store/
    │   └── utils/
    ├── public/
    └── package.json
```

For detailed structure information, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Available Scripts

### Root Level Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:safe` - Safe start with process cleanup
- `npm run dev:frontend` - Start only frontend development server
- `npm run dev:backend` - Start only backend development server
- `npm run start` - Start backend in production mode
- `npm run build` - Build frontend for production
- `npm run install:all` - Install dependencies for both frontend and backend
- `npm run cleanup` - Clean up running processes
- `npm run db:reset` - Reset database schema (WARNING: Deletes all data)
- `npm run db:seed` - Load sample menu data into database

### Frontend Scripts (in frontend/ directory)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Database Setup

The application uses PostgreSQL with the following default configuration:
- Database: `simplepos`
- User: `postgres`
- Password: `postgres`
- Host: `localhost`
- Port: `5432`

### Sample Data
The project includes a comprehensive restaurant menu dataset (`database/seed_data.sql`) with:
- 96 menu items across 19 categories
- Categories: Breakfast, Hot Drinks, Appetizers, Sandwiches, Salads, Soups, Sri Lankan Dishes, Fried Dishes, Grilled Seafood, Fried Rice, Boiled Vegetables, Noodles, Spaghetti, Other Dishes, Desserts, Soft Drinks, Fruit Juices, Milk Shakes, Lassies
- Pricing in Sri Lankan Rupees (LKR)
- Stock quantities and low stock thresholds
- Default admin and cashier users

## Configuration

### Environment Variables
All configuration is handled through environment variables in the `.env` file:

```env
# Database
DB_NAME=simplepos
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Currency Configuration
The application supports multiple currencies through the frontend utility system:
- Default: Sri Lankan Rupee (LKR)
- Supported: USD, EUR, GBP, LKR
- Currency settings are stored in browser localStorage

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale details

### Users
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin only)

## Development

### Adding New Features
1. Backend: Add routes in `backend/routes/`, controllers in `backend/controllers/`, and models in `backend/models/`
2. Frontend: Add components in `frontend/src/components/` and pages in `frontend/src/pages/`
3. Database: Create migrations in `database/migrations/` if needed

### Code Style
- Backend: Standard Node.js/Express patterns
- Frontend: React functional components with hooks
- Database: Sequelize ORM with PostgreSQL

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set `NODE_ENV=production` in `.env`
2. Use a secure `JWT_SECRET`
3. Configure production database credentials
4. Set up reverse proxy (nginx) for serving frontend static files

## Troubleshooting

### Common Issues
1. **Database connection failed**: Check PostgreSQL is running and credentials are correct
2. **Port already in use**: Change PORT in `.env` file
3. **Frontend not loading**: Ensure backend is running on correct port
4. **Authentication errors**: Verify JWT_SECRET is set in `.env`

### Database Issues
```bash
# Reset database completely
npm run db:reset
npm run db:seed

# Check database connection
psql -U postgres -d simplepos -c "SELECT version();"
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please create an issue in the repository or contact the development team.
