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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  updateOrderItem,
  removeFromOrder,
  clearCurrentOrder,
  submitOrder,
  setOrderSettings,
} from '../../store/slices/fnbSlice';
import { FnBOrderItem } from '../../types/commerce';

interface OrderScreenProps {
  navigation: any;
}

const OrderScreen: React.FC<OrderScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currentOrder, loading, error, orderSettings } = useSelector(
    (state: RootState) => state.fnb
  );

  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState(
    orderSettings.specialInstructions || ''
  );
  const [selectedTable, setSelectedTable] = useState(orderSettings.tableNumber || '');
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

  const handleUpdateQuantity = (itemId: string, quantity: number, customizations?: string[]) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      dispatch(updateOrderItem({ itemId, quantity, customizations }) as any);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item from your order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => dispatch(removeFromOrder(itemId) as any),
      },
    ]);
  };

  const handleClearOrder = () => {
    Alert.alert('Clear Order', 'Are you sure you want to remove all items from your order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => dispatch(clearCurrentOrder()),
      },
    ]);
  };

  const handleSubmitOrder = () => {
    if (currentOrder.length === 0) {
      Alert.alert('Empty Order', 'Please add items to your order before submitting.');
      return;
    }

    if (orderSettings.orderType === 'dine-in' && !selectedTable) {
      Alert.alert('Table Required', 'Please select a table for dine-in orders.');
      return;
    }

    dispatch(
      submitOrder({
        items: currentOrder,
        orderType: orderSettings.orderType,
        scheduledTime: scheduledTime || undefined,
        tableNumber: selectedTable || undefined,
        specialInstructions: specialInstructions || undefined,
        paymentMethodId: 'default', // In real app, get from payment selection
      }) as any
    )
      .then((result: any) => {
        if (result.type.endsWith('/fulfilled')) {
          Alert.alert(
            'Order Submitted!',
            `Your order has been submitted successfully. Estimated time: ${result.payload.estimatedTime} minutes.`,
            [
              {
                text: 'Track Order',
                onPress: () => navigation.navigate('OrderHistory'),
              },
            ]
          );
        }
      })
      .catch(() => {
        Alert.alert('Order Failed', 'Please try again.');
      });
  };

  const handleOrderTypeChange = (type: 'dine-in' | 'takeaway' | 'delivery') => {
    dispatch(setOrderSettings({ orderType: type }));
    setShowOrderTypeModal(false);
  };

  const calculateSubtotal = () => {
    return currentOrder.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderItem = ({ item }: { item: FnBOrderItem }) => (
    <View style={styles.orderItemCard}>
      <View style={styles.orderItemHeader}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.menuItem.name}
        </Text>
        <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeButton}>
          <Icon name="close" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Portion Size */}
      {item.portionSize && <Text style={styles.itemDetail}>Size: {item.portionSize}</Text>}

      {/* Customizations */}
      {item.customizations.length > 0 && (
        <View style={styles.customizationsContainer}>
          <Text style={styles.customizationsLabel}>Customizations:</Text>
          {item.customizations.map((customization, index) => (
            <Text key={index} style={styles.customizationText}>
              • {customization}
            </Text>
          ))}
        </View>
      )}

      {/* Special Instructions */}
      {item.specialInstructions && (
        <Text style={styles.itemDetail}>Note: {item.specialInstructions}</Text>
      )}

      <View style={styles.orderItemFooter}>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)} each</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
            disabled={item.quantity <= 1}>
            <Icon name="remove" size={16} color={item.quantity <= 1 ? '#CCC' : '#666'} />
          </TouchableOpacity>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            style={styles.quantityButton}>
            <Icon name="add" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.itemTotal}>Total: ${(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  );

  const renderEmptyOrder = () => (
    <View style={styles.emptyContainer}>
      <Icon name="restaurant-menu" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Your order is empty</Text>
      <Text style={styles.emptySubtitle}>Browse our menu and add items to your order</Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('FnBMenu')}>
        <Text style={styles.browseButtonText}>Browse Menu</Text>
      </TouchableOpacity>
    </View>
  );

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  if (currentOrder.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Order</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        {renderEmptyOrder()}
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
        <Text style={styles.headerTitle}>Your Order ({currentOrder.length} items)</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearOrder}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Type</Text>
          <TouchableOpacity
            style={styles.orderTypeSelector}
            onPress={() => setShowOrderTypeModal(true)}>
            <View style={styles.orderTypeInfo}>
              <Icon
                name={
                  orderSettings.orderType === 'dine-in'
                    ? 'restaurant'
                    : orderSettings.orderType === 'takeaway'
                    ? 'shopping-bag'
                    : 'local-shipping'
                }
                size={20}
                color="#FF6B35"
              />
              <Text style={styles.orderTypeText}>
                {orderSettings.orderType === 'dine-in'
                  ? 'Dine In'
                  : orderSettings.orderType === 'takeaway'
                  ? 'Takeaway'
                  : 'Delivery'}
              </Text>
            </View>
            <Icon name="keyboard-arrow-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Table Selection (for dine-in) */}
        {orderSettings.orderType === 'dine-in' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Table Number</Text>
            <TextInput
              style={styles.textInput}
              value={selectedTable}
              onChangeText={setSelectedTable}
              placeholder="Enter table number"
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Order Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timing</Text>
          <View style={styles.timingOptions}>
            <TouchableOpacity
              style={[styles.timingOption, !scheduledTime && styles.selectedTimingOption]}
              onPress={() => setScheduledTime(null)}>
              <Icon name="access-time" size={16} color={!scheduledTime ? '#FF6B35' : '#666'} />
              <Text
                style={[
                  styles.timingOptionText,
                  !scheduledTime && styles.selectedTimingOptionText,
                ]}>
                ASAP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timingOption, scheduledTime && styles.selectedTimingOption]}
              onPress={() => setShowScheduleModal(true)}>
              <Icon name="schedule" size={16} color={scheduledTime ? '#FF6B35' : '#666'} />
              <Text
                style={[styles.timingOptionText, scheduledTime && styles.selectedTimingOptionText]}>
                {scheduledTime ? formatTime(scheduledTime) : 'Schedule'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <FlatList
            data={currentOrder}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Any special requests for your order..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (8%)</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Continue browsing */}
        <TouchableOpacity
          style={styles.continueShoppingButton}
          onPress={() => navigation.navigate('FnBMenu')}>
          <Icon name="add" size={16} color="#FF6B35" />
          <Text style={styles.continueShoppingText}>Add More Items</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitOrder}
          disabled={loading.order}>
          {loading.order ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <>
              <Icon name="restaurant" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Order - ${total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Order Type Modal */}
      <Modal visible={showOrderTypeModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowOrderTypeModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Order Type</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.orderTypeOption}
              onPress={() => handleOrderTypeChange('dine-in')}>
              <Icon name="restaurant" size={24} color="#FF6B35" />
              <View style={styles.orderTypeOptionContent}>
                <Text style={styles.orderTypeOptionTitle}>Dine In</Text>
                <Text style={styles.orderTypeOptionSubtitle}>
                  Enjoy your meal at the restaurant
                </Text>
              </View>
              <Icon
                name={
                  orderSettings.orderType === 'dine-in'
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={20}
                color="#FF6B35"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orderTypeOption}
              onPress={() => handleOrderTypeChange('takeaway')}>
              <Icon name="shopping-bag" size={24} color="#FF6B35" />
              <View style={styles.orderTypeOptionContent}>
                <Text style={styles.orderTypeOptionTitle}>Takeaway</Text>
                <Text style={styles.orderTypeOptionSubtitle}>Pick up your order</Text>
              </View>
              <Icon
                name={
                  orderSettings.orderType === 'takeaway'
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={20}
                color="#FF6B35"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orderTypeOption}
              onPress={() => handleOrderTypeChange('delivery')}>
              <Icon name="local-shipping" size={24} color="#FF6B35" />
              <View style={styles.orderTypeOptionContent}>
                <Text style={styles.orderTypeOptionTitle}>Delivery</Text>
                <Text style={styles.orderTypeOptionSubtitle}>Get your order delivered</Text>
              </View>
              <Icon
                name={
                  orderSettings.orderType === 'delivery'
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={20}
                color="#FF6B35"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Error Message */}
      {error.order && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.order}</Text>
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
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  orderTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  orderTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTypeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  timingOptions: {
    flexDirection: 'row',
  },
  timingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginRight: 8,
  },
  selectedTimingOption: {
    backgroundColor: '#FF6B35',
  },
  timingOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedTimingOptionText: {
    color: '#FFFFFF',
  },
  orderItemCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  customizationsContainer: {
    marginVertical: 4,
  },
  customizationsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  customizationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  orderItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    margin: 2,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 4,
    textAlign: 'right',
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
  summarySection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  continueShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  continueShoppingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
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
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  browseButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  browseButtonText: {
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
  modalPlaceholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  orderTypeOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  orderTypeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  orderTypeOptionSubtitle: {
    fontSize: 14,
    color: '#666',
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

export default OrderScreen;
