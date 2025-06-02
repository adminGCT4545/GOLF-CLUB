import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  editable?: boolean;
  showText?: boolean;
  reviewCount?: number;
  onRatingChange?: (rating: number) => void;
}

const Rating: React.FC<RatingProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  color = '#FFD700',
  editable = false,
  showText = false,
  reviewCount,
  onRatingChange,
}) => {
  const handleStarPress = (selectedRating: number) => {
    if (editable && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      const isHalfStar = rating >= i - 0.5 && rating < i;
      const isFullStar = rating >= i;

      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          disabled={!editable}
          style={styles.starContainer}>
          <Icon
            name={isFullStar ? 'star' : isHalfStar ? 'star-half' : 'star-border'}
            size={size}
            color={isFullStar || isHalfStar ? color : '#E0E0E0'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>{renderStars()}</View>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          {reviewCount !== undefined && (
            <Text style={styles.reviewCountText}>
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 2,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  reviewCountText: {
    fontSize: 12,
    color: '#666',
  },
});

export default Rating;
