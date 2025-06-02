import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, ListItem, RadioButton, Input, Icon } from 'react-native-elements';
import { PaymentInfo, PaymentMethod } from '../../types/tournament';
import { theme } from '../../constants/theme';
import { formatCurrency } from '../../utils/dateHelpers';

interface PaymentFormProps {
  paymentInfo: PaymentInfo;
  onPaymentSubmit: (paymentMethodId: string, paymentData?: any) => void;
  isProcessing?: boolean;
  error?: string | null;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentInfo,
  onPaymentSubmit,
  isProcessing = false,
  error,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(
    paymentInfo.paymentMethods.find((method) => method.isDefault) ||
      paymentInfo.paymentMethods[0] ||
      null
  );
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    routingNumber: '',
    accountName: '',
  });

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'CARD':
        return 'credit-card';
      case 'PAYPAL':
        return 'paypal';
      case 'BANK_TRANSFER':
        return 'account-balance';
      case 'MEMBER_ACCOUNT':
        return 'account-circle';
      default:
        return 'payment';
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const match = cleaned.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/);
    if (match) {
      return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ');
    }
    return text;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validateCardDetails = () => {
    if (!cardDetails.cardNumber.replace(/\s/g, '')) {
      Alert.alert('Error', 'Card number is required');
      return false;
    }
    if (cardDetails.cardNumber.replace(/\s/g, '').length < 13) {
      Alert.alert('Error', 'Please enter a valid card number');
      return false;
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
      Alert.alert('Error', 'Please enter a valid expiry date');
      return false;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      Alert.alert('Error', 'Please enter a valid CVV');
      return false;
    }
    if (!cardDetails.cardholderName.trim()) {
      Alert.alert('Error', 'Cardholder name is required');
      return false;
    }
    return true;
  };

  const validateBankDetails = () => {
    if (!bankDetails.accountNumber.trim()) {
      Alert.alert('Error', 'Account number is required');
      return false;
    }
    if (!bankDetails.routingNumber.trim()) {
      Alert.alert('Error', 'Routing number is required');
      return false;
    }
    if (!bankDetails.accountName.trim()) {
      Alert.alert('Error', 'Account name is required');
      return false;
    }
    return true;
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    let paymentData = {};

    switch (selectedPaymentMethod.type) {
      case 'CARD':
        if (!validateCardDetails()) {
          return;
        }
        paymentData = {
          type: 'CARD',
          cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
          expiryDate: cardDetails.expiryDate,
          cvv: cardDetails.cvv,
          cardholderName: cardDetails.cardholderName,
        };
        break;

      case 'BANK_TRANSFER':
        if (!validateBankDetails()) {
          return;
        }
        paymentData = {
          type: 'BANK_TRANSFER',
          accountNumber: bankDetails.accountNumber,
          routingNumber: bankDetails.routingNumber,
          accountName: bankDetails.accountName,
        };
        break;

      case 'PAYPAL':
      case 'MEMBER_ACCOUNT':
        paymentData = {
          type: selectedPaymentMethod.type,
        };
        break;
    }

    onPaymentSubmit(selectedPaymentMethod.id, paymentData);
  };

  const renderPaymentMethodForm = () => {
    if (!selectedPaymentMethod) {
      return null;
    }

    switch (selectedPaymentMethod.type) {
      case 'CARD':
        return (
          <Card containerStyle={styles.formCard}>
            <Text style={styles.formTitle}>Card Details</Text>

            <Input
              label="Card Number"
              value={cardDetails.cardNumber}
              onChangeText={(text) =>
                setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(text) })
              }
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              maxLength={19}
              leftIcon={{ name: 'credit-card', size: 20, color: theme.colors?.grey3 }}
            />

            <View style={styles.row}>
              <Input
                label="Expiry Date"
                value={cardDetails.expiryDate}
                onChangeText={(text) =>
                  setCardDetails({ ...cardDetails, expiryDate: formatExpiryDate(text) })
                }
                placeholder="MM/YY"
                keyboardType="numeric"
                maxLength={5}
                containerStyle={styles.halfInput}
              />

              <Input
                label="CVV"
                value={cardDetails.cvv}
                onChangeText={(text) =>
                  setCardDetails({ ...cardDetails, cvv: text.replace(/\D/g, '') })
                }
                placeholder="123"
                keyboardType="numeric"
                maxLength={4}
                containerStyle={styles.halfInput}
                secureTextEntry
              />
            </View>

            <Input
              label="Cardholder Name"
              value={cardDetails.cardholderName}
              onChangeText={(text) => setCardDetails({ ...cardDetails, cardholderName: text })}
              placeholder="Name on card"
              autoCapitalize="words"
            />
          </Card>
        );

      case 'BANK_TRANSFER':
        return (
          <Card containerStyle={styles.formCard}>
            <Text style={styles.formTitle}>Bank Transfer Details</Text>

            <Input
              label="Account Number"
              value={bankDetails.accountNumber}
              onChangeText={(text) => setBankDetails({ ...bankDetails, accountNumber: text })}
              placeholder="Enter account number"
              keyboardType="numeric"
            />

            <Input
              label="Routing Number"
              value={bankDetails.routingNumber}
              onChangeText={(text) => setBankDetails({ ...bankDetails, routingNumber: text })}
              placeholder="Enter routing number"
              keyboardType="numeric"
            />

            <Input
              label="Account Name"
              value={bankDetails.accountName}
              onChangeText={(text) => setBankDetails({ ...bankDetails, accountName: text })}
              placeholder="Account holder name"
              autoCapitalize="words"
            />
          </Card>
        );

      case 'PAYPAL':
        return (
          <Card containerStyle={styles.formCard}>
            <Text style={styles.formTitle}>PayPal Payment</Text>
            <Text style={styles.formDescription}>
              You will be redirected to PayPal to complete your payment securely.
            </Text>
          </Card>
        );

      case 'MEMBER_ACCOUNT':
        return (
          <Card containerStyle={styles.formCard}>
            <Text style={styles.formTitle}>Member Account</Text>
            <Text style={styles.formDescription}>
              The amount will be charged to your member account and added to your monthly statement.
            </Text>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Payment Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tournament Entry Fee:</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(paymentInfo.amount)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(paymentInfo.amount)}</Text>
        </View>
        <Text style={styles.currencyNote}>Amount in {paymentInfo.currency}</Text>
      </Card>

      <Card containerStyle={styles.methodCard}>
        <Text style={styles.methodTitle}>Select Payment Method</Text>

        {paymentInfo.paymentMethods.map((method) => (
          <ListItem
            key={method.id}
            onPress={() => setSelectedPaymentMethod(method)}
            containerStyle={styles.methodItem}>
            <Icon
              name={getPaymentMethodIcon(method.type)}
              size={24}
              color={theme.colors?.primary}
            />
            <ListItem.Content>
              <ListItem.Title style={styles.methodName}>{method.name}</ListItem.Title>
              {method.isDefault && <Text style={styles.defaultLabel}>Default</Text>}
            </ListItem.Content>
            <RadioButton
              value={method.id}
              selected={selectedPaymentMethod?.id === method.id}
              onPress={() => setSelectedPaymentMethod(method)}
            />
          </ListItem>
        ))}
      </Card>

      {renderPaymentMethodForm()}

      {error && (
        <Card containerStyle={[styles.errorCard]}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <Button
        title={`Pay ${formatCurrency(paymentInfo.amount)}`}
        buttonStyle={styles.payButton}
        titleStyle={styles.payButtonText}
        onPress={handlePayment}
        loading={isProcessing}
        disabled={isProcessing || !selectedPaymentMethod}
        icon={<Icon name="payment" size={20} color="#fff" style={{ marginRight: 8 }} />}
      />

      <Text style={styles.securityNote}>🔒 Your payment information is encrypted and secure</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#43484D',
  },
  summaryAmount: {
    fontSize: 14,
    color: '#43484D',
    fontWeight: '500',
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E8EE',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43484D',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
  },
  currencyNote: {
    fontSize: 12,
    color: '#86939E',
    textAlign: 'center',
    marginTop: 8,
  },
  methodCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43484D',
    marginBottom: 16,
  },
  methodItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
  },
  methodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#43484D',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  formCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43484D',
    marginBottom: 16,
  },
  formDescription: {
    fontSize: 14,
    color: '#86939E',
    lineHeight: 20,
    textAlign: 'center',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    marginBottom: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
  },
  payButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    fontSize: 12,
    color: '#86939E',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default PaymentForm;
