export interface Leaderboard {
  id: string;
  name: string;
  category: LeaderboardCategory;
  type: LeaderboardType;
  period: TimePeriod;
  entries: LeaderboardEntry[];
  lastUpdated: Date;
  totalParticipants: number;
}

export interface LeaderboardEntry {
  id: string;
  member: {
    id: string;
    name: string;
    avatar?: string;
    handicap?: number;
  };
  position: number;
  score: number;
  points?: number;
  previousPosition?: number;
  positionChange: number;
  gamesPlayed: number;
  bestScore?: number;
  averageScore?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  badge: {
    icon: string;
    color: string;
    rarity: BadgeRarity;
  };
  requirements: AchievementRequirement[];
  progress?: AchievementProgress;
  unlockedAt?: Date;
  shareCount: number;
}

export interface AchievementProgress {
  current: number;
  total: number;
  percentage: number;
  milestones: Milestone[];
}

export interface Milestone {
  value: number;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

export interface AchievementRequirement {
  type: RequirementType;
  value: number;
  description: string;
}

export interface SocialPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    handicap?: number;
  };
  content: string;
  type: PostType;
  media?: PostMedia[];
  location?: CourseLocation;
  tags: string[];
  taggedMembers: TaggedMember[];
  privacy: PrivacyLevel;
  likes: Like[];
  comments: Comment[];
  shares: Share[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  reportCount: number;
  isReported: boolean;
}

export interface PostMedia {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  caption?: string;
  filter?: string;
  duration?: number; // for videos
}

export interface TaggedMember {
  id: string;
  name: string;
  avatar?: string;
}

export interface CourseLocation {
  courseId: string;
  courseName: string;
  hole?: number;
  tee?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Like {
  id: string;
  memberId: string;
  memberName: string;
  reaction: ReactionType;
  createdAt: Date;
}

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  parentId?: string; // for reply threads
  replies: Comment[];
  likes: Like[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  reportCount: number;
}

export interface Share {
  id: string;
  memberId: string;
  memberName: string;
  platform?: SharePlatform;
  createdAt: Date;
}

export interface CourseCondition {
  id: string;
  courseId: string;
  courseName: string;
  status: CourseStatus;
  conditions: {
    fairways: ConditionRating;
    greens: ConditionRating;
    tees: ConditionRating;
    rough: ConditionRating;
    bunkers: ConditionRating;
  };
  maintenance: MaintenanceInfo[];
  paceOfPlay: PaceInfo;
  pinPlacements: PinPlacement[];
  restrictions: CourseRestriction[];
  lastUpdated: Date;
  reportedBy?: string;
  verified: boolean;
}

export interface MaintenanceInfo {
  id: string;
  type: MaintenanceType;
  description: string;
  holes: number[];
  startDate: Date;
  endDate?: Date;
  severity: SeverityLevel;
}

export interface PaceInfo {
  currentPace: number; // minutes per hole
  expectedPace: number;
  backlog: number; // groups waiting
  bottleneckHole?: number;
  lastUpdated: Date;
}

export interface PinPlacement {
  hole: number;
  position: PinPosition;
  difficulty: DifficultyLevel;
  distance: {
    front: number;
    back: number;
    total: number;
  };
  notes?: string;
}

export interface CourseRestriction {
  id: string;
  type: RestrictionType;
  description: string;
  holes: number[];
  startTime?: Date;
  endTime?: Date;
  severity: SeverityLevel;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  golfConditions: GolfConditions;
  lastUpdated: Date;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  visibility: number;
  uvIndex: number;
  pressure: number;
  dewPoint: number;
  cloudCover: number;
  precipitation: number;
  conditions: string;
  icon: string;
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  precipitationChance: number;
  conditions: string;
  icon: string;
}

export interface DailyForecast {
  date: Date;
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  precipitationChance: number;
  sunrise: Date;
  sunset: Date;
  conditions: string;
  icon: string;
}

export interface WeatherAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
}

export interface GolfConditions {
  playability: PlayabilityRating;
  recommendations: string[];
  courseStatus: CourseWeatherStatus;
  lightningRisk: RiskLevel;
  heatIndex: number;
  windImpact: WindImpact;
}

// Enums
export enum LeaderboardCategory {
  TOURNAMENT_RANKINGS = 'tournament_rankings',
  SEASON_STANDINGS = 'season_standings',
  HANDICAP_IMPROVEMENTS = 'handicap_improvements',
  COURSE_RECORDS = 'course_records',
  PARTICIPATION = 'participation',
}

export enum LeaderboardType {
  SCORE_BASED = 'score_based',
  POINTS_BASED = 'points_based',
  ACHIEVEMENT_BASED = 'achievement_based',
  HANDICAP_BASED = 'handicap_based',
}

export enum TimePeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  ALL_TIME = 'all_time',
}

export enum AchievementCategory {
  GOLF_PERFORMANCE = 'golf_performance',
  SOCIAL_ENGAGEMENT = 'social_engagement',
  TOURNAMENT_PARTICIPATION = 'tournament_participation',
  COURSE_KNOWLEDGE = 'course_knowledge',
  COMMUNITY_SPIRIT = 'community_spirit',
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum RequirementType {
  ROUNDS_PLAYED = 'rounds_played',
  SCORE_ACHIEVEMENT = 'score_achievement',
  TOURNAMENTS_ENTERED = 'tournaments_entered',
  SOCIAL_INTERACTIONS = 'social_interactions',
  CONSECUTIVE_DAYS = 'consecutive_days',
}

export enum PostType {
  TEXT = 'text',
  PHOTO = 'photo',
  VIDEO = 'video',
  SCORE_SHARE = 'score_share',
  ACHIEVEMENT = 'achievement',
  TOURNAMENT_RESULT = 'tournament_result',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  MEMBERS_ONLY = 'members_only',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private',
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  WOW = 'wow',
  ANGRY = 'angry',
  SAD = 'sad',
}

export enum SharePlatform {
  INTERNAL = 'internal',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  WHATSAPP = 'whatsapp',
}

export enum CourseStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  DELAYED_START = 'delayed_start',
  MAINTENANCE = 'maintenance',
  WEATHER_HOLD = 'weather_hold',
}

export enum ConditionRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum MaintenanceType {
  GREENS_MAINTENANCE = 'greens_maintenance',
  FAIRWAY_WORK = 'fairway_work',
  CART_PATH_REPAIR = 'cart_path_repair',
  TREE_WORK = 'tree_work',
  IRRIGATION = 'irrigation',
  CONSTRUCTION = 'construction',
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PinPosition {
  FRONT = 'front',
  MIDDLE = 'middle',
  BACK = 'back',
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
}

export enum RestrictionType {
  CART_PATH_ONLY = 'cart_path_only',
  NO_CARTS = 'no_carts',
  WALKING_ONLY = 'walking_only',
  HOLE_CLOSED = 'hole_closed',
  TEMPORARY_GREEN = 'temporary_green',
}

export enum AlertType {
  SEVERE_WEATHER = 'severe_weather',
  LIGHTNING = 'lightning',
  HIGH_WIND = 'high_wind',
  EXTREME_HEAT = 'extreme_heat',
  FROST = 'frost',
}

export enum AlertSeverity {
  WATCH = 'watch',
  WARNING = 'warning',
  EMERGENCY = 'emergency',
}

export enum PlayabilityRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  UNPLAYABLE = 'unplayable',
}

export enum CourseWeatherStatus {
  IDEAL = 'ideal',
  PLAYABLE = 'playable',
  CHALLENGING = 'challenging',
  POOR = 'poor',
  SUSPENDED = 'suspended',
}

export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme',
}

export enum WindImpact {
  MINIMAL = 'minimal',
  MODERATE = 'moderate',
  SIGNIFICANT = 'significant',
  SEVERE = 'severe',
}

// API Response Types
export interface LeaderboardsResponse {
  leaderboards: Leaderboard[];
  userPositions: { [leaderboardId: string]: number };
}

export interface AchievementsResponse {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  recentUnlocks: Achievement[];
}

export interface SocialFeedResponse {
  posts: SocialPost[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface CourseConditionsResponse {
  conditions: CourseCondition[];
  weather: WeatherData;
}

// Form Types
export interface CreatePostData {
  content: string;
  type: PostType;
  media?: File[];
  location?: CourseLocation;
  taggedMembers: string[];
  privacy: PrivacyLevel;
  scheduledAt?: Date;
}

export interface ReportContentData {
  contentId: string;
  contentType: 'post' | 'comment';
  reason: string;
  description?: string;
}
