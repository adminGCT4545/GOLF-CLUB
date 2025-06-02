import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Chip,
  Divider,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import {
  toggleChatbot,
  closeChatbot,
  minimizeChatbot,
  addUserMessage,
  sendMessage,
  checkAIHealth,
  clearMessages,
  clearError,
} from '../../store/slices/chatbotSlice';

const AIChatbot: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    isOpen, 
    isMinimized, 
    messages, 
    isLoading, 
    error, 
    connectionStatus 
  } = useSelector((state: RootState) => state.chatbot);
  
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check AI health on component mount
  useEffect(() => {
    dispatch(checkAIHealth());
    
    // Set up periodic health check
    const healthCheckInterval = setInterval(() => {
      dispatch(checkAIHealth());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [dispatch]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    dispatch(addUserMessage(message));
    
    // Send to AI
    try {
      await dispatch(sendMessage(message)).unwrap();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple formatting for line breaks
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
      default: return 'default';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'AI Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'AI Offline';
      default: return 'Unknown';
    }
  };

  // Floating chat button when closed
  if (!isOpen) {
    return (
      <Tooltip title="Open AI Assistant" placement="left">
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => dispatch(toggleChatbot())}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1300,
            boxShadow: 3,
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s ease-in-out',
            },
          }}
        >
          <ChatIcon />
        </Fab>
      </Tooltip>
    );
  }

  // Chat window
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: { xs: '90vw', sm: 400 },
        height: isMinimized ? 60 : { xs: '70vh', sm: 500 },
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'height 0.3s ease-in-out',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isMinimized ? 'pointer' : 'default',
        }}
        onClick={isMinimized ? () => dispatch(minimizeChatbot()) : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon />
          <Typography variant="h6" component="h2">
            AI Assistant
          </Typography>
          <Chip
            size="small"
            label={getConnectionStatusText()}
            color={getConnectionStatusColor() as any}
            variant="outlined"
            sx={{ 
              borderColor: 'currentColor',
              color: 'inherit',
              fontSize: '0.7rem',
            }}
          />
        </Box>
        <Box>
          <IconButton
            size="small"
            onClick={() => dispatch(minimizeChatbot())}
            sx={{ color: 'inherit', mr: 1 }}
          >
            <MinimizeIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => dispatch(closeChatbot())}
            sx={{ color: 'inherit' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Chat content - hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 1,
              bgcolor: 'grey.50',
            }}
          >
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 1 }}
                action={
                  <IconButton
                    size="small"
                    onClick={() => dispatch(clearError())}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
              >
                {error}
              </Alert>
            )}
            
            <List sx={{ p: 0 }}>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                    py: 0.5,
                    px: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      maxWidth: '85%',
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                      }}
                    >
                      {message.role === 'user' ? <PersonIcon /> : <AIIcon />}
                    </Avatar>
                    <Paper
                      sx={{
                        p: 1.5,
                        bgcolor: message.role === 'user' ? 'primary.light' : 'white',
                        color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                        maxWidth: '100%',
                      }}
                    >
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {formatMessageContent(message.content)}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                        {message.role === 'assistant' && message.confidence && (
                          <Chip
                            size="small"
                            label={`${Math.round(message.confidence * 100)}% confident`}
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: 20 }}
                          />
                        )}
                      </Box>
                      {message.sources && message.sources.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Sources: {message.sources.join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </ListItem>
              ))}
              
              {isLoading && (
                <ListItem sx={{ display: 'flex', justifyContent: 'flex-start', py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      <AIIcon />
                    </Avatar>
                    <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="textSecondary">
                          AI is thinking...
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </ListItem>
              )}
            </List>
            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* Chat controls */}
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Clear conversation">
              <IconButton
                size="small"
                onClick={() => dispatch(clearMessages())}
                disabled={messages.length <= 1}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh connection">
              <IconButton
                size="small"
                onClick={() => dispatch(checkAIHealth())}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Input */}
          <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask me anything about Royal Golf Club..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || connectionStatus !== 'connected'}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || connectionStatus !== 'connected'}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.300',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AIChatbot;
