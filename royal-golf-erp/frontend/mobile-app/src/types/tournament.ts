export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  format:
    | 'STROKE_PLAY'
    | 'MATCH_PLAY'
    | 'STABLEFORD'
    | 'SCRAMBLE'
    | 'TEXAS_SCRAMBLE'
    | 'FOURBALL'
    | 'FOURSOMES';
  category:
    | 'OPEN'
    | 'MEMBERS_ONLY'
    | 'INVITATIONAL'
    | 'JUNIOR'
    | 'SENIOR'
    | 'LADIES'
    | 'CLUB_CHAMPIONSHIP';
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  status:
    | 'UPCOMING'
    | 'REGISTRATION_OPEN'
    | 'REGISTRATION_CLOSED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  venue: string;
  course: string;
  holes: number;
  rounds: number;
  rules?: string;
  conditions?: string;
  sponsor?: string;
  imageUrl?: string;
  prizeStructure?: PrizeStructure[];
  pastWinners?: PastWinner[];
  handicapLimit?: number;
  isTeamEvent: boolean;
  teamSize?: number;
  allowsGuests: boolean;
  dressCode?: string;
  weatherPolicy?: string;
  cancelationPolicy?: string;
}

export interface PrizeStructure {
  position: string;
  prize: string;
  amount?: number;
}

export interface PastWinner {
  year: number;
  name: string;
  score?: string;
  handicap?: number;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  memberId: string;
  memberName: string;
  handicap: number;
  registrationDate: string;
  status: 'REGISTERED' | 'WAITLISTED' | 'CANCELLED' | 'CONFIRMED';
  teamMembers?: TeamMember[];
  emergencyContact: EmergencyContact;
  dietaryPreferences?: string;
  tshirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
  paymentId?: string;
  specialRequests?: string;
  termsAccepted: boolean;
  registrationFee: number;
}

export interface TeamMember {
  id: string;
  name: string;
  handicap: number;
  isGuest: boolean;
  guestContact?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface TournamentResult {
  id: string;
  tournamentId: string;
  position: number;
  playerId: string;
  playerName: string;
  totalScore: number;
  scores: RoundScore[];
  handicap: number;
  netScore?: number;
  prize?: number;
  prizeDescription?: string;
}

export interface RoundScore {
  round: number;
  score: number;
  holes: HoleScore[];
}

export interface HoleScore {
  hole: number;
  par: number;
  score: number;
  putts?: number;
}

export interface Leaderboard {
  tournamentId: string;
  lastUpdated: string;
  isLive: boolean;
  currentRound: number;
  totalRounds: number;
  leaders: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  position: number;
  playerId: string;
  playerName: string;
  totalScore: number;
  topar: string;
  currentRound?: number;
  currentHole?: number;
  today?: number;
  handicap: number;
  netScore?: number;
  isAmateur: boolean;
  profileImage?: string;
}

export interface TournamentFilter {
  category?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  registrationStatus?: 'open' | 'closed' | 'all';
}

export interface MyTournamentStats {
  totalTournaments: number;
  wins: number;
  top3Finishes: number;
  top10Finishes: number;
  averageScore: number;
  bestScore: number;
  totalPrizeMoney: number;
  handicapImprovement: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PaymentInfo {
  amount: number;
  currency: string;
  description: string;
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethod {
  id: string;
  type: 'CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'MEMBER_ACCOUNT';
  name: string;
  icon: string;
  isDefault: boolean;
}
