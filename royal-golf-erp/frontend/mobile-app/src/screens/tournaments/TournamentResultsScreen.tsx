import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Tab, TabView, Button, ButtonGroup } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import {
  fetchLeaderboard,
  fetchTournamentResults,
  fetchTournamentDetails,
} from '../../store/slices/tournamentSlice';
import { RootState, AppDispatch } from '../../store';
import { theme } from '../../constants/theme';
import { LoadingOverlay, ErrorMessage } from '../../components/common';
import { LeaderboardComponent } from '../../components/tournaments';

interface RouteParams {
  tournamentId: string;
  initialTab?: number;
}

const TournamentResultsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute();
  const { tournamentId, initialTab = 0 } = route.params as RouteParams;

  const {
    selectedTournament,
    leaderboard,
    results,
    isLoading,
    isLoadingLeaderboard,
    isLoadingResults,
    error,
  } = useSelector((state: RootState) => state.tournaments);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showNetScores, setShowNetScores] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [dispatch, tournamentId]);

  const loadData = async () => {
    try {
      await dispatch(fetchTournamentDetails(tournamentId)).unwrap();
    } catch (error) {
      console.error('Error loading tournament details:', error);
    }
  };

  useEffect(() => {
    if (selectedTournament) {
      if (
        selectedTournament.status === 'IN_PROGRESS' ||
        selectedTournament.status === 'COMPLETED'
      ) {
        dispatch(fetchLeaderboard(tournamentId));
      }
      if (selectedTournament.status === 'COMPLETED') {
        dispatch(fetchTournamentResults(tournamentId));
      }
    }
  }, [dispatch, selectedTournament, tournamentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (
        activeTab === 0 &&
        (selectedTournament?.status === 'IN_PROGRESS' || selectedTournament?.status === 'COMPLETED')
      ) {
        await dispatch(fetchLeaderboard(tournamentId));
      } else if (activeTab === 1 && selectedTournament?.status === 'COMPLETED') {
        await dispatch(fetchTournamentResults(tournamentId));
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderLeaderboardTab = () => {
    if (!selectedTournament) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingOverlay message="Loading tournament information..." />
        </View>
      );
    }

    if (
      selectedTournament.status === 'UPCOMING' ||
      selectedTournament.status === 'REGISTRATION_OPEN'
    ) {
      return (
        <View style={styles.emptyContainer}>
          <ErrorMessage
            message="Leaderboard will be available once the tournament begins"
            showIcon={false}
          />
        </View>
      );
    }

    if (selectedTournament.status === 'REGISTRATION_CLOSED') {
      return (
        <View style={styles.emptyContainer}>
          <ErrorMessage
            message="Leaderboard will be available when the tournament starts"
            showIcon={false}
          />
        </View>
      );
    }

    if (!leaderboard) {
      return (
        <View style={styles.emptyContainer}>
          {isLoadingLeaderboard ? (
            <LoadingOverlay message="Loading leaderboard..." />
          ) : (
            <ErrorMessage
              message="Leaderboard data not available"
              onRetry={() => dispatch(fetchLeaderboard(tournamentId))}
            />
          )}
        </View>
      );
    }

    return (
      <View style={styles.tabContainer}>
        <View style={styles.controlsContainer}>
          <ButtonGroup
            buttons={['Gross Scores', 'Net Scores']}
            selectedIndex={showNetScores ? 1 : 0}
            onPress={(index) => setShowNetScores(index === 1)}
            containerStyle={styles.scoreToggle}
            selectedButtonStyle={styles.selectedScoreButton}
            textStyle={styles.scoreButtonText}
            selectedTextStyle={styles.selectedScoreButtonText}
          />
        </View>

        <LeaderboardComponent
          leaderboard={leaderboard}
          isLoading={isLoadingLeaderboard}
          onRefresh={handleRefresh}
          showNetScores={showNetScores}
        />
      </View>
    );
  };

  const renderResultsTab = () => {
    if (!selectedTournament) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingOverlay message="Loading tournament information..." />
        </View>
      );
    }

    if (selectedTournament.status !== 'COMPLETED') {
      return (
        <View style={styles.emptyContainer}>
          <ErrorMessage
            message="Final results will be available after the tournament is completed"
            showIcon={false}
          />
        </View>
      );
    }

    if (isLoadingResults) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingOverlay message="Loading final results..." />
        </View>
      );
    }

    if (!results || results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ErrorMessage
            message="Final results not yet available"
            onRetry={() => dispatch(fetchTournamentResults(tournamentId))}
          />
        </View>
      );
    }

    // For final results, we can reuse the LeaderboardComponent with results data
    const resultsAsLeaderboard = {
      tournamentId,
      lastUpdated: new Date().toISOString(),
      isLive: false,
      currentRound: selectedTournament.rounds,
      totalRounds: selectedTournament.rounds,
      leaders: results.map((result) => ({
        position: result.position,
        playerId: result.playerId,
        playerName: result.playerName,
        totalScore: result.totalScore,
        topar: '0', // This would be calculated based on par
        handicap: result.handicap,
        netScore: result.netScore,
        isAmateur: true, // This would come from player data
        profileImage: undefined,
      })),
    };

    return (
      <View style={styles.tabContainer}>
        <View style={styles.controlsContainer}>
          <ButtonGroup
            buttons={['Gross Scores', 'Net Scores']}
            selectedIndex={showNetScores ? 1 : 0}
            onPress={(index) => setShowNetScores(index === 1)}
            containerStyle={styles.scoreToggle}
            selectedButtonStyle={styles.selectedScoreButton}
            textStyle={styles.scoreButtonText}
            selectedTextStyle={styles.selectedScoreButtonText}
          />
        </View>

        <LeaderboardComponent
          leaderboard={resultsAsLeaderboard}
          isLoading={false}
          onRefresh={handleRefresh}
          showNetScores={showNetScores}
        />
      </View>
    );
  };

  if (isLoading && !selectedTournament) {
    return <LoadingOverlay message="Loading tournament..." />;
  }

  if (error && !selectedTournament) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={() => dispatch(fetchTournamentDetails(tournamentId))}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tab
        value={activeTab}
        onChange={setActiveTab}
        indicatorStyle={styles.tabIndicator}
        containerStyle={styles.tabHeaderContainer}>
        <Tab.Item
          title="Live Leaderboard"
          titleStyle={[styles.tabTitle, activeTab === 0 && styles.activeTabTitle]}
        />
        <Tab.Item
          title="Final Results"
          titleStyle={[styles.tabTitle, activeTab === 1 && styles.activeTabTitle]}
        />
      </Tab>

      <TabView value={activeTab} onChange={setActiveTab}>
        <TabView.Item style={styles.tabViewItem}>{renderLeaderboardTab()}</TabView.Item>
        <TabView.Item style={styles.tabViewItem}>{renderResultsTab()}</TabView.Item>
      </TabView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabHeaderContainer: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  tabIndicator: {
    backgroundColor: '#2E7D32',
    height: 3,
  },
  tabTitle: {
    fontSize: 14,
    color: '#86939E',
    fontWeight: '500',
  },
  activeTabTitle: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  tabViewItem: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
  },
  controlsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
  },
  scoreToggle: {
    height: 40,
    borderRadius: 8,
    marginBottom: 0,
  },
  selectedScoreButton: {
    backgroundColor: '#2E7D32',
  },
  scoreButtonText: {
    fontSize: 12,
    color: '#86939E',
  },
  selectedScoreButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});

export default TournamentResultsScreen;
