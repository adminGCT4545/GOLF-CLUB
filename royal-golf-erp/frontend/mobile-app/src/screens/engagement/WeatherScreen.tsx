import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import { fetchWeatherData, fetchWeatherAlerts } from '../../store/slices/courseConditionsSlice';
import { RootState } from '../../store';
import {
  WeatherData,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherAlert,
  GolfConditions,
  PlayabilityRating,
  WindImpact,
  AlertSeverity,
} from '../../types/engagement';
import WeatherCard from '../../components/engagement/WeatherCard';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const { width: screenWidth } = Dimensions.get('window');

const WeatherScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { weather, loading, error } = useSelector((state: RootState) => state.courseConditions);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  // Default location (golf club coordinates)
  const defaultLocation = {
    latitude: 40.7128,
    longitude: -74.006,
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      loadWeatherData();
    }
  }, [location]);

  const requestLocationPermission = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        setLocationPermission(false);
        setLocation(defaultLocation);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocation(defaultLocation);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      setLocation(defaultLocation);
    }
  };

  const loadWeatherData = useCallback(() => {
    if (!location) {return;}

    dispatch(
      fetchWeatherData({
        location,
        units: 'imperial',
        extended: true,
      })
    );

    dispatch(fetchWeatherAlerts(location));
  }, [dispatch, location]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (locationPermission) {
      await getCurrentLocation();
    }
    await loadWeatherData();
    setRefreshing(false);
  }, [loadWeatherData, locationPermission]);

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: string } = {
      'clear-day': '☀️',
      'clear-night': '🌙',
      rain: '🌧️',
      snow: '❄️',
      sleet: '🌨️',
      wind: '💨',
      fog: '🌫️',
      cloudy: '☁️',
      'partly-cloudy-day': '⛅',
      'partly-cloudy-night': '🌙',
      thunderstorm: '⛈️',
    };
    return iconMap[iconCode] || '🌤️';
  };

  const getPlayabilityColor = (rating: PlayabilityRating) => {
    switch (rating) {
      case PlayabilityRating.EXCELLENT:
        return '#4CAF50';
      case PlayabilityRating.GOOD:
        return '#8BC34A';
      case PlayabilityRating.FAIR:
        return '#FFC107';
      case PlayabilityRating.POOR:
        return '#FF9800';
      case PlayabilityRating.UNPLAYABLE:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getAlertSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.WATCH:
        return '#FFC107';
      case AlertSeverity.WARNING:
        return '#FF9800';
      case AlertSeverity.EMERGENCY:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
    });
  };

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°F`;
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  };

  const renderCurrentWeather = () => {
    if (!weather) {return null;}

    const current = weather.current;
    const golfConditions = weather.golfConditions;

    return (
      <View style={styles.currentWeatherCard}>
        <View style={styles.currentMain}>
          <Text style={styles.weatherIcon}>{getWeatherIcon(current.icon)}</Text>
          <View style={styles.currentTemp}>
            <Text style={styles.temperature}>{formatTemperature(current.temperature)}</Text>
            <Text style={styles.conditions}>{current.conditions}</Text>
            <Text style={styles.feelsLike}>Feels like {formatTemperature(current.feelsLike)}</Text>
          </View>
          <View
            style={[
              styles.playabilityBadge,
              { backgroundColor: getPlayabilityColor(golfConditions.playability) },
            ]}>
            <Text style={styles.playabilityText}>{golfConditions.playability.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.currentDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Wind</Text>
              <Text style={styles.detailValue}>
                {Math.round(current.windSpeed)} mph {getWindDirection(current.windDirection)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Humidity</Text>
              <Text style={styles.detailValue}>{Math.round(current.humidity)}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>UV Index</Text>
              <Text style={styles.detailValue}>{current.uvIndex}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Visibility</Text>
              <Text style={styles.detailValue}>{current.visibility} mi</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pressure</Text>
              <Text style={styles.detailValue}>{current.pressure.toFixed(2)} in</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Dew Point</Text>
              <Text style={styles.detailValue}>{formatTemperature(current.dewPoint)}</Text>
            </View>
          </View>
        </View>

        {golfConditions.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={styles.recommendationsTitle}>Golf Recommendations:</Text>
            {golfConditions.recommendations.map((recommendation, index) => (
              <Text key={index} style={styles.recommendation}>
                • {recommendation}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderWeatherAlerts = () => {
    if (!weather?.alerts || weather.alerts.length === 0) {return null;}

    return (
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>Weather Alerts</Text>
        {weather.alerts.map((alert) => (
          <View
            key={alert.id}
            style={[styles.alertCard, { borderLeftColor: getAlertSeverityColor(alert.severity) }]}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text
                style={[styles.alertSeverity, { color: getAlertSeverityColor(alert.severity) }]}>
                {alert.severity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.alertDescription}>{alert.description}</Text>
            <Text style={styles.alertTime}>
              {new Date(alert.startTime).toLocaleString()} -{' '}
              {new Date(alert.endTime).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHourlyForecast = () => {
    if (!weather?.hourly || weather.hourly.length === 0) {return null;}

    return (
      <View style={styles.hourlySection}>
        <Text style={styles.sectionTitle}>24-Hour Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weather.hourly.slice(0, 24).map((hour, index) => (
            <View key={index} style={styles.hourlyItem}>
              <Text style={styles.hourlyTime}>{formatTime(hour.time)}</Text>
              <Text style={styles.hourlyIcon}>{getWeatherIcon(hour.icon)}</Text>
              <Text style={styles.hourlyTemp}>{formatTemperature(hour.temperature)}</Text>
              <Text style={styles.hourlyWind}>{Math.round(hour.windSpeed)} mph</Text>
              {hour.precipitationChance > 0 && (
                <Text style={styles.hourlyPrecip}>{Math.round(hour.precipitationChance)}%</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDailyForecast = () => {
    if (!weather?.daily || weather.daily.length === 0) {return null;}

    return (
      <View style={styles.dailySection}>
        <Text style={styles.sectionTitle}>7-Day Forecast</Text>
        <FlatList
          data={weather.daily.slice(0, 7)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.dailyItem, selectedDay === index && styles.selectedDayItem]}
              onPress={() => setSelectedDay(index)}>
              <Text style={styles.dailyDate}>
                {index === 0
                  ? 'Today'
                  : index === 1
                  ? 'Tomorrow'
                  : new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })}
              </Text>
              <Text style={styles.dailyIcon}>{getWeatherIcon(item.icon)}</Text>
              <Text style={styles.dailyConditions}>{item.conditions}</Text>
              <View style={styles.dailyTemps}>
                <Text style={styles.dailyHigh}>{formatTemperature(item.high)}</Text>
                <Text style={styles.dailyLow}>{formatTemperature(item.low)}</Text>
              </View>
              <Text style={styles.dailyPrecip}>{Math.round(item.precipitationChance)}%</Text>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />

        {/* Selected Day Details */}
        {weather.daily[selectedDay] && (
          <View style={styles.selectedDayDetails}>
            <Text style={styles.selectedDayTitle}>
              {selectedDay === 0
                ? "Today's"
                : selectedDay === 1
                ? "Tomorrow's"
                : new Date(weather.daily[selectedDay].date).toLocaleDateString('en-US', {
                    weekday: 'long',
                  })}{' '}
              Details
            </Text>
            <View style={styles.dayDetailsGrid}>
              <View style={styles.dayDetailItem}>
                <Text style={styles.dayDetailLabel}>High / Low</Text>
                <Text style={styles.dayDetailValue}>
                  {formatTemperature(weather.daily[selectedDay].high)} /{' '}
                  {formatTemperature(weather.daily[selectedDay].low)}
                </Text>
              </View>
              <View style={styles.dayDetailItem}>
                <Text style={styles.dayDetailLabel}>Wind</Text>
                <Text style={styles.dayDetailValue}>
                  {Math.round(weather.daily[selectedDay].windSpeed)} mph{' '}
                  {getWindDirection(weather.daily[selectedDay].windDirection)}
                </Text>
              </View>
              <View style={styles.dayDetailItem}>
                <Text style={styles.dayDetailLabel}>Humidity</Text>
                <Text style={styles.dayDetailValue}>
                  {Math.round(weather.daily[selectedDay].humidity)}%
                </Text>
              </View>
              <View style={styles.dayDetailItem}>
                <Text style={styles.dayDetailLabel}>Precipitation</Text>
                <Text style={styles.dayDetailValue}>
                  {Math.round(weather.daily[selectedDay].precipitationChance)}%
                </Text>
              </View>
              <View style={styles.dayDetailItem}>
                <Text style={styles.dayDetailLabel}>Sunrise</Text>
                <Text style={styles.dayDetailValue}>
                  {new Date(weather.daily[selectedDay].sunrise).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </View>
              <View style={styles.dayDetailItem}>
                <Text style={styles.dayDetailLabel}>Sunset</Text>
                <Text style={styles.dayDetailValue}>
                  {new Date(weather.daily[selectedDay].sunset).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.screenTitle}>Weather</Text>
      {weather && (
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(weather.lastUpdated).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );

  if (loading && !weather) {
    return <LoadingOverlay message="Loading weather data..." />;
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}>
        {renderCurrentWeather()}
        {renderWeatherAlerts()}
        {renderHourlyForecast()}
        {renderDailyForecast()}
      </ScrollView>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadWeatherData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#757575',
  },
  content: {
    flex: 1,
  },
  currentWeatherCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weatherIcon: {
    fontSize: 60,
  },
  currentTemp: {
    flex: 1,
    alignItems: 'center',
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  conditions: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: '#888',
  },
  playabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recommendations: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendation: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  alertsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#888',
  },
  hourlySection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  hourlyItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    minWidth: 80,
  },
  hourlyTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  hourlyIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  hourlyTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  hourlyWind: {
    fontSize: 11,
    color: '#888',
  },
  hourlyPrecip: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 2,
  },
  dailySection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedDayItem: {
    backgroundColor: '#E3F2FD',
  },
  dailyDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    width: 80,
  },
  dailyIcon: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  dailyConditions: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 12,
  },
  dailyTemps: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'space-between',
  },
  dailyHigh: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dailyLow: {
    fontSize: 14,
    color: '#888',
  },
  dailyPrecip: {
    fontSize: 14,
    color: '#2196F3',
    width: 40,
    textAlign: 'right',
  },
  selectedDayDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dayDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayDetailItem: {
    width: '50%',
    paddingVertical: 8,
  },
  dayDetailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  dayDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFCDD2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default WeatherScreen;
