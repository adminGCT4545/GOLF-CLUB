import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Image,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { RootState } from '../../store';
import { updateProfile, uploadProfilePhoto } from '../../store/slices/memberSlice';
import { FormInput, LoadingOverlay } from '../../components/common';
import {
  MemberProfile,
  MemberPreferences,
  PrivacySettings,
  EmergencyContact,
  Address,
} from '../../types/member';

interface MyProfileScreenProps {
  navigation: any;
}

const MyProfileScreen: React.FC<MyProfileScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { profile, isLoading } = useSelector((state: RootState) => state.member);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<MemberProfile>>({});
  const [preferences, setPreferences] = useState<MemberPreferences | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [activeSection, setActiveSection] = useState<
    'profile' | 'preferences' | 'privacy' | 'emergency' | 'address'
  >('profile');

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
      });
      setPreferences(profile.preferences || getDefaultPreferences());
      setPrivacy(profile.privacy || getDefaultPrivacySettings());
      setEmergencyContact(profile.emergencyContact || null);
      setAddress(profile.address || null);
    }
  }, [profile]);

  const getDefaultPreferences = (): MemberPreferences => ({
    notifications: {
      tournaments: true,
      bookings: true,
      messages: true,
      events: true,
      news: false,
    },
    communication: {
      email: true,
      sms: false,
      pushNotifications: true,
    },
    visibility: {
      profileVisible: true,
      handicapVisible: true,
      contactInfoVisible: false,
      tournamentResultsVisible: true,
    },
  });

  const getDefaultPrivacySettings = (): PrivacySettings => ({
    profileVisibility: 'members',
    contactVisibility: 'friends',
    handicapVisibility: 'members',
    tournamentResultsVisibility: 'public',
    allowDirectMessages: true,
    allowTournamentInvitations: true,
    allowPlayingPartnerRequests: true,
  });

  const handleSave = async () => {
    try {
      const updatedProfile = {
        ...formData,
        preferences,
        privacy,
        emergencyContact,
        address,
      };

      await dispatch(updateProfile(updatedProfile) as any);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
      });
      setPreferences(profile.preferences || getDefaultPreferences());
      setPrivacy(profile.privacy || getDefaultPrivacySettings());
      setEmergencyContact(profile.emergencyContact || null);
      setAddress(profile.address || null);
    }
    setIsEditing(false);
  };

  const handleChangePhoto = () => {
    const options = [
      { text: 'Take Photo', onPress: () => openCamera() },
      { text: 'Choose from Library', onPress: () => openImageLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map((o) => o.text),
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex !== 2) {
            options[buttonIndex].onPress();
          }
        }
      );
    } else {
      Alert.alert('Change Photo', '', options);
    }
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      handleImageResponse
    );
  };

  const openImageLibrary = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      handleImageResponse
    );
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage || !response.assets) {
      return;
    }

    const asset = response.assets[0];
    if (!asset.uri) {
      return;
    }

    const formData = new FormData();
    formData.append('photo', {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || 'profile.jpg',
    } as any);

    try {
      await dispatch(uploadProfilePhoto(formData) as any);
      Alert.alert('Success', 'Profile photo updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updatePreferences = (section: keyof MemberPreferences, key: string, value: boolean) => {
    setPreferences((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      };
    });
  };

  const updatePrivacy = (key: keyof PrivacySettings, value: any) => {
    setPrivacy((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const updateEmergencyContact = (key: keyof EmergencyContact, value: string) => {
    setEmergencyContact(
      (prev) =>
        ({
          ...prev,
          [key]: value,
        } as EmergencyContact)
    );
  };

  const updateAddress = (key: keyof Address, value: string) => {
    setAddress(
      (prev) =>
        ({
          ...prev,
          [key]: value,
        } as Address)
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={isEditing ? handleChangePhoto : undefined}>
          {profile?.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </Text>
            </View>
          )}
          {isEditing && (
            <View style={styles.cameraIcon}>
              <Icon name="camera-alt" size={16} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.headerActions}>
        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Icon name="edit" size={20} color="#007AFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSectionTabs = () => (
    <View style={styles.sectionTabs}>
      <TouchableOpacity
        style={[styles.sectionTab, activeSection === 'profile' && styles.sectionTabActive]}
        onPress={() => setActiveSection('profile')}>
        <Text
          style={[
            styles.sectionTabText,
            activeSection === 'profile' && styles.sectionTabTextActive,
          ]}>
          Profile
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sectionTab, activeSection === 'preferences' && styles.sectionTabActive]}
        onPress={() => setActiveSection('preferences')}>
        <Text
          style={[
            styles.sectionTabText,
            activeSection === 'preferences' && styles.sectionTabTextActive,
          ]}>
          Preferences
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sectionTab, activeSection === 'privacy' && styles.sectionTabActive]}
        onPress={() => setActiveSection('privacy')}>
        <Text
          style={[
            styles.sectionTabText,
            activeSection === 'privacy' && styles.sectionTabTextActive,
          ]}>
          Privacy
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sectionTab, activeSection === 'emergency' && styles.sectionTabActive]}
        onPress={() => setActiveSection('emergency')}>
        <Text
          style={[
            styles.sectionTabText,
            activeSection === 'emergency' && styles.sectionTabTextActive,
          ]}>
          Emergency
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sectionTab, activeSection === 'address' && styles.sectionTabActive]}
        onPress={() => setActiveSection('address')}>
        <Text
          style={[
            styles.sectionTabText,
            activeSection === 'address' && styles.sectionTabTextActive,
          ]}>
          Address
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileSection = () => (
    <View style={styles.section}>
      <FormInput
        label="First Name"
        value={formData.firstName || ''}
        onChangeText={(value) => updateFormData('firstName', value)}
        editable={isEditing}
        required
      />
      <FormInput
        label="Last Name"
        value={formData.lastName || ''}
        onChangeText={(value) => updateFormData('lastName', value)}
        editable={isEditing}
        required
      />
      <FormInput
        label="Email"
        value={formData.email || ''}
        onChangeText={(value) => updateFormData('email', value)}
        editable={isEditing}
        keyboardType="email-address"
        required
      />
      <FormInput
        label="Phone"
        value={formData.phone || ''}
        onChangeText={(value) => updateFormData('phone', value)}
        editable={isEditing}
        keyboardType="phone-pad"
      />
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          style={[styles.textArea, !isEditing && styles.disabledInput]}
          value={formData.bio || ''}
          onChangeText={(value) => updateFormData('bio', value)}
          editable={isEditing}
          multiline
          numberOfLines={4}
          placeholder="Tell us about yourself..."
          placeholderTextColor="#999999"
        />
      </View>
    </View>
  );

  const renderPreferencesSection = () => {
    if (!preferences) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceGroupTitle}>Notifications</Text>
          {Object.entries(preferences.notifications).map(([key, value]) => (
            <View key={key} style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Switch
                value={value}
                onValueChange={(newValue) => updatePreferences('notifications', key, newValue)}
                disabled={!isEditing}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={value ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceGroupTitle}>Communication</Text>
          {Object.entries(preferences.communication).map(([key, value]) => (
            <View key={key} style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Switch
                value={value}
                onValueChange={(newValue) => updatePreferences('communication', key, newValue)}
                disabled={!isEditing}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={value ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceGroupTitle}>Visibility</Text>
          {Object.entries(preferences.visibility).map(([key, value]) => (
            <View key={key} style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Switch
                value={value}
                onValueChange={(newValue) => updatePreferences('visibility', key, newValue)}
                disabled={!isEditing}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={value ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPrivacySection = () => {
    if (!privacy) {
      return null;
    }

    const visibilityOptions = ['public', 'members', 'friends', 'private'];

    return (
      <View style={styles.section}>
        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceGroupTitle}>Visibility Settings</Text>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Profile Visibility</Text>
            <Text style={styles.preferenceValue}>{privacy.profileVisibility}</Text>
          </View>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Contact Visibility</Text>
            <Text style={styles.preferenceValue}>{privacy.contactVisibility}</Text>
          </View>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Handicap Visibility</Text>
            <Text style={styles.preferenceValue}>{privacy.handicapVisibility}</Text>
          </View>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Tournament Results Visibility</Text>
            <Text style={styles.preferenceValue}>{privacy.tournamentResultsVisibility}</Text>
          </View>
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceGroupTitle}>Interaction Settings</Text>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Allow Direct Messages</Text>
            <Switch
              value={privacy.allowDirectMessages}
              onValueChange={(value) => updatePrivacy('allowDirectMessages', value)}
              disabled={!isEditing}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={privacy.allowDirectMessages ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Allow Tournament Invitations</Text>
            <Switch
              value={privacy.allowTournamentInvitations}
              onValueChange={(value) => updatePrivacy('allowTournamentInvitations', value)}
              disabled={!isEditing}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={privacy.allowTournamentInvitations ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Allow Playing Partner Requests</Text>
            <Switch
              value={privacy.allowPlayingPartnerRequests}
              onValueChange={(value) => updatePrivacy('allowPlayingPartnerRequests', value)}
              disabled={!isEditing}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={privacy.allowPlayingPartnerRequests ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderEmergencySection = () => (
    <View style={styles.section}>
      <FormInput
        label="Contact Name"
        value={emergencyContact?.name || ''}
        onChangeText={(value) => updateEmergencyContact('name', value)}
        editable={isEditing}
      />
      <FormInput
        label="Relationship"
        value={emergencyContact?.relationship || ''}
        onChangeText={(value) => updateEmergencyContact('relationship', value)}
        editable={isEditing}
        placeholder="e.g., Spouse, Parent, Sibling"
      />
      <FormInput
        label="Phone Number"
        value={emergencyContact?.phone || ''}
        onChangeText={(value) => updateEmergencyContact('phone', value)}
        editable={isEditing}
        keyboardType="phone-pad"
      />
      <FormInput
        label="Email"
        value={emergencyContact?.email || ''}
        onChangeText={(value) => updateEmergencyContact('email', value)}
        editable={isEditing}
        keyboardType="email-address"
      />
    </View>
  );

  const renderAddressSection = () => (
    <View style={styles.section}>
      <FormInput
        label="Street Address"
        value={address?.street || ''}
        onChangeText={(value) => updateAddress('street', value)}
        editable={isEditing}
      />
      <FormInput
        label="City"
        value={address?.city || ''}
        onChangeText={(value) => updateAddress('city', value)}
        editable={isEditing}
      />
      <FormInput
        label="State"
        value={address?.state || ''}
        onChangeText={(value) => updateAddress('state', value)}
        editable={isEditing}
      />
      <FormInput
        label="ZIP Code"
        value={address?.zipCode || ''}
        onChangeText={(value) => updateAddress('zipCode', value)}
        editable={isEditing}
        keyboardType="numeric"
      />
      <FormInput
        label="Country"
        value={address?.country || ''}
        onChangeText={(value) => updateAddress('country', value)}
        editable={isEditing}
      />
    </View>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'preferences':
        return renderPreferencesSection();
      case 'privacy':
        return renderPrivacySection();
      case 'emergency':
        return renderEmergencySection();
      case 'address':
        return renderAddressSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isLoading} />

      {renderHeader()}
      {renderSectionTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderActiveSection()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#757575',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    width: '100%',
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sectionTabActive: {
    borderBottomColor: '#007AFF',
  },
  sectionTabText: {
    fontSize: 14,
    color: '#666666',
  },
  sectionTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
  },
  preferenceGroup: {
    marginBottom: 24,
  },
  preferenceGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666666',
    textTransform: 'capitalize',
  },
});

export default MyProfileScreen;
