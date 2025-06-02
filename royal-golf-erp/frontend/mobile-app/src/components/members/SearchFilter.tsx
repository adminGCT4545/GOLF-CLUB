import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { MemberSearchFilter, MembershipType, MembershipTier } from '../../types/member';

interface SearchFilterProps {
  filters: MemberSearchFilter;
  onFiltersChange: (filters: MemberSearchFilter) => void;
  onSearch: () => void;
  onClear: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const updateFilter = (key: keyof MemberSearchFilter, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleMembershipType = (type: MembershipType) => {
    const currentTypes = filters.membershipTypes;
    const updatedTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    updateFilter('membershipTypes', updatedTypes);
  };

  const toggleMembershipTier = (tier: MembershipTier) => {
    const currentTiers = filters.membershipTiers;
    const updatedTiers = currentTiers.includes(tier)
      ? currentTiers.filter((t) => t !== tier)
      : [...currentTiers, tier];
    updateFilter('membershipTiers', updatedTiers);
  };

  const handleClear = () => {
    onClear();
    setShowAdvancedFilters(false);
    setIsModalVisible(false);
  };

  const renderMembershipTypeFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>Membership Types</Text>
      <View style={styles.checkboxGroup}>
        {Object.values(MembershipType).map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.checkboxItem}
            onPress={() => toggleMembershipType(type)}>
            <Icon
              name={
                filters.membershipTypes.includes(type) ? 'check-box' : 'check-box-outline-blank'
              }
              size={24}
              color={filters.membershipTypes.includes(type) ? '#007AFF' : '#757575'}
            />
            <Text style={styles.checkboxLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMembershipTierFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>Membership Tiers</Text>
      <View style={styles.checkboxGroup}>
        {Object.values(MembershipTier).map((tier) => (
          <TouchableOpacity
            key={tier}
            style={styles.checkboxItem}
            onPress={() => toggleMembershipTier(tier)}>
            <Icon
              name={
                filters.membershipTiers.includes(tier) ? 'check-box' : 'check-box-outline-blank'
              }
              size={24}
              color={filters.membershipTiers.includes(tier) ? '#007AFF' : '#757575'}
            />
            <Text style={styles.checkboxLabel}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHandicapRangeFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>Handicap Range</Text>
      <View style={styles.rangeInputs}>
        <View style={styles.rangeInput}>
          <Text style={styles.rangeLabel}>Min:</Text>
          <TextInput
            style={styles.rangeTextInput}
            value={filters.handicapRange.min?.toString() || ''}
            onChangeText={(text) => {
              const value = text ? parseFloat(text) : undefined;
              updateFilter('handicapRange', { ...filters.handicapRange, min: value });
            }}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.rangeInput}>
          <Text style={styles.rangeLabel}>Max:</Text>
          <TextInput
            style={styles.rangeTextInput}
            value={filters.handicapRange.max?.toString() || ''}
            onChangeText={(text) => {
              const value = text ? parseFloat(text) : undefined;
              updateFilter('handicapRange', { ...filters.handicapRange, max: value });
            }}
            placeholder="54"
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>Sort Options</Text>
      <View style={styles.sortRow}>
        <View style={styles.sortBy}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <Picker
            selectedValue={filters.sortBy}
            style={styles.picker}
            onValueChange={(value) => updateFilter('sortBy', value)}>
            <Picker.Item label="Name" value="name" />
            <Picker.Item label="Join Date" value="joinDate" />
            <Picker.Item label="Handicap" value="handicap" />
            <Picker.Item label="Last Seen" value="lastSeen" />
          </Picker>
        </View>
        <View style={styles.sortOrder}>
          <Text style={styles.sortLabel}>Order:</Text>
          <Picker
            selectedValue={filters.sortOrder}
            style={styles.picker}
            onValueChange={(value) => updateFilter('sortOrder', value)}>
            <Picker.Item label="Ascending" value="asc" />
            <Picker.Item label="Descending" value="desc" />
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderAdvancedFiltersModal = () => (
    <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setIsModalVisible(false)}>
            <Icon name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Advanced Filters</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {renderMembershipTypeFilter()}
          {renderMembershipTierFilter()}
          {renderHandicapRangeFilter()}

          <View style={styles.filterSection}>
            <View style={styles.switchRow}>
              <Text style={styles.filterLabel}>Online Members Only</Text>
              <Switch
                value={filters.isOnlineOnly}
                onValueChange={(value) => updateFilter('isOnlineOnly', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={filters.isOnlineOnly ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.switchRow}>
              <Text style={styles.filterLabel}>Has Handicap</Text>
              <Switch
                value={filters.hasHandicap}
                onValueChange={(value) => updateFilter('hasHandicap', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={filters.hasHandicap ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {renderSortOptions()}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.applyButton]}
            onPress={() => {
              onSearch();
              setIsModalVisible(false);
            }}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.membershipTypes.length > 0) {
      count++;
    }
    if (filters.membershipTiers.length > 0) {
      count++;
    }
    if (filters.handicapRange.min !== undefined || filters.handicapRange.max !== undefined) {
      count++;
    }
    if (filters.isOnlineOnly) {
      count++;
    }
    if (filters.hasHandicap) {
      count++;
    }
    return count;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={filters.searchTerm}
            onChangeText={(text) => updateFilter('searchTerm', text)}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          {filters.searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => updateFilter('searchTerm', '')}
              style={styles.clearIcon}>
              <Icon name="clear" size={20} color="#757575" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={() => setIsModalVisible(true)}>
          <Icon name="filter-list" size={20} color="#007AFF" />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showAdvancedFilters && (
        <View style={styles.quickFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.quickFilterChip, filters.isOnlineOnly && styles.quickFilterChipActive]}
              onPress={() => updateFilter('isOnlineOnly', !filters.isOnlineOnly)}>
              <Text
                style={[
                  styles.quickFilterText,
                  filters.isOnlineOnly && styles.quickFilterTextActive,
                ]}>
                Online
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickFilterChip, filters.hasHandicap && styles.quickFilterChipActive]}
              onPress={() => updateFilter('hasHandicap', !filters.hasHandicap)}>
              <Text
                style={[
                  styles.quickFilterText,
                  filters.hasHandicap && styles.quickFilterTextActive,
                ]}>
                Has Handicap
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {renderAdvancedFiltersModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333333',
  },
  clearIcon: {
    padding: 4,
  },
  filterButton: {
    position: 'relative',
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickFilters: {
    marginTop: 12,
  },
  quickFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  quickFilterChipActive: {
    backgroundColor: '#007AFF',
  },
  quickFilterText: {
    fontSize: 14,
    color: '#333333',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  clearButton: {
    fontSize: 16,
    color: '#FF3B30',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
    width: '45%',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
  },
  rangeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  rangeLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  rangeTextInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortBy: {
    flex: 1,
    marginRight: 8,
  },
  sortOrder: {
    flex: 1,
    marginLeft: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  modalActions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchFilter;
