import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CartItem as CartItemType } from '../../types/commerce';
import PriceDisplay from './PriceDisplay';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onPress?: (item: CartItemType) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove, onPress }) => {
  const handleQuantityChange = (change: number) => {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      onUpdateQuantity(item.id, newQuantity);
    } else {
      onRemove(item.id);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  const totalPrice = item.product.price * item.quantity;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <Image source={{ uri: item.product.images[0] }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {item.product.name}
            </Text>
            <Text style={styles.brand}>{item.product.brand}</Text>
          </View>

          <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.removeButton}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Product variants */}
        {(item.selectedSize || item.selectedColor) && (
          <View style={styles.variantsContainer}>
            {item.selectedSize && (
              <View style={styles.variant}>
                <Text style={styles.variantLabel}>Size:</Text>
                <Text style={styles.variantValue}>{item.selectedSize}</Text>
              </View>
            )}
            {item.selectedColor && (
              <View style={styles.variant}>
                <Text style={styles.variantLabel}>Color:</Text>
                <Text style={styles.variantValue}>{item.selectedColor}</Text>
              </View>
            )}
          </View>
        )}

        {/* Customizations */}
        {item.customizations && (
          <Text style={styles.customizations} numberOfLines={2}>
            {item.customizations}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <PriceDisplay price={item.product.price} size="small" />
            {item.quantity > 1 && (
              <Text style={styles.totalPrice}>Total: ${totalPrice.toFixed(2)}</Text>
            )}
          </View>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={() => handleQuantityChange(-1)}
              style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
              disabled={item.quantity <= 1}>
              <Icon name="remove" size={16} color={item.quantity <= 1 ? '#CCC' : '#666'} />
            </TouchableOpacity>

            <Text style={styles.quantity}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={() => handleQuantityChange(1)}
              style={[styles.quantityButton, !item.product.inStock && styles.disabledButton]}
              disabled={!item.product.inStock}>
              <Icon name="add" size={16} color={!item.product.inStock ? '#CCC' : '#666'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stock status */}
        {!item.product.inStock && (
          <View style={styles.stockWarning}>
            <Icon name="warning" size={16} color="#FF9800" />
            <Text style={styles.stockWarningText}>Currently out of stock</Text>
          </View>
        )}

        {/* Low stock warning */}
        {item.product.inStock &&
          item.product.stockQuantity < 5 &&
          item.product.stockQuantity > 0 && (
            <View style={styles.lowStockWarning}>
              <Icon name="info" size={14} color="#FF5722" />
              <Text style={styles.lowStockText}>
                Only {item.product.stockQuantity} left in stock
              </Text>
            </View>
          )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  brand: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  variantsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  variant: {
    flexDirection: 'row',
    marginRight: 16,
  },
  variantLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  variantValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  customizations: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  totalPrice: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    margin: 2,
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 24,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  stockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
  },
  stockWarningText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lowStockText: {
    fontSize: 11,
    color: '#FF5722',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default CartItem;
