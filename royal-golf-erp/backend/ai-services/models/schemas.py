"""
Pydantic schemas for Royal Golf Club AI Services
"""

from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, validator

class ChatMessage(BaseModel):
    """Individual chat message"""
    role: str = Field(..., description="Role of the message sender (user, assistant, system)")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    """Request for AI chat"""
    message: str = Field(..., description="User message", min_length=1, max_length=2000)
    domain: str = Field(default="operations", description="RAG domain to search")
    conversation_history: List[ChatMessage] = Field(default=[], description="Previous conversation messages")
    max_context_results: int = Field(default=5, description="Maximum context results from RAG", ge=1, le=20)
    temperature: float = Field(default=0.7, description="LLM temperature", ge=0.0, le=2.0)
    
    @validator('domain')
    def validate_domain(cls, v):
        allowed_domains = ['operations', 'member_services', 'financial', 'maintenance']
        if v not in allowed_domains:
            raise ValueError(f'Domain must be one of: {allowed_domains}')
        return v

class ContextSource(BaseModel):
    """Source of context information"""
    document_id: str
    document_name: str
    relevance_score: float
    excerpt: str
    metadata: Dict[str, Any] = {}

class ChatResponse(BaseModel):
    """Response from AI chat"""
    response: str = Field(..., description="AI generated response")
    context_used: List[ContextSource] = Field(default=[], description="Context sources used")
    confidence: float = Field(..., description="Confidence score", ge=0.0, le=1.0)
    sources: List[str] = Field(default=[], description="Source references")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DocumentUploadResponse(BaseModel):
    """Response for document upload"""
    filename: str
    size: int
    domain: str
    status: str = Field(..., description="Processing status")
    message: str
    document_id: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class InvoiceProcessingRequest(BaseModel):
    """Request for invoice processing"""
    file_path: str = Field(..., description="Path to invoice file")
    validation_rules: Dict[str, Any] = Field(default={}, description="Custom validation rules")
    extract_line_items: bool = Field(default=True, description="Whether to extract line items")
    ocr_language: str = Field(default="eng", description="OCR language code")

class ExtractedInvoiceData(BaseModel):
    """Extracted invoice data"""
    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    subtotal: Optional[float] = None
    currency: Optional[str] = None
    line_items: List[Dict[str, Any]] = []
    payment_terms: Optional[str] = None

class ValidationResult(BaseModel):
    """Invoice validation result"""
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    confidence_scores: Dict[str, float] = {}

class InvoiceProcessingResponse(BaseModel):
    """Response for invoice processing"""
    extracted_data: ExtractedInvoiceData
    validation_result: ValidationResult
    confidence: float = Field(..., ge=0.0, le=1.0)
    processing_time: float = Field(..., description="Processing time in seconds")
    status: str
    processed_at: datetime = Field(default_factory=datetime.utcnow)

class PredictionRequest(BaseModel):
    """Request for predictive analytics"""
    data_type: str = Field(..., description="Type of prediction")
    historical_data: Dict[str, Any] = Field(..., description="Historical data for prediction")
    prediction_horizon: int = Field(default=30, description="Prediction horizon in days", ge=1, le=365)
    include_confidence_intervals: bool = Field(default=True)
    model_type: Optional[str] = Field(default=None, description="Specific model to use")
    
    @validator('data_type')
    def validate_data_type(cls, v):
        allowed_types = ['inventory', 'revenue', 'member_retention', 'maintenance', 'demand']
        if v not in allowed_types:
            raise ValueError(f'Data type must be one of: {allowed_types}')
        return v

class PredictionPoint(BaseModel):
    """Individual prediction point"""
    date: str
    value: float
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None

class ModelInfo(BaseModel):
    """Information about the prediction model"""
    model_type: str
    accuracy_score: Optional[float] = None
    training_data_points: int
    last_trained: datetime
    features_used: List[str] = []

class PredictionResponse(BaseModel):
    """Response for predictive analytics"""
    predictions: List[PredictionPoint]
    confidence_intervals: Dict[str, float] = {}
    recommendations: List[str] = []
    model_info: ModelInfo
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Overall health status")
    timestamp: str
    services: Dict[str, Dict[str, Any]] = {}

class RAGDomainStats(BaseModel):
    """Statistics for a RAG domain"""
    domain: str
    document_count: int
    total_chunks: int
    last_updated: Optional[datetime] = None
    storage_size_mb: float
    average_chunk_size: int

class UserInfo(BaseModel):
    """User information from JWT token"""
    id: str
    email: str
    member_number: str
    role: str
    membership_tier: str
    permissions: Dict[str, Any] = {}

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None

class DocumentMetadata(BaseModel):
    """Document metadata for RAG"""
    filename: str
    file_type: str
    size: int
    uploaded_by: str
    uploaded_at: datetime
    domain: str
    processing_status: str
    chunk_count: Optional[int] = None
    language: Optional[str] = None
    tags: List[str] = []

class SearchRequest(BaseModel):
    """Request for document search"""
    query: str = Field(..., min_length=1, max_length=500)
    domain: Optional[str] = None
    max_results: int = Field(default=10, ge=1, le=50)
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    include_metadata: bool = Field(default=True)

class SearchResult(BaseModel):
    """Search result item"""
    document_id: str
    document_name: str
    chunk_text: str
    similarity_score: float
    metadata: Optional[DocumentMetadata] = None

class SearchResponse(BaseModel):
    """Response for document search"""
    results: List[SearchResult]
    total_results: int
    query: str
    search_time: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AnalyticsMetrics(BaseModel):
    """Analytics metrics"""
    total_queries: int
    average_response_time: float
    popular_domains: Dict[str, int]
    user_activity: Dict[str, int]
    error_rate: float
    uptime_percentage: float

class SystemStats(BaseModel):
    """System statistics"""
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    cache_hit_rate: float
    database_connections: int

class MaintenanceRequest(BaseModel):
    """Maintenance operation request"""
    operation: str = Field(..., description="Maintenance operation type")
    domain: Optional[str] = None
    parameters: Dict[str, Any] = {}
    
    @validator('operation')
    def validate_operation(cls, v):
        allowed_operations = ['reindex', 'cleanup', 'backup', 'optimize', 'reset']
        if v not in allowed_operations:
            raise ValueError(f'Operation must be one of: {allowed_operations}')
        return v

class MaintenanceResponse(BaseModel):
    """Maintenance operation response"""
    operation: str
    status: str
    message: str
    details: Dict[str, Any] = {}
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[float] = None
