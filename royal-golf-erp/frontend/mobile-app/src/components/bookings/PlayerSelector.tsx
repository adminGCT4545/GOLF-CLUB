import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Icon, Input, Button, CheckBox } from 'react-native-elements';
import { theme } from '../../constants/theme';
import { PlayerRequest } from '../../types/booking';

interface PlayerSelectorProps {
  players: PlayerRequest[];
  maxPlayers: number;
  onPlayersChange: (players: PlayerRequest[]) => void;
  currentMemberId: string;
  currentMemberName: string;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  maxPlayers,
  onPlayersChange,
  currentMemberId,
  currentMemberName,
}) => {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState<PlayerRequest>({
    name: '',
    isGuest: true,
    email: '',
    phone: '',
    handicap: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddPlayer = () => {
    const newErrors: Record<string, string> = {};

    if (!newPlayer.name.trim()) {
      newErrors.name = 'Player name is required';
    }

    if (newPlayer.isGuest && !newPlayer.email && !newPlayer.phone) {
      newErrors.contact = 'Guest players must provide email or phone';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onPlayersChange([...players, newPlayer]);
    setNewPlayer({
      name: '',
      isGuest: true,
      email: '',
      phone: '',
      handicap: undefined,
    });
    setErrors({});
    setShowAddPlayer(false);
  };

  const handleRemovePlayer = (index: number) => {
    const updatedPlayers = players.filter((_, i) => i !== index);
    onPlayersChange(updatedPlayers);
  };

  const isCurrentMember = (player: PlayerRequest) => {
    return player.memberId === currentMemberId;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Players ({players.length}/{maxPlayers})
        </Text>
        {players.length < maxPlayers && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddPlayer(true)}>
            <Icon name="person-add" type="material" size={20} color={theme.colors?.primary} />
            <Text style={styles.addButtonText}>Add Player</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
        {players.map((player, index) => (
          <View key={index} style={styles.playerCard}>
            <View style={styles.playerInfo}>
              <View style={styles.playerHeader}>
                <Icon
                  name={player.isGuest ? 'person-outline' : 'person'}
                  type="material"
                  size={24}
                  color={isCurrentMember(player) ? theme.colors?.primary : theme.colors?.grey2}
                />
                <View style={styles.playerDetails}>
                  <Text style={styles.playerName}>
                    {player.name}
                    {isCurrentMember(player) && ' (You)'}
                  </Text>
                  <Text style={styles.playerType}>
                    {player.isGuest ? 'Guest' : 'Member'}
                    {player.handicap !== undefined && ` • HC: ${player.handicap}`}
                  </Text>
                </View>
              </View>

              {(player.email || player.phone) && (
                <View style={styles.contactInfo}>
                  {player.email && (
                    <View style={styles.contactRow}>
                      <Icon name="email" type="material" size={14} color={theme.colors?.grey3} />
                      <Text style={styles.contactText}>{player.email}</Text>
                    </View>
                  )}
                  {player.phone && (
                    <View style={styles.contactRow}>
                      <Icon name="phone" type="material" size={14} color={theme.colors?.grey3} />
                      <Text style={styles.contactText}>{player.phone}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {!isCurrentMember(player) && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePlayer(index)}>
                <Icon name="close" type="material" size={20} color={theme.colors?.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add Player Modal */}
      <Modal
        visible={showAddPlayer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPlayer(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Player</Text>
              <TouchableOpacity onPress={() => setShowAddPlayer(false)}>
                <Icon name="close" type="material" size={24} color={theme.colors?.grey2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Player Name"
                placeholder="Enter player name"
                value={newPlayer.name}
                onChangeText={(text) => {
                  setNewPlayer({ ...newPlayer, name: text });
                  setErrors({ ...errors, name: '' });
                }}
                errorMessage={errors.name}
              />

              <CheckBox
                title="Guest Player"
                checked={newPlayer.isGuest}
                onPress={() => setNewPlayer({ ...newPlayer, isGuest: !newPlayer.isGuest })}
                containerStyle={styles.checkboxContainer}
              />

              {newPlayer.isGuest && (
                <>
                  <Input
                    label="Email"
                    placeholder="guest@example.com"
                    value={newPlayer.email}
                    onChangeText={(text) => {
                      setNewPlayer({ ...newPlayer, email: text });
                      setErrors({ ...errors, contact: '' });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Input
                    label="Phone"
                    placeholder="+1 234 567 8900"
                    value={newPlayer.phone}
                    onChangeText={(text) => {
                      setNewPlayer({ ...newPlayer, phone: text });
                      setErrors({ ...errors, contact: '' });
                    }}
                    keyboardType="phone-pad"
                  />

                  {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}
                </>
              )}

              <Input
                label="Handicap (Optional)"
                placeholder="0-36"
                value={newPlayer.handicap?.toString() || ''}
                onChangeText={(text) => {
                  const handicap = text ? parseInt(text) : undefined;
                  if (handicap === undefined || (handicap >= 0 && handicap <= 36)) {
                    setNewPlayer({ ...newPlayer, handicap });
                  }
                }}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                type="outline"
                onPress={() => setShowAddPlayer(false)}
                buttonStyle={[styles.modalButton, styles.cancelModalButton]}
                titleStyle={styles.cancelButtonText}
              />
              <Button
                title="Add Player"
                onPress={handleAddPlayer}
                buttonStyle={[styles.modalButton, styles.confirmModalButton]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors?.grey0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors?.grey5,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: theme.colors?.primary,
    fontWeight: '500',
  },
  playersList: {
    maxHeight: 300,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: theme.colors?.grey5,
    borderRadius: 8,
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerDetails: {
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors?.grey0,
  },
  playerType: {
    fontSize: 14,
    color: theme.colors?.grey2,
    marginTop: 2,
  },
  contactInfo: {
    marginTop: 8,
    marginLeft: 36,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: theme.colors?.grey3,
    marginLeft: 4,
  },
  removeButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors?.greyOutline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors?.grey0,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors?.error,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors?.greyOutline,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  cancelModalButton: {
    borderColor: theme.colors?.grey3,
  },
  confirmModalButton: {
    backgroundColor: theme.colors?.primary,
  },
  cancelButtonText: {
    color: theme.colors?.grey2,
  },
});

export default PlayerSelector;
