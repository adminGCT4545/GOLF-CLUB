import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchProducts,
  addToCart,
  addToWishlist,
  removeFromWishlist,
} from '../../store/slices/commerceSlice';
import Rating from '../../components/common/Rating';
import PriceDisplay from '../../components/commerce/PriceDisplay';
import ProductCard from '../../components/commerce/ProductCard';
import { Product, Review } from '../../types/commerce';

const { width, height } = Dimensions.get('window');

interface ProductDetailsScreenProps {
  navigation: any;
  route: any;
}

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { products, cart, wishlist, loading } = useSelector((state: RootState) => state.commerce);

  const { productId } = route.params;
  const product = products.find((p) => p.id === productId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!product) {
      // Fetch product details if not in current products
      dispatch(fetchProducts({ productId }) as any);
    }
  }, [productId, product, dispatch]);

  useEffect(() => {
    if (product) {
      // Fetch related products
      dispatch(
        fetchProducts({
          category: product.category,
          limit: 10,
        }) as any
      ).then((response: any) => {
        if (response.payload) {
          setRelatedProducts(
            response.payload.products.filter((p: Product) => p.id !== product.id).slice(0, 6)
          );
        }
      });

      // Fetch reviews
      fetchProductReviews();
    }
  }, [product, dispatch]);

  const fetchProductReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      Alert.alert('Size Required', 'Please select a size before adding to cart.');
      return;
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      Alert.alert('Color Required', 'Please select a color before adding to cart.');
      return;
    }

    dispatch(
      addToCart({
        productId: product.id,
        quantity,
        selectedSize: selectedSize || undefined,
        selectedColor: selectedColor || undefined,
      }) as any
    );

    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`, [
      { text: 'Continue Shopping', style: 'default' },
      {
        text: 'View Cart',
        onPress: () => navigation.navigate('ShoppingCart'),
        style: 'default',
      },
    ]);
  };

  const handleToggleWishlist = () => {
    if (!product) {
      return;
    }

    const isInWishlist = wishlist.some((item) => item.productId === product.id);
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id) as any);
    } else {
      dispatch(addToWishlist(product.id) as any);
    }
  };

  const handleShare = async () => {
    if (!product) {
      return;
    }

    try {
      await Share.share({
        message: `Check out this ${product.name} at Royal Golf Club Pro Shop!`,
        url: `https://royalgolf.com/products/${product.id}`,
        title: product.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleRelatedProductPress = (relatedProduct: Product) => {
    navigation.push('ProductDetails', { productId: relatedProduct.id });
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity onPress={() => handleImagePress(index)}>
      <Image source={{ uri: item }} style={styles.thumbnailImage} />
    </TouchableOpacity>
  );

  const renderSizeOption = (size: string) => (
    <TouchableOpacity
      key={size}
      style={[styles.sizeOption, selectedSize === size && styles.selectedOption]}
      onPress={() => setSelectedSize(size)}>
      <Text style={[styles.optionText, selectedSize === size && styles.selectedOptionText]}>
        {size}
      </Text>
    </TouchableOpacity>
  );

  const renderColorOption = (color: string) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        selectedColor === color && styles.selectedColorOption,
        { backgroundColor: color.toLowerCase() },
      ]}
      onPress={() => setSelectedColor(color)}>
      {selectedColor === color && <Icon name="check" size={16} color="#FFFFFF" />}
    </TouchableOpacity>
  );

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.memberName}</Text>
        <Rating rating={item.rating} size={14} />
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  const renderRelatedProduct = ({ item }: { item: Product }) => (
    <View style={styles.relatedProductContainer}>
      <ProductCard
        product={item}
        onPress={handleRelatedProductPress}
        onAddToCart={() => {}}
        onToggleWishlist={() => {}}
        isInWishlist={false}
        layout="grid"
      />
    </View>
  );

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInWishlist = wishlist.some((item) => item.productId === product.id);
  const isInCart = cart.some((item) => item.productId === product.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Icon name="share" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleToggleWishlist}>
            <Icon
              name={isInWishlist ? 'favorite' : 'favorite-border'}
              size={24}
              color={isInWishlist ? '#FF4444' : '#333'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        {/* Product Images */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: product.images[selectedImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {product.images.length > 1 && (
            <FlatList
              data={product.images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageList}
              contentContainerStyle={styles.imageListContent}
            />
          )}

          {/* Badges */}
          <View style={styles.badgesContainer}>
            {product.isNew && (
              <View style={[styles.badge, styles.newBadge]}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
            )}
            {product.originalPrice && product.originalPrice > product.price && (
              <View style={[styles.badge, styles.saleBadge]}>
                <Text style={styles.badgeText}>SALE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.brandName}>{product.brand}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.ratingContainer}>
            <Rating rating={product.rating} size={16} showText reviewCount={product.reviewCount} />
          </View>

          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            memberDiscount={product.memberDiscount}
            loyaltyPoints={product.loyaltyPoints}
            size="large"
            showDiscount
          />

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Icon name="circle" size={8} color={product.inStock ? '#4CAF50' : '#F44336'} />
            <Text style={[styles.stockText, { color: product.inStock ? '#4CAF50' : '#F44336' }]}>
              {product.inStock ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
            </Text>
          </View>
        </View>

        {/* Size Selection */}
        {product.sizes && product.sizes.length > 0 && (
          <View style={styles.optionsSection}>
            <Text style={styles.optionsTitle}>Size</Text>
            <View style={styles.optionsContainer}>{product.sizes.map(renderSizeOption)}</View>
          </View>
        )}

        {/* Color Selection */}
        {product.colors && product.colors.length > 0 && (
          <View style={styles.optionsSection}>
            <Text style={styles.optionsTitle}>Color</Text>
            <View style={styles.colorsContainer}>{product.colors.map(renderColorOption)}</View>
          </View>
        )}

        {/* Quantity Selection */}
        <View style={styles.quantitySection}>
          <Text style={styles.optionsTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity <= 1 && styles.disabledButton]}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}>
              <Icon name="remove" size={20} color={quantity <= 1 ? '#CCC' : '#333'} />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{quantity}</Text>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity >= product.stockQuantity && styles.disabledButton,
              ]}
              onPress={() => handleQuantityChange(1)}
              disabled={quantity >= product.stockQuantity}>
              <Icon
                name="add"
                size={20}
                color={quantity >= product.stockQuantity ? '#CCC' : '#333'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 3}>
            {product.description}
          </Text>
          {product.description.length > 150 && (
            <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
              <Text style={styles.readMoreText}>
                {showFullDescription ? 'Read Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <View style={styles.specificationsSection}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            {Object.entries(product.specifications).map(([key, value]) => (
              <View key={key} style={styles.specificationRow}>
                <Text style={styles.specificationKey}>{key}:</Text>
                <Text style={styles.specificationValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reviews */}
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            <TouchableOpacity>
              <Text style={styles.writeReviewText}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {reviews.length > 0 ? (
            <FlatList
              data={reviews.slice(0, 3)}
              renderItem={renderReview}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          )}

          {reviews.length > 3 && (
            <TouchableOpacity style={styles.viewAllReviewsButton}>
              <Text style={styles.viewAllReviewsText}>View All Reviews</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>Related Products</Text>
            <FlatList
              data={relatedProducts}
              renderItem={renderRelatedProduct}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedProductsList}
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (!product.inStock || isInCart) && styles.disabledAddToCartButton,
          ]}
          onPress={handleAddToCart}
          disabled={!product.inStock || isInCart}>
          <Icon name={isInCart ? 'check' : 'add-shopping-cart'} size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>{isInCart ? 'In Cart' : 'Add to Cart'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
  },
  mainImage: {
    width: width,
    height: width,
  },
  imageList: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  imageListContent: {
    paddingHorizontal: 16,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgesContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  newBadge: {
    backgroundColor: '#4CAF50',
  },
  saleBadge: {
    backgroundColor: '#FF4444',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    padding: 16,
  },
  brandName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    marginBottom: 12,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  stockText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  optionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedColorOption: {
    borderColor: '#333',
    borderWidth: 3,
  },
  quantitySection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 32,
    textAlign: 'center',
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  readMoreText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    marginTop: 8,
  },
  specificationsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  specificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  specificationKey: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  specificationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  reviewsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  writeReviewText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewAllReviewsButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllReviewsText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  relatedSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  relatedProductsList: {
    paddingLeft: 16,
  },
  relatedProductContainer: {
    width: 150,
    marginRight: 12,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addToCartButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledAddToCartButton: {
    backgroundColor: '#CCCCCC',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
});

export default ProductDetailsScreen;
