import { format, parseISO, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { BOOKING_RULES, DATE_FORMAT, TIME_FORMAT } from '../constants/config';

export const formatDate = (date: Date | string, formatString: string = DATE_FORMAT): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, TIME_FORMAT);
};

export const canBookDate = (date: Date): boolean => {
  const today = startOfDay(new Date());
  const maxBookingDate = addDays(today, BOOKING_RULES.MAX_ADVANCE_DAYS);

  return !isBefore(date, today) && !isAfter(date, maxBookingDate);
};

export const getAvailableDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 0; i < BOOKING_RULES.MAX_ADVANCE_DAYS; i++) {
    dates.push(addDays(today, i));
  }

  return dates;
};

export const formatTimeSlot = (time: string): string => {
  // Convert 24-hour format to 12-hour format with AM/PM
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Message-specific date formatters
export const formatMessageDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const today = startOfDay(now);
  const messageDate = startOfDay(dateObj);

  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDate.getTime() === addDays(today, -1).getTime()) {
    return 'Yesterday';
  } else {
    return format(dateObj, 'MMM dd');
  }
};

export const formatNotificationTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Just now';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return format(dateObj, 'MMM dd');
};
