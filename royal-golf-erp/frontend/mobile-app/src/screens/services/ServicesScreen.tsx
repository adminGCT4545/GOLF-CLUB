import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ServicesScreenProps {
  navigation: any;
}

const ServicesScreen: React.FC<ServicesScreenProps> = ({ navigation }) => {
  const services = [
    {
      id: 'fnb',
      title: 'F&B Menu',
      description: 'View menu, order food & beverages',
      icon: 'restaurant-menu',
      color: '#FF6B35',
      screen: 'FnBMenu',
    },
    {
      id: 'tabs',
      title: 'My Tabs & Invoices',
      description: 'View open tabs and pay invoices',
      icon: 'receipt',
      color: '#4CAF50',
      screen: 'MemberTabs',
    },
    {
      id: 'order_history',
      title: 'Order History',
      description: 'View past F&B orders and receipts',
      icon: 'history',
      color: '#673AB7',
      screen: 'MemberOrderHistory',
    },
    {
      id: 'proshop',
      title: 'Pro Shop',
      description: 'Browse golf equipment and merchandise',
      icon: 'golf-course',
      color: '#2196F3',
      screen: 'ProShop',
    },
    {
      id: 'reservations',
      title: 'Table Reservations',
      description: 'Reserve dining tables',
      icon: 'event-seat',
      color: '#9C27B0',
      screen: 'TableReservation',
    },
    {
      id: 'member_directory',
      title: 'Member Directory',
      description: 'Find and connect with other members',
      icon: 'people',
      color: '#FF9800',
      screen: 'MemberDirectory',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notifications',
      icon: 'notifications',
      color: '#607D8B',
      screen: 'NotificationsList',
    },
  ];

  const handleServicePress = (service: any) => {
    if (service.screen === 'FnBMenu') {
      navigation.navigate('FnBMenu');
    } else if (service.screen === 'MemberTabs') {
      navigation.navigate('MemberTabs');
    } else if (service.screen === 'MemberOrderHistory') {
      navigation.navigate('MemberOrderHistory');
    } else {
      // For other services, you can add navigation later
      console.log(`Navigate to ${service.screen}`);
    }
  };

  const renderServiceCard = (service: any) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceCard}
      onPress={() => handleServicePress(service)}
    >
      <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
        <Icon name={service.icon} size={32} color="#FFFFFF" />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Club Services</Text>
        <Text style={styles.headerSubtitle}>
          Access all club amenities and services
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.servicesContainer}>
          {services.map(renderServiceCard)}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="star" size={24} color="#FF6B35" />
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Service Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="schedule" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>6AM-10PM</Text>
              <Text style={styles.statLabel}>Service Hours</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="phone" size={24} color="#2196F3" />
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>Concierge</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  servicesContainer: {
    padding: 20,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default ServicesScreen;
