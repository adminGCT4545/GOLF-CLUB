import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const getPasswordStrength = () => {
    if (!password) {
      return { strength: 0, label: '', color: '#E0E0E0' };
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) {
      strength += 1;
    }
    if (password.length >= 12) {
      strength += 1;
    }

    // Character type checks
    if (/[a-z]/.test(password)) {
      strength += 1;
    }
    if (/[A-Z]/.test(password)) {
      strength += 1;
    }
    if (/[0-9]/.test(password)) {
      strength += 1;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    }

    // Determine strength level
    if (strength <= 2) {
      return { strength: 1, label: 'Weak', color: '#F44336' };
    }
    if (strength <= 4) {
      return { strength: 2, label: 'Medium', color: '#FF9800' };
    }
    if (strength <= 5) {
      return { strength: 3, label: 'Strong', color: '#4CAF50' };
    }
    return { strength: 4, label: 'Very Strong', color: '#2E7D32' };
  };

  const { strength, label, color } = getPasswordStrength();

  if (!password) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={[styles.bar, index <= strength && { backgroundColor: color }]} />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PasswordStrengthIndicator;
