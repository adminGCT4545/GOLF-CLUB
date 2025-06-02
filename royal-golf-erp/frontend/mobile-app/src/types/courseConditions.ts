import {
  CourseCondition,
  WeatherData,
  CourseStatus,
  ConditionRating,
  MaintenanceType,
  SeverityLevel,
  RestrictionType,
  PlayabilityRating,
} from './engagement';

// Extended types specific to course conditions
export interface CourseConditionsState {
  conditions: CourseCondition[];
  weather: WeatherData | null;
  selectedCourse: string | null;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export interface WeatherState {
  current: WeatherData | null;
  forecast: WeatherData | null;
  alerts: WeatherAlert[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface ConditionReport {
  courseId: string;
  conditions: {
    fairways: ConditionRating;
    greens: ConditionRating;
    tees: ConditionRating;
    rough: ConditionRating;
    bunkers: ConditionRating;
  };
  notes?: string;
  photos?: string[];
  reportedBy: string;
  timestamp: Date;
}

export interface WeatherAlert {
  id: string;
  type: 'severe_weather' | 'lightning' | 'high_wind' | 'extreme_heat' | 'frost';
  severity: 'watch' | 'warning' | 'emergency';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
}

export interface CourseAlert {
  id: string;
  courseId: string;
  type: 'maintenance' | 'closure' | 'restriction' | 'pace_delay';
  severity: SeverityLevel;
  title: string;
  description: string;
  affectedHoles: number[];
  startTime: Date;
  endTime?: Date;
  estimatedDuration?: number;
}

// API Types
export interface UpdateConditionsRequest {
  courseId: string;
  conditions: Partial<CourseCondition>;
  reportedBy: string;
}

export interface WeatherRequest {
  location: {
    latitude: number;
    longitude: number;
  };
  units?: 'metric' | 'imperial';
  extended?: boolean;
}

export {
  CourseCondition,
  WeatherData,
  CourseStatus,
  ConditionRating,
  MaintenanceType,
  SeverityLevel,
  RestrictionType,
  PlayabilityRating,
};
