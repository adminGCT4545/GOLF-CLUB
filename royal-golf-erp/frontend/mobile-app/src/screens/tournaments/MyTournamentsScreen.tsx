import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import {
  Card,
  Text,
  ListItem,
  Avatar,
  Badge,
  Button,
  Tab,
  TabView,
  ButtonGroup,
  Divider,
} from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  fetchMyTournaments,
  fetchMyTournamentStats,
  cancelRegistration,
} from '../../store/slices/tournamentSlice';
import { RootState, AppDispatch } from '../../store';
import { TournamentRegistration, MyTournamentStats, Achievement } from '../../types/tournament';
import { theme } from '../../constants/theme';
import { formatDate, formatCurrency } from '../../utils/dateHelpers';
import { LoadingOverlay, ErrorMessage } from '../../components/common';

const MyTournamentsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const { myTournaments, myStats, isLoading, error } = useSelector(
    (state: RootState) => state.tournaments
  );

  const [activeTab, setActiveTab] = useState(0);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const statuses = ['All', 'Upcoming', 'Completed', 'Cancelled'];

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = async () => {
    try {
      await Promise.all([dispatch(fetchMyTournaments()), dispatch(fetchMyTournamentStats())]);
    } catch (error) {
      console.error('Error loading tournament data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCancelRegistration = (registration: TournamentRegistration) => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration for this tournament? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            dispatch(
              cancelRegistration({
                tournamentId: registration.tournamentId,
                registrationId: registration.id,
              })
            );
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERED':
      case 'CONFIRMED':
        return theme.colors?.success;
      case 'WAITLISTED':
        return theme.colors?.warning;
      case 'CANCELLED':
        return theme.colors?.error;
      default:
        return theme.colors?.grey3;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return theme.colors?.success;
      case 'PENDING':
        return theme.colors?.warning;
      case 'FAILED':
      case 'REFUNDED':
        return theme.colors?.error;
      default:
        return theme.colors?.grey3;
    }
  };

  const canCancelRegistration = (registration: TournamentRegistration) => {
    const registrationDeadline = new Date(registration.registrationDate);
    const now = new Date();
    const hoursSinceRegistration =
      (now.getTime() - registrationDeadline.getTime()) / (1000 * 60 * 60);

    return (
      registration.status !== 'CANCELLED' &&
      registration.paymentStatus !== 'REFUNDED' &&
      hoursSinceRegistration < 24
    ); // Allow cancellation within 24 hours
  };

  const filterTournaments = (tournaments: TournamentRegistration[]) => {
    if (selectedStatusIndex === 0) {
      return tournaments;
    }

    const statusMap = {
      1: ['REGISTERED', 'CONFIRMED', 'WAITLISTED'], // Upcoming
      2: ['COMPLETED'], // Completed
      3: ['CANCELLED'], // Cancelled
    };

    return tournaments.filter((tournament) =>
      statusMap[selectedStatusIndex as keyof typeof statusMap]?.includes(tournament.status)
    );
  };

  const renderTournamentItem = ({ item }: { item: TournamentRegistration }) => (
    <Card containerStyle={styles.tournamentCard}>
      <ListItem containerStyle={styles.tournamentItem}>
        <Avatar
          title={item.memberName.charAt(0)}
          size="medium"
          rounded
          backgroundColor={theme.colors?.primary}
        />

        <ListItem.Content>
          <ListItem.Title style={styles.tournamentName}>
            Tournament #{item.tournamentId.slice(-6)}
          </ListItem.Title>
          <ListItem.Subtitle style={styles.registrationDate}>
            Registered: {formatDate(item.registrationDate)}
          </ListItem.Subtitle>

          <View style={styles.badgeContainer}>
            <Badge
              value={item.status}
              badgeStyle={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.badgeText}
            />
            <Badge
              value={item.paymentStatus}
              badgeStyle={[
                styles.paymentBadge,
                { backgroundColor: getPaymentStatusColor(item.paymentStatus) },
              ]}
              textStyle={styles.badgeText}
            />
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Entry Fee: {formatCurrency(item.registrationFee)}</Text>
            <Text style={styles.detailText}>Handicap: {item.handicap}</Text>
            {item.tshirtSize && <Text style={styles.detailText}>T-Shirt: {item.tshirtSize}</Text>}
          </View>

          {item.teamMembers && item.teamMembers.length > 0 && (
            <View style={styles.teamContainer}>
              <Text style={styles.teamLabel}>Team Members:</Text>
              {item.teamMembers.map((member, index) => (
                <Text key={index} style={styles.teamMember}>
                  • {member.name} (HCP: {member.handicap})
                </Text>
              ))}
            </View>
          )}
        </ListItem.Content>

        <View style={styles.actionsContainer}>
          <Button
            title="View"
            buttonStyle={styles.viewButton}
            titleStyle={styles.viewButtonText}
            onPress={() =>
              navigation.navigate('TournamentDetails', {
                tournamentId: item.tournamentId,
              })
            }
          />

          {canCancelRegistration(item) && (
            <Button
              title="Cancel"
              buttonStyle={styles.cancelButton}
              titleStyle={styles.cancelButtonText}
              onPress={() => handleCancelRegistration(item)}
            />
          )}
        </View>
      </ListItem>
    </Card>
  );

  const renderStatsOverview = () => {
    if (!myStats) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tournament statistics available</Text>
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        <Card containerStyle={styles.statsCard}>
          <Text style={styles.statsTitle}>Tournament Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myStats.totalTournaments}</Text>
              <Text style={styles.statLabel}>Total Tournaments</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myStats.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myStats.top3Finishes}</Text>
              <Text style={styles.statLabel}>Top 3 Finishes</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myStats.top10Finishes}</Text>
              <Text style={styles.statLabel}>Top 10 Finishes</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myStats.averageScore.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Average Score</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myStats.bestScore}</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </View>

          <Divider style={styles.statsDivider} />

          <View style={styles.monetaryStats}>
            <View style={styles.monetaryStatItem}>
              <Text style={styles.monetaryStatLabel}>Total Prize Money</Text>
              <Text style={styles.monetaryStatValue}>
                {formatCurrency(myStats.totalPrizeMoney)}
              </Text>
            </View>

            <View style={styles.monetaryStatItem}>
              <Text style={styles.monetaryStatLabel}>Handicap Improvement</Text>
              <Text
                style={[
                  styles.monetaryStatValue,
                  {
                    color:
                      myStats.handicapImprovement < 0 ? theme.colors?.success : theme.colors?.error,
                  },
                ]}>
                {myStats.handicapImprovement > 0 ? '+' : ''}
                {myStats.handicapImprovement}
              </Text>
            </View>
          </View>
        </Card>

        {myStats.achievements && myStats.achievements.length > 0 && (
          <Card containerStyle={styles.achievementsCard}>
            <Text style={styles.achievementsTitle}>Recent Achievements</Text>

            {myStats.achievements.slice(0, 5).map((achievement, index) => (
              <ListItem key={achievement.id} containerStyle={styles.achievementItem}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <ListItem.Content>
                  <ListItem.Title style={styles.achievementTitle}>
                    {achievement.title}
                  </ListItem.Title>
                  <ListItem.Subtitle style={styles.achievementDescription}>
                    {achievement.description}
                  </ListItem.Subtitle>
                  <Text style={styles.achievementDate}>{formatDate(achievement.earnedDate)}</Text>
                </ListItem.Content>
                <Badge
                  value={achievement.rarity.toUpperCase()}
                  badgeStyle={[
                    styles.rarityBadge,
                    { backgroundColor: getRarityColor(achievement.rarity) },
                  ]}
                  textStyle={styles.rarityText}
                />
              </ListItem>
            ))}
          </Card>
        )}
      </View>
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9C27B0';
      case 'rare':
        return '#2196F3';
      default:
        return '#4CAF50';
    }
  };

  const renderTournamentsTab = () => {
    const filteredTournaments = filterTournaments(myTournaments);

    return (
      <View style={styles.tournamentsContainer}>
        <View style={styles.filtersContainer}>
          <ButtonGroup
            buttons={statuses}
            selectedIndex={selectedStatusIndex}
            onPress={setSelectedStatusIndex}
            containerStyle={styles.statusFilter}
            selectedButtonStyle={styles.selectedStatusButton}
            textStyle={styles.statusButtonText}
            selectedTextStyle={styles.selectedStatusButtonText}
          />
        </View>

        <FlatList
          data={filteredTournaments}
          renderItem={renderTournamentItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors?.primary || '#2E7D32']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Tournaments Found</Text>
              <Text style={styles.emptyText}>
                {selectedStatusIndex > 0
                  ? 'No tournaments match the selected filter'
                  : "You haven't registered for any tournaments yet"}
              </Text>
              {selectedStatusIndex === 0 && (
                <Button
                  title="Browse Tournaments"
                  buttonStyle={styles.browseButton}
                  onPress={() => navigation.navigate('Tournaments')}
                />
              )}
            </View>
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  if (isLoading && myTournaments.length === 0) {
    return <LoadingOverlay message="Loading your tournaments..." />;
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
      <Tab
        value={activeTab}
        onChange={setActiveTab}
        indicatorStyle={styles.tabIndicator}
        containerStyle={styles.tabContainer}>
        <Tab.Item
          title="My Tournaments"
          titleStyle={[styles.tabTitle, activeTab === 0 && styles.activeTabTitle]}
        />
        <Tab.Item
          title="Statistics"
          titleStyle={[styles.tabTitle, activeTab === 1 && styles.activeTabTitle]}
        />
      </Tab>

      <TabView value={activeTab} onChange={setActiveTab}>
        <TabView.Item style={styles.tabViewItem}>{renderTournamentsTab()}</TabView.Item>
        <TabView.Item style={styles.tabViewItem}>{renderStatsOverview()}</TabView.Item>
      </TabView>
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
    color: '#86939E',
  },
  activeTabTitle: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  tabViewItem: {
    flex: 1,
  },
  tournamentsContainer: {
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
  },
  statusFilter: {
    height: 40,
    borderRadius: 8,
  },
  selectedStatusButton: {
    backgroundColor: '#2E7D32',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#86939E',
  },
  selectedStatusButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  tournamentCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  tournamentItem: {
    paddingVertical: 16,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  registrationDate: {
    fontSize: 12,
    color: '#86939E',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#5E6977',
  },
  teamContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#43484D',
    marginBottom: 4,
  },
  teamMember: {
    fontSize: 11,
    color: '#5E6977',
    marginLeft: 8,
  },
  actionsContainer: {
    gap: 8,
  },
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewButtonText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#43484D',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#86939E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  statsContainer: {
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#86939E',
    textAlign: 'center',
    marginTop: 4,
  },
  statsDivider: {
    backgroundColor: '#E1E8EE',
    marginVertical: 16,
  },
  monetaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monetaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  monetaryStatLabel: {
    fontSize: 12,
    color: '#86939E',
    textAlign: 'center',
    marginBottom: 4,
  },
  monetaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
  },
  achievementsCard: {
    borderRadius: 12,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  achievementItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#43484D',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#86939E',
    marginTop: 2,
  },
  achievementDate: {
    fontSize: 10,
    color: '#BDC6CF',
    marginTop: 4,
  },
  rarityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: '600',
  },
});

export default MyTournamentsScreen;
