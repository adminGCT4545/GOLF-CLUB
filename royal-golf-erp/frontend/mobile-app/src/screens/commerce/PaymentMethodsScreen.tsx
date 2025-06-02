import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PaymentMethod } from '../../types/commerce';

interface PaymentMethodsScreenProps {
  navigation: any;
}

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ navigation }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
    nickname: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment-methods');
      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (
      !newCard.cardNumber ||
      !newCard.expiryMonth ||
      !newCard.expiryYear ||
      !newCard.cvv ||
      !newCard.name
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'card',
          cardNumber: newCard.cardNumber,
          expiryMonth: parseInt(newCard.expiryMonth),
          expiryYear: parseInt(newCard.expiryYear),
          cvv: newCard.cvv,
          name: newCard.name,
          nickname: newCard.nickname,
          isDefault: newCard.isDefault,
        }),
      });

      if (response.ok) {
        const newMethod = await response.json();
        setPaymentMethods((prev) => [...prev, newMethod]);
        setShowAddModal(false);
        resetNewCard();
        Alert.alert('Success', 'Payment method added successfully');
      } else {
        throw new Error('Failed to add payment method');
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Error', 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = (method: PaymentMethod) => {
    Alert.alert('Delete Payment Method', 'Are you sure you want to delete this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`/api/payment-methods/${method.id}`, {
              method: 'DELETE',
            });

            if (response.ok) {
              setPaymentMethods((prev) => prev.filter((m) => m.id !== method.id));
              Alert.alert('Success', 'Payment method deleted successfully');
            } else {
              throw new Error('Failed to delete payment method');
            }
          } catch (error) {
            console.error('Failed to delete payment method:', error);
            Alert.alert('Error', 'Failed to delete payment method');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    try {
      const response = await fetch(`/api/payment-methods/${method.id}/set-default`, {
        method: 'PUT',
      });

      if (response.ok) {
        setPaymentMethods((prev) =>
          prev.map((m) => ({
            ...m,
            isDefault: m.id === method.id,
          }))
        );
        Alert.alert('Success', 'Default payment method updated');
      } else {
        throw new Error('Failed to set default payment method');
      }
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const resetNewCard = () => {
    setNewCard({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      name: '',
      nickname: '',
      isDefault: false,
    });
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '').replace(/[^0-9]/g, '');
    const match = cleaned.match(/(.{1,4})/g);
    return match ? match.join(' ').substr(0, 19) : '';
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType?.toLowerCase()) {
      case 'visa':
        return 'credit-card';
      case 'mastercard':
        return 'credit-card';
      case 'amex':
        return 'credit-card';
      default:
        return 'credit-card';
    }
  };

  const getCardColor = (cardType: string) => {
    switch (cardType?.toLowerCase()) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      default:
        return '#666';
    }
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <View style={styles.paymentMethodCard}>
      <View style={styles.paymentMethodHeader}>
        <View style={styles.paymentMethodInfo}>
          <Icon
            name={getCardIcon(item.cardType || '')}
            size={24}
            color={getCardColor(item.cardType || '')}
          />
          <View style={styles.paymentMethodDetails}>
            <Text style={styles.paymentMethodTitle}>
              {item.type === 'card'
                ? `${item.cardType} •••• ${item.cardLast4}`
                : item.type === 'member-account'
                ? 'Member Account'
                : 'Digital Wallet'}
            </Text>
            {item.nickname && <Text style={styles.paymentMethodSubtitle}>{item.nickname}</Text>}
            {item.type === 'card' && (
              <Text style={styles.paymentMethodExpiry}>
                Expires {item.expiryMonth?.toString().padStart(2, '0')}/{item.expiryYear}
              </Text>
            )}
          </View>
        </View>

        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        )}
      </View>

      <View style={styles.paymentMethodActions}>
        {!item.isDefault && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSetDefault(item)}>
            <Text style={styles.actionButtonText}>Set as Default</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePaymentMethod(item)}>
          <Icon name="delete" size={16} color="#F44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="payment" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Payment Methods</Text>
      <Text style={styles.emptySubtitle}>Add a payment method to make purchases easier</Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addFirstButtonText}>Add Payment Method</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Icon name="add" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={paymentMethods}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.paymentMethodsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Icon name="security" size={20} color="#4CAF50" />
        <Text style={styles.securityText}>Your payment information is encrypted and secure</Text>
      </View>

      {/* Add Payment Method Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetNewCard();
              }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TouchableOpacity onPress={handleAddPaymentMethod} disabled={loading}>
              <Text style={[styles.saveText, loading && styles.disabledText]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number *</Text>
              <TextInput
                style={styles.textInput}
                value={newCard.cardNumber}
                onChangeText={(text) =>
                  setNewCard((prev) => ({
                    ...prev,
                    cardNumber: formatCardNumber(text),
                  }))
                }
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            {/* Expiry and CVV */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Expiry Month *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCard.expiryMonth}
                  onChangeText={(text) =>
                    setNewCard((prev) => ({
                      ...prev,
                      expiryMonth: text.replace(/[^0-9]/g, '').substr(0, 2),
                    }))
                  }
                  placeholder="MM"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Expiry Year *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCard.expiryYear}
                  onChangeText={(text) =>
                    setNewCard((prev) => ({
                      ...prev,
                      expiryYear: text.replace(/[^0-9]/g, '').substr(0, 4),
                    }))
                  }
                  placeholder="YYYY"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>

            {/* CVV */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CVV *</Text>
              <TextInput
                style={styles.textInput}
                value={newCard.cvv}
                onChangeText={(text) =>
                  setNewCard((prev) => ({
                    ...prev,
                    cvv: text.replace(/[^0-9]/g, '').substr(0, 4),
                  }))
                }
                placeholder="123"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>

            {/* Cardholder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newCard.name}
                onChangeText={(text) => setNewCard((prev) => ({ ...prev, name: text }))}
                placeholder="John Doe"
                autoCapitalize="words"
              />
            </View>

            {/* Nickname */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Nickname (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newCard.nickname}
                onChangeText={(text) => setNewCard((prev) => ({ ...prev, nickname: text }))}
                placeholder="My Primary Card"
              />
            </View>

            {/* Set as Default */}
            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Set as default payment method</Text>
              <Switch
                value={newCard.isDefault}
                onValueChange={(value) => setNewCard((prev) => ({ ...prev, isDefault: value }))}
                trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }}
                thumbColor={newCard.isDefault ? '#2E7D32' : '#F4F3F4'}
              />
            </View>

            {/* Security Notice */}
            <View style={styles.modalSecurityNotice}>
              <Icon name="lock" size={16} color="#4CAF50" />
              <Text style={styles.modalSecurityText}>
                Your card information is encrypted and stored securely
              </Text>
            </View>
          </View>
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
  addButton: {
    padding: 8,
  },
  paymentMethodsList: {
    padding: 16,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  paymentMethodExpiry: {
    fontSize: 12,
    color: '#999',
  },
  defaultBadge: {
    backgroundColor: '#2E7D32',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#F44336',
    marginLeft: 4,
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
  addFirstButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F1F8E9',
    margin: 16,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
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
  saveText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  disabledText: {
    color: '#CCC',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalSecurityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    marginTop: 16,
  },
  modalSecurityText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
  },
});

export default PaymentMethodsScreen;
