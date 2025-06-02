import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Icon name="error-outline" size={20} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <Icon name="close" size={20} color="#FFFFFF" onPress={onDismiss} style={styles.closeIcon} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  closeIcon: {
    marginLeft: 8,
  },
});

export default ErrorMessage;
