import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Header, Icon, SearchBar, ButtonGroup, Overlay, Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { theme } from '../../constants/theme';
import BookingCard from '../../components/bookings/BookingCard';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorMessage from '../../components/common/ErrorMessage';
import { fetchBookingHistory, cancelBooking, clearError } from '../../store/slices/bookingSlice';
import { TeeTimeBooking, BookingFilter } from '../../types/booking';
import { format, subDays, addDays, parseISO, isAfter, isBefore } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

const BookingHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const { teeTimeBookings, isLoading, isCancellingBooking, error } = useSelector(
    (state: RootState) => state.booking
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(0); // 0: All, 1: Upcoming, 2: Past
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TeeTimeBooking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const filterOptions = ['All', 'Upcoming', 'Past'];

  useEffect(() => {
    loadBookings();
  }, [selectedFilter, dateFrom, dateTo]);

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

    if (dateFrom) {
      filter.dateFrom = format(dateFrom, 'yyyy-MM-dd');
    }

    if (dateTo) {
      filter.dateTo = format(dateTo, 'yyyy-MM-dd');
    }

    dispatch(fetchBookingHistory(filter));
  }, [dispatch, selectedFilter, dateFrom, dateTo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleBookingPress = (booking: TeeTimeBooking) => {
    navigation.navigate('BookingDetails' as never, { bookingId: booking.id } as never);
  };

  const handleCancelBooking = (booking: TeeTimeBooking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!selectedBooking) {
      return;
    }

    try {
      await dispatch(
        cancelBooking({
          bookingId: selectedBooking.id,
          reason: 'Cancelled by member',
        })
      ).unwrap();

      Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.', [
        { text: 'OK' },
      ]);

      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (error) {
      Alert.alert('Cancellation Failed', 'Unable to cancel booking. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const handleModifyBooking = (booking: TeeTimeBooking) => {
    navigation.navigate(
      'TeeTimeBooking' as never,
      {
        bookingId: booking.id,
        modifyMode: true,
      } as never
    );
  };

  const handleShareBooking = (booking: TeeTimeBooking) => {
    // Implementation for sharing booking details
    Alert.alert('Share', 'Sharing functionality will be implemented');
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
      return dateB.getTime() - dateA.getTime();
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
        leftComponent={
          <Icon
            name="arrow-back"
            type="material"
            color="#FFFFFF"
            onPress={() => navigation.goBack()}
          />
        }
        centerComponent={{
          text: 'Booking History',
          style: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
        }}
        rightComponent={
          <TouchableOpacity onPress={() => setShowDateFilter(!showDateFilter)}>
            <Icon name="filter-list" type="material" color="#FFFFFF" />
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

        {showDateFilter && (
          <View style={styles.dateFilterContainer}>
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker('from')}>
                <Text style={styles.dateLabel}>From:</Text>
                <Text style={styles.dateValue}>
                  {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'Select date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker('to')}>
                <Text style={styles.dateLabel}>To:</Text>
                <Text style={styles.dateValue}>
                  {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => {
                setDateFrom(null);
                setDateTo(null);
              }}>
              <Text style={styles.clearDateText}>Clear date filter</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={getFilteredBookings()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => handleBookingPress(item)}
              onCancel={
                item.status === 'CONFIRMED' && isAfter(parseISO(item.date), new Date())
                  ? () => handleCancelBooking(item)
                  : undefined
              }
              onModify={
                item.status === 'CONFIRMED' && isAfter(parseISO(item.date), new Date())
                  ? () => handleModifyBooking(item)
                  : undefined
              }
            />
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
        />

        {/* Cancel Booking Modal */}
        <Overlay
          isVisible={showCancelModal}
          onBackdropPress={() => setShowCancelModal(false)}
          overlayStyle={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon
              name="warning"
              type="material"
              size={48}
              color={theme.colors?.warning}
              containerStyle={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Cancel Booking?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel your tee time on{' '}
              {selectedBooking && format(parseISO(selectedBooking.date), 'EEEE, MMM dd')} at{' '}
              {selectedBooking?.time}?
            </Text>
            <Text style={styles.modalWarning}>This action cannot be undone.</Text>

            <View style={styles.modalButtons}>
              <Button
                title="Keep Booking"
                type="outline"
                onPress={() => setShowCancelModal(false)}
                buttonStyle={[styles.modalButton, styles.keepButton]}
                titleStyle={styles.keepButtonText}
              />
              <Button
                title="Cancel Booking"
                onPress={confirmCancelBooking}
                loading={isCancellingBooking}
                disabled={isCancellingBooking}
                buttonStyle={[styles.modalButton, styles.cancelButton]}
              />
            </View>
          </View>
        </Overlay>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={showDatePicker === 'from' ? dateFrom || new Date() : dateTo || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(null);
              if (date) {
                if (showDatePicker === 'from') {
                  setDateFrom(date);
                } else {
                  setDateTo(date);
                }
              }
            }}
          />
        )}
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
  dateFilterContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    backgroundColor: theme.colors?.grey5,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: theme.colors?.grey2,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors?.grey0,
  },
  clearDateButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  clearDateText: {
    fontSize: 14,
    color: theme.colors?.primary,
    textDecorationLine: 'underline',
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
  modalOverlay: {
    borderRadius: 12,
    padding: 24,
    maxWidth: '90%',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors?.grey0,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors?.grey2,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 14,
    color: theme.colors?.warning,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingHorizontal: 24,
    marginHorizontal: 8,
  },
  keepButton: {
    borderColor: theme.colors?.grey3,
  },
  keepButtonText: {
    color: theme.colors?.grey2,
  },
  cancelButton: {
    backgroundColor: theme.colors?.error,
  },
});

export default BookingHistoryScreen;
