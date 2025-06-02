import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchProducts,
  fetchFeaturedProducts,
  setSearchQuery,
  setFilters,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  scanBarcode,
} from '../../store/slices/commerceSlice';
import ProductCard from '../../components/commerce/ProductCard';
import { Product, ProductCategory } from '../../types/commerce';

const { width } = Dimensions.get('window');

interface ProShopScreenProps {
  navigation: any;
}

const ProShopScreen: React.FC<ProShopScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    products,
    featuredProducts,
    categories,
    cart,
    wishlist,
    loading,
    error,
    filters,
    searchQuery,
  } = useSelector((state: RootState) => state.commerce);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchFeaturedProducts() as any);
    dispatch(fetchProducts({}) as any);
  }, [dispatch]);

  useEffect(() => {
    if (
      searchQuery ||
      selectedCategory ||
      Object.values(filters).some((f) => f !== null && f !== true && f !== 'popularity')
    ) {
      dispatch(
        fetchProducts({
          search: searchQuery || undefined,
          category: selectedCategory || undefined,
          priceRange: filters.priceRange || undefined,
          brand: filters.brand || undefined,
          sortBy: filters.sortBy,
        }) as any
      );
    }
  }, [dispatch, searchQuery, selectedCategory, filters]);

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

  const handleCategoryPress = (category: ProductCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleSearch = (text: string) => {
    dispatch(setSearchQuery(text));
  };

  const handleCartPress = () => {
    navigation.navigate('ShoppingCart');
  };

  const handleFilterPress = () => {
    navigation.navigate('ProductCatalog', {
      showFilters: true,
      category: selectedCategory,
    });
  };

  const handleScanBarcode = async () => {
    // In a real app, this would open camera for barcode scanning
    Alert.alert(
      'Barcode Scanner',
      'In a real app, this would open the camera to scan product barcodes.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Simulate Scan',
          onPress: () => {
            // Simulate barcode scan
            dispatch(scanBarcode('1234567890123') as any);
          },
        },
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: ProductCategory }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategory === item && styles.selectedCategoryItem]}
      onPress={() => handleCategoryPress(item)}>
      <Text style={[styles.categoryText, selectedCategory === item && styles.selectedCategoryText]}>
        {item.charAt(0).toUpperCase() + item.slice(1).replace('-', ' ')}
      </Text>
    </TouchableOpacity>
  );

  const renderFeaturedProduct = ({ item }: { item: Product }) => (
    <View style={styles.featuredProductContainer}>
      <ProductCard
        product={item}
        onPress={handleProductPress}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isInWishlist={wishlist.some((w) => w.productId === item.id)}
        layout="grid"
      />
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productContainer}>
      <ProductCard
        product={item}
        onPress={handleProductPress}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isInWishlist={wishlist.some((w) => w.productId === item.id)}
        layout="grid"
      />
    </View>
  );

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Pro Shop</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleScanBarcode}>
            <Icon name="qr-code-scanner" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
            <Icon name="shopping-cart" size={24} color="#333" />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartItemCount > 99 ? '99+' : cartItemCount}
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
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
          <Icon name="tune" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

        {/* Special Offers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ProductCatalog', {
                  category: null,
                  filter: 'offers',
                })
              }>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.offersContainer}>
            <View style={styles.offerCard}>
              <Icon name="local-offer" size={24} color="#FF6B35" />
              <Text style={styles.offerTitle}>Member Exclusive</Text>
              <Text style={styles.offerSubtitle}>20% off all apparel</Text>
            </View>
            <View style={styles.offerCard}>
              <Icon name="card-giftcard" size={24} color="#2E7D32" />
              <Text style={styles.offerTitle}>Free Shipping</Text>
              <Text style={styles.offerSubtitle}>On orders over $100</Text>
            </View>
          </View>
        </View>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ProductCatalog', {
                    category: null,
                    filter: 'featured',
                  })
                }>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredProducts.slice(0, 6)}
              renderItem={renderFeaturedProduct}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* Recent Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? `${
                    selectedCategory.charAt(0).toUpperCase() +
                    selectedCategory.slice(1).replace('-', ' ')
                  }`
                : 'All Products'}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ProductCatalog', {
                  category: selectedCategory,
                })
              }>
              <Text style={styles.seeAllText}>View Catalog</Text>
            </TouchableOpacity>
          </View>

          {loading.products ? (
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
              data={products.slice(0, 8)}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productGrid}
            />
          )}
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 24,
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
  seeAllText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  categoriesList: {
    paddingLeft: 16,
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCategoryItem: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  offersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  offerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  offerSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  featuredList: {
    paddingLeft: 16,
  },
  featuredProductContainer: {
    width: 150,
    marginRight: 12,
  },
  productGrid: {
    paddingHorizontal: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productContainer: {
    flex: 1,
    marginHorizontal: 4,
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
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ProShopScreen;
