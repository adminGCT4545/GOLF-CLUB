import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, ListItem, Avatar, Divider, Tab, TabView } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Tournament, PastWinner, PrizeStructure } from '../../types/tournament';
import {
  fetchTournamentDetails,
  clearSelectedTournament,
  fetchLeaderboard,
  fetchTournamentResults,
} from '../../store/slices/tournamentSlice';
import { RootState, AppDispatch } from '../../store';
import { theme } from '../../constants/theme';
import { formatDate, formatCurrency } from '../../utils/dateHelpers';
import { LoadingOverlay, ErrorMessage } from '../../components/common';
import { LeaderboardComponent } from '../../components/tournaments';

interface RouteParams {
  tournamentId: string;
}

const TournamentDetailsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const { tournamentId } = route.params as RouteParams;

  const {
    selectedTournament,
    myTournaments,
    leaderboard,
    results,
    isLoading,
    isLoadingLeaderboard,
    isLoadingResults,
    error,
  } = useSelector((state: RootState) => state.tournaments);

  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    dispatch(fetchTournamentDetails(tournamentId));

    return () => {
      dispatch(clearSelectedTournament());
    };
  }, [dispatch, tournamentId]);

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

  const isUserRegistered = () => {
    return myTournaments.some(
      (reg) => reg.tournamentId === tournamentId && reg.status !== 'CANCELLED'
    );
  };

  const canRegister = () => {
    if (!selectedTournament) {
      return false;
    }
    return (
      selectedTournament.status === 'REGISTRATION_OPEN' &&
      selectedTournament.currentParticipants < selectedTournament.maxParticipants &&
      !isUserRegistered()
    );
  };

  const handleRegister = () => {
    if (!selectedTournament) {
      return;
    }

    navigation.navigate('TournamentRegistration', {
      tournament: selectedTournament,
    });
  };

  const handleViewLeaderboard = () => {
    if (selectedTournament) {
      setActiveTab(1);
    }
  };

  const handleViewResults = () => {
    if (selectedTournament) {
      setActiveTab(2);
    }
  };

  const formatTournamentStatus = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return 'Registration Open';
      case 'REGISTRATION_CLOSED':
        return 'Registration Closed';
      case 'IN_PROGRESS':
        return 'Tournament in Progress';
      case 'COMPLETED':
        return 'Tournament Completed';
      case 'CANCELLED':
        return 'Tournament Cancelled';
      default:
        return 'Upcoming';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return theme.colors?.success;
      case 'IN_PROGRESS':
        return theme.colors?.primary;
      case 'COMPLETED':
        return theme.colors?.grey3;
      case 'CANCELLED':
        return theme.colors?.error;
      default:
        return theme.colors?.warning;
    }
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {selectedTournament?.imageUrl && (
        <Card containerStyle={styles.imageCard}>
          <Card.Image
            source={{ uri: selectedTournament.imageUrl }}
            style={styles.tournamentImage}
            resizeMode="cover"
          />
        </Card>
      )}

      <Card containerStyle={styles.infoCard}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {formatTournamentStatus(selectedTournament?.status || '')}
          </Text>
        </View>

        <Text style={styles.tournamentTitle}>{selectedTournament?.name}</Text>
        <Text style={styles.description}>{selectedTournament?.description}</Text>

        <Divider style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>
            {selectedTournament && formatDate(selectedTournament.startDate)} -{' '}
            {selectedTournament && formatDate(selectedTournament.endDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Venue:</Text>
          <Text style={styles.detailValue}>{selectedTournament?.venue}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Course:</Text>
          <Text style={styles.detailValue}>{selectedTournament?.course}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Format:</Text>
          <Text style={styles.detailValue}>
            {selectedTournament?.format.replace('_', ' ')} • {selectedTournament?.holes} holes •{' '}
            {selectedTournament?.rounds} rounds
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{selectedTournament?.category.replace('_', ' ')}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Entry Fee:</Text>
          <Text style={styles.detailValue}>
            {selectedTournament && formatCurrency(selectedTournament.entryFee)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Prize Pool:</Text>
          <Text style={styles.detailValue}>
            {selectedTournament && formatCurrency(selectedTournament.prizePool)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Participants:</Text>
          <Text style={styles.detailValue}>
            {selectedTournament?.currentParticipants} / {selectedTournament?.maxParticipants}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Registration Deadline:</Text>
          <Text style={styles.detailValue}>
            {selectedTournament && formatDate(selectedTournament.registrationDeadline)}
          </Text>
        </View>

        {selectedTournament?.handicapLimit && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Handicap Limit:</Text>
            <Text style={styles.detailValue}>{selectedTournament.handicapLimit}</Text>
          </View>
        )}
      </Card>

      {selectedTournament?.rules && (
        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Rules & Conditions</Text>
          <Text style={styles.sectionContent}>{selectedTournament.rules}</Text>
        </Card>
      )}

      {selectedTournament?.prizeStructure && selectedTournament.prizeStructure.length > 0 && (
        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Prize Structure</Text>
          {selectedTournament.prizeStructure.map((prize, index) => (
            <ListItem key={index} containerStyle={styles.prizeItem}>
              <ListItem.Content>
                <ListItem.Title style={styles.prizePosition}>{prize.position}</ListItem.Title>
                <ListItem.Subtitle style={styles.prizeDescription}>{prize.prize}</ListItem.Subtitle>
              </ListItem.Content>
              {prize.amount && (
                <Text style={styles.prizeAmount}>{formatCurrency(prize.amount)}</Text>
              )}
            </ListItem>
          ))}
        </Card>
      )}

      {selectedTournament?.pastWinners && selectedTournament.pastWinners.length > 0 && (
        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Past Winners</Text>
          {selectedTournament.pastWinners.slice(0, 5).map((winner, index) => (
            <ListItem key={index} containerStyle={styles.winnerItem}>
              <Avatar
                title={winner.name.charAt(0)}
                size="small"
                rounded
                backgroundColor={theme.colors?.primary}
              />
              <ListItem.Content>
                <ListItem.Title style={styles.winnerName}>{winner.name}</ListItem.Title>
                <ListItem.Subtitle style={styles.winnerDetails}>
                  {winner.year} • {winner.score} {winner.handicap && `• HCP ${winner.handicap}`}
                </ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
          ))}
        </Card>
      )}

      {selectedTournament?.sponsor && (
        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Tournament Sponsor</Text>
          <View style={styles.sponsorContainer}>
            <Avatar source={{ uri: selectedTournament.sponsor }} size="large" rounded />
          </View>
        </Card>
      )}
    </ScrollView>
  );

  const renderLeaderboardTab = () => {
    if (!leaderboard) {
      return (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyText}>
            {selectedTournament?.status === 'IN_PROGRESS'
              ? 'Loading leaderboard...'
              : 'Leaderboard will be available during the tournament'}
          </Text>
        </View>
      );
    }

    return (
      <LeaderboardComponent
        leaderboard={leaderboard}
        isLoading={isLoadingLeaderboard}
        onRefresh={() => dispatch(fetchLeaderboard(tournamentId))}
      />
    );
  };

  const renderResultsTab = () => {
    if (selectedTournament?.status !== 'COMPLETED') {
      return (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyText}>
            Results will be available after the tournament is completed
          </Text>
        </View>
      );
    }

    if (!results.length) {
      return (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyText}>
            {isLoadingResults ? 'Loading results...' : 'No results available'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Final Results</Text>
          {results.map((result, index) => (
            <ListItem key={result.id} containerStyle={styles.resultItem}>
              <View style={styles.positionContainer}>
                <Text style={styles.position}>{result.position}</Text>
              </View>
              <Avatar
                title={result.playerName.charAt(0)}
                size="medium"
                rounded
                backgroundColor={theme.colors?.primary}
              />
              <ListItem.Content>
                <ListItem.Title style={styles.playerName}>{result.playerName}</ListItem.Title>
                <ListItem.Subtitle style={styles.playerDetails}>
                  Score: {result.totalScore} • HCP: {result.handicap}
                  {result.netScore && ` • Net: ${result.netScore}`}
                </ListItem.Subtitle>
                {result.prizeDescription && (
                  <Text style={styles.prizeText}>{result.prizeDescription}</Text>
                )}
              </ListItem.Content>
              {result.prize && (
                <Text style={styles.prizeAmount}>{formatCurrency(result.prize)}</Text>
              )}
            </ListItem>
          ))}
        </Card>
      </ScrollView>
    );
  };

  if (isLoading) {
    return <LoadingOverlay message="Loading tournament details..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={() => dispatch(fetchTournamentDetails(tournamentId))}
        />
      </View>
    );
  }

  if (!selectedTournament) {
    return (
      <View style={styles.container}>
        <ErrorMessage message="Tournament not found" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tab
        value={activeTab}
        onChange={setActiveTab}
        indicatorStyle={styles.tabIndicator}
        containerStyle={styles.tabContainer}>
        <Tab.Item title="Overview" titleStyle={styles.tabTitle} />
        <Tab.Item title="Leaderboard" titleStyle={styles.tabTitle} />
        <Tab.Item title="Results" titleStyle={styles.tabTitle} />
      </Tab>

      <TabView value={activeTab} onChange={setActiveTab}>
        <TabView.Item style={styles.tabViewItem}>{renderOverviewTab()}</TabView.Item>
        <TabView.Item style={styles.tabViewItem}>{renderLeaderboardTab()}</TabView.Item>
        <TabView.Item style={styles.tabViewItem}>{renderResultsTab()}</TabView.Item>
      </TabView>

      {canRegister() && (
        <View style={styles.actionContainer}>
          <Button
            title={`Register for ${formatCurrency(selectedTournament.entryFee)}`}
            buttonStyle={styles.registerButton}
            titleStyle={styles.registerButtonText}
            onPress={handleRegister}
          />
        </View>
      )}

      {isUserRegistered() && (
        <View style={styles.actionContainer}>
          <Text style={styles.registeredText}>✓ You are registered for this tournament</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    backgroundColor: '#fff',
  },
  tabIndicator: {
    backgroundColor: '#2E7D32',
  },
  tabTitle: {
    fontSize: 14,
    color: '#43484D',
  },
  tabViewItem: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  imageCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
  },
  tournamentImage: {
    height: 200,
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  statusContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  tournamentTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#5E6977',
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    backgroundColor: '#E1E8EE',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#86939E',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#43484D',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 14,
    color: '#43484D',
    lineHeight: 22,
  },
  prizeItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
  },
  prizePosition: {
    fontSize: 16,
    fontWeight: '500',
    color: '#43484D',
  },
  prizeDescription: {
    fontSize: 14,
    color: '#86939E',
  },
  prizeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  winnerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#43484D',
  },
  winnerDetails: {
    fontSize: 12,
    color: '#86939E',
  },
  sponsorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  emptyTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#86939E',
    textAlign: 'center',
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
  },
  positionContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  position: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#43484D',
  },
  playerDetails: {
    fontSize: 12,
    color: '#86939E',
  },
  prizeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
    marginTop: 2,
  },
  actionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8EE',
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 16,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  registeredText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default TournamentDetailsScreen;
