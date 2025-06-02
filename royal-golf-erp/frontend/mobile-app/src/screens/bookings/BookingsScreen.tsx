import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Header, Icon, Button, SearchBar, ButtonGroup } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { theme } from '../../constants/theme';
import BookingCard from '../../components/bookings/BookingCard';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorMessage from '../../components/common/ErrorMessage';
import { fetchBookingHistory, clearError } from '../../store/slices/bookingSlice';
import { TeeTimeBooking, BookingFilter } from '../../types/booking';
import { format, subDays, parseISO, isAfter } from 'date-fns';

const BookingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const { teeTimeBookings, isLoading, error } = useSelector((state: RootState) => state.booking);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(1); // 0: All, 1: Upcoming, 2: Past
  const [refreshing, setRefreshing] = useState(false);

  const filterOptions = ['All', 'Upcoming', 'Past'];

  useEffect(() => {
    loadBookings();
  }, [selectedFilter]);

  const loadBookings = useCallback(() => {
    const filter: BookingFilter = {};

    if (selectedFilter === 1) {
      // Upcoming bookings
      filter.dateFrom = format(new Date(), 'yyyy-MM-dd');
      filter.status = ['CONFIRMED', 'PENDING'];
    } else if (selectedFilter === 2) {
      // Past bookings
      filter.dateTo = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      filter.status = ['COMPLETED', 'CANCELLED'];
    }

    dispatch(fetchBookingHistory(filter));
  }, [dispatch, selectedFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleBookingPress = (booking: TeeTimeBooking) => {
    navigation.navigate('BookingDetails' as never, { bookingId: booking.id } as never);
  };

  const getFilteredBookings = () => {
    let filtered = teeTimeBookings;

    if (searchQuery) {
      filtered = filtered.filter(
        (booking) =>
          booking.confirmationCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.players.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);

      if (selectedFilter === 1) {
        // Upcoming: sort by date ascending (soonest first)
        return dateA.getTime() - dateB.getTime();
      } else {
        // All or Past: sort by date descending (most recent first)
        return dateB.getTime() - dateA.getTime();
      }
    });
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="golf-course" type="material-community" size={64} color={theme.colors?.grey3} />
      <Text style={styles.emptyText}>No bookings found</Text>
      <Text style={styles.emptySubtext}>
        {selectedFilter === 1
          ? "You don't have any upcoming bookings"
          : selectedFilter === 2
          ? "You don't have any past bookings"
          : "You haven't made any bookings yet"}
      </Text>
      <Button
        title="Book Tee Time"
        onPress={() => navigation.navigate('TeeTimeBooking' as never)}
        buttonStyle={styles.bookButton}
        titleStyle={styles.bookButtonText}
      />
    </View>
  );

  return (
    <>
      <Header
        centerComponent={{
          text: 'My Bookings',
          style: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
        }}
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate('TeeTimeBooking' as never)}>
            <Icon name="add" type="material" color="#FFFFFF" size={28} />
          </TouchableOpacity>
        }
        backgroundColor={theme.colors?.primary}
      />

      <View style={styles.container}>
        {error && <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />}

        <SearchBar
          placeholder="Search bookings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchContainer}
          inputContainerStyle={styles.searchInputContainer}
          lightTheme
          round
        />

        <ButtonGroup
          buttons={filterOptions}
          selectedIndex={selectedFilter}
          onPress={setSelectedFilter}
          containerStyle={styles.filterContainer}
          selectedButtonStyle={styles.selectedFilterButton}
          textStyle={styles.filterText}
          selectedTextStyle={styles.selectedFilterText}
        />

        <FlatList
          data={getFilteredBookings()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard booking={item} onPress={() => handleBookingPress(item)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors?.primary || '#2E7D32']}
            />
          }
          contentContainerStyle={
            getFilteredBookings().length === 0 ? styles.emptyListContainer : styles.listContainer
          }
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {isLoading && <LoadingOverlay />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    borderTopWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    backgroundColor: theme.colors?.grey5,
  },
  filterContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderColor: theme.colors?.primary,
  },
  selectedFilterButton: {
    backgroundColor: theme.colors?.primary,
  },
  filterText: {
    color: theme.colors?.grey2,
  },
  selectedFilterText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors?.grey1,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors?.grey3,
    marginTop: 8,
    textAlign: 'center',
  },
  bookButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    backgroundColor: theme.colors?.primary,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingsScreen;
