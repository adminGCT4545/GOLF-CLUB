import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { Achievement, BadgeRarity } from '../../types/engagement';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  onPress?: (achievement: Achievement) => void;
  unlocked?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  showProgress = false,
  onPress,
  unlocked = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 60, height: 60 },
          icon: { fontSize: 24 },
          badge: { width: 50, height: 50, borderRadius: 25 },
        };
      case 'large':
        return {
          container: { width: 100, height: 100 },
          icon: { fontSize: 40 },
          badge: { width: 80, height: 80, borderRadius: 40 },
        };
      default:
        return {
          container: { width: 80, height: 80 },
          icon: { fontSize: 32 },
          badge: { width: 70, height: 70, borderRadius: 35 },
        };
    }
  };

  const getRarityStyles = () => {
    switch (achievement.badge.rarity) {
      case BadgeRarity.LEGENDARY:
        return {
          backgroundColor: '#FF6B35',
          borderColor: '#FF8C00',
          glowColor: '#FFD700',
        };
      case BadgeRarity.EPIC:
        return {
          backgroundColor: '#9C27B0',
          borderColor: '#E91E63',
          glowColor: '#FF69B4',
        };
      case BadgeRarity.RARE:
        return {
          backgroundColor: '#3F51B5',
          borderColor: '#2196F3',
          glowColor: '#00BCD4',
        };
      case BadgeRarity.UNCOMMON:
        return {
          backgroundColor: '#4CAF50',
          borderColor: '#8BC34A',
          glowColor: '#CDDC39',
        };
      default:
        return {
          backgroundColor: '#9E9E9E',
          borderColor: '#BDBDBD',
          glowColor: '#E0E0E0',
        };
    }
  };

  const getProgressPercentage = () => {
    if (!achievement.progress) {
      return 0;
    }
    return (achievement.progress.current / achievement.progress.total) * 100;
  };

  const sizeStyles = getSizeStyles();
  const rarityStyles = getRarityStyles();

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress(achievement);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, sizeStyles.container]}
        onPress={handlePress}
        activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.badge,
            sizeStyles.badge,
            {
              backgroundColor: unlocked ? rarityStyles.backgroundColor : '#E0E0E0',
              borderColor: unlocked ? rarityStyles.borderColor : '#BDBDBD',
              transform: [{ scale: scaleAnim }],
            },
            unlocked && achievement.badge.rarity === BadgeRarity.LEGENDARY && styles.legendaryGlow,
          ]}>
          <Text style={[styles.icon, sizeStyles.icon, !unlocked && styles.lockedIcon]}>
            {unlocked ? achievement.badge.icon : '🔒'}
          </Text>
        </Animated.View>

        {showProgress && achievement.progress && !unlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {achievement.progress.current}/{achievement.progress.total}
            </Text>
          </View>
        )}

        {unlocked && achievement.unlockedAt && (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalBadge, { backgroundColor: rarityStyles.backgroundColor }]}>
                <Text style={styles.modalIcon}>{achievement.badge.icon}</Text>
              </View>
              <Text style={styles.modalTitle}>{achievement.name}</Text>
              <Text style={styles.modalRarity}>{achievement.badge.rarity.toUpperCase()}</Text>
            </View>

            <Text style={styles.modalDescription}>{achievement.description}</Text>

            {achievement.requirements.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Requirements:</Text>
                {achievement.requirements.map((req, index) => (
                  <Text key={index} style={styles.requirement}>
                    • {req.description}
                  </Text>
                ))}
              </View>
            )}

            {achievement.progress && !unlocked && (
              <View style={styles.modalProgressContainer}>
                <Text style={styles.progressTitle}>Progress:</Text>
                <View style={styles.modalProgressBar}>
                  <View
                    style={[styles.modalProgressFill, { width: `${getProgressPercentage()}%` }]}
                  />
                </View>
                <Text style={styles.modalProgressText}>
                  {achievement.progress.current} / {achievement.progress.total}(
                  {achievement.progress.percentage.toFixed(1)}%)
                </Text>

                {achievement.progress.milestones.length > 0 && (
                  <View style={styles.milestonesContainer}>
                    <Text style={styles.milestonesTitle}>Milestones:</Text>
                    {achievement.progress.milestones.map((milestone, index) => (
                      <View key={index} style={styles.milestone}>
                        <Text
                          style={[
                            styles.milestoneText,
                            milestone.completed && styles.completedMilestone,
                          ]}>
                          {milestone.completed ? '✓' : '○'} {milestone.description}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {unlocked && achievement.unlockedAt && (
              <View style={styles.unlockedInfo}>
                <Text style={styles.unlockedLabel}>
                  Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                </Text>
                {achievement.shareCount > 0 && (
                  <Text style={styles.shareCount}>Shared {achievement.shareCount} times</Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  lockedIcon: {
    color: '#757575',
  },
  legendaryGlow: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  progressContainer: {
    marginTop: 4,
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 10,
    color: '#757575',
    marginTop: 2,
  },
  unlockedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIcon: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalRarity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  requirementsContainer: {
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  modalProgressContainer: {
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  modalProgressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  milestonesContainer: {
    marginTop: 12,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  milestone: {
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 14,
    color: '#666',
  },
  completedMilestone: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  unlockedInfo: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  unlockedLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
  },
  shareCount: {
    fontSize: 12,
    color: '#757575',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AchievementBadge;
