import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSocialFeed,
  likePost,
  addComment,
  sharePost,
  reportContent,
  resetFeed,
  addNewPost,
  updatePostInFeed,
  removePostFromFeed,
} from '../../store/slices/engagementSlice';
import { RootState } from '../../store';
import { SocialPost as SocialPostType, ReactionType } from '../../types/engagement';
import SocialPost from '../../components/engagement/SocialPost';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const SocialFeedScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { socialFeed, hasMorePosts, feedCursor, loading, error } = useSelector(
    (state: RootState) => state.engagement
  );

  const { currentUser } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPostType | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filter, setFilter] = useState<'all' | 'following' | 'achievements'>('all');

  useEffect(() => {
    loadFeed();

    // Set up WebSocket connection for real-time updates
    setupWebSocketListeners();

    return () => {
      // Clean up WebSocket listeners
      cleanupWebSocketListeners();
    };
  }, [filter]);

  const setupWebSocketListeners = () => {
    // WebSocket event listeners for real-time updates
    // This would typically be handled by a WebSocket service
    console.log('Setting up WebSocket listeners for social feed');
  };

  const cleanupWebSocketListeners = () => {
    console.log('Cleaning up WebSocket listeners');
  };

  const loadFeed = useCallback(() => {
    dispatch(resetFeed());
    dispatch(
      fetchSocialFeed({
        limit: 20,
        filter: filter !== 'all' ? filter : undefined,
      })
    );
  }, [dispatch, filter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const handleLoadMore = useCallback(() => {
    if (hasMorePosts && !loadingMore && feedCursor) {
      setLoadingMore(true);
      dispatch(
        fetchSocialFeed({
          cursor: feedCursor,
          limit: 20,
          filter: filter !== 'all' ? filter : undefined,
        })
      ).finally(() => {
        setLoadingMore(false);
      });
    }
  }, [dispatch, hasMorePosts, loadingMore, feedCursor, filter]);

  const handleLike = useCallback(
    (postId: string, reaction: ReactionType) => {
      dispatch(likePost({ postId, reaction }));
    },
    [dispatch]
  );

  const handleComment = useCallback(
    (postId: string, content: string, parentId?: string) => {
      dispatch(addComment({ postId, content, parentId }));
    },
    [dispatch]
  );

  const handleShare = useCallback(
    (postId: string) => {
      dispatch(sharePost({ postId }));
    },
    [dispatch]
  );

  const handleProfile = useCallback((userId: string) => {
    // Navigate to user profile
    console.log('Navigate to user profile:', userId);
  }, []);

  const handleReport = useCallback((postId: string) => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
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
        {
          text: 'Other',
          onPress: () => showReportModal(postId),
        },
      ],
      { cancelable: true }
    );
  }, []);

  const submitReport = (postId: string, reason: string, description?: string) => {
    dispatch(
      reportContent({
        contentId: postId,
        contentType: 'post',
        reason,
        description,
      })
    );

    Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
  };

  const showReportModal = (postId: string) => {
    // Show custom report modal for detailed feedback
    Alert.prompt(
      'Report Details',
      'Please provide more details about why you are reporting this post:',
      (text) => {
        if (text && text.trim()) {
          submitReport(postId, 'other', text.trim());
        }
      },
      'plain-text',
      '',
      'default'
    );
  };

  const openCommentModal = (post: SocialPostType) => {
    setSelectedPost(post);
    setShowCommentModal(true);
  };

  const closeCommentModal = () => {
    setSelectedPost(null);
    setShowCommentModal(false);
    setCommentText('');
  };

  const submitComment = () => {
    if (selectedPost && commentText.trim()) {
      handleComment(selectedPost.id, commentText.trim());
      closeCommentModal();
    }
  };

  const navigateToCreatePost = () => {
    // Navigate to create post screen
    console.log('Navigate to create post screen');
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
        onPress={() => setFilter('all')}>
        <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
          All Posts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterButton, filter === 'following' && styles.activeFilter]}
        onPress={() => setFilter('following')}>
        <Text style={[styles.filterText, filter === 'following' && styles.activeFilterText]}>
          Following
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterButton, filter === 'achievements' && styles.activeFilter]}
        onPress={() => setFilter('achievements')}>
        <Text style={[styles.filterText, filter === 'achievements' && styles.activeFilterText]}>
          Achievements
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.screenTitle}>Social Feed</Text>
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={navigateToCreatePost}
      >
        <Text style={styles.createPostText}>✏️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPost = ({ item }: { item: SocialPostType }) => (
    <SocialPost
      post={item}
      onLike={handleLike}
      onComment={(postId, content, parentId) => {
        if (parentId) {
          handleComment(postId, content, parentId);
        } else {
          openCommentModal(item);
        }
      }}
      onShare={handleShare}
      onProfile={handleProfile}
      onReport={handleReport}
      currentUserId={currentUser?.id || ''}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) {return null;}

    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Loading more posts...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📱</Text>
      <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
      <Text style={styles.emptyStateText}>Be the first to share something with the community!</Text>
      <TouchableOpacity
        style={styles.createFirstPostButton}
        onPress={navigateToCreatePost}
      >
        <Text style={styles.createFirstPostText}>Create Your First Post</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCommentModal = () => (
    <Modal
      visible={showCommentModal}
      transparent
      animationType="slide"
      onRequestClose={closeCommentModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.commentModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Comment</Text>
            <TouchableOpacity onPress={closeCommentModal}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedPost && (
            <View style={styles.selectedPostPreview}>
              <Text style={styles.postAuthor}>{selectedPost.author.name}</Text>
              <Text style={styles.postContent} numberOfLines={2}>
                {selectedPost.content}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            autoFocus
          />

          <View style={styles.commentActions}>
            <Text style={styles.characterCount}>{commentText.length} / 500</Text>
            <TouchableOpacity
              style={[styles.submitCommentButton, !commentText.trim() && styles.disabledButton]}
              onPress={submitComment}
              disabled={!commentText.trim()}>
              <Text style={[styles.submitCommentText, !commentText.trim() && styles.disabledText]}>
                Post Comment
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading.socialFeed && socialFeed.length === 0) {
    return <LoadingOverlay message="Loading social feed..." />;
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilterButtons()}

      <FlatList
        data={socialFeed}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading.socialFeed ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        windowSize={10}
      />

      {renderCommentModal()}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFeed}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createPostButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  activeFilter: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createFirstPostButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstPostText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  commentModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#757575',
  },
  selectedPostPreview: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 8,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  commentInput: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    maxHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#888',
  },
  submitCommentButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  submitCommentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#BDBDBD',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFCDD2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SocialFeedScreen;
