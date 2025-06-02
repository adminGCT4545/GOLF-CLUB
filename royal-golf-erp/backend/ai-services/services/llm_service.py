"""
LM Studio Service for Royal Golf Club AI Services
Handles communication with LM Studio local LLM instance
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional
import httpx
from datetime import datetime

class LMStudioService:
    """Service for interacting with LM Studio local LLM"""
    
    def __init__(self, base_url: str = "http://192.168.0.204:4545"):
        self.base_url = base_url.rstrip('/')
        self.client = None
        self.model_info = None
        self.is_initialized = False
        
    async def initialize(self):
        """Initialize the LM Studio service"""
        try:
            self.client = httpx.AsyncClient(
                timeout=httpx.Timeout(60.0),
                limits=httpx.Limits(max_connections=10, max_keepalive_connections=5)
            )
            
            # Test connection and get model info
            await self._test_connection()
            await self._get_model_info()
            
            self.is_initialized = True
            print(f"✅ LM Studio service initialized with model: {self.model_info.get('name', 'Unknown')}")
            
        except Exception as e:
            print(f"❌ Failed to initialize LM Studio service: {e}")
            raise
    
    async def _test_connection(self):
        """Test connection to LM Studio"""
        try:
            response = await self.client.get(f"{self.base_url}/v1/models")
            if response.status_code != 200:
                raise Exception(f"LM Studio not responding: {response.status_code}")
        except httpx.ConnectError:
            raise Exception("Cannot connect to LM Studio. Ensure it's running on the specified URL.")
    
    async def _get_model_info(self):
        """Get information about the loaded model"""
        try:
            response = await self.client.get(f"{self.base_url}/v1/models")
            if response.status_code == 200:
                models = response.json()
                if models.get("data"):
                    self.model_info = models["data"][0]  # Get first available model
                else:
                    self.model_info = {"name": "Unknown", "id": "unknown"}
            else:
                self.model_info = {"name": "Unknown", "id": "unknown"}
        except Exception as e:
            print(f"Warning: Could not get model info: {e}")
            self.model_info = {"name": "Unknown", "id": "unknown"}
    
    async def generate_response(
        self,
        message: str,
        context: List[Dict[str, Any]] = None,
        user_info: Dict[str, Any] = None,
        conversation_history: List[Dict[str, str]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """Generate AI response using LM Studio"""
        
        if not self.is_initialized:
            raise Exception("LM Studio service not initialized")
        
        try:
            # Build system prompt with context
            system_prompt = self._build_system_prompt(context, user_info)
            
            # Build conversation messages
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history[-10:]:  # Limit to last 10 messages
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Prepare request payload
            payload = {
                "model": self.model_info.get("id", "unknown"),
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": False
            }
            
            start_time = time.time()
            
            # Make request to LM Studio
            response = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            processing_time = time.time() - start_time
            
            if response.status_code != 200:
                raise Exception(f"LM Studio API error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            # Extract response text
            if result.get("choices") and len(result["choices"]) > 0:
                response_text = result["choices"][0]["message"]["content"]
                
                # Calculate confidence based on response quality
                confidence = self._calculate_confidence(response_text, context)
                
                # Extract sources from context
                sources = []
                if context:
                    sources = [ctx.get("document_name", "Unknown") for ctx in context[:3]]
                
                return {
                    "text": response_text,
                    "confidence": confidence,
                    "sources": sources,
                    "processing_time": processing_time,
                    "model_used": self.model_info.get("name", "Unknown"),
                    "tokens_used": result.get("usage", {}).get("total_tokens", 0)
                }
            else:
                raise Exception("No response generated by LM Studio")
                
        except Exception as e:
            print(f"Error generating response: {e}")
            raise Exception(f"Failed to generate AI response: {str(e)}")
    
    def _build_system_prompt(self, context: List[Dict[str, Any]] = None, user_info: Dict[str, Any] = None) -> str:
        """Build system prompt with context and user information"""
        
        base_prompt = """You are an AI assistant for the Royal Golf Club, a premium golf club management system. 
You help with member services, operations, financial matters, and maintenance issues.

Key Guidelines:
- Be professional, helpful, and knowledgeable about golf club operations
- Provide accurate information based on the context provided
- If you don't have enough information, ask clarifying questions
- Always prioritize member satisfaction and club efficiency
- Use golf industry terminology appropriately
- Be concise but thorough in your responses"""

        # Add user context
        if user_info:
            user_context = f"""
Current User Information:
- Name: {user_info.get('firstName', '')} {user_info.get('lastName', '')}
- Member Number: {user_info.get('memberNumber', 'N/A')}
- Membership Tier: {user_info.get('membershipTier', 'N/A')}
- Role: {user_info.get('role', 'member')}
"""
            base_prompt += user_context
        
        # Add relevant context from RAG
        if context and len(context) > 0:
            context_text = "\nRelevant Information:\n"
            for i, ctx in enumerate(context[:5], 1):
                context_text += f"{i}. From '{ctx.get('document_name', 'Unknown')}': {ctx.get('excerpt', '')}\n"
            
            base_prompt += context_text
        
        base_prompt += "\nPlease provide helpful and accurate responses based on this information."
        
        return base_prompt
    
    def _calculate_confidence(self, response_text: str, context: List[Dict[str, Any]] = None) -> float:
        """Calculate confidence score for the response"""
        
        confidence = 0.5  # Base confidence
        
        # Increase confidence if response is substantial
        if len(response_text) > 50:
            confidence += 0.1
        
        # Increase confidence if context was provided
        if context and len(context) > 0:
            confidence += 0.2
        
        # Increase confidence based on response quality indicators
        quality_indicators = [
            "specific", "detailed", "recommend", "suggest", "according to",
            "based on", "policy", "procedure", "guideline"
        ]
        
        for indicator in quality_indicators:
            if indicator.lower() in response_text.lower():
                confidence += 0.05
        
        # Decrease confidence for uncertainty indicators
        uncertainty_indicators = [
            "i'm not sure", "i don't know", "unclear", "uncertain",
            "might be", "could be", "possibly"
        ]
        
        for indicator in uncertainty_indicators:
            if indicator.lower() in response_text.lower():
                confidence -= 0.1
        
        # Ensure confidence is between 0 and 1
        return max(0.0, min(1.0, confidence))
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of LM Studio service"""
        try:
            if not self.client:
                return {"status": "not_initialized"}
            
            start_time = time.time()
            response = await self.client.get(f"{self.base_url}/v1/models")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "response_time": f"{response_time:.3f}s",
                    "model": self.model_info.get("name", "Unknown"),
                    "base_url": self.base_url
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": f"HTTP {response.status_code}",
                    "base_url": self.base_url
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "base_url": self.base_url
            }
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get current model information"""
        return self.model_info or {"name": "Unknown", "id": "unknown"}
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate text embedding (if supported by the model)"""
        try:
            payload = {
                "model": self.model_info.get("id", "unknown"),
                "input": text
            }
            
            response = await self.client.post(
                f"{self.base_url}/v1/embeddings",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("data") and len(result["data"]) > 0:
                    return result["data"][0]["embedding"]
            
            # Fallback: return dummy embedding
            return [0.0] * 384  # Standard embedding size
            
        except Exception as e:
            print(f"Warning: Could not generate embedding: {e}")
            return [0.0] * 384
    
    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
            self.client = None
            self.is_initialized = False
