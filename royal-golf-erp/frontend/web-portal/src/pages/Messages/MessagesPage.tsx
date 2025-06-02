import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  TextField,
  Button,
  IconButton,
  Badge,
  Paper,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemIcon,
} from '@mui/material';
import {
  Send,
  Search,
  MoreVert,
  AttachFile,
  EmojiEmotions,
  Phone,
  VideoCall,
  PersonAdd,
  Group,
  Delete,
  Archive,
  Star,
  StarBorder,
  ArrowBack,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  isGroup: boolean;
  participants?: string[];
  isStarred: boolean;
}

interface Member {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

const MessagesPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'John Smith',
      lastMessage: 'See you on the course tomorrow!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
      unreadCount: 2,
      isOnline: true,
      isGroup: false,
      isStarred: true,
    },
    {
      id: '2',
      name: 'Golf Buddies',
      lastMessage: 'Who\'s up for an early tee time?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      unreadCount: 0,
      isOnline: false,
      isGroup: true,
      participants: ['John Smith', 'Mike Johnson', 'Sarah Wilson'],
      isStarred: false,
    },
    {
      id: '3',
      name: 'Pro Shop',
      lastMessage: 'Your order is ready for pickup',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unreadCount: 1,
      isOnline: false,
      isGroup: false,
      isStarred: false,
    },
  ]);

  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({
    '1': [
      {
        id: '1',
        content: 'Hey! How was your round yesterday?',
        senderId: '1',
        senderName: 'John Smith',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        type: 'text',
        isRead: true,
      },
      {
        id: '2',
        content: 'It was great! Shot my best score this season.',
        senderId: 'me',
        senderName: `${user?.firstName} ${user?.lastName}`,
        timestamp: new Date(Date.now() - 1000 * 60 * 50),
        type: 'text',
        isRead: true,
      },
      {
        id: '3',
        content: 'Awesome! We should play together soon.',
        senderId: '1',
        senderName: 'John Smith',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        type: 'text',
        isRead: true,
      },
      {
        id: '4',
        content: 'See you on the course tomorrow!',
        senderId: '1',
        senderName: 'John Smith',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        type: 'text',
        isRead: false,
      },
    ],
    '2': [
      {
        id: '5',
        content: 'Good morning everyone!',
        senderId: '2',
        senderName: 'Mike Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        type: 'text',
        isRead: true,
      },
      {
        id: '6',
        content: 'Who\'s up for an early tee time?',
        senderId: '3',
        senderName: 'Sarah Wilson',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: 'text',
        isRead: true,
      },
    ],
    '3': [
      {
        id: '7',
        content: 'Your order is ready for pickup',
        senderId: 'proshop',
        senderName: 'Pro Shop',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        type: 'text',
        isRead: false,
      },
    ],
  });

  const [members] = useState<Member[]>([
    { id: '1', name: 'John Smith', isOnline: true },
    { id: '2', name: 'Mike Johnson', isOnline: false },
    { id: '3', name: 'Sarah Wilson', isOnline: true },
    { id: '4', name: 'Tom Brown', isOnline: false },
    { id: '5', name: 'Lisa Davis', isOnline: true },
  ]);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: 'me',
      senderName: `${user?.firstName} ${user?.lastName}`,
      timestamp: new Date(),
      type: 'text',
      isRead: true,
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), message],
    }));

    // Update conversation last message
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date() }
          : conv
      )
    );

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleStar = (conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, isStarred: !conv.isStarred } : conv
      )
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const handleNewChat = () => {
    setNewChatDialog(false);
    setSelectedMembers([]);
    setIsGroupChat(false);
    // In a real app, this would create a new conversation
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <Box sx={{ 
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Typography 
        variant="h4"
        sx={{ 
          mb: { xs: 2, md: 3 }, 
          fontWeight: 'bold',
          flexShrink: 0,
          fontSize: { xs: '1.5rem', md: '2.125rem' }
        }}
      >
        Messages
      </Typography>

      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ 
        flex: 1,
        height: 0,
        minHeight: 0,
        width: '100%',
        margin: 0,
        '& .MuiGrid-item': {
          paddingLeft: { xs: '4px', sm: '8px', md: '12px' },
          paddingTop: { xs: '4px', sm: '8px', md: '12px' }
        }
      }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4} sx={{ 
          height: { xs: selectedConversation ? '0' : '50%', md: '100%' },
          display: { xs: selectedConversation ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column'
        }}>
          <Card sx={{ 
            height: '100%', 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column',
            minHeight: 0,
            flex: 1
          }}>
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Conversations</Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAdd />}
                  onClick={() => setNewChatDialog(true)}
                >
                  New
                </Button>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
            <List sx={{ flexGrow: 1, overflow: 'auto', pt: 0 }}>
              {filteredConversations.map((conversation, index) => (
                <React.Fragment key={conversation.id}>
                  <ListItem
                    button
                    selected={selectedConversation === conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="success"
                        variant="dot"
                        invisible={!conversation.isOnline}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Avatar>
                          {conversation.isGroup ? (
                            <Group />
                          ) : (
                            conversation.name.charAt(0)
                          )}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    gap: { xs: 1, sm: 0 }
                  }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal' }}>
                            {conversation.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {conversation.isStarred && (
                              <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(conversation.lastMessageTime)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {conversation.lastMessage}
                          </Typography>
                          {conversation.unreadCount > 0 && (
                            <Chip
                              label={conversation.unreadCount}
                              color="primary"
                              size="small"
                              sx={{ minWidth: 20, height: 20, fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredConversations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8} sx={{ 
          height: { xs: selectedConversation ? '100%' : '50%', md: '100%' },
          display: { xs: selectedConversation ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column'
        }}>
          <Card sx={{ 
            height: '100%', 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column',
            minHeight: 0,
            flex: 1
          }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardContent sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider', 
                  pb: 2,
                  flexShrink: 0,
                  p: { xs: 1, sm: 2 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      minWidth: 0,
                      flex: 1
                    }}>
                      <IconButton
                        sx={{ 
                          display: { xs: 'block', md: 'none' }, 
                          mr: 1, 
                          p: 0.5 
                        }}
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowBack />
                      </IconButton>
                      <Avatar sx={{ mr: { xs: 1, sm: 2 }, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                        {currentConversation?.isGroup ? (
                          <Group />
                        ) : (
                          currentConversation?.name.charAt(0)
                        )}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography 
                          variant="h6"
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                          }}
                        >
                          {currentConversation?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentConversation?.isGroup
                            ? `${currentConversation.participants?.length} members`
                            : currentConversation?.isOnline
                            ? 'Online'
                            : 'Last seen recently'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ 
                      display: 'flex',
                      flexShrink: 0,
                      gap: { xs: 0.5, sm: 1 }
                    }}>
                      <IconButton 
                        size="small"
                        onClick={() => toggleStar(selectedConversation)}
                      >
                        {currentConversation?.isStarred ? <Star color="warning" /> : <StarBorder />}
                      </IconButton>
                      <IconButton 
                        size="small"
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                      >
                        <Phone />
                      </IconButton>
                      <IconButton 
                        size="small"
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                      >
                        <VideoCall />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>

                {/* Messages */}
                <Box sx={{ 
                  flexGrow: 1, 
                  overflow: 'auto', 
                  p: { xs: 1, sm: 2 },
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {currentMessages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.senderId === 'me' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Paper
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          maxWidth: { xs: '85%', sm: '70%' },
                          backgroundColor: message.senderId === 'me' ? 'primary.main' : 'grey.100',
                          color: message.senderId === 'me' ? 'white' : 'text.primary',
                          wordBreak: 'break-word'
                        }}
                      >
                        {message.senderId !== 'me' && currentConversation?.isGroup && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 'bold', 
                              display: 'block', 
                              mb: 0.5,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' }
                            }}
                          >
                            {message.senderName}
                          </Typography>
                        )}
                        <Typography 
                          variant="body1"
                          sx={{ 
                            lineHeight: 1.4,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          {message.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7,
                            textAlign: 'right',
                          }}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <CardContent sx={{ 
                  borderTop: 1, 
                  borderColor: 'divider', 
                  pt: 2,
                  flexShrink: 0,
                  p: { xs: 1, sm: 2 }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: { xs: 0.5, sm: 1 },
                    flexWrap: 'nowrap'
                  }}>
                    <IconButton 
                      size="small"
                      sx={{ flexShrink: 0 }}
                    >
                      <AttachFile />
                    </IconButton>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      multiline
                      maxRows={3}
                      sx={{ 
                        flex: 1,
                        '& .MuiInputBase-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton 
                              size="small"
                              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                            >
                              <EmojiEmotions />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      sx={{ 
                        borderRadius: '50%', 
                        minWidth: { xs: 40, sm: 48 }, 
                        width: { xs: 40, sm: 48 }, 
                        height: { xs: 40, sm: 48 },
                        flexShrink: 0
                      }}
                    >
                      <Send sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                    </Button>
                  </Box>
                </CardContent>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  p: { xs: 2, sm: 3 }
                }}
              >
                <Box>
                  <Typography 
                    variant="h6"
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    Select a conversation to start messaging
                  </Typography>
                  <Typography 
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Choose from your existing conversations or start a new one
                  </Typography>
                </Box>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Archive sx={{ mr: 2 }} />
          Archive Chat
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Delete sx={{ mr: 2 }} />
          Delete Chat
        </MenuItem>
      </Menu>

      {/* New Chat Dialog */}
      <Dialog open={newChatDialog} onClose={() => setNewChatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Conversation Type</InputLabel>
              <Select
                value={isGroupChat ? 'group' : 'direct'}
                onChange={(e) => setIsGroupChat(e.target.value === 'group')}
                label="Conversation Type"
              >
                <MenuItem value="direct">Direct Message</MenuItem>
                <MenuItem value="group">Group Chat</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Typography variant="subtitle1" gutterBottom>
            Select Members
          </Typography>
          <List>
            {members.map((member) => (
              <ListItem key={member.id} dense button onClick={() => handleMemberSelect(member.id)}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedMembers.includes(member.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemAvatar>
                  <Badge
                    color="success"
                    variant="dot"
                    invisible={!member.isOnline}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  >
                    <Avatar>{member.name.charAt(0)}</Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText primary={member.name} secondary={member.isOnline ? 'Online' : 'Offline'} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatDialog(false)}>Cancel</Button>
          <Button
            onClick={handleNewChat}
            variant="contained"
            disabled={selectedMembers.length === 0}
          >
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessagesPage;
