import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  createReservation,
  fetchAvailableTimeSlots,
  fetchReservations,
  cancelReservation,
} from '../../store/slices/fnbSlice';
import { Reservation } from '../../types/commerce';

interface TableReservationScreenProps {
  navigation: any;
}

const TableReservationScreen: React.FC<TableReservationScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { reservations, availableTimeSlots, loading, error } = useSelector(
    (state: RootState) => state.fnb
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');

  useEffect(() => {
    dispatch(fetchReservations() as any);
  }, [dispatch]);

  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      dispatch(fetchAvailableTimeSlots(dateString) as any);
    }
  }, [selectedDate, dispatch]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setSelectedTime(null); // Reset time selection when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handlePartySizeChange = (change: number) => {
    const newSize = partySize + change;
    if (newSize >= 1 && newSize <= 12) {
      setPartySize(newSize);
    }
  };

  const handleCreateReservation = async () => {
    if (!selectedTime) {
      Alert.alert('Time Required', 'Please select a time for your reservation.');
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert('Contact Required', 'Please enter your contact number.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    try {
      const result = await dispatch(
        createReservation({
          date: selectedDate,
          time: selectedTime,
          partySize,
          contactNumber: contactNumber.trim(),
          email: email.trim(),
          specialRequests: specialRequests.trim() || undefined,
        }) as any
      );

      if (result.type.endsWith('/fulfilled')) {
        Alert.alert(
          'Reservation Confirmed!',
          `Your table has been reserved for ${partySize} ${
            partySize === 1 ? 'person' : 'people'
          } on ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
          [
            {
              text: 'View Reservations',
              onPress: () => setActiveTab('existing'),
            },
          ]
        );

        // Reset form
        setSelectedTime(null);
        setPartySize(2);
        setContactNumber('');
        setEmail('');
        setSpecialRequests('');
      }
    } catch (error) {
      Alert.alert('Reservation Failed', 'Please try again or contact the restaurant directly.');
    }
  };

  const handleCancelReservation = (reservation: Reservation) => {
    Alert.alert(
      'Cancel Reservation',
      `Are you sure you want to cancel your reservation for ${reservation.partySize} ${
        reservation.partySize === 1 ? 'person' : 'people'
      } on ${new Date(reservation.date).toLocaleDateString()} at ${reservation.time}?`,
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Cancel Reservation',
          style: 'destructive',
          onPress: () => {
            dispatch(cancelReservation(reservation.id) as any);
          },
        },
      ]
    );
  };

  const getDatesArray = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      // Show next 14 days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderDateItem = ({ item }: { item: Date }) => (
    <TouchableOpacity
      style={[
        styles.dateItem,
        selectedDate.toDateString() === item.toDateString() && styles.selectedDateItem,
      ]}
      onPress={() => setSelectedDate(item)}>
      <Text
        style={[
          styles.dateText,
          selectedDate.toDateString() === item.toDateString() && styles.selectedDateText,
        ]}>
        {formatDate(item)}
      </Text>
      <Text
        style={[
          styles.dayText,
          selectedDate.toDateString() === item.toDateString() && styles.selectedDateText,
        ]}>
        {item.getDate()}
      </Text>
    </TouchableOpacity>
  );

  const renderTimeSlot = (time: string) => (
    <TouchableOpacity
      key={time}
      style={[styles.timeSlot, selectedTime === time && styles.selectedTimeSlot]}
      onPress={() => handleTimeSelect(time)}>
      <Text style={[styles.timeText, selectedTime === time && styles.selectedTimeText]}>
        {time}
      </Text>
    </TouchableOpacity>
  );

  const renderReservation = ({ item }: { item: Reservation }) => (
    <View style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <View style={styles.reservationInfo}>
          <Text style={styles.reservationDate}>
            {new Date(item.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.reservationTime}>{item.time}</Text>
        </View>

        <View style={[styles.statusBadge, styles[`${item.status}Badge`]]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.reservationDetails}>
        <View style={styles.reservationDetail}>
          <Icon name="people" size={16} color="#666" />
          <Text style={styles.reservationDetailText}>
            {item.partySize} {item.partySize === 1 ? 'person' : 'people'}
          </Text>
        </View>

        {item.tableNumber && (
          <View style={styles.reservationDetail}>
            <Icon name="restaurant" size={16} color="#666" />
            <Text style={styles.reservationDetailText}>Table {item.tableNumber}</Text>
          </View>
        )}

        <View style={styles.reservationDetail}>
          <Icon name="phone" size={16} color="#666" />
          <Text style={styles.reservationDetailText}>{item.contactNumber}</Text>
        </View>
      </View>

      {item.specialRequests && (
        <Text style={styles.specialRequests}>Special Requests: {item.specialRequests}</Text>
      )}

      {(item.status === 'pending' || item.status === 'confirmed') && (
        <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelReservation(item)}>
          <Icon name="cancel" size={16} color="#F44336" />
          <Text style={styles.cancelButtonText}>Cancel Reservation</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const upcomingReservations = reservations.filter(
    (r) => new Date(r.date) >= new Date() && r.status !== 'cancelled'
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Table Reservations</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}>
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            New Reservation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'existing' && styles.activeTab]}
          onPress={() => setActiveTab('existing')}>
          <Text style={[styles.tabText, activeTab === 'existing' && styles.activeTabText]}>
            My Reservations ({upcomingReservations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? (
        <ScrollView style={styles.content}>
          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <FlatList
              data={getDatesArray()}
              renderItem={renderDateItem}
              keyExtractor={(item) => item.toISOString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesList}
            />
          </View>

          {/* Party Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Party Size</Text>
            <View style={styles.partySizeContainer}>
              <TouchableOpacity
                style={[styles.partySizeButton, partySize <= 1 && styles.disabledButton]}
                onPress={() => handlePartySizeChange(-1)}
                disabled={partySize <= 1}>
                <Icon name="remove" size={20} color={partySize <= 1 ? '#CCC' : '#333'} />
              </TouchableOpacity>

              <View style={styles.partySizeDisplay}>
                <Text style={styles.partySizeNumber}>{partySize}</Text>
                <Text style={styles.partySizeLabel}>{partySize === 1 ? 'person' : 'people'}</Text>
              </View>

              <TouchableOpacity
                style={[styles.partySizeButton, partySize >= 12 && styles.disabledButton]}
                onPress={() => handlePartySizeChange(1)}
                disabled={partySize >= 12}>
                <Icon name="add" size={20} color={partySize >= 12 ? '#CCC' : '#333'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Times for {formatDate(selectedDate)}</Text>
            {loading.reservation ? (
              <Text style={styles.loadingText}>Loading available times...</Text>
            ) : availableTimeSlots.length > 0 ? (
              <View style={styles.timeSlotsContainer}>
                {availableTimeSlots.map(renderTimeSlot)}
              </View>
            ) : (
              <Text style={styles.noSlotsText}>
                No available times for this date. Please select another date.
              </Text>
            )}
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.textInput}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Special Requests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <TextInput
              style={styles.textArea}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Any special requirements or requests..."
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Reservation Summary */}
          {selectedTime && (
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Reservation Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Icon name="event" size={20} color="#FF6B35" />
                  <Text style={styles.summaryText}>
                    {formatDate(selectedDate)} at {selectedTime}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Icon name="people" size={20} color="#FF6B35" />
                  <Text style={styles.summaryText}>
                    {partySize} {partySize === 1 ? 'person' : 'people'}
                  </Text>
                </View>
                {specialRequests.trim() && (
                  <View style={styles.summaryRow}>
                    <Icon name="note" size={20} color="#FF6B35" />
                    <Text style={styles.summaryText}>Special requests included</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      ) : (
        <View style={styles.content}>
          {upcomingReservations.length > 0 ? (
            <FlatList
              data={upcomingReservations}
              renderItem={renderReservation}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.reservationsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="event-seat" size={80} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No Reservations</Text>
              <Text style={styles.emptySubtitle}>You don't have any upcoming reservations</Text>
              <TouchableOpacity
                style={styles.makeReservationButton}
                onPress={() => setActiveTab('new')}>
                <Text style={styles.makeReservationText}>Make a Reservation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Bottom Action Bar (for new reservation) */}
      {activeTab === 'new' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.reserveButton,
              (!selectedTime || !contactNumber.trim() || !email.trim() || loading.reservation) &&
                styles.disabledButton,
            ]}
            onPress={handleCreateReservation}
            disabled={
              !selectedTime || !contactNumber.trim() || !email.trim() || loading.reservation
            }>
            {loading.reservation ? (
              <Text style={styles.reserveButtonText}>Creating Reservation...</Text>
            ) : (
              <>
                <Icon name="event-seat" size={20} color="#FFFFFF" />
                <Text style={styles.reserveButtonText}>Reserve Table</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error Message */}
      {error.reservation && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.reservation}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerPlaceholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  datesList: {
    paddingRight: 16,
  },
  dateItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
  },
  selectedDateItem: {
    backgroundColor: '#FF6B35',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  partySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partySizeButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  partySizeDisplay: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  partySizeNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF6B35',
  },
  partySizeLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedTimeSlot: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reserveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reservationsList: {
    padding: 16,
  },
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reservationTime: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  confirmedBadge: {
    backgroundColor: '#E8F5E8',
  },
  seatedBadge: {
    backgroundColor: '#E3F2FD',
  },
  completedBadge: {
    backgroundColor: '#F3E5F5',
  },
  cancelledBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  reservationDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  reservationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  reservationDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  specialRequests: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  makeReservationButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  makeReservationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TableReservationScreen;
