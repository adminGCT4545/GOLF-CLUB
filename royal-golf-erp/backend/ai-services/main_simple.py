"""
Simplified Royal Golf Club AI Services API
FastAPI application with basic LM Studio integration
"""

import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel

from services.llm_service import LMStudioService

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Global service instances
llm_service = None

# Create FastAPI app
app = FastAPI(
    title="Royal Golf Club AI Services (Simplified)",
    description="Basic AI-powered services for LM Studio integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global llm_service
    
    print("🚀 Starting Royal Golf Club AI Services (Simplified)...")
    
    try:
        # Initialize LM Studio service
        llm_service = LMStudioService(
            base_url=os.getenv("LM_STUDIO_URL", "http://192.168.0.204:4545")
        )
        await llm_service.initialize()
        print("✅ LM Studio service initialized")
        print("🎉 AI Services startup complete!")
        
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        # Don't raise, allow service to start even if LM Studio is not available
        print("⚠️  Service started but LM Studio connection failed")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global llm_service
    
    print("🔄 Shutting down AI Services...")
    
    if llm_service:
        await llm_service.close()
    
    print("✅ AI Services shutdown complete")

@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    try:
        if llm_service:
            llm_health = await llm_service.health_check()
            return llm_health
        else:
            return {
                "status": "unhealthy",
                "error": "LM Studio service not initialized",
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.get("/model-info")
async def get_model_info():
    """Get LM Studio model information"""
    try:
        if not llm_service:
            raise HTTPException(status_code=503, detail="LM Studio service not available")
        
        model_info = await llm_service.get_model_info()
        return model_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@app.post("/chat")
async def chat_with_ai(request: dict):
    """Simple chat endpoint for LM Studio integration"""
    try:
        if not llm_service:
            raise HTTPException(status_code=503, detail="LM Studio service not available")
        
        message = request.get("message")
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        user_info = request.get("user_info", {})
        conversation_history = request.get("conversation_history", [])
        context = request.get("context", [])
        
        # Generate response using LLM
        response = await llm_service.generate_response(
            message=message,
            context=context,
            user_info=user_info,
            conversation_history=conversation_history
        )
        
        return response
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Royal Golf Club AI Services (Simplified)",
        "version": "1.0.0",
        "status": "running",
        "lm_studio_url": os.getenv("LM_STUDIO_URL", "http://192.168.0.204:4545")
    }

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )
