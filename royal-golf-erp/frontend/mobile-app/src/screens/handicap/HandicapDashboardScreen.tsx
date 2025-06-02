import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import {
  fetchHandicapDashboard,
  calculateHandicap,
  syncOfflineScores,
  clearError,
} from '../../store/slices/handicapSlice';
import { HandicapChart, ScoreCard } from '../../components/handicap';
import { ErrorMessage } from '../../components/common';
import { formatDistance } from 'date-fns';

interface HandicapDashboardScreenProps {
  navigation: any;
}

const HandicapDashboardScreen: React.FC<HandicapDashboardScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    dashboard,
    currentHandicap,
    statistics,
    trendData,
    recentScores,
    peerComparisons,
    isLoading,
    isCalculating,
    isSyncing,
    offlineMode,
    pendingScores,
    error,
  } = useSelector((state: RootState) => state.handicap);

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    try {
      await dispatch(fetchHandicapDashboard() as any);
    } catch (error) {
      console.error('Failed to load handicap dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
      if (pendingScores.length > 0) {
        await dispatch(syncOfflineScores() as any);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleCalculateHandicap = async () => {
    Alert.alert(
      'Calculate Handicap',
      'This will recalculate your handicap index based on your recent scores. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Calculate',
          onPress: async () => {
            try {
              await dispatch(calculateHandicap() as any);
              Alert.alert('Success', 'Handicap calculated successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to calculate handicap');
            }
          },
        },
      ]
    );
  };

  const handleSyncOfflineScores = async () => {
    if (pendingScores.length === 0) {
      return;
    }

    try {
      await dispatch(syncOfflineScores() as any);
      Alert.alert('Success', 'Offline scores synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync offline scores');
    }
  };

  const renderHeader = () => {
    if (!currentHandicap || !statistics) {
      return null;
    }

    const trend = statistics.improvementTrend;
    const trendIcon =
      trend === 'improving'
        ? 'trending-down'
        : trend === 'declining'
        ? 'trending-up'
        : 'trending-flat';
    const trendColor =
      trend === 'improving' ? '#34C759' : trend === 'declining' ? '#FF3B30' : '#FF9500';

    return (
      <View style={styles.header}>
        <View style={styles.handicapCard}>
          <Text style={styles.handicapIndex}>{currentHandicap.handicapIndex}</Text>
          <Text style={styles.handicapLabel}>Current Index</Text>
          <View style={styles.trendContainer}>
            <Icon name={trendIcon} size={16} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend.charAt(0).toUpperCase() + trend.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.totalRounds}</Text>
            <Text style={styles.statLabel}>Total Rounds</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.averageScore.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.bestScore}</Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.roundsThisYear}</Text>
            <Text style={styles.statLabel}>This Year</Text>
          </View>
        </View>

        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last updated:{' '}
            {formatDistance(new Date(currentHandicap.date), new Date(), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('ScoreEntry')}>
        <Icon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>Add Score</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={handleCalculateHandicap}
        disabled={isCalculating}>
        {isCalculating ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Icon name="calculate" size={24} color="#007AFF" />
        )}
        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Calculate</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={() => navigation.navigate('HandicapHistory')}>
        <Icon name="history" size={24} color="#007AFF" />
        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>History</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOfflineIndicator = () => {
    if (!offlineMode && pendingScores.length === 0) {
      return null;
    }

    return (
      <View style={styles.offlineIndicator}>
        <View style={styles.offlineHeader}>
          <Icon name="cloud-off" size={20} color="#FF9500" />
          <Text style={styles.offlineTitle}>
            {pendingScores.length} score{pendingScores.length !== 1 ? 's' : ''} pending sync
          </Text>
        </View>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSyncOfflineScores}
          disabled={isSyncing}>
          {isSyncing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.syncButtonText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderTrendChart = () => {
    if (!trendData || trendData.length === 0) {
      return null;
    }

    return (
      <View style={styles.chartSection}>
        <HandicapChart
          type="trend"
          data={trendData}
          title="Handicap Trend (Last 6 Months)"
          height={220}
          showLegend={true}
        />
      </View>
    );
  };

  const renderRecentScores = () => {
    if (!recentScores || recentScores.length === 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scores</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ScoreEntry')}>
              <Text style={styles.sectionAction}>Add First Score</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <Icon name="golf-course" size={48} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>No scores yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first round to start tracking your handicap
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scores</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ScoreHistory')}>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentScores.slice(0, 3).map((score) => (
          <ScoreCard key={score.id} score={score} compact={true} showActions={false} />
        ))}
      </View>
    );
  };

  const renderPeerComparisons = () => {
    if (!peerComparisons || peerComparisons.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Compare with Peers</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PeerComparisons')}>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        <HandicapChart
          type="comparison"
          data={peerComparisons.slice(0, 5)}
          title=""
          height={180}
          showLegend={false}
        />
      </View>
    );
  };

  const renderAchievements = () => {
    if (!dashboard?.achievements || dashboard.achievements.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dashboard.achievements.slice(0, 5).map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDate}>
                {new Date(achievement.dateEarned).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading handicap data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={() => {
            dispatch(clearError() as any);
            loadDashboard();
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#007AFF']}
          tintColor="#007AFF"
        />
      }>
      {renderOfflineIndicator()}
      {renderHeader()}
      {renderQuickActions()}
      {renderTrendChart()}
      {renderRecentScores()}
      {renderPeerComparisons()}
      {renderAchievements()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  handicapCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handicapIndex: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  handicapLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  lastUpdated: {
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999999',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  offlineIndicator: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEAA7',
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  offlineTitle: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  syncButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  chartSection: {
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  sectionAction: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  achievementCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 100,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 10,
    color: '#666666',
  },
});

export default HandicapDashboardScreen;
