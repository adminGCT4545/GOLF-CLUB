import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Button, Input, ButtonGroup, Header, Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { theme } from '../../constants/theme';
import CalendarPicker from '../../components/bookings/CalendarPicker';
import TimeSlotSelector from '../../components/bookings/TimeSlotSelector';
import PlayerSelector from '../../components/bookings/PlayerSelector';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  fetchCourses,
  fetchAvailableSlots,
  createBooking,
  setSelectedDate,
  setSelectedCourse,
  clearError,
  clearAvailableSlots,
} from '../../store/slices/bookingSlice';
import { TeeTimeSlot, PlayerRequest, BookingRequest } from '../../types/booking';
import { format, addDays } from 'date-fns';

const TeeTimeBookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const {
    courses,
    availableSlots,
    selectedDate,
    selectedCourse,
    isLoading,
    isCreatingBooking,
    error,
  } = useSelector((state: RootState) => state.booking);

  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TeeTimeSlot | null>(null);
  const [selectedHoles, setSelectedHoles] = useState<9 | 18>(18);
  const [cartPreference, setCartPreference] = useState<number>(0); // 0: walking, 1: riding
  const [specialRequests, setSpecialRequests] = useState('');
  const [players, setPlayers] = useState<PlayerRequest[]>([
    {
      name: user?.name || '',
      memberId: user?.id,
      isGuest: false,
      handicap: user?.handicap,
    },
  ]);

  const cartOptions = ['Walking', 'Riding'];
  const holesOptions = ['9 Holes', '18 Holes'];

  useEffect(() => {
    dispatch(fetchCourses());

    return () => {
      dispatch(clearAvailableSlots());
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (selectedDateObj && selectedCourse) {
      const dateStr = format(selectedDateObj, 'yyyy-MM-dd');
      dispatch(setSelectedDate(dateStr));
      dispatch(
        fetchAvailableSlots({
          date: dateStr,
          courseId: selectedCourse,
          holes: selectedHoles,
        })
      );
    }
  }, [selectedDateObj, selectedCourse, selectedHoles, dispatch]);

  const handleDateSelect = (date: Date) => {
    setSelectedDateObj(date);
    setSelectedSlot(null);
  };

  const handleCourseSelect = (courseId: string) => {
    dispatch(setSelectedCourse(courseId));
    setSelectedSlot(null);
  };

  const handleBookingSubmit = async () => {
    if (!selectedDateObj || !selectedSlot || !selectedCourse) {
      Alert.alert('Missing Information', 'Please select a date, time, and course');
      return;
    }

    if (players.length === 0) {
      Alert.alert('Missing Players', 'Please add at least one player');
      return;
    }

    const bookingRequest: BookingRequest = {
      date: format(selectedDateObj, 'yyyy-MM-dd'),
      time: selectedSlot.time,
      courseId: selectedCourse,
      holes: selectedHoles,
      players: players,
      cartRequired: cartPreference === 1,
      cartType: cartPreference === 1 ? 'riding' : 'walking',
      specialRequests: specialRequests.trim() || undefined,
    };

    try {
      const result = await dispatch(createBooking(bookingRequest)).unwrap();
      Alert.alert(
        'Booking Confirmed!',
        `Your tee time has been confirmed for ${format(selectedDateObj, 'MMM dd, yyyy')} at ${
          selectedSlot.time
        }.\n\nConfirmation: #${result.confirmationCode}`,
        [
          {
            text: 'View Details',
            onPress: () => {
              navigation.navigate('BookingDetails' as never, { bookingId: result.id } as never);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Booking Failed', 'Unable to create booking. Please try again.');
    }
  };

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

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
          text: 'Book Tee Time',
          style: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
        }}
        backgroundColor={theme.colors?.primary}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {error && <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />}

          {/* Course Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Course</Text>
            <View style={styles.courseButtons}>
              {courses.map((course) => (
                <Button
                  key={course.id}
                  title={course.name}
                  type={selectedCourse === course.id ? 'solid' : 'outline'}
                  onPress={() => handleCourseSelect(course.id)}
                  buttonStyle={[
                    styles.courseButton,
                    selectedCourse === course.id && styles.selectedCourseButton,
                  ]}
                  titleStyle={[
                    styles.courseButtonText,
                    selectedCourse === course.id && styles.selectedCourseButtonText,
                  ]}
                />
              ))}
            </View>
            {selectedCourseData && (
              <View style={styles.courseInfo}>
                <Text style={styles.courseInfoText}>
                  {selectedCourseData.holes} holes • Par {selectedCourseData.par} •{' '}
                  {selectedCourseData.yardage} yards
                </Text>
              </View>
            )}
          </View>

          {/* Holes Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Holes</Text>
            <ButtonGroup
              buttons={holesOptions}
              selectedIndex={selectedHoles === 9 ? 0 : 1}
              onPress={(index) => setSelectedHoles(index === 0 ? 9 : 18)}
              containerStyle={styles.buttonGroupContainer}
              selectedButtonStyle={styles.selectedButton}
              textStyle={styles.buttonGroupText}
              selectedTextStyle={styles.selectedButtonText}
            />
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <CalendarPicker
              selectedDate={selectedDateObj}
              onDateSelect={handleDateSelect}
              minDate={new Date()}
              maxDate={addDays(new Date(), 30)}
            />
          </View>

          {/* Time Slot Selection */}
          {selectedDateObj && selectedCourse && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Tee Time</Text>
              <TimeSlotSelector
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
                isLoading={isLoading}
              />
            </View>
          )}

          {/* Players Selection */}
          {selectedSlot && (
            <View style={styles.section}>
              <PlayerSelector
                players={players}
                maxPlayers={selectedSlot.maxPlayers}
                onPlayersChange={setPlayers}
                currentMemberId={user?.id || ''}
                currentMemberName={user?.name || ''}
              />
            </View>
          )}

          {/* Cart Preference */}
          {selectedSlot && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cart Preference</Text>
              <ButtonGroup
                buttons={cartOptions}
                selectedIndex={cartPreference}
                onPress={setCartPreference}
                containerStyle={styles.buttonGroupContainer}
                selectedButtonStyle={styles.selectedButton}
                textStyle={styles.buttonGroupText}
                selectedTextStyle={styles.selectedButtonText}
              />
              {cartPreference === 1 && selectedSlot.cartFee && (
                <Text style={styles.cartFeeText}>Cart fee: ${selectedSlot.cartFee} per cart</Text>
              )}
            </View>
          )}

          {/* Special Requests */}
          {selectedSlot && (
            <View style={styles.section}>
              <Input
                label="Special Requests (Optional)"
                placeholder="Any special requirements or preferences..."
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={3}
                inputStyle={styles.textArea}
                containerStyle={styles.inputContainer}
              />
            </View>
          )}

          {/* Booking Summary */}
          {selectedSlot && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDateObj && format(selectedDateObj, 'EEEE, MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{selectedSlot.time}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Course:</Text>
                <Text style={styles.summaryValue}>{selectedCourseData?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Players:</Text>
                <Text style={styles.summaryValue}>{players.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Price:</Text>
                <Text style={styles.summaryPrice}>
                  $
                  {(
                    players.filter((p) => !p.isGuest).length * selectedSlot.memberPrice +
                    players.filter((p) => p.isGuest).length * selectedSlot.guestPrice +
                    (cartPreference === 1
                      ? (selectedSlot.cartFee || 0) * Math.ceil(players.length / 2)
                      : 0)
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          {selectedSlot && (
            <View style={styles.submitSection}>
              <Button
                title="Confirm Booking"
                onPress={handleBookingSubmit}
                loading={isCreatingBooking}
                disabled={isCreatingBooking}
                buttonStyle={styles.submitButton}
                titleStyle={styles.submitButtonText}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {(isLoading || isCreatingBooking) && <LoadingOverlay />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors?.grey0,
    marginBottom: 16,
  },
  courseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  courseButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedCourseButton: {
    backgroundColor: theme.colors?.primary,
  },
  courseButtonText: {
    color: theme.colors?.primary,
  },
  selectedCourseButtonText: {
    color: '#FFFFFF',
  },
  courseInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  courseInfoText: {
    fontSize: 14,
    color: theme.colors?.grey2,
  },
  buttonGroupContainer: {
    borderRadius: 8,
    borderColor: theme.colors?.primary,
  },
  selectedButton: {
    backgroundColor: theme.colors?.primary,
  },
  buttonGroupText: {
    color: theme.colors?.grey2,
  },
  selectedButtonText: {
    color: '#FFFFFF',
  },
  cartFeeText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors?.grey2,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  summarySection: {
    backgroundColor: theme.colors?.grey5,
    marginVertical: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors?.grey0,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors?.grey2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors?.grey0,
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors?.primary,
  },
  submitSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 14,
    backgroundColor: theme.colors?.primary,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TeeTimeBookingScreen;
