import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  addComment,
  updateComment,
  deleteComment,
  likePost,
  sharePost,
  reportContent,
  setSelectedPost,
} from '../../store/slices/engagementSlice';
import { RootState } from '../../store';
import {
  SocialPost as SocialPostType,
  Comment as CommentType,
  ReactionType,
} from '../../types/engagement';
import SocialPost from '../../components/engagement/SocialPost';
import Comment from '../../components/engagement/Comment';
import LoadingOverlay from '../../components/common/LoadingOverlay';

interface PostDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      postId: string;
    };
  };
}

const PostDetailsScreen: React.FC<PostDetailsScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { selectedPost, socialFeed, loading } = useSelector((state: RootState) => state.engagement);
  const { currentUser } = useSelector((state: RootState) => state.auth);

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; authorName: string } | null>(
    null
  );
  const [editingComment, setEditingComment] = useState<CommentType | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);

  const { postId } = route.params;

  useEffect(() => {
    // Find the post in the feed or load it separately
    const post = socialFeed.find((p) => p.id === postId);
    if (post) {
      dispatch(setSelectedPost(post));
    } else {
      // Load post separately if not in feed
      // This would typically be an API call
      console.log('Load post separately:', postId);
    }

    return () => {
      dispatch(setSelectedPost(null));
    };
  }, [postId, socialFeed, dispatch]);

  const handleLike = useCallback(
    (postId: string, reaction: ReactionType) => {
      dispatch(likePost({ postId, reaction }));
    },
    [dispatch]
  );

  const handleComment = useCallback(
    (postId: string, content: string, parentId?: string) => {
      dispatch(addComment({ postId, content, parentId }));
      setCommentText('');
      setReplyingTo(null);
    },
    [dispatch]
  );

  const handleCommentLike = useCallback((commentId: string, reaction: ReactionType) => {
    // Handle comment likes - this would be a separate action
    console.log('Like comment:', commentId, reaction);
  }, []);

  const handleShare = useCallback(
    (postId: string) => {
      dispatch(sharePost({ postId }));
    },
    [dispatch]
  );

  const handleProfile = useCallback(
    (userId: string) => {
      // Navigate to user profile
      navigation.navigate('MemberProfile', { userId });
    },
    [navigation]
  );

  const handleReport = useCallback((postId: string) => {
    Alert.alert('Report Post', 'Why are you reporting this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Inappropriate Content',
        onPress: () => submitReport(postId, 'inappropriate_content'),
      },
      {
        text: 'Spam',
        onPress: () => submitReport(postId, 'spam'),
      },
      {
        text: 'Harassment',
        onPress: () => submitReport(postId, 'harassment'),
      },
    ]);
  }, []);

  const submitReport = (postId: string, reason: string) => {
    dispatch(
      reportContent({
        contentId: postId,
        contentType: 'post',
        reason,
      })
    );

    Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
  };

  const handleReportComment = useCallback(
    (commentId: string) => {
      Alert.alert('Report Comment', 'Are you sure you want to report this comment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            dispatch(
              reportContent({
                contentId: commentId,
                contentType: 'comment',
                reason: 'inappropriate_content',
              })
            );
            Alert.alert('Report Submitted', 'Thank you for your report.');
          },
        },
      ]);
    },
    [dispatch]
  );

  const handleReply = (parentId: string, authorName: string) => {
    setReplyingTo({ commentId: parentId, authorName });
    setCommentText(`@${authorName} `);
  };

  const handleEditComment = (comment: CommentType) => {
    setEditingComment(comment);
    setCommentText(comment.content);
  };

  const submitEdit = () => {
    if (editingComment && selectedPost) {
      dispatch(
        updateComment({
          postId: selectedPost.id,
          commentId: editingComment.id,
          content: commentText,
        })
      );
      setEditingComment(null);
      setCommentText('');
    }
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
    setReplyingTo(null);
  };

  const handleDeleteComment = (commentId: string) => {
    if (selectedPost) {
      Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(
              deleteComment({
                postId: selectedPost.id,
                commentId,
              })
            );
          },
        },
      ]);
    }
  };

  const submitComment = () => {
    if (!selectedPost || !commentText.trim()) {return;}

    if (editingComment) {
      submitEdit();
    } else {
      handleComment(selectedPost.id, commentText.trim(), replyingTo?.commentId);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Post</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderCommentInput = () => (
    <View style={styles.commentInputContainer}>
      {(replyingTo || editingComment) && (
        <View style={styles.replyHeader}>
          <Text style={styles.replyText}>
            {editingComment ? 'Editing comment' : `Replying to @${replyingTo?.authorName}`}
          </Text>
          <TouchableOpacity onPress={cancelEdit}>
            <Text style={styles.cancelReply}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder={
            editingComment
              ? 'Edit your comment...'
              : replyingTo
              ? `Reply to @${replyingTo.authorName}...`
              : 'Add a comment...'
          }
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.submitButton, !commentText.trim() && styles.disabledButton]}
          onPress={submitComment}
          disabled={!commentText.trim()}>
          <Text style={[styles.submitButtonText, !commentText.trim() && styles.disabledText]}>
            {editingComment ? 'Save' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.characterCount}>{commentText.length} / 500</Text>
    </View>
  );

  const renderComments = () => {
    if (!selectedPost || selectedPost.comments.length === 0) {
      return (
        <View style={styles.noComments}>
          <Text style={styles.noCommentsText}>No comments yet</Text>
          <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
        </View>
      );
    }

    const commentsToShow = showAllComments
      ? selectedPost.comments
      : selectedPost.comments.slice(0, 5);

    return (
      <View style={styles.commentsSection}>
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>Comments ({selectedPost.comments.length})</Text>
          {selectedPost.comments.length > 5 && (
            <TouchableOpacity onPress={() => setShowAllComments(!showAllComments)}>
              <Text style={styles.showMoreComments}>
                {showAllComments ? 'Show Less' : 'Show All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {commentsToShow.map((comment) => (
          <View key={comment.id} style={styles.commentWrapper}>
            <Comment
              comment={comment}
              onReply={(parentId, content) => handleComment(selectedPost.id, content, parentId)}
              onLike={handleCommentLike}
              onReport={handleReportComment}
              currentUserId={currentUser?.id || ''}
            />

            {comment.author.id === currentUser?.id && (
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={styles.commentActionButton}
                  onPress={() => handleEditComment(comment)}>
                  <Text style={styles.commentActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commentActionButton}
                  onPress={() => handleDeleteComment(comment.id)}>
                  <Text style={[styles.commentActionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (!selectedPost) {
    return <LoadingOverlay message="Loading post..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SocialPost
          post={selectedPost}
          onLike={handleLike}
          onComment={(postId, content, parentId) => {
            if (parentId) {
              handleComment(postId, content, parentId);
            } else {
              // Just focus the input for top-level comments
              console.log('Focus comment input');
            }
          }}
          onShare={handleShare}
          onProfile={handleProfile}
          onReport={handleReport}
          currentUserId={currentUser?.id || ''}
        />

        {renderComments()}
      </ScrollView>

      {renderCommentInput()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 50, // Balance the header
  },
  content: {
    flex: 1,
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  showMoreComments: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  commentWrapper: {
    paddingHorizontal: 16,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 12,
  },
  commentActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  deleteText: {
    color: '#F44336',
  },
  noComments: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#666',
  },
  commentInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  cancelReply: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#BDBDBD',
  },
  characterCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
});

export default PostDetailsScreen;
