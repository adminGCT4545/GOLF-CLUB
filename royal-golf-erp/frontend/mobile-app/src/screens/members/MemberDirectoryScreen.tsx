import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import {
  fetchMembers,
  searchMembers,
  setSearchFilters,
  clearSearchFilters,
  updateMemberOnlineStatus,
} from '../../store/slices/memberSlice';
import { MemberCard, SearchFilter } from '../../components/members';
import { Member, MemberSearchFilter, ContactAction } from '../../types/member';
import { ErrorMessage } from '../../components/common';

interface MemberDirectoryScreenProps {
  navigation: any;
}

const MemberDirectoryScreen: React.FC<MemberDirectoryScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    directory,
    members,
    searchResults,
    searchFilters,
    isDirectoryLoading,
    isSearching,
    error,
    lastFetchedAt,
    cacheExpiryTime,
  } = useSelector((state: RootState) => state.member);

  const [refreshing, setRefreshing] = useState(false);
  const [currentMembers, setCurrentMembers] = useState<Member[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const shouldRefresh =
        !lastFetchedAt || Date.now() - new Date(lastFetchedAt).getTime() > cacheExpiryTime;

      if (shouldRefresh) {
        loadMembers();
      }
    }, [])
  );

  useEffect(() => {
    // Update current members based on search state
    const membersToShow =
      searchFilters.searchTerm ||
      searchFilters.membershipTypes.length > 0 ||
      searchFilters.membershipTiers.length > 0 ||
      searchFilters.handicapRange.min !== undefined ||
      searchFilters.handicapRange.max !== undefined ||
      searchFilters.isOnlineOnly ||
      searchFilters.hasHandicap
        ? searchResults
        : members;

    setCurrentMembers(membersToShow);
    createSections(membersToShow);
  }, [members, searchResults, searchFilters]);

  const loadMembers = async () => {
    try {
      await dispatch(fetchMembers({ page: 1, limit: 100 }) as any);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMembers();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (searchFilters.searchTerm || hasActiveFilters()) {
      try {
        await dispatch(searchMembers(searchFilters) as any);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      // Clear search if no filters are active
      setCurrentMembers(members);
      createSections(members);
    }
  }, [searchFilters, members]);

  const hasActiveFilters = () => {
    return (
      searchFilters.membershipTypes.length > 0 ||
      searchFilters.membershipTiers.length > 0 ||
      searchFilters.handicapRange.min !== undefined ||
      searchFilters.handicapRange.max !== undefined ||
      searchFilters.isOnlineOnly ||
      searchFilters.hasHandicap
    );
  };

  const handleFiltersChange = (filters: MemberSearchFilter) => {
    dispatch(setSearchFilters(filters) as any);
  };

  const handleClearFilters = () => {
    dispatch(clearSearchFilters() as any);
  };

  const createSections = (memberList: Member[]) => {
    if (!memberList || memberList.length === 0) {
      setSections([]);
      return;
    }

    // Sort members based on current sort settings
    const sortedMembers = [...memberList].sort((a, b) => {
      const { sortBy, sortOrder } = searchFilters;
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'joinDate':
          comparison = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
          break;
        case 'handicap':
          const aHandicap = a.handicapIndex ?? 999;
          const bHandicap = b.handicapIndex ?? 999;
          comparison = aHandicap - bHandicap;
          break;
        case 'lastSeen':
          const aLastSeen = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const bLastSeen = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          comparison = bLastSeen - aLastSeen; // Most recent first
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Group by first letter of last name for alphabetical sorting
    if (searchFilters.sortBy === 'name') {
      const grouped = sortedMembers.reduce((acc, member) => {
        const firstLetter = member.lastName[0].toUpperCase();
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        acc[firstLetter].push(member);
        return acc;
      }, {} as { [key: string]: Member[] });

      const sectionsData = Object.keys(grouped)
        .sort()
        .map((letter) => ({
          title: letter,
          data: grouped[letter],
        }));

      setSections(sectionsData);
    } else {
      // For non-alphabetical sorting, create a single section
      setSections([
        {
          title: 'Members',
          data: sortedMembers,
        },
      ]);
    }
  };

  const handleMemberPress = (member: Member) => {
    navigation.navigate('MemberProfile', { memberId: member.id });
  };

  const handleContactAction = async (action: ContactAction) => {
    switch (action.type) {
      case 'call':
        try {
          await Linking.openURL(`tel:${action.value}`);
        } catch (error) {
          Alert.alert('Error', 'Unable to make phone call');
        }
        break;
      case 'email':
        try {
          await Linking.openURL(`mailto:${action.value}`);
        } catch (error) {
          Alert.alert('Error', 'Unable to open email client');
        }
        break;
      case 'message':
        navigation.navigate('NewMessage', { recipientId: action.value });
        break;
    }
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <MemberCard
      member={item}
      onPress={() => handleMemberPress(item)}
      onContact={handleContactAction}
      showContactActions={true}
    />
  );

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {searchFilters.sortBy === 'name' ? section.title : `${section.data.length} Members`}
      </Text>
    </View>
  );

  const renderEmptyState = () => {
    if (isDirectoryLoading || isSearching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyStateText}>
            {isSearching ? 'Searching members...' : 'Loading members...'}
          </Text>
        </View>
      );
    }

    const hasFilters = searchFilters.searchTerm || hasActiveFilters();

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>
          {hasFilters ? 'No members found' : 'No members available'}
        </Text>
        <Text style={styles.emptyStateText}>
          {hasFilters
            ? 'Try adjusting your search filters'
            : 'Members will appear here once they join the club'}
        </Text>
      </View>
    );
  };

  const renderListFooter = () => {
    if (currentMembers.length === 0) {
      return null;
    }

    return (
      <View style={styles.listFooter}>
        <Text style={styles.memberCount}>
          {currentMembers.length} member{currentMembers.length !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SearchFilter
        filters={searchFilters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        onClear={handleClearFilters}
      />

      {error && <ErrorMessage message={error} onRetry={loadMembers} />}

      <SectionList
        sections={sections}
        renderItem={renderMemberItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderListFooter}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  sectionHeader: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 14,
    color: '#666666',
  },
});

export default MemberDirectoryScreen;
