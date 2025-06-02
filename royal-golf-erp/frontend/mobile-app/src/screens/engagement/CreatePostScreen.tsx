import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  createPost,
  updateCreatePostData,
  clearCreatePostData,
} from '../../store/slices/engagementSlice';
import { RootState } from '../../store';
import { PostType, PrivacyLevel, CourseLocation, TaggedMember } from '../../types/engagement';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const { width: screenWidth } = Dimensions.get('window');

interface CreatePostScreenProps {
  navigation: any;
  route: any;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { createPostData, loading } = useSelector((state: RootState) => state.engagement);
  const { currentUser } = useSelector((state: RootState) => state.auth);

  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [postType, setPostType] = useState<PostType>(PostType.TEXT);
  const [privacy, setPrivacy] = useState<PrivacyLevel>(PrivacyLevel.PUBLIC);
  const [location, setLocation] = useState<CourseLocation | null>(null);
  const [taggedMembers, setTaggedMembers] = useState<TaggedMember[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  // Modals
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Search and filter states
  const [locationSearch, setLocationSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Mock data - replace with actual API calls
  const courseLocations = [
    { courseId: '1', courseName: 'Main Course', hole: 1, tee: 'Blue' },
    { courseId: '1', courseName: 'Main Course', hole: 9, tee: 'White' },
    { courseId: '1', courseName: 'Main Course', hole: 18, tee: 'Red' },
    { courseId: '2', courseName: 'Practice Range', hole: undefined, tee: undefined },
    { courseId: '3', courseName: 'Putting Green', hole: undefined, tee: undefined },
  ];

  const availableMembers = [
    { id: '1', name: 'John Smith', avatar: undefined },
    { id: '2', name: 'Jane Doe', avatar: undefined },
    { id: '3', name: 'Mike Johnson', avatar: undefined },
    { id: '4', name: 'Sarah Wilson', avatar: undefined },
  ];

  const mediaFilters = [
    { name: 'Original', value: null },
    { name: 'Vintage', value: 'vintage' },
    { name: 'Bright', value: 'bright' },
    { name: 'Warm', value: 'warm' },
    { name: 'Cool', value: 'cool' },
    { name: 'B&W', value: 'bw' },
  ];

  useEffect(() => {
    // Request permissions
    requestPermissions();

    // Pre-fill from route params if coming from share
    if (route.params?.shareContent) {
      setContent(route.params.shareContent);
    }

    return () => {
      dispatch(clearCreatePostData());
    };
  }, []);

  const requestPermissions = async () => {
    // Camera and media library permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please enable camera and photo library access to share photos.'
      );
    }

    // Location permission
    const locationPermission = await Location.requestForegroundPermissionsAsync();
    if (locationPermission.status !== 'granted') {
      Alert.alert(
        'Location Permission',
        'Enable location access to tag your golf course location.'
      );
    }
  };

  const handlePost = async () => {
    if (!content.trim() && selectedMedia.length === 0) {
      Alert.alert('Empty Post', 'Please add some content or media to your post.');
      return;
    }

    try {
      const postData = {
        content: content.trim(),
        type: postType,
        media: selectedMedia,
        location,
        taggedMembers: taggedMembers.map((member) => member.id),
        privacy,
        scheduledAt: scheduledDate,
      };

      await dispatch(createPost(postData)).unwrap();

      Alert.alert(
        'Post Created',
        scheduledDate ? 'Your post has been scheduled successfully!' : 'Your post has been shared!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
      console.error('Error creating post:', error);
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      let result;

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          allowsMultipleSelection: true,
        });
      }

      if (!result.canceled) {
        const newMedia = result.assets.map((asset) => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
        }));

        setSelectedMedia((prev) => [...prev, ...newMedia]);
        setPostType(newMedia.some((m) => m.type === 'video') ? PostType.VIDEO : PostType.PHOTO);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }

    setShowMediaModal(false);
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
    if (selectedMedia.length === 1) {
      setPostType(PostType.TEXT);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      // Here you would reverse geocode to find the nearest golf course
      // For now, we'll just show the coordinates
      Alert.alert(
        'Location Found',
        `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`
      );
    } catch (error) {
      Alert.alert('Location Error', 'Could not get your current location.');
    }
  };

  const renderMediaPicker = () => (
    <Modal
      visible={showMediaModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMediaModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.mediaModal}>
          <Text style={styles.modalTitle}>Add Media</Text>

          <TouchableOpacity style={styles.mediaOption} onPress={() => pickImage('camera')}>
            <Text style={styles.mediaOptionIcon}>📸</Text>
            <Text style={styles.mediaOptionText}>Take Photo/Video</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaOption} onPress={() => pickImage('library')}>
            <Text style={styles.mediaOptionIcon}>🖼️</Text>
            <Text style={styles.mediaOptionText}>Choose from Library</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelOption} onPress={() => setShowMediaModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPrivacyModal = () => (
    <Modal
      visible={showPrivacyModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPrivacyModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.optionsModal}>
          <Text style={styles.modalTitle}>Privacy Settings</Text>

          {Object.values(PrivacyLevel).map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.privacyOption, privacy === level && styles.selectedOption]}
              onPress={() => {
                setPrivacy(level);
                setShowPrivacyModal(false);
              }}>
              <Text style={styles.privacyIcon}>
                {level === PrivacyLevel.PUBLIC
                  ? '🌍'
                  : level === PrivacyLevel.MEMBERS_ONLY
                  ? '👥'
                  : level === PrivacyLevel.FRIENDS_ONLY
                  ? '👫'
                  : '🔒'}
              </Text>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyName}>{level.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.privacyDescription}>
                  {level === PrivacyLevel.PUBLIC
                    ? 'Everyone can see this post'
                    : level === PrivacyLevel.MEMBERS_ONLY
                    ? 'Only club members can see this'
                    : level === PrivacyLevel.FRIENDS_ONLY
                    ? 'Only your friends can see this'
                    : 'Only you can see this post'}
                </Text>
              </View>
              {privacy === level && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderLocationModal = () => (
    <Modal
      visible={showLocationModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLocationModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.locationModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
            <Text style={styles.currentLocationIcon}>📍</Text>
            <Text style={styles.currentLocationText}>Use Current Location</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.searchInput}
            placeholder="Search course locations..."
            value={locationSearch}
            onChangeText={setLocationSearch}
          />

          <FlatList
            data={courseLocations.filter((loc) =>
              loc.courseName.toLowerCase().includes(locationSearch.toLowerCase())
            )}
            keyExtractor={(item, index) => `${item.courseId}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() => {
                  setLocation(item);
                  setShowLocationModal(false);
                }}>
                <Text style={styles.locationName}>{item.courseName}</Text>
                {item.hole && (
                  <Text style={styles.locationDetails}>
                    Hole {item.hole} - {item.tee} Tee
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderMemberModal = () => (
    <Modal
      visible={showMemberModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMemberModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.memberModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tag Members</Text>
            <TouchableOpacity onPress={() => setShowMemberModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={memberSearch}
            onChangeText={setMemberSearch}
          />

          <FlatList
            data={availableMembers.filter(
              (member) =>
                member.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
                !taggedMembers.some((tagged) => tagged.id === member.id)
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberItem}
                onPress={() => {
                  setTaggedMembers((prev) => [...prev, item]);
                  setMemberSearch('');
                }}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.memberName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />

          {taggedMembers.length > 0 && (
            <View style={styles.taggedSection}>
              <Text style={styles.taggedTitle}>Tagged Members:</Text>
              <View style={styles.taggedList}>
                {taggedMembers.map((member) => (
                  <View key={member.id} style={styles.taggedMember}>
                    <Text style={styles.taggedMemberName}>{member.name}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setTaggedMembers((prev) => prev.filter((m) => m.id !== member.id))
                      }>
                      <Text style={styles.removeTag}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <Text style={styles.modalTitle}>Apply Filter</Text>

          <FlatList
            data={mediaFilters}
            horizontal
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedFilter === item.value && styles.selectedFilter,
                ]}
                onPress={() => {
                  setSelectedFilter(item.value);
                  setShowFilterModal(false);
                }}>
                <Text style={styles.filterName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />

          <TouchableOpacity
            style={styles.applyFilterButton}
            onPress={() => setShowFilterModal(false)}>
            <Text style={styles.applyFilterText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading.createPost) {
    return <LoadingOverlay message="Creating post..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create Post</Text>

        <TouchableOpacity
          style={[
            styles.postButton,
            !content.trim() && selectedMedia.length === 0 && styles.disabledButton,
          ]}
          onPress={handlePost}
          disabled={!content.trim() && selectedMedia.length === 0}>
          <Text
            style={[
              styles.postButtonText,
              !content.trim() && selectedMedia.length === 0 && styles.disabledText,
            ]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.authorSection}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>
              {currentUser?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{currentUser?.name}</Text>
            <TouchableOpacity
              style={styles.privacyButton}
              onPress={() => setShowPrivacyModal(true)}>
              <Text style={styles.privacyText}>
                {privacy === PrivacyLevel.PUBLIC
                  ? '🌍 Public'
                  : privacy === PrivacyLevel.MEMBERS_ONLY
                  ? '👥 Members Only'
                  : privacy === PrivacyLevel.FRIENDS_ONLY
                  ? '👫 Friends Only'
                  : '🔒 Private'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.contentInput}
          placeholder="What's happening on the course?"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        {selectedMedia.length > 0 && (
          <View style={styles.mediaContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeMedia(index)}>
                    <Text style={styles.removeMediaText}>✕</Text>
                  </TouchableOpacity>
                  {selectedFilter && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{selectedFilter}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {selectedMedia.length > 0 && (
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterModal(true)}>
                <Text style={styles.filterButtonText}>✨ Add Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {location && (
          <View style={styles.selectedLocation}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{location.courseName}</Text>
              {location.hole && (
                <Text style={styles.locationSubtext}>
                  Hole {location.hole} - {location.tee} Tee
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setLocation(null)}>
              <Text style={styles.removeLocation}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {taggedMembers.length > 0 && (
          <View style={styles.selectedMembers}>
            <Text style={styles.withText}>with </Text>
            {taggedMembers.map((member, index) => (
              <Text key={member.id} style={styles.taggedMemberText}>
                {member.name}
                {index < taggedMembers.length - 1 ? ', ' : ''}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.characterCount}>
          <Text style={styles.characterCountText}>{content.length} / 500</Text>
        </View>
      </ScrollView>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowMediaModal(true)}>
          <Text style={styles.toolbarIcon}>📸</Text>
          <Text style={styles.toolbarText}>Photo/Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowLocationModal(true)}>
          <Text style={styles.toolbarIcon}>📍</Text>
          <Text style={styles.toolbarText}>Location</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowMemberModal(true)}>
          <Text style={styles.toolbarIcon}>👥</Text>
          <Text style={styles.toolbarText}>Tag People</Text>
        </TouchableOpacity>
      </View>

      {renderMediaPicker()}
      {renderPrivacyModal()}
      {renderLocationModal()}
      {renderMemberModal()}
      {renderFilterModal()}
    </View>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#BDBDBD',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  privacyButton: {
    alignSelf: 'flex-start',
  },
  privacyText: {
    fontSize: 14,
    color: '#2196F3',
  },
  contentInput: {
    fontSize: 18,
    color: '#333',
    minHeight: 120,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  mediaContainer: {
    marginBottom: 16,
  },
  mediaItem: {
    marginRight: 12,
    position: 'relative',
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  locationSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeLocation: {
    fontSize: 16,
    color: '#666',
    padding: 4,
  },
  selectedMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  withText: {
    fontSize: 14,
    color: '#666',
  },
  taggedMemberText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  characterCountText: {
    fontSize: 12,
    color: content.length > 450 ? '#F44336' : '#888',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  toolbarButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toolbarIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  toolbarText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mediaModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  mediaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mediaOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  mediaOptionText: {
    fontSize: 16,
    color: '#333',
  },
  cancelOption: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  locationModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  memberModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 8,
  },
  currentLocationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  currentLocationText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  locationDetails: {
    fontSize: 14,
    color: '#666',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  taggedSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  taggedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  taggedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  taggedMember: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  taggedMemberName: {
    fontSize: 14,
    color: '#2196F3',
    marginRight: 6,
  },
  removeTag: {
    fontSize: 14,
    color: '#666',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  filterOption: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    minWidth: 80,
  },
  selectedFilter: {
    backgroundColor: '#2196F3',
  },
  filterName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  applyFilterButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  applyFilterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreatePostScreen;
