#!/bin/bash

# Royal Golf Club ERP Deployment Script
# This script helps deploy and manage the Royal Golf Club ERP system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="royal-golf-erp"
ENV_FILE=".env"
API_GATEWAY_PORT="3001"
AI_SERVICES_PORT="8000"
WEB_PORTAL_PORT="3000"

# Process IDs file
PIDS_FILE="./service_pids.txt"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    Royal Golf Club ERP Deployment Script"
    echo "=================================================="
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.9+ first."
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed. Please install pip3 first."
        exit 1
    fi
    
    # Check PostgreSQL connection
    if ! command -v psql &> /dev/null; then
        print_warning "psql is not installed. Database connection cannot be verified."
    fi
    
    print_success "Prerequisites check passed"
}

setup_environment() {
    print_info "Setting up environment..."
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Created .env file from .env.example"
            print_warning "Please review and update the .env file with your specific configuration"
            print_warning "Especially update: DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    else
        print_success "Environment file exists"
    fi
}

check_lm_studio() {
    print_info "Checking LM Studio connection..."
    
    # Get LM Studio URL from .env file
    LM_STUDIO_URL=$(grep "LM_STUDIO_URL" .env | cut -d '=' -f2 | tr -d '"' 2>/dev/null || echo "http://192.168.0.204:4545")
    
    if [ -z "$LM_STUDIO_URL" ]; then
        LM_STUDIO_URL="http://192.168.0.204:4545"
    fi
    
    if curl -s --connect-timeout 5 "$LM_STUDIO_URL/v1/models" > /dev/null 2>&1; then
        print_success "LM Studio is accessible at $LM_STUDIO_URL"
    else
        print_warning "LM Studio is not accessible at $LM_STUDIO_URL"
        print_warning "AI features may not work properly"
        print_warning "Please ensure LM Studio is running and accessible"
    fi
}

check_database() {
    print_info "Checking database connection..."
    
    # Source environment variables
    set -a
    source .env 2>/dev/null || true
    set +a
    
    # Use default values if not set
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-golf_club_db}
    DB_USER=${DB_USER:-postgres}
    
    if command -v psql &> /dev/null; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database connection successful"
        else
            print_warning "Database connection failed. Please ensure PostgreSQL is running and credentials are correct."
        fi
    else
        print_warning "Cannot verify database connection (psql not available)"
    fi
}

install_dependencies() {
    print_info "Installing dependencies..."
    
    # Install API Gateway dependencies
    print_info "Installing API Gateway dependencies..."
    cd backend/api-gateway
    npm install
    cd ../..
    
    # Install AI Services dependencies
    print_info "Installing AI Services dependencies..."
    cd backend/ai-services
    pip3 install -r requirements.txt
    cd ../..
    
    # Install Web Portal dependencies
    print_info "Installing Web Portal dependencies..."
    cd frontend/web-portal
    npm install
    cd ../..
    
    print_success "Dependencies installed successfully"
}

start_services() {
    print_info "Starting services..."
    
    # Source environment variables
    set -a
    source .env 2>/dev/null || true
    set +a
    
    # Create logs directory
    mkdir -p logs
    
    # Clear previous PIDs file
    > "$PIDS_FILE"
    
    # Start API Gateway
    print_info "Starting API Gateway..."
    cd backend/api-gateway
    npm start > ../../logs/api-gateway.log 2>&1 &
    API_GATEWAY_PID=$!
    echo "api-gateway:$API_GATEWAY_PID" >> "../../$PIDS_FILE"
    cd ../..
    
    # Start AI Services
    print_info "Starting AI Services..."
    cd backend/ai-services
    python3 main.py > ../../logs/ai-services.log 2>&1 &
    AI_SERVICES_PID=$!
    echo "ai-services:$AI_SERVICES_PID" >> "../../$PIDS_FILE"
    cd ../..
    
    # Start Web Portal
    print_info "Starting Web Portal..."
    cd frontend/web-portal
    npm start > ../../logs/web-portal.log 2>&1 &
    WEB_PORTAL_PID=$!
    echo "web-portal:$WEB_PORTAL_PID" >> "../../$PIDS_FILE"
    cd ../..
    
    # Wait for services to start
    sleep 10
    
    print_success "All services started successfully"
    print_info "Service PIDs saved to $PIDS_FILE"
}

check_services() {
    print_info "Checking service health..."
    
    # Wait a bit for services to start
    sleep 5
    
    # Check API Gateway health
    if curl -s "http://localhost:$API_GATEWAY_PORT/health" > /dev/null 2>&1; then
        print_success "API Gateway is healthy (port $API_GATEWAY_PORT)"
    else
        print_warning "API Gateway health check failed (port $API_GATEWAY_PORT)"
    fi
    
    # Check AI Services health
    if curl -s "http://localhost:$AI_SERVICES_PORT/health" > /dev/null 2>&1; then
        print_success "AI Services are healthy (port $AI_SERVICES_PORT)"
    else
        print_warning "AI Services health check failed (port $AI_SERVICES_PORT)"
    fi
    
    # Check Web Portal
    if curl -s "http://localhost:$WEB_PORTAL_PORT" > /dev/null 2>&1; then
        print_success "Web Portal is healthy (port $WEB_PORTAL_PORT)"
    else
        print_warning "Web Portal health check failed (port $WEB_PORTAL_PORT)"
    fi
}

show_status() {
    print_info "Service Status:"
    
    if [ ! -f "$PIDS_FILE" ]; then
        print_warning "No running services found (PID file not found)"
        return
    fi
    
    while IFS=':' read -r service_name pid; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_success "$service_name is running (PID: $pid)"
        else
            print_error "$service_name is not running (PID: $pid)"
        fi
    done < "$PIDS_FILE"
    
    echo ""
    print_info "Access Points:"
    echo "🌐 API Documentation: http://localhost:$API_GATEWAY_PORT/api-docs"
    echo "🏥 Health Check: http://localhost:$API_GATEWAY_PORT/health"
    echo "📊 Service Status: http://localhost:$API_GATEWAY_PORT/api/v1/services/health"
    echo "🌐 Web Portal: http://localhost:$WEB_PORTAL_PORT"
    echo "🤖 AI Services: http://localhost:$AI_SERVICES_PORT"
    
    echo ""
    print_info "Sample Login Credentials:"
    echo "📧 Email: john.smith@email.com"
    echo "🔑 Password: password123"
    echo "📧 Staff Email: james.wilson@royalgolf.com"
    echo "🔑 Password: password123"
}

show_logs() {
    print_info "Showing recent logs..."
    
    if [ ! -d "logs" ]; then
        print_warning "No logs directory found"
        return
    fi
    
    echo ""
    print_info "API Gateway logs:"
    tail -20 logs/api-gateway.log 2>/dev/null || echo "No API Gateway logs found"
    
    echo ""
    print_info "AI Services logs:"
    tail -20 logs/ai-services.log 2>/dev/null || echo "No AI Services logs found"
    
    echo ""
    print_info "Web Portal logs:"
    tail -20 logs/web-portal.log 2>/dev/null || echo "No Web Portal logs found"
}

follow_logs() {
    print_info "Following logs (Ctrl+C to exit)..."
    
    if [ ! -d "logs" ]; then
        print_warning "No logs directory found"
        return
    fi
    
    tail -f logs/*.log 2>/dev/null || print_warning "No log files found"
}

stop_services() {
    print_info "Stopping services..."
    
    if [ ! -f "$PIDS_FILE" ]; then
        print_warning "No PID file found. Services may not be running."
        return
    fi
    
    while IFS=':' read -r service_name pid; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Stopping $service_name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            
            # Wait for graceful shutdown
            sleep 2
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing $service_name (PID: $pid)..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            
            print_success "$service_name stopped"
        fi
    done < "$PIDS_FILE"
    
    # Remove PID file
    rm -f "$PIDS_FILE"
    
    print_success "All services stopped"
}

cleanup() {
    print_info "Cleaning up..."
    
    stop_services
    
    # Clean up any remaining processes
    pkill -f "royal-golf-erp" 2>/dev/null || true
    pkill -f "node.*api-gateway" 2>/dev/null || true
    pkill -f "python.*ai-services" 2>/dev/null || true
    pkill -f "node.*web-portal" 2>/dev/null || true
    
    # Clean up log files
    rm -rf logs/
    
    print_success "Cleanup completed"
}

backup_data() {
    print_info "Creating backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Source environment variables
    set -a
    source .env 2>/dev/null || true
    set +a
    
    # Use default values if not set
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-golf_club_db}
    DB_USER=${DB_USER:-postgres}
    
    # Backup database
    if command -v pg_dump &> /dev/null; then
        print_info "Backing up database..."
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/database.sql"
        print_success "Database backup created"
    else
        print_warning "pg_dump not available. Skipping database backup."
    fi
    
    # Backup configuration files
    print_info "Backing up configuration..."
    cp .env "$BACKUP_DIR/" 2>/dev/null || true
    cp -r logs "$BACKUP_DIR/" 2>/dev/null || true
    
    print_success "Backup created in $BACKUP_DIR"
}

build_production() {
    print_info "Building for production..."
    
    # Build Web Portal
    print_info "Building Web Portal..."
    cd frontend/web-portal
    npm run build
    cd ../..
    
    print_success "Production build completed"
}

show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Full deployment (install deps, start services, check)"
    echo "  start      - Start all services"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  status     - Show service status"
    echo "  logs       - Show recent service logs"
    echo "  follow     - Follow service logs in real-time"
    echo "  health     - Check service health"
    echo "  backup     - Create data backup"
    echo "  cleanup    - Stop services and clean up"
    echo "  install    - Install dependencies"
    echo "  build      - Build for production"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Full deployment"
    echo "  $0 logs      # View recent logs"
    echo "  $0 follow    # Follow logs in real-time"
    echo "  $0 status    # Check status"
}

# Main script logic
main() {
    print_header
    
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            setup_environment
            check_database
            check_lm_studio
            install_dependencies
            start_services
            check_services
            show_status
            ;;
        "start")
            check_prerequisites
            setup_environment
            start_services
            check_services
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 3
            start_services
            check_services
            show_status
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "follow")
            follow_logs
            ;;
        "health")
            check_services
            ;;
        "backup")
            backup_data
            ;;
        "cleanup")
            cleanup
            ;;
        "install")
            check_prerequisites
            install_dependencies
            ;;
        "build")
            check_prerequisites
            build_production
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
