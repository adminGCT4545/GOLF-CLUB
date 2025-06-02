import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, Header, Icon, Button, Card, ListItem, Divider } from 'react-native-elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { theme } from '../../constants/theme';
import QRCode from 'react-native-qrcode-svg';
import * as Calendar from 'expo-calendar';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorMessage from '../../components/common/ErrorMessage';
import { fetchBookingDetails, clearError } from '../../store/slices/bookingSlice';
import { format, parseISO, isAfter } from 'date-fns';

const BookingDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();

  const { bookingId } = route.params as { bookingId: string };

  const {
    currentBookingDetails: booking,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.booking);

  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    dispatch(fetchBookingDetails(bookingId));

    return () => {
      dispatch(clearError());
    };
  }, [dispatch, bookingId]);

  const handleAddToCalendar = async () => {
    if (!booking) {
      return;
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Calendar permission is required to add events');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find((cal) => cal.isPrimary) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('No Calendar', 'No calendar found on device');
        return;
      }

      const bookingDate = parseISO(booking.date);
      const [hours, minutes] = booking.time.split(':').map(Number);
      const startDate = new Date(bookingDate);
      startDate.setHours(hours, minutes);

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + (booking.holes === 9 ? 2 : 4)); // Estimate duration

      const eventDetails = {
        title: `Golf - ${booking.course.name}`,
        startDate,
        endDate,
        location: booking.course.name,
        notes: `Confirmation: ${booking.confirmationCode}\nPlayers: ${booking.players
          .map((p) => p.name)
          .join(', ')}`,
        alarms: [{ relativeOffset: -60 }], // 1 hour before
      };

      await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
      Alert.alert('Success', 'Event added to calendar');
    } catch (error) {
      Alert.alert('Error', 'Failed to add event to calendar');
    }
  };

  const handleShare = async () => {
    if (!booking) {
      return;
    }

    try {
      const message =
        'Golf Booking at Royal Golf Club\n\n' +
        `Date: ${format(parseISO(booking.date), 'EEEE, MMM dd, yyyy')}\n` +
        `Time: ${booking.time}\n` +
        `Course: ${booking.course.name}\n` +
        `Players: ${booking.players.map((p) => p.name).join(', ')}\n` +
        `Confirmation: #${booking.confirmationCode}`;

      await Share.share({
        message,
        title: 'Golf Booking Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share booking details');
    }
  };

  const handleContactProShop = () => {
    if (!booking?.course.contactPhone) {
      return;
    }

    const phoneNumber =
      Platform.OS === 'ios'
        ? `tel://${booking.course.contactPhone}`
        : `tel:${booking.course.contactPhone}`;

    Linking.openURL(phoneNumber).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleGetDirections = () => {
    if (!booking?.course.mapUrl) {
      return;
    }

    Linking.openURL(booking.course.mapUrl).catch(() => {
      Alert.alert('Error', 'Unable to open maps');
    });
  };

  const getStatusColor = () => {
    switch (booking?.status) {
      case 'CONFIRMED':
        return theme.colors?.success;
      case 'PENDING':
        return theme.colors?.warning;
      case 'CANCELLED':
        return theme.colors?.error;
      case 'COMPLETED':
        return theme.colors?.grey2;
      default:
        return theme.colors?.grey3;
    }
  };

  if (!booking && !isLoading) {
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
            text: 'Booking Details',
            style: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
          }}
          backgroundColor={theme.colors?.primary}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </>
    );
  }

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
          text: 'Booking Details',
          style: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
        }}
        rightComponent={<Icon name="share" type="material" color="#FFFFFF" onPress={handleShare} />}
        backgroundColor={theme.colors?.primary}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {error && <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />}

        {booking && (
          <>
            {/* Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: getStatusColor() }]}>
              <Icon
                name={booking.status === 'CONFIRMED' ? 'check-circle' : 'info'}
                type="material"
                color="#FFFFFF"
                size={20}
              />
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>

            {/* Main Details Card */}
            <Card containerStyle={styles.mainCard}>
              <View style={styles.dateTimeContainer}>
                <View style={styles.dateBox}>
                  <Text style={styles.dayText}>{format(parseISO(booking.date), 'dd')}</Text>
                  <Text style={styles.monthText}>{format(parseISO(booking.date), 'MMM')}</Text>
                </View>
                <View style={styles.bookingMainInfo}>
                  <Text style={styles.courseTitle}>{booking.course.name}</Text>
                  <View style={styles.timeRow}>
                    <Icon
                      name="access-time"
                      type="material"
                      size={16}
                      color={theme.colors?.grey2}
                    />
                    <Text style={styles.timeText}>{booking.time}</Text>
                  </View>
                  <Text style={styles.holesText}>{booking.holes} holes</Text>
                </View>
              </View>

              {booking.confirmationCode && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.confirmationContainer}>
                    <Text style={styles.confirmationLabel}>Confirmation Code</Text>
                    <Text style={styles.confirmationCode}>#{booking.confirmationCode}</Text>
                  </View>
                </>
              )}
            </Card>

            {/* QR Code Card */}
            {booking.qrCode && booking.status === 'CONFIRMED' && (
              <Card containerStyle={styles.card}>
                <TouchableOpacity
                  style={styles.qrContainer}
                  onPress={() => setShowQRCode(!showQRCode)}>
                  <Text style={styles.qrLabel}>
                    Tap to {showQRCode ? 'hide' : 'show'} QR Code for check-in
                  </Text>
                  <Icon
                    name={showQRCode ? 'expand-less' : 'expand-more'}
                    type="material"
                    color={theme.colors?.grey2}
                  />
                </TouchableOpacity>
                {showQRCode && (
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={booking.qrCode}
                      size={200}
                      backgroundColor="#FFFFFF"
                      color="#000000"
                    />
                  </View>
                )}
              </Card>
            )}

            {/* Weather Card */}
            {booking.weatherConditions && isAfter(parseISO(booking.date), new Date()) && (
              <Card containerStyle={styles.card}>
                <Text style={styles.cardTitle}>Weather Forecast</Text>
                <View style={styles.weatherContainer}>
                  <Icon
                    name={booking.weatherConditions.icon}
                    type="material-community"
                    size={48}
                    color={theme.colors?.primary}
                  />
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherTemp}>
                      {booking.weatherConditions.temperature}°F
                    </Text>
                    <Text style={styles.weatherDesc}>{booking.weatherConditions.description}</Text>
                    <Text style={styles.weatherDetail}>
                      Wind: {booking.weatherConditions.windSpeed} mph{' '}
                      {booking.weatherConditions.windDirection}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Players Card */}
            <Card containerStyle={styles.card}>
              <Text style={styles.cardTitle}>Players ({booking.players.length})</Text>
              {booking.players.map((player, index) => (
                <ListItem key={player.id} bottomDivider={index < booking.players.length - 1}>
                  <Icon
                    name={player.isGuest ? 'person-outline' : 'person'}
                    type="material"
                    color={theme.colors?.grey2}
                  />
                  <ListItem.Content>
                    <ListItem.Title>{player.name}</ListItem.Title>
                    <ListItem.Subtitle>
                      {player.isGuest ? 'Guest' : 'Member'}
                      {player.handicap !== undefined && ` • HC: ${player.handicap}`}
                    </ListItem.Subtitle>
                  </ListItem.Content>
                </ListItem>
              ))}
            </Card>

            {/* Course Details Card */}
            <Card containerStyle={styles.card}>
              <Text style={styles.cardTitle}>Course Information</Text>
              <View style={styles.courseDetails}>
                <Text style={styles.courseDetailText}>
                  Par {booking.course.par} • {booking.course.yardage} yards
                </Text>
                {booking.course.rating && (
                  <Text style={styles.courseDetailText}>
                    Rating: {booking.course.rating} • Slope: {booking.course.slope}
                  </Text>
                )}
              </View>
            </Card>

            {/* Booking Details Card */}
            <Card containerStyle={styles.card}>
              <Text style={styles.cardTitle}>Booking Details</Text>
              <ListItem>
                <ListItem.Content>
                  <ListItem.Title>Cart</ListItem.Title>
                  <ListItem.Subtitle>
                    {booking.cartRequired ? `Riding (${booking.cartType})` : 'Walking'}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
              {booking.specialRequests && (
                <ListItem>
                  <ListItem.Content>
                    <ListItem.Title>Special Requests</ListItem.Title>
                    <ListItem.Subtitle>{booking.specialRequests}</ListItem.Subtitle>
                  </ListItem.Content>
                </ListItem>
              )}
              {booking.totalPrice && (
                <ListItem>
                  <ListItem.Content>
                    <ListItem.Title>Total Price</ListItem.Title>
                    <ListItem.Subtitle style={styles.priceText}>
                      ${booking.totalPrice.toFixed(2)}
                    </ListItem.Subtitle>
                  </ListItem.Content>
                </ListItem>
              )}
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {booking.course.contactPhone && (
                <Button
                  title="Contact Pro Shop"
                  icon={
                    <Icon
                      name="phone"
                      type="material"
                      color="#FFFFFF"
                      size={20}
                      style={{ marginRight: 8 }}
                    />
                  }
                  onPress={handleContactProShop}
                  buttonStyle={[styles.actionButton, styles.primaryButton]}
                />
              )}

              {booking.course.mapUrl && (
                <Button
                  title="Get Directions"
                  icon={
                    <Icon
                      name="directions"
                      type="material"
                      color={theme.colors?.primary}
                      size={20}
                      style={{ marginRight: 8 }}
                    />
                  }
                  type="outline"
                  onPress={handleGetDirections}
                  buttonStyle={styles.actionButton}
                  titleStyle={styles.outlineButtonText}
                />
              )}

              {isAfter(parseISO(booking.date), new Date()) && (
                <Button
                  title="Add to Calendar"
                  icon={
                    <Icon
                      name="event"
                      type="material"
                      color={theme.colors?.primary}
                      size={20}
                      style={{ marginRight: 8 }}
                    />
                  }
                  type="outline"
                  onPress={handleAddToCalendar}
                  buttonStyle={styles.actionButton}
                  titleStyle={styles.outlineButtonText}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      {isLoading && <LoadingOverlay />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: theme.colors?.grey2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  mainCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 20,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors?.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dayText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  monthText: {
    fontSize: 14,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  bookingMainInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors?.grey0,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: theme.colors?.grey2,
    marginLeft: 4,
  },
  holesText: {
    fontSize: 14,
    color: theme.colors?.grey2,
  },
  divider: {
    marginVertical: 16,
  },
  confirmationContainer: {
    alignItems: 'center',
  },
  confirmationLabel: {
    fontSize: 14,
    color: theme.colors?.grey2,
    marginBottom: 4,
  },
  confirmationCode: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors?.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors?.grey0,
    marginBottom: 16,
  },
  qrContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 16,
    color: theme.colors?.primary,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherInfo: {
    marginLeft: 16,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors?.grey0,
  },
  weatherDesc: {
    fontSize: 16,
    color: theme.colors?.grey2,
    marginTop: 2,
  },
  weatherDetail: {
    fontSize: 14,
    color: theme.colors?.grey3,
    marginTop: 4,
  },
  courseDetails: {
    paddingHorizontal: 16,
  },
  courseDetailText: {
    fontSize: 14,
    color: theme.colors?.grey2,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors?.primary,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors?.primary,
  },
  outlineButtonText: {
    color: theme.colors?.primary,
  },
});

export default BookingDetailsScreen;
