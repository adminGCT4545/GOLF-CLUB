import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface MemberSelectorProps {
  members: Member[];
  selectedMembers: Member[];
  onSelectionChange: (selectedMembers: Member[]) => void;
  maxSelections?: number;
  showSearch?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({
  members,
  selectedMembers,
  onSelectionChange,
  maxSelections,
  showSearch = true,
  placeholder = 'Search members...',
  emptyMessage = 'No members found',
  onSearch,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, members]);

  const filterMembers = () => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) || member.email?.toLowerCase().includes(query)
    );

    setFilteredMembers(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleMemberPress = (member: Member) => {
    const isSelected = selectedMembers.some((selected) => selected.id === member.id);

    if (isSelected) {
      // Remove member from selection
      const newSelection = selectedMembers.filter((selected) => selected.id !== member.id);
      onSelectionChange(newSelection);
    } else {
      // Add member to selection
      if (maxSelections && selectedMembers.length >= maxSelections) {
        Alert.alert('Selection Limit', `You can only select up to ${maxSelections} members.`, [
          { text: 'OK' },
        ]);
        return;
      }

      const newSelection = [...selectedMembers, member];
      onSelectionChange(newSelection);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const renderSelectedMember = ({ item }: { item: Member }) => (
    <View style={styles.selectedMemberChip}>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.selectedAvatar} />
      ) : (
        <View style={[styles.selectedAvatar, styles.defaultSelectedAvatar]}>
          <Text style={styles.selectedAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.selectedMemberName} numberOfLines={1}>
        {item.name.split(' ')[0]}
      </Text>
      <TouchableOpacity onPress={() => handleMemberPress(item)} style={styles.removeButton}>
        <Icon name="close" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderMember = ({ item }: { item: Member }) => {
    const isSelected = selectedMembers.some((selected) => selected.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.memberItem, isSelected && styles.selectedMemberItem]}
        onPress={() => handleMemberPress(item)}>
        <View style={styles.memberInfo}>
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
            ) : (
              <View style={[styles.memberAvatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.memberDetails}>
            <Text style={[styles.memberName, isSelected && styles.selectedMemberText]}>
              {item.name}
            </Text>
            {item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
            {!item.isOnline && item.lastSeen && (
              <Text style={styles.lastSeen}>Last seen {formatLastSeen(item.lastSeen)}</Text>
            )}
          </View>
        </View>

        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <Icon name="check-circle" size={24} color="#007AFF" />
          ) : (
            <View style={styles.unselectedCircle} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const formatLastSeen = (lastSeen: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="search" size={48} color="#ccc" />
      <Text style={styles.emptyText}>{emptyMessage}</Text>
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearSearchButton}>
          <Text style={styles.clearSearchText}>Clear search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingText}>Searching...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
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
      )}

      {selectedMembers.length > 0 && (
        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>
              Selected ({selectedMembers.length}
              {maxSelections && `/${maxSelections}`})
            </Text>
            <TouchableOpacity onPress={clearSelection}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={selectedMembers}
            renderItem={renderSelectedMember}
            keyExtractor={(item) => `selected-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedMembersList}
          />
        </View>
      )}

      <View style={styles.membersList}>
        {isLoading ? (
          renderLoadingState()
        ) : filteredMembers.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredMembers}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  selectedSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  clearAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  selectedMembersList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  selectedMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    marginRight: 8,
    maxWidth: 120,
  },
  selectedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  defaultSelectedAvatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  selectedMemberName: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 4,
    padding: 2,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectedMemberItem: {
    backgroundColor: '#F0F8FF',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  selectedMemberText: {
    color: '#007AFF',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  lastSeen: {
    fontSize: 12,
    color: '#999',
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 68,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default MemberSelector;
