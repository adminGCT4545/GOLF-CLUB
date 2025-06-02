import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Member, MembershipTier, ContactAction } from '../../types/member';

interface MemberCardProps {
  member: Member;
  onPress: () => void;
  onContact?: (action: ContactAction) => void;
  showContactActions?: boolean;
  compact?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onPress,
  onContact,
  showContactActions = true,
  compact = false,
}) => {
  const getTierColor = (tier: MembershipTier): string => {
    switch (tier) {
      case MembershipTier.PLATINUM:
        return '#E5E4E2';
      case MembershipTier.GOLD:
        return '#FFD700';
      case MembershipTier.SILVER:
        return '#C0C0C0';
      case MembershipTier.BRONZE:
        return '#CD7F32';
      default:
        return '#808080';
    }
  };

  const getOnlineStatusColor = (isOnline: boolean): string => {
    return isOnline ? '#4CAF50' : '#757575';
  };

  const formatLastSeen = (lastSeen?: string): string => {
    if (!lastSeen) {
      return '';
    }

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    }
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleContactAction = (type: 'call' | 'message' | 'email') => {
    if (!onContact) {
      return;
    }

    switch (type) {
      case 'call':
        if (member.phone) {
          Alert.alert('Call Member', `Call ${member.firstName} ${member.lastName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Call',
              onPress: () => Linking.openURL(`tel:${member.phone}`),
            },
          ]);
        }
        break;
      case 'message':
        onContact({
          type: 'message',
          value: member.id,
          label: `Message ${member.firstName}`,
        });
        break;
      case 'email':
        if (member.email) {
          Linking.openURL(`mailto:${member.email}`);
        }
        break;
    }
  };

  const renderContactActions = () => {
    if (!showContactActions || compact) {
      return null;
    }

    return (
      <View style={styles.contactActions}>
        {member.phone && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactAction('call')}>
            <Icon name="phone" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleContactAction('message')}>
          <Icon name="message" size={18} color="#007AFF" />
        </TouchableOpacity>
        {member.email && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactAction('email')}>
            <Icon name="email" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCompactCard = () => (
    <TouchableOpacity style={styles.compactCard} onPress={onPress}>
      <View style={styles.compactContent}>
        <View style={styles.avatarContainer}>
          {member.avatar ? (
            <Image source={{ uri: member.avatar }} style={styles.compactAvatar} />
          ) : (
            <View style={[styles.compactAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {member.firstName[0]}
                {member.lastName[0]}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: getOnlineStatusColor(member.isOnline) },
            ]}
          />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>
            {member.firstName} {member.lastName}
          </Text>
          <Text style={styles.compactDetails} numberOfLines={1}>
            {member.membershipType.toUpperCase()}
            {member.handicapIndex !== undefined && ` • HCP: ${member.handicapIndex}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFullCard = () => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {member.avatar ? (
            <Image source={{ uri: member.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {member.firstName[0]}
                {member.lastName[0]}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: getOnlineStatusColor(member.isOnline) },
            ]}
          />
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {member.firstName} {member.lastName}
            </Text>
            <View
              style={[styles.tierBadge, { backgroundColor: getTierColor(member.membershipTier) }]}>
              <Text style={styles.tierText}>{member.membershipTier.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.membershipType}>
            {member.membershipType.charAt(0).toUpperCase() + member.membershipType.slice(1)} Member
          </Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>
              {member.isOnline ? (
                <Text style={styles.onlineText}>● Online</Text>
              ) : (
                <Text style={styles.offlineText}>
                  ● {formatLastSeen(member.lastSeen) || 'Offline'}
                </Text>
              )}
            </Text>
            {member.handicapIndex !== undefined && (
              <Text style={styles.handicapText}>HCP: {member.handicapIndex}</Text>
            )}
          </View>
        </View>
      </View>

      {renderContactActions()}
    </TouchableOpacity>
  );

  if (compact) {
    return renderCompactCard();
  }

  return renderFullCard();
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  compactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333333',
  },
  membershipType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 12,
  },
  onlineText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  offlineText: {
    color: '#757575',
  },
  handicapText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  compactDetails: {
    fontSize: 12,
    color: '#666666',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  contactButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minWidth: 40,
    alignItems: 'center',
  },
});

export default MemberCard;
