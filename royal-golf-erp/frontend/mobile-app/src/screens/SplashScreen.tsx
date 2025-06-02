import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loadStoredAuth } from '../store/slices/authSlice';
import { RootStackParamList } from '../navigation/AppNavigator';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load stored authentication
        await dispatch(loadStoredAuth()).unwrap();

        // Add any other initialization tasks here

        setTimeout(() => {
          // Navigation will be handled by AppNavigator based on auth state
        }, 2000);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeApp();
  }, [dispatch, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text h2 style={styles.title}>
          Royal Golf Club
        </Text>
        <Text style={styles.subtitle}>Members Portal</Text>
      </View>
      <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  loader: {
    position: 'absolute',
    bottom: 100,
  },
});

export default SplashScreen;
