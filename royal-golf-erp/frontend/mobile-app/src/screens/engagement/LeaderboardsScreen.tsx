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
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLeaderboards,
  fetchLeaderboardById,
  setSelectedLeaderboard,
} from '../../store/slices/engagementSlice';
import { RootState } from '../../store';
import {
  LeaderboardCategory,
  TimePeriod,
  LeaderboardType,
  Leaderboard,
  LeaderboardEntry,
} from '../../types/engagement';
import LeaderboardItem from '../../components/engagement/LeaderboardItem';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const LeaderboardsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { leaderboards, selectedLeaderboard, userPositions, loading, error } = useSelector(
    (state: RootState) => state.engagement
  );

  const { currentUser } = useSelector((state: RootState) => state.auth);

  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(
    LeaderboardCategory.TOURNAMENT_RANKINGS
  );
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(TimePeriod.MONTHLY);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { value: LeaderboardCategory.TOURNAMENT_RANKINGS, label: 'Tournament Rankings' },
    { value: LeaderboardCategory.SEASON_STANDINGS, label: 'Season Standings' },
    { value: LeaderboardCategory.HANDICAP_IMPROVEMENTS, label: 'Handicap Improvements' },
    { value: LeaderboardCategory.COURSE_RECORDS, label: 'Course Records' },
    { value: LeaderboardCategory.PARTICIPATION, label: 'Participation' },
  ];

  const periods = [
    { value: TimePeriod.WEEKLY, label: 'This Week' },
    { value: TimePeriod.MONTHLY, label: 'This Month' },
    { value: TimePeriod.QUARTERLY, label: 'This Quarter' },
    { value: TimePeriod.ANNUAL, label: 'This Year' },
    { value: TimePeriod.ALL_TIME, label: 'All Time' },
  ];

  useEffect(() => {
    loadLeaderboards();
  }, [selectedCategory, selectedPeriod]);

  const loadLeaderboards = useCallback(() => {
    dispatch(
      fetchLeaderboards({
        category: selectedCategory,
        period: selectedPeriod,
        limit: 100,
      })
    );
  }, [dispatch, selectedCategory, selectedPeriod]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeaderboards();
    setRefreshing(false);
  }, [loadLeaderboards]);

  const handleLeaderboardPress = (leaderboard: Leaderboard) => {
    dispatch(setSelectedLeaderboard(leaderboard));
    dispatch(fetchLeaderboardById(leaderboard.id));
  };

  const handleEntryPress = (entry: LeaderboardEntry) => {
    // Navigate to member profile
    console.log('Navigate to member profile:', entry.member.id);
  };

  const handleShare = async (leaderboard: Leaderboard) => {
    try {
      const userPosition = userPositions[leaderboard.id];
      const shareMessage = userPosition
        ? `I'm ranked #${userPosition} in ${leaderboard.name}! Check out the leaderboard on Royal Golf Club app.`
        : `Check out the ${leaderboard.name} leaderboard on Royal Golf Club app!`;

      await Share.share({
        message: shareMessage,
        url: `https://royalgolfclub.com/leaderboards/${leaderboard.id}`,
      });
    } catch (error) {
      console.error('Error sharing leaderboard:', error);
    }
  };

  const filteredLeaderboards = leaderboards.filter(
    (leaderboard) =>
      leaderboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leaderboard.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentLeaderboard = () => {
    return selectedLeaderboard || filteredLeaderboards[0];
  };

  const getFilteredEntries = () => {
    const currentLeaderboard = getCurrentLeaderboard();
    if (!currentLeaderboard) {
      return [];
    }

    let entries = currentLeaderboard.entries;

    if (searchQuery) {
      entries = entries.filter((entry) =>
        entry.member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return entries;
  };

  const highlightCurrentUser = (entry: LeaderboardEntry) => {
    return entry.member.id === currentUser?.id;
  };

  const renderLeaderboardSelector = () => (
    <View style={styles.selectorContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filteredLeaderboards.map((leaderboard) => (
          <TouchableOpacity
            key={leaderboard.id}
            style={[
              styles.leaderboardTab,
              selectedLeaderboard?.id === leaderboard.id && styles.selectedTab,
            ]}
            onPress={() => handleLeaderboardPress(leaderboard)}>
            <Text
              style={[
                styles.tabText,
                selectedLeaderboard?.id === leaderboard.id && styles.selectedTabText,
              ]}>
              {leaderboard.name}
            </Text>
            <Text style={styles.tabSubtext}>{leaderboard.totalParticipants} players</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Leaderboards</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Category</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.filterOption,
                  selectedCategory === category.value && styles.selectedFilter,
                ]}
                onPress={() => setSelectedCategory(category.value)}>
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
            <Text style={styles.filterTitle}>Time Period</Text>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.filterOption,
                  selectedPeriod === period.value && styles.selectedFilter,
                ]}
                onPress={() => setSelectedPeriod(period.value)}>
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedPeriod === period.value && styles.selectedFilterText,
                  ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => {
    const currentLeaderboard = getCurrentLeaderboard();
    const userPosition = currentLeaderboard ? userPositions[currentLeaderboard.id] : null;

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.screenTitle}>Leaderboards</Text>
            {currentLeaderboard && (
              <Text style={styles.lastUpdated}>
                Updated {new Date(currentLeaderboard.lastUpdated).toLocaleString()}
              </Text>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
              <Text style={styles.filterButtonText}>🔽 Filter</Text>
            </TouchableOpacity>

            {currentLeaderboard && (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare(currentLeaderboard)}>
                <Text style={styles.shareButtonText}>📤</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search players or leaderboards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />

        {userPosition && (
          <View style={styles.userPositionBanner}>
            <Text style={styles.userPositionText}>Your Position: #{userPosition}</Text>
            <Text style={styles.userPositionSubtext}>in {currentLeaderboard?.name}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderLeaderboard = () => {
    const entries = getFilteredEntries();

    if (entries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Results Found</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'Try adjusting your search or filters' : 'No leaderboard data available'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeaderboardItem
            entry={item}
            isCurrentUser={highlightCurrentUser(item)}
            onPress={handleEntryPress}
            showStats={true}
          />
        )}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  if (loading.leaderboards && !refreshing) {
    return <LoadingOverlay message="Loading leaderboards..." />;
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderLeaderboardSelector()}

      <View style={styles.content}>{renderLeaderboard()}</View>

      {renderFilters()}

      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        style={styles.refreshControl}
      />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLeaderboards}>
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
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shareButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userPositionBanner: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  userPositionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  userPositionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectorContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  leaderboardTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    minWidth: 150,
  },
  selectedTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  tabSubtext: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  refreshControl: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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

export default LeaderboardsScreen;
