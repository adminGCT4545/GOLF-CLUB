# Royal Golf Club - Member Web Portal

A modern React.js web application for Royal Golf Club members to manage their golf club experience.

## Features

### 🏌️ Core Functionality
- **Member Dashboard** - Personalized overview with quick stats and recent activity
- **Tee Time Booking** - Real-time availability and booking management
- **Tournament Management** - Registration, leaderboards, and live scoring
- **Internal Messaging** - Real-time communication with other members and staff
- **Member Directory** - Search and connect with fellow members
- **Pro Shop** - Browse and order golf equipment and apparel
- **Food & Beverage** - Pre-order meals and beverages
- **Financial Management** - View statements, make payments, track expenses

### 🎨 User Experience
- **Material-UI Design** - Modern, responsive interface with golf club theming
- **Real-time Updates** - WebSocket integration for live notifications
- **Mobile Responsive** - Optimized for desktop, tablet, and mobile devices
- **Progressive Web App** - Installable with offline capabilities

### 🔐 Security & Authentication
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access** - Member-specific permissions and features
- **Auto-refresh Tokens** - Seamless session management
- **Secure API Communication** - All data encrypted in transit

## Technology Stack

### Frontend Framework
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Material-UI v5** - Comprehensive component library
- **React Router v6** - Client-side routing

### State Management
- **Redux Toolkit** - Predictable state management
- **RTK Query** - Efficient data fetching and caching
- **React Redux** - React bindings for Redux

### Development Tools
- **Create React App** - Zero-config build setup
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### Build & Deployment
- **Docker** - Containerized deployment
- **Nginx** - Production web server
- **Multi-stage Build** - Optimized production images

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (for containerized deployment)

### Development Setup

1. **Install Dependencies**
   ```bash
   cd frontend/web-portal
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API endpoints
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   
   The application will open at `http://localhost:9190`

4. **Available Scripts**
   ```bash
   npm start          # Start development server
   npm run build      # Build for production
   npm test           # Run test suite
   npm run lint       # Run ESLint
   npm run format     # Format code with Prettier
   ```

### Production Deployment

#### Docker Deployment
```bash
# Build the container
docker build -t royal-golf-web-portal .

# Run the container
docker run -p 3100:80 royal-golf-web-portal
```

#### Native Development
```bash
# Start the web portal
npm start
```

The web portal will be available at `http://localhost:9190`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Common/         # Generic components (LoadingSpinner, etc.)
│   └── Layout/         # Layout components (Navigation, Header)
├── pages/              # Page components
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Dashboard and home
│   ├── Bookings/       # Tee time management
│   ├── Tournaments/    # Tournament features
│   ├── Messages/       # Messaging system
│   ├── Members/        # Member directory
│   ├── ProShop/        # Pro shop ordering
│   ├── FnB/            # Food & beverage
│   ├── Profile/        # User profile management
│   └── Financial/      # Financial management
├── store/              # Redux store configuration
│   └── slices/         # Redux slices for different features
├── services/           # API services and utilities
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

## API Integration

The web portal integrates with the Royal Golf Club backend APIs:

### Authentication API
- Login/logout functionality
- Token refresh and session management
- User profile management

### Member Services API
- Member data and directory
- Booking management
- Tournament registration

### ERP Services API
- Financial transactions
- Inventory and ordering
- Event management

### AI Services API
- Intelligent recommendations
- Document processing
- Predictive analytics

### Communication API
- Internal messaging
- Notifications
- WhatsApp integration

## Features in Detail

### Dashboard
- **Quick Stats Cards** - Upcoming bookings, tournaments, messages, balance
- **Recent Activity Feed** - Latest actions and notifications
- **Member Information** - Profile summary with membership tier
- **Quick Actions** - One-click access to common features

### Tee Time Booking
- **Real-time Availability** - Live tee time slots with instant updates
- **Course Selection** - Multiple course options with details
- **Group Management** - Add playing partners and manage group size
- **Booking History** - View past and upcoming reservations

### Tournament Management
- **Tournament Listing** - Browse available tournaments with filters
- **Registration System** - Easy signup with entry fee processing
- **Live Leaderboards** - Real-time scoring and rankings
- **Score Entry** - Mobile-friendly score input for players

### Messaging System
- **Real-time Chat** - Instant messaging with WebSocket support
- **Group Conversations** - Multi-member chat rooms
- **Notification System** - Push notifications for new messages
- **Message History** - Searchable conversation archive

### Member Directory
- **Advanced Search** - Filter by name, membership tier, handicap
- **Member Profiles** - View member information and contact details
- **Social Features** - Connect and message other members
- **Privacy Controls** - Manage visibility of personal information

## Configuration

### Environment Variables
```bash
PORT=9190
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
GENERATE_SOURCEMAP=false
```

### Theme Customization
The application uses a custom Material-UI theme with golf club branding:
- **Primary Color**: Golf Green (#1B5E20)
- **Secondary Color**: Gold (#FFD700)
- **Typography**: Roboto font family
- **Custom Components**: Styled buttons, cards, and navigation

## Performance Optimization

### Code Splitting
- Route-based code splitting for optimal loading
- Lazy loading of heavy components
- Dynamic imports for non-critical features

### Caching Strategy
- Redux state persistence
- API response caching with RTK Query
- Browser caching for static assets

### Bundle Optimization
- Tree shaking for unused code elimination
- Webpack optimization for production builds
- Gzip compression for reduced transfer sizes

## Security Features

### Authentication Security
- JWT token storage in httpOnly cookies (production)
- Automatic token refresh before expiration
- Secure logout with token blacklisting

### API Security
- Request/response interceptors for token management
- CSRF protection with custom headers
- Input validation and sanitization

### Content Security
- Content Security Policy (CSP) headers
- XSS protection with React's built-in safeguards
- Secure communication over HTTPS in production

## Testing

### Test Structure
```bash
src/
├── __tests__/          # Test files
├── components/
│   └── __tests__/      # Component tests
└── pages/
    └── __tests__/      # Page tests
```

### Testing Commands
```bash
npm test                # Run all tests
npm run test:coverage   # Run tests with coverage
npm run test:watch      # Run tests in watch mode
```

## Deployment

### Production Build
```bash
npm run build
```

### Docker Production
```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine as build
# ... build stage

FROM nginx:alpine
# ... production stage with nginx
```

### Environment-specific Configurations
- Development: Hot reloading, debug tools
- Staging: Production build with debug logging
- Production: Optimized build, error tracking, analytics

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use Material-UI components consistently
3. Implement proper error handling
4. Write unit tests for new features
5. Follow the established folder structure

### Code Style
- ESLint configuration for consistent code style
- Prettier for automatic code formatting
- Husky pre-commit hooks for quality checks

## Support

For technical support or feature requests:
- Backend API Issues: Check API gateway logs
- Frontend Issues: Browser console and network tab
- Authentication Problems: Verify JWT token validity
- Performance Issues: Use React DevTools Profiler

## License

This project is part of the Royal Golf Club ERP system and is proprietary software.
