export interface Member {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  membershipType: MembershipType;
  membershipTier: MembershipTier;
  joinDate: string;
  isOnline: boolean;
  lastSeen?: string;
  handicapIndex?: number;
  emergencyContact?: EmergencyContact;
  address?: Address;
  socialMedia?: SocialMediaLinks;
  preferences?: MemberPreferences;
  privacy?: PrivacySettings;
  stats?: MemberStats;
}

export interface MemberProfile extends Member {
  bio?: string;
  playingPartners: string[];
  recentTournaments: TournamentResult[];
  handicapHistory: HandicapRecord[];
  achievements: Achievement[];
  clubPositions?: string[];
  specializations?: string[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface MemberPreferences {
  notifications: {
    tournaments: boolean;
    bookings: boolean;
    messages: boolean;
    events: boolean;
    news: boolean;
  };
  communication: {
    email: boolean;
    sms: boolean;
    pushNotifications: boolean;
  };
  visibility: {
    profileVisible: boolean;
    handicapVisible: boolean;
    contactInfoVisible: boolean;
    tournamentResultsVisible: boolean;
  };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'members' | 'friends' | 'private';
  contactVisibility: 'public' | 'members' | 'friends' | 'private';
  handicapVisibility: 'public' | 'members' | 'friends' | 'private';
  tournamentResultsVisibility: 'public' | 'members' | 'friends' | 'private';
  allowDirectMessages: boolean;
  allowTournamentInvitations: boolean;
  allowPlayingPartnerRequests: boolean;
}

export interface MemberStats {
  totalRounds: number;
  averageScore: number;
  bestScore: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  favoritePartners: string[];
  preferredTeeTime: string;
  averageRoundTime: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  dateEarned: string;
  category: 'tournament' | 'handicap' | 'social' | 'milestone';
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  date: string;
  position: number;
  totalParticipants: number;
  score: number;
  prize?: string;
}

export interface MemberSearchFilter {
  searchTerm: string;
  membershipTypes: MembershipType[];
  membershipTiers: MembershipTier[];
  handicapRange: {
    min?: number;
    max?: number;
  };
  joinDateRange: {
    start?: string;
    end?: string;
  };
  isOnlineOnly: boolean;
  hasHandicap: boolean;
  sortBy: 'name' | 'joinDate' | 'handicap' | 'lastSeen';
  sortOrder: 'asc' | 'desc';
}

export enum MembershipType {
  FULL = 'full',
  SOCIAL = 'social',
  JUNIOR = 'junior',
  SENIOR = 'senior',
  CORPORATE = 'corporate',
  FAMILY = 'family',
}

export enum MembershipTier {
  PLATINUM = 'platinum',
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze',
  BASIC = 'basic',
}

export interface MemberDirectory {
  members: Member[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: MemberSearchFilter;
  sections: MemberSection[];
}

export interface MemberSection {
  title: string;
  data: Member[];
}

export interface ContactAction {
  type: 'call' | 'message' | 'email';
  value: string;
  label: string;
}

export interface PlayingPartnerRequest {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface MemberConnection {
  memberId: string;
  connectionType: 'friend' | 'playing_partner' | 'following' | 'blocked';
  connectedAt: string;
  lastInteraction?: string;
}
