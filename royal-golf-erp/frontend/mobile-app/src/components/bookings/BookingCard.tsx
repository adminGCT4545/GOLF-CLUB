import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon, Card, Button } from 'react-native-elements';
import { theme } from '../../constants/theme';
import { TeeTimeBooking } from '../../types/booking';
import { format, parseISO, isAfter } from 'date-fns';

interface BookingCardProps {
  booking: TeeTimeBooking;
  onPress: () => void;
  onCancel?: () => void;
  onModify?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onPress, onCancel, onModify }) => {
  const bookingDate = parseISO(booking.date);
  const isUpcoming = isAfter(bookingDate, new Date());
  const canModify = isUpcoming && booking.status === 'CONFIRMED';

  const getStatusColor = () => {
    switch (booking.status) {
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

  const getStatusIcon = () => {
    switch (booking.status) {
      case 'CONFIRMED':
        return 'check-circle';
      case 'PENDING':
        return 'schedule';
      case 'CANCELLED':
        return 'cancel';
      case 'COMPLETED':
        return 'golf-course';
      default:
        return 'info';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card containerStyle={styles.card}>
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Text style={styles.dayText}>{format(bookingDate, 'dd')}</Text>
            <Text style={styles.monthText}>{format(bookingDate, 'MMM')}</Text>
          </View>

          <View style={styles.bookingInfo}>
            <Text style={styles.courseText}>{booking.course} Course</Text>
            <View style={styles.timeRow}>
              <Icon name="access-time" type="material" size={16} color={theme.colors?.grey2} />
              <Text style={styles.timeText}>{booking.time}</Text>
              <Text style={styles.holesText}>• {booking.holes} holes</Text>
            </View>
            <View style={styles.playersRow}>
              <Icon name="people" type="material" size={16} color={theme.colors?.grey2} />
              <Text style={styles.playersText}>
                {booking.players.length} {booking.players.length === 1 ? 'player' : 'players'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Icon name={getStatusIcon()} type="material" size={16} color="#FFFFFF" />
          </View>
        </View>

        {booking.confirmationCode && (
          <View style={styles.confirmationRow}>
            <Icon
              name="confirmation-number"
              type="material"
              size={14}
              color={theme.colors?.grey3}
            />
            <Text style={styles.confirmationText}>#{booking.confirmationCode}</Text>
          </View>
        )}

        {canModify && (
          <View style={styles.actionsRow}>
            {onModify && (
              <Button
                title="Modify"
                type="outline"
                buttonStyle={[styles.actionButton, styles.modifyButton]}
                titleStyle={styles.modifyButtonText}
                onPress={onModify}
                icon={
                  <Icon
                    name="edit"
                    type="material"
                    size={16}
                    color={theme.colors?.primary}
                    style={{ marginRight: 4 }}
                  />
                }
              />
            )}
            {onCancel && (
              <Button
                title="Cancel"
                type="outline"
                buttonStyle={[styles.actionButton, styles.cancelButton]}
                titleStyle={styles.cancelButtonText}
                onPress={onCancel}
                icon={
                  <Icon
                    name="close"
                    type="material"
                    size={16}
                    color={theme.colors?.error}
                    style={{ marginRight: 4 }}
                  />
                }
              />
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: theme.colors?.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  monthText: {
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  bookingInfo: {
    flex: 1,
  },
  courseText: {
    fontSize: 16,
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
    fontSize: 14,
    color: theme.colors?.grey2,
    marginLeft: 4,
  },
  holesText: {
    fontSize: 14,
    color: theme.colors?.grey2,
    marginLeft: 8,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playersText: {
    fontSize: 14,
    color: theme.colors?.grey2,
    marginLeft: 4,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors?.greyOutline,
  },
  confirmationText: {
    fontSize: 12,
    color: theme.colors?.grey3,
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors?.greyOutline,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
  },
  modifyButton: {
    borderColor: theme.colors?.primary,
    marginRight: 8,
  },
  modifyButtonText: {
    fontSize: 14,
    color: theme.colors?.primary,
  },
  cancelButton: {
    borderColor: theme.colors?.error,
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.colors?.error,
  },
});

export default BookingCard;
