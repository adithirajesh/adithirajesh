import * as THREE from 'three';
import waterVertexShader from '../shaders/water.vert?raw';
import waterFragmentShader from '../shaders/water.frag?raw';
import { time } from 'three/tsl';

export class Water extends THREE.Mesh {
  constructor(options = {}) {
    super();

    this.material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.75 },
        uEnvironmentMap: { value: options.environmentMap },
        uWavesAmplitude: { value: 0.06 },
        uWavesFrequency: { value: 0.81 },
        uWavesPersistence: { value: 0.3 },
        uWavesLacunarity: { value: 1.03 },
        uWavesIterations: { value: 8 },
        uWavesSpeed: { value: 0.4 },
        uTroughColor: { value: new THREE.Color('#8cc2df') },
        uSurfaceColor: { value: new THREE.Color('#b4c6f0') },
        uPeakColor: { value: new THREE.Color('#b4d0e2') },
        uPeakThreshold: { value: 0.27 },
        uPeakTransition: { value: 0.35 },
        uTroughThreshold: { value: 0 },
        uTroughTransition: { value: 0.5 },
        uFresnelScale: { value: 0.17 },
        uFresnelPower: { value: 1.98 },
        noiseTexture: { value: options.noiseTexture },
        time: { value: 0 }

      },
      transparent: true,
      depthTest: true,
      side: THREE.DoubleSide
    });

    this.geometry = new THREE.CylinderGeometry(1,1,1,options.resolution || 512,
     options.resolution || 512);

    
  }

  update(time) {
    this.material.uniforms.uTime.value = time;
  }
} 