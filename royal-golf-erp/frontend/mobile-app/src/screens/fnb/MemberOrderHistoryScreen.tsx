import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchMemberInvoices } from '../../store/slices/fnbSlice';

interface MemberOrderHistoryScreenProps {
  navigation: any;
}

interface OrderHistoryItem {
  id: string;
  tab_number: string;
  total_amount: number;
  item_count: number;
  status: 'paid' | 'closed' | 'cancelled';
  closed_at: string;
  opened_at: string;
}

const MemberOrderHistoryScreen: React.FC<MemberOrderHistoryScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { memberInvoices, loading, error } = useSelector((state: RootState) => state.fnb);
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30days' | '3months' | '1year'>('30days');

  useEffect(() => {
    if (user?.id) {
      loadOrderHistory();
    }
  }, [dispatch, user?.id]);

  const loadOrderHistory = async () => {
    if (!user?.id) return;
    
    try {
      await dispatch(fetchMemberInvoices(user.id) as any);
    } catch (error) {
      console.error('Error loading order history:', error);
      Alert.alert('Error', 'Failed to load order history');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrderHistory();
    setRefreshing(false);
  };

  const filterOrdersByPeriod = (orders: any[], period: string) => {
    if (period === 'all') return orders;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (period) {
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return orders.filter(order => new Date(order.closed_at || order.opened_at) >= cutoffDate);
  };

  const handleOrderPress = (order: OrderHistoryItem) => {
    if (order.status === 'closed') {
      navigation.navigate('InvoiceDetails', { invoiceId: order.id });
    } else {
      navigation.navigate('TabDetails', { tabId: order.id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#4CAF50';
      case 'closed':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'check-circle';
      case 'closed':
        return 'schedule';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        { key: '30days', label: '30 Days' },
        { key: '3months', label: '3 Months' },
        { key: '1year', label: '1 Year' },
        { key: 'all', label: 'All Time' },
      ].map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.selectedPeriodButton,
          ]}
          onPress={() => setSelectedPeriod(period.key as any)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.selectedPeriodButtonText,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOrderItem = ({ item }: { item: OrderHistoryItem }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => handleOrderPress(item)}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.tab_number}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.closed_at || item.opened_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.orderStatus}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}>
            <Icon name={getStatusIcon(item.status)} size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderItems}>
          <Icon name="restaurant" size={16} color="#666" />
          <Text style={styles.itemCount}>{item.item_count} items</Text>
        </View>
        <Text style={styles.orderAmount}>${item.total_amount.toFixed(2)}</Text>
      </View>
      
      <View style={styles.orderActions}>
        <TouchableOpacity style={styles.viewButton} onPress={() => handleOrderPress(item)}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <Icon name="chevron-right" size={16} color="#FF6B35" />
        </TouchableOpacity>
        
        {item.status === 'paid' && (
          <TouchableOpacity style={styles.reorderButton}>
            <Icon name="refresh" size={16} color="#4CAF50" />
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const filteredOrders = filterOrdersByPeriod(memberInvoices, selectedPeriod);
  const totalSpent = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const averageOrderValue = filteredOrders.length > 0 ? totalSpent / filteredOrders.length : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Icon name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      {renderPeriodSelector()}

      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{filteredOrders.length}</Text>
            <Text style={styles.summaryLabel}>Orders</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${averageOrderValue.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Avg Order</Text>
          </View>
        </View>
      </View>

      {/* Order List */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="receipt-long" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No orders found</Text>
              <Text style={styles.emptySubtext}>
                {selectedPeriod === 'all' 
                  ? 'You haven\'t placed any F&B orders yet'
                  : `No orders in the selected ${selectedPeriod === '30days' ? '30 days' : selectedPeriod === '3months' ? '3 months' : '1 year'} period`
                }
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#FF6B35',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
    marginRight: 4,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reorderButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MemberOrderHistoryScreen;