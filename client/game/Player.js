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
    this.isRampJump = false; // Nouveau: saute-t-on depuis un tremplin?
    this.jumpHeight = 0; // Hauteur max atteinte pendant le saut
    
    // Figure (trick)
    this.isTricking = false;
    this.trickRotation = 0;
    this.trickBonus = false;
    this.failedTrickPenalty = false; // Nouveau: pénalité pour saut raté
    
    // Boost
    this.isBoosting = false;
    this.boostMultiplier = 1.5;
    this.boostDuration = 0;
    this.maxBoostDuration = 2;
    
    // Pénalité
    this.isPenalized = false;
    this.penaltyDuration = 0;
    this.penaltyMultiplier = 0.6; // Ralentissement de 40%
    
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
    this.isRampJump = false;
    this.jumpHeight = 0;
    this.isTricking = false;
    this.isBoosting = false;
    this.boostDuration = 0;
    this.trickRotation = 0;
    this.trickBonus = false;
    this.failedTrickPenalty = false;
    this.isPenalized = false;
    this.penaltyDuration = 0;
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

    // Limiter la position latérale (largeur de la piste élargie)
    const newX = this.position.x + lateralMove;
    this.position.x = THREE.MathUtils.clamp(newX, -13, 13);

    // Saut depuis le sol (pas un tremplin)
    if (this.keys.jump && !this.isJumping) {
      this.isJumping = true;
      this.isRampJump = false; // Saut depuis le sol
      this.jumpVelocity = this.jumpForce * 0.6; // Saut plus faible depuis le sol
      this.jumpHeight = 0;
      this.keys.jump = false;
    }

    if (this.isJumping) {
      this.jumpVelocity -= this.gravity * delta;
      this.position.y += this.jumpVelocity * delta;
      
      // Suivre la hauteur max
      if (this.position.y > this.jumpHeight) {
        this.jumpHeight = this.position.y;
      }

      // Trick (figure en l'air) - SEULEMENT si saut depuis tremplin
      if (this.keys.trick && !this.isTricking) {
        if (this.isRampJump) {
          // OK: saut depuis tremplin, on peut faire un trick
          this.isTricking = true;
          this.trickRotation = 0;
        } else {
          // Tentative de trick depuis un saut au sol = pénalité
          this.failedTrickPenalty = true;
        }
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
        
        // Bonus de trick à l'atterrissage (seulement si trick réussi depuis tremplin)
        if (this.trickBonus && this.isRampJump) {
          this.activateBoost(1.5); // Boost de 1.5 secondes
          this.trickBonus = false;
        }
        
        // Pénalité pour tentative de trick ratée (depuis le sol)
        if (this.failedTrickPenalty) {
          this.activatePenalty(1.0); // Ralentissement de 1 seconde
          this.failedTrickPenalty = false;
        }
        
        this.isTricking = false;
        this.trickRotation = 0;
        this.isRampJump = false;
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
    
    // Gestion de la pénalité
    if (this.isPenalized) {
      this.penaltyDuration -= delta;
      if (this.penaltyDuration <= 0) {
        this.isPenalized = false;
        this.penaltyDuration = 0;
      }
    }

    // Calculer la vitesse actuelle
    let targetSpeed = this.baseSpeed;
    if (this.isBoosting) {
      targetSpeed = this.baseSpeed * this.boostMultiplier;
    } else if (this.isPenalized) {
      targetSpeed = this.baseSpeed * this.penaltyMultiplier;
    }
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
      
      // Hauteur minimale pour passer par-dessus un sapin (depuis un tremplin)
      const treeHeight = 3.5; // Hauteur approximative des sapins obstacles
      const canJumpOver = this.isJumping && this.isRampJump && this.position.y > treeHeight;
      
      if (distance < obstacle.radius + 0.5 && !canJumpOver) { // 0.5 = rayon du joueur
        // Collision avec un sapin! On traverse mais avec ralentissement
        this.currentSpeed = Math.max(this.baseSpeed * 0.4, this.currentSpeed * 0.6);
        
        // Activer une courte pénalité pour le choc
        this.activatePenalty(0.5);
        
        // Léger décalage latéral (effet de choc)
        const pushDirection = dx > 0 ? 1 : -1;
        this.position.x += pushDirection * 0.3;
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
      
      if (dx < 2.5 && dz < 1.5 && !this.isJumping) {
        // Sur la rampe - saut automatique depuis tremplin
        this.isJumping = true;
        this.isRampJump = true; // C'est un saut depuis un tremplin!
        this.jumpVelocity = this.jumpForce * 1.5; // Saut beaucoup plus haut
        this.jumpHeight = 0;
      }
    }
  }

  activateBoost(duration) {
    this.isBoosting = true;
    this.boostDuration = duration;
    this.isPenalized = false; // Annule la pénalité si on obtient un boost
  }
  
  activatePenalty(duration) {
    if (!this.isBoosting) { // La pénalité ne s'applique pas si on est en boost
      this.isPenalized = true;
      this.penaltyDuration = duration;
    }
  }

  updateCamera(delta) {
    // Position cible de la caméra (plus haute et plus en arrière pour voir la descente)
    const cameraOffset = new THREE.Vector3(0, 8, 14);
    const targetPosition = this.position.clone().add(cameraOffset);
    
    // Interpolation douce
    this.camera.position.lerp(targetPosition, delta * 5);
    
    // Regarder plus loin devant pour accentuer l'impression de descente
    const lookTarget = this.position.clone();
    lookTarget.y -= 2; // Regarder légèrement vers le bas
    lookTarget.z -= 25; // Regarder plus loin devant
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
