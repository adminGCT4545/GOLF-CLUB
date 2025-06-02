import React, { useEffect, useState } from 'react';
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchMenu, addToOrder } from '../../store/slices/fnbSlice';
import PriceDisplay from '../../components/commerce/PriceDisplay';
import { MenuItem, DietaryTag, Customization, PortionSize } from '../../types/commerce';

const { width } = Dimensions.get('window');

interface MenuItemDetailsScreenProps {
  navigation: any;
  route: any;
}

const MenuItemDetailsScreen: React.FC<MenuItemDetailsScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { menu, currentOrder, loading } = useSelector((state: RootState) => state.fnb);

  const { menuItemId } = route.params;
  const menuItem = menu.find((item) => item.id === menuItemId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedPortionSize, setSelectedPortionSize] = useState<PortionSize | null>(null);
  const [selectedCustomizations, setSelectedCustomizations] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showNutritionalInfo, setShowNutritionalInfo] = useState(false);

  useEffect(() => {
    if (!menuItem) {
      // Fetch menu item details if not in current menu
      dispatch(fetchMenu({ menuItemId }) as any);
    }
  }, [menuItemId, menuItem, dispatch]);

  useEffect(() => {
    if (menuItem && menuItem.portionSizes.length > 0) {
      setSelectedPortionSize(menuItem.portionSizes[0]);
    }
  }, [menuItem]);

  const handleAddToOrder = () => {
    if (!menuItem) {
      return;
    }

    // Validate required customizations
    const requiredCustomizations = menuItem.customizations.filter((c) => c.required);
    for (const customization of requiredCustomizations) {
      if (
        !selectedCustomizations[customization.id] ||
        selectedCustomizations[customization.id].length === 0
      ) {
        Alert.alert('Required Selection', `Please select ${customization.name.toLowerCase()}.`);
        return;
      }
    }

    const customizationsList = Object.values(selectedCustomizations).flat();

    dispatch(
      addToOrder({
        menuItemId: menuItem.id,
        quantity,
        portionSize: selectedPortionSize?.name,
        customizations: customizationsList,
        specialInstructions: specialInstructions || undefined,
      }) as any
    );

    Alert.alert('Added to Order', `${menuItem.name} has been added to your order.`, [
      { text: 'Continue Browsing', style: 'default' },
      {
        text: 'View Order',
        onPress: () => navigation.navigate('FnBOrder'),
        style: 'default',
      },
    ]);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleCustomizationChange = (
    customizationId: string,
    optionId: string,
    customization: Customization
  ) => {
    setSelectedCustomizations((prev) => {
      const current = prev[customizationId] || [];

      if (customization.type === 'single') {
        return { ...prev, [customizationId]: [optionId] };
      } else {
        if (current.includes(optionId)) {
          return { ...prev, [customizationId]: current.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [customizationId]: [...current, optionId] };
        }
      }
    });
  };

  const calculateTotalPrice = () => {
    if (!menuItem) {
      return 0;
    }

    let basePrice = menuItem.price;

    // Add portion size price
    if (selectedPortionSize) {
      basePrice += selectedPortionSize.additionalPrice;
    }

    // Add customization prices
    Object.entries(selectedCustomizations).forEach(([customizationId, optionIds]) => {
      const customization = menuItem.customizations.find((c) => c.id === customizationId);
      if (customization) {
        optionIds.forEach((optionId) => {
          const option = customization.options.find((o) => o.id === optionId);
          if (option) {
            basePrice += option.additionalPrice;
          }
        });
      }
    });

    return basePrice * quantity;
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
    if (!menuItem?.spiceLevel) {
      return null;
    }

    const spiceIcons = [];
    for (let i = 1; i <= 3; i++) {
      spiceIcons.push(
        <Icon
          key={i}
          name="local-fire-department"
          size={16}
          color={i <= menuItem.spiceLevel ? getSpiceLevelColor(menuItem.spiceLevel) : '#E0E0E0'}
        />
      );
    }

    return (
      <View style={styles.spiceLevelContainer}>
        <Text style={styles.spiceLevelLabel}>Spice Level:</Text>
        <View style={styles.spiceIcons}>{spiceIcons}</View>
      </View>
    );
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity onPress={() => setSelectedImageIndex(index)}>
      <Image source={{ uri: item }} style={styles.thumbnailImage} />
    </TouchableOpacity>
  );

  const renderPortionSize = (size: PortionSize) => (
    <TouchableOpacity
      key={size.id}
      style={[styles.portionOption, selectedPortionSize?.id === size.id && styles.selectedOption]}
      onPress={() => setSelectedPortionSize(size)}>
      <Text
        style={[
          styles.portionName,
          selectedPortionSize?.id === size.id && styles.selectedOptionText,
        ]}>
        {size.name}
      </Text>
      {size.additionalPrice > 0 && (
        <Text
          style={[
            styles.portionPrice,
            selectedPortionSize?.id === size.id && styles.selectedOptionText,
          ]}>
          +${size.additionalPrice.toFixed(2)}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderCustomization = (customization: Customization) => (
    <View key={customization.id} style={styles.customizationSection}>
      <Text style={styles.customizationTitle}>
        {customization.name}
        {customization.required && <Text style={styles.requiredText}> *</Text>}
      </Text>
      <Text style={styles.customizationSubtitle}>
        {customization.type === 'single' ? 'Select one' : 'Select multiple'}
      </Text>

      <View style={styles.customizationOptions}>
        {customization.options.map((option) => {
          const isSelected = selectedCustomizations[customization.id]?.includes(option.id) || false;

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.customizationOption, isSelected && styles.selectedCustomizationOption]}
              onPress={() => handleCustomizationChange(customization.id, option.id, customization)}>
              <Icon
                name={
                  customization.type === 'single'
                    ? isSelected
                      ? 'radio-button-checked'
                      : 'radio-button-unchecked'
                    : isSelected
                    ? 'check-box'
                    : 'check-box-outline-blank'
                }
                size={20}
                color={isSelected ? '#FF6B35' : '#666'}
              />
              <View style={styles.customizationOptionContent}>
                <Text
                  style={[
                    styles.customizationOptionName,
                    isSelected && styles.selectedCustomizationOptionText,
                  ]}>
                  {option.name}
                </Text>
                {option.additionalPrice > 0 && (
                  <Text style={styles.customizationOptionPrice}>
                    +${option.additionalPrice.toFixed(2)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (!menuItem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading menu item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInOrder = currentOrder.some((item) => item.menuItemId === menuItem.id);
  const totalPrice = calculateTotalPrice();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Item</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Item Images */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: menuItem.images[selectedImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {menuItem.images.length > 1 && (
            <FlatList
              data={menuItem.images}
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
            {menuItem.isDailySpecial && (
              <View style={styles.specialBadge}>
                <Text style={styles.badgeText}>TODAY'S SPECIAL</Text>
              </View>
            )}
            {!menuItem.isAvailable && (
              <View style={styles.unavailableBadge}>
                <Text style={styles.badgeText}>UNAVAILABLE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Item Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{menuItem.name}</Text>
          <Text style={styles.itemDescription}>{menuItem.description}</Text>

          <PriceDisplay price={menuItem.price} size="large" />

          {/* Meta Information */}
          <View style={styles.metaContainer}>
            <View style={styles.cookingTimeContainer}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.cookingTimeText}>{menuItem.cookingTime} minutes</Text>
            </View>
            {renderSpiceLevel()}
          </View>

          {/* Dietary Tags */}
          {menuItem.dietary.length > 0 && (
            <View style={styles.dietarySection}>
              <Text style={styles.dietaryTitle}>Dietary Information</Text>
              <View style={styles.dietaryTags}>
                {menuItem.dietary.map((tag) => {
                  const iconInfo = getDietaryIcon(tag);
                  return (
                    <View key={tag} style={styles.dietaryTag}>
                      <Icon name={iconInfo.name} size={16} color={iconInfo.color} />
                      <Text style={styles.dietaryTagText}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Portion Sizes */}
        {menuItem.portionSizes.length > 0 && (
          <View style={styles.optionsSection}>
            <Text style={styles.optionsTitle}>Portion Size</Text>
            <View style={styles.portionsContainer}>
              {menuItem.portionSizes.map(renderPortionSize)}
            </View>
          </View>
        )}

        {/* Customizations */}
        {menuItem.customizations.length > 0 && (
          <View style={styles.customizationsSection}>
            <Text style={styles.optionsTitle}>Customizations</Text>
            {menuItem.customizations.map(renderCustomization)}
          </View>
        )}

        {/* Special Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.optionsTitle}>Special Instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Any special requests for this item..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Ingredients */}
        <View style={styles.ingredientsSection}>
          <Text style={styles.optionsTitle}>Ingredients</Text>
          <Text style={styles.ingredientsText}>{menuItem.ingredients.join(', ')}</Text>
        </View>

        {/* Allergens */}
        {menuItem.allergens.length > 0 && (
          <View style={styles.allergensSection}>
            <Text style={styles.optionsTitle}>Allergens</Text>
            <View style={styles.allergensList}>
              {menuItem.allergens.map((allergen, index) => (
                <View key={index} style={styles.allergenTag}>
                  <Icon name="warning" size={14} color="#FF9800" />
                  <Text style={styles.allergenText}>{allergen}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nutritional Information */}
        <View style={styles.nutritionalSection}>
          <TouchableOpacity
            style={styles.nutritionalHeader}
            onPress={() => setShowNutritionalInfo(!showNutritionalInfo)}>
            <Text style={styles.optionsTitle}>Nutritional Information</Text>
            <Icon
              name={showNutritionalInfo ? 'expand-less' : 'expand-more'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>

          {showNutritionalInfo && (
            <View style={styles.nutritionalGrid}>
              <View style={styles.nutritionalItem}>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.calories}</Text>
                <Text style={styles.nutritionalLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.protein}g</Text>
                <Text style={styles.nutritionalLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.carbs}g</Text>
                <Text style={styles.nutritionalLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.fat}g</Text>
                <Text style={styles.nutritionalLabel}>Fat</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.fiber}g</Text>
                <Text style={styles.nutritionalLabel}>Fiber</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.sodium}mg</Text>
                <Text style={styles.nutritionalLabel}>Sodium</Text>
              </View>
            </View>
          )}
        </View>

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

            <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(1)}>
              <Icon name="add" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalPriceLabel}>Total</Text>
          <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addToOrderButton,
            (!menuItem.isAvailable || isInOrder) && styles.disabledAddButton,
          ]}
          onPress={handleAddToOrder}
          disabled={loading.order || !menuItem.isAvailable || isInOrder}>
          {loading.order ? (
            <Text style={styles.addToOrderText}>Adding...</Text>
          ) : (
            <>
              <Icon name={isInOrder ? 'check' : 'add'} size={20} color="#FFFFFF" />
              <Text style={styles.addToOrderText}>{isInOrder ? 'In Order' : 'Add to Order'}</Text>
            </>
          )}
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
  scrollView: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
  },
  mainImage: {
    width: width,
    height: width * 0.75,
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
  specialBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  unavailableBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  itemInfo: {
    padding: 16,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  cookingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  cookingTimeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  spiceLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spiceLevelLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  spiceIcons: {
    flexDirection: 'row',
  },
  dietarySection: {
    marginTop: 16,
  },
  dietaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dietaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  dietaryTagText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  optionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  portionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  portionOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  portionName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  portionPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  customizationsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  customizationSection: {
    marginBottom: 20,
  },
  customizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requiredText: {
    color: '#F44336',
  },
  customizationSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  customizationOptions: {
    marginLeft: 8,
  },
  customizationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedCustomizationOption: {
    backgroundColor: '#FFF3E0',
  },
  customizationOptionContent: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customizationOptionName: {
    fontSize: 14,
    color: '#333',
  },
  selectedCustomizationOptionText: {
    color: '#FF6B35',
    fontWeight: '500',
  },
  customizationOptionPrice: {
    fontSize: 12,
    color: '#666',
  },
  instructionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  ingredientsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ingredientsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  allergensSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFECB3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  allergenText: {
    fontSize: 12,
    color: '#FF8F00',
    marginLeft: 4,
    fontWeight: '500',
  },
  nutritionalSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nutritionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutritionalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  nutritionalItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  nutritionalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  nutritionalLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quantitySection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  bottomSpacing: {
    height: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priceContainer: {
    marginRight: 16,
  },
  totalPriceLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  addToOrderButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledAddButton: {
    backgroundColor: '#CCCCCC',
  },
  addToOrderText: {
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

export default MenuItemDetailsScreen;
