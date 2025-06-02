const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// AI Services configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// Chat endpoint
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, user_info, conversation_history, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Forward request to AI service
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/chat`, {
      message: message.trim(),
      user_info: {
        ...user_info,
        user_id: req.user.id,
        role: req.user.role
      },
      conversation_history: conversation_history || [],
      context: context || []
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      data: aiResponse.data
    });

  } catch (error) {
    console.error('AI Chat Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'AI service is currently unavailable'
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'AI service error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', authMiddleware, async (req, res) => {
  try {
    const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 10000
    });

    res.json({
      success: true,
      data: healthResponse.data
    });

  } catch (error) {
    console.error('AI Health Check Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'AI service is not running',
        status: 'unhealthy'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to check AI service health',
      status: 'unknown'
    });
  }
});

// Get model information
router.get('/model-info', authMiddleware, async (req, res) => {
  try {
    const modelResponse = await axios.get(`${AI_SERVICE_URL}/model-info`, {
      timeout: 10000
    });

    res.json({
      success: true,
      data: modelResponse.data
    });

  } catch (error) {
    console.error('AI Model Info Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get model information'
    });
  }
});

// Test connection endpoint
router.get('/test', authMiddleware, async (req, res) => {
  try {
    const testResponse = await axios.post(`${AI_SERVICE_URL}/chat`, {
      message: "Hello, this is a test message.",
      user_info: {
        firstName: "Test",
        lastName: "User",
        role: "test"
      },
      conversation_history: [],
      context: []
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      message: 'AI service test successful',
      data: testResponse.data
    });

  } catch (error) {
    console.error('AI Test Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'AI service test failed',
      details: error.message
    });
  }
});

module.exports = router;
