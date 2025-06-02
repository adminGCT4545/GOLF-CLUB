import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SocialPost as SocialPostType, ReactionType, PostType } from '../../types/engagement';
import Comment from './Comment';

interface SocialPostProps {
  post: SocialPostType;
  onLike: (postId: string, reaction: ReactionType) => void;
  onComment: (postId: string, content: string, parentId?: string) => void;
  onShare: (postId: string) => void;
  onProfile: (userId: string) => void;
  onReport: (postId: string) => void;
  currentUserId: string;
}

const { width: screenWidth } = Dimensions.get('window');

const SocialPost: React.FC<SocialPostProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onProfile,
  onReport,
  currentUserId,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showReactions, setShowReactions] = useState(false);

  const reactions = [
    { type: ReactionType.LIKE, emoji: '👍', label: 'Like' },
    { type: ReactionType.LOVE, emoji: '❤️', label: 'Love' },
    { type: ReactionType.LAUGH, emoji: '😂', label: 'Laugh' },
    { type: ReactionType.WOW, emoji: '😮', label: 'Wow' },
    { type: ReactionType.ANGRY, emoji: '😠', label: 'Angry' },
    { type: ReactionType.SAD, emoji: '😢', label: 'Sad' },
  ];

  const getUserReaction = () => {
    return post.likes.find((like) => like.memberId === currentUserId);
  };

  const getReactionCounts = () => {
    const counts: { [key in ReactionType]?: number } = {};
    post.likes.forEach((like) => {
      counts[like.reaction] = (counts[like.reaction] || 0) + 1;
    });
    return counts;
  };

  const getMostPopularReactions = () => {
    const counts = getReactionCounts();
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([reaction]) => reaction as ReactionType);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }
    if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    }
    if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }
    if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    return new Date(date).toLocaleDateString();
  };

  const handleReaction = (reaction: ReactionType) => {
    onLike(post.id, reaction);
    setShowReactions(false);
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        message: `Check out this post from ${post.author.name}: ${post.content}`,
        url: `https://royalgolfclub.com/posts/${post.id}`,
      };

      await Share.share(shareContent);
      onShare(post.id);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleReport = () => {
    Alert.alert('Report Post', 'Are you sure you want to report this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => onReport(post.id) },
    ]);
  };

  const renderPostHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.authorInfo} onPress={() => onProfile(post.author.id)}>
        {post.author.avatar ? (
          <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{post.author.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.authorDetails}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
            {post.isEdited && <Text style={styles.edited}>• Edited</Text>}
            {post.location && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.location}>
                  📍 {post.location.courseName}
                  {post.location.hole && ` - Hole ${post.location.hole}`}
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleReport} style={styles.moreButton}>
        <Text style={styles.moreText}>⋯</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPostContent = () => (
    <View style={styles.content}>
      {post.content && <Text style={styles.contentText}>{post.content}</Text>}

      {post.taggedMembers.length > 0 && (
        <View style={styles.taggedMembers}>
          <Text style={styles.taggedText}>
            with {post.taggedMembers.map((member) => member.name).join(', ')}
          </Text>
        </View>
      )}

      {post.media && post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentMediaIndex(index);
            }}>
            {post.media.map((media, index) => (
              <View key={media.id} style={styles.mediaItem}>
                <Image source={{ uri: media.url }} style={styles.mediaImage} resizeMode="cover" />
                {media.caption && (
                  <View style={styles.mediaCaption}>
                    <Text style={styles.captionText}>{media.caption}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {post.media.length > 1 && (
            <View style={styles.mediaIndicators}>
              {post.media.map((_, index) => (
                <View
                  key={index}
                  style={[styles.indicator, index === currentMediaIndex && styles.activeIndicator]}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderEngagement = () => {
    const userReaction = getUserReaction();
    const popularReactions = getMostPopularReactions();
    const totalLikes = post.likes.length;
    const totalComments = post.comments.length;
    const totalShares = post.shares.length;

    return (
      <View style={styles.engagement}>
        {/* Reaction summary */}
        {totalLikes > 0 && (
          <View style={styles.reactionSummary}>
            <View style={styles.popularReactions}>
              {popularReactions.map((reaction) => {
                const reactionData = reactions.find((r) => r.type === reaction);
                return (
                  <Text key={reaction} style={styles.reactionEmoji}>
                    {reactionData?.emoji}
                  </Text>
                );
              })}
            </View>
            <Text style={styles.likeCount}>
              {totalLikes} {totalLikes === 1 ? 'reaction' : 'reactions'}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              userReaction ? handleReaction(userReaction.reaction) : setShowReactions(true)
            }
            onLongPress={() => setShowReactions(true)}>
            <Text style={[styles.actionText, userReaction && styles.activeAction]}>
              {userReaction ? reactions.find((r) => r.type === userReaction.reaction)?.emoji : '👍'}{' '}
              Like
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}>
            <Text style={styles.actionText}>💬 Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        {/* Reaction picker */}
        {showReactions && (
          <View style={styles.reactionPicker}>
            {reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction.type}
                style={styles.reactionOption}
                onPress={() => handleReaction(reaction.type)}>
                <Text style={styles.reactionOptionEmoji}>{reaction.emoji}</Text>
                <Text style={styles.reactionOptionLabel}>{reaction.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Comments section */}
        {showComments && (
          <View style={styles.commentsSection}>
            {post.comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onReply={(parentId, content) => onComment(post.id, content, parentId)}
                onLike={(commentId, reaction) => {
                  // Handle comment likes
                }}
                currentUserId={currentUserId}
              />
            ))}
          </View>
        )}

        {/* Comment counts and shares */}
        {(totalComments > 0 || totalShares > 0) && (
          <View style={styles.countsRow}>
            {totalComments > 0 && (
              <Text style={styles.countText}>
                {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
              </Text>
            )}
            {totalShares > 0 && (
              <Text style={styles.countText}>
                {totalShares} {totalShares === 1 ? 'share' : 'shares'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderPostHeader()}
      {renderPostContent()}
      {renderEngagement()}

      {showReactions && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowReactions(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
  },
  edited: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
  separator: {
    fontSize: 12,
    color: '#757575',
    marginHorizontal: 4,
  },
  location: {
    fontSize: 12,
    color: '#757575',
  },
  moreButton: {
    padding: 8,
  },
  moreText: {
    fontSize: 20,
    color: '#757575',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  taggedMembers: {
    marginTop: 8,
  },
  taggedText: {
    fontSize: 14,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  mediaContainer: {
    marginTop: 12,
  },
  mediaItem: {
    width: screenWidth - 32,
  },
  mediaImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  mediaCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  mediaIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: '#2196F3',
  },
  engagement: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  popularReactions: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 2,
  },
  likeCount: {
    fontSize: 14,
    color: '#757575',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  activeAction: {
    color: '#2196F3',
  },
  reactionPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    borderRadius: 25,
    paddingVertical: 8,
    marginTop: 8,
  },
  reactionOption: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionOptionEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  reactionOptionLabel: {
    fontSize: 10,
    color: '#757575',
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  countText: {
    fontSize: 12,
    color: '#757575',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

export default SocialPost;
