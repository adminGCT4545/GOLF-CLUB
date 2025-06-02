import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Leaderboard,
  Achievement,
  SocialPost,
  Comment,
  Like,
  LeaderboardCategory,
  TimePeriod,
  PostType,
  PrivacyLevel,
  CreatePostData,
  LeaderboardsResponse,
  AchievementsResponse,
  SocialFeedResponse,
  ReactionType,
} from '../../types/engagement';
import { apiClient } from '../../services/api';

interface EngagementState {
  // Leaderboards
  leaderboards: Leaderboard[];
  selectedLeaderboard: Leaderboard | null;
  userPositions: { [leaderboardId: string]: number };

  // Achievements
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  achievementProgress: { [achievementId: string]: number };

  // Social Feed
  socialFeed: SocialPost[];
  userPosts: SocialPost[];
  feedCursor: string | null;
  hasMorePosts: boolean;

  // Current post being viewed/edited
  selectedPost: SocialPost | null;
  createPostData: Partial<CreatePostData>;

  // Loading states
  loading: {
    leaderboards: boolean;
    achievements: boolean;
    socialFeed: boolean;
    createPost: boolean;
    likePost: boolean;
    addComment: boolean;
  };

  error: string | null;
  lastRefresh: Date | null;
}

const initialState: EngagementState = {
  leaderboards: [],
  selectedLeaderboard: null,
  userPositions: {},
  achievements: [],
  unlockedAchievements: [],
  achievementProgress: {},
  socialFeed: [],
  userPosts: [],
  feedCursor: null,
  hasMorePosts: true,
  selectedPost: null,
  createPostData: {},
  loading: {
    leaderboards: false,
    achievements: false,
    socialFeed: false,
    createPost: false,
    likePost: false,
    addComment: false,
  },
  error: null,
  lastRefresh: null,
};

// Async Thunks
export const fetchLeaderboards = createAsyncThunk(
  'engagement/fetchLeaderboards',
  async (
    params: {
      category?: LeaderboardCategory;
      period?: TimePeriod;
      limit?: number;
    } = {}
  ) => {
    const response = await apiClient.get<LeaderboardsResponse>('/api/engagement/leaderboards', {
      params,
    });
    return response.data;
  }
);

export const fetchLeaderboardById = createAsyncThunk(
  'engagement/fetchLeaderboardById',
  async (leaderboardId: string) => {
    const response = await apiClient.get<Leaderboard>(
      `/api/engagement/leaderboards/${leaderboardId}`
    );
    return response.data;
  }
);

export const fetchAchievements = createAsyncThunk(
  'engagement/fetchAchievements',
  async (
    params: {
      category?: string;
      unlocked?: boolean;
      limit?: number;
    } = {}
  ) => {
    const response = await apiClient.get<AchievementsResponse>('/api/engagement/achievements', {
      params,
    });
    return response.data;
  }
);

export const fetchSocialFeed = createAsyncThunk(
  'engagement/fetchSocialFeed',
  async (
    params: {
      cursor?: string;
      limit?: number;
      filter?: string;
    } = {}
  ) => {
    const response = await apiClient.get<SocialFeedResponse>('/api/engagement/social-feed', {
      params,
    });
    return response.data;
  }
);

export const fetchUserPosts = createAsyncThunk(
  'engagement/fetchUserPosts',
  async (userId?: string) => {
    const endpoint = userId ? `/api/engagement/posts/user/${userId}` : '/api/engagement/posts/me';
    const response = await apiClient.get<SocialPost[]>(endpoint);
    return response.data;
  }
);

export const createPost = createAsyncThunk(
  'engagement/createPost',
  async (postData: CreatePostData) => {
    const formData = new FormData();

    Object.entries(postData).forEach(([key, value]) => {
      if (key === 'media' && value) {
        (value as File[]).forEach((file, index) => {
          formData.append(`media[${index}]`, file);
        });
      } else if (key === 'taggedMembers' && value) {
        (value as string[]).forEach((memberId, index) => {
          formData.append(`taggedMembers[${index}]`, memberId);
        });
      } else if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });

    const response = await apiClient.post<SocialPost>('/api/engagement/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

export const updatePost = createAsyncThunk(
  'engagement/updatePost',
  async (params: { postId: string; updates: Partial<SocialPost> }) => {
    const { postId, updates } = params;
    const response = await apiClient.put<SocialPost>(`/api/engagement/posts/${postId}`, updates);
    return response.data;
  }
);

export const deletePost = createAsyncThunk('engagement/deletePost', async (postId: string) => {
  await apiClient.delete(`/api/engagement/posts/${postId}`);
  return postId;
});

export const likePost = createAsyncThunk(
  'engagement/likePost',
  async (params: { postId: string; reaction: ReactionType }) => {
    const { postId, reaction } = params;
    const response = await apiClient.post<Like>(`/api/engagement/posts/${postId}/like`, {
      reaction,
    });
    return { postId, like: response.data };
  }
);

export const unlikePost = createAsyncThunk('engagement/unlikePost', async (postId: string) => {
  await apiClient.delete(`/api/engagement/posts/${postId}/like`);
  return postId;
});

export const addComment = createAsyncThunk(
  'engagement/addComment',
  async (params: { postId: string; content: string; parentId?: string }) => {
    const { postId, content, parentId } = params;
    const response = await apiClient.post<Comment>(`/api/engagement/posts/${postId}/comments`, {
      content,
      parentId,
    });
    return { postId, comment: response.data };
  }
);

export const updateComment = createAsyncThunk(
  'engagement/updateComment',
  async (params: { postId: string; commentId: string; content: string }) => {
    const { postId, commentId, content } = params;
    const response = await apiClient.put<Comment>(
      `/api/engagement/posts/${postId}/comments/${commentId}`,
      { content }
    );
    return { postId, comment: response.data };
  }
);

export const deleteComment = createAsyncThunk(
  'engagement/deleteComment',
  async (params: { postId: string; commentId: string }) => {
    const { postId, commentId } = params;
    await apiClient.delete(`/api/engagement/posts/${postId}/comments/${commentId}`);
    return { postId, commentId };
  }
);

export const sharePost = createAsyncThunk(
  'engagement/sharePost',
  async (params: { postId: string; platform?: string }) => {
    const { postId, platform } = params;
    const response = await apiClient.post(`/api/engagement/posts/${postId}/share`, {
      platform,
    });
    return { postId, share: response.data };
  }
);

export const reportContent = createAsyncThunk(
  'engagement/reportContent',
  async (params: {
    contentId: string;
    contentType: 'post' | 'comment';
    reason: string;
    description?: string;
  }) => {
    const response = await apiClient.post('/api/engagement/report', params);
    return response.data;
  }
);

export const unlockAchievement = createAsyncThunk(
  'engagement/unlockAchievement',
  async (achievementId: string) => {
    const response = await apiClient.post<Achievement>(
      `/api/engagement/achievements/${achievementId}/unlock`
    );
    return response.data;
  }
);

const engagementSlice = createSlice({
  name: 'engagement',
  initialState,
  reducers: {
    setSelectedLeaderboard: (state, action: PayloadAction<Leaderboard | null>) => {
      state.selectedLeaderboard = action.payload;
    },
    setSelectedPost: (state, action: PayloadAction<SocialPost | null>) => {
      state.selectedPost = action.payload;
    },
    updateCreatePostData: (state, action: PayloadAction<Partial<CreatePostData>>) => {
      state.createPostData = { ...state.createPostData, ...action.payload };
    },
    clearCreatePostData: (state) => {
      state.createPostData = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    resetFeed: (state) => {
      state.socialFeed = [];
      state.feedCursor = null;
      state.hasMorePosts = true;
    },
    // Real-time updates
    addNewPost: (state, action: PayloadAction<SocialPost>) => {
      state.socialFeed.unshift(action.payload);
    },
    updatePostInFeed: (state, action: PayloadAction<SocialPost>) => {
      const index = state.socialFeed.findIndex((post) => post.id === action.payload.id);
      if (index !== -1) {
        state.socialFeed[index] = action.payload;
      }
    },
    removePostFromFeed: (state, action: PayloadAction<string>) => {
      state.socialFeed = state.socialFeed.filter((post) => post.id !== action.payload);
    },
    updatePostLikes: (state, action: PayloadAction<{ postId: string; likes: Like[] }>) => {
      const { postId, likes } = action.payload;
      const post = state.socialFeed.find((p) => p.id === postId);
      if (post) {
        post.likes = likes;
      }
    },
    updatePostComments: (state, action: PayloadAction<{ postId: string; comments: Comment[] }>) => {
      const { postId, comments } = action.payload;
      const post = state.socialFeed.find((p) => p.id === postId);
      if (post) {
        post.comments = comments;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Leaderboards
    builder
      .addCase(fetchLeaderboards.pending, (state) => {
        state.loading.leaderboards = true;
        state.error = null;
      })
      .addCase(fetchLeaderboards.fulfilled, (state, action) => {
        state.loading.leaderboards = false;
        state.leaderboards = action.payload.leaderboards;
        state.userPositions = action.payload.userPositions;
        state.lastRefresh = new Date();
      })
      .addCase(fetchLeaderboards.rejected, (state, action) => {
        state.loading.leaderboards = false;
        state.error = action.error.message || 'Failed to fetch leaderboards';
      });

    // Fetch Leaderboard by ID
    builder.addCase(fetchLeaderboardById.fulfilled, (state, action) => {
      state.selectedLeaderboard = action.payload;
    });

    // Fetch Achievements
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.loading.achievements = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.loading.achievements = false;
        state.achievements = action.payload.achievements;
        state.unlockedAchievements = action.payload.recentUnlocks;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading.achievements = false;
        state.error = action.error.message || 'Failed to fetch achievements';
      });

    // Fetch Social Feed
    builder
      .addCase(fetchSocialFeed.pending, (state) => {
        state.loading.socialFeed = true;
        state.error = null;
      })
      .addCase(fetchSocialFeed.fulfilled, (state, action) => {
        state.loading.socialFeed = false;
        if (action.meta.arg.cursor) {
          // Append to existing feed (pagination)
          state.socialFeed.push(...action.payload.posts);
        } else {
          // Replace feed (refresh)
          state.socialFeed = action.payload.posts;
        }
        state.feedCursor = action.payload.nextCursor || null;
        state.hasMorePosts = action.payload.hasMore;
        state.lastRefresh = new Date();
      })
      .addCase(fetchSocialFeed.rejected, (state, action) => {
        state.loading.socialFeed = false;
        state.error = action.error.message || 'Failed to fetch social feed';
      });

    // Fetch User Posts
    builder.addCase(fetchUserPosts.fulfilled, (state, action) => {
      state.userPosts = action.payload;
    });

    // Create Post
    builder
      .addCase(createPost.pending, (state) => {
        state.loading.createPost = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading.createPost = false;
        state.socialFeed.unshift(action.payload);
        state.userPosts.unshift(action.payload);
        state.createPostData = {};
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading.createPost = false;
        state.error = action.error.message || 'Failed to create post';
      });

    // Update Post
    builder.addCase(updatePost.fulfilled, (state, action) => {
      const updatedPost = action.payload;

      // Update in social feed
      const feedIndex = state.socialFeed.findIndex((post) => post.id === updatedPost.id);
      if (feedIndex !== -1) {
        state.socialFeed[feedIndex] = updatedPost;
      }

      // Update in user posts
      const userPostIndex = state.userPosts.findIndex((post) => post.id === updatedPost.id);
      if (userPostIndex !== -1) {
        state.userPosts[userPostIndex] = updatedPost;
      }

      // Update selected post if it's the same one
      if (state.selectedPost?.id === updatedPost.id) {
        state.selectedPost = updatedPost;
      }
    });

    // Delete Post
    builder.addCase(deletePost.fulfilled, (state, action) => {
      const postId = action.payload;
      state.socialFeed = state.socialFeed.filter((post) => post.id !== postId);
      state.userPosts = state.userPosts.filter((post) => post.id !== postId);
      if (state.selectedPost?.id === postId) {
        state.selectedPost = null;
      }
    });

    // Like Post
    builder
      .addCase(likePost.pending, (state) => {
        state.loading.likePost = true;
      })
      .addCase(likePost.fulfilled, (state, action) => {
        state.loading.likePost = false;
        const { postId, like } = action.payload;

        const updatePostLikes = (post: SocialPost) => {
          const existingLikeIndex = post.likes.findIndex((l) => l.memberId === like.memberId);
          if (existingLikeIndex !== -1) {
            post.likes[existingLikeIndex] = like;
          } else {
            post.likes.push(like);
          }
        };

        const post = state.socialFeed.find((p) => p.id === postId);
        if (post) {
          updatePostLikes(post);
        }

        const userPost = state.userPosts.find((p) => p.id === postId);
        if (userPost) {
          updatePostLikes(userPost);
        }

        if (state.selectedPost?.id === postId) {
          updatePostLikes(state.selectedPost);
        }
      })
      .addCase(likePost.rejected, (state) => {
        state.loading.likePost = false;
      });

    // Unlike Post
    builder.addCase(unlikePost.fulfilled, (state, action) => {
      const postId = action.payload;
      // Implementation would remove the user's like from the post
    });

    // Add Comment
    builder
      .addCase(addComment.pending, (state) => {
        state.loading.addComment = true;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading.addComment = false;
        const { postId, comment } = action.payload;

        const addCommentToPost = (post: SocialPost) => {
          if (comment.parentId) {
            // Add as reply
            const parentComment = post.comments.find((c) => c.id === comment.parentId);
            if (parentComment) {
              parentComment.replies.push(comment);
            }
          } else {
            // Add as top-level comment
            post.comments.push(comment);
          }
        };

        const post = state.socialFeed.find((p) => p.id === postId);
        if (post) {
          addCommentToPost(post);
        }

        const userPost = state.userPosts.find((p) => p.id === postId);
        if (userPost) {
          addCommentToPost(userPost);
        }

        if (state.selectedPost?.id === postId) {
          addCommentToPost(state.selectedPost);
        }
      })
      .addCase(addComment.rejected, (state) => {
        state.loading.addComment = false;
      });

    // Unlock Achievement
    builder.addCase(unlockAchievement.fulfilled, (state, action) => {
      const achievement = action.payload;
      state.unlockedAchievements.unshift(achievement);

      // Update the achievement in the main list
      const index = state.achievements.findIndex((a) => a.id === achievement.id);
      if (index !== -1) {
        state.achievements[index] = achievement;
      }
    });
  },
});

export const {
  setSelectedLeaderboard,
  setSelectedPost,
  updateCreatePostData,
  clearCreatePostData,
  clearError,
  resetFeed,
  addNewPost,
  updatePostInFeed,
  removePostFromFeed,
  updatePostLikes,
  updatePostComments,
} = engagementSlice.actions;

export default engagementSlice.reducer;
