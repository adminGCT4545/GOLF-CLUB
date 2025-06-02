export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string; // Message ID being replied to
  reactions?: MessageReaction[];
  status: MessageStatus;
  attachments?: MessageAttachment[];
  encryptedContent?: string;
  readBy?: MessageRead[];
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
  timestamp: Date;
}

export interface MessageRead {
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface MessageAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnail?: string;
  duration?: number; // For audio/video files
  width?: number; // For images/videos
  height?: number; // For images/videos
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string; // For group chats
  avatar?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  isMuted: boolean;
  muteUntil?: Date;
  groupSettings?: GroupChatSettings;
  isTyping?: string[]; // User IDs currently typing
  onlineUsers?: string[]; // User IDs currently online
}

export interface ConversationParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: ParticipantRole;
  joinedAt: Date;
  lastSeenAt?: Date;
  isOnline: boolean;
}

export interface GroupChatSettings {
  id: string;
  conversationId: string;
  description?: string;
  groupPhoto?: string;
  isPublic: boolean;
  allowMemberInvites: boolean;
  allowMemberAddMembers: boolean;
  allowMemberRemoveMembers: boolean;
  allowMemberEditGroup: boolean;
  maxMembers: number;
  createdBy: string;
  admins: string[]; // User IDs
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface OnlinePresence {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
  status?: PresenceStatus;
}

export interface MessageQueue {
  id: string;
  message: Omit<Message, 'id' | 'timestamp' | 'status'>;
  retryCount: number;
  timestamp: Date;
}

export interface ConversationFilter {
  searchQuery?: string;
  type?: ConversationType;
  showArchived?: boolean;
  showMuted?: boolean;
}

export interface MessageFilter {
  conversationId: string;
  limit?: number;
  offset?: number;
  before?: Date;
  after?: Date;
  messageType?: MessageType;
  senderId?: string;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  VOICE_NOTE = 'voice_note',
  LOCATION = 'location',
  SYSTEM = 'system',
  POLL = 'poll',
  EVENT = 'event',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  BROADCAST = 'broadcast',
}

export enum ParticipantRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  VOICE_NOTE = 'voice_note',
}

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

// API Response Types
export interface ConversationsResponse {
  conversations: Conversation[];
  totalCount: number;
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  totalCount: number;
  hasMore: boolean;
}

export interface CreateConversationRequest {
  type: ConversationType;
  participantIds: string[];
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type: MessageType;
  replyTo?: string;
  attachments?: Omit<MessageAttachment, 'id'>[];
}

export interface UpdateGroupSettingsRequest {
  conversationId: string;
  name?: string;
  description?: string;
  groupPhoto?: string;
  isPublic?: boolean;
  allowMemberInvites?: boolean;
  allowMemberAddMembers?: boolean;
  allowMemberRemoveMembers?: boolean;
  allowMemberEditGroup?: boolean;
  maxMembers?: number;
}

export interface AddParticipantsRequest {
  conversationId: string;
  participantIds: string[];
}

export interface RemoveParticipantRequest {
  conversationId: string;
  participantId: string;
}

export interface UpdateParticipantRoleRequest {
  conversationId: string;
  participantId: string;
  role: ParticipantRole;
}

// WebSocket Event Types
export interface WSMessageEvent {
  type: 'message';
  data: Message;
}

export interface WSTypingEvent {
  type: 'typing';
  data: TypingIndicator;
}

export interface WSPresenceEvent {
  type: 'presence';
  data: OnlinePresence;
}

export interface WSMessageStatusEvent {
  type: 'message_status';
  data: {
    messageId: string;
    status: MessageStatus;
    timestamp: Date;
  };
}

export interface WSConversationEvent {
  type: 'conversation_updated';
  data: Conversation;
}

export type WSEvent =
  | WSMessageEvent
  | WSTypingEvent
  | WSPresenceEvent
  | WSMessageStatusEvent
  | WSConversationEvent;
