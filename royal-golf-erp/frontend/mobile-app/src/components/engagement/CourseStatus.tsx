import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import {
  CourseCondition,
  CourseStatus as CourseStatusType,
  ConditionRating,
  MaintenanceInfo,
  PaceInfo,
  PinPlacement,
  CourseRestriction,
  SeverityLevel,
  MaintenanceType,
  RestrictionType,
  PinPosition,
  DifficultyLevel,
} from '../../types/engagement';

interface CourseStatusProps {
  condition: CourseCondition;
  onReport?: (courseId: string) => void;
  onViewDetails?: (courseId: string) => void;
  compact?: boolean;
}

const CourseStatus: React.FC<CourseStatusProps> = ({
  condition,
  onReport,
  onViewDetails,
  compact = false,
}) => {
  const getStatusColor = (status: CourseStatusType) => {
    switch (status) {
      case CourseStatusType.OPEN:
        return '#4CAF50';
      case CourseStatusType.DELAYED_START:
        return '#FFC107';
      case CourseStatusType.WEATHER_HOLD:
        return '#FF9800';
      case CourseStatusType.MAINTENANCE:
        return '#2196F3';
      case CourseStatusType.CLOSED:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getConditionColor = (rating: ConditionRating) => {
    switch (rating) {
      case ConditionRating.EXCELLENT:
        return '#4CAF50';
      case ConditionRating.GOOD:
        return '#8BC34A';
      case ConditionRating.FAIR:
        return '#FFC107';
      case ConditionRating.POOR:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case SeverityLevel.LOW:
        return '#4CAF50';
      case SeverityLevel.MEDIUM:
        return '#FFC107';
      case SeverityLevel.HIGH:
        return '#FF9800';
      case SeverityLevel.CRITICAL:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getMaintenanceIcon = (type: MaintenanceType) => {
    switch (type) {
      case MaintenanceType.GREENS_MAINTENANCE:
        return '🏌️';
      case MaintenanceType.FAIRWAY_WORK:
        return '🌿';
      case MaintenanceType.CART_PATH_REPAIR:
        return '🛤️';
      case MaintenanceType.TREE_WORK:
        return '🌳';
      case MaintenanceType.IRRIGATION:
        return '💧';
      case MaintenanceType.CONSTRUCTION:
        return '🚧';
      default:
        return '⚙️';
    }
  };

  const getRestrictionIcon = (type: RestrictionType) => {
    switch (type) {
      case RestrictionType.CART_PATH_ONLY:
        return '🛤️';
      case RestrictionType.NO_CARTS:
        return '🚫';
      case RestrictionType.WALKING_ONLY:
        return '🚶';
      case RestrictionType.HOLE_CLOSED:
        return '⛔';
      case RestrictionType.TEMPORARY_GREEN:
        return '🎯';
      default:
        return '⚠️';
    }
  };

  const getPinPositionIcon = (position: PinPosition) => {
    switch (position) {
      case PinPosition.FRONT:
        return '⬆️';
      case PinPosition.BACK:
        return '⬇️';
      case PinPosition.LEFT:
        return '⬅️';
      case PinPosition.RIGHT:
        return '➡️';
      case PinPosition.CENTER:
        return '🎯';
      default:
        return '📍';
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return '#4CAF50';
      case DifficultyLevel.MEDIUM:
        return '#FFC107';
      case DifficultyLevel.HARD:
        return '#FF9800';
      case DifficultyLevel.VERY_HARD:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const formatHoles = (holes: number[]) => {
    if (holes.length === 0) {
      return 'None';
    }
    if (holes.length === 18) {
      return 'All holes';
    }
    if (holes.length <= 3) {
      return holes.join(', ');
    }
    return `${holes.slice(0, 3).join(', ')}... (+${holes.length - 3} more)`;
  };

  const getPaceStatus = (pace: PaceInfo) => {
    const behind = pace.currentPace - pace.expectedPace;
    if (behind <= 0) {
      return { status: 'On Time', color: '#4CAF50' };
    }
    if (behind <= 5) {
      return { status: 'Slightly Behind', color: '#FFC107' };
    }
    if (behind <= 10) {
      return { status: 'Behind Schedule', color: '#FF9800' };
    }
    return { status: 'Significantly Behind', color: '#F44336' };
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => onViewDetails?.(condition.courseId)}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>{condition.courseName}</Text>
          <View
            style={[styles.statusIndicator, { backgroundColor: getStatusColor(condition.status) }]}>
            <Text style={styles.statusText}>
              {condition.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.compactConditions}>
          {Object.entries(condition.conditions).map(([key, rating]) => (
            <View key={key} style={styles.compactCondition}>
              <View style={[styles.conditionDot, { backgroundColor: getConditionColor(rating) }]} />
              <Text style={styles.conditionLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.courseName}>{condition.courseName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(condition.status) }]}>
            <Text style={styles.statusBadgeText}>
              {condition.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {onReport && (
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => onReport(condition.courseId)}>
              <Text style={styles.reportButtonText}>Report</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Course Conditions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course Conditions</Text>
        <View style={styles.conditionsGrid}>
          {Object.entries(condition.conditions).map(([key, rating]) => (
            <View key={key} style={styles.conditionItem}>
              <Text style={styles.conditionName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <View
                style={[styles.conditionRating, { backgroundColor: getConditionColor(rating) }]}>
                <Text style={styles.conditionRatingText}>{rating.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Pace of Play */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pace of Play</Text>
        <View style={styles.paceContainer}>
          <View style={styles.paceItem}>
            <Text style={styles.paceLabel}>Current Pace</Text>
            <Text style={styles.paceValue}>{condition.paceOfPlay.currentPace} min/hole</Text>
          </View>
          <View style={styles.paceItem}>
            <Text style={styles.paceLabel}>Expected</Text>
            <Text style={styles.paceValue}>{condition.paceOfPlay.expectedPace} min/hole</Text>
          </View>
          <View style={styles.paceItem}>
            <Text style={styles.paceLabel}>Backlog</Text>
            <Text style={styles.paceValue}>{condition.paceOfPlay.backlog} groups</Text>
          </View>
          <View style={styles.paceStatus}>
            {(() => {
              const status = getPaceStatus(condition.paceOfPlay);
              return (
                <Text style={[styles.paceStatusText, { color: status.color }]}>
                  {status.status}
                </Text>
              );
            })()}
          </View>
        </View>

        {condition.paceOfPlay.bottleneckHole && (
          <Text style={styles.bottleneckInfo}>
            Bottleneck at Hole {condition.paceOfPlay.bottleneckHole}
          </Text>
        )}
      </View>

      {/* Pin Placements */}
      {condition.pinPlacements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pin Placements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {condition.pinPlacements.map((pin) => (
              <View key={pin.hole} style={styles.pinItem}>
                <Text style={styles.pinHole}>Hole {pin.hole}</Text>
                <Text style={styles.pinPosition}>
                  {getPinPositionIcon(pin.position)} {pin.position}
                </Text>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(pin.difficulty) },
                  ]}>
                  <Text style={styles.difficultyText}>
                    {pin.difficulty.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.pinDistance}>{pin.distance.total} yds</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Maintenance */}
      {condition.maintenance.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance</Text>
          {condition.maintenance.map((maintenance) => (
            <View key={maintenance.id} style={styles.maintenanceItem}>
              <View style={styles.maintenanceHeader}>
                <Text style={styles.maintenanceIcon}>{getMaintenanceIcon(maintenance.type)}</Text>
                <View style={styles.maintenanceInfo}>
                  <Text style={styles.maintenanceDescription}>{maintenance.description}</Text>
                  <Text style={styles.maintenanceHoles}>
                    Holes: {formatHoles(maintenance.holes)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(maintenance.severity) },
                  ]}>
                  <Text style={styles.severityText}>{maintenance.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.maintenanceDuration}>
                {new Date(maintenance.startDate).toLocaleDateString()}
                {maintenance.endDate && ` - ${new Date(maintenance.endDate).toLocaleDateString()}`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Restrictions */}
      {condition.restrictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restrictions</Text>
          {condition.restrictions.map((restriction) => (
            <View key={restriction.id} style={styles.restrictionItem}>
              <View style={styles.restrictionHeader}>
                <Text style={styles.restrictionIcon}>{getRestrictionIcon(restriction.type)}</Text>
                <View style={styles.restrictionInfo}>
                  <Text style={styles.restrictionDescription}>{restriction.description}</Text>
                  <Text style={styles.restrictionHoles}>
                    Holes: {formatHoles(restriction.holes)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(restriction.severity) },
                  ]}>
                  <Text style={styles.severityText}>{restriction.severity.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(condition.lastUpdated).toLocaleString()}
        </Text>
        {condition.reportedBy && (
          <Text style={styles.reportedBy}>
            Reported by: {condition.reportedBy}
            {condition.verified && ' ✓'}
          </Text>
        )}
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
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  compactConditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  compactCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleSection: {
    flex: 1,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  reportButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionItem: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  conditionName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  conditionRating: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  conditionRatingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  paceItem: {
    alignItems: 'center',
  },
  paceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  paceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paceStatus: {
    alignItems: 'center',
  },
  paceStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottleneckInfo: {
    fontSize: 14,
    color: '#FF9800',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  pinItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    minWidth: 100,
  },
  pinHole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pinPosition: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pinDistance: {
    fontSize: 12,
    color: '#888',
  },
  maintenanceItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  maintenanceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  maintenanceInfo: {
    flex: 1,
  },
  maintenanceDescription: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  maintenanceHoles: {
    fontSize: 12,
    color: '#666',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  maintenanceDuration: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  restrictionItem: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  restrictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restrictionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  restrictionInfo: {
    flex: 1,
  },
  restrictionDescription: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  restrictionHoles: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 4,
  },
  reportedBy: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default CourseStatus;
