import * as THREE from 'three';

export class Player {
  constructor(scene, camera, track) {
    this.scene = scene;
    this.camera = camera;
    this.track = track;
    
    this.mesh = null;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    
    // Paramètres de mouvement
    this.baseSpeed = 30; // Vitesse de base (m/s)
    this.currentSpeed = this.baseSpeed;
    this.maxSpeed = 60;
    this.acceleration = 5;
    this.turnSpeed = 3;
    this.lateralSpeed = 20;
    
    // Saut
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.jumpForce = 15;
    this.gravity = 35;
    this.groundY = 0;
    
    // Figure (trick)
    this.isTricking = false;
    this.trickRotation = 0;
    this.trickBonus = false;
    
    // Boost
    this.isBoosting = false;
    this.boostMultiplier = 1.5;
    this.boostDuration = 0;
    this.maxBoostDuration = 2;
    
    // Contrôles
    this.controlsEnabled = false;
    this.keys = {
      left: false,
      right: false,
      jump: false,
      trick: false
    };
    
    // État
    this.hasFinished = false;
    this.finishReported = false;
    this.trackLength = 1500; // Longueur de la piste en mètres
    
    // Trail effect
    this.trailParticles = [];
  }

  async init() {
    // Créer le snowboarder (forme simple)
    const group = new THREE.Group();

    // Corps du personnage
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2196F3,
      roughness: 0.5,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    // Tête
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFDBB4,
      roughness: 0.8
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    group.add(head);

    // Casque
    const helmetGeometry = new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFF5722,
      roughness: 0.3,
      metalness: 0.5
    });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 1.55;
    helmet.castShadow = true;
    group.add(helmet);

    // Snowboard
    const boardGeometry = new THREE.BoxGeometry(0.3, 0.05, 1.5);
    const boardMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1A1A2E,
      roughness: 0.2,
      metalness: 0.8
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = 0.025;
    board.castShadow = true;
    board.receiveShadow = true;
    group.add(board);

    this.mesh = group;
    this.scene.add(this.mesh);

    // Écouteurs de touches
    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (!this.controlsEnabled) return;
      
      switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.keys.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.keys.right = true;
          break;
        case 'Space':
          if (!this.isJumping) {
            this.keys.jump = true;
          }
          break;
        case 'KeyF':
          if (this.isJumping && !this.isTricking) {
            this.keys.trick = true;
          }
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.keys.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
        case 'KeyF':
          this.keys.trick = false;
          break;
      }
    });
  }

  enableControls() {
    this.controlsEnabled = true;
  }

  disableControls() {
    this.controlsEnabled = false;
  }

  reset() {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.currentSpeed = this.baseSpeed;
    this.isJumping = false;
    this.isTricking = false;
    this.isBoosting = false;
    this.boostDuration = 0;
    this.trickRotation = 0;
    this.trickBonus = false;
    this.hasFinished = false;
    this.finishReported = false;
    
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.set(0, 0, 0);
    }
  }

  update(delta) {
    if (this.hasFinished) return;

    // Mouvement latéral
    let lateralMove = 0;
    if (this.keys.left) lateralMove = -this.lateralSpeed * delta;
    if (this.keys.right) lateralMove = this.lateralSpeed * delta;

    // Limiter la position latérale (largeur de la piste)
    const newX = this.position.x + lateralMove;
    this.position.x = THREE.MathUtils.clamp(newX, -8, 8);

    // Saut
    if (this.keys.jump && !this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpForce;
      this.keys.jump = false;
    }

    if (this.isJumping) {
      this.jumpVelocity -= this.gravity * delta;
      this.position.y += this.jumpVelocity * delta;

      // Trick (figure en l'air)
      if (this.keys.trick && !this.isTricking) {
        this.isTricking = true;
        this.trickRotation = 0;
      }

      if (this.isTricking) {
        this.trickRotation += delta * 10; // Rotation rapide
        if (this.mesh) {
          this.mesh.rotation.x = this.trickRotation;
        }
        
        // Figure complète (360°)
        if (this.trickRotation >= Math.PI * 2) {
          this.trickBonus = true;
          this.isTricking = false;
        }
      }

      // Atterrissage
      if (this.position.y <= this.groundY) {
        this.position.y = this.groundY;
        this.isJumping = false;
        this.jumpVelocity = 0;
        
        // Bonus de trick à l'atterrissage
        if (this.trickBonus) {
          this.activateBoost(1.5); // Boost de 1.5 secondes
          this.trickBonus = false;
        }
        
        this.isTricking = false;
        this.trickRotation = 0;
        if (this.mesh) {
          this.mesh.rotation.x = 0;
        }
      }
    }

    // Gestion du boost
    if (this.isBoosting) {
      this.boostDuration -= delta;
      if (this.boostDuration <= 0) {
        this.isBoosting = false;
        this.boostDuration = 0;
      }
    }

    // Calculer la vitesse actuelle
    const targetSpeed = this.isBoosting ? this.baseSpeed * this.boostMultiplier : this.baseSpeed;
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, delta * 3);

    // Avancer sur la piste (descente)
    this.position.z -= this.currentSpeed * delta;

    // Vérifier les collisions avec les arbres
    this.checkCollisions();

    // Vérifier les boosts sur la piste
    this.checkBoosts();

    // Vérifier les rampes
    this.checkRamps();

    // Vérifier si arrivé
    if (Math.abs(this.position.z) >= this.trackLength) {
      this.hasFinished = true;
    }

    // Mettre à jour le mesh
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      
      // Légère inclinaison lors des virages
      const targetRotationZ = lateralMove * 5;
      this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, targetRotationZ, delta * 10);
    }

    // Mettre à jour la caméra
    this.updateCamera(delta);
  }

  checkCollisions() {
    const obstacles = this.track.getObstaclesNear(this.position.z);
    
    for (const obstacle of obstacles) {
      const dx = this.position.x - obstacle.position.x;
      const dz = this.position.z - obstacle.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < obstacle.radius + 0.5) { // 0.5 = rayon du joueur
        // Collision! Ralentir le joueur
        this.currentSpeed = Math.max(this.baseSpeed * 0.5, this.currentSpeed * 0.7);
        
        // Repousser légèrement le joueur
        const pushDirection = dx > 0 ? 1 : -1;
        this.position.x += pushDirection * 0.5;
      }
    }
  }

  checkBoosts() {
    const boosts = this.track.getBoostsNear(this.position.z);
    
    for (const boost of boosts) {
      if (boost.collected) continue;
      
      const dx = this.position.x - boost.position.x;
      const dz = this.position.z - boost.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < 1.5) {
        boost.collected = true;
        this.activateBoost(this.maxBoostDuration);
        this.track.hideBoost(boost);
      }
    }
  }

  checkRamps() {
    const ramps = this.track.getRampsNear(this.position.z);
    
    for (const ramp of ramps) {
      const dx = Math.abs(this.position.x - ramp.position.x);
      const dz = Math.abs(this.position.z - ramp.position.z);
      
      if (dx < 2 && dz < 1 && !this.isJumping) {
        // Sur la rampe - saut automatique
        this.isJumping = true;
        this.jumpVelocity = this.jumpForce * 1.2; // Saut plus haut
      }
    }
  }

  activateBoost(duration) {
    this.isBoosting = true;
    this.boostDuration = duration;
  }

  updateCamera(delta) {
    // Position cible de la caméra (derrière et au-dessus du joueur)
    const cameraOffset = new THREE.Vector3(0, 5, 12);
    const targetPosition = this.position.clone().add(cameraOffset);
    
    // Interpolation douce
    this.camera.position.lerp(targetPosition, delta * 5);
    
    // Regarder vers le joueur
    const lookTarget = this.position.clone();
    lookTarget.y += 1;
    lookTarget.z -= 10;
    this.camera.lookAt(lookTarget);
  }

  getSpeed() {
    return this.currentSpeed;
  }

  getProgress() {
    return Math.abs(this.position.z) / this.trackLength;
  }

  getNetworkData() {
    return {
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      rotation: {
        x: this.mesh?.rotation.x || 0,
        y: this.mesh?.rotation.y || 0,
        z: this.mesh?.rotation.z || 0
      },
      velocity: {
        x: this.velocity.x,
        y: this.jumpVelocity,
        z: -this.currentSpeed
      },
      isJumping: this.isJumping,
      isTricking: this.isTricking
    };
  }
}
