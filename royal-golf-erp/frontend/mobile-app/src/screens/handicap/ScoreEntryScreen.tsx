import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchCourses,
  fetchCourseDetails,
  addScore,
  setCurrentScoreEntry,
  updateHoleScore,
  setPlayingConditions,
  setSelectedCourse,
  clearCurrentScoreEntry,
  setOfflineMode,
} from '../../store/slices/handicapSlice';
import { LoadingOverlay } from '../../components/common';
import {
  Course,
  Tee,
  HoleScore,
  WeatherCondition,
  CourseCondition,
  PlayingConditions,
  ScoreEntry,
} from '../../types/handicap';

interface ScoreEntryScreenProps {
  navigation: any;
}

const ScoreEntryScreen: React.FC<ScoreEntryScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    courses,
    selectedCourse,
    currentScoreEntry,
    isLoadingCourses,
    isSubmittingScore,
    offlineMode,
  } = useSelector((state: RootState) => state.handicap);

  const [step, setStep] = useState<'course' | 'tee' | 'conditions' | 'scores' | 'review'>('course');
  const [selectedTee, setSelectedTee] = useState<Tee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [playingConditions, setLocalPlayingConditions] = useState<PlayingConditions>({
    weather: WeatherCondition.SUNNY,
    courseCondition: CourseCondition.GOOD,
  });
  const [holes, setHoles] = useState<HoleScore[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadCourses();
    return () => {
      dispatch(clearCurrentScoreEntry() as any);
      dispatch(setSelectedCourse(null) as any);
    };
  }, []);

  useEffect(() => {
    if (courses) {
      const filtered = courses.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [courses, searchTerm]);

  useEffect(() => {
    if (selectedCourse && selectedTee) {
      initializeHoles();
    }
  }, [selectedCourse, selectedTee]);

  const loadCourses = async () => {
    try {
      await dispatch(fetchCourses() as any);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const initializeHoles = () => {
    if (!selectedCourse || !selectedTee) {
      return;
    }

    const initialHoles: HoleScore[] = selectedCourse.holes.map((hole) => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      score: hole.par,
      handicapStroke: hole.handicapStroke,
      isNetEagle: false,
      isNetBirdie: false,
      isNetPar: false,
      isNetBogey: false,
      isNetDoubleBogeyOrWorse: false,
    }));

    setHoles(initialHoles);
  };

  const handleCourseSelect = async (course: Course) => {
    dispatch(setSelectedCourse(course) as any);
    setShowCourseModal(false);

    // Fetch detailed course information if needed
    if (!course.tees || course.tees.length === 0) {
      try {
        await dispatch(fetchCourseDetails(course.id) as any);
      } catch (error) {
        console.error('Failed to load course details:', error);
      }
    }

    setStep('tee');
  };

  const handleTeeSelect = (tee: Tee) => {
    setSelectedTee(tee);
    setStep('conditions');
  };

  const handleConditionsNext = () => {
    dispatch(setPlayingConditions(playingConditions) as any);
    setStep('scores');
  };

  const updateScore = (holeNumber: number, score: number) => {
    const updatedHoles = holes.map((hole) => {
      if (hole.holeNumber === holeNumber) {
        const diff = score - hole.par;
        return {
          ...hole,
          score,
          adjustedScore: Math.min(score, hole.par + 2 + (hole.handicapStroke <= 18 ? 1 : 0)), // ESC rule
          isNetEagle: diff <= -2,
          isNetBirdie: diff === -1,
          isNetPar: diff === 0,
          isNetBogey: diff === 1,
          isNetDoubleBogeyOrWorse: diff >= 2,
        };
      }
      return hole;
    });
    setHoles(updatedHoles);
  };

  const calculateTotals = () => {
    const grossScore = holes.reduce((sum, hole) => sum + hole.score, 0);
    const adjustedScore = holes.reduce((sum, hole) => sum + (hole.adjustedScore || hole.score), 0);
    const par = holes.reduce((sum, hole) => sum + hole.par, 0);

    return { grossScore, adjustedScore, par };
  };

  const calculateDifferential = () => {
    if (!selectedTee) {
      return 0;
    }

    const { adjustedScore } = calculateTotals();
    const differential =
      ((adjustedScore - selectedTee.courseRating) * 113) / selectedTee.slopeRating;
    return Math.round(differential * 10) / 10;
  };

  const handleSubmitScore = async () => {
    if (!selectedCourse || !selectedTee) {
      Alert.alert('Error', 'Please select a course and tee');
      return;
    }

    const { grossScore, adjustedScore, par } = calculateTotals();
    const differential = calculateDifferential();

    const scoreEntry: Omit<ScoreEntry, 'id' | 'submittedAt'> = {
      memberId: '', // Will be set by the backend
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      teeId: selectedTee.id,
      teeName: selectedTee.name,
      courseRating: selectedTee.courseRating,
      slopeRating: selectedTee.slopeRating,
      par,
      date: new Date().toISOString().split('T')[0],
      grossScore,
      adjustedScore,
      differential,
      playingConditions,
      holes,
      isCompetitive: false,
      isESC: adjustedScore !== grossScore,
      notes: notes.trim() || undefined,
    };

    try {
      await dispatch(addScore(scoreEntry) as any);

      Alert.alert(
        'Score Submitted',
        offlineMode
          ? "Score saved offline. It will be synced when you're back online."
          : 'Your score has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      if (
        (error as Error).message?.includes('Network') ||
        (error as Error).message?.includes('offline')
      ) {
        dispatch(setOfflineMode(true) as any);
        Alert.alert(
          'Saved Offline',
          "No internet connection. Your score has been saved and will be synced when you're back online.",
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'Failed to submit score. Please try again.');
      }
    }
  };

  const renderCourseSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Course</Text>

      <TouchableOpacity style={styles.courseSelector} onPress={() => setShowCourseModal(true)}>
        <Text style={styles.courseSelectorText}>
          {selectedCourse ? selectedCourse.name : 'Choose a course...'}
        </Text>
        <Icon name="chevron-right" size={24} color="#666666" />
      </TouchableOpacity>

      <Modal visible={showCourseModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCourseModal(false)}>
              <Icon name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Course</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <ScrollView style={styles.courseList}>
            {isLoadingCourses ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : (
              filteredCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.courseItem}
                  onPress={() => handleCourseSelect(course)}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.name}</Text>
                    <Text style={styles.courseLocation}>
                      {course.city}, {course.state}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#666666" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );

  const renderTeeSelection = () => {
    if (!selectedCourse) {
      return null;
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Tees</Text>
        <Text style={styles.stepSubtitle}>{selectedCourse.name}</Text>

        {selectedCourse.tees?.map((tee) => (
          <TouchableOpacity
            key={tee.id}
            style={[styles.teeOption, selectedTee?.id === tee.id && styles.teeOptionSelected]}
            onPress={() => handleTeeSelect(tee)}>
            <View style={styles.teeInfo}>
              <View style={styles.teeHeader}>
                <View style={[styles.teeColor, { backgroundColor: tee.color }]} />
                <Text style={styles.teeName}>{tee.name}</Text>
                <Text style={styles.teeGender}>({tee.gender})</Text>
              </View>
              <View style={styles.teeStats}>
                <Text style={styles.teeStat}>Rating: {tee.courseRating}</Text>
                <Text style={styles.teeStat}>Slope: {tee.slopeRating}</Text>
                <Text style={styles.teeStat}>Yardage: {tee.yardage}</Text>
                <Text style={styles.teeStat}>Par: {tee.par}</Text>
              </View>
            </View>
            {selectedTee?.id === tee.id && <Icon name="check-circle" size={24} color="#007AFF" />}
          </TouchableOpacity>
        )) || <Text style={styles.noTees}>No tee information available</Text>}
      </View>
    );
  };

  const renderConditionsSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Playing Conditions</Text>

      <View style={styles.conditionGroup}>
        <Text style={styles.conditionLabel}>Weather</Text>
        <Picker
          selectedValue={playingConditions.weather}
          style={styles.picker}
          onValueChange={(value) =>
            setLocalPlayingConditions((prev) => ({ ...prev, weather: value }))
          }>
          {Object.values(WeatherCondition).map((condition) => (
            <Picker.Item
              key={condition}
              label={condition.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              value={condition}
            />
          ))}
        </Picker>
      </View>

      <View style={styles.conditionGroup}>
        <Text style={styles.conditionLabel}>Course Condition</Text>
        <Picker
          selectedValue={playingConditions.courseCondition}
          style={styles.picker}
          onValueChange={(value) =>
            setLocalPlayingConditions((prev) => ({ ...prev, courseCondition: value }))
          }>
          {Object.values(CourseCondition).map((condition) => (
            <Picker.Item
              key={condition}
              label={condition.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              value={condition}
            />
          ))}
        </Picker>
      </View>

      <View style={styles.conditionGroup}>
        <Text style={styles.conditionLabel}>Temperature (°F)</Text>
        <TextInput
          style={styles.conditionInput}
          value={playingConditions.temperature?.toString() || ''}
          onChangeText={(value) =>
            setLocalPlayingConditions((prev) => ({
              ...prev,
              temperature: value ? parseInt(value) : undefined,
            }))
          }
          placeholder="Optional"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.conditionGroup}>
        <Text style={styles.conditionLabel}>Wind Speed (mph)</Text>
        <TextInput
          style={styles.conditionInput}
          value={playingConditions.windSpeed?.toString() || ''}
          onChangeText={(value) =>
            setLocalPlayingConditions((prev) => ({
              ...prev,
              windSpeed: value ? parseInt(value) : undefined,
            }))
          }
          placeholder="Optional"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.conditionGroup}>
        <Text style={styles.conditionLabel}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          value={playingConditions.notes || ''}
          onChangeText={(value) => setLocalPlayingConditions((prev) => ({ ...prev, notes: value }))}
          placeholder="Any additional notes about the conditions..."
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderScoreEntry = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Scores</Text>
      <Text style={styles.stepSubtitle}>
        {selectedCourse?.name} - {selectedTee?.name} Tees
      </Text>

      <View style={styles.scoresGrid}>
        {holes.map((hole) => (
          <View key={hole.holeNumber} style={styles.holeCard}>
            <Text style={styles.holeNumber}>{hole.holeNumber}</Text>
            <Text style={styles.holePar}>Par {hole.par}</Text>
            <View style={styles.scoreInput}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => updateScore(hole.holeNumber, Math.max(1, hole.score - 1))}>
                <Icon name="remove" size={16} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.scoreValue}>{hole.score}</Text>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => updateScore(hole.holeNumber, hole.score + 1)}>
                <Icon name="add" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            {hole.score !== hole.par && (
              <Text style={styles.scoreDiff}>
                {hole.score > hole.par ? '+' : ''}
                {hole.score - hole.par}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.totalsCard}>
        <Text style={styles.totalsTitle}>Round Summary</Text>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Gross Score:</Text>
          <Text style={styles.totalsValue}>{calculateTotals().grossScore}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Par:</Text>
          <Text style={styles.totalsValue}>{calculateTotals().par}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Score to Par:</Text>
          <Text
            style={[
              styles.totalsValue,
              {
                color:
                  calculateTotals().grossScore <= calculateTotals().par ? '#34C759' : '#FF3B30',
              },
            ]}>
            {calculateTotals().grossScore > calculateTotals().par ? '+' : ''}
            {calculateTotals().grossScore - calculateTotals().par}
          </Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Differential:</Text>
          <Text style={styles.totalsValue}>{calculateDifferential()}</Text>
        </View>
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.notesLabel}>Round Notes (Optional)</Text>
        <TextInput
          style={styles.roundNotesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes about your round..."
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderNavigation = () => (
    <View style={styles.navigation}>
      {step !== 'course' && (
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const steps = ['course', 'tee', 'conditions', 'scores'];
            const currentIndex = steps.indexOf(step);
            if (currentIndex > 0) {
              setStep(steps[currentIndex - 1] as any);
            }
          }}>
          <Icon name="chevron-left" size={20} color="#007AFF" />
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
      )}

      <View style={styles.navSpacer} />

      {step === 'course' && selectedCourse && (
        <TouchableOpacity style={styles.navButton} onPress={() => setStep('tee')}>
          <Text style={styles.navButtonText}>Next</Text>
          <Icon name="chevron-right" size={20} color="#007AFF" />
        </TouchableOpacity>
      )}

      {step === 'tee' && selectedTee && (
        <TouchableOpacity style={styles.navButton} onPress={() => setStep('conditions')}>
          <Text style={styles.navButtonText}>Next</Text>
          <Icon name="chevron-right" size={20} color="#007AFF" />
        </TouchableOpacity>
      )}

      {step === 'conditions' && (
        <TouchableOpacity style={styles.navButton} onPress={handleConditionsNext}>
          <Text style={styles.navButtonText}>Next</Text>
          <Icon name="chevron-right" size={20} color="#007AFF" />
        </TouchableOpacity>
      )}

      {step === 'scores' && (
        <TouchableOpacity
          style={[styles.navButton, styles.submitButton]}
          onPress={handleSubmitScore}
          disabled={isSubmittingScore}>
          {isSubmittingScore ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={[styles.navButtonText, styles.submitButtonText]}>Submit Score</Text>
              <Icon name="check" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'course':
        return renderCourseSelection();
      case 'tee':
        return renderTeeSelection();
      case 'conditions':
        return renderConditionsSelection();
      case 'scores':
        return renderScoreEntry();
      default:
        return renderCourseSelection();
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isSubmittingScore} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {renderNavigation()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  courseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  courseSelectorText: {
    fontSize: 16,
    color: '#333333',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  courseList: {
    flex: 1,
  },
  loader: {
    marginTop: 50,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  courseLocation: {
    fontSize: 14,
    color: '#666666',
  },
  teeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  teeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  teeInfo: {
    flex: 1,
  },
  teeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teeColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  teeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  teeGender: {
    fontSize: 14,
    color: '#666666',
  },
  teeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teeStat: {
    fontSize: 12,
    color: '#666666',
  },
  noTees: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  conditionGroup: {
    marginBottom: 20,
  },
  conditionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  conditionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  holeCard: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  holeNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 4,
  },
  holePar: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 8,
  },
  scoreInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  scoreDiff: {
    fontSize: 10,
    color: '#666666',
  },
  totalsCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalsLabel: {
    fontSize: 14,
    color: '#666666',
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  notesSection: {
    marginTop: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  roundNotesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navSpacer: {
    flex: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  navButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default ScoreEntryScreen;
