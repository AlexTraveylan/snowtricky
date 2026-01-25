import * as THREE from 'three';
import { Player } from './Player.js';
import { Track } from './Track.js';
import { OtherPlayer } from './OtherPlayer.js';
import { SnowParticles } from './SnowParticles.js';

export class Game {
  constructor(app) {
    this.app = app;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.track = null;
    this.otherPlayers = new Map();
    this.snowParticles = null;
    
    this.isRacing = false;
    this.raceStartTime = 0;
    this.currentTime = 0;
    
    this.clock = new THREE.Clock();
    this.updateInterval = null;
  }

  async init() {
    // Créer la scène
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x89CFF0); // Ciel bleu clair (plus clair)
    this.scene.fog = new THREE.Fog(0x89CFF0, 100, 600); // Brouillard étendu pour grande visibilité

    // Créer le renderer
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Créer la caméra
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);

    // Lumières
    this.setupLights();

    // Créer la piste
    this.track = new Track(this.scene);
    await this.track.init();

    // Créer le joueur
    this.player = new Player(this.scene, this.camera, this.track);
    await this.player.init();

    // Créer les particules de neige
    this.snowParticles = new SnowParticles(this.scene, this.camera);
    this.snowParticles.init();

    // Gérer le redimensionnement
    window.addEventListener('resize', () => this.onResize());

    // Boucle de rendu
    this.animate();
  }

  setupLights() {
    // Lumière ambiante
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Lumière directionnelle (soleil)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    this.scene.add(sunLight);

    // Lumière de remplissage
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-50, 50, -50);
    this.scene.add(fillLight);
  }

  startRace(startTime) {
    this.isRacing = true;
    // Utiliser le temps local du client pour éviter les décalages d'horloge
    this.raceStartTime = Date.now();
    this.currentTime = 0;
    
    this.player.reset();
    this.player.enableControls();

    // Envoyer les mises à jour de position régulièrement
    this.updateInterval = setInterval(() => {
      if (this.isRacing) {
        this.app.sendPlayerUpdate(this.player.getNetworkData());
      }
    }, 50); // 20 fois par seconde
  }

  endRace() {
    this.isRacing = false;
    this.player.disableControls();
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  reset() {
    this.isRacing = false;
    this.raceStartTime = 0;
    this.currentTime = 0;
    this.player.reset();
    
    // Supprimer les autres joueurs
    for (const [id, otherPlayer] of this.otherPlayers) {
      otherPlayer.dispose();
    }
    this.otherPlayers.clear();
  }

  updateOtherPlayers(playersData, myId) {
    for (const [id, data] of Object.entries(playersData)) {
      if (id === myId) continue;

      if (!this.otherPlayers.has(id)) {
        // Créer un nouveau joueur
        const otherPlayer = new OtherPlayer(this.scene, data.name);
        otherPlayer.init();
        this.otherPlayers.set(id, otherPlayer);
      }

      // Mettre à jour la position
      const otherPlayer = this.otherPlayers.get(id);
      otherPlayer.update(data);
    }

    // Supprimer les joueurs qui ne sont plus dans la liste
    for (const [id, otherPlayer] of this.otherPlayers) {
      if (!playersData[id]) {
        otherPlayer.dispose();
        this.otherPlayers.delete(id);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.isRacing) {
      // Mettre à jour le temps
      this.currentTime = Date.now() - this.raceStartTime;

      // Mettre à jour le joueur
      this.player.update(delta);

      // Mettre à jour les autres joueurs
      for (const otherPlayer of this.otherPlayers.values()) {
        otherPlayer.interpolate(delta);
      }

      // Mettre à jour la piste (obstacles, boosts, etc.)
      this.track.update(this.player.position.z);

      // Mettre à jour les particules de neige
      this.snowParticles.update(this.player.position);

      // Vérifier si le joueur a terminé
      if (this.player.hasFinished && !this.player.finishReported) {
        this.player.finishReported = true;
        this.app.playerFinished(this.currentTime);
      }

      // Mettre à jour le HUD
      this.app.updateHUD({
        time: this.currentTime,
        speed: this.player.getSpeed() * 3.6, // Convertir en km/h
        progress: this.player.getProgress() * 100,
        isBoosting: this.player.isBoosting,
        isTricking: this.player.isTricking
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }
}
