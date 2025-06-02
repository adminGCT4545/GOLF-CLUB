import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  updateCartItem,
  removeFromCart,
  clearCart,
  applyPromoCode,
  clearPromoCode,
} from '../../store/slices/commerceSlice';
import CartItem from '../../components/commerce/CartItem';
import OrderSummary from '../../components/commerce/OrderSummary';
import { CartItem as CartItemType } from '../../types/commerce';

interface ShoppingCartScreenProps {
  navigation: any;
}

const ShoppingCartScreen: React.FC<ShoppingCartScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { cart, loading, error, appliedPromoCode, loyaltyProgram } = useSelector(
    (state: RootState) => state.commerce
  );

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    dispatch(updateCartItem({ itemId, quantity }) as any);
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => dispatch(removeFromCart(itemId) as any),
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => dispatch(clearCart()),
      },
    ]);
  };

  const handleApplyPromoCode = () => {
    if (promoCodeInput.trim()) {
      dispatch(applyPromoCode(promoCodeInput.trim()) as any)
        .then(() => {
          setShowPromoModal(false);
          setPromoCodeInput('');
        })
        .catch((error: any) => {
          Alert.alert('Invalid Code', error.message || 'The promo code is not valid.');
        });
    }
  };

  const handleRemovePromoCode = () => {
    dispatch(clearPromoCode());
  };

  const handleTogglePoints = () => {
    if (usePoints) {
      setUsePoints(false);
      setPointsToUse(0);
    } else {
      setUsePoints(true);
      // Calculate maximum points that can be used
      const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
      if (loyaltyProgram) {
        const maxPoints = Math.min(
          loyaltyProgram.points,
          Math.floor(subtotal * loyaltyProgram.redemptionRate)
        );
        setPointsToUse(maxPoints);
      }
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding to checkout.');
      return;
    }

    // Check stock availability
    const outOfStockItems = cart.filter((item) => !item.product.inStock);
    if (outOfStockItems.length > 0) {
      Alert.alert(
        'Out of Stock Items',
        'Some items in your cart are out of stock. Please remove them before proceeding.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    navigation.navigate('Checkout', {
      pointsToUse: usePoints ? pointsToUse : 0,
    });
  };

  const handleContinueShopping = () => {
    navigation.navigate('ProShop');
  };

  const handleItemPress = (item: CartItemType) => {
    navigation.navigate('ProductDetails', { productId: item.product.id });
  };

  const renderCartItem = ({ item }: { item: CartItemType }) => (
    <CartItem
      item={item}
      onUpdateQuantity={handleUpdateQuantity}
      onRemove={handleRemoveItem}
      onPress={handleItemPress}
    />
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Icon name="shopping-cart" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>Browse our products and add items to your cart</Text>
      <TouchableOpacity style={styles.shopButton} onPress={handleContinueShopping}>
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        {renderEmptyCart()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Cart Items */}
        <FlatList
          data={cart}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cartList}
          ListFooterComponent={() => (
            <View style={styles.footerContainer}>
              {/* Order Summary */}
              <OrderSummary
                items={cart}
                promoCode={appliedPromoCode}
                loyaltyProgram={loyaltyProgram}
                pointsToUse={usePoints ? pointsToUse : 0}
                onApplyPromoCode={() => setShowPromoModal(true)}
                onRemovePromoCode={handleRemovePromoCode}
                onTogglePoints={handleTogglePoints}
              />

              {/* Continue Shopping Button */}
              <TouchableOpacity
                style={styles.continueShoppingButton}
                onPress={handleContinueShopping}>
                <Icon name="arrow-back" size={16} color="#2E7D32" />
                <Text style={styles.continueShoppingText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleProceedToCheckout}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Icon name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Promo Code Modal */}
      <Modal visible={showPromoModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.promoModal}>
          <View style={styles.promoHeader}>
            <TouchableOpacity onPress={() => setShowPromoModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.promoTitle}>Add Promo Code</Text>
            <TouchableOpacity onPress={handleApplyPromoCode}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.promoContent}>
            <Text style={styles.promoLabel}>Enter your promo code</Text>
            <TextInput
              style={styles.promoInput}
              value={promoCodeInput}
              onChangeText={setPromoCodeInput}
              placeholder="PROMO CODE"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.promoHints}>
              <Text style={styles.promoHintTitle}>Available Offers:</Text>
              <View style={styles.promoHint}>
                <Icon name="local-offer" size={16} color="#FF6B35" />
                <Text style={styles.promoHintText}>MEMBER20 - 20% off for members</Text>
              </View>
              <View style={styles.promoHint}>
                <Icon name="local-shipping" size={16} color="#2E7D32" />
                <Text style={styles.promoHintText}>
                  FREESHIP - Free shipping on orders over $100
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Loading Overlay */}
      {loading.cart && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Updating cart...</Text>
        </View>
      )}

      {/* Error Message */}
      {error.cart && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.cart}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  cartList: {
    padding: 16,
  },
  footerContainer: {
    marginTop: 16,
  },
  continueShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  continueShoppingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkoutButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Promo Modal Styles
  promoModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  applyText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  promoContent: {
    padding: 16,
  },
  promoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  promoInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  promoHints: {
    marginTop: 16,
  },
  promoHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  promoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  promoHintText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },

  // Loading and Error Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ShoppingCartScreen;
