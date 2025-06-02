import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MenuItem, DietaryTag } from '../../types/commerce';
import PriceDisplay from '../commerce/PriceDisplay';

interface MenuItemCardProps {
  item: MenuItem;
  onPress: (item: MenuItem) => void;
  onAddToOrder: (item: MenuItem) => void;
  layout?: 'grid' | 'list';
}

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 48) / 2;

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onPress,
  onAddToOrder,
  layout = 'grid',
}) => {
  const handlePress = () => {
    onPress(item);
  };

  const handleAddToOrder = () => {
    onAddToOrder(item);
  };

  const getDietaryIcon = (tag: DietaryTag) => {
    switch (tag) {
      case 'vegetarian':
        return { name: 'eco', color: '#4CAF50' };
      case 'vegan':
        return { name: 'local-florist', color: '#8BC34A' };
      case 'gluten-free':
        return { name: 'grain', color: '#FF9800' };
      case 'dairy-free':
        return { name: 'no-meals', color: '#FF5722' };
      case 'keto':
        return { name: 'fitness-center', color: '#9C27B0' };
      case 'halal':
        return { name: 'verified', color: '#3F51B5' };
      case 'kosher':
        return { name: 'verified', color: '#3F51B5' };
      default:
        return { name: 'info', color: '#666' };
    }
  };

  const getSpiceLevelColor = (level: number) => {
    if (level <= 1) {
      return '#4CAF50';
    }
    if (level <= 2) {
      return '#FF9800';
    }
    return '#F44336';
  };

  const renderSpiceLevel = () => {
    if (!item.spiceLevel) {
      return null;
    }

    const spiceIcons = [];
    for (let i = 1; i <= 3; i++) {
      spiceIcons.push(
        <Icon
          key={i}
          name="local-fire-department"
          size={12}
          color={i <= item.spiceLevel ? getSpiceLevelColor(item.spiceLevel) : '#E0E0E0'}
        />
      );
    }

    return <View style={styles.spiceLevelContainer}>{spiceIcons}</View>;
  };

  if (layout === 'list') {
    return (
      <TouchableOpacity style={styles.listContainer} onPress={handlePress} activeOpacity={0.7}>
        <Image source={{ uri: item.images[0] }} style={styles.listImage} />
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={2}>
              {item.name}
            </Text>
            {item.isDailySpecial && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialBadgeText}>SPECIAL</Text>
              </View>
            )}
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.metaContainer}>
            <View style={styles.timeContainer}>
              <Icon name="schedule" size={14} color="#666" />
              <Text style={styles.timeText}>{item.cookingTime} min</Text>
            </View>
            {renderSpiceLevel()}
          </View>

          <View style={styles.dietaryTags}>
            {item.dietary.slice(0, 3).map((tag) => {
              const iconInfo = getDietaryIcon(tag);
              return (
                <View key={tag} style={styles.dietaryTag}>
                  <Icon name={iconInfo.name} size={12} color={iconInfo.color} />
                </View>
              );
            })}
            {item.dietary.length > 3 && (
              <Text style={styles.moreTags}>+{item.dietary.length - 3}</Text>
            )}
          </View>

          <View style={styles.listFooter}>
            <PriceDisplay price={item.price} size="small" />

            <TouchableOpacity
              onPress={handleAddToOrder}
              style={[styles.addButton, !item.isAvailable && styles.disabledButton]}
              disabled={!item.isAvailable}>
              <Icon name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {!item.isAvailable && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Currently Unavailable</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gridContainer} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.images[0] }} style={styles.gridImage} />

        {/* Badges */}
        <View style={styles.badgesContainer}>
          {item.isDailySpecial && (
            <View style={styles.specialBadge}>
              <Text style={styles.specialBadgeText}>SPECIAL</Text>
            </View>
          )}
        </View>

        {/* Availability overlay */}
        {!item.isAvailable && (
          <View style={styles.unavailableImageOverlay}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.timeContainer}>
            <Icon name="schedule" size={12} color="#666" />
            <Text style={styles.gridTimeText}>{item.cookingTime} min</Text>
          </View>
          {renderSpiceLevel()}
        </View>

        <View style={styles.dietaryTags}>
          {item.dietary.slice(0, 2).map((tag) => {
            const iconInfo = getDietaryIcon(tag);
            return (
              <View key={tag} style={styles.dietaryTag}>
                <Icon name={iconInfo.name} size={10} color={iconInfo.color} />
              </View>
            );
          })}
          {item.dietary.length > 2 && (
            <Text style={styles.gridMoreTags}>+{item.dietary.length - 2}</Text>
          )}
        </View>

        <PriceDisplay price={item.price} size="small" />

        <TouchableOpacity
          onPress={handleAddToOrder}
          style={[styles.gridAddButton, !item.isAvailable && styles.disabledButton]}
          disabled={!item.isAvailable}>
          <Icon name="add" size={14} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
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
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  specialBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specialBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  unavailableImageOverlay: {
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
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gridAddButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  gridTimeText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  gridMoreTags: {
    fontSize: 8,
    color: '#999',
    marginLeft: 4,
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
    position: 'relative',
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
    marginBottom: 4,
  },
  listTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  // Shared styles
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  spiceLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dietaryTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dietaryTag: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  moreTags: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  unavailableText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MenuItemCard;
