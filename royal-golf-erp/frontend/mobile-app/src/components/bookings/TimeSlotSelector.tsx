import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { theme } from '../../constants/theme';
import { TeeTimeSlot } from '../../types/booking';
import { format, parseISO } from 'date-fns';

interface TimeSlotSelectorProps {
  slots: TeeTimeSlot[];
  selectedSlot: TeeTimeSlot | null;
  onSlotSelect: (slot: TeeTimeSlot) => void;
  isLoading?: boolean;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots,
  selectedSlot,
  onSlotSelect,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors?.primary} />
        <Text style={styles.loadingText}>Loading available tee times...</Text>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="golf-course" type="material-community" size={48} color={theme.colors?.grey3} />
        <Text style={styles.emptyText}>No tee times available for this date</Text>
        <Text style={styles.emptySubtext}>Please select another date</Text>
      </View>
    );
  }

  // Group slots by morning, afternoon, evening
  const groupedSlots = slots.reduce((acc, slot) => {
    const hour = parseInt(slot.time.split(':')[0]);
    let period = 'Morning';

    if (hour >= 12 && hour < 17) {
      period = 'Afternoon';
    } else if (hour >= 17) {
      period = 'Evening';
    }

    if (!acc[period]) {
      acc[period] = [];
    }

    acc[period].push(slot);
    return acc;
  }, {} as Record<string, TeeTimeSlot[]>);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {Object.entries(groupedSlots).map(([period, periodSlots]) => (
        <View key={period} style={styles.periodSection}>
          <Text style={styles.periodTitle}>{period}</Text>
          <View style={styles.slotsGrid}>
            {periodSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const isAvailable = slot.available && slot.bookedPlayers < slot.maxPlayers;

              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotCard,
                    isSelected && styles.selectedSlot,
                    !isAvailable && styles.unavailableSlot,
                  ]}
                  onPress={() => isAvailable && onSlotSelect(slot)}
                  disabled={!isAvailable}>
                  <Text
                    style={[
                      styles.timeText,
                      isSelected && styles.selectedText,
                      !isAvailable && styles.unavailableText,
                    ]}>
                    {slot.time}
                  </Text>

                  {isAvailable ? (
                    <>
                      <View style={styles.slotInfo}>
                        <Icon
                          name="people"
                          type="material"
                          size={16}
                          color={isSelected ? '#FFFFFF' : theme.colors?.grey2}
                        />
                        <Text style={[styles.availabilityText, isSelected && styles.selectedText]}>
                          {slot.maxPlayers - slot.bookedPlayers} spots
                        </Text>
                      </View>

                      <Text style={[styles.priceText, isSelected && styles.selectedText]}>
                        ${slot.memberPrice}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.unavailableLabel}>Full</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors?.grey2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors?.grey1,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors?.grey3,
  },
  periodSection: {
    marginBottom: 24,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors?.grey0,
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  slotCard: {
    width: '31%',
    marginHorizontal: '1.16%',
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors?.greyOutline,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedSlot: {
    backgroundColor: theme.colors?.primary,
    borderColor: theme.colors?.primary,
  },
  unavailableSlot: {
    backgroundColor: theme.colors?.grey5,
    borderColor: theme.colors?.grey4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors?.grey0,
    marginBottom: 4,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  unavailableText: {
    color: theme.colors?.grey3,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: theme.colors?.grey2,
    marginLeft: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors?.primary,
  },
  unavailableLabel: {
    fontSize: 14,
    color: theme.colors?.grey3,
    fontStyle: 'italic',
  },
});

export default TimeSlotSelector;
