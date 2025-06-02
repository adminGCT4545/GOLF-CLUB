import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import {
  WeatherData,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  GolfConditions,
  PlayabilityRating,
  WindImpact,
} from '../../types/engagement';

interface WeatherCardProps {
  weather: WeatherData;
  onPress?: () => void;
  showHourly?: boolean;
  showDaily?: boolean;
  compact?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  onPress,
  showHourly = true,
  showDaily = false,
  compact = false,
}) => {
  const getWeatherIcon = (iconCode: string) => {
    // Map weather icon codes to emoji or local icons
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

  const getWindImpactColor = (impact: WindImpact) => {
    switch (impact) {
      case WindImpact.MINIMAL:
        return '#4CAF50';
      case WindImpact.MODERATE:
        return '#FFC107';
      case WindImpact.SIGNIFICANT:
        return '#FF9800';
      case WindImpact.SEVERE:
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
    return `${Math.round(temp)}°`;
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onPress}>
        <View style={styles.compactContent}>
          <Text style={styles.compactIcon}>{getWeatherIcon(weather.current.icon)}</Text>
          <View style={styles.compactInfo}>
            <Text style={styles.compactTemp}>{formatTemperature(weather.current.temperature)}</Text>
            <Text style={styles.compactCondition}>{weather.current.conditions}</Text>
          </View>
          <View
            style={[
              styles.playabilityIndicator,
              { backgroundColor: getPlayabilityColor(weather.golfConditions.playability) },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onPress}>
        <View style={styles.currentWeather}>
          <Text style={styles.weatherIcon}>{getWeatherIcon(weather.current.icon)}</Text>
          <View style={styles.currentInfo}>
            <Text style={styles.temperature}>{formatTemperature(weather.current.temperature)}</Text>
            <Text style={styles.conditions}>{weather.current.conditions}</Text>
            <Text style={styles.feelsLike}>
              Feels like {formatTemperature(weather.current.feelsLike)}
            </Text>
          </View>
        </View>

        <View style={styles.golfConditions}>
          <View
            style={[
              styles.playabilityBadge,
              { backgroundColor: getPlayabilityColor(weather.golfConditions.playability) },
            ]}>
            <Text style={styles.playabilityText}>
              {weather.golfConditions.playability.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Golf-specific conditions */}
      <View style={styles.golfDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Wind</Text>
            <Text style={styles.detailValue}>
              {Math.round(weather.current.windSpeed)} mph{' '}
              {getWindDirection(weather.current.windDirection)}
            </Text>
            <View
              style={[
                styles.windImpactIndicator,
                { backgroundColor: getWindImpactColor(weather.golfConditions.windImpact) },
              ]}
            />
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailValue}>{Math.round(weather.current.humidity)}%</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>UV Index</Text>
            <Text style={styles.detailValue}>{weather.current.uvIndex}</Text>
          </View>
        </View>

        {weather.golfConditions.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={styles.recommendationsTitle}>Golf Recommendations:</Text>
            {weather.golfConditions.recommendations.map((recommendation, index) => (
              <Text key={index} style={styles.recommendation}>
                • {recommendation}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Weather alerts */}
      {weather.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {weather.alerts.map((alert) => (
            <View key={alert.id} style={styles.alert}>
              <Text style={styles.alertTitle}>⚠️ {alert.title}</Text>
              <Text style={styles.alertDescription}>{alert.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Hourly forecast */}
      {showHourly && weather.hourly.length > 0 && (
        <View style={styles.hourlyContainer}>
          <Text style={styles.sectionTitle}>Hourly Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weather.hourly.slice(0, 12).map((hour, index) => (
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
      )}

      {/* Daily forecast */}
      {showDaily && weather.daily.length > 0 && (
        <View style={styles.dailyContainer}>
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          {weather.daily.slice(0, 7).map((day, index) => (
            <View key={index} style={styles.dailyItem}>
              <Text style={styles.dailyDate}>
                {index === 0
                  ? 'Today'
                  : index === 1
                  ? 'Tomorrow'
                  : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={styles.dailyIcon}>{getWeatherIcon(day.icon)}</Text>
              <Text style={styles.dailyConditions}>{day.conditions}</Text>
              <View style={styles.dailyTemps}>
                <Text style={styles.dailyHigh}>{formatTemperature(day.high)}</Text>
                <Text style={styles.dailyLow}>{formatTemperature(day.low)}</Text>
              </View>
              <Text style={styles.dailyPrecip}>{Math.round(day.precipitationChance)}%</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(weather.lastUpdated).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactTemp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  compactCondition: {
    fontSize: 14,
    color: '#666',
  },
  playabilityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  currentInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  conditions: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: '#888',
  },
  golfConditions: {
    alignItems: 'flex-end',
  },
  playabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  golfDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  windImpactIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  recommendations: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendation: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  alertsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  alert: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    color: '#856404',
  },
  hourlyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
  dailyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    width: 60,
  },
  dailyHigh: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
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
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default WeatherCard;
