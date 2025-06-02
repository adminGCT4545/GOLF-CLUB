import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_BASE_URL } from '../constants/config';

class WebSocketService {
  private socket: Socket | null = null;

  async connect() {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    this.socket = io(WS_BASE_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) {
      return;
    }

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Add custom event listeners
    this.socket.on('notification', (data) => {
      console.log('New notification:', data);
      // TODO: Dispatch notification to store
    });

    this.socket.on('booking-update', (data) => {
      console.log('Booking update:', data);
      // TODO: Dispatch booking update to store
    });

    this.socket.on('tournament-update', (data) => {
      console.log('Tournament update:', data);
      // TODO: Dispatch tournament update to store
    });

    this.socket.on('leaderboard-update', (data) => {
      console.log('Leaderboard update:', data);
      // TODO: Dispatch leaderboard update to store
    });

    this.socket.on('score-update', (data) => {
      console.log('Score update:', data);
      // TODO: Dispatch score update to store
    });

    this.socket.on('tournament-status-change', (data) => {
      console.log('Tournament status change:', data);
      // TODO: Dispatch tournament status change to store
    });
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.error('WebSocket not connected');
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Tournament-specific methods
  joinTournamentRoom(tournamentId: string) {
    this.emit('join-tournament', { tournamentId });
  }

  leaveTournamentRoom(tournamentId: string) {
    this.emit('leave-tournament', { tournamentId });
  }

  subscribeToLeaderboard(tournamentId: string, callback: (data: any) => void) {
    this.on(`leaderboard-${tournamentId}`, callback);
    this.joinTournamentRoom(tournamentId);
  }

  unsubscribeFromLeaderboard(tournamentId: string, callback?: (data: any) => void) {
    this.off(`leaderboard-${tournamentId}`, callback);
    this.leaveTournamentRoom(tournamentId);
  }

  submitScore(tournamentId: string, playerId: string, scoreData: any) {
    this.emit('submit-score', {
      tournamentId,
      playerId,
      scoreData,
    });
  }
}

export default new WebSocketService();
