import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, ListItem, Avatar, Badge, Divider } from 'react-native-elements';
import { Leaderboard, LeaderboardEntry } from '../../types/tournament';
import { theme } from '../../constants/theme';
import { formatDate } from '../../utils/dateHelpers';

interface LeaderboardComponentProps {
  leaderboard: Leaderboard;
  isLoading?: boolean;
  onRefresh?: () => void;
  showNetScores?: boolean;
}

const LeaderboardComponent: React.FC<LeaderboardComponentProps> = ({
  leaderboard,
  isLoading = false,
  onRefresh,
  showNetScores = false,
}) => {
  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return theme.colors?.grey3;
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🏆';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const formatScore = (entry: LeaderboardEntry) => {
    const score = showNetScores && entry.netScore ? entry.netScore : entry.totalScore;
    const par = 72 * leaderboard.currentRound; // Assuming par 72 per round
    const topar = score - par;

    if (topar === 0) {
      return 'E';
    }
    if (topar > 0) {
      return `+${topar}`;
    }
    return `${topar}`;
  };

  const formatCurrentStatus = (entry: LeaderboardEntry) => {
    if (!leaderboard.isLive || !entry.currentRound || !entry.currentHole) {
      return null;
    }

    if (entry.currentHole > 18) {
      return 'Finished';
    }

    return `R${entry.currentRound} • H${entry.currentHole}`;
  };

  const renderLeaderboardEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const positionIcon = getPositionIcon(item.position);
    const currentStatus = formatCurrentStatus(item);

    return (
      <ListItem containerStyle={styles.entryContainer}>
        <View style={styles.positionContainer}>
          {positionIcon ? (
            <Text style={styles.positionIcon}>{positionIcon}</Text>
          ) : (
            <View
              style={[styles.positionCircle, { backgroundColor: getPositionColor(item.position) }]}>
              <Text style={styles.positionText}>{item.position}</Text>
            </View>
          )}
        </View>

        <Avatar
          rounded
          source={item.profileImage ? { uri: item.profileImage } : undefined}
          title={item.playerName.charAt(0)}
          size="medium"
          containerStyle={styles.avatar}
        />

        <ListItem.Content>
          <View style={styles.playerInfo}>
            <View style={styles.nameContainer}>
              <ListItem.Title style={styles.playerName}>{item.playerName}</ListItem.Title>
              {item.isAmateur && (
                <Badge value="AM" badgeStyle={styles.amateurBadge} textStyle={styles.amateurText} />
              )}
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.handicapText}>HCP: {item.handicap}</Text>
              {currentStatus && <Text style={styles.currentStatus}>{currentStatus}</Text>}
            </View>
          </View>
        </ListItem.Content>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {showNetScores && item.netScore ? item.netScore : item.totalScore}
          </Text>
          <Text style={styles.toParText}>{formatScore(item)}</Text>
          {item.today !== undefined && (
            <Text style={styles.todayText}>
              Today: {item.today > 0 ? `+${item.today}` : item.today}
            </Text>
          )}
        </View>
      </ListItem>
    );
  };

  const renderHeader = () => (
    <Card containerStyle={styles.headerCard}>
      <View style={styles.headerContent}>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>
            Round {leaderboard.currentRound} of {leaderboard.totalRounds}
          </Text>
          {leaderboard.isLive && (
            <Badge value="LIVE" badgeStyle={styles.liveBadge} textStyle={styles.liveText} />
          )}
        </View>

        <Text style={styles.lastUpdated}>Last updated: {formatDate(leaderboard.lastUpdated)}</Text>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>
            Showing: {showNetScores ? 'Net Scores' : 'Gross Scores'}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (!leaderboard.leaders.length) {
    return (
      <Card containerStyle={styles.emptyCard}>
        <Text style={styles.emptyText}>No leaderboard data available</Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboard.leaders}
        renderItem={renderLeaderboardEntry}
        keyExtractor={(item) => item.playerId}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              colors={[theme.colors?.primary || '#2E7D32']}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  roundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roundText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginRight: 12,
  },
  liveBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 4,
    paddingHorizontal: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#86939E',
    marginBottom: 12,
  },
  toggleContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E1E8EE',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#43484D',
    fontWeight: '500',
  },
  entryContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  positionContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  positionIcon: {
    fontSize: 24,
  },
  positionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#43484D',
    marginRight: 8,
  },
  amateurBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  amateurText: {
    fontSize: 8,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handicapText: {
    fontSize: 12,
    color: '#86939E',
    marginRight: 12,
  },
  currentStatus: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#43484D',
  },
  toParText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
  },
  todayText: {
    fontSize: 11,
    color: '#86939E',
    marginTop: 2,
  },
  divider: {
    backgroundColor: '#E1E8EE',
    height: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#86939E',
    textAlign: 'center',
  },
});

export default LeaderboardComponent;
