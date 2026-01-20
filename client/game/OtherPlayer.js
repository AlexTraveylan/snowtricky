import * as THREE from 'three';

export class OtherPlayer {
  constructor(scene, name) {
    this.scene = scene;
    this.name = name;
    this.mesh = null;
    this.nameLabel = null;
    
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    this.currentPosition = new THREE.Vector3();
    this.currentRotation = new THREE.Euler();
    
    this.isJumping = false;
    this.isTricking = false;
  }

  init() {
    // Créer le mesh du joueur (similaire au joueur local mais avec une couleur différente)
    const group = new THREE.Group();

    // Couleur aléatoire pour différencier les joueurs
    const colors = [0xE91E63, 0x9C27B0, 0x673AB7, 0x4CAF50, 0xFFC107, 0xFF5722];
    const playerColor = colors[Math.floor(Math.random() * colors.length)];

    // Corps
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: playerColor,
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
      color: playerColor,
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
    group.add(board);

    this.mesh = group;
    this.scene.add(this.mesh);

    // Créer le label avec le nom
    this.createNameLabel();
  }

  createNameLabel() {
    // Créer un sprite avec le nom du joueur
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    // Style du texte
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, 256, 64);
    context.font = 'Bold 32px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(this.name, 128, 42);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    this.nameLabel = new THREE.Sprite(spriteMaterial);
    this.nameLabel.scale.set(2, 0.5, 1);
    this.nameLabel.position.y = 2.5;
    
    this.mesh.add(this.nameLabel);
  }

  update(data) {
    // Mettre à jour les positions cibles pour l'interpolation
    this.targetPosition.set(data.position.x, data.position.y, data.position.z);
    this.targetRotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    this.isJumping = data.isJumping;
    this.isTricking = data.isTricking;
  }

  interpolate(delta) {
    if (!this.mesh) return;

    // Interpolation douce vers la position cible
    this.currentPosition.lerp(this.targetPosition, delta * 10);
    this.mesh.position.copy(this.currentPosition);

    // Interpolation de la rotation
    this.mesh.rotation.x = THREE.MathUtils.lerp(
      this.mesh.rotation.x,
      this.targetRotation.x,
      delta * 10
    );
    this.mesh.rotation.z = THREE.MathUtils.lerp(
      this.mesh.rotation.z,
      this.targetRotation.z,
      delta * 10
    );
  }

  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      // Libérer les ressources
      this.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }
}
