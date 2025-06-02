import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../../types/commerce';
import Rating from '../common/Rating';
import PriceDisplay from './PriceDisplay';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isInWishlist: boolean;
  layout?: 'grid' | 'list';
}

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 48) / 2; // Accounting for padding and margins

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  layout = 'grid',
}) => {
  const handlePress = () => {
    onPress(product);
  };

  const handleAddToCart = () => {
    onAddToCart(product);
  };

  const handleToggleWishlist = () => {
    onToggleWishlist(product);
  };

  if (layout === 'list') {
    return (
      <TouchableOpacity style={styles.listContainer} onPress={handlePress} activeOpacity={0.7}>
        <Image source={{ uri: product.images[0] }} style={styles.listImage} />
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={2}>
              {product.name}
            </Text>
            <TouchableOpacity onPress={handleToggleWishlist} style={styles.wishlistButton}>
              <Icon
                name={isInWishlist ? 'favorite' : 'favorite-border'}
                size={20}
                color={isInWishlist ? '#FF4444' : '#999'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.brandText}>{product.brand}</Text>

          <View style={styles.ratingContainer}>
            <Rating rating={product.rating} size={14} showText reviewCount={product.reviewCount} />
          </View>

          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            memberDiscount={product.memberDiscount}
            loyaltyPoints={product.loyaltyPoints}
            size="small"
            showDiscount
          />

          <View style={styles.listFooter}>
            <View style={styles.stockContainer}>
              <Icon name="circle" size={8} color={product.inStock ? '#4CAF50' : '#F44336'} />
              <Text style={[styles.stockText, { color: product.inStock ? '#4CAF50' : '#F44336' }]}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleAddToCart}
              style={[styles.addToCartButton, !product.inStock && styles.disabledButton]}
              disabled={!product.inStock}>
              <Icon name="add-shopping-cart" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gridContainer} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.images[0] }} style={styles.gridImage} />

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

        {/* Wishlist button */}
        <TouchableOpacity onPress={handleToggleWishlist} style={styles.gridWishlistButton}>
          <Icon
            name={isInWishlist ? 'favorite' : 'favorite-border'}
            size={18}
            color={isInWishlist ? '#FF4444' : '#999'}
          />
        </TouchableOpacity>

        {/* Stock indicator */}
        {!product.inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.brandText}>{product.brand}</Text>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingContainer}>
          <Rating rating={product.rating} size={12} showText />
        </View>

        <PriceDisplay
          price={product.price}
          originalPrice={product.originalPrice}
          memberDiscount={product.memberDiscount}
          loyaltyPoints={product.loyaltyPoints}
          size="small"
          showDiscount
        />

        <TouchableOpacity
          onPress={handleAddToCart}
          style={[styles.gridAddToCartButton, !product.inStock && styles.disabledButton]}
          disabled={!product.inStock}>
          <Icon name="add-shopping-cart" size={16} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid layout styles
  gridContainer: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'column',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: '#4CAF50',
  },
  saleBadge: {
    backgroundColor: '#FF4444',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  gridWishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  gridAddToCartButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  // List layout styles
  listContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  wishlistButton: {
    padding: 4,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  // Shared styles
  brandText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  addToCartButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 6,
    padding: 8,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});

export default ProductCard;
