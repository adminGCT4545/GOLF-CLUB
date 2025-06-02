import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchMenu,
  fetchDailySpecials,
  addToOrder,
  addToTab,
  fetchMemberTabs,
  setFilters,
  addDietaryFilter,
  removeDietaryFilter,
  clearFilters,
} from '../../store/slices/fnbSlice';
import MenuItemCard from '../../components/fnb/MenuItemCard';
import { MenuItem, MenuCategory, DietaryTag } from '../../types/commerce';

interface FnBMenuScreenProps {
  navigation: any;
}

const FnBMenuScreen: React.FC<FnBMenuScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { 
    menu, 
    dailySpecials, 
    categories, 
    currentOrder, 
    memberTabs, 
    loading, 
    error, 
    filters 
  } = useSelector((state: RootState) => state.fnb);
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTabSelector, setShowTabSelector] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    dispatch(fetchMenu({}) as any);
    dispatch(fetchDailySpecials() as any);
    if (user?.id) {
      dispatch(fetchMemberTabs(user.id) as any);
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    dispatch(
      fetchMenu({
        category: selectedCategory || undefined,
        dietary: filters.dietary.length > 0 ? filters.dietary : undefined,
        available: filters.availability,
      }) as any
    );
  }, [dispatch, selectedCategory, filters]);

  const handleMenuItemPress = (item: MenuItem) => {
    navigation.navigate('MenuItemDetails', { menuItemId: item.id });
  };

  const handleAddToOrder = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setShowTabSelector(true);
  };

  const addItemToTab = async (tabId: string) => {
    if (!selectedMenuItem) return;

    try {
      await dispatch(addToTab({
        tabId: tabId,
        productId: selectedMenuItem.id,
        quantity: 1,
      }) as any);
      
      setShowTabSelector(false);
      setSelectedMenuItem(null);
      // Optionally show success message
    } catch (error) {
      console.error('Error adding item to tab:', error);
    }
  };

  const addItemToNewOrder = () => {
    if (!selectedMenuItem) return;

    dispatch(
      addToOrder({
        menuItemId: selectedMenuItem.id,
        quantity: 1,
        customizations: [],
      }) as any
    );
    
    setShowTabSelector(false);
    setSelectedMenuItem(null);
  };

  const handleCategoryPress = (category: MenuCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleOrderPress = () => {
    navigation.navigate('FnBOrder');
  };

  const handleReservationPress = () => {
    navigation.navigate('TableReservation');
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // In a real app, implement search functionality
  };

  const handleToggleDietaryFilter = (tag: DietaryTag) => {
    if (filters.dietary.includes(tag)) {
      dispatch(removeDietaryFilter(tag));
    } else {
      dispatch(addDietaryFilter(tag));
    }
  };

  const renderCategoryItem = ({ item }: { item: MenuCategory }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategory === item && styles.selectedCategoryItem]}
      onPress={() => handleCategoryPress(item)}>
      <Text style={[styles.categoryText, selectedCategory === item && styles.selectedCategoryText]}>
        {item.charAt(0).toUpperCase() + item.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const renderDailySpecial = ({ item }: { item: MenuItem }) => (
    <View style={styles.specialItem}>
      <MenuItemCard
        item={item}
        onPress={handleMenuItemPress}
        onAddToOrder={handleAddToOrder}
        layout="grid"
      />
    </View>
  );

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={layout === 'grid' ? styles.gridItem : styles.listItem}>
      <MenuItemCard
        item={item}
        onPress={handleMenuItemPress}
        onAddToOrder={handleAddToOrder}
        layout={layout}
      />
    </View>
  );

  const renderDietaryFilter = (tag: DietaryTag, label: string, icon: string) => (
    <TouchableOpacity
      key={tag}
      style={[styles.dietaryFilter, filters.dietary.includes(tag) && styles.selectedDietaryFilter]}
      onPress={() => handleToggleDietaryFilter(tag)}>
      <Icon name={icon} size={16} color={filters.dietary.includes(tag) ? '#FFFFFF' : '#666'} />
      <Text
        style={[
          styles.dietaryFilterText,
          filters.dietary.includes(tag) && styles.selectedDietaryFilterText,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const filteredMenu = menu.filter((item) => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const orderItemCount = currentOrder.reduce((total, item) => total + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>F&B Menu</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleReservationPress}>
            <Icon name="event-seat" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.orderButton} onPress={handleOrderPress}>
            <Icon name="restaurant" size={24} color="#333" />
            {orderItemCount > 0 && (
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>
                  {orderItemCount > 99 ? '99+' : orderItemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Icon name="tune" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleReservationPress}>
            <Icon name="event-seat" size={24} color="#FF6B35" />
            <Text style={styles.quickActionText}>Reserve Table</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('MemberTabs')}
          >
            <Icon name="receipt" size={24} color="#FF6B35" />
            <Text style={styles.quickActionText}>My Tabs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Icon name="local-bar" size={24} color="#FF6B35" />
            <Text style={styles.quickActionText}>Bar Menu</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
          />
        </View>

        {/* Daily Specials */}
        {dailySpecials.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Specials</Text>
              <Icon name="star" size={20} color="#FF6B35" />
            </View>
            <FlatList
              data={dailySpecials}
              renderItem={renderDailySpecial}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialsList}
            />
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
                : 'All Items'}
            </Text>
            <View style={styles.layoutButtons}>
              <TouchableOpacity
                style={[styles.layoutButton, layout === 'grid' && styles.selectedLayoutButton]}
                onPress={() => setLayout('grid')}>
                <Icon name="grid-view" size={18} color={layout === 'grid' ? '#FF6B35' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.layoutButton, layout === 'list' && styles.selectedLayoutButton]}
                onPress={() => setLayout('list')}>
                <Icon name="view-list" size={18} color={layout === 'list' ? '#FF6B35' : '#666'} />
              </TouchableOpacity>
            </View>
          </View>

          {loading.menu ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading menu...</Text>
            </View>
          ) : error.menu ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error.menu}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => dispatch(fetchMenu({}) as any)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredMenu}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item.id}
              numColumns={layout === 'grid' ? 2 : 1}
              key={layout}
              scrollEnabled={false}
              columnWrapperStyle={layout === 'grid' ? styles.menuRow : undefined}
              contentContainerStyle={styles.menuList}
            />
          )}
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.filtersModal}>
          <View style={styles.filtersHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity
              onPress={() => {
                setShowFilters(false);
              }}>
              <Text style={styles.applyText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent}>
            {/* Dietary Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Dietary Preferences</Text>
              <View style={styles.dietaryFilters}>
                {renderDietaryFilter('vegetarian', 'Vegetarian', 'eco')}
                {renderDietaryFilter('vegan', 'Vegan', 'local-florist')}
                {renderDietaryFilter('gluten-free', 'Gluten-Free', 'grain')}
                {renderDietaryFilter('dairy-free', 'Dairy-Free', 'no-meals')}
                {renderDietaryFilter('keto', 'Keto', 'fitness-center')}
                {renderDietaryFilter('halal', 'Halal', 'verified')}
                {renderDietaryFilter('kosher', 'Kosher', 'verified')}
              </View>
            </View>

            {/* Availability Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  dispatch(setFilters({ availability: !filters.availability }));
                }}>
                <Icon
                  name={filters.availability ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color="#FF6B35"
                />
                <Text style={styles.checkboxText}>Available Items Only</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.filtersFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                dispatch(clearFilters());
                setSelectedCategory(null);
              }}>
              <Text style={styles.resetText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Tab Selector Modal */}
      <Modal visible={showTabSelector} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.tabSelectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Tab or Order</Text>
              <TouchableOpacity onPress={() => setShowTabSelector(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedMenuItem && (
              <View style={styles.selectedItemInfo}>
                <Text style={styles.selectedItemName}>{selectedMenuItem.name}</Text>
                <Text style={styles.selectedItemPrice}>${selectedMenuItem.price.toFixed(2)}</Text>
              </View>
            )}
            
            <ScrollView style={styles.tabSelectorContent}>
              {/* Open Tabs */}
              {memberTabs.filter(tab => tab.status === 'open').length > 0 && (
                <View style={styles.tabSection}>
                  <Text style={styles.tabSectionTitle}>Add to Open Tab</Text>
                  {memberTabs
                    .filter(tab => tab.status === 'open')
                    .map((tab) => (
                      <TouchableOpacity
                        key={tab.id}
                        style={styles.tabOption}
                        onPress={() => addItemToTab(tab.id)}
                      >
                        <View style={styles.tabInfo}>
                          <Text style={styles.tabNumber}>{tab.tab_number}</Text>
                          <Text style={styles.tabAmount}>
                            ${tab.total_amount.toFixed(2)} • {tab.item_count} items
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#666" />
                      </TouchableOpacity>
                    ))}
                </View>
              )}
              
              {/* New Order Option */}
              <View style={styles.tabSection}>
                <Text style={styles.tabSectionTitle}>Create New Order</Text>
                <TouchableOpacity
                  style={styles.tabOption}
                  onPress={addItemToNewOrder}
                >
                  <View style={styles.tabInfo}>
                    <Text style={styles.tabNumber}>New Order</Text>
                    <Text style={styles.tabAmount}>Start a new order for takeaway/delivery</Text>
                  </View>
                  <Icon name="add-circle" size={20} color="#FF6B35" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  orderButton: {
    padding: 8,
    position: 'relative',
  },
  orderBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  layoutButtons: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  layoutButton: {
    padding: 8,
    borderRadius: 6,
  },
  selectedLayoutButton: {
    backgroundColor: '#FFFFFF',
  },
  categoriesList: {
    paddingLeft: 16,
  },
  categoryItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCategoryItem: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  specialsList: {
    paddingLeft: 16,
  },
  specialItem: {
    width: 180,
    marginRight: 12,
  },
  menuList: {
    paddingHorizontal: 16,
  },
  menuRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  listItem: {
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Filters Modal Styles
  filtersModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filtersHeader: {
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
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  applyText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  filtersContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dietaryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dietaryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedDietaryFilter: {
    backgroundColor: '#FF6B35',
  },
  dietaryFilterText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedDietaryFilterText: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filtersFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resetButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Tab Selector Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  tabSelectorModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  selectedItemInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  selectedItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  tabSelectorContent: {
    maxHeight: 400,
  },
  tabSection: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  tabSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  tabInfo: {
    flex: 1,
  },
  tabNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tabAmount: {
    fontSize: 14,
    color: '#666',
  },
});

export default FnBMenuScreen;
