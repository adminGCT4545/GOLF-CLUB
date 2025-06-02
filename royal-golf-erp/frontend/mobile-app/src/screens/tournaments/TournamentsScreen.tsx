import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SearchBar, Button, ButtonGroup, Text } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Tournament, TournamentFilter } from '../../types/tournament';
import { TournamentCard } from '../../components/tournaments';
import {
  fetchTournaments,
  setFilters,
  setSearchQuery,
  clearFilters,
  registerForTournament,
} from '../../store/slices/tournamentSlice';
import { RootState, AppDispatch } from '../../store';
import { theme } from '../../constants/theme';
import { LoadingOverlay } from '../../components/common';

const TournamentListScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const { tournaments, myTournaments, isLoading, isRegistering, error, filters, searchQuery } =
    useSelector((state: RootState) => state.tournaments);

  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);

  const categories = ['All', 'Open', 'Members Only', 'Championship', 'Invitational'];
  const statuses = ['All', 'Open', 'Upcoming', 'In Progress', 'Completed'];

  useEffect(() => {
    dispatch(fetchTournaments(filters));
  }, [dispatch, filters]);

  const handleSearch = (text: string) => {
    dispatch(setSearchQuery(text));
    dispatch(setFilters({ ...filters, search: text }));
  };

  const handleCategoryFilter = (index: number) => {
    setSelectedCategoryIndex(index);
    const categoryMap: { [key: number]: string | undefined } = {
      0: undefined,
      1: 'OPEN',
      2: 'MEMBERS_ONLY',
      3: 'CLUB_CHAMPIONSHIP',
      4: 'INVITATIONAL',
    };
    dispatch(setFilters({ ...filters, category: categoryMap[index] }));
  };

  const handleStatusFilter = (index: number) => {
    setSelectedStatusIndex(index);
    const statusMap: { [key: number]: string | undefined } = {
      0: undefined,
      1: 'REGISTRATION_OPEN',
      2: 'UPCOMING',
      3: 'IN_PROGRESS',
      4: 'COMPLETED',
    };
    dispatch(setFilters({ ...filters, status: statusMap[index] }));
  };

  const handleTournamentPress = (tournament: Tournament) => {
    navigation.navigate('TournamentDetails', { tournamentId: tournament.id });
  };

  const handleQuickRegister = (tournament: Tournament) => {
    if (!user) {
      return;
    }

    // Basic registration data for quick register
    const registrationData = {
      tournamentId: tournament.id,
      memberId: user.id,
      memberName: user.name,
      handicap: user.handicap || 0,
      emergencyContact: {
        name: user.emergencyContact?.name || '',
        phone: user.emergencyContact?.phone || '',
        relationship: user.emergencyContact?.relationship || '',
      },
      termsAccepted: true,
      registrationFee: tournament.entryFee,
      paymentStatus: 'PENDING' as const,
      tshirtSize: 'M' as const,
    };

    dispatch(registerForTournament(registrationData));
  };

  const handleRefresh = () => {
    dispatch(fetchTournaments(filters));
  };

  const clearAllFilters = () => {
    setSelectedCategoryIndex(0);
    setSelectedStatusIndex(0);
    dispatch(clearFilters());
    dispatch(setSearchQuery(''));
  };

  const isUserRegistered = (tournamentId: string) => {
    return myTournaments.some(
      (reg) => reg.tournamentId === tournamentId && reg.status !== 'CANCELLED'
    );
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tournament.name.toLowerCase().includes(query) ||
        tournament.description.toLowerCase().includes(query) ||
        tournament.venue.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const renderTournament = ({ item }: { item: Tournament }) => (
    <TournamentCard
      tournament={item}
      onPress={() => handleTournamentPress(item)}
      onQuickRegister={() => handleQuickRegister(item)}
      showQuickRegister={!item.isTeamEvent && !isUserRegistered(item.id)}
      isRegistered={isUserRegistered(item.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        placeholder="Search tournaments..."
        value={searchQuery}
        onChangeText={handleSearch}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        inputStyle={styles.searchInput}
        searchIcon={{ color: theme.colors?.grey3 }}
        clearIcon={{ color: theme.colors?.grey3 }}
      />

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Category:</Text>
        <ButtonGroup
          buttons={categories}
          selectedIndex={selectedCategoryIndex}
          onPress={handleCategoryFilter}
          containerStyle={styles.buttonGroup}
          selectedButtonStyle={styles.selectedButton}
          textStyle={styles.buttonText}
          selectedTextStyle={styles.selectedButtonText}
        />

        <Text style={styles.filterLabel}>Status:</Text>
        <ButtonGroup
          buttons={statuses}
          selectedIndex={selectedStatusIndex}
          onPress={handleStatusFilter}
          containerStyle={styles.buttonGroup}
          selectedButtonStyle={styles.selectedButton}
          textStyle={styles.buttonText}
          selectedTextStyle={styles.selectedButtonText}
        />

        {(selectedCategoryIndex > 0 || selectedStatusIndex > 0 || searchQuery) && (
          <Button
            title="Clear Filters"
            buttonStyle={styles.clearButton}
            titleStyle={styles.clearButtonText}
            onPress={clearAllFilters}
          />
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Tournaments Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedCategoryIndex > 0 || selectedStatusIndex > 0
          ? 'Try adjusting your search criteria or filters'
          : 'Check back later for upcoming tournaments'}
      </Text>
      {(searchQuery || selectedCategoryIndex > 0 || selectedStatusIndex > 0) && (
        <Button title="Clear Filters" buttonStyle={styles.emptyButton} onPress={clearAllFilters} />
      )}
    </View>
  );

  if (isLoading && tournaments.length === 0) {
    return <LoadingOverlay message="Loading tournaments..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTournaments}
        renderItem={renderTournament}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors?.primary || '#2E7D32']}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {isRegistering && <LoadingOverlay message="Registering for tournament..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    marginBottom: 16,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  searchInput: {
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#43484D',
    marginBottom: 8,
    marginTop: 16,
  },
  buttonGroup: {
    height: 40,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#2E7D32',
  },
  buttonText: {
    fontSize: 12,
    color: '#86939E',
  },
  selectedButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#2E7D32',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
  emptyButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 24,
  },
});

export default TournamentListScreen;
