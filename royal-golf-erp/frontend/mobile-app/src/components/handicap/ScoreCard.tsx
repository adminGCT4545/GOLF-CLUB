import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScoreEntry, WeatherCondition, CourseCondition } from '../../types/handicap';
import { formatDistance } from 'date-fns';

interface ScoreCardProps {
  score: ScoreEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  onAnalyze?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  onEdit,
  onDelete,
  onAnalyze,
  showActions = true,
  compact = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (holeScore: number, par: number): string => {
    const diff = holeScore - par;
    if (diff <= -2) {
      return '#FFD700';
    } // Eagle or better
    if (diff === -1) {
      return '#34C759';
    } // Birdie
    if (diff === 0) {
      return '#007AFF';
    } // Par
    if (diff === 1) {
      return '#FF9500';
    } // Bogey
    if (diff === 2) {
      return '#FF3B30';
    } // Double bogey
    return '#8E44AD'; // Triple bogey or worse
  };

  const getScoreLabel = (holeScore: number, par: number): string => {
    const diff = holeScore - par;
    if (diff <= -3) {
      return 'Albatross';
    }
    if (diff === -2) {
      return 'Eagle';
    }
    if (diff === -1) {
      return 'Birdie';
    }
    if (diff === 0) {
      return 'Par';
    }
    if (diff === 1) {
      return 'Bogey';
    }
    if (diff === 2) {
      return 'Double';
    }
    if (diff === 3) {
      return 'Triple';
    }
    return `+${diff}`;
  };

  const formatWeather = (condition: WeatherCondition): string => {
    return condition.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatCourseCondition = (condition: CourseCondition): string => {
    return condition.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Score',
      'Are you sure you want to delete this score? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const renderCompactCard = () => (
    <TouchableOpacity style={styles.compactCard} onPress={() => setShowDetails(true)}>
      <View style={styles.compactHeader}>
        <View style={styles.compactScoreInfo}>
          <Text style={styles.compactScore}>{score.grossScore}</Text>
          <Text style={styles.compactPar}>Par {score.par}</Text>
        </View>
        <View style={styles.compactDetails}>
          <Text style={styles.compactCourse} numberOfLines={1}>
            {score.courseName}
          </Text>
          <Text style={styles.compactDate}>
            {formatDistance(new Date(score.date), new Date(), { addSuffix: true })}
          </Text>
        </View>
        <View style={styles.compactDifferential}>
          <Text style={styles.differentialValue}>{score.differential.toFixed(1)}</Text>
          <Text style={styles.differentialLabel}>Diff</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFullCard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.scoreInfo}>
          <View style={styles.mainScore}>
            <Text style={styles.grossScore}>{score.grossScore}</Text>
            <Text style={styles.parText}>Par {score.par}</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.differential}>Differential: {score.differential.toFixed(1)}</Text>
            {score.adjustedScore !== score.grossScore && (
              <Text style={styles.adjustedScore}>Adjusted: {score.adjustedScore}</Text>
            )}
          </View>
        </View>

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowDetails(true)}>
              <Icon name="visibility" size={20} color="#007AFF" />
            </TouchableOpacity>
            {onAnalyze && (
              <TouchableOpacity style={styles.actionButton} onPress={onAnalyze}>
                <Icon name="analytics" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Icon name="edit" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Icon name="delete" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.courseInfo}>
        <Text style={styles.courseName}>{score.courseName}</Text>
        <Text style={styles.teeInfo}>
          {score.teeName} • Rating: {score.courseRating} • Slope: {score.slopeRating}
        </Text>
        <Text style={styles.dateText}>
          {new Date(score.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {score.playingConditions && (
        <View style={styles.conditions}>
          <Text style={styles.conditionsTitle}>Playing Conditions</Text>
          <View style={styles.conditionsRow}>
            <Text style={styles.conditionItem}>
              Weather: {formatWeather(score.playingConditions.weather)}
            </Text>
            <Text style={styles.conditionItem}>
              Course: {formatCourseCondition(score.playingConditions.courseCondition)}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.viewDetailsButton} onPress={() => setShowDetails(true)}>
        <Text style={styles.viewDetailsText}>View Hole-by-Hole</Text>
        <Icon name="chevron-right" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderDetailsModal = () => (
    <Modal visible={showDetails} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowDetails(false)}>
            <Icon name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Score Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalScoreHeader}>
            <View style={styles.modalScoreInfo}>
              <Text style={styles.modalGrossScore}>{score.grossScore}</Text>
              <Text style={styles.modalParText}>Par {score.par}</Text>
              <Text style={styles.modalDifferential}>
                Differential: {score.differential.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.modalCourseInfo}>
            <Text style={styles.modalCourseName}>{score.courseName}</Text>
            <Text style={styles.modalTeeInfo}>
              {score.teeName} Tees • Rating: {score.courseRating} • Slope: {score.slopeRating}
            </Text>
            <Text style={styles.modalDate}>
              {new Date(score.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.holesGrid}>
            <Text style={styles.holesTitle}>Hole-by-Hole Scores</Text>
            <View style={styles.holesContainer}>
              {score.holes.map((hole) => (
                <View key={hole.holeNumber} style={styles.holeItem}>
                  <Text style={styles.holeNumber}>{hole.holeNumber}</Text>
                  <Text style={styles.holePar}>Par {hole.par}</Text>
                  <View
                    style={[
                      styles.holeScore,
                      { backgroundColor: getScoreColor(hole.score, hole.par) },
                    ]}>
                    <Text style={styles.holeScoreText}>{hole.score}</Text>
                  </View>
                  <Text style={styles.holeLabel}>{getScoreLabel(hole.score, hole.par)}</Text>
                </View>
              ))}
            </View>
          </View>

          {score.playingConditions && (
            <View style={styles.modalConditions}>
              <Text style={styles.modalConditionsTitle}>Playing Conditions</Text>
              <View style={styles.modalConditionsGrid}>
                <View style={styles.modalConditionItem}>
                  <Text style={styles.modalConditionLabel}>Weather</Text>
                  <Text style={styles.modalConditionValue}>
                    {formatWeather(score.playingConditions.weather)}
                  </Text>
                </View>
                <View style={styles.modalConditionItem}>
                  <Text style={styles.modalConditionLabel}>Course</Text>
                  <Text style={styles.modalConditionValue}>
                    {formatCourseCondition(score.playingConditions.courseCondition)}
                  </Text>
                </View>
                {score.playingConditions.temperature && (
                  <View style={styles.modalConditionItem}>
                    <Text style={styles.modalConditionLabel}>Temperature</Text>
                    <Text style={styles.modalConditionValue}>
                      {score.playingConditions.temperature}°F
                    </Text>
                  </View>
                )}
                {score.playingConditions.windSpeed && (
                  <View style={styles.modalConditionItem}>
                    <Text style={styles.modalConditionLabel}>Wind</Text>
                    <Text style={styles.modalConditionValue}>
                      {score.playingConditions.windSpeed} mph{' '}
                      {score.playingConditions.windDirection}
                    </Text>
                  </View>
                )}
              </View>
              {score.playingConditions.notes && (
                <View style={styles.modalConditionNotes}>
                  <Text style={styles.modalConditionLabel}>Notes</Text>
                  <Text style={styles.modalConditionValue}>{score.playingConditions.notes}</Text>
                </View>
              )}
            </View>
          )}

          {score.notes && (
            <View style={styles.modalNotes}>
              <Text style={styles.modalNotesTitle}>Notes</Text>
              <Text style={styles.modalNotesText}>{score.notes}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (compact) {
    return (
      <>
        {renderCompactCard()}
        {renderDetailsModal()}
      </>
    );
  }

  return (
    <>
      {renderFullCard()}
      {renderDetailsModal()}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreInfo: {
    flex: 1,
  },
  compactScoreInfo: {
    alignItems: 'center',
    marginRight: 12,
  },
  mainScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  grossScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  compactScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  parText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  compactPar: {
    fontSize: 12,
    color: '#666666',
  },
  scoreDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  differential: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  adjustedScore: {
    fontSize: 14,
    color: '#FF9500',
  },
  compactDetails: {
    flex: 1,
    marginRight: 12,
  },
  compactCourse: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  compactDate: {
    fontSize: 12,
    color: '#666666',
  },
  compactDifferential: {
    alignItems: 'center',
  },
  differentialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  differentialLabel: {
    fontSize: 10,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  courseInfo: {
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  teeInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
  },
  conditions: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  conditionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  conditionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conditionItem: {
    fontSize: 12,
    color: '#666666',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalScoreHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalScoreInfo: {
    alignItems: 'center',
  },
  modalGrossScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalParText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 8,
  },
  modalDifferential: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalCourseInfo: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCourseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  modalTeeInfo: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 16,
    color: '#666666',
  },
  holesGrid: {
    paddingVertical: 16,
  },
  holesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  holesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  holeItem: {
    alignItems: 'center',
    width: '15%',
    minWidth: 50,
  },
  holeNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 2,
  },
  holePar: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 4,
  },
  holeScore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  holeScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  holeLabel: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  modalConditions: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalConditionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  modalConditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modalConditionItem: {
    width: '45%',
    marginBottom: 12,
  },
  modalConditionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  modalConditionValue: {
    fontSize: 16,
    color: '#333333',
  },
  modalConditionNotes: {
    marginTop: 16,
  },
  modalNotes: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalNotesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  modalNotesText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});

export default ScoreCard;
