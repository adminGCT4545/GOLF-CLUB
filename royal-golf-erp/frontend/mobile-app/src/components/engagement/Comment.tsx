import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { Comment as CommentType, ReactionType } from '../../types/engagement';

interface CommentProps {
  comment: CommentType;
  onReply: (parentId: string, content: string) => void;
  onLike: (commentId: string, reaction: ReactionType) => void;
  onReport?: (commentId: string) => void;
  currentUserId: string;
  level?: number;
  maxLevel?: number;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onReply,
  onLike,
  onReport,
  currentUserId,
  level = 0,
  maxLevel = 3,
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const isLikedByUser = comment.likes.some((like) => like.memberId === currentUserId);
  const isAuthor = comment.author.id === currentUserId;
  const canReply = level < maxLevel;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }
    if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    }
    if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    }
    if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d`;
    }

    return new Date(date).toLocaleDateString();
  };

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
      setShowReplies(true);
    }
  };

  const handleLike = () => {
    onLike(comment.id, ReactionType.LIKE);
  };

  const handleReport = () => {
    if (onReport) {
      Alert.alert('Report Comment', 'Are you sure you want to report this comment?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => onReport(comment.id) },
      ]);
    }
  };

  const marginLeft = level * 24;

  return (
    <View style={[styles.container, { marginLeft }]}>
      <View style={styles.commentHeader}>
        {comment.author.avatar ? (
          <Image source={{ uri: comment.author.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{comment.author.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.authorName}>{comment.author.name}</Text>
            <Text style={styles.contentText}>{comment.content}</Text>
          </View>

          <View style={styles.commentActions}>
            <Text style={styles.timestamp}>{formatTimeAgo(comment.createdAt)}</Text>

            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Text style={[styles.actionText, isLikedByUser && styles.likedText]}>
                👍 {comment.likes.length > 0 ? comment.likes.length : 'Like'}
              </Text>
            </TouchableOpacity>

            {canReply && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowReplyInput(!showReplyInput)}>
                <Text style={styles.actionText}>Reply</Text>
              </TouchableOpacity>
            )}

            {comment.isEdited && <Text style={styles.editedText}>Edited</Text>}

            {!isAuthor && onReport && (
              <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
                <Text style={styles.reportText}>Report</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Reply Input */}
      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder={`Reply to ${comment.author.name}...`}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowReplyInput(false);
                setReplyText('');
              }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !replyText.trim() && styles.disabledButton]}
              onPress={handleReply}
              disabled={!replyText.trim()}>
              <Text
                style={[styles.submitButtonText, !replyText.trim() && styles.disabledButtonText]}>
                Reply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {!showReplies && (
            <TouchableOpacity style={styles.showRepliesButton} onPress={() => setShowReplies(true)}>
              <Text style={styles.showRepliesText}>
                View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}

          {showReplies && (
            <>
              <TouchableOpacity
                style={styles.hideRepliesButton}
                onPress={() => setShowReplies(false)}>
                <Text style={styles.hideRepliesText}>
                  Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>

              {comment.replies.map((reply) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onReport={onReport}
                  currentUserId={currentUserId}
                  level={level + 1}
                  maxLevel={maxLevel}
                />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#757575',
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
    marginRight: 12,
  },
  actionButton: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  likedText: {
    color: '#2196F3',
  },
  editedText: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
  reportText: {
    fontSize: 12,
    color: '#F44336',
  },
  replyInputContainer: {
    marginTop: 8,
    marginLeft: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
  },
  replyInput: {
    fontSize: 14,
    color: '#333',
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#BDBDBD',
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 40,
  },
  showRepliesButton: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  showRepliesText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  hideRepliesButton: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  hideRepliesText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
});

export default Comment;
