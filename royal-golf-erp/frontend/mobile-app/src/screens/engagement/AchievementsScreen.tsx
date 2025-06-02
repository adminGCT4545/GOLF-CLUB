import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  FlatList,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAchievements, unlockAchievement } from '../../store/slices/engagementSlice';
import { RootState } from '../../store';
import { Achievement, AchievementCategory, BadgeRarity } from '../../types/engagement';
import AchievementBadge from '../../components/engagement/AchievementBadge';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const { width: screenWidth } = Dimensions.get('window');

const AchievementsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { achievements, unlockedAchievements, loading, error } = useSelector(
    (state: RootState) => state.engagement
  );

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<BadgeRarity | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [celebrationAnim] = useState(new Animated.Value(0));

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: AchievementCategory.GOLF_PERFORMANCE, label: 'Golf Performance' },
    { value: AchievementCategory.SOCIAL_ENGAGEMENT, label: 'Social Engagement' },
    { value: AchievementCategory.TOURNAMENT_PARTICIPATION, label: 'Tournament Participation' },
    { value: AchievementCategory.COURSE_KNOWLEDGE, label: 'Course Knowledge' },
    { value: AchievementCategory.COMMUNITY_SPIRIT, label: 'Community Spirit' },
  ];

  const rarities = [
    { value: 'all', label: 'All Rarities' },
    { value: BadgeRarity.COMMON, label: 'Common' },
    { value: BadgeRarity.UNCOMMON, label: 'Uncommon' },
    { value: BadgeRarity.RARE, label: 'Rare' },
    { value: BadgeRarity.EPIC, label: 'Epic' },
    { value: BadgeRarity.LEGENDARY, label: 'Legendary' },
  ];

  useEffect(() => {
    loadAchievements();
  }, [selectedCategory]);

  const loadAchievements = useCallback(() => {
    const params: any = { limit: 100 };
    if (selectedCategory !== 'all') {
      params.category = selectedCategory;
    }
    if (showUnlockedOnly) {
      params.unlocked = true;
    }
    dispatch(fetchAchievements(params));
  }, [dispatch, selectedCategory, showUnlockedOnly]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  }, [loadAchievements]);

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const handleShareAchievement = async (achievement: Achievement) => {
    if (!achievement.unlockedAt) {
      Alert.alert('Achievement Locked', 'You can only share unlocked achievements.');
      return;
    }

    try {
      const shareMessage = `I just unlocked the "${achievement.name}" achievement in Royal Golf Club! 🏆 ${achievement.description}`;

      await Share.share({
        message: shareMessage,
        url: `https://royalgolfclub.com/achievements/${achievement.id}`,
      });
    } catch (error) {
      console.error('Error sharing achievement:', error);
    }
  };

  const triggerCelebration = () => {
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getFilteredAchievements = () => {
    let filtered = achievements;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((achievement) => achievement.category === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      filtered = filtered.filter((achievement) => achievement.badge.rarity === selectedRarity);
    }

    if (showUnlockedOnly) {
      filtered = filtered.filter((achievement) => achievement.unlockedAt);
    }

    return filtered.sort((a, b) => {
      // Sort by unlock status first (unlocked first), then by rarity, then by name
      if (a.unlockedAt && !b.unlockedAt) {
        return -1;
      }
      if (!a.unlockedAt && b.unlockedAt) {
        return 1;
      }

      const rarityOrder = {
        [BadgeRarity.LEGENDARY]: 5,
        [BadgeRarity.EPIC]: 4,
        [BadgeRarity.RARE]: 3,
        [BadgeRarity.UNCOMMON]: 2,
        [BadgeRarity.COMMON]: 1,
      };

      const aRarity = rarityOrder[a.badge.rarity];
      const bRarity = rarityOrder[b.badge.rarity];

      if (aRarity !== bRarity) {
        return bRarity - aRarity;
      }

      return a.name.localeCompare(b.name);
    });
  };

  const getAchievementStats = () => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.unlockedAt).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    const byRarity = {
      [BadgeRarity.COMMON]: { total: 0, unlocked: 0 },
      [BadgeRarity.UNCOMMON]: { total: 0, unlocked: 0 },
      [BadgeRarity.RARE]: { total: 0, unlocked: 0 },
      [BadgeRarity.EPIC]: { total: 0, unlocked: 0 },
      [BadgeRarity.LEGENDARY]: { total: 0, unlocked: 0 },
    };

    achievements.forEach((achievement) => {
      byRarity[achievement.badge.rarity].total += 1;
      if (achievement.unlockedAt) {
        byRarity[achievement.badge.rarity].unlocked += 1;
      }
    });

    return { total, unlocked, percentage, byRarity };
  };

  const renderStats = () => {
    const stats = getAchievementStats();

    return (
      <View style={styles.statsContainer}>
        <View style={styles.overallStats}>
          <Text style={styles.statsTitle}>Achievement Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.percentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {stats.unlocked} / {stats.total} ({stats.percentage}%)
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(stats.byRarity).map(([rarity, data]) => (
            <View key={rarity} style={styles.rarityStats}>
              <Text style={styles.rarityName}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Text>
              <Text style={styles.rarityCount}>
                {data.unlocked} / {data.total}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Achievements</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Category</Text>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.filterOption,
                    selectedCategory === category.value && styles.selectedFilter,
                  ]}
                  onPress={() => setSelectedCategory(category.value as any)}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedCategory === category.value && styles.selectedFilterText,
                    ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Rarity</Text>
              {rarities.map((rarity) => (
                <TouchableOpacity
                  key={rarity.value}
                  style={[
                    styles.filterOption,
                    selectedRarity === rarity.value && styles.selectedFilter,
                  ]}
                  onPress={() => setSelectedRarity(rarity.value as any)}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedRarity === rarity.value && styles.selectedFilterText,
                    ]}>
                    {rarity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <TouchableOpacity
                style={[styles.toggleFilter, showUnlockedOnly && styles.selectedToggle]}
                onPress={() => setShowUnlockedOnly(!showUnlockedOnly)}>
                <Text style={[styles.toggleText, showUnlockedOnly && styles.selectedToggleText]}>
                  Show Unlocked Only
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              setShowFilters(false);
              loadAchievements();
            }}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderRecentUnlocks = () => {
    if (unlockedAchievements.length === 0) {
      return null;
    }

    return (
      <View style={styles.recentUnlocksContainer}>
        <Text style={styles.sectionTitle}>Recent Unlocks 🎉</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {unlockedAchievements.slice(0, 5).map((achievement) => (
            <View key={achievement.id} style={styles.recentUnlockItem}>
              <AchievementBadge
                achievement={achievement}
                size="medium"
                unlocked={true}
                onPress={handleAchievementPress}
              />
              <Text style={styles.recentUnlockName}>{achievement.name}</Text>
              <Text style={styles.recentUnlockDate}>
                {new Date(achievement.unlockedAt!).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAchievementGrid = () => {
    const filteredAchievements = getFilteredAchievements();

    if (filteredAchievements.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Achievements Found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your filters or start playing to unlock achievements!
          </Text>
        </View>
      );
    }

    const numColumns = 3;
    const itemSize = (screenWidth - 48) / numColumns; // 48 = padding + margins

    return (
      <FlatList
        data={filteredAchievements}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.achievementItem, { width: itemSize }]}>
            <AchievementBadge
              achievement={item}
              size="medium"
              showProgress={!item.unlockedAt}
              unlocked={!!item.unlockedAt}
              onPress={handleAchievementPress}
            />
            <Text style={styles.achievementName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.unlockedAt && (
              <TouchableOpacity
                style={styles.shareAchievementButton}
                onPress={() => handleShareAchievement(item)}>
                <Text style={styles.shareAchievementText}>📤</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.achievementGrid}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.screenTitle}>Achievements</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Text style={styles.filterButtonText}>🔽 Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading.achievements && !refreshing) {
    return <LoadingOverlay message="Loading achievements..." />;
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}>
        {renderStats()}
        {renderRecentUnlocks()}

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>All Achievements</Text>
          {renderAchievementGrid()}
        </View>
      </ScrollView>

      {renderFilters()}

      {/* Celebration Animation */}
      <Animated.View
        style={[
          styles.celebration,
          {
            opacity: celebrationAnim,
            transform: [
              {
                scale: celebrationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none">
        <Text style={styles.celebrationText}>🎉 Achievement Unlocked! 🎉</Text>
      </Animated.View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAchievements}>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overallStats: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  rarityStats: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
  },
  rarityName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  rarityCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  recentUnlocksContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  recentUnlockItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
  },
  recentUnlockName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  recentUnlockDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  achievementsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  achievementGrid: {
    paddingBottom: 20,
  },
  achievementItem: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  shareAchievementButton: {
    position: 'absolute',
    top: -5,
    right: 15,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareAchievementText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#757575',
  },
  filterContent: {
    maxHeight: 400,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilter: {
    backgroundColor: '#2196F3',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFilterText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  toggleFilter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedToggle: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedToggleText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  celebration: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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

export default AchievementsScreen;
