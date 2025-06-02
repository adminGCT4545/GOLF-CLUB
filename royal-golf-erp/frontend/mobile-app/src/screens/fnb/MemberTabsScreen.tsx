import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchMemberTabs,
  fetchMemberInvoices,
  fetchTabDetails,
  payInvoice,
  setCurrentTab,
} from '../../store/slices/fnbSlice';

interface MemberTabsScreenProps {
  navigation: any;
}

const MemberTabsScreen: React.FC<MemberTabsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { 
    memberTabs, 
    memberInvoices, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.fnb);
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'tabs' | 'invoices'>('tabs');
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [dispatch, user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      await dispatch(fetchMemberTabs(user.id) as any);
      await dispatch(fetchMemberInvoices(user.id) as any);
    } catch (error) {
      console.error('Error loading member tabs/invoices:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTabPress = async (tab: any) => {
    try {
      dispatch(setCurrentTab(tab));
      await dispatch(fetchTabDetails(tab.id) as any);
      navigation.navigate('TabDetails', { tabId: tab.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to load tab details');
    }
  };

  const handleInvoicePress = (invoice: any) => {
    navigation.navigate('InvoiceDetails', { invoiceId: invoice.id });
  };

  const handlePayInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const processPayment = async (paymentMethod: string) => {
    if (!selectedInvoice) return;

    try {
      await dispatch(payInvoice({
        invoiceId: selectedInvoice.id,
        paymentMethod: paymentMethod as any,
      }) as any);
      
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      Alert.alert('Success', 'Payment processed successfully');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const renderTabItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.tabCard} onPress={() => handleTabPress(item)}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabNumber}>{item.tab_number}</Text>
          <Text style={styles.tabDate}>
            Opened: {new Date(item.opened_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.tabStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.tabDetails}>
        <View style={styles.tabInfo}>
          <Text style={styles.itemCount}>{item.item_count} items</Text>
          <Text style={styles.tabAmount}>${item.total_amount.toFixed(2)}</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderInvoiceItem = ({ item }: { item: any }) => (
    <View style={styles.invoiceCard}>
      <TouchableOpacity 
        style={styles.invoiceContent} 
        onPress={() => handleInvoicePress(item)}
      >
        <View style={styles.invoiceHeader}>
          <View>
            <Text style={styles.invoiceNumber}>{item.tab_number}</Text>
            <Text style={styles.invoiceDate}>
              {new Date(item.closed_at || item.opened_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.invoiceAmount}>
            <Text style={styles.amountText}>${item.total_amount.toFixed(2)}</Text>
            <Text style={styles.balanceText}>
              Balance: ${(item.balance_due || item.total_amount).toFixed(2)}
            </Text>
          </View>
        </View>
        
        <View style={styles.invoiceDetails}>
          <Text style={styles.itemCount}>{item.item_count} items</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {item.status === 'closed' && (
        <TouchableOpacity 
          style={styles.payButton}
          onPress={() => handlePayInvoice(item)}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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

  const renderPaymentModal = () => (
    <Modal visible={showPaymentModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.paymentModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.invoiceInfo}>
              Invoice: {selectedInvoice?.tab_number}
            </Text>
            <Text style={styles.invoiceInfo}>
              Amount: ${selectedInvoice?.total_amount.toFixed(2)}
            </Text>
            
            <View style={styles.paymentMethods}>
              <TouchableOpacity 
                style={styles.paymentOption}
                onPress={() => processPayment('member_account')}
              >
                <Icon name="account-balance" size={24} color="#FF6B35" />
                <Text style={styles.paymentOptionText}>Member Account</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.paymentOption}
                onPress={() => processPayment('credit_card')}
              >
                <Icon name="credit-card" size={24} color="#FF6B35" />
                <Text style={styles.paymentOptionText}>Credit Card</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.paymentOption}
                onPress={() => processPayment('debit_card')}
              >
                <Icon name="payment" size={24} color="#FF6B35" />
                <Text style={styles.paymentOptionText}>Debit Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const openTabs = memberTabs.filter(tab => tab.status === 'open');
  const unpaidInvoices = memberInvoices.filter(invoice => invoice.status === 'closed');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tabs & Invoices</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Icon name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tabs' && styles.activeTabButton]}
          onPress={() => setActiveTab('tabs')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'tabs' && styles.activeTabButtonText]}>
            Open Tabs ({openTabs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'invoices' && styles.activeTabButton]}
          onPress={() => setActiveTab('invoices')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'invoices' && styles.activeTabButtonText]}>
            Unpaid Invoices ({unpaidInvoices.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'tabs' ? (
          <FlatList
            data={openTabs}
            renderItem={renderTabItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="receipt" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No open tabs</Text>
                <Text style={styles.emptySubtext}>
                  Visit the restaurant to start a new tab
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <FlatList
            data={unpaidInvoices}
            renderItem={renderInvoiceItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="receipt-long" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No unpaid invoices</Text>
                <Text style={styles.emptySubtext}>
                  All your invoices are paid up
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {renderPaymentModal()}
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#FF6B35',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#FF6B35',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  tabCard: {
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
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tabNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tabDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tabStatus: {
    alignItems: 'flex-end',
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
  tabDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabInfo: {
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  tabAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceContent: {
    padding: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  invoiceDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  balanceText: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 2,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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
  invoiceInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  paymentMethods: {
    marginTop: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
});

export default MemberTabsScreen;