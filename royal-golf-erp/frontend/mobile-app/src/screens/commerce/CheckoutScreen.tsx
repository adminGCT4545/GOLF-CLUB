import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { processPayment, clearCart } from '../../store/slices/commerceSlice';
import OrderSummary from '../../components/commerce/OrderSummary';
import { PaymentMethod, Address } from '../../types/commerce';

interface CheckoutScreenProps {
  navigation: any;
  route: any;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { cart, loading, error, appliedPromoCode, loyaltyProgram } = useSelector(
    (state: RootState) => state.commerce
  );

  const { pointsToUse = 0 } = route.params || {};

  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [memberDiscount, setMemberDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
    fetchAddresses();
    calculateMemberDiscount();
    calculateDeliveryFee();
  }, []);

  useEffect(() => {
    calculateDeliveryFee();
  }, [deliveryType, selectedAddress]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
        const defaultMethod = methods.find((m: PaymentMethod) => m.isDefault);
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const addressList = await response.json();
        setAddresses(addressList);
        const defaultAddress = addressList.find((a: Address) => a.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const calculateMemberDiscount = () => {
    // In a real app, this would come from member tier/status
    setMemberDiscount(10); // 10% member discount
  };

  const calculateDeliveryFee = () => {
    if (deliveryType === 'pickup') {
      setDeliveryFee(0);
    } else {
      // Calculate delivery fee based on distance, order value, etc.
      const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
      if (subtotal >= 100) {
        setDeliveryFee(0); // Free delivery over $100
      } else {
        setDeliveryFee(9.99);
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Required', 'Please select a payment method.');
      return;
    }

    if (deliveryType === 'delivery' && !selectedAddress) {
      Alert.alert('Address Required', 'Please select a delivery address.');
      return;
    }

    const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
    const memberDiscountAmount = subtotal * (memberDiscount / 100);
    const promoDiscountAmount = appliedPromoCode
      ? appliedPromoCode.discountType === 'percentage'
        ? subtotal * (appliedPromoCode.discountValue / 100)
        : appliedPromoCode.discountValue
      : 0;
    const pointsDiscountAmount = loyaltyProgram ? pointsToUse / loyaltyProgram.redemptionRate : 0;
    const tax =
      (subtotal - memberDiscountAmount - promoDiscountAmount - pointsDiscountAmount) * 0.08;
    const total =
      subtotal -
      memberDiscountAmount -
      promoDiscountAmount -
      pointsDiscountAmount +
      tax +
      deliveryFee;

    try {
      const result = await dispatch(
        processPayment({
          paymentMethodId: selectedPaymentMethod.id,
          amount: total,
          currency: 'USD',
          usePoints: pointsToUse,
        }) as any
      );

      if (result.type.endsWith('/fulfilled')) {
        Alert.alert(
          'Order Placed Successfully!',
          `Your order #${result.payload.order.orderNumber} has been placed.`,
          [
            {
              text: 'View Order',
              onPress: () => {
                navigation.navigate('OrderHistory');
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Payment Failed', 'Please try again or use a different payment method.');
    }
  };

  const renderDeliveryOption = (
    type: 'pickup' | 'delivery',
    title: string,
    subtitle: string,
    icon: string
  ) => (
    <TouchableOpacity
      style={[styles.deliveryOption, deliveryType === type && styles.selectedDeliveryOption]}
      onPress={() => setDeliveryType(type)}>
      <Icon name={icon} size={24} color={deliveryType === type ? '#2E7D32' : '#666'} />
      <View style={styles.deliveryOptionContent}>
        <Text
          style={[
            styles.deliveryOptionTitle,
            deliveryType === type && styles.selectedDeliveryOptionText,
          ]}>
          {title}
        </Text>
        <Text style={styles.deliveryOptionSubtitle}>{subtitle}</Text>
      </View>
      <Icon
        name={deliveryType === type ? 'radio-button-checked' : 'radio-button-unchecked'}
        size={20}
        color={deliveryType === type ? '#2E7D32' : '#666'}
      />
    </TouchableOpacity>
  );

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethod,
        selectedPaymentMethod?.id === method.id && styles.selectedPaymentMethod,
      ]}
      onPress={() => setSelectedPaymentMethod(method)}>
      <Icon
        name={
          method.type === 'card'
            ? 'credit-card'
            : method.type === 'member-account'
            ? 'account-balance'
            : method.type === 'digital-wallet'
            ? 'account-balance-wallet'
            : 'payment'
        }
        size={24}
        color={selectedPaymentMethod?.id === method.id ? '#2E7D32' : '#666'}
      />
      <View style={styles.paymentMethodContent}>
        <Text
          style={[
            styles.paymentMethodTitle,
            selectedPaymentMethod?.id === method.id && styles.selectedPaymentMethodText,
          ]}>
          {method.type === 'card'
            ? `${method.cardType} •••• ${method.cardLast4}`
            : method.type === 'member-account'
            ? 'Member Account'
            : method.type === 'digital-wallet'
            ? 'Digital Wallet'
            : 'Cash Payment'}
        </Text>
        {method.nickname && <Text style={styles.paymentMethodSubtitle}>{method.nickname}</Text>}
      </View>
      <Icon
        name={
          selectedPaymentMethod?.id === method.id
            ? 'radio-button-checked'
            : 'radio-button-unchecked'
        }
        size={20}
        color={selectedPaymentMethod?.id === method.id ? '#2E7D32' : '#666'}
      />
    </TouchableOpacity>
  );

  const renderAddress = (address: Address) => (
    <TouchableOpacity
      key={address.id}
      style={[styles.addressOption, selectedAddress?.id === address.id && styles.selectedAddress]}
      onPress={() => setSelectedAddress(address)}>
      <Icon
        name="location-on"
        size={24}
        color={selectedAddress?.id === address.id ? '#2E7D32' : '#666'}
      />
      <View style={styles.addressContent}>
        <Text
          style={[
            styles.addressTitle,
            selectedAddress?.id === address.id && styles.selectedAddressText,
          ]}>
          {address.street}
        </Text>
        <Text style={styles.addressSubtitle}>
          {address.city}, {address.state} {address.zipCode}
        </Text>
      </View>
      <Icon
        name={
          selectedAddress?.id === address.id ? 'radio-button-checked' : 'radio-button-unchecked'
        }
        size={20}
        color={selectedAddress?.id === address.id ? '#2E7D32' : '#666'}
      />
    </TouchableOpacity>
  );

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.backToShopButton}
            onPress={() => navigation.navigate('ProShop')}>
            <Text style={styles.backToShopText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Delivery Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          {renderDeliveryOption('pickup', 'Store Pickup', 'Free • Ready in 2-4 hours', 'store')}
          {renderDeliveryOption(
            'delivery',
            'Home Delivery',
            deliveryFee > 0
              ? `$${deliveryFee.toFixed(2)} • 1-2 business days`
              : 'Free • 1-2 business days',
            'local-shipping'
          )}
        </View>

        {/* Delivery Address (if delivery selected) */}
        {deliveryType === 'delivery' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(true)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
            {selectedAddress ? (
              <View style={styles.selectedAddressContainer}>
                <Icon name="location-on" size={20} color="#2E7D32" />
                <View style={styles.selectedAddressContent}>
                  <Text style={styles.selectedAddressTitle}>{selectedAddress.street}</Text>
                  <Text style={styles.selectedAddressSubtitle}>
                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => setShowAddressModal(true)}>
                <Icon name="add" size={20} color="#2E7D32" />
                <Text style={styles.addAddressText}>Add Delivery Address</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(true)}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
          {selectedPaymentMethod ? (
            <View style={styles.selectedPaymentContainer}>
              <Icon
                name={
                  selectedPaymentMethod.type === 'card'
                    ? 'credit-card'
                    : selectedPaymentMethod.type === 'member-account'
                    ? 'account-balance'
                    : selectedPaymentMethod.type === 'digital-wallet'
                    ? 'account-balance-wallet'
                    : 'payment'
                }
                size={20}
                color="#2E7D32"
              />
              <View style={styles.selectedPaymentContent}>
                <Text style={styles.selectedPaymentTitle}>
                  {selectedPaymentMethod.type === 'card'
                    ? `${selectedPaymentMethod.cardType} •••• ${selectedPaymentMethod.cardLast4}`
                    : selectedPaymentMethod.type === 'member-account'
                    ? 'Member Account'
                    : selectedPaymentMethod.type === 'digital-wallet'
                    ? 'Digital Wallet'
                    : 'Cash Payment'}
                </Text>
                {selectedPaymentMethod.nickname && (
                  <Text style={styles.selectedPaymentSubtitle}>
                    {selectedPaymentMethod.nickname}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPaymentButton}
              onPress={() => setShowPaymentModal(true)}>
              <Icon name="add" size={20} color="#2E7D32" />
              <Text style={styles.addPaymentText}>Add Payment Method</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Any special requests or delivery instructions..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary */}
        <OrderSummary
          items={cart}
          promoCode={appliedPromoCode}
          loyaltyProgram={loyaltyProgram}
          pointsToUse={pointsToUse}
          memberDiscount={memberDiscount}
          deliveryFee={deliveryFee}
          showDelivery
          showTax
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!selectedPaymentMethod || (deliveryType === 'delivery' && !selectedAddress)) &&
              styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={
            loading.payment ||
            !selectedPaymentMethod ||
            (deliveryType === 'delivery' && !selectedAddress)
          }>
          {loading.payment ? (
            <Text style={styles.placeOrderButtonText}>Processing...</Text>
          ) : (
            <>
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
              <Icon name="check" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Methods Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Payment Methods</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {paymentMethods.map(renderPaymentMethod)}

            <TouchableOpacity style={styles.addNewButton}>
              <Icon name="add" size={20} color="#2E7D32" />
              <Text style={styles.addNewText}>Add New Payment Method</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Address Modal */}
      <Modal visible={showAddressModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {addresses.map(renderAddress)}

            <TouchableOpacity style={styles.addNewButton}>
              <Icon name="add" size={20} color="#2E7D32" />
              <Text style={styles.addNewText}>Add New Address</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  changeText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedDeliveryOption: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },
  deliveryOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  selectedDeliveryOptionText: {
    color: '#2E7D32',
  },
  deliveryOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  selectedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  selectedAddressContent: {
    flex: 1,
    marginLeft: 8,
  },
  selectedAddressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  selectedAddressSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addAddressText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  selectedPaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  selectedPaymentContent: {
    flex: 1,
    marginLeft: 8,
  },
  selectedPaymentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  selectedPaymentSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addPaymentText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  bottomSpacing: {
    height: 20,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  placeOrderButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  placeOrderButtonText: {
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
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  backToShopButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backToShopText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
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
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  doneText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedPaymentMethod: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },
  paymentMethodContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  selectedPaymentMethodText: {
    color: '#2E7D32',
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedAddress: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },
  addressContent: {
    flex: 1,
    marginLeft: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  selectedAddressText: {
    color: '#2E7D32',
  },
  addressSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addNewText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
});

export default CheckoutScreen;
