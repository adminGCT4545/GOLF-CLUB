import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CartItem, PromoCode, LoyaltyProgram } from '../../types/commerce';

interface OrderSummaryProps {
  items: CartItem[];
  promoCode?: PromoCode | null;
  loyaltyProgram?: LoyaltyProgram | null;
  pointsToUse?: number;
  memberDiscount?: number;
  deliveryFee?: number;
  onApplyPromoCode?: () => void;
  onRemovePromoCode?: () => void;
  onTogglePoints?: () => void;
  showDelivery?: boolean;
  showTax?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  promoCode,
  loyaltyProgram,
  pointsToUse = 0,
  memberDiscount = 0,
  deliveryFee = 0,
  onApplyPromoCode,
  onRemovePromoCode,
  onTogglePoints,
  showDelivery = true,
  showTax = true,
}) => {
  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const calculateMemberDiscount = () => {
    if (memberDiscount > 0) {
      return calculateSubtotal() * (memberDiscount / 100);
    }
    return 0;
  };

  const calculatePromoDiscount = () => {
    if (!promoCode) {
      return 0;
    }

    const subtotal = calculateSubtotal();
    const afterMemberDiscount = subtotal - calculateMemberDiscount();

    if (promoCode.discountType === 'percentage') {
      return afterMemberDiscount * (promoCode.discountValue / 100);
    } else {
      return Math.min(promoCode.discountValue, afterMemberDiscount);
    }
  };

  const calculatePointsDiscount = () => {
    if (!loyaltyProgram || pointsToUse <= 0) {
      return 0;
    }
    return pointsToUse / loyaltyProgram.redemptionRate;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const memberDiscountAmount = calculateMemberDiscount();
    const promoDiscountAmount = calculatePromoDiscount();
    const pointsDiscountAmount = calculatePointsDiscount();

    const taxableAmount =
      subtotal - memberDiscountAmount - promoDiscountAmount - pointsDiscountAmount;
    return Math.max(0, taxableAmount * 0.08); // 8% tax
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const memberDiscountAmount = calculateMemberDiscount();
    const promoDiscountAmount = calculatePromoDiscount();
    const pointsDiscountAmount = calculatePointsDiscount();
    const tax = showTax ? calculateTax() : 0;
    const delivery = showDelivery ? deliveryFee : 0;

    return (
      subtotal - memberDiscountAmount - promoDiscountAmount - pointsDiscountAmount + tax + delivery
    );
  };

  const calculatePointsEarned = () => {
    if (!loyaltyProgram) {
      return 0;
    }
    const total = calculateTotal();
    return Math.floor(total * loyaltyProgram.earnRate);
  };

  const subtotal = calculateSubtotal();
  const memberDiscountAmount = calculateMemberDiscount();
  const promoDiscountAmount = calculatePromoDiscount();
  const pointsDiscountAmount = calculatePointsDiscount();
  const tax = showTax ? calculateTax() : 0;
  const total = calculateTotal();
  const pointsEarned = calculatePointsEarned();

  const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>

      {/* Items breakdown */}
      <View style={styles.section}>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.product.name} × {item.quantity}
            </Text>
            <Text style={styles.itemPrice}>{formatPrice(item.product.price * item.quantity)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Pricing breakdown */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Subtotal</Text>
          <Text style={styles.value}>{formatPrice(subtotal)}</Text>
        </View>

        {/* Member discount */}
        {memberDiscount > 0 && (
          <View style={styles.row}>
            <Text style={[styles.label, styles.discountLabel]}>
              Member Discount ({memberDiscount}%)
            </Text>
            <Text style={[styles.value, styles.discountValue]}>
              -{formatPrice(memberDiscountAmount)}
            </Text>
          </View>
        )}

        {/* Promo code discount */}
        {promoCode && (
          <View style={styles.discountRow}>
            <View style={styles.promoInfo}>
              <Text style={[styles.label, styles.discountLabel]}>Promo Code: {promoCode.code}</Text>
              {onRemovePromoCode && (
                <TouchableOpacity onPress={onRemovePromoCode}>
                  <Icon name="close" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.value, styles.discountValue]}>
              -{formatPrice(promoDiscountAmount)}
            </Text>
          </View>
        )}

        {/* Loyalty points */}
        {loyaltyProgram && (
          <View style={styles.pointsSection}>
            <View style={styles.pointsHeader}>
              <Text style={styles.pointsTitle}>
                Loyalty Points ({loyaltyProgram.points} available)
              </Text>
              {onTogglePoints && (
                <TouchableOpacity onPress={onTogglePoints}>
                  <Text style={styles.togglePointsText}>
                    {pointsToUse > 0 ? 'Remove' : 'Use Points'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {pointsToUse > 0 && (
              <View style={styles.row}>
                <Text style={[styles.label, styles.discountLabel]}>Points Used: {pointsToUse}</Text>
                <Text style={[styles.value, styles.discountValue]}>
                  -{formatPrice(pointsDiscountAmount)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Delivery fee */}
        {showDelivery && deliveryFee > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>{formatPrice(deliveryFee)}</Text>
          </View>
        )}

        {/* Tax */}
        {showTax && (
          <View style={styles.row}>
            <Text style={styles.label}>Tax (8%)</Text>
            <Text style={styles.value}>{formatPrice(tax)}</Text>
          </View>
        )}
      </View>

      {/* Promo code input */}
      {!promoCode && onApplyPromoCode && (
        <TouchableOpacity style={styles.promoButton} onPress={onApplyPromoCode}>
          <Icon name="local-offer" size={16} color="#2E7D32" />
          <Text style={styles.promoButtonText}>Add Promo Code</Text>
        </TouchableOpacity>
      )}

      <View style={styles.totalDivider} />

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>

      {/* Points to be earned */}
      {loyaltyProgram && pointsEarned > 0 && (
        <View style={styles.pointsEarnedContainer}>
          <Icon name="stars" size={16} color="#FF6B35" />
          <Text style={styles.pointsEarnedText}>
            You'll earn {pointsEarned} points with this order
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  section: {
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discountLabel: {
    color: '#2E7D32',
  },
  discountValue: {
    color: '#2E7D32',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  promoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pointsSection: {
    marginVertical: 8,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointsTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  togglePointsText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    marginVertical: 8,
  },
  promoButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  totalDivider: {
    height: 2,
    backgroundColor: '#2E7D32',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  pointsEarnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  pointsEarnedText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
});

export default OrderSummary;
