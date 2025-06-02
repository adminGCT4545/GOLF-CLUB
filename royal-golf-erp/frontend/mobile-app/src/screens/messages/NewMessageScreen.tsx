import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { MemberSelector } from '../../components/messages';
import { LoadingOverlay } from '../../components/common';
import { createConversation } from '../../store/slices/messageSlice';
import { ConversationType } from '../../types/message';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface RootState {
  member: {
    members: any[];
    isLoading: boolean;
  };
  message: {
    isLoading: boolean;
    error: string | null;
  };
}

const NewMessageScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { members, isLoading: isLoadingMembers } = useSelector((state: RootState) => state.member);
  const { isLoading: isCreatingConversation, error } = useSelector(
    (state: RootState) => state.message
  );

  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Convert club members to member format
  const availableMembers: Member[] = members.map((member) => ({
    id: member.id,
    name: member.name || `${member.firstName} ${member.lastName}`,
    avatar: member.profilePicture,
    email: member.email,
    isOnline: member.isOnline || false,
    lastSeen: member.lastSeen ? new Date(member.lastSeen) : undefined,
  }));

  useEffect(() => {
    // Set navigation header
    navigation.setOptions({
      title: selectedMembers.length > 1 ? 'New Group Chat' : 'New Message',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNext}
          disabled={selectedMembers.length === 0 || isCreating}
          style={[
            styles.headerButton,
            selectedMembers.length === 0 && styles.headerButtonDisabled,
          ]}>
          <Text
            style={[
              styles.headerButtonText,
              selectedMembers.length === 0 && styles.headerButtonTextDisabled,
            ]}>
            {selectedMembers.length > 1 ? 'Next' : 'Chat'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [selectedMembers, isCreating, navigation]);

  const handleNext = async () => {
    if (selectedMembers.length === 0) {
      return;
    }

    if (selectedMembers.length === 1) {
      // Create direct message conversation
      await createDirectConversation();
    } else {
      // Navigate to group chat setup
      navigation.navigate('GroupChatSetup', {
        selectedMembers: selectedMembers.map((member) => member.id),
      });
    }
  };

  const createDirectConversation = async () => {
    setIsCreating(true);

    try {
      const participantIds = selectedMembers.map((member) => member.id);

      const result = await dispatch(
        createConversation({
          type: ConversationType.DIRECT,
          participantIds,
        })
      );

      if (result.meta.requestStatus === 'fulfilled') {
        const conversation = result.payload;

        // Navigate to the new conversation
        navigation.navigate('Chat', {
          conversationId: conversation.id,
          conversationTitle: selectedMembers[0].name,
        });
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Failed to create direct conversation:', error);
      Alert.alert('Error', 'Failed to create conversation. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectionChange = (members: Member[]) => {
    setSelectedMembers(members);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real app, you might want to fetch filtered members from the server
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const getSelectionSummary = (): string => {
    const count = selectedMembers.length;
    if (count === 0) {
      return 'Select members to start messaging';
    }
    if (count === 1) {
      return `Start a direct message with ${selectedMembers[0].name}`;
    }
    return `Create a group chat with ${count} members`;
  };

  if (isLoadingMembers) {
    return <LoadingOverlay message="Loading members..." />;
  }

  if (isCreating || isCreatingConversation) {
    return <LoadingOverlay message="Creating conversation..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {selectedMembers.length > 1 ? 'New Group Chat' : 'New Message'}
        </Text>
        <Text style={styles.headerSubtitle}>{getSelectionSummary()}</Text>
      </View>

      <View style={styles.content}>
        <MemberSelector
          members={availableMembers}
          selectedMembers={selectedMembers}
          onSelectionChange={handleSelectionChange}
          onSearch={handleSearch}
          showSearch={true}
          placeholder="Search club members..."
          emptyMessage="No members found"
          isLoading={isLoadingMembers}
        />
      </View>

      {selectedMembers.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.createButton} onPress={handleNext} disabled={isCreating}>
            <Icon
              name={selectedMembers.length > 1 ? 'arrow-forward' : 'chat'}
              size={20}
              color="#fff"
              style={styles.createButtonIcon}
            />
            <Text style={styles.createButtonText}>
              {selectedMembers.length > 1 ? 'Continue' : 'Start Chat'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerButtonTextDisabled: {
    color: '#999',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewMessageScreen;
