import * as THREE from 'three';

export class Track {
  constructor(scene) {
    this.scene = scene;
    this.trackLength = 1500;
    this.trackWidth = 30; // Piste élargie (était 20)
    
    this.obstacles = [];
    this.boosts = [];
    this.ramps = [];
    this.trees = [];
    this.treeRows = []; // Rangées de sapins alignés
    
    this.groundSegments = [];
    this.segmentLength = 100;
    this.visibleSegments = 6; // Plus de segments visibles
    this.lastSegmentZ = 0;
    
    // Matériaux réutilisables
    this.materials = {};
    
    // Référence au skybox pour le faire suivre le joueur
    this.sky = null;
  }

  async init() {
    this.createMaterials();
    this.createInitialGround();
    this.generateTrackElements();
    this.createSkybox();
    this.createMountains();
  }

  createMaterials() {
    // Neige
    this.materials.snow = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0
    });

    // Piste (légèrement différente)
    this.materials.track = new THREE.MeshStandardMaterial({
      color: 0xe8f4fc,
      roughness: 0.7,
      metalness: 0.0
    });

    // Arbre - tronc
    this.materials.trunk = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9
    });

    // Arbre - feuillage
    this.materials.foliage = new THREE.MeshStandardMaterial({
      color: 0x1a472a,
      roughness: 0.8
    });

    // Boost
    this.materials.boost = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      emissive: 0xff4500,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7
    });

    // Rampe
    this.materials.ramp = new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      roughness: 0.5,
      metalness: 0.3
    });
  }

  createInitialGround() {
    // Créer un segment derrière le joueur pour éviter le vide au départ
    this.createGroundSegment(this.segmentLength);
    
    // Créer les segments devant
    for (let i = 0; i < this.visibleSegments; i++) {
      this.createGroundSegment(-i * this.segmentLength);
    }
    this.lastSegmentZ = -(this.visibleSegments - 1) * this.segmentLength;
  }

  createGroundSegment(zPosition) {
    // Sol de la piste (plus large)
    const groundGeometry = new THREE.PlaneGeometry(this.trackWidth, this.segmentLength);
    const ground = new THREE.Mesh(groundGeometry, this.materials.track);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, zPosition - this.segmentLength / 2);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Neige sur les côtés (plus large pour éviter les trous)
    const sideGeometry = new THREE.PlaneGeometry(50, this.segmentLength);
    
    const leftSide = new THREE.Mesh(sideGeometry, this.materials.snow);
    leftSide.rotation.x = -Math.PI / 2;
    leftSide.position.set(-this.trackWidth / 2 - 25, -0.1, zPosition - this.segmentLength / 2);
    leftSide.receiveShadow = true;
    this.scene.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeometry, this.materials.snow);
    rightSide.rotation.x = -Math.PI / 2;
    rightSide.position.set(this.trackWidth / 2 + 25, -0.1, zPosition - this.segmentLength / 2);
    rightSide.receiveShadow = true;
    this.scene.add(rightSide);

    this.groundSegments.push({ ground, leftSide, rightSide, z: zPosition });
  }

  generateTrackElements() {
    // Générer des arbres le long de la piste (bordures)
    for (let z = -20; z > -this.trackLength; z -= 12) {
      // Arbres sur les côtés (bordures de piste)
      if (Math.random() > 0.25) {
        const leftX = -this.trackWidth / 2 - 2 - Math.random() * 12;
        this.createTree(leftX, z + Math.random() * 8);
      }
      if (Math.random() > 0.25) {
        const rightX = this.trackWidth / 2 + 2 + Math.random() * 12;
        this.createTree(rightX, z + Math.random() * 8);
      }

      // Arbres obstacles isolés sur la piste (plus rares)
      if (Math.random() > 0.9) {
        const obstacleX = (Math.random() - 0.5) * (this.trackWidth - 6);
        this.createObstacleTree(obstacleX, z);
      }
    }

    // Générer des rangées de sapins (murs avec passage) - beaucoup plus fréquentes
    let lastRowZ = -80;
    for (let z = -80; z > -this.trackLength + 100; z -= 60) {
      // Probabilité plus élevée d'avoir une rangée
      if (Math.random() > 0.35) {
        // Décider du côté du passage (gauche ou droite)
        const passageOnLeft = Math.random() > 0.5;
        const addRamp = Math.random() > 0.5; // Au moins 50% de chance d'avoir un tremplin
        this.createTreeRow(z, passageOnLeft, addRamp);
        lastRowZ = z;
      }
    }

    // Générer des boosts
    for (let z = -100; z > -this.trackLength; z -= 70) {
      if (Math.random() > 0.35) {
        const boostX = (Math.random() - 0.5) * (this.trackWidth - 6);
        this.createBoost(boostX, z);
      }
    }

    // Générer des rampes supplémentaires (indépendantes des rangées)
    for (let z = -120; z > -this.trackLength; z -= 150) {
      if (Math.random() > 0.4) {
        const rampX = (Math.random() - 0.5) * (this.trackWidth - 8);
        this.createRamp(rampX, z);
      }
    }

    // Ligne d'arrivée
    this.createFinishLine();
  }

  createTreeRow(z, passageOnLeft, addRamp) {
    // Créer une rangée de sapins avec un passage d'un côté
    const numTrees = 4 + Math.floor(Math.random() * 2); // 4-5 sapins par rangée
    const passageWidth = 6; // Largeur du passage
    const treeSpacing = (this.trackWidth - passageWidth) / numTrees;
    
    const rowTrees = [];
    
    // Position de départ selon le côté du passage
    let startX;
    if (passageOnLeft) {
      // Passage à gauche, arbres à droite
      startX = -this.trackWidth / 2 + passageWidth;
    } else {
      // Passage à droite, arbres à gauche
      startX = -this.trackWidth / 2;
    }
    
    // Créer les arbres de la rangée
    for (let i = 0; i < numTrees; i++) {
      const treeX = startX + i * treeSpacing + treeSpacing / 2;
      
      // Vérifier que l'arbre est bien sur la piste
      if (Math.abs(treeX) < this.trackWidth / 2 - 1) {
        this.createObstacleTree(treeX, z + (Math.random() - 0.5) * 2);
        rowTrees.push({ x: treeX, z: z });
      }
    }
    
    // Ajouter un tremplin devant la rangée si demandé
    if (addRamp) {
      // Position du tremplin au centre de la rangée (pas dans le passage)
      const rampX = passageOnLeft ? 
        (this.trackWidth / 4) : // Tremplin à droite si passage à gauche
        (-this.trackWidth / 4); // Tremplin à gauche si passage à droite
      
      this.createRamp(rampX, z + 15); // Tremplin 15m avant la rangée
    }
    
    this.treeRows.push({
      z: z,
      passageOnLeft: passageOnLeft,
      trees: rowTrees
    });
  }

  createTree(x, z) {
    const tree = new THREE.Group();

    // Tronc
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunk = new THREE.Mesh(trunkGeometry, this.materials.trunk);
    trunk.position.y = 1;
    trunk.castShadow = true;
    tree.add(trunk);

    // Feuillage (3 cônes)
    const foliageGeometry1 = new THREE.ConeGeometry(1.5, 3, 8);
    const foliage1 = new THREE.Mesh(foliageGeometry1, this.materials.foliage);
    foliage1.position.y = 3;
    foliage1.castShadow = true;
    tree.add(foliage1);

    const foliageGeometry2 = new THREE.ConeGeometry(1.2, 2.5, 8);
    const foliage2 = new THREE.Mesh(foliageGeometry2, this.materials.foliage);
    foliage2.position.y = 4.5;
    foliage2.castShadow = true;
    tree.add(foliage2);

    const foliageGeometry3 = new THREE.ConeGeometry(0.8, 2, 8);
    const foliage3 = new THREE.Mesh(foliageGeometry3, this.materials.foliage);
    foliage3.position.y = 5.8;
    foliage3.castShadow = true;
    tree.add(foliage3);

    // Neige sur l'arbre
    const snowGeometry = new THREE.ConeGeometry(0.9, 0.5, 8);
    const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const snow = new THREE.Mesh(snowGeometry, snowMaterial);
    snow.position.y = 6.5;
    tree.add(snow);

    tree.position.set(x, 0, z);
    
    // Variation de taille
    const scale = 0.7 + Math.random() * 0.6;
    tree.scale.setScalar(scale);
    
    this.scene.add(tree);
    this.trees.push(tree);
  }

  createObstacleTree(x, z) {
    const tree = new THREE.Group();

    // Tronc plus épais pour les obstacles
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
    const trunk = new THREE.Mesh(trunkGeometry, this.materials.trunk);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    tree.add(trunk);

    // Feuillage
    const foliageGeometry = new THREE.ConeGeometry(2, 4, 8);
    const foliage = new THREE.Mesh(foliageGeometry, this.materials.foliage);
    foliage.position.y = 4.5;
    foliage.castShadow = true;
    tree.add(foliage);

    tree.position.set(x, 0, z);
    this.scene.add(tree);
    
    // Stocker comme obstacle
    this.obstacles.push({
      mesh: tree,
      position: { x, z },
      radius: 0.8
    });
  }

  createBoost(x, z) {
    // Plateforme de boost (chevrons)
    const boostGroup = new THREE.Group();

    // Base lumineuse
    const baseGeometry = new THREE.BoxGeometry(3, 0.1, 4);
    const base = new THREE.Mesh(baseGeometry, this.materials.boost);
    base.position.y = 0.05;
    boostGroup.add(base);

    // Flèches
    for (let i = 0; i < 3; i++) {
      const arrowGeometry = new THREE.ConeGeometry(0.3, 0.8, 3);
      const arrow = new THREE.Mesh(arrowGeometry, this.materials.boost);
      arrow.rotation.x = -Math.PI / 2;
      arrow.position.set(0, 0.2, 1 - i * 1.2);
      boostGroup.add(arrow);
    }

    boostGroup.position.set(x, 0, z);
    this.scene.add(boostGroup);

    const boost = {
      mesh: boostGroup,
      position: { x, z },
      collected: false
    };
    this.boosts.push(boost);
  }

  createRamp(x, z) {
    // Rampe de saut
    const rampGeometry = new THREE.BoxGeometry(4, 1, 3);
    const ramp = new THREE.Mesh(rampGeometry, this.materials.ramp);
    
    // Incliner la rampe
    ramp.rotation.x = -0.3;
    ramp.position.set(x, 0.3, z);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    
    this.scene.add(ramp);
    
    this.ramps.push({
      mesh: ramp,
      position: { x, z }
    });
  }

  createFinishLine() {
    // Arche d'arrivée (élargie pour la piste plus large)
    const archGroup = new THREE.Group();

    // Poteaux (plus espacés)
    const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    
    const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
    leftPole.position.set(-10, 3, 0);
    archGroup.add(leftPole);

    const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
    rightPole.position.set(10, 3, 0);
    archGroup.add(rightPole);

    // Bannière (plus large)
    const bannerGeometry = new THREE.BoxGeometry(20, 1.5, 0.2);
    const bannerMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.2
    });
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.set(0, 5.5, 0);
    archGroup.add(banner);

    // Texte "ARRIVÉE"
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('ARRIVÉE', 256, 90);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 1.5),
      textMaterial
    );
    textPlane.position.set(0, 5.5, 0.15);
    archGroup.add(textPlane);

    archGroup.position.z = -this.trackLength;
    this.scene.add(archGroup);

    // Ligne au sol
    const lineGeometry = new THREE.PlaneGeometry(this.trackWidth, 2);
    const lineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.7
    });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.01, -this.trackLength);
    this.scene.add(line);
  }

  createSkybox() {
    // Ciel gradient simple - rayon augmenté et suit le joueur
    const skyGeometry = new THREE.SphereGeometry(800, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0x89CFF0) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.sky);
  }

  createMountains() {
    // Montagnes en arrière-plan
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b8e9f,
      roughness: 0.9
    });

    for (let i = 0; i < 10; i++) {
      const height = 30 + Math.random() * 50;
      const width = 40 + Math.random() * 60;
      const mountainGeometry = new THREE.ConeGeometry(width, height, 4);
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
      
      const angle = (i / 10) * Math.PI * 2;
      const distance = 200 + Math.random() * 100;
      mountain.position.set(
        Math.cos(angle) * distance,
        height / 2 - 10,
        Math.sin(angle) * distance - 200
      );
      mountain.rotation.y = Math.random() * Math.PI;
      
      this.scene.add(mountain);

      // Neige au sommet
      const snowCapGeometry = new THREE.ConeGeometry(width * 0.5, height * 0.3, 4);
      const snowCapMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const snowCap = new THREE.Mesh(snowCapGeometry, snowCapMaterial);
      snowCap.position.copy(mountain.position);
      snowCap.position.y += height * 0.35;
      snowCap.rotation.y = mountain.rotation.y;
      this.scene.add(snowCap);
    }
  }

  update(playerZ) {
    // Faire suivre le skybox au joueur pour éviter le "mur bleu"
    if (this.sky) {
      this.sky.position.z = playerZ;
    }
    
    // Ajouter de nouveaux segments de sol si nécessaire
    while (this.lastSegmentZ > playerZ - this.segmentLength * this.visibleSegments) {
      this.lastSegmentZ -= this.segmentLength;
      this.createGroundSegment(this.lastSegmentZ);
    }

    // Supprimer les segments trop loin derrière
    this.groundSegments = this.groundSegments.filter(segment => {
      if (segment.z > playerZ + this.segmentLength * 2) {
        this.scene.remove(segment.ground);
        this.scene.remove(segment.leftSide);
        this.scene.remove(segment.rightSide);
        return false;
      }
      return true;
    });

    // Animation des boosts
    const time = Date.now() * 0.001;
    for (const boost of this.boosts) {
      if (!boost.collected) {
        boost.mesh.position.y = 0.1 + Math.sin(time * 3) * 0.1;
        boost.mesh.rotation.y = time;
      }
    }
  }

  getObstaclesNear(z) {
    return this.obstacles.filter(obs => {
      return obs.position.z > z - 5 && obs.position.z < z + 5;
    });
  }

  getBoostsNear(z) {
    return this.boosts.filter(boost => {
      return boost.position.z > z - 5 && boost.position.z < z + 5;
    });
  }

  getRampsNear(z) {
    return this.ramps.filter(ramp => {
      return ramp.position.z > z - 3 && ramp.position.z < z + 3;
    });
  }

  hideBoost(boost) {
    boost.mesh.visible = false;
  }
}
