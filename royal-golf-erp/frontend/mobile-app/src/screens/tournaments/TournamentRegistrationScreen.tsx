import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Header, Tab, TabView } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Tournament } from '../../types/tournament';
import { RegistrationForm, PaymentForm } from '../../components/tournaments';
import {
  registerForTournament,
  fetchPaymentInfo,
  clearRegistrationError,
} from '../../store/slices/tournamentSlice';
import { RootState, AppDispatch } from '../../store';
import { theme } from '../../constants/theme';
import { LoadingOverlay, ErrorMessage } from '../../components/common';

interface RouteParams {
  tournament: Tournament;
}

const TournamentRegistrationScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const { tournament } = route.params as RouteParams;

  const { paymentInfo, isRegistering, registrationError } = useSelector(
    (state: RootState) => state.tournaments
  );

  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState(0);
  const [registrationData, setRegistrationData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentInfo(tournament.id));

    return () => {
      dispatch(clearRegistrationError());
    };
  }, [dispatch, tournament.id]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Register for Tournament',
      headerLeft: () => (
        <Header.BackButton
          onPress={() => {
            if (activeTab > 0) {
              setActiveTab(0);
            } else {
              navigation.goBack();
            }
          }}
        />
      ),
    });
  }, [navigation, activeTab]);

  const handleRegistrationSubmit = async (data: any) => {
    setRegistrationData(data);

    if (tournament.entryFee === 0) {
      // Free tournament - complete registration immediately
      try {
        const result = await dispatch(registerForTournament(data)).unwrap();
        Alert.alert(
          'Registration Successful',
          'You have been successfully registered for this tournament!',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('TournamentDetails', { tournamentId: tournament.id }),
            },
          ]
        );
      } catch (error) {
        // Error handled by redux state
      }
    } else {
      // Paid tournament - proceed to payment
      setActiveTab(1);
    }
  };

  const handlePaymentSubmit = async (paymentMethodId: string, paymentData?: any) => {
    if (!registrationData) {
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Combine registration and payment data
      const completeRegistrationData = {
        ...registrationData,
        paymentMethodId,
        paymentData,
      };

      const result = await dispatch(registerForTournament(completeRegistrationData)).unwrap();

      Alert.alert(
        'Registration Successful',
        'Your payment has been processed and you are now registered for this tournament!',
        [
          {
            text: 'View Tournament',
            onPress: () =>
              navigation.navigate('TournamentDetails', { tournamentId: tournament.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Payment Failed',
        error.message || 'There was an error processing your payment. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => setIsProcessingPayment(false),
          },
          {
            text: 'Back to Registration',
            onPress: () => setActiveTab(0),
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const renderRegistrationTab = () => {
    if (!user) {
      return (
        <ErrorMessage
          message="You must be logged in to register for tournaments"
          onRetry={() => navigation.navigate('Login')}
          retryText="Login"
        />
      );
    }

    return (
      <RegistrationForm
        tournament={tournament}
        onSubmit={handleRegistrationSubmit}
        isLoading={isRegistering}
        error={registrationError}
        currentMemberId={user.id}
        currentMemberName={user.name}
        currentHandicap={user.handicap || 0}
      />
    );
  };

  const renderPaymentTab = () => {
    if (!paymentInfo) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingOverlay message="Loading payment information..." />
        </View>
      );
    }

    if (tournament.entryFee === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ErrorMessage message="This is a free tournament. No payment required." />
        </View>
      );
    }

    return (
      <PaymentForm
        paymentInfo={paymentInfo}
        onPaymentSubmit={handlePaymentSubmit}
        isProcessing={isProcessingPayment}
        error={registrationError}
      />
    );
  };

  if (!tournament) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message="Tournament information not available"
          onRetry={() => navigation.goBack()}
          retryText="Go Back"
        />
      </View>
    );
  }

  // Check if registration is still open
  if (tournament.status !== 'REGISTRATION_OPEN') {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message="Registration is no longer open for this tournament"
          onRetry={() => navigation.goBack()}
          retryText="Go Back"
        />
      </View>
    );
  }

  // Check if tournament is full
  if (tournament.currentParticipants >= tournament.maxParticipants) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message="This tournament is full. Registration is no longer available."
          onRetry={() => navigation.goBack()}
          retryText="Go Back"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tab
        value={activeTab}
        onChange={setActiveTab}
        indicatorStyle={styles.tabIndicator}
        containerStyle={styles.tabContainer}>
        <Tab.Item
          title="Registration"
          titleStyle={[styles.tabTitle, activeTab === 0 && styles.activeTabTitle]}
        />
        <Tab.Item
          title="Payment"
          titleStyle={[
            styles.tabTitle,
            activeTab === 1 && styles.activeTabTitle,
            !registrationData && styles.disabledTabTitle,
          ]}
          disabled={!registrationData}
        />
      </Tab>

      <TabView value={activeTab} onChange={setActiveTab}>
        <TabView.Item style={styles.tabViewItem}>{renderRegistrationTab()}</TabView.Item>
        <TabView.Item style={styles.tabViewItem}>{renderPaymentTab()}</TabView.Item>
      </TabView>

      {(isRegistering || isProcessingPayment) && (
        <LoadingOverlay
          message={isProcessingPayment ? 'Processing payment...' : 'Registering for tournament...'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  tabIndicator: {
    backgroundColor: '#2E7D32',
    height: 3,
  },
  tabTitle: {
    fontSize: 14,
    color: '#86939E',
    fontWeight: '500',
  },
  activeTabTitle: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  disabledTabTitle: {
    color: '#BDC6CF',
  },
  tabViewItem: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});

export default TournamentRegistrationScreen;
