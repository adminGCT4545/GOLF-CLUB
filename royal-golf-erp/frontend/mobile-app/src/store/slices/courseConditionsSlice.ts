import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  CourseCondition,
  WeatherData,
  CourseConditionsState,
  ConditionReport,
  CourseAlert,
  WeatherAlert,
  UpdateConditionsRequest,
  WeatherRequest,
  CourseConditionsResponse,
} from '../../types/courseConditions';
import { apiClient } from '../../services/api';

const initialState: CourseConditionsState = {
  conditions: [],
  weather: null,
  selectedCourse: null,
  loading: false,
  error: null,
  lastRefresh: null,
};

// Async Thunks
export const fetchCourseConditions = createAsyncThunk(
  'courseConditions/fetchCourseConditions',
  async (courseId?: string) => {
    const endpoint = courseId ? `/api/course-conditions/${courseId}` : '/api/course-conditions';

    const response = await apiClient.get<CourseConditionsResponse>(endpoint);
    return response.data;
  }
);

export const fetchWeatherData = createAsyncThunk(
  'courseConditions/fetchWeatherData',
  async (params: WeatherRequest) => {
    const response = await apiClient.get<WeatherData>('/api/weather', {
      params,
    });
    return response.data;
  }
);

export const updateCourseConditions = createAsyncThunk(
  'courseConditions/updateCourseConditions',
  async (request: UpdateConditionsRequest) => {
    const response = await apiClient.put<CourseCondition>(
      `/api/course-conditions/${request.courseId}`,
      request
    );
    return response.data;
  }
);

export const reportCondition = createAsyncThunk(
  'courseConditions/reportCondition',
  async (report: ConditionReport) => {
    const formData = new FormData();

    // Add basic report data
    Object.entries(report).forEach(([key, value]) => {
      if (key === 'photos' && value) {
        (value as string[]).forEach((photo, index) => {
          formData.append(`photos[${index}]`, photo);
        });
      } else if (key === 'conditions') {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });

    const response = await apiClient.post<CourseCondition>(
      '/api/course-conditions/report',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
);

export const updatePinPlacements = createAsyncThunk(
  'courseConditions/updatePinPlacements',
  async (params: {
    courseId: string;
    pinPlacements: Array<{
      hole: number;
      position: string;
      difficulty: string;
      distances: {
        front: number;
        back: number;
        total: number;
      };
      notes?: string;
    }>;
  }) => {
    const { courseId, pinPlacements } = params;
    const response = await apiClient.put<CourseCondition>(
      `/api/course-conditions/${courseId}/pins`,
      { pinPlacements }
    );
    return response.data;
  }
);

export const fetchCourseAlerts = createAsyncThunk(
  'courseConditions/fetchCourseAlerts',
  async (courseId?: string) => {
    const endpoint = courseId
      ? `/api/course-conditions/alerts/${courseId}`
      : '/api/course-conditions/alerts';

    const response = await apiClient.get<CourseAlert[]>(endpoint);
    return response.data;
  }
);

export const createCourseAlert = createAsyncThunk(
  'courseConditions/createCourseAlert',
  async (alert: Omit<CourseAlert, 'id'>) => {
    const response = await apiClient.post<CourseAlert>('/api/course-conditions/alerts', alert);
    return response.data;
  }
);

export const updateCourseAlert = createAsyncThunk(
  'courseConditions/updateCourseAlert',
  async (params: { alertId: string; updates: Partial<CourseAlert> }) => {
    const { alertId, updates } = params;
    const response = await apiClient.put<CourseAlert>(
      `/api/course-conditions/alerts/${alertId}`,
      updates
    );
    return response.data;
  }
);

export const deleteCourseAlert = createAsyncThunk(
  'courseConditions/deleteCourseAlert',
  async (alertId: string) => {
    await apiClient.delete(`/api/course-conditions/alerts/${alertId}`);
    return alertId;
  }
);

export const fetchWeatherAlerts = createAsyncThunk(
  'courseConditions/fetchWeatherAlerts',
  async (location: { latitude: number; longitude: number }) => {
    const response = await apiClient.get<WeatherAlert[]>('/api/weather/alerts', {
      params: location,
    });
    return response.data;
  }
);

export const subscribeToCourseUpdates = createAsyncThunk(
  'courseConditions/subscribeToCourseUpdates',
  async (courseId: string) => {
    const response = await apiClient.post(`/api/course-conditions/${courseId}/subscribe`);
    return response.data;
  }
);

export const unsubscribeFromCourseUpdates = createAsyncThunk(
  'courseConditions/unsubscribeFromCourseUpdates',
  async (courseId: string) => {
    const response = await apiClient.post(`/api/course-conditions/${courseId}/unsubscribe`);
    return response.data;
  }
);

const courseConditionsSlice = createSlice({
  name: 'courseConditions',
  initialState,
  reducers: {
    setSelectedCourse: (state, action: PayloadAction<string | null>) => {
      state.selectedCourse = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateConditionInList: (state, action: PayloadAction<CourseCondition>) => {
      const index = state.conditions.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.conditions[index] = action.payload;
      } else {
        state.conditions.push(action.payload);
      }
    },
    removeConditionFromList: (state, action: PayloadAction<string>) => {
      state.conditions = state.conditions.filter((c) => c.id !== action.payload);
    },
    updateWeatherData: (state, action: PayloadAction<WeatherData>) => {
      state.weather = action.payload;
    },
    // Real-time updates
    receiveConditionUpdate: (state, action: PayloadAction<CourseCondition>) => {
      const index = state.conditions.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.conditions[index] = action.payload;
      }
    },
    receiveWeatherUpdate: (state, action: PayloadAction<WeatherData>) => {
      state.weather = action.payload;
    },
    addNewAlert: (state, action: PayloadAction<CourseAlert>) => {
      // Add new alert to the relevant course condition
      const courseCondition = state.conditions.find((c) => c.courseId === action.payload.courseId);
      if (courseCondition) {
        // Note: This assumes CourseCondition has an alerts property
        // You may need to adjust based on your actual data structure
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Course Conditions
    builder
      .addCase(fetchCourseConditions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseConditions.fulfilled, (state, action) => {
        state.loading = false;
        state.conditions = action.payload.conditions;
        state.weather = action.payload.weather;
        state.lastRefresh = new Date();
      })
      .addCase(fetchCourseConditions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch course conditions';
      });

    // Fetch Weather Data
    builder
      .addCase(fetchWeatherData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeatherData.fulfilled, (state, action) => {
        state.loading = false;
        state.weather = action.payload;
        state.lastRefresh = new Date();
      })
      .addCase(fetchWeatherData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch weather data';
      });

    // Update Course Conditions
    builder
      .addCase(updateCourseConditions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourseConditions.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCondition = action.payload;
        const index = state.conditions.findIndex((c) => c.id === updatedCondition.id);
        if (index !== -1) {
          state.conditions[index] = updatedCondition;
        } else {
          state.conditions.push(updatedCondition);
        }
      })
      .addCase(updateCourseConditions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update course conditions';
      });

    // Report Condition
    builder
      .addCase(reportCondition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reportCondition.fulfilled, (state, action) => {
        state.loading = false;
        const reportedCondition = action.payload;
        const index = state.conditions.findIndex((c) => c.courseId === reportedCondition.courseId);
        if (index !== -1) {
          state.conditions[index] = reportedCondition;
        } else {
          state.conditions.push(reportedCondition);
        }
      })
      .addCase(reportCondition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to report condition';
      });

    // Update Pin Placements
    builder.addCase(updatePinPlacements.fulfilled, (state, action) => {
      const updatedCondition = action.payload;
      const index = state.conditions.findIndex((c) => c.id === updatedCondition.id);
      if (index !== -1) {
        state.conditions[index] = updatedCondition;
      }
    });

    // Fetch Course Alerts
    builder.addCase(fetchCourseAlerts.fulfilled, (state, action) => {
      // Handle course alerts - you might want to add an alerts array to the state
      // or handle them differently based on your UI requirements
    });

    // Create Course Alert
    builder.addCase(createCourseAlert.fulfilled, (state, action) => {
      // Handle new alert creation
    });

    // Update Course Alert
    builder.addCase(updateCourseAlert.fulfilled, (state, action) => {
      // Handle alert update
    });

    // Delete Course Alert
    builder.addCase(deleteCourseAlert.fulfilled, (state, action) => {
      // Handle alert deletion
    });

    // Fetch Weather Alerts
    builder.addCase(fetchWeatherAlerts.fulfilled, (state, action) => {
      // Update weather alerts in weather data
      if (state.weather) {
        state.weather.alerts = action.payload;
      }
    });
  },
});

export const {
  setSelectedCourse,
  clearError,
  updateConditionInList,
  removeConditionFromList,
  updateWeatherData,
  receiveConditionUpdate,
  receiveWeatherUpdate,
  addNewAlert,
} = courseConditionsSlice.actions;

export default courseConditionsSlice.reducer;
