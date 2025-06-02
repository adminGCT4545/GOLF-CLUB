import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchProducts,
  setSearchQuery,
  setFilters,
  addToCart,
  addToWishlist,
  removeFromWishlist,
} from '../../store/slices/commerceSlice';
import ProductCard from '../../components/commerce/ProductCard';
import { Product, ProductCategory } from '../../types/commerce';

interface ProductCatalogScreenProps {
  navigation: any;
  route: any;
}

const ProductCatalogScreen: React.FC<ProductCatalogScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { products, categories, cart, wishlist, loading, error, filters, searchQuery } =
    useSelector((state: RootState) => state.commerce);

  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const { category: initialCategory, showFilters: showFiltersOnMount } = route.params || {};

  useEffect(() => {
    if (initialCategory) {
      dispatch(setFilters({ category: initialCategory }));
    }
    if (showFiltersOnMount) {
      setShowFilters(true);
    }
  }, [initialCategory, showFiltersOnMount, dispatch]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        category: filters.category || undefined,
        search: searchQuery || undefined,
        priceRange: filters.priceRange || undefined,
        brand: filters.brand || undefined,
        sortBy: filters.sortBy,
        page: 1,
        limit: 20,
      }) as any
    );
  }, [dispatch, filters, searchQuery]);

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleAddToCart = (product: Product) => {
    dispatch(
      addToCart({
        productId: product.id,
        quantity: 1,
      }) as any
    );
  };

  const handleToggleWishlist = (product: Product) => {
    const isInWishlist = wishlist.some((item) => item.productId === product.id);
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id) as any);
    } else {
      dispatch(addToWishlist(product.id) as any);
    }
  };

  const handleSearch = (text: string) => {
    dispatch(setSearchQuery(text));
    setPage(1);
  };

  const handleApplyFilters = () => {
    dispatch(setFilters(localFilters));
    setShowFilters(false);
    setPage(1);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      category: null,
      priceRange: null,
      brand: null,
      inStock: true,
      sortBy: 'popularity' as const,
    };
    setLocalFilters(resetFilters);
    dispatch(setFilters(resetFilters));
    setShowFilters(false);
    setPage(1);
  };

  const handleCartPress = () => {
    navigation.navigate('ShoppingCart');
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading.products) {
      setLoadingMore(true);
      dispatch(
        fetchProducts({
          category: filters.category || undefined,
          search: searchQuery || undefined,
          priceRange: filters.priceRange || undefined,
          brand: filters.brand || undefined,
          sortBy: filters.sortBy,
          page: page + 1,
          limit: 20,
        }) as any
      ).then(() => {
        setPage((prev) => prev + 1);
        setLoadingMore(false);
      });
    }
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={layout === 'grid' ? styles.gridItem : styles.listItem}>
      <ProductCard
        product={item}
        onPress={handleProductPress}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isInWishlist={wishlist.some((w) => w.productId === item.id)}
        layout={layout}
      />
    </View>
  );

  const renderSortOption = (option: string, label: string) => (
    <TouchableOpacity
      key={option}
      style={[styles.sortOption, filters.sortBy === option && styles.selectedSortOption]}
      onPress={() => {
        setLocalFilters((prev) => ({ ...prev, sortBy: option as any }));
      }}>
      <Text
        style={[styles.sortOptionText, filters.sortBy === option && styles.selectedSortOptionText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryFilter = (category: ProductCategory) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.filterOption,
        localFilters.category === category && styles.selectedFilterOption,
      ]}
      onPress={() => {
        setLocalFilters((prev) => ({
          ...prev,
          category: prev.category === category ? null : category,
        }));
      }}>
      <Text
        style={[
          styles.filterOptionText,
          localFilters.category === category && styles.selectedFilterOptionText,
        ]}>
        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {filters.category
            ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1).replace('-', ' ')
            : 'All Products'}
        </Text>
        <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
          <Icon name="shopping-cart" size={24} color="#333" />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search and Controls */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
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
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsLeft}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Icon name="tune" size={18} color="#333" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort:</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                const sortOptions = [
                  { key: 'popularity', label: 'Popularity' },
                  { key: 'price-low', label: 'Price: Low to High' },
                  { key: 'price-high', label: 'Price: High to Low' },
                  { key: 'rating', label: 'Rating' },
                  { key: 'name', label: 'Name' },
                ];
                // In a real app, show a picker/modal for sort options
              }}>
              <Text style={styles.sortButtonText}>
                {filters.sortBy === 'price-low'
                  ? 'Price ↑'
                  : filters.sortBy === 'price-high'
                  ? 'Price ↓'
                  : filters.sortBy === 'rating'
                  ? 'Rating'
                  : filters.sortBy === 'name'
                  ? 'Name'
                  : 'Popular'}
              </Text>
              <Icon name="keyboard-arrow-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.layoutButtons}>
          <TouchableOpacity
            style={[styles.layoutButton, layout === 'grid' && styles.selectedLayoutButton]}
            onPress={() => setLayout('grid')}>
            <Icon name="grid-view" size={18} color={layout === 'grid' ? '#2E7D32' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.layoutButton, layout === 'list' && styles.selectedLayoutButton]}
            onPress={() => setLayout('list')}>
            <Icon name="view-list" size={18} color={layout === 'list' ? '#2E7D32' : '#666'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <View style={styles.productsContainer}>
        <Text style={styles.resultsText}>{products.length} products found</Text>

        {loading.products && page === 1 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : error.products ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error.products}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => dispatch(fetchProducts({}) as any)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={layout === 'grid' ? 2 : 1}
            key={layout} // Force re-render when layout changes
            contentContainerStyle={styles.productsList}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.filtersModal}>
          <View style={styles.filtersHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity onPress={handleApplyFilters}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptions}>{categories.map(renderCategoryFilter)}</View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={localFilters.priceRange?.[0]?.toString() || ''}
                  onChangeText={(text) => {
                    const min = parseFloat(text) || 0;
                    setLocalFilters((prev) => ({
                      ...prev,
                      priceRange: [min, prev.priceRange?.[1] || 1000],
                    }));
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.priceRangeSeparator}>to</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={localFilters.priceRange?.[1]?.toString() || ''}
                  onChangeText={(text) => {
                    const max = parseFloat(text) || 1000;
                    setLocalFilters((prev) => ({
                      ...prev,
                      priceRange: [prev.priceRange?.[0] || 0, max],
                    }));
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Stock Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  setLocalFilters((prev) => ({
                    ...prev,
                    inStock: !prev.inStock,
                  }));
                }}>
                <Icon
                  name={localFilters.inStock ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color="#2E7D32"
                />
                <Text style={styles.checkboxText}>In Stock Only</Text>
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptions}>
                {renderSortOption('popularity', 'Popularity')}
                {renderSortOption('price-low', 'Price: Low to High')}
                {renderSortOption('price-high', 'Price: High to Low')}
                {renderSortOption('rating', 'Rating')}
                {renderSortOption('name', 'Name')}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filtersFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>
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
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 16,
  },
  filterButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
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
  productsContainer: {
    flex: 1,
  },
  resultsText: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#666',
  },
  productsList: {
    paddingHorizontal: 16,
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
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
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
    backgroundColor: '#2E7D32',
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
    color: '#2E7D32',
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
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#2E7D32',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFilterOptionText: {
    color: '#FFFFFF',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  priceRangeSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#666',
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
  sortOptions: {
    flexDirection: 'column',
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedSortOption: {
    backgroundColor: '#2E7D32',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSortOptionText: {
    color: '#FFFFFF',
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
});

export default ProductCatalogScreen;
