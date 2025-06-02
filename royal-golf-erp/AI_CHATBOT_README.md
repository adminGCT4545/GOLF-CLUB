# Royal Golf Club KYNSEY AI Chatbot Integration

This document explains the KYNSEY AI chatbot integration that connects to your LM Studio instance at `192.168.0.204:4545`.

## Features

- **Floating Chat Button**: Appears on the bottom right of every page
- **Real-time Chat**: Direct integration with LM Studio for AI responses
- **User Context**: Includes user information in AI conversations
- **Connection Status**: Shows AI connection status in real-time
- **Responsive Design**: Works on desktop and mobile devices
- **Message History**: Maintains conversation history during the session
- **Error Handling**: Graceful error handling with user-friendly messages

## Architecture

```
Frontend (React/TypeScript)
    ↓
API Gateway (Node.js/Express)
    ↓ 
AI Services (Python/FastAPI)
    ↓
LM Studio (192.168.0.204:4545)
```

## Setup Instructions

### 1. Prerequisites

- LM Studio running on `192.168.0.204:4545` with a model loaded
- Node.js and npm installed
- Python 3.8+ installed
- Access to the Royal Golf Club ERP system

### 2. Install Dependencies

#### Frontend Dependencies (if not already installed)
```bash
cd ROYAL_GOLF_CLUB_C/royal-golf-erp/frontend/web-portal
npm install @reduxjs/toolkit react-redux @mui/material @mui/icons-material
```

#### Backend Dependencies
```bash
cd ROYAL_GOLF_CLUB_C/royal-golf-erp/backend/api-gateway
npm install axios

cd ../ai-services
pip install fastapi uvicorn httpx python-dotenv
```

### 3. Configuration

#### AI Services Configuration
```bash
cd ROYAL_GOLF_CLUB_C/royal-golf-erp/backend/ai-services
cp .env.example .env
```

Edit the `.env` file to match your setup:
```env
LM_STUDIO_URL=http://192.168.0.204:4545
PORT=8001
ENVIRONMENT=development
```

#### API Gateway Configuration
Add to your API Gateway `.env` file:
```env
AI_SERVICE_URL=http://localhost:8001
```

### 4. Running the Services

#### Start AI Services
```bash
cd ROYAL_GOLF_CLUB_C/royal-golf-erp/backend/ai-services
python main.py
```

The AI service will start on port 8001 and automatically connect to LM Studio.

#### Start API Gateway
```bash
cd ROYAL_GOLF_CLUB_C/royal-golf-erp/backend/api-gateway
npm start
```

#### Start Frontend
```bash
cd ROYAL_GOLF_CLUB_C/royal-golf-erp/frontend/web-portal
npm start
```

### 5. Verify Installation

1. **Check LM Studio**: Ensure LM Studio is running on `192.168.0.204:4545` with a model loaded
2. **Check AI Service Health**: Visit `http://localhost:8001/health`
3. **Check API Gateway**: Visit `http://localhost:3001/api/v1/ai/health`
4. **Test Frontend**: Log into the Royal Golf Club portal and look for the chat button in the bottom right

## Usage

### Basic Usage

1. **Open Chat**: Click the floating chat button in the bottom right corner
2. **Send Message**: Type your question and press Enter or click Send
3. **View Response**: The AI will respond with contextual information about the golf club
4. **Minimize/Close**: Use the minimize or close buttons in the chat header

### Features

- **Connection Status**: Green "AI Connected" indicates the system is working
- **Confidence Scores**: AI responses show confidence percentages
- **Timestamps**: All messages include timestamps
- **Clear Conversation**: Use the clear button to reset the chat
- **Refresh Connection**: Use the refresh button to check AI connectivity

### Example Conversations

```
User: "What are the club's operating hours?"
KYNSEY AI: "Royal Golf Club is typically open from 6:00 AM to 8:00 PM daily. However, hours may vary based on season and special events. For the most current information, please contact the pro shop or check with club management."

User: "How do I book a tee time?"
KYNSEY AI: "You can book tee times through several methods: 1) Use the Tee Times section in this portal, 2) Call the pro shop directly, or 3) Use the mobile app. Online booking is available 7 days in advance for members."
```

## API Endpoints

### AI Chat Endpoints

#### POST `/api/v1/ai/chat`
Chat with KYNSEY AI assistant.

**Request Body:**
```json
{
  "message": "How do I book a tee time?",
  "user_info": {
    "firstName": "John",
    "lastName": "Doe",
    "memberNumber": "12345",
    "role": "member"
  },
  "conversation_history": []
}
```

**Response:**
```json
{
  "text": "You can book tee times through...",
  "confidence": 0.92,
  "sources": ["booking_policy.pdf"],
  "processing_time": 1.23,
  "model_used": "Llama-2-7B-Chat"
}
```

#### GET `/api/v1/ai/health`
Check AI service health status.

#### GET `/api/v1/ai/model-info`
Get information about the loaded LM Studio model.

## Troubleshooting

### Common Issues

#### 1. "AI service is currently unavailable"
- **Cause**: LM Studio is not running or not accessible
- **Solution**: 
  - Check that LM Studio is running on `192.168.0.204:4545`
  - Verify network connectivity to the LM Studio server
  - Ensure a model is loaded in LM Studio

#### 2. "AI Offline" status in chat
- **Cause**: Connection between AI service and LM Studio failed
- **Solution**:
  - Check LM Studio server status
  - Verify the URL in `.env` file is correct
  - Restart the AI service

#### 3. Chat button not appearing
- **Cause**: Frontend build issue or JavaScript error
- **Solution**:
  - Check browser console for errors
  - Verify all npm packages are installed
  - Restart the frontend development server

#### 4. Slow responses
- **Cause**: Model size or server performance
- **Solution**:
  - Use a smaller/faster model in LM Studio
  - Adjust the `max_tokens` parameter in requests
  - Check server resources

### Health Check Commands

```bash
# Check AI Service
curl http://localhost:8001/health

# Check API Gateway AI routes
curl http://localhost:3001/api/v1/ai/health

# Test LM Studio directly
curl http://192.168.0.204:4545/v1/models
```

### Log Locations

- **AI Service Logs**: Console output when running `python main.py`
- **API Gateway Logs**: Console output when running `npm start`
- **Frontend Logs**: Browser console (F12 → Console tab)

## Customization

### Modify AI Behavior

Edit the system prompt in `backend/ai-services/services/llm_service.py`:

```python
def _build_system_prompt(self, context=None, user_info=None):
    base_prompt = """You are KYNSEY AI, an AI assistant for the Royal Golf Club...
    
    Add your custom instructions here.
    """
```

### Change Chat Appearance

Edit the chatbot styling in `frontend/web-portal/src/components/Common/AIChatbot.tsx`.

### Add Custom Context

Modify the chat request in `frontend/web-portal/src/store/slices/chatbotSlice.ts` to include additional context.

## Security Considerations

- API endpoints are protected with authentication
- User information is included in AI requests for personalization
- No sensitive data should be sent to the AI model
- Consider rate limiting for production use

## Performance Optimization

- The AI service caches model information
- Connection pooling is used for HTTP requests
- Health checks run every 30 seconds
- Consider using a reverse proxy for production

## Support

For issues specific to:
- **LM Studio**: Check LM Studio documentation
- **Royal Golf Club ERP**: Contact your system administrator
- **AI Integration**: Review logs and error messages described above

---

*Last updated: December 2024*
