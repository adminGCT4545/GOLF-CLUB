import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LeaderboardEntry } from '../../types/engagement';

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  onPress?: (entry: LeaderboardEntry) => void;
  showStats?: boolean;
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  entry,
  isCurrentUser = false,
  onPress,
  showStats = true,
}) => {
  const getPositionStyle = () => {
    if (entry.position === 1) {
      return styles.goldPosition;
    }
    if (entry.position === 2) {
      return styles.silverPosition;
    }
    if (entry.position === 3) {
      return styles.bronzePosition;
    }
    return styles.defaultPosition;
  };

  const getPositionIcon = () => {
    if (entry.position === 1) {
      return '🥇';
    }
    if (entry.position === 2) {
      return '🥈';
    }
    if (entry.position === 3) {
      return '🥉';
    }
    return null;
  };

  const getPositionChangeIcon = () => {
    if (entry.positionChange > 0) {
      return '↗️';
    }
    if (entry.positionChange < 0) {
      return '↘️';
    }
    return '➡️';
  };

  const getPositionChangeColor = () => {
    if (entry.positionChange > 0) {
      return '#4CAF50';
    }
    if (entry.positionChange < 0) {
      return '#F44336';
    }
    return '#757575';
  };

  const formatScore = (score: number) => {
    if (score % 1 === 0) {
      return score.toString();
    }
    return score.toFixed(1);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isCurrentUser && styles.currentUserContainer]}
      onPress={() => onPress?.(entry)}
      activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <View style={[styles.positionContainer, getPositionStyle()]}>
          {getPositionIcon() ? (
            <Text style={styles.positionIcon}>{getPositionIcon()}</Text>
          ) : (
            <Text style={styles.positionText}>{entry.position}</Text>
          )}
        </View>

        <View style={styles.memberInfo}>
          {entry.member.avatar ? (
            <Image source={{ uri: entry.member.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{entry.member.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.memberDetails}>
            <Text style={[styles.memberName, isCurrentUser && styles.currentUserText]}>
              {entry.member.name}
              {isCurrentUser && ' (You)'}
            </Text>
            {entry.member.handicap !== undefined && (
              <Text style={styles.handicap}>HCP: {entry.member.handicap}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, isCurrentUser && styles.currentUserText]}>
            {formatScore(entry.score)}
          </Text>
          {entry.points && <Text style={styles.points}>{entry.points} pts</Text>}
        </View>

        {showStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.gamesPlayed}>{entry.gamesPlayed} games</Text>

            {entry.positionChange !== 0 && (
              <View style={styles.positionChange}>
                <Text style={[styles.positionChangeText, { color: getPositionChangeColor() }]}>
                  {getPositionChangeIcon()} {Math.abs(entry.positionChange)}
                </Text>
              </View>
            )}
          </View>
        )}

        {(entry.bestScore || entry.averageScore) && (
          <View style={styles.additionalStats}>
            {entry.bestScore && (
              <Text style={styles.statText}>Best: {formatScore(entry.bestScore)}</Text>
            )}
            {entry.averageScore && (
              <Text style={styles.statText}>Avg: {formatScore(entry.averageScore)}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentUserContainer: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldPosition: {
    backgroundColor: '#FFD700',
  },
  silverPosition: {
    backgroundColor: '#C0C0C0',
  },
  bronzePosition: {
    backgroundColor: '#CD7F32',
  },
  defaultPosition: {
    backgroundColor: '#F5F5F5',
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  positionIcon: {
    fontSize: 20,
  },
  memberInfo: {
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
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  currentUserText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  handicap: {
    fontSize: 12,
    color: '#757575',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  points: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  statsContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  gamesPlayed: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  positionChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  additionalStats: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  statText: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 1,
  },
});

export default LeaderboardItem;
