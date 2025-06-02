import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { theme } from '../../constants/theme';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';

interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
  minDate = new Date(),
  maxDate,
  disabledDates = [],
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the first day of the week for the month
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date) => {
    const dayStart = startOfDay(date);

    if (minDate && isBefore(dayStart, startOfDay(minDate))) {
      return true;
    }

    if (maxDate && isBefore(startOfDay(maxDate), dayStart)) {
      return true;
    }

    return disabledDates.some((disabledDate) => isSameDay(dayStart, startOfDay(disabledDate)));
  };

  const getDayStyle = (date: Date) => {
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isDisabled = isDateDisabled(date);
    const isTodayDate = isToday(date);

    return [
      styles.dayCell,
      isSelected && styles.selectedDay,
      isDisabled && styles.disabledDay,
      isTodayDate && styles.todayDay,
    ];
  };

  const getDayTextStyle = (date: Date) => {
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isDisabled = isDateDisabled(date);
    const isTodayDate = isToday(date);

    return [
      styles.dayText,
      isSelected && styles.selectedDayText,
      isDisabled && styles.disabledDayText,
      isTodayDate && !isSelected && styles.todayDayText,
    ];
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
          <Icon name="chevron-left" type="material" size={28} color={theme.colors?.primary} />
        </TouchableOpacity>

        <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>

        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Icon name="chevron-right" type="material" size={28} color={theme.colors?.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Days Header */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Days */}
      <View style={styles.daysContainer}>
        {/* Empty cells for alignment */}
        {emptyDays.map((_, index) => (
          <View key={`empty-${index}`} style={styles.dayCell} />
        ))}

        {/* Actual days */}
        {days.map((date) => {
          const isDisabled = isDateDisabled(date);

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={getDayStyle(date)}
              onPress={() => !isDisabled && onDateSelect(date)}
              disabled={isDisabled}>
              <Text style={getDayTextStyle(date)}>{format(date, 'd')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors?.grey0,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors?.grey2,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: theme.colors?.grey0,
  },
  selectedDay: {
    backgroundColor: theme.colors?.primary,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: theme.colors?.grey3,
  },
  todayDay: {
    borderWidth: 1,
    borderColor: theme.colors?.primary,
  },
  todayDayText: {
    color: theme.colors?.primary,
    fontWeight: '600',
  },
});

export default CalendarPicker;
