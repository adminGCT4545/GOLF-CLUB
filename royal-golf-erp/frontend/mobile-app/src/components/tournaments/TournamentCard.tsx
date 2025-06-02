import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge, Avatar, Button, Icon } from 'react-native-elements';
import { Tournament } from '../../types/tournament';
import { theme } from '../../constants/theme';
import { formatDate, formatCurrency } from '../../utils/dateHelpers';

interface TournamentCardProps {
  tournament: Tournament;
  onPress: () => void;
  onQuickRegister?: () => void;
  showQuickRegister?: boolean;
  isRegistered?: boolean;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onPress,
  onQuickRegister,
  showQuickRegister = false,
  isRegistered = false,
}) => {
  const getStatusColor = () => {
    switch (tournament.status) {
      case 'REGISTRATION_OPEN':
        return theme.colors?.success;
      case 'REGISTRATION_CLOSED':
        return theme.colors?.warning;
      case 'IN_PROGRESS':
        return theme.colors?.primary;
      case 'COMPLETED':
        return theme.colors?.grey3;
      case 'CANCELLED':
        return theme.colors?.error;
      default:
        return theme.colors?.grey3;
    }
  };

  const getStatusText = () => {
    switch (tournament.status) {
      case 'REGISTRATION_OPEN':
        return 'Open';
      case 'REGISTRATION_CLOSED':
        return 'Closed';
      case 'IN_PROGRESS':
        return 'Live';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Upcoming';
    }
  };

  const getCategoryColor = () => {
    switch (tournament.category) {
      case 'CLUB_CHAMPIONSHIP':
        return '#FFD700';
      case 'MEMBERS_ONLY':
        return theme.colors?.primary;
      case 'OPEN':
        return theme.colors?.secondary;
      case 'INVITATIONAL':
        return '#9C27B0';
      default:
        return theme.colors?.grey3;
    }
  };

  const isRegistrationOpen =
    tournament.status === 'REGISTRATION_OPEN' &&
    tournament.currentParticipants < tournament.maxParticipants;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card containerStyle={styles.card}>
        {tournament.imageUrl && (
          <Card.Image
            source={{ uri: tournament.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {tournament.name}
            </Text>
            <View style={styles.badges}>
              <Badge
                value={getStatusText()}
                badgeStyle={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
                textStyle={styles.badgeText}
              />
              <Badge
                value={tournament.category.replace('_', ' ')}
                badgeStyle={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}
                textStyle={styles.badgeText}
              />
            </View>
          </View>

          {tournament.sponsor && (
            <Avatar
              rounded
              source={{ uri: tournament.sponsor }}
              size="small"
              containerStyle={styles.sponsorAvatar}
            />
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.infoRow}>
            <Icon name="event" size={16} color={theme.colors?.grey3} />
            <Text style={styles.infoText}>
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="location-on" size={16} color={theme.colors?.grey3} />
            <Text style={styles.infoText}>
              {tournament.venue} - {tournament.course}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="golf-course" size={16} color={theme.colors?.grey3} />
            <Text style={styles.infoText}>
              {tournament.format.replace('_', ' ')} • {tournament.holes} holes • {tournament.rounds}{' '}
              rounds
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{tournament.currentParticipants}</Text>
              <Text style={styles.statLabel}>/{tournament.maxParticipants} Players</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCurrency(tournament.entryFee)}</Text>
              <Text style={styles.statLabel}>Entry Fee</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCurrency(tournament.prizePool)}</Text>
              <Text style={styles.statLabel}>Prize Pool</Text>
            </View>
          </View>

          {tournament.description && (
            <Text style={styles.description} numberOfLines={2}>
              {tournament.description}
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.deadline}>
              Registration ends: {formatDate(tournament.registrationDeadline)}
            </Text>

            {showQuickRegister && isRegistrationOpen && !isRegistered && (
              <Button
                title="Quick Register"
                buttonStyle={styles.quickRegisterButton}
                titleStyle={styles.quickRegisterText}
                onPress={onQuickRegister}
                icon={
                  <Icon
                    name="add"
                    size={16}
                    color={theme.colors?.primary}
                    style={{ marginRight: 4 }}
                  />
                }
              />
            )}

            {isRegistered && (
              <Badge
                value="Registered"
                badgeStyle={[styles.registeredBadge]}
                textStyle={styles.registeredText}
              />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    height: 150,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 0,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sponsorAvatar: {
    marginTop: 4,
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#43484D',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E1E8EE',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#86939E',
    marginTop: 2,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#5E6977',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadline: {
    fontSize: 12,
    color: '#86939E',
    flex: 1,
  },
  quickRegisterButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  quickRegisterText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  registeredBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  registeredText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TournamentCard;
