export interface TeeTimeBooking {
  id: string;
  memberId: string;
  date: string;
  time: string;
  course: 'CHAMPIONSHIP' | 'EXECUTIVE';
  holes: 9 | 18;
  players: Player[];
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  cartRequired: boolean;
  cartType?: 'walking' | 'riding';
  notes?: string;
  specialRequests?: string;
  confirmationCode?: string;
  qrCode?: string;
  weatherConditions?: WeatherConditions;
  createdAt: string;
  updatedAt: string;
  totalPrice?: number;
  paidAmount?: number;
  paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL';
}

export interface Player {
  id: string;
  name: string;
  memberId?: string;
  handicap?: number;
  isGuest: boolean;
  email?: string;
  phone?: string;
}

export interface FacilityBooking {
  id: string;
  memberId: string;
  facilityType: 'TENNIS' | 'SWIMMING' | 'GYM' | 'CONFERENCE' | 'DINING';
  facilityId: string;
  facilityName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  participants: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSlot {
  time: string;
  available: boolean;
  price?: number;
}

// New types for tee time booking
export interface TeeTimeSlot {
  id: string;
  date: string;
  time: string;
  courseId: string;
  courseName: string;
  available: boolean;
  maxPlayers: number;
  bookedPlayers: number;
  price: number;
  memberPrice: number;
  guestPrice: number;
  cartFee?: number;
  restrictions?: string[];
}

export interface BookingRequest {
  date: string;
  time: string;
  courseId: string;
  holes: 9 | 18;
  players: PlayerRequest[];
  cartRequired: boolean;
  cartType?: 'walking' | 'riding';
  specialRequests?: string;
}

export interface PlayerRequest {
  name: string;
  memberId?: string;
  isGuest: boolean;
  email?: string;
  phone?: string;
  handicap?: number;
}

export interface BookingDetails extends TeeTimeBooking {
  course: Course;
  checkInTime?: string;
  checkedIn?: boolean;
  scorecard?: Scorecard;
}

export interface Course {
  id: string;
  name: string;
  type: 'CHAMPIONSHIP' | 'EXECUTIVE';
  description?: string;
  holes: number;
  par: number;
  yardage: number;
  rating?: number;
  slope?: number;
  facilities?: string[];
  imageUrl?: string;
  mapUrl?: string;
  contactPhone?: string;
}

export interface WeatherConditions {
  temperature: number;
  description: string;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  icon: string;
}

export interface Scorecard {
  id: string;
  bookingId: string;
  scores: PlayerScore[];
  totalScore: number;
  completedAt?: string;
}

export interface PlayerScore {
  playerId: string;
  holes: HoleScore[];
  totalScore: number;
}

export interface HoleScore {
  hole: number;
  par: number;
  score: number;
  putts?: number;
}

export interface BookingFilter {
  status?: ('CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED')[];
  dateFrom?: string;
  dateTo?: string;
  courseId?: string;
}
