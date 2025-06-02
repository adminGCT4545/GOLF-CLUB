import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchTabDetails,
  removeFromTab,
  makeTabPayment,
} from '../../store/slices/fnbSlice';

interface TabDetailsScreenProps {
  navigation: any;
  route: any;
}

const TabDetailsScreen: React.FC<TabDetailsScreenProps> = ({ navigation, route }) => {
  const { tabId } = route.params;
  const dispatch = useDispatch();
  const { 
    currentTab, 
    currentTabItems, 
    tabPayments, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.fnb);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRemoveItemModal, setShowRemoveItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadTabDetails();
  }, [tabId]);

  const loadTabDetails = async () => {
    try {
      await dispatch(fetchTabDetails(tabId) as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tab details');
    }
  };

  const handleRemoveItem = (item: any) => {
    setSelectedItem(item);
    setShowRemoveItemModal(true);
  };

  const confirmRemoveItem = async () => {
    if (!selectedItem || !currentTab) return;

    try {
      await dispatch(removeFromTab({
        tabId: currentTab.id,
        itemId: selectedItem.id,
      }) as any);
      
      setShowRemoveItemModal(false);
      setSelectedItem(null);
      await loadTabDetails(); // Refresh tab details
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item from tab');
    }
  };

  const handlePayment = (paymentMethod: string) => {
    if (!currentTab) return;

    const totalPaid = tabPayments.reduce((sum, payment) => sum + payment.payment_amount, 0);
    const balance = currentTab.total_amount - totalPaid;

    if (balance <= 0) {
      Alert.alert('Info', 'This tab is already fully paid');
      return;
    }

    processPayment(paymentMethod, balance);
  };

  const processPayment = async (paymentMethod: string, amount: number) => {
    if (!currentTab) return;

    try {
      await dispatch(makeTabPayment({
        tabId: currentTab.id,
        paymentAmount: amount,
        paymentMethod: paymentMethod as any,
      }) as any);
      
      setShowPaymentModal(false);
      Alert.alert('Success', 'Payment processed successfully');
      await loadTabDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const renderTabItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.product_name}</Text>
          <Text style={styles.itemSku}>SKU: {item.sku}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item)}
        >
          <Icon name="remove-circle-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.quantityPrice}>
          <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          <Text style={styles.unitPrice}>${item.unit_price.toFixed(2)} each</Text>
        </View>
        <Text style={styles.totalPrice}>${item.total_price.toFixed(2)}</Text>
      </View>
      
      {item.notes && (
        <Text style={styles.itemNotes}>Notes: {item.notes}</Text>
      )}
      
      <Text style={styles.itemTime}>
        Added: {new Date(item.added_at).toLocaleString()}
      </Text>
    </View>
  );

  const renderPayment = ({ item }: { item: any }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View>
          <Text style={styles.paymentMethod}>
            {item.payment_method.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={styles.paymentDate}>
            {new Date(item.processed_at).toLocaleString()}
          </Text>
        </View>
        <Text style={styles.paymentAmount}>
          ${item.payment_amount.toFixed(2)}
        </Text>
      </View>
      {item.payment_reference && (
        <Text style={styles.paymentReference}>
          Ref: {item.payment_reference}
        </Text>
      )}
    </View>
  );

  const renderPaymentModal = () => {
    if (!currentTab) return null;

    const totalPaid = tabPayments.reduce((sum, payment) => sum + payment.payment_amount, 0);
    const balance = currentTab.total_amount - totalPaid;

    return (
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.paymentSummary}>
                <Text style={styles.summaryTitle}>Payment Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                  <Text style={styles.summaryValue}>${currentTab.total_amount.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Paid:</Text>
                  <Text style={styles.summaryValue}>${totalPaid.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Balance Due:</Text>
                  <Text style={styles.summaryTotalValue}>${balance.toFixed(2)}</Text>
                </View>
              </View>
              
              <View style={styles.paymentMethods}>
                <TouchableOpacity 
                  style={styles.paymentOption}
                  onPress={() => handlePayment('member_account')}
                >
                  <Icon name="account-balance" size={24} color="#FF6B35" />
                  <Text style={styles.paymentOptionText}>Member Account</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.paymentOption}
                  onPress={() => handlePayment('credit_card')}
                >
                  <Icon name="credit-card" size={24} color="#FF6B35" />
                  <Text style={styles.paymentOptionText}>Credit Card</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.paymentOption}
                  onPress={() => handlePayment('debit_card')}
                >
                  <Icon name="payment" size={24} color="#FF6B35" />
                  <Text style={styles.paymentOptionText}>Debit Card</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.paymentOption}
                  onPress={() => handlePayment('cash')}
                >
                  <Icon name="money" size={24} color="#FF6B35" />
                  <Text style={styles.paymentOptionText}>Cash</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderRemoveItemModal = () => (
    <Modal visible={showRemoveItemModal} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <Text style={styles.confirmTitle}>Remove Item</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to remove "{selectedItem?.product_name}" from your tab?
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.cancelButton]}
              onPress={() => setShowRemoveItemModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.removeButton]}
              onPress={confirmRemoveItem}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!currentTab) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tab details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalPaid = tabPayments.reduce((sum, payment) => sum + payment.payment_amount, 0);
  const balance = currentTab.total_amount - totalPaid;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{currentTab.tab_number}</Text>
          <Text style={styles.headerSubtitle}>
            {new Date(currentTab.opened_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentTab.status) }]}>
          <Text style={styles.statusText}>{currentTab.status.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Tab Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Tab Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${currentTab.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>${currentTab.tax_amount.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total:</Text>
            <Text style={styles.summaryTotalValue}>${currentTab.total_amount.toFixed(2)}</Text>
          </View>
          {totalPaid > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paid:</Text>
                <Text style={styles.summaryValue}>${totalPaid.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Balance:</Text>
                <Text style={styles.summaryTotalValue}>${balance.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Tab Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({currentTabItems.length})</Text>
          {currentTabItems.length > 0 ? (
            <FlatList
              data={currentTabItems}
              renderItem={renderTabItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.itemsList}
            />
          ) : (
            <Text style={styles.emptyText}>No items in this tab</Text>
          )}
        </View>

        {/* Payments */}
        {tabPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payments ({tabPayments.length})</Text>
            <FlatList
              data={tabPayments}
              renderItem={renderPayment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.paymentsList}
            />
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {currentTab.status === 'open' && balance > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.payButton}
            onPress={() => setShowPaymentModal(true)}
          >
            <Icon name="payment" size={20} color="#FFFFFF" />
            <Text style={styles.payButtonText}>Make Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderPaymentModal()}
      {renderRemoveItemModal()}
    </SafeAreaView>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return '#4CAF50';
    case 'closed':
      return '#FF9800';
    case 'paid':
      return '#2196F3';
    case 'cancelled':
      return '#F44336';
    default:
      return '#666';
  }
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  itemsList: {
    marginTop: 8,
  },
  itemCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemSku: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quantityPrice: {
    flex: 1,
  },
  quantity: {
    fontSize: 12,
    color: '#666',
  },
  unitPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  paymentsList: {
    marginTop: 8,
  },
  paymentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  paymentReference: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  payButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  confirmModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 40,
    padding: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  paymentSummary: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  removeButton: {
    backgroundColor: '#F44336',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default TabDetailsScreen;