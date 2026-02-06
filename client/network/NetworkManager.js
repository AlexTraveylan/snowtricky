import { io } from 'socket.io-client';

export class NetworkManager {
  constructor(app) {
    this.app = app;
    this.socket = null;
    this.connected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.connected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });

      // Événements du jeu
      this.socket.on('joined-game', (data) => {
        this.app.onJoinedGame(data);
      });

      this.socket.on('player-list', (data) => {
        this.app.onPlayerListUpdate(data);
      });

      this.socket.on('countdown', (count) => {
        this.app.onCountdown(count);
      });

      this.socket.on('race-start', (data) => {
        this.app.onRaceStart(data);
      });

      this.socket.on('players-update', (data) => {
        this.app.onPlayersUpdate(data);
      });

      this.socket.on('player-finished-race', (data) => {
        this.app.onPlayerFinishedRace(data);
      });

      this.socket.on('race-end', (data) => {
        this.app.onRaceEnd(data);
      });

      this.socket.on('game-reset', () => {
        this.app.onGameReset();
      });

      this.socket.on('game-full', () => {
        alert('La partie est pleine! (max 6 joueurs)');
      });

      this.socket.on('game-in-progress', () => {
        alert('Une course est déjà en cours! Attendez la prochaine partie.');
      });
    });
  }

  joinGame(playerName) {
    if (this.connected) {
      this.socket.emit('join-game', playerName);
    }
  }

  setReady() {
    if (this.connected) {
      this.socket.emit('player-ready');
    }
  }

  sendPlayerUpdate(data) {
    if (this.connected) {
      this.socket.emit('player-update', data);
    }
  }

  playerFinished(time) {
    if (this.connected) {
      this.socket.emit('player-finished', time);
    }
  }
}
