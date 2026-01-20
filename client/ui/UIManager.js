export class UIManager {
  constructor(app) {
    this.app = app;
    this.screens = {
      loading: document.getElementById('loading-screen'),
      lobby: document.getElementById('lobby-screen'),
      countdown: document.getElementById('countdown-screen'),
      results: document.getElementById('results-screen')
    };
    this.hud = document.getElementById('game-hud');
    this.isJoined = false;
    this.restartInterval = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Bouton rejoindre
    const joinBtn = document.getElementById('join-btn');
    const playerNameInput = document.getElementById('player-name');
    
    joinBtn.addEventListener('click', () => {
      const name = playerNameInput.value.trim() || `Rider${Math.floor(Math.random() * 999)}`;
      this.app.joinGame(name);
    });

    playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        joinBtn.click();
      }
    });

    // Bouton prêt
    const readyBtn = document.getElementById('ready-btn');
    readyBtn.addEventListener('click', () => {
      if (!readyBtn.classList.contains('active')) {
        this.app.setReady();
        readyBtn.classList.add('active');
        readyBtn.innerHTML = '<span>✓ Prêt!</span>';
      }
    });
  }

  showScreen(screenName) {
    // Cacher tous les écrans
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });

    // Afficher l'écran demandé
    if (screenName === 'game') {
      this.hud.style.display = 'block';
    } else {
      this.hud.style.display = 'none';
      if (this.screens[screenName]) {
        this.screens[screenName].classList.add('active');
      }
    }
  }

  onJoinedGame(data) {
    this.isJoined = true;
    document.getElementById('ready-section').style.display = 'block';
    document.querySelector('.join-section').style.display = 'none';
  }

  updatePlayerList(data, myPlayerId) {
    const listEl = document.getElementById('players-list');
    const countEl = document.getElementById('player-count');
    const maxEl = document.getElementById('max-players');
    
    countEl.textContent = data.players.length;
    maxEl.textContent = data.maxPlayers;

    if (data.players.length === 0) {
      listEl.innerHTML = '<p class="empty-message">En attente de joueurs...</p>';
      return;
    }

    listEl.innerHTML = data.players.map(player => {
      const isMe = player.id === myPlayerId;
      const classes = ['player-item'];
      if (player.ready) classes.push('ready');
      if (isMe) classes.push('is-you');
      
      return `
        <div class="${classes.join(' ')}">
          <span class="player-name">${isMe ? '👤 ' : ''}${player.name}${isMe ? ' (toi)' : ''}</span>
          <span class="player-status">${player.ready ? '✓ Prêt' : 'En attente...'}</span>
        </div>
      `;
    }).join('');
  }

  showCountdown(count) {
    this.showScreen('countdown');
    const countdownEl = document.getElementById('countdown-number');
    
    if (count > 0) {
      countdownEl.textContent = count;
      countdownEl.style.animation = 'none';
      countdownEl.offsetHeight; // Trigger reflow
      countdownEl.style.animation = 'pulse 1s ease-in-out';
    } else {
      countdownEl.textContent = 'GO!';
      countdownEl.style.color = '#00ff88';
    }
  }

  updateHUD(data) {
    // Timer
    const timerEl = document.getElementById('race-timer');
    const minutes = Math.floor(data.time / 60000);
    const seconds = Math.floor((data.time % 60000) / 1000);
    const ms = Math.floor((data.time % 1000) / 10);
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;

    // Vitesse
    const speedEl = document.getElementById('speed-value');
    speedEl.textContent = Math.round(data.speed);

    // Progression
    const progressEl = document.getElementById('progress-fill');
    progressEl.style.width = `${Math.min(100, data.progress)}%`;

    // Indicateur de boost
    const boostEl = document.getElementById('boost-indicator');
    if (data.isBoosting) {
      boostEl.style.display = 'block';
    } else {
      boostEl.style.display = 'none';
    }

    // Indicateur de figure
    const trickEl = document.getElementById('trick-indicator');
    if (data.isTricking) {
      trickEl.style.display = 'block';
    } else {
      trickEl.style.display = 'none';
    }
  }

  showPlayerFinished(data) {
    console.log(`🏁 ${data.name} a terminé en ${(data.time / 1000).toFixed(2)}s`);
  }

  showResults(data) {
    this.showScreen('results');
    
    const podiumEl = document.getElementById('podium');
    const rankingsEl = document.getElementById('full-rankings');
    const easterEggEl = document.getElementById('easter-egg-message');

    // Easter egg - pas de message, le podium suffit
    easterEggEl.style.display = 'none';

    // Podium (top 3)
    const top3 = data.rankings.slice(0, 3);
    const podiumOrder = [1, 0, 2]; // 2e, 1er, 3e (pour l'affichage visuel)
    
    podiumEl.innerHTML = podiumOrder.map(index => {
      const player = top3[index];
      if (!player) return '';
      
      const placeClass = ['first', 'second', 'third'][index];
      const emoji = ['🥇', '🥈', '🥉'][index];
      const time = this.formatTime(player.time);
      
      return `
        <div class="podium-place ${placeClass}">
          <div class="podium-avatar">${emoji}</div>
          <div class="podium-name">${player.name}</div>
          <div class="podium-time">${time}</div>
          <div class="podium-block">${player.rank}</div>
        </div>
      `;
    }).join('');

    // Classement complet
    rankingsEl.innerHTML = data.rankings.map(player => {
      const time = this.formatTime(player.time);
      return `
        <div class="ranking-item">
          <span class="ranking-position">${player.rank}.</span>
          <span class="ranking-name">${player.name}</span>
          <span class="ranking-time">${time}</span>
        </div>
      `;
    }).join('');

  }

  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }
}
