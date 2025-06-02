import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCourseConditions,
  reportCondition,
  setSelectedCourse,
} from '../../store/slices/courseConditionsSlice';
import { RootState } from '../../store';
import { ConditionRating, ConditionReport } from '../../types/courseConditions';
import CourseStatus from '../../components/engagement/CourseStatus';
import WeatherCard from '../../components/engagement/WeatherCard';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const CourseConditionsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { conditions, weather, selectedCourse, loading, error, lastRefresh } = useSelector(
    (state: RootState) => state.courseConditions
  );

  const { currentUser } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCourse, setReportingCourse] = useState<string | null>(null);
  const [reportData, setReportData] = useState<Partial<ConditionReport>>({
    conditions: {
      fairways: ConditionRating.GOOD,
      greens: ConditionRating.GOOD,
      tees: ConditionRating.GOOD,
      rough: ConditionRating.GOOD,
      bunkers: ConditionRating.GOOD,
    },
    notes: '',
  });

  useEffect(() => {
    loadConditions();
  }, [selectedCourse]);

  const loadConditions = useCallback(() => {
    dispatch(fetchCourseConditions(selectedCourse || undefined));
  }, [dispatch, selectedCourse]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConditions();
    setRefreshing(false);
  }, [loadConditions]);

  const handleCourseSelect = (courseId: string) => {
    dispatch(setSelectedCourse(courseId));
  };

  const handleReportCondition = (courseId: string) => {
    setReportingCourse(courseId);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportingCourse || !currentUser) {
      Alert.alert('Error', 'Unable to submit report. Please try again.');
      return;
    }

    try {
      const report: ConditionReport = {
        courseId: reportingCourse,
        conditions: reportData.conditions!,
        notes: reportData.notes,
        reportedBy: currentUser.id,
        timestamp: new Date(),
      };

      await dispatch(reportCondition(report)).unwrap();

      Alert.alert(
        'Report Submitted',
        'Thank you for reporting course conditions. Your report will be reviewed and published shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowReportModal(false);
              setReportingCourse(null);
              setReportData({
                conditions: {
                  fairways: ConditionRating.GOOD,
                  greens: ConditionRating.GOOD,
                  tees: ConditionRating.GOOD,
                  rough: ConditionRating.GOOD,
                  bunkers: ConditionRating.GOOD,
                },
                notes: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      console.error('Error submitting condition report:', error);
    }
  };

  const updateConditionRating = (condition: string, rating: ConditionRating) => {
    setReportData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions!,
        [condition]: rating,
      },
    }));
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

  const renderCourseSelector = () => {
    const courses = [...new Set(conditions.map((c) => c.courseId))];

    if (courses.length <= 1) {
      return null;
    }

    return (
      <View style={styles.courseSelectorContainer}>
        <Text style={styles.selectorTitle}>Select Course:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.courseButton, !selectedCourse && styles.selectedCourseButton]}
            onPress={() => handleCourseSelect('')}>
            <Text
              style={[styles.courseButtonText, !selectedCourse && styles.selectedCourseButtonText]}>
              All Courses
            </Text>
          </TouchableOpacity>

          {courses.map((courseId) => {
            const course = conditions.find((c) => c.courseId === courseId);
            return (
              <TouchableOpacity
                key={courseId}
                style={[
                  styles.courseButton,
                  selectedCourse === courseId && styles.selectedCourseButton,
                ]}
                onPress={() => handleCourseSelect(courseId)}>
                <Text
                  style={[
                    styles.courseButtonText,
                    selectedCourse === courseId && styles.selectedCourseButtonText,
                  ]}>
                  {course?.courseName || `Course ${courseId}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderReportModal = () => (
    <Modal
      visible={showReportModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowReportModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.reportModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Course Conditions</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.reportContent}>
            <Text style={styles.sectionTitle}>Rate Course Conditions</Text>

            {Object.entries(reportData.conditions!).map(([condition, rating]) => (
              <View key={condition} style={styles.conditionRatingRow}>
                <Text style={styles.conditionName}>
                  {condition.charAt(0).toUpperCase() + condition.slice(1)}
                </Text>

                <View style={styles.ratingButtons}>
                  {Object.values(ConditionRating).map((ratingOption) => (
                    <TouchableOpacity
                      key={ratingOption}
                      style={[
                        styles.ratingButton,
                        rating === ratingOption && styles.selectedRating,
                        { backgroundColor: getConditionColor(ratingOption) },
                      ]}
                      onPress={() => updateConditionRating(condition, ratingOption)}>
                      <Text
                        style={[
                          styles.ratingButtonText,
                          rating === ratingOption && styles.selectedRatingText,
                        ]}>
                        {ratingOption.charAt(0).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any additional observations about course conditions..."
                value={reportData.notes}
                onChangeText={(text) => setReportData((prev) => ({ ...prev, notes: text }))}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{reportData.notes?.length || 0} / 500</Text>
            </View>
          </ScrollView>

          <View style={styles.reportActions}>
            <TouchableOpacity
              style={styles.cancelReportButton}
              onPress={() => setShowReportModal(false)}>
              <Text style={styles.cancelReportText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitReportButton} onPress={submitReport}>
              <Text style={styles.submitReportText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.screenTitle}>Course Conditions</Text>
      {lastRefresh && (
        <Text style={styles.lastRefreshed}>
          Last updated: {new Date(lastRefresh).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );

  const filteredConditions = selectedCourse
    ? conditions.filter((c) => c.courseId === selectedCourse)
    : conditions;

  if (loading && !refreshing) {
    return <LoadingOverlay message="Loading course conditions..." />;
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderCourseSelector()}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}>
        {/* Weather Card */}
        {weather && (
          <WeatherCard weather={weather} showHourly={true} showDaily={false} compact={false} />
        )}

        {/* Course Conditions */}
        <View style={styles.conditionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Course Status</Text>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => handleReportCondition(selectedCourse || 'default')}>
              <Text style={styles.reportButtonText}>📝 Report</Text>
            </TouchableOpacity>
          </View>

          {filteredConditions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏌️</Text>
              <Text style={styles.emptyStateTitle}>No Course Data</Text>
              <Text style={styles.emptyStateText}>
                Be the first to report current course conditions!
              </Text>
              <TouchableOpacity
                style={styles.firstReportButton}
                onPress={() => handleReportCondition('default')}>
                <Text style={styles.firstReportText}>Report Conditions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredConditions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CourseStatus
                  condition={item}
                  onReport={handleReportCondition}
                  onViewDetails={(courseId) => {
                    // Navigate to detailed course view
                    console.log('View details for course:', courseId);
                  }}
                  compact={false}
                />
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Golf Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Playing in Current Conditions</Text>
              <Text style={styles.tipText}>
                {weather?.golfConditions.recommendations.length
                  ? weather.golfConditions.recommendations[0]
                  : 'Check weather conditions before heading out to play.'}
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>⛳</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Course Etiquette</Text>
              <Text style={styles.tipText}>
                Please repair divots, fix ball marks, and follow cart path restrictions.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderReportModal()}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConditions}>
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
  lastRefreshed: {
    fontSize: 12,
    color: '#757575',
  },
  courseSelectorContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  courseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    minWidth: 100,
  },
  selectedCourseButton: {
    backgroundColor: '#2196F3',
  },
  courseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  selectedCourseButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  conditionsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reportButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  firstReportButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  firstReportText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reportModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#757575',
  },
  reportContent: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  conditionRatingRow: {
    marginBottom: 20,
  },
  conditionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: 50,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  selectedRating: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#333',
  },
  ratingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedRatingText: {
    color: '#333',
  },
  notesSection: {
    marginTop: 20,
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelReportButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelReportText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitReportButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReportText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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

export default CourseConditionsScreen;
