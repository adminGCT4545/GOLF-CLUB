import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, ListItem, Icon } from 'react-native-elements';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { format } from 'date-fns';

const HomeScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh data here
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const quickActions = [
    { title: 'Book Tee Time', icon: 'golf-course', color: '#2E7D32' },
    { title: 'Tournaments', icon: 'emoji-events', color: '#FFC107' },
    { title: 'Pro Shop', icon: 'shopping-bag', color: '#FF5722' },
    { title: 'Dining', icon: 'restaurant', color: '#9C27B0' },
  ];

  const upcomingBookings = [
    {
      id: '1',
      type: 'Tee Time',
      date: new Date(),
      time: '08:00 AM',
      course: 'Championship Course',
    },
    {
      id: '2',
      type: 'Tennis Court',
      date: new Date(Date.now() + 86400000),
      time: '02:00 PM',
      court: 'Court 1',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Welcome Card */}
      <Card containerStyle={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text h4 style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <Avatar
            rounded
            size="medium"
            source={{ uri: user?.profileImage }}
            title={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
            containerStyle={styles.avatar}
          />
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Member ID</Text>
            <Text style={styles.infoValue}>{user?.memberId}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Handicap</Text>
            <Text style={styles.infoValue}>{user?.handicap || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, styles.activeStatus]}>{user?.membershipStatus}</Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text h4 style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <Card key={index} containerStyle={styles.actionCard}>
              <Icon name={action.icon} size={40} color={action.color} style={styles.actionIcon} />
              <Text style={styles.actionText}>{action.title}</Text>
            </Card>
          ))}
        </View>
      </View>

      {/* Upcoming Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text h4 style={styles.sectionTitle}>
            Upcoming Bookings
          </Text>
          <Button title="View All" type="clear" titleStyle={styles.viewAllButton} />
        </View>
        <Card containerStyle={styles.bookingsCard}>
          {upcomingBookings.map((booking) => (
            <ListItem key={booking.id} bottomDivider>
              <Icon
                name={booking.type === 'Tee Time' ? 'golf-course' : 'sports-tennis'}
                color="#2E7D32"
              />
              <ListItem.Content>
                <ListItem.Title>{booking.type}</ListItem.Title>
                <ListItem.Subtitle>
                  {format(booking.date, 'MMM dd, yyyy')} at {booking.time}
                </ListItem.Subtitle>
                <Text style={styles.bookingLocation}>{booking.course || booking.court}</Text>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          ))}
        </Card>
      </View>

      {/* Club News */}
      <View style={styles.section}>
        <Text h4 style={styles.sectionTitle}>
          Club News
        </Text>
        <Card containerStyle={styles.newsCard}>
          <Text style={styles.newsTitle}>Summer Tournament Series 2024</Text>
          <Text style={styles.newsDate}>March 15, 2024</Text>
          <Text style={styles.newsContent}>
            Registration is now open for our annual Summer Tournament Series...
          </Text>
          <Button title="Read More" type="clear" titleStyle={styles.readMoreButton} />
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  welcomeCard: {
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
  },
  userName: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: '#2E7D32',
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  activeStatus: {
    color: '#4CAF50',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333333',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#2E7D32',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  actionIcon: {
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  bookingsCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  bookingLocation: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 2,
  },
  newsCard: {
    marginBottom: 10,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  newsDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 10,
  },
  newsContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 10,
  },
  readMoreButton: {
    fontSize: 14,
    color: '#2E7D32',
  },
});

export default HomeScreen;
