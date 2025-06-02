import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchOrderHistory, trackOrder } from '../../store/slices/commerceSlice';
import {
  fetchOrderHistory as fetchFnBOrderHistory,
  reorderPrevious,
} from '../../store/slices/fnbSlice';
import { Order, FnBOrder, OrderStatus } from '../../types/commerce';

interface OrderHistoryScreenProps {
  navigation: any;
}

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { orders: commerceOrders, loading: commerceLoading } = useSelector(
    (state: RootState) => state.commerce
  );
  const { orders: fnbOrders, loading: fnbLoading } = useSelector((state: RootState) => state.fnb);

  const [selectedTab, setSelectedTab] = useState<'all' | 'proshop' | 'fnb'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      await Promise.all([
        dispatch(fetchOrderHistory() as any),
        dispatch(fetchFnBOrderHistory() as any),
      ]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order | FnBOrder) => {
    navigation.navigate('OrderDetails', {
      orderId: order.id,
      orderType: 'type' in order ? order.type : 'fnb',
    });
  };

  const handleTrackOrder = (order: Order | FnBOrder) => {
    if ('type' in order) {
      dispatch(trackOrder(order.id) as any);
    } else {
      dispatch(trackOrder(order.id) as any);
    }
  };

  const handleReorder = (order: Order | FnBOrder) => {
    Alert.alert('Reorder Items', 'Would you like to add these items to your cart/order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reorder',
        onPress: () => {
          if ('type' in order && order.type === 'proshop') {
            // Add items to shopping cart
            order.items.forEach((item) => {
              if (item.productId) {
                // dispatch(addToCart({ productId: item.productId, quantity: item.quantity }));
              }
            });
            navigation.navigate('ShoppingCart');
          } else {
            // Add items to F&B order
            dispatch(reorderPrevious(order.id) as any);
            navigation.navigate('FnBOrder');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#2196F3';
      case 'preparing':
        return '#FF6B35';
      case 'ready':
        return '#4CAF50';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'confirmed':
        return 'check-circle';
      case 'preparing':
        return 'restaurant';
      case 'ready':
        return 'check-circle-outline';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrder = ({ item }: { item: Order | FnBOrder }) => {
    const isCommerceOrder = 'type' in item;
    const orderType = isCommerceOrder ? item.type : 'fnb';

    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => handleOrderPress(item)}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
            <View style={styles.orderTypeContainer}>
              <Icon
                name={orderType === 'proshop' ? 'store' : 'restaurant'}
                size={14}
                color="#666"
              />
              <Text style={styles.orderType}>{orderType === 'proshop' ? 'Pro Shop' : 'F&B'}</Text>
            </View>
          </View>

          <View style={styles.orderStatus}>
            <Icon name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.orderDate}>
          {'placedAt' in item ? formatDate(item.placedAt) : formatDate(item.placedAt)}
        </Text>

        <View style={styles.orderItems}>
          {item.items.slice(0, 2).map((orderItem, index) => (
            <Text key={index} style={styles.itemText} numberOfLines={1}>
              {orderItem.quantity}x {orderItem.name}
            </Text>
          ))}
          {item.items.length > 2 && (
            <Text style={styles.moreItemsText}>+{item.items.length - 2} more items</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>Total: ${item.total.toFixed(2)}</Text>

          <View style={styles.orderActions}>
            {(item.status === 'confirmed' || item.status === 'preparing') && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleTrackOrder(item)}>
                <Icon name="location-on" size={16} color="#2E7D32" />
                <Text style={styles.actionButtonText}>Track</Text>
              </TouchableOpacity>
            )}

            {item.status === 'completed' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleReorder(item)}>
                <Icon name="refresh" size={16} color="#2E7D32" />
                <Text style={styles.actionButtonText}>Reorder</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Delivery info for commerce orders */}
        {isCommerceOrder && item.deliveryType === 'delivery' && (
          <View style={styles.deliveryInfo}>
            <Icon name="local-shipping" size={14} color="#666" />
            <Text style={styles.deliveryText}>
              {item.estimatedReady
                ? `Estimated delivery: ${formatDate(item.estimatedReady)}`
                : 'Delivery scheduled'}
            </Text>
          </View>
        )}

        {/* Table info for F&B orders */}
        {'tableNumber' in item && item.tableNumber && (
          <View style={styles.tableInfo}>
            <Icon name="restaurant" size={14} color="#666" />
            <Text style={styles.tableText}>Table {item.tableNumber}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="receipt" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
      <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('ProShop')}>
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const getAllOrders = () => {
    const allOrders = [...commerceOrders, ...fnbOrders];
    return allOrders.sort((a, b) => {
      const aDate = new Date('placedAt' in a ? a.placedAt : a.placedAt);
      const bDate = new Date('placedAt' in b ? b.placedAt : b.placedAt);
      return bDate.getTime() - aDate.getTime();
    });
  };

  const getFilteredOrders = () => {
    switch (selectedTab) {
      case 'proshop':
        return commerceOrders;
      case 'fnb':
        return fnbOrders;
      default:
        return getAllOrders();
    }
  };

  const filteredOrders = getFilteredOrders();
  const isLoading = commerceLoading.orders || fnbLoading.order;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}>
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'proshop' && styles.activeTab]}
          onPress={() => setSelectedTab('proshop')}>
          <Text style={[styles.tabText, selectedTab === 'proshop' && styles.activeTabText]}>
            Pro Shop
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'fnb' && styles.activeTab]}
          onPress={() => setSelectedTab('fnb')}>
          <Text style={[styles.tabText, selectedTab === 'fnb' && styles.activeTabText]}>F&B</Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 && !isLoading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
          }
          showsVerticalScrollIndicator={false}
        />
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
  headerPlaceholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  ordersList: {
    padding: 16,
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
    marginBottom: 8,
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
  orderTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderType: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  orderActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F8E9',
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 4,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deliveryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tableText: {
    fontSize: 12,
    color: '#666',
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
});

export default OrderHistoryScreen;
