import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Input, Button, CheckBox, Text, ButtonGroup, Card } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import {
  Tournament,
  TournamentRegistration,
  TeamMember,
  EmergencyContact,
} from '../../types/tournament';
import { theme } from '../../constants/theme';
import { formatCurrency } from '../../utils/dateHelpers';

interface RegistrationFormProps {
  tournament: Tournament;
  onSubmit: (data: Omit<TournamentRegistration, 'id' | 'registrationDate' | 'status'>) => void;
  isLoading?: boolean;
  error?: string | null;
  currentMemberId: string;
  currentMemberName: string;
  currentHandicap: number;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  tournament,
  onSubmit,
  isLoading = false,
  error,
  currentMemberId,
  currentMemberName,
  currentHandicap,
}) => {
  const [formData, setFormData] = useState({
    handicap: currentHandicap,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    } as EmergencyContact,
    dietaryPreferences: '',
    tshirtSize: 'M' as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
    specialRequests: '',
    termsAccepted: false,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTeamSection, setShowTeamSection] = useState(tournament.isTeamEvent);

  const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const relationships = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Other'];

  const addTeamMember = () => {
    if (teamMembers.length < (tournament.teamSize || 4) - 1) {
      setTeamMembers([
        ...teamMembers,
        {
          id: `temp-${Date.now()}`,
          name: '',
          handicap: 0,
          isGuest: false,
          guestContact: '',
        },
      ]);
    }
  };

  const removeTeamMember = (index: number) => {
    const updatedMembers = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(updatedMembers);
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    const updatedMembers = teamMembers.map((member, i) => {
      if (i === index) {
        return { ...member, [field]: value };
      }
      return member;
    });
    setTeamMembers(updatedMembers);
  };

  const validateForm = () => {
    if (!formData.emergencyContact.name.trim()) {
      Alert.alert('Error', 'Emergency contact name is required');
      return false;
    }

    if (!formData.emergencyContact.phone.trim()) {
      Alert.alert('Error', 'Emergency contact phone is required');
      return false;
    }

    if (!formData.emergencyContact.relationship.trim()) {
      Alert.alert('Error', 'Emergency contact relationship is required');
      return false;
    }

    if (tournament.handicapLimit && formData.handicap > tournament.handicapLimit) {
      Alert.alert(
        'Error',
        `Handicap must be ${tournament.handicapLimit} or lower for this tournament`
      );
      return false;
    }

    if (tournament.isTeamEvent) {
      const requiredTeamSize = (tournament.teamSize || 4) - 1; // Minus the current player
      if (teamMembers.length < requiredTeamSize) {
        Alert.alert('Error', `This tournament requires ${tournament.teamSize} players per team`);
        return false;
      }

      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        if (!member.name.trim()) {
          Alert.alert('Error', `Team member ${i + 1} name is required`);
          return false;
        }
        if (member.handicap <= 0) {
          Alert.alert('Error', `Team member ${i + 1} handicap is required`);
          return false;
        }
        if (member.isGuest && !member.guestContact?.trim()) {
          Alert.alert('Error', `Guest contact information is required for team member ${i + 1}`);
          return false;
        }
      }
    }

    if (!formData.termsAccepted) {
      Alert.alert('Error', 'You must accept the terms and conditions to register');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const registrationData = {
      tournamentId: tournament.id,
      memberId: currentMemberId,
      memberName: currentMemberName,
      handicap: formData.handicap,
      teamMembers: tournament.isTeamEvent ? teamMembers : undefined,
      emergencyContact: formData.emergencyContact,
      dietaryPreferences: formData.dietaryPreferences || undefined,
      tshirtSize: formData.tshirtSize,
      specialRequests: formData.specialRequests || undefined,
      termsAccepted: formData.termsAccepted,
      registrationFee: tournament.entryFee,
      paymentStatus: 'PENDING' as const,
    };

    onSubmit(registrationData);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card containerStyle={styles.card}>
        <Text style={styles.sectionTitle}>Player Information</Text>

        <Input
          label="Player Name"
          value={currentMemberName}
          disabled
          inputStyle={styles.disabledInput}
        />

        <Input
          label="Handicap"
          value={formData.handicap.toString()}
          onChangeText={(text) => setFormData({ ...formData, handicap: parseInt(text) || 0 })}
          keyboardType="numeric"
          placeholder="Enter your current handicap"
        />

        {tournament.handicapLimit && (
          <Text style={styles.handicapNote}>
            Maximum handicap for this tournament: {tournament.handicapLimit}
          </Text>
        )}
      </Card>

      {tournament.isTeamEvent && (
        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          <Text style={styles.sectionNote}>
            This tournament requires {tournament.teamSize} players per team.
            {(tournament.teamSize || 4) - 1} team members below.
          </Text>

          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMemberContainer}>
              <Text style={styles.teamMemberTitle}>Team Member {index + 1}</Text>

              <Input
                label="Name"
                value={member.name}
                onChangeText={(text) => updateTeamMember(index, 'name', text)}
                placeholder="Enter team member name"
              />

              <Input
                label="Handicap"
                value={member.handicap.toString()}
                onChangeText={(text) => updateTeamMember(index, 'handicap', parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="Enter handicap"
              />

              <CheckBox
                title="Guest Player"
                checked={member.isGuest}
                onPress={() => updateTeamMember(index, 'isGuest', !member.isGuest)}
                containerStyle={styles.checkboxContainer}
              />

              {member.isGuest && (
                <Input
                  label="Guest Contact Information"
                  value={member.guestContact || ''}
                  onChangeText={(text) => updateTeamMember(index, 'guestContact', text)}
                  placeholder="Phone number or email"
                  multiline
                />
              )}

              <Button
                title="Remove Member"
                buttonStyle={styles.removeButton}
                titleStyle={styles.removeButtonText}
                onPress={() => removeTeamMember(index)}
              />
            </View>
          ))}

          {teamMembers.length < (tournament.teamSize || 4) - 1 && (
            <Button
              title="Add Team Member"
              buttonStyle={styles.addButton}
              onPress={addTeamMember}
            />
          )}
        </Card>
      )}

      <Card containerStyle={styles.card}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        <Input
          label="Name *"
          value={formData.emergencyContact.name}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              emergencyContact: { ...formData.emergencyContact, name: text },
            })
          }
          placeholder="Emergency contact name"
        />

        <Input
          label="Phone Number *"
          value={formData.emergencyContact.phone}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              emergencyContact: { ...formData.emergencyContact, phone: text },
            })
          }
          placeholder="Emergency contact phone"
          keyboardType="phone-pad"
        />

        <Text style={styles.pickerLabel}>Relationship *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.emergencyContact.relationship}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, relationship: value },
              })
            }
            style={styles.picker}>
            <Picker.Item label="Select relationship" value="" />
            {relationships.map((relationship) => (
              <Picker.Item key={relationship} label={relationship} value={relationship} />
            ))}
          </Picker>
        </View>
      </Card>

      <Card containerStyle={styles.card}>
        <Text style={styles.sectionTitle}>Additional Information</Text>

        <Input
          label="Dietary Preferences"
          value={formData.dietaryPreferences}
          onChangeText={(text) => setFormData({ ...formData, dietaryPreferences: text })}
          placeholder="Any dietary restrictions or preferences"
          multiline
        />

        <Text style={styles.pickerLabel}>T-Shirt Size</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.tshirtSize}
            onValueChange={(value) => setFormData({ ...formData, tshirtSize: value as any })}
            style={styles.picker}>
            {tshirtSizes.map((size) => (
              <Picker.Item key={size} label={size} value={size} />
            ))}
          </Picker>
        </View>

        <Input
          label="Special Requests"
          value={formData.specialRequests}
          onChangeText={(text) => setFormData({ ...formData, specialRequests: text })}
          placeholder="Any special requests or accommodations needed"
          multiline
        />
      </Card>

      <Card containerStyle={styles.card}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <View style={styles.paymentInfo}>
          <Text style={styles.feeText}>Entry Fee: {formatCurrency(tournament.entryFee)}</Text>
          <Text style={styles.paymentNote}>
            Payment will be processed upon registration confirmation
          </Text>
        </View>
      </Card>

      <Card containerStyle={styles.card}>
        <CheckBox
          title="I accept the tournament terms and conditions, rules, and cancellation policy"
          checked={formData.termsAccepted}
          onPress={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })}
          containerStyle={styles.termsCheckbox}
          textStyle={styles.termsText}
        />
      </Card>

      {error && (
        <Card containerStyle={[styles.card, styles.errorCard]}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <Button
        title={`Register for ${formatCurrency(tournament.entryFee)}`}
        buttonStyle={styles.submitButton}
        titleStyle={styles.submitButtonText}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading || !formData.termsAccepted}
      />

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  sectionNote: {
    fontSize: 14,
    color: '#86939E',
    marginBottom: 16,
    lineHeight: 20,
  },
  disabledInput: {
    color: '#86939E',
  },
  handicapNote: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: -8,
    marginBottom: 16,
  },
  teamMemberContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  teamMemberTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#43484D',
    marginBottom: 12,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
    marginTop: 8,
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F44336',
    marginTop: 8,
  },
  removeButtonText: {
    color: '#F44336',
  },
  addButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2E7D32',
    marginTop: 8,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#86939E',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E8EE',
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  paymentInfo: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  feeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  paymentNote: {
    fontSize: 12,
    color: '#86939E',
    textAlign: 'center',
  },
  termsCheckbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
  },
  termsText: {
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default RegistrationForm;
