import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: 'small' | 'medium' | 'large';
  showDiscount?: boolean;
  memberDiscount?: number;
  loyaltyPoints?: number;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  currency = '$',
  size = 'medium',
  showDiscount = false,
  memberDiscount,
  loyaltyPoints,
}) => {
  const formatPrice = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  const calculateDiscountPercentage = () => {
    if (originalPrice && originalPrice > price) {
      return Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    return 0;
  };

  const getMemberPrice = () => {
    if (memberDiscount) {
      return price * (1 - memberDiscount / 100);
    }
    return price;
  };

  const discountPercentage = calculateDiscountPercentage();
  const memberPrice = getMemberPrice();

  const sizeStyles = {
    small: {
      priceText: { fontSize: 14, fontWeight: '600' as const },
      originalPriceText: { fontSize: 12 },
      discountText: { fontSize: 10 },
      pointsText: { fontSize: 10 },
    },
    medium: {
      priceText: { fontSize: 18, fontWeight: '700' as const },
      originalPriceText: { fontSize: 14 },
      discountText: { fontSize: 12 },
      pointsText: { fontSize: 12 },
    },
    large: {
      priceText: { fontSize: 24, fontWeight: '700' as const },
      originalPriceText: { fontSize: 18 },
      discountText: { fontSize: 14 },
      pointsText: { fontSize: 14 },
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.pricesContainer}>
        <Text style={[styles.priceText, sizeStyles[size].priceText]}>{formatPrice(price)}</Text>

        {originalPrice && originalPrice > price && (
          <Text style={[styles.originalPriceText, sizeStyles[size].originalPriceText]}>
            {formatPrice(originalPrice)}
          </Text>
        )}

        {showDiscount && discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={[styles.discountText, sizeStyles[size].discountText]}>
              -{discountPercentage}%
            </Text>
          </View>
        )}
      </View>

      {memberDiscount && memberDiscount > 0 && (
        <View style={styles.memberPriceContainer}>
          <Text style={styles.memberLabel}>Member Price:</Text>
          <Text style={[styles.memberPriceText, sizeStyles[size].priceText]}>
            {formatPrice(memberPrice)}
          </Text>
          <Text style={[styles.memberDiscountText, sizeStyles[size].discountText]}>
            ({memberDiscount}% off)
          </Text>
        </View>
      )}

      {loyaltyPoints && loyaltyPoints > 0 && (
        <View style={styles.pointsContainer}>
          <Text style={[styles.pointsText, sizeStyles[size].pointsText]}>
            Earn {loyaltyPoints} points
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  pricesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priceText: {
    color: '#2E7D32',
    marginRight: 8,
  },
  originalPriceText: {
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  memberPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  memberLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  memberPriceText: {
    color: '#1976D2',
    marginRight: 4,
  },
  memberDiscountText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  pointsContainer: {
    marginTop: 4,
  },
  pointsText: {
    color: '#FF6B35',
    fontWeight: '500',
  },
});

export default PriceDisplay;
