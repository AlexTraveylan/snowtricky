import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';
import { NetworkManager } from './network/NetworkManager.js';

class SnowTricky {
  constructor() {
    this.game = null;
    this.ui = null;
    this.network = null;
    this.playerId = null;
    this.playerName = null;
    this.isInGame = false;
  }

  async init() {
    
    // Initialiser le gestionnaire UI
    this.ui = new UIManager(this);
    
    // Initialiser le jeu Three.js
    this.game = new Game(this);
    await this.game.init();
    
    // Initialiser le réseau
    this.network = new NetworkManager(this);
    await this.network.connect();
    
    // Cacher l'écran de chargement
    this.ui.showScreen('lobby');
  }

  joinGame(playerName) {
    this.playerName = playerName;
    this.network.joinGame(playerName);
  }

  setReady() {
    this.network.setReady();
  }

  onJoinedGame(data) {
    this.playerId = data.playerId;
    this.playerName = data.playerName;
    this.ui.onJoinedGame(data);
  }

  onPlayerListUpdate(data) {
    this.ui.updatePlayerList(data, this.playerId);
  }

  onCountdown(count) {
    this.ui.showCountdown(count);
  }

  onRaceStart(data) {
    this.isInGame = true;
    this.ui.showScreen('game');
    this.game.startRace(data.startTime);
  }

  onPlayersUpdate(playersData) {
    if (this.isInGame) {
      this.game.updateOtherPlayers(playersData, this.playerId);
    }
  }

  onPlayerFinishedRace(data) {
    this.ui.showPlayerFinished(data);
  }

  onRaceEnd(data) {
    this.isInGame = false;
    this.game.endRace();
    this.ui.showResults(data);
  }

  onGameReset() {
    this.ui.showScreen('lobby');
    this.game.reset();
  }

  // Appelé par le jeu quand le joueur local termine
  playerFinished(time) {
    this.network.playerFinished(time);
  }

  // Appelé par le jeu pour envoyer les mises à jour de position
  sendPlayerUpdate(data) {
    if (this.isInGame) {
      this.network.sendPlayerUpdate(data);
    }
  }

  // Mettre à jour l'UI du HUD
  updateHUD(data) {
    this.ui.updateHUD(data);
  }
}

// Démarrer le jeu
const app = new SnowTricky();
app.init().catch(console.error);
