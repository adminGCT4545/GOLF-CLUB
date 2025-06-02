import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { TypingIndicator as TypingIndicatorType } from '../../types/message';

const { width } = Dimensions.get('window');

interface TypingIndicatorProps {
  typingUsers: TypingIndicatorType[];
  currentUserId: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, currentUserId }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Filter out current user from typing indicators
  const otherUsersTyping = typingUsers.filter((user) => user.userId !== currentUserId);

  useEffect(() => {
    if (otherUsersTyping.length > 0) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Continuous dot animation
      const animateDots = () => {
        const createDotAnimation = (animValue: Animated.Value, delay: number) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(animValue, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
            { iterations: -1 }
          );
        };

        Animated.parallel([
          createDotAnimation(dot1Anim, 0),
          createDotAnimation(dot2Anim, 150),
          createDotAnimation(dot3Anim, 300),
        ]).start();
      };

      animateDots();
    } else {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    // Cleanup animations when component unmounts or typing users change
    return () => {
      dot1Anim.stopAnimation();
      dot2Anim.stopAnimation();
      dot3Anim.stopAnimation();
    };
  }, [otherUsersTyping.length, fadeAnim, dot1Anim, dot2Anim, dot3Anim]);

  if (otherUsersTyping.length === 0) {
    return null;
  }

  const getTypingText = (): string => {
    const count = otherUsersTyping.length;

    if (count === 1) {
      return `${otherUsersTyping[0].userName} is typing`;
    } else if (count === 2) {
      return `${otherUsersTyping[0].userName} and ${otherUsersTyping[1].userName} are typing`;
    } else if (count === 3) {
      return `${otherUsersTyping[0].userName}, ${otherUsersTyping[1].userName} and ${otherUsersTyping[2].userName} are typing`;
    } else {
      return `${otherUsersTyping[0].userName}, ${otherUsersTyping[1].userName} and ${
        count - 2
      } others are typing`;
    }
  };

  const getDotOpacity = (animValue: Animated.Value) => {
    return animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });
  };

  const getDotScale = (animValue: Animated.Value) => {
    return animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.2],
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: getDotOpacity(dot1Anim),
                transform: [{ scale: getDotScale(dot1Anim) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: getDotOpacity(dot2Anim),
                transform: [{ scale: getDotScale(dot2Anim) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: getDotOpacity(dot3Anim),
                transform: [{ scale: getDotScale(dot3Anim) }],
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.typingText}>{getTypingText()}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubble: {
    backgroundColor: '#E5E5EA',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    maxWidth: width * 0.6,
  },
});

export default TypingIndicator;
