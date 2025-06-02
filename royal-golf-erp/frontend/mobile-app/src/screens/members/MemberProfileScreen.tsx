import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchMemberProfile,
  sendPlayingPartnerRequest,
  followMember,
  unfollowMember,
  blockMember,
  clearSelectedMember,
} from '../../store/slices/memberSlice';
import { HandicapChart } from '../../components/handicap';
import { MembershipTier, Achievement, TournamentResult } from '../../types/member';
import { ErrorMessage } from '../../components/common';
import { formatDistance } from 'date-fns';

interface MemberProfileScreenProps {
  route: {
    params: {
      memberId: string;
    };
  };
  navigation: any;
}

const MemberProfileScreen: React.FC<MemberProfileScreenProps> = ({ route, navigation }) => {
  const { memberId } = route.params;
  const dispatch = useDispatch();
  const { selectedMember, isProfileLoading, error } = useSelector(
    (state: RootState) => state.member
  );
  const { profile: currentUserProfile } = useSelector((state: RootState) => state.member);

  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);

  useEffect(() => {
    loadMemberProfile();
    return () => {
      dispatch(clearSelectedMember() as any);
    };
  }, [memberId]);

  const loadMemberProfile = async () => {
    try {
      await dispatch(fetchMemberProfile(memberId) as any);
    } catch (error) {
      console.error('Failed to load member profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMemberProfile();
    } finally {
      setRefreshing(false);
    }
  };

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

  const handleSendMessage = () => {
    navigation.navigate('NewMessage', { recipientId: memberId });
  };

  const handlePhoneCall = () => {
    if (!selectedMember?.phone) {
      return;
    }

    Alert.alert('Call Member', `Call ${selectedMember.firstName} ${selectedMember.lastName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',
        onPress: () => Linking.openURL(`tel:${selectedMember.phone}`),
      },
    ]);
  };

  const handleEmail = () => {
    if (!selectedMember?.email) {
      return;
    }

    Linking.openURL(`mailto:${selectedMember.email}`);
  };

  const handleSendPlayingPartnerRequest = () => {
    Alert.prompt(
      'Playing Partner Request',
      'Add a message (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message) => {
            try {
              await dispatch(
                sendPlayingPartnerRequest({
                  memberId,
                  message: message || undefined,
                }) as any
              );
              Alert.alert('Success', 'Playing partner request sent!');
            } catch (error) {
              Alert.alert('Error', 'Failed to send request');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await dispatch(unfollowMember(memberId) as any);
        setIsFollowing(false);
      } else {
        await dispatch(followMember(memberId) as any);
        setIsFollowing(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleBlockMember = () => {
    Alert.alert(
      'Block Member',
      `Are you sure you want to block ${selectedMember?.firstName} ${selectedMember?.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(blockMember(memberId) as any);
              Alert.alert('Success', 'Member has been blocked');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to block member');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => {
    if (!selectedMember) {
      return null;
    }

    return (
      <View style={styles.header}>
        <View style={styles.avatarSection}>
          {selectedMember.avatar ? (
            <Image source={{ uri: selectedMember.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {selectedMember.firstName[0]}
                {selectedMember.lastName[0]}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: selectedMember.isOnline ? '#4CAF50' : '#757575' },
            ]}
          />
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {selectedMember.firstName} {selectedMember.lastName}
            </Text>
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: getTierColor(selectedMember.membershipTier) },
              ]}>
              <Text style={styles.tierText}>{selectedMember.membershipTier.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.membershipType}>
            {selectedMember.membershipType.charAt(0).toUpperCase() +
              selectedMember.membershipType.slice(1)}{' '}
            Member
          </Text>

          <Text style={styles.joinDate}>
            Member since {new Date(selectedMember.joinDate).getFullYear()}
          </Text>

          <Text style={styles.status}>
            {selectedMember.isOnline ? (
              <Text style={styles.onlineText}>● Online</Text>
            ) : (
              <Text style={styles.offlineText}>
                ●{' '}
                {selectedMember.lastSeen
                  ? formatDistance(new Date(selectedMember.lastSeen), new Date(), {
                      addSuffix: true,
                    })
                  : 'Offline'}
              </Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (!selectedMember || selectedMember.id === currentUserProfile?.id) {
      return null;
    }

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSendMessage}>
          <Icon name="message" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSendPlayingPartnerRequest}>
          <Icon name="person-add" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Playing Partner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowContactOptions(!showContactOptions)}>
          <Icon name="more-vert" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderContactOptions = () => {
    if (!showContactOptions || !selectedMember) {
      return null;
    }

    return (
      <View style={styles.contactOptions}>
        {selectedMember.phone && (
          <TouchableOpacity style={styles.contactOption} onPress={handlePhoneCall}>
            <Icon name="phone" size={20} color="#007AFF" />
            <Text style={styles.contactOptionText}>Call</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.contactOption} onPress={handleEmail}>
          <Icon name="email" size={20} color="#007AFF" />
          <Text style={styles.contactOptionText}>Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactOption} onPress={handleFollowToggle}>
          <Icon name={isFollowing ? 'person-remove' : 'person-add'} size={20} color="#007AFF" />
          <Text style={styles.contactOptionText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactOption, styles.blockOption]}
          onPress={handleBlockMember}>
          <Icon name="block" size={20} color="#FF3B30" />
          <Text style={[styles.contactOptionText, styles.blockText]}>Block</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHandicapSection = () => {
    if (!selectedMember?.handicapIndex) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Handicap Information</Text>
        <View style={styles.handicapInfo}>
          <View style={styles.handicapCard}>
            <Text style={styles.handicapIndex}>{selectedMember.handicapIndex}</Text>
            <Text style={styles.handicapLabel}>Current Index</Text>
          </View>

          {selectedMember.handicapHistory && selectedMember.handicapHistory.length > 0 && (
            <HandicapChart
              type="trend"
              data={selectedMember.handicapHistory.map((h) => ({
                date: h.date,
                handicapIndex: h.handicapIndex,
                trend: 'stable' as const,
              }))}
              title="Handicap Trend"
              height={180}
              showLegend={false}
            />
          )}
        </View>
      </View>
    );
  };

  const renderTournamentResults = () => {
    if (!selectedMember?.recentTournaments || selectedMember.recentTournaments.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tournament Results</Text>
        {selectedMember.recentTournaments.slice(0, 3).map((tournament) => (
          <View key={tournament.tournamentId} style={styles.tournamentCard}>
            <View style={styles.tournamentHeader}>
              <Text style={styles.tournamentName}>{tournament.tournamentName}</Text>
              <Text style={styles.tournamentDate}>
                {new Date(tournament.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.tournamentResults}>
              <Text style={styles.tournamentPosition}>
                {tournament.position}
                {getOrdinalSuffix(tournament.position)} of {tournament.totalParticipants}
              </Text>
              <Text style={styles.tournamentScore}>Score: {tournament.score}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAchievements = () => {
    if (!selectedMember?.achievements || selectedMember.achievements.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedMember.achievements.slice(0, 5).map((achievement) => (
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

  const renderBio = () => {
    if (!selectedMember?.bio) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{selectedMember.bio}</Text>
      </View>
    );
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  };

  if (isProfileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={loadMemberProfile} />
      </View>
    );
  }

  if (!selectedMember) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Member profile not found</Text>
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
      {renderHeader()}
      {renderActionButtons()}
      {renderContactOptions()}
      {renderBio()}
      {renderHandicapSection()}
      {renderTournamentResults()}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#757575',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 12,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  membershipType: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
  },
  onlineText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  offlineText: {
    color: '#757575',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  contactOptions: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactOptionText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  blockOption: {
    borderBottomWidth: 0,
  },
  blockText: {
    color: '#FF3B30',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  handicapInfo: {
    alignItems: 'center',
  },
  handicapCard: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 120,
  },
  handicapIndex: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  handicapLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  tournamentCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  tournamentDate: {
    fontSize: 14,
    color: '#666666',
  },
  tournamentResults: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tournamentPosition: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  tournamentScore: {
    fontSize: 14,
    color: '#666666',
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
  bioText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});

export default MemberProfileScreen;
