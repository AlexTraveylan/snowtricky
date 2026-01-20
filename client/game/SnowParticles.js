import * as THREE from 'three';

export class SnowParticles {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.particles = null;
    this.particleCount = 2000;
    this.velocities = [];
  }

  init() {
    // Géométrie des particules
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      this.velocities.push({
        x: (Math.random() - 0.5) * 0.1,
        y: -0.5 - Math.random() * 0.5,
        z: (Math.random() - 0.5) * 0.1
      });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Matériau des particules
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  update(playerPosition) {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position.array;
    
    for (let i = 0; i < this.particleCount; i++) {
      // Mettre à jour la position
      positions[i * 3] += this.velocities[i].x;
      positions[i * 3 + 1] += this.velocities[i].y;
      positions[i * 3 + 2] += this.velocities[i].z;

      // Réinitialiser si trop bas ou trop loin
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 50;
      }

      // Suivre le joueur
      if (playerPosition) {
        const distX = positions[i * 3] - playerPosition.x;
        const distZ = positions[i * 3 + 2] - playerPosition.z;
        
        if (Math.abs(distX) > 50) {
          positions[i * 3] = playerPosition.x + (Math.random() - 0.5) * 100;
        }
        if (Math.abs(distZ) > 50) {
          positions[i * 3 + 2] = playerPosition.z + (Math.random() - 0.5) * 100;
        }
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}
