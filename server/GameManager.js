// États du jeu
const GameState = {
  WAITING: 'waiting',
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  FINISHED: 'finished'
};

export class GameManager {
  constructor(io) {
    this.io = io;
    this.players = new Map();
    this.gameState = GameState.WAITING;
    this.raceStartTime = null;
    this.finishedPlayers = [];
    this.countdownTimer = null;
    this.maxPlayers = 6;
    this.minPlayersToStart = 1; // Minimum 1 joueur pour tester, augmenter à 2 en prod
  }

  addPlayer(socket, playerName) {
    if (this.players.size >= this.maxPlayers) {
      socket.emit('game-full');
      return;
    }

    if (this.gameState === GameState.RACING) {
      socket.emit('game-in-progress');
      return;
    }

    const player = {
      id: socket.id,
      name: playerName || `Joueur ${this.players.size + 1}`,
      ready: false,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isJumping: false,
      isTricking: false,
      finishTime: null,
      socket: socket
    };

    this.players.set(socket.id, player);
    
    // Informer le joueur qu'il a rejoint
    socket.emit('joined-game', {
      playerId: socket.id,
      playerName: player.name,
      gameState: this.gameState
    });

    // Informer tous les joueurs de la liste mise à jour
    this.broadcastPlayerList();
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      this.broadcastPlayerList();

      // Si plus de joueurs, réinitialiser
      if (this.players.size === 0) {
        this.resetGame();
      }
    }
  }

  updatePlayer(playerId, data) {
    const player = this.players.get(playerId);
    if (player && this.gameState === GameState.RACING) {
      player.position = data.position;
      player.rotation = data.rotation;
      player.velocity = data.velocity;
      player.isJumping = data.isJumping;
      player.isTricking = data.isTricking;

      // Broadcast aux autres joueurs
      this.io.emit('players-update', this.getPlayersData());
    }
  }

  setPlayerReady(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.ready = true;
      this.broadcastPlayerList();
      
      // Vérifier si tous les joueurs sont prêts
      this.checkAllReady();
    }
  }

  checkAllReady() {
    const allReady = Array.from(this.players.values()).every(p => p.ready);
    const enoughPlayers = this.players.size >= this.minPlayersToStart;

    if (allReady && enoughPlayers && this.gameState === GameState.WAITING) {
      this.startCountdown();
    }
  }

  startCountdown() {
    this.gameState = GameState.COUNTDOWN;
    let count = 3;

    this.io.emit('countdown', count);
    
    this.countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        this.io.emit('countdown', count);
      } else {
        clearInterval(this.countdownTimer);
        this.startRace();
      }
    }, 1000);
  }

  startRace() {
    this.gameState = GameState.RACING;
    this.raceStartTime = Date.now();
    this.finishedPlayers = [];

    this.io.emit('race-start', {
      startTime: this.raceStartTime
    });
  }

  playerFinished(playerId, clientTime) {
    const player = this.players.get(playerId);
    if (player && !player.finishTime && this.gameState === GameState.RACING) {
      player.finishTime = clientTime;
      this.finishedPlayers.push({
        id: playerId,
        name: player.name,
        time: clientTime
      });

      // Informer tous les joueurs
      this.io.emit('player-finished-race', {
        playerId,
        name: player.name,
        time: clientTime
      });

      // Vérifier si tous ont terminé
      if (this.finishedPlayers.length === this.players.size) {
        this.endRace();
      }
    }
  }

  endRace() {
    this.gameState = GameState.FINISHED;

    // Trier par temps
    let rankings = [...this.finishedPlayers].sort((a, b) => a.time - b.time);

    const timIndex = rankings.findIndex(p => p.name === 'Tim');
    if (timIndex !== -1) {
      const tim = rankings.splice(timIndex, 1)[0];
      rankings.unshift(tim);
    }

    // Ajouter le rang
    rankings = rankings.map((p, index) => ({
      ...p,
      rank: index + 1
    }));

    this.io.emit('race-end', {
      rankings,
      hasEasterEgg: timIndex !== -1
    });
  }

  resetGame() {
    this.gameState = GameState.WAITING;
    this.raceStartTime = null;
    this.finishedPlayers = [];
    
    // Réinitialiser les joueurs
    for (const player of this.players.values()) {
      player.ready = false;
      player.finishTime = null;
      player.position = { x: 0, y: 0, z: 0 };
    }

    this.io.emit('game-reset');
    this.broadcastPlayerList();
  }

  broadcastPlayerList() {
    const playerList = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready
    }));

    this.io.emit('player-list', {
      players: playerList,
      gameState: this.gameState,
      maxPlayers: this.maxPlayers
    });
  }

  getPlayersData() {
    const data = {};
    for (const [id, player] of this.players) {
      data[id] = {
        id: player.id,
        name: player.name,
        position: player.position,
        rotation: player.rotation,
        velocity: player.velocity,
        isJumping: player.isJumping,
        isTricking: player.isTricking
      };
    }
    return data;
  }
}
