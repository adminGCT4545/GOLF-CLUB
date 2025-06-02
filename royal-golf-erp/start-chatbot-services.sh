#!/bin/bash

# Royal Golf Club AI Chatbot - Service Startup Script
# This script starts all required services for the AI chatbot integration

echo "🤖 Starting Royal Golf Club AI Chatbot Services"
echo "================================================="

# Function to check if a service is running on a port
check_port() {
    nc -z localhost $1 2>/dev/null
    return $?
}

# Function to start a service in a new terminal (macOS/Linux)
start_service() {
    local service_name=$1
    local directory=$2
    local command=$3
    
    echo "🚀 Starting $service_name..."
    
    if command -v gnome-terminal &> /dev/null; then
        # Linux with gnome-terminal
        gnome-terminal --tab --title="$service_name" --working-directory="$PWD/$directory" -- bash -c "$command; exec bash"
    elif command -v osascript &> /dev/null; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd '$PWD/$directory' && $command\""
    else
        echo "⚠️  Please start $service_name manually:"
        echo "   cd $directory"
        echo "   $command"
        echo ""
    fi
}

# Check if LM Studio is running
echo "🔍 Checking LM Studio connection..."
if curl -s http://192.168.0.204:4545/v1/models > /dev/null 2>&1; then
    echo "✅ LM Studio is running on 192.168.0.204:4545"
else
    echo "❌ LM Studio is not accessible at 192.168.0.204:4545"
    echo "   Please ensure LM Studio is running with a model loaded"
    echo "   URL: http://192.168.0.204:4545"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for required directories
if [ ! -d "backend/ai-services" ]; then
    echo "❌ AI Services directory not found"
    echo "   Please run this script from the royal-golf-erp root directory"
    exit 1
fi

if [ ! -d "backend/api-gateway" ]; then
    echo "❌ API Gateway directory not found"
    echo "   Please run this script from the royal-golf-erp root directory"
    exit 1
fi

if [ ! -d "frontend/web-portal" ]; then
    echo "❌ Frontend directory not found"
    echo "   Please run this script from the royal-golf-erp root directory"
    exit 1
fi

echo "📦 Checking dependencies..."

# Check Python dependencies
if [ ! -f "backend/ai-services/.env" ]; then
    echo "⚠️  Creating AI Services .env file..."
    cp backend/ai-services/.env.example backend/ai-services/.env
fi

# Check if FastAPI is installed
cd backend/ai-services
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip install fastapi uvicorn httpx python-dotenv
fi
cd ../..

# Check Node.js dependencies for API Gateway
cd backend/api-gateway
if [ ! -d "node_modules" ]; then
    echo "📦 Installing API Gateway dependencies..."
    npm install
fi
if ! npm list axios --depth=0 >/dev/null 2>&1; then
    echo "📦 Installing axios for API Gateway..."
    npm install axios
fi
cd ../..

# Check Node.js dependencies for Frontend
cd frontend/web-portal
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    npm install
fi
cd ../..

echo ""
echo "🚀 Starting Services..."
echo "======================"

# Start AI Services (Port 8001)
start_service "AI Services" "backend/ai-services" "python main.py"
sleep 3

# Wait for AI Services to start
echo "⏳ Waiting for AI Services to start..."
for i in {1..10}; do
    if check_port 8001; then
        echo "✅ AI Services started on port 8001"
        break
    fi
    sleep 2
    if [ $i -eq 10 ]; then
        echo "⚠️  AI Services may be taking longer to start"
    fi
done

# Start API Gateway (Port 3001)
start_service "API Gateway" "backend/api-gateway" "npm start"
sleep 3

# Wait for API Gateway to start
echo "⏳ Waiting for API Gateway to start..."
for i in {1..10}; do
    if check_port 3001; then
        echo "✅ API Gateway started on port 3001"
        break
    fi
    sleep 2
    if [ $i -eq 10 ]; then
        echo "⚠️  API Gateway may be taking longer to start"
    fi
done

# Start Frontend (Port 3000 or 9190)
start_service "Frontend" "frontend/web-portal" "npm start"

echo ""
echo "🎉 All services started!"
echo "======================="
echo ""
echo "📋 Service Status:"
echo "   🤖 AI Services:    http://localhost:8001/health"
echo "   🌐 API Gateway:    http://localhost:3001/health"
echo "   💻 Frontend:       http://localhost:3000 (or check terminal)"
echo "   🧠 LM Studio:      http://192.168.0.204:4545"
echo ""
echo "🔍 Health Check URLs:"
echo "   curl http://localhost:8001/health"
echo "   curl http://localhost:3001/api/v1/ai/health"
echo ""
echo "💬 To test the chatbot:"
echo "   1. Open the frontend URL"
echo "   2. Log in to the Royal Golf Club portal"
echo "   3. Look for the chat button in the bottom right corner"
echo ""
echo "📚 Documentation: See AI_CHATBOT_README.md for detailed setup instructions"
echo ""
echo "🛑 To stop services, close the terminal windows or press Ctrl+C in each"
