import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Tab Screens
import HomeScreen from '../screens/home/HomeScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import TournamentsScreen from '../screens/tournaments/TournamentsScreen';
import ServicesScreen from '../screens/services/ServicesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Stack Screens
import BookingDetailsScreen from '../screens/bookings/BookingDetailsScreen';
import TeeTimeBookingScreen from '../screens/bookings/TeeTimeBookingScreen';
import BookingHistoryScreen from '../screens/bookings/BookingHistoryScreen';
import TournamentDetailsScreen from '../screens/tournaments/TournamentDetailsScreen';
import TournamentRegistrationScreen from '../screens/tournaments/TournamentRegistrationScreen';
import TournamentResultsScreen from '../screens/tournaments/TournamentResultsScreen';
import MyTournamentsScreen from '../screens/tournaments/MyTournamentsScreen';

// F&B Screens
import FnBMenuScreen from '../screens/fnb/FnBMenuScreen';
import MenuItemDetailsScreen from '../screens/fnb/MenuItemDetailsScreen';
import OrderScreen from '../screens/fnb/OrderScreen';
import TableReservationScreen from '../screens/fnb/TableReservationScreen';
import MemberTabsScreen from '../screens/fnb/MemberTabsScreen';
import TabDetailsScreen from '../screens/fnb/TabDetailsScreen';
import MemberOrderHistoryScreen from '../screens/fnb/MemberOrderHistoryScreen';

// Message Screens
import MessagesScreen from '../screens/messages/MessagesScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import NewMessageScreen from '../screens/messages/NewMessageScreen';
import GroupChatSettingsScreen from '../screens/messages/GroupChatSettingsScreen';

// Notification Screens
import NotificationsListScreen from '../screens/notifications/NotificationsListScreen';
import NotificationSettingsScreen from '../screens/notifications/NotificationSettingsScreen';

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Messages: undefined;
  Tournaments: undefined;
  Services: undefined;
  Profile: undefined;
};

export type BookingStackParamList = {
  BookingsList: undefined;
  BookingDetails: { bookingId: string };
  TeeTimeBooking: { bookingId?: string; modifyMode?: boolean };
  BookingHistory: undefined;
};

export type TournamentStackParamList = {
  TournamentsList: undefined;
  TournamentDetails: { tournamentId: string };
  TournamentRegistration: { tournament: any };
  TournamentResults: { tournamentId: string; initialTab?: number };
  MyTournaments: undefined;
};

export type MessageStackParamList = {
  MessagesList: undefined;
  Chat: { conversationId: string; conversationTitle: string };
  NewMessage: undefined;
  GroupChatSettings: { conversationId: string };
  GroupChatSetup: { selectedMembers: string[] };
  AddGroupMembers: { conversationId: string };
};

export type NotificationStackParamList = {
  NotificationsList: undefined;
  NotificationSettings: undefined;
};

export type ServicesStackParamList = {
  ServicesList: undefined;
  FnBMenu: undefined;
  MenuItemDetails: { menuItemId: string };
  FnBOrder: undefined;
  TableReservation: undefined;
  MemberTabs: undefined;
  TabDetails: { tabId: string };
  InvoiceDetails: { invoiceId: string };
  MemberOrderHistory: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const BookingStack = createStackNavigator<BookingStackParamList>();
const TournamentStack = createStackNavigator<TournamentStackParamList>();
const MessageStack = createStackNavigator<MessageStackParamList>();
const NotificationStack = createStackNavigator<NotificationStackParamList>();
const ServicesStack = createStackNavigator<ServicesStackParamList>();

const BookingNavigator: React.FC = () => (
  <BookingStack.Navigator>
    <BookingStack.Screen
      name="BookingsList"
      component={BookingsScreen}
      options={{ headerShown: false }}
    />
    <BookingStack.Screen
      name="BookingDetails"
      component={BookingDetailsScreen}
      options={{ headerShown: false }}
    />
    <BookingStack.Screen
      name="TeeTimeBooking"
      component={TeeTimeBookingScreen}
      options={{ headerShown: false }}
    />
    <BookingStack.Screen
      name="BookingHistory"
      component={BookingHistoryScreen}
      options={{ headerShown: false }}
    />
  </BookingStack.Navigator>
);

const TournamentNavigator: React.FC = () => (
  <TournamentStack.Navigator>
    <TournamentStack.Screen
      name="TournamentsList"
      component={TournamentsScreen}
      options={{ title: 'Tournaments' }}
    />
    <TournamentStack.Screen
      name="TournamentDetails"
      component={TournamentDetailsScreen}
      options={{ title: 'Tournament Details' }}
    />
    <TournamentStack.Screen
      name="TournamentRegistration"
      component={TournamentRegistrationScreen}
      options={{ title: 'Register for Tournament' }}
    />
    <TournamentStack.Screen
      name="TournamentResults"
      component={TournamentResultsScreen}
      options={{ title: 'Tournament Results' }}
    />
    <TournamentStack.Screen
      name="MyTournaments"
      component={MyTournamentsScreen}
      options={{ title: 'My Tournaments' }}
    />
  </TournamentStack.Navigator>
);

const MessageNavigator: React.FC = () => (
  <MessageStack.Navigator>
    <MessageStack.Screen
      name="MessagesList"
      component={MessagesScreen}
      options={{ headerShown: false }}
    />
    <MessageStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    <MessageStack.Screen
      name="NewMessage"
      component={NewMessageScreen}
      options={{ title: 'New Message' }}
    />
    <MessageStack.Screen
      name="GroupChatSettings"
      component={GroupChatSettingsScreen}
      options={{ title: 'Group Info' }}
    />
  </MessageStack.Navigator>
);

const NotificationNavigator: React.FC = () => (
  <NotificationStack.Navigator>
    <NotificationStack.Screen
      name="NotificationsList"
      component={NotificationsListScreen}
      options={{ headerShown: false }}
    />
    <NotificationStack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
      options={{ title: 'Notification Settings' }}
    />
  </NotificationStack.Navigator>
);

const ServicesNavigator: React.FC = () => (
  <ServicesStack.Navigator>
    <ServicesStack.Screen
      name="ServicesList"
      component={ServicesScreen}
      options={{ headerShown: false }}
    />
    <ServicesStack.Screen
      name="FnBMenu"
      component={FnBMenuScreen}
      options={{ headerShown: false }}
    />
    <ServicesStack.Screen
      name="MenuItemDetails"
      component={MenuItemDetailsScreen}
      options={{ headerShown: false }}
    />
    <ServicesStack.Screen
      name="FnBOrder"
      component={OrderScreen}
      options={{ headerShown: false }}
    />
    <ServicesStack.Screen
      name="TableReservation"
      component={TableReservationScreen}
      options={{ headerShown: false }}
    />
    <ServicesStack.Screen
      name="MemberTabs"
      component={MemberTabsScreen}
      options={{ headerShown: false }}
    />
    <ServicesStack.Screen
      name="TabDetails"
      component={TabDetailsScreen}
      options={{ headerShown: false }}
    />
    <ServicesStack.Screen
      name="MemberOrderHistory"
      component={MemberOrderHistoryScreen}
      options={{ headerShown: false }}
    />
  </ServicesStack.Navigator>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Bookings':
              iconName = 'golf-course';
              break;
            case 'Messages':
              iconName = 'message';
              break;
            case 'Tournaments':
              iconName = 'emoji-events';
              break;
            case 'Services':
              iconName = 'room-service';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#757575',
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={BookingNavigator} />
      <Tab.Screen name="Messages" component={MessageNavigator} />
      <Tab.Screen name="Tournaments" component={TournamentNavigator} />
      <Tab.Screen name="Services" component={ServicesNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
