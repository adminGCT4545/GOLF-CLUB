export interface HandicapRecord {
  id: string;
  memberId: string;
  handicapIndex: number;
  date: string;
  calculatedFrom: string[];
  revisionReason?: string;
  isActive: boolean;
}

export interface ScoreEntry {
  id: string;
  memberId: string;
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  courseRating: number;
  slopeRating: number;
  par: number;
  date: string;
  grossScore: number;
  adjustedScore: number;
  differential: number;
  playingConditions?: PlayingConditions;
  holes: HoleScore[];
  isCompetitive: boolean;
  tournamentId?: string;
  submittedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  isESC: boolean; // Equitable Stroke Control applied
  notes?: string;
}

export interface HoleScore {
  holeNumber: number;
  par: number;
  score: number;
  adjustedScore?: number;
  handicapStroke: number;
  isNetEagle: boolean;
  isNetBirdie: boolean;
  isNetPar: boolean;
  isNetBogey: boolean;
  isNetDoubleBogeyOrWorse: boolean;
}

export interface PlayingConditions {
  weather: WeatherCondition;
  courseCondition: CourseCondition;
  windSpeed?: number;
  windDirection?: string;
  temperature?: number;
  precipitation?: string;
  notes?: string;
}

export interface Course {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  website?: string;
  tees: Tee[];
  holes: Hole[];
  facilities: string[];
  rating: number;
  reviews: number;
  images: string[];
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Tee {
  id: string;
  name: string;
  color: string;
  gender: 'men' | 'women' | 'unisex';
  courseRating: number;
  slopeRating: number;
  yardage: number;
  par: number;
}

export interface Hole {
  holeNumber: number;
  par: number;
  yardage: {
    [teeId: string]: number;
  };
  handicapStroke: number;
  description?: string;
}

export interface HandicapCalculation {
  currentIndex: number;
  previousIndex?: number;
  change: number;
  calculationDate: string;
  scoresUsed: ScoreEntry[];
  totalScores: number;
  lowestDifferentials: number[];
  averageDifferential: number;
  nextRevisionDate: string;
}

export interface HandicapStatistics {
  currentHandicap: number;
  lowestHandicap: number;
  highestHandicap: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  totalRounds: number;
  roundsThisYear: number;
  averageDifferential: number;
  consistencyRating: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

export interface HandicapTrend {
  date: string;
  handicapIndex: number;
  scoreDifferential?: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PeerComparison {
  memberId: string;
  memberName: string;
  handicapIndex: number;
  handicapDifference: number;
  averageScore: number;
  scoreDifference: number;
  roundsPlayed: number;
  lastPlayedTogether?: string;
}

export interface HandicapDashboard {
  currentHandicap: HandicapRecord;
  statistics: HandicapStatistics;
  recentScores: ScoreEntry[];
  trendData: HandicapTrend[];
  peerComparisons: PeerComparison[];
  upcomingRevision?: string;
  achievements: HandicapAchievement[];
}

export interface HandicapAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  dateEarned: string;
  category: 'milestone' | 'improvement' | 'consistency' | 'special';
  value?: number;
}

export interface ScoreAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  trendAnalysis: {
    overall: 'improving' | 'stable' | 'declining';
    shortGame: 'improving' | 'stable' | 'declining';
    longGame: 'improving' | 'stable' | 'declining';
    putting: 'improving' | 'stable' | 'declining';
  };
  consistencyScore: number;
  confidenceRange: {
    min: number;
    max: number;
  };
}

export interface OfflineScoreEntry {
  id: string;
  data: Omit<ScoreEntry, 'id'>;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastSyncAttempt?: string;
  errorMessage?: string;
}

export enum WeatherCondition {
  SUNNY = 'sunny',
  PARTLY_CLOUDY = 'partly_cloudy',
  CLOUDY = 'cloudy',
  OVERCAST = 'overcast',
  LIGHT_RAIN = 'light_rain',
  HEAVY_RAIN = 'heavy_rain',
  WINDY = 'windy',
  STORMY = 'stormy',
  FOG = 'fog',
  SNOW = 'snow',
}

export enum CourseCondition {
  EXCELLENT = 'excellent',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  TEMPORARY_GREENS = 'temporary_greens',
  WINTER_RULES = 'winter_rules',
  CART_PATH_ONLY = 'cart_path_only',
}

export interface HandicapExport {
  format: 'pdf' | 'csv' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  includeScores: boolean;
  includeStatistics: boolean;
  includeTrends: boolean;
  includeComparisons: boolean;
}
