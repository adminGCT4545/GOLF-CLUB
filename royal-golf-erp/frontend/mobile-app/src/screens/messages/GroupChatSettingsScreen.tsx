import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-picker';

import { LoadingOverlay } from '../../components/common';
import {
  updateGroupSettings,
  addParticipants,
  removeParticipant,
  updateParticipantRole,
  leaveConversation,
  muteConversation,
  archiveConversation,
} from '../../store/slices/messageSlice';
import {
  Conversation,
  ConversationParticipant,
  ParticipantRole,
  ConversationType, 
} from '../../types/message';

interface RootState {
  message: {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    isLoading: boolean;
    error: string | null;
  };
  auth: {
    user: {
      id: string;
      name: string;
    };
  };
}

const GroupChatSettingsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { conversationId } = route.params as { conversationId: string };

  const { conversations, isLoading, error } = useSelector((state: RootState) => state.message);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const conversation = conversations.find((c) => c.id === conversationId);

  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || '');
  const [groupDescription, setGroupDescription] = useState(
    conversation?.groupSettings?.description || ''
  );
  const [groupPhoto, setGroupPhoto] = useState(conversation?.avatar || '');
  const [saving, setSaving] = useState(false);

  // Check if current user is admin/owner
  const currentUserRole = conversation?.participants.find((p) => p.userId === currentUser.id)?.role;
  const isAdmin =
    currentUserRole === ParticipantRole.ADMIN || currentUserRole === ParticipantRole.OWNER;
  const isOwner = currentUserRole === ParticipantRole.OWNER;

  useEffect(() => {
    navigation.setOptions({
      title: conversation?.type === ConversationType.GROUP ? 'Group Info' : 'Contact Info',
      headerRight: () =>
        isAdmin && (
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{isEditing ? 'Done' : 'Edit'}</Text>
          </TouchableOpacity>
        ),
    });
  }, [conversation, isEditing, isAdmin, navigation]);

  if (!conversation) {
    return <LoadingOverlay message="Loading conversation..." />;
  }

  const handleEdit = async () => {
    if (isEditing) {
      // Save changes
      await saveChanges();
    }
    setIsEditing(!isEditing);
  };

  const saveChanges = async () => {
    setSaving(true);

    try {
      await dispatch(
        updateGroupSettings({
          conversationId,
          name: groupName.trim(),
          description: groupDescription.trim(),
          groupPhoto: groupPhoto,
        })
      );

      Alert.alert('Success', 'Group settings updated successfully');
    } catch (error) {
      console.error('Failed to update group settings:', error);
      Alert.alert('Error', 'Failed to update group settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = () => {
    const options = ['Camera', 'Photo Library', 'Remove Photo', 'Cancel'];

    Alert.alert(
      'Group Photo',
      'Choose an option',
      options.map((option) => ({
        text: option,
        onPress: () => handlePhotoOption(option),
        style: option === 'Remove Photo' ? 'destructive' : 'default',
      }))
    );
  };

  const handlePhotoOption = (option: string) => {
    switch (option) {
      case 'Camera':
        openCamera();
        break;
      case 'Photo Library':
        openImagePicker();
        break;
      case 'Remove Photo':
        setGroupPhoto('');
        break;
    }
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 400,
      maxWidth: 400,
    };

    ImagePicker.launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        setGroupPhoto(response.assets[0].uri || '');
      }
    });
  };

  const openImagePicker = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 400,
      maxWidth: 400,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        setGroupPhoto(response.assets[0].uri || '');
      }
    });
  };

  const handleParticipantPress = (participant: ConversationParticipant) => {
    if (!isAdmin || participant.userId === currentUser.id) {return;}

    const options = ['View Profile'];

    if (participant.role !== ParticipantRole.OWNER) {
      if (participant.role === ParticipantRole.ADMIN) {
        options.push('Remove Admin');
      } else {
        options.push('Make Admin');
      }
      options.push('Remove from Group');
    }

    options.push('Cancel');

    Alert.alert(
      participant.userName,
      '',
      options.map((option) => ({
        text: option,
        onPress: () => handleParticipantAction(participant, option),
        style: option === 'Remove from Group' ? 'destructive' : 'default',
      }))
    );
  };

  const handleParticipantAction = async (participant: ConversationParticipant, action: string) => {
    try {
      switch (action) {
        case 'Make Admin':
          await dispatch(
            updateParticipantRole({
              conversationId,
              participantId: participant.userId,
              role: ParticipantRole.ADMIN,
            })
          );
          break;
        case 'Remove Admin':
          await dispatch(
            updateParticipantRole({
              conversationId,
              participantId: participant.userId,
              role: ParticipantRole.MEMBER,
            })
          );
          break;
        case 'Remove from Group':
          confirmRemoveParticipant(participant);
          break;
        case 'View Profile':
          navigation.navigate('MemberProfile', { memberId: participant.userId });
          break;
      }
    } catch (error) {
      console.error('Failed to perform participant action:', error);
      Alert.alert('Error', 'Failed to perform action. Please try again.');
    }
  };

  const confirmRemoveParticipant = (participant: ConversationParticipant) => {
    Alert.alert(
      'Remove Participant',
      `Are you sure you want to remove ${participant.userName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => handleRemoveParticipant(participant.userId),
        },
      ]
    );
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await dispatch(removeParticipant({ conversationId, participantId }));
    } catch (error) {
      console.error('Failed to remove participant:', error);
      Alert.alert('Error', 'Failed to remove participant. Please try again.');
    }
  };

  const handleAddMembers = () => {
    navigation.navigate('AddGroupMembers', { conversationId });
  };

  const handleMuteToggle = async (value: boolean) => {
    try {
      await dispatch(
        muteConversation({
          conversationId,
          isMuted: value,
        })
      );
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    }
  };

  const handleArchiveToggle = async (value: boolean) => {
    try {
      await dispatch(
        archiveConversation({
          conversationId,
          isArchived: value,
        })
      );

      if (value) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to toggle archive:', error);
      Alert.alert('Error', 'Failed to archive conversation.');
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      "Are you sure you want to leave this group? You won't be able to see new messages.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Group',
          style: 'destructive',
          onPress: confirmLeaveGroup,
        },
      ]
    );
  };

  const confirmLeaveGroup = async () => {
    try {
      await dispatch(leaveConversation(conversationId));
      navigation.navigate('Messages');
    } catch (error) {
      console.error('Failed to leave group:', error);
      Alert.alert('Error', 'Failed to leave group. Please try again.');
    }
  };

  const renderGroupPhoto = () => (
    <TouchableOpacity
      style={styles.photoContainer}
      onPress={isEditing ? handlePhotoChange : undefined}
      disabled={!isEditing}>
      {groupPhoto ? (
        <Image source={{ uri: groupPhoto }} style={styles.groupPhoto} />
      ) : (
        <View style={[styles.groupPhoto, styles.defaultPhoto]}>
          <Icon name="group" size={48} color="#fff" />
        </View>
      )}
      {isEditing && (
        <View style={styles.photoOverlay}>
          <Icon name="camera-alt" size={24} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderParticipant = (participant: ConversationParticipant, index: number) => (
    <TouchableOpacity
      key={participant.userId}
      style={styles.participantItem}
      onPress={() => handleParticipantPress(participant)}
      disabled={!isAdmin || participant.userId === currentUser.id}>
      <View style={styles.participantInfo}>
        {participant.userAvatar ? (
          <Image source={{ uri: participant.userAvatar }} style={styles.participantAvatar} />
        ) : (
          <View style={[styles.participantAvatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>{participant.userName.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>
            {participant.userName}
            {participant.userId === currentUser.id && ' (You)'}
          </Text>
          <Text style={styles.participantRole}>
            {participant.role === ParticipantRole.OWNER && 'Owner'}
            {participant.role === ParticipantRole.ADMIN && 'Admin'}
            {participant.role === ParticipantRole.MEMBER && 'Member'}
          </Text>
        </View>
      </View>

      {participant.isOnline && <View style={styles.onlineIndicator} />}
    </TouchableOpacity>
  );

  if (saving) {
    return <LoadingOverlay message="Saving changes..." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Group Photo and Name */}
      <View style={styles.header}>
        {renderGroupPhoto()}

        <View style={styles.groupInfoContainer}>
          {isEditing ? (
            <TextInput
              style={styles.groupNameInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group name"
              maxLength={50}
            />
          ) : (
            <Text style={styles.groupName}>{groupName || 'Unnamed Group'}</Text>
          )}

          <Text style={styles.participantCount}>
            {conversation.participants.length} participants
          </Text>
        </View>
      </View>

      {/* Group Description */}
      {(isEditing || groupDescription) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          {isEditing ? (
            <TextInput
              style={styles.descriptionInput}
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholder="Add a description..."
              multiline
              maxLength={200}
            />
          ) : (
            <Text style={styles.description}>{groupDescription || 'No description'}</Text>
          )}
        </View>
      )}

      {/* Participants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Participants ({conversation.participants.length})</Text>
          {isAdmin && (
            <TouchableOpacity onPress={handleAddMembers}>
              <Icon name="person-add" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {conversation.participants.map(renderParticipant)}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Mute Notifications</Text>
            <Text style={styles.settingSubtitle}>
              {conversation.isMuted ? 'Notifications are muted' : 'You will receive notifications'}
            </Text>
          </View>
          <Switch
            value={conversation.isMuted}
            onValueChange={handleMuteToggle}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Archive Conversation</Text>
            <Text style={styles.settingSubtitle}>
              Hide this conversation from your main chat list
            </Text>
          </View>
          <Switch
            value={conversation.isArchived}
            onValueChange={handleArchiveToggle}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionItem} onPress={handleLeaveGroup}>
          <Icon name="exit-to-app" size={24} color="#FF3B30" />
          <Text style={[styles.actionText, styles.destructiveAction]}>Leave Group</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  groupPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultPhoto: {
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfoContainer: {
    alignItems: 'center',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  groupNameInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: 'center',
    marginBottom: 4,
  },
  participantCount: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    maxHeight: 100,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  participantRole: {
    fontSize: 12,
    color: '#666',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginLeft: 12,
  },
  destructiveAction: {
    color: '#FF3B30',
  },
});

export default GroupChatSettingsScreen;
