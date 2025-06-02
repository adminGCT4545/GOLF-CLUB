"""
Royal Golf Club AI Services API
FastAPI application with LM Studio integration and RAG capabilities
"""

import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel, Field

from services.llm_service import LMStudioService
from services.rag_service import RAGService
from services.invoice_processor import InvoiceProcessor
from services.predictive_analytics import PredictiveAnalytics
from config.database import DatabaseManager
from config.redis_client import RedisManager
from middleware.auth import get_current_user
from models.schemas import (
    ChatRequest, ChatResponse, DocumentUploadResponse,
    InvoiceProcessingRequest, InvoiceProcessingResponse,
    PredictionRequest, PredictionResponse, HealthResponse
)

# Global service instances
llm_service = None
rag_service = None
invoice_processor = None
predictive_analytics = None
db_manager = None
redis_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global llm_service, rag_service, invoice_processor, predictive_analytics, db_manager, redis_manager
    
    # Startup
    print("🚀 Starting Royal Golf Club AI Services...")
    
    try:
        # Initialize database connection
        db_manager = DatabaseManager()
        await db_manager.connect()
        print("✅ Database connected")
        
        # Initialize Redis connection
        redis_manager = RedisManager()
        await redis_manager.connect()
        print("✅ Redis connected")
        
        # Initialize LM Studio service
        llm_service = LMStudioService(
            base_url=os.getenv("LM_STUDIO_URL", "http://192.168.0.204:4545")
        )
        await llm_service.initialize()
        print("✅ LM Studio service initialized")
        
        # Initialize RAG service with multiple ChromaDB instances
        rag_service = RAGService({
            "operations": os.getenv("CHROMADB_OPERATIONS_HOST", "chromadb-operations:8001"),
            "member_services": os.getenv("CHROMADB_MEMBER_SERVICES_HOST", "chromadb-member-services:8002"),
            "financial": os.getenv("CHROMADB_FINANCIAL_HOST", "chromadb-financial:8003"),
            "maintenance": os.getenv("CHROMADB_MAINTENANCE_HOST", "chromadb-maintenance:8004")
        })
        await rag_service.initialize()
        print("✅ RAG service initialized")
        
        # Initialize invoice processor
        invoice_processor = InvoiceProcessor()
        await invoice_processor.initialize()
        print("✅ Invoice processor initialized")
        
        # Initialize predictive analytics
        predictive_analytics = PredictiveAnalytics(db_manager)
        await predictive_analytics.initialize()
        print("✅ Predictive analytics initialized")
        
        print("🎉 AI Services startup complete!")
        
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    print("🔄 Shutting down AI Services...")
    
    if db_manager:
        await db_manager.disconnect()
    if redis_manager:
        await redis_manager.disconnect()
    
    print("✅ AI Services shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Royal Golf Club AI Services",
    description="AI-powered services for golf club management including RAG, document processing, and predictive analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    domain: str = "operations",
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: Dict = Depends(get_current_user)
):
    """Upload and process documents for RAG"""
    try:
        if not rag_service:
            raise HTTPException(status_code=503, detail="RAG service not available")
        
        # Validate file type
        allowed_types = [
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )
        
        # Read file content
        content = await file.read()
        
        # Process document in background
        background_tasks.add_task(
            rag_service.process_document,
            content=content,
            filename=file.filename,
            domain=domain,
            uploaded_by=current_user["id"]
        )
        
        return DocumentUploadResponse(
            filename=file.filename,
            size=len(content),
            domain=domain,
            status="processing",
            message="Document uploaded successfully and is being processed"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload failed: {str(e)}")

@app.post("/invoices/process", response_model=InvoiceProcessingResponse)
async def process_invoice(
    request: InvoiceProcessingRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Process invoice using OCR and AI extraction"""
    try:
        if not invoice_processor:
            raise HTTPException(status_code=503, detail="Invoice processor not available")
        
        # Process the invoice
        result = await invoice_processor.process_invoice(
            file_path=request.file_path,
            validation_rules=request.validation_rules
        )
        
        return InvoiceProcessingResponse(
            extracted_data=result["extracted_data"],
            validation_result=result["validation"],
            confidence=result["confidence"],
            processing_time=result["processing_time"],
            status="completed"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invoice processing failed: {str(e)}")

@app.post("/analytics/predict", response_model=PredictionResponse)
async def generate_predictions(
    request: PredictionRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Generate predictive analytics"""
    try:
        if not predictive_analytics:
            raise HTTPException(status_code=503, detail="Predictive analytics not available")
        
        # Generate predictions
        result = await predictive_analytics.generate_predictions(
            data_type=request.data_type,
            historical_data=request.historical_data,
            prediction_horizon=request.prediction_horizon
        )
        
        return PredictionResponse(
            predictions=result["predictions"],
            confidence_intervals=result["confidence_intervals"],
            recommendations=result["recommendations"],
            model_info=result["model_info"],
            generated_at=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction generation failed: {str(e)}")

@app.get("/rag/domains")
async def get_rag_domains(current_user: Dict = Depends(get_current_user)):
    """Get available RAG domains"""
    try:
        if not rag_service:
            raise HTTPException(status_code=503, detail="RAG service not available")
        
        domains = await rag_service.get_available_domains()
        return {"domains": domains}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get domains: {str(e)}")

@app.get("/rag/domains/{domain}/stats")
async def get_domain_stats(
    domain: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get statistics for a specific RAG domain"""
    try:
        if not rag_service:
            raise HTTPException(status_code=503, detail="RAG service not available")
        
        stats = await rag_service.get_domain_stats(domain)
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get domain stats: {str(e)}")

@app.delete("/rag/domains/{domain}/documents/{document_id}")
async def delete_document(
    domain: str,
    document_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Delete a document from RAG"""
    try:
        if not rag_service:
            raise HTTPException(status_code=503, detail="RAG service not available")
        
        # Check permissions (only admin or document owner can delete)
        if current_user["role"] not in ["admin", "staff"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        success = await rag_service.delete_document(domain, document_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("ENVIRONMENT") == "development"
    )
