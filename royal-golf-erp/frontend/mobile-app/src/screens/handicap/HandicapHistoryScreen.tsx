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
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import {
  fetchHandicapData,
  fetchScoreHistory,
  fetchPeerComparisons,
  analyzeScore,
  exportHandicapData,
} from '../../store/slices/handicapSlice';
import { HandicapChart, ScoreCard } from '../../components/handicap';
import { ErrorMessage } from '../../components/common';
import { HandicapExport } from '../../types/handicap';
import { formatDistance } from 'date-fns';

interface HandicapHistoryScreenProps {
  navigation: any;
}

const HandicapHistoryScreen: React.FC<HandicapHistoryScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { handicapHistory, scores, trendData, peerComparisons, scoreAnalysis, isLoading, error } =
    useSelector((state: RootState) => state.handicap);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'handicap' | 'scores' | 'analysis' | 'compare'>(
    'handicap'
  );
  const [selectedScore, setSelectedScore] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    end: new Date().toISOString().split('T')[0],
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchHandicapData() as any),
        dispatch(
          fetchScoreHistory({
            page: 1,
            limit: 50,
            dateRange,
          }) as any
        ),
        dispatch(fetchPeerComparisons() as any),
      ]);
    } catch (error) {
      console.error('Failed to load handicap history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleScoreAnalysis = async (scoreId: string) => {
    setSelectedScore(scoreId);
    try {
      await dispatch(analyzeScore(scoreId) as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze score');
    }
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Choose export format:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'PDF', onPress: () => exportData('pdf') },
      { text: 'Excel', onPress: () => exportData('excel') },
      { text: 'CSV', onPress: () => exportData('csv') },
    ]);
  };

  const exportData = async (format: 'pdf' | 'csv' | 'excel') => {
    const exportOptions: HandicapExport = {
      format,
      dateRange,
      includeScores: true,
      includeStatistics: true,
      includeTrends: true,
      includeComparisons: activeTab === 'compare',
    };

    try {
      const data = await dispatch(exportHandicapData(exportOptions) as any);

      // In a real app, you would handle the blob data to save or share the file
      Alert.alert('Success', `Handicap data exported as ${format.toUpperCase()}`);

      // Share the data (this would be the actual file in production)
      await Share.share({
        message: `Handicap data exported from ${dateRange.start} to ${dateRange.end}`,
        title: 'Handicap Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'handicap' && styles.tabActive]}
        onPress={() => setActiveTab('handicap')}>
        <Text style={[styles.tabText, activeTab === 'handicap' && styles.tabTextActive]}>
          Handicap
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'scores' && styles.tabActive]}
        onPress={() => setActiveTab('scores')}>
        <Text style={[styles.tabText, activeTab === 'scores' && styles.tabTextActive]}>Scores</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'analysis' && styles.tabActive]}
        onPress={() => setActiveTab('analysis')}>
        <Text style={[styles.tabText, activeTab === 'analysis' && styles.tabTextActive]}>
          Analysis
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'compare' && styles.tabActive]}
        onPress={() => setActiveTab('compare')}>
        <Text style={[styles.tabText, activeTab === 'compare' && styles.tabTextActive]}>
          Compare
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHandicapHistory = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Handicap Trend</Text>
          <TouchableOpacity onPress={handleExportData}>
            <Icon name="file-download" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {trendData && trendData.length > 0 ? (
          <HandicapChart type="trend" data={trendData} title="" height={250} showLegend={true} />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>No handicap data available</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Handicap History</Text>
        {handicapHistory && handicapHistory.length > 0 ? (
          handicapHistory.map((record, index) => (
            <View key={record.id} style={styles.handicapRecord}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>{new Date(record.date).toLocaleDateString()}</Text>
                <Text style={styles.recordIndex}>{record.handicapIndex}</Text>
              </View>

              {index > 0 && (
                <View style={styles.recordChange}>
                  <Text
                    style={[
                      styles.recordChangeText,
                      {
                        color:
                          record.handicapIndex < handicapHistory[index - 1].handicapIndex
                            ? '#34C759'
                            : record.handicapIndex > handicapHistory[index - 1].handicapIndex
                            ? '#FF3B30'
                            : '#666666',
                      },
                    ]}>
                    {record.handicapIndex < handicapHistory[index - 1].handicapIndex
                      ? '↓'
                      : record.handicapIndex > handicapHistory[index - 1].handicapIndex
                      ? '↑'
                      : '→'}{' '}
                    {Math.abs(
                      record.handicapIndex - handicapHistory[index - 1].handicapIndex
                    ).toFixed(1)}
                  </Text>
                </View>
              )}

              {record.revisionReason && (
                <Text style={styles.recordReason}>{record.revisionReason}</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No handicap history available</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderScoreHistory = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Score History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ScoreEntry')}>
            <Icon name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {scores && scores.length > 0 ? (
          scores.map((score) => (
            <ScoreCard
              key={score.id}
              score={score}
              onAnalyze={() => handleScoreAnalysis(score.id)}
              showActions={true}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="golf-course" size={48} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>No scores recorded</Text>
            <Text style={styles.emptyStateSubtext}>
              Start tracking your scores to build your handicap history
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAnalysis = () => (
    <View style={styles.content}>
      {scoreAnalysis ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Analysis</Text>

          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Strengths</Text>
            {scoreAnalysis.strengths.map((strength, index) => (
              <View key={index} style={styles.analysisItem}>
                <Icon name="check-circle" size={16} color="#34C759" />
                <Text style={styles.analysisText}>{strength}</Text>
              </View>
            ))}
          </View>

          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Areas for Improvement</Text>
            {scoreAnalysis.weaknesses.map((weakness, index) => (
              <View key={index} style={styles.analysisItem}>
                <Icon name="warning" size={16} color="#FF9500" />
                <Text style={styles.analysisText}>{weakness}</Text>
              </View>
            ))}
          </View>

          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Recommendations</Text>
            {scoreAnalysis.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.analysisItem}>
                <Icon name="lightbulb-outline" size={16} color="#007AFF" />
                <Text style={styles.analysisText}>{recommendation}</Text>
              </View>
            ))}
          </View>

          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Trend Analysis</Text>
            <View style={styles.trendGrid}>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>Overall</Text>
                <View style={styles.trendIndicator}>
                  <Icon
                    name={
                      scoreAnalysis.trendAnalysis.overall === 'improving'
                        ? 'trending-down'
                        : scoreAnalysis.trendAnalysis.overall === 'declining'
                        ? 'trending-up'
                        : 'trending-flat'
                    }
                    size={16}
                    color={
                      scoreAnalysis.trendAnalysis.overall === 'improving'
                        ? '#34C759'
                        : scoreAnalysis.trendAnalysis.overall === 'declining'
                        ? '#FF3B30'
                        : '#FF9500'
                    }
                  />
                  <Text style={styles.trendText}>
                    {scoreAnalysis.trendAnalysis.overall.charAt(0).toUpperCase() +
                      scoreAnalysis.trendAnalysis.overall.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>Short Game</Text>
                <View style={styles.trendIndicator}>
                  <Icon
                    name={
                      scoreAnalysis.trendAnalysis.shortGame === 'improving'
                        ? 'trending-down'
                        : scoreAnalysis.trendAnalysis.shortGame === 'declining'
                        ? 'trending-up'
                        : 'trending-flat'
                    }
                    size={16}
                    color={
                      scoreAnalysis.trendAnalysis.shortGame === 'improving'
                        ? '#34C759'
                        : scoreAnalysis.trendAnalysis.shortGame === 'declining'
                        ? '#FF3B30'
                        : '#FF9500'
                    }
                  />
                  <Text style={styles.trendText}>
                    {scoreAnalysis.trendAnalysis.shortGame.charAt(0).toUpperCase() +
                      scoreAnalysis.trendAnalysis.shortGame.slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.consistencyCard}>
              <Text style={styles.consistencyTitle}>Consistency Score</Text>
              <Text style={styles.consistencyScore}>{scoreAnalysis.consistencyScore}/100</Text>
              <Text style={styles.consistencyRange}>
                Confidence Range: {scoreAnalysis.confidenceRange.min} -{' '}
                {scoreAnalysis.confidenceRange.max}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.emptyState}>
            <Icon name="analytics" size={48} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>No analysis available</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedScore
                ? 'Loading analysis...'
                : 'Select a score from the Scores tab to analyze your performance'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderComparisons = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Peer Comparisons</Text>

        {peerComparisons && peerComparisons.length > 0 ? (
          <>
            <HandicapChart
              type="comparison"
              data={peerComparisons}
              title="Handicap Comparison"
              height={250}
              showLegend={false}
            />

            <View style={styles.comparisonList}>
              {peerComparisons.map((peer) => (
                <View key={peer.memberId} style={styles.comparisonItem}>
                  <View style={styles.comparisonHeader}>
                    <Text style={styles.comparisonName}>{peer.memberName}</Text>
                    <Text style={styles.comparisonHandicap}>HCP: {peer.handicapIndex}</Text>
                  </View>

                  <View style={styles.comparisonStats}>
                    <View style={styles.comparisonStat}>
                      <Text style={styles.comparisonStatLabel}>Handicap Diff:</Text>
                      <Text
                        style={[
                          styles.comparisonStatValue,
                          { color: peer.handicapDifference <= 0 ? '#34C759' : '#FF3B30' },
                        ]}>
                        {peer.handicapDifference > 0 ? '+' : ''}
                        {peer.handicapDifference.toFixed(1)}
                      </Text>
                    </View>

                    <View style={styles.comparisonStat}>
                      <Text style={styles.comparisonStatLabel}>Avg Score:</Text>
                      <Text style={styles.comparisonStatValue}>{peer.averageScore.toFixed(1)}</Text>
                    </View>

                    <View style={styles.comparisonStat}>
                      <Text style={styles.comparisonStatLabel}>Rounds:</Text>
                      <Text style={styles.comparisonStatValue}>{peer.roundsPlayed}</Text>
                    </View>
                  </View>

                  {peer.lastPlayedTogether && (
                    <Text style={styles.lastPlayed}>
                      Last played together:{' '}
                      {formatDistance(new Date(peer.lastPlayedTogether), new Date(), {
                        addSuffix: true,
                      })}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="people" size={48} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>No peer data available</Text>
            <Text style={styles.emptyStateSubtext}>
              Connect with other members to see comparisons
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'handicap':
        return renderHandicapHistory();
      case 'scores':
        return renderScoreHistory();
      case 'analysis':
        return renderAnalysis();
      case 'compare':
        return renderComparisons();
      default:
        return renderHandicapHistory();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading handicap history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={loadData} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabBar()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }>
        {renderActiveTab()}
      </ScrollView>
    </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
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
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#666666',
  },
  handicapRecord: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    color: '#666666',
  },
  recordIndex: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  recordChange: {
    alignSelf: 'flex-end',
  },
  recordChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recordReason: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  analysisCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
    flex: 1,
  },
  trendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  trendItem: {
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  consistencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  consistencyTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  consistencyScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  consistencyRange: {
    fontSize: 12,
    color: '#999999',
  },
  comparisonList: {
    marginTop: 16,
  },
  comparisonItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  comparisonHandicap: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  comparisonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  comparisonStat: {
    alignItems: 'center',
  },
  comparisonStatLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  comparisonStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  lastPlayed: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default HandicapHistoryScreen;
