import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { Water } from 'three/examples/jsm/objects/Water.js';
// @ts-ignore
import { Sky } from 'three/examples/jsm/objects/Sky.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WeatherMode } from '../types';
import { soundEngine } from '../utils/audio';

interface OceanCanvasProps {
  weatherMode: WeatherMode;
  onReady: () => void;
  onError: (errorMsg: string) => void;
  isStormActive: boolean;
  lightningPulse: number; // passed down for storm simulation
  inspectMode: 'boat' | 'book';
  onInspectModeChange?: (mode: 'boat' | 'book') => void;
}

interface ThreeWeatherPreset {
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  sunElevation: number;   // degrees
  sunAzimuth: number;     // degrees
  sunColor: [number, number, number]; // RGB representation
  waterColor: number;     // hex color
  distortionScale: number;
  fogColor: number;       // hex color
  fogDensity: number;
  lightColor: [number, number, number]; // RGB
  lightIntensity: number;
  rainOpacity: number;
  ambientColor: [number, number, number]; // RGB of ambient shadow fill light
  ambientIntensity: number;
  exposure?: number;
  cloudColor?: number;
  cloudOpacity?: number;
  starOpacity?: number;
}

const THREE_WEATHER_PRESETS: Record<WeatherMode, ThreeWeatherPreset> = {
  dawn: {
    turbidity: 1.2,              // very clear sunrise sky with zero thick haze
    rayleigh: 3.5,               // beautiful Rayleigh scattering generates a deep orange/red horizon and clean blue upper sky
    mieCoefficient: 0.001,       // keep background crystal clear with no white hazes
    mieDirectionalG: 0.82,
    sunElevation: 1.6,           // resting perfectly on the horizon for genuine orange gradients
    sunAzimuth: 195,
    sunColor: [1.0, 0.42, 0.05], // deep intense sunset-orange sun disk
    waterColor: 0x052140,        // deep navy-teal which absorbs sunrise colors perfectly
    distortionScale: 2.5,
    fogColor: 0x240d05,          // warm deep sunrise horizon fog
    fogDensity: 0.0001,          // soft morning horizon depth
    lightColor: [1.0, 0.52, 0.2], // warm amber morning rays
    lightIntensity: 0.65,
    rainOpacity: 0.0,
    ambientColor: [0.05, 0.08, 0.2], // soft indigo night-to-dawn shadow
    ambientIntensity: 0.3,
    exposure: 0.4,               // well-contained exposure to maximize the color saturation
    cloudColor: 0xffaa66,        // peachy orange clouds
    cloudOpacity: 0.85,
    starOpacity: 0.1,            // stars fade out slowly
  },
  day: {
    turbidity: 1.0,              // clear blue sky with zero grey/silver haze
    rayleigh: 1.8,               // standard realistic Rayleigh scattering for deep sky-blue cobalt values
    mieCoefficient: 0.001,       // no white haze washing of the sky
    mieDirectionalG: 0.8,
    sunElevation: 25,            // lower beautiful sun angle avoids direct overhead blowout
    sunAzimuth: 180,
    sunColor: [1.0, 0.98, 0.9],  // rich warm yellow-white sun disk
    waterColor: 0x011e40,        // rich cobalt blue water
    distortionScale: 3.2,
    fogColor: 0x01132b,          // deep blue horizon fog
    fogDensity: 0.0001,          // crisp clean visibility
    lightColor: [1.0, 0.98, 0.92], // radiant solar white daytime light
    lightIntensity: 1.1,
    rainOpacity: 0.0,
    ambientColor: [0.08, 0.15, 0.3], // sky-dome ambient cobalt bounce
    ambientIntensity: 0.45,
    exposure: 0.35,              // reduced exposure produces rich cobalt sky and deep blue ocean reflections
    cloudColor: 0xffffff,        // classic clean white puffy clouds
    cloudOpacity: 0.9,
    starOpacity: 0.0,
  },
  cloudy: {
    turbidity: 1.5,              // minimal haze
    rayleigh: 0.6,               // extremely low Rayleigh scattering removes cobalt blue, giving a gorgeous moody slate blue-gray sky
    mieCoefficient: 0.001,       // clean atmosphere, no white/silver washout
    mieDirectionalG: 0.7,
    sunElevation: 14.0,          // hazy lower-angle sun
    sunAzimuth: 180,
    sunColor: [0.25, 0.35, 0.45], // cool silver-blue sun disk
    waterColor: 0x0c1e30,        // desaturated slate ocean
    distortionScale: 2.0,        // calm level waters
    fogColor: 0x081320,          // slate blue horizon fog instead of grey
    fogDensity: 0.0003,          // subtle overcast obscurity
    lightColor: [0.45, 0.52, 0.62], // cool diffuse silver skylight
    lightIntensity: 0.38,
    rainOpacity: 0.0,
    ambientColor: [0.03, 0.06, 0.12], // dark blue shadow fill
    ambientIntensity: 0.22,
    exposure: 0.32,              // darker exposure for deep cloudiness
    cloudColor: 0x3d4f61,        // storming blue-gray cloud mesh
    cloudOpacity: 0.95,
    starOpacity: 0.0,
  },
  storm: {
    turbidity: 1.8,              // dark stormy atmosphere
    rayleigh: 0.15,              // extremely low light scattering creates near-black desaturated skies
    mieCoefficient: 0.002,       // minimal background scattering
    mieDirectionalG: 0.5,
    sunElevation: 4.0,           // sun hidden low
    sunAzimuth: 180,
    sunColor: [0.08, 0.10, 0.15], // dark pewter/slate sun
    waterColor: 0x030d17,        // very dark near-black storm ocean
    distortionScale: 9.0,        // turbulent wild waves
    fogColor: 0x02060c,          // dark deep storm horizon
    fogDensity: 0.002,           // heavily reduced visibility
    lightColor: [0.1, 0.12, 0.18], // cold dark storm light
    lightIntensity: 0.08,
    rainOpacity: 0.85,
    ambientColor: [0.01, 0.02, 0.04], // pitch dark ambient shadows
    ambientIntensity: 0.06,
    exposure: 0.25,              // very dark overall storm atmosphere
    cloudColor: 0x1a222a,        // threatened black-grey clouds
    cloudOpacity: 0.98,
    starOpacity: 0.0,
  },
  night: {
    turbidity: 1.0,              // crystal clean vacuum space
    rayleigh: 0.04,              // near zero scattering creates deep dark indigo/black space sky
    mieCoefficient: 0.0005,      // extremely sharp moon glow halo
    mieDirectionalG: 0.98,       // tightly focused moon glint on water
    sunElevation: 24.5,          // moon high in sky, creating a long silver path on the waves
    sunAzimuth: 145,
    sunColor: [0.9, 0.95, 1.0],  // beautiful glowing silver-white Moon disk
    waterColor: 0x00040a,        // ink-black night water
    distortionScale: 2.2,        // quiet reflective ripples
    fogColor: 0x000103,          // cosmic midnight black
    fogDensity: 0.0001,          // perfectly clear sky
    lightColor: [0.45, 0.55, 0.72], // brilliant silver-blue moonlight
    lightIntensity: 0.45,
    rainOpacity: 0.0,
    ambientColor: [0.005, 0.005, 0.015], // total dark sky void fill
    ambientIntensity: 0.1,
    exposure: 0.4,               // deep dramatic night contrast makes stars and moon stand out incredibly well
    cloudColor: 0x0a101a,        // dark moonlit clouds
    cloudOpacity: 0.4,           // translucent night clouds
    starOpacity: 0.98,           // gorgeous bright twinkling stars
  },
};

// Lerp helpers
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpColor = (c1: THREE.Color, c2: THREE.Color, t: number) => {
  c1.r = lerp(c1.r, c2.r, t);
  c1.g = lerp(c1.g, c2.g, t);
  c1.b = lerp(c1.b, c2.b, t);
};

// A lightweight 1D Perlin Noise generator for organic flame flickering.
class PerlinNoise1D {
  private p: number[] = [];

  constructor() {
    const permutation = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = temp;
    }
    this.p = [...permutation, ...permutation];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad1D(hash: number, x: number): number {
    return (hash & 1) === 0 ? x : -x;
  }

  public get(x: number): number {
    const X = Math.floor(x) & 255;
    const xf = x - Math.floor(x);
    const u = this.fade(xf);
    const g0 = this.grad1D(this.p[X], xf);
    const g1 = this.grad1D(this.p[X + 1], xf - 1);
    return this.lerp(u, g0, g1) * 2.0;
  }

  public octave(x: number, octaves = 3, persistence = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.get(x * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }
}

const perlin1D = new PerlinNoise1D();

export const OceanCanvas: React.FC<OceanCanvasProps> = ({
  weatherMode,
  onReady,
  onError,
  isStormActive,
  lightningPulse,
  inspectMode,
  onInspectModeChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // THREE engine refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const requestRef = useRef<number | null>(null);

  // 3D Orbital camera control variables (Yaw, Pitch, Zoom, Drag tracking)
  const yawRef = useRef<number>(1.2);         // horizontal angle around target
  const pitchRef = useRef<number>(0.65);       // vertical angle from sky down
  const zoomDistRef = useRef<number>(65);      // distance from target

  // Custom manual 3D rotation of the book when zoomed in
  const bookRotationXRef = useRef<number>(0);
  const bookRotationYRef = useRef<number>(0.0);
  const bookRotVelXRef = useRef<number>(0.0);
  const bookRotVelYRef = useRef<number>(0.0);

  // Cozy vintage lantern and firewick candle refs
  const cozyLightRef = useRef<THREE.PointLight | null>(null);
  const lanternWickRef = useRef<THREE.Mesh | null>(null);

  // Deck-crate cozy lantern refs
  const deckLanternLightRef = useRef<THREE.PointLight | null>(null);
  const deckLanternWickRef = useRef<THREE.Mesh | null>(null);
  const deckLanternGlowRef = useRef<THREE.Mesh | null>(null);

  const starFieldRef = useRef<THREE.Points | null>(null);
  const shootingStarRef = useRef<THREE.Line | null>(null);
  const shootingStarStateRef = useRef({
    active: false,
    progress: 0,
    speed: 1.0,
    startPos: new THREE.Vector3(),
    dir: new THREE.Vector3()
  });

  const isDraggingRef = useRef<boolean>(false);
  const previousPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Smooth lerp coordinates
  const cameraTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 0));
  const haloRef = useRef<THREE.Mesh | null>(null);

  // Sync props to safe local ref to avoid tearing down the canvas context on toggle
  const inspectModeRef = useRef(inspectMode);
  const onInspectModeChangeRef = useRef(onInspectModeChange);
  useEffect(() => {
    onInspectModeChangeRef.current = onInspectModeChange;
  }, [onInspectModeChange]);

  useEffect(() => {
    inspectModeRef.current = inspectMode;
    // Set smooth preset default zooms on mode change, but avoid snapping if already close/transitioning
    if (inspectMode === 'book') {
      if (zoomDistRef.current > 8.5 || zoomDistRef.current < 1.8) {
        zoomDistRef.current = 2.4; // super close-up view!
        pitchRef.current = 1.1;    // beautiful low-angle look
        yawRef.current = 1.5;      // nicely oriented broadside
      }
    } else {
      if (zoomDistRef.current < 12) {
        zoomDistRef.current = 35;  // smooth and accessible medium-close boat orbit view
        pitchRef.current = 0.65;
      }
    }
  }, [inspectMode]);

  // Pointer click and drag controls (Mouse and Mobile touch support with Raycasting select)
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDownTimeRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    const clientX = e.clientX;
    const clientY = e.clientY;
    previousPointerRef.current = { x: clientX, y: clientY };
    pointerDownPosRef.current = { x: clientX, y: clientY };
    pointerDownTimeRef.current = Date.now();

    if (canvasRef.current) {
      canvasRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousPointerRef.current.x;
    const deltaY = e.clientY - previousPointerRef.current.y;
    previousPointerRef.current = { x: e.clientX, y: e.clientY };

    if (inspectModeRef.current === 'book') {
      // Rotate the physical book itself in 3D during active inspect zoom!
      // Full unconstrained 360-degree rotation on both Y and X axes with inertia tracking!
      const velY = deltaX * 0.015;
      const velX = deltaY * 0.015;
      bookRotVelYRef.current = velY;
      bookRotVelXRef.current = velX;

      bookRotationYRef.current += velY;
      bookRotationXRef.current += velX;

      // Also rotate camera orbit around the boat/book at the same time
      yawRef.current -= deltaX * 0.0075;
      pitchRef.current = Math.max(0.12, Math.min(Math.PI / 2.05, pitchRef.current - deltaY * 0.0075));
    } else {
      // Standard camera orbital rotation around the general boat hull
      yawRef.current -= deltaX * 0.0075;
      // Cap vertical pitch to prevent looking underground or upside down
      pitchRef.current = Math.max(0.12, Math.min(Math.PI / 2.05, pitchRef.current - deltaY * 0.0075));
    }
  };

  const handleCanvasClick = (e: React.PointerEvent) => {
    if (!bookGroupRef.current || !cameraRef.current || !canvasRef.current) return;

    // Convert mouse click coordinates to Normalized Device Coordinates (NDC)
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // Intersect bookGroup children recursively to check if the book was clicked
    const intersects = raycaster.intersectObjects(bookGroupRef.current.children, true);
    if (intersects.length > 0) {
      if (inspectModeRef.current !== 'book') {
        if (onInspectModeChange) {
          onInspectModeChange('book');
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    if (canvasRef.current) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }

    // Verify click thresholds (less than 6 pixels moves and less than 350ms duration)
    const deltaX = e.clientX - pointerDownPosRef.current.x;
    const deltaY = e.clientY - pointerDownPosRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - pointerDownTimeRef.current;

    if (distance < 6 && duration < 350) {
      handleCanvasClick(e);
    }
  };

  // Objects refs
  const waterRef = useRef<any>(null);
  const skyRef = useRef<any>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const boatRef = useRef<THREE.Mesh | null>(null);

  // Local target position for the book resting flat on the white storage box/crate on deck, raised high to be beautifully visible
  const tentLocalPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0.0, 3.25, 2.72));
  const bookGroupRef = useRef<THREE.Group | null>(null);

  // Nagi flag references
  const flagMeshRef = useRef<THREE.Mesh | null>(null);
  const flagOriginalPositionsRef = useRef<Float32Array | null>(null);

  // Rain particle references
  const isMobileOS = typeof window !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
  const rainCount = isMobileOS ? 200 : 700;
  const rainRef = useRef<THREE.LineSegments | null>(null);
  const rainPositions = useRef<Float32Array | null>(null);
  const rainSpeeds = useRef<Float32Array | null>(null);

  // Cloud and localized cloud-rain references
  const cloudRainCount = isMobileOS ? 60 : 180;
  const cloudGroupRef = useRef<THREE.Group | null>(null);
  const cloudRainRef = useRef<THREE.LineSegments | null>(null);
  const cloudRainPositions = useRef<Float32Array | null>(null);
  const cloudRainSpeeds = useRef<Float32Array | null>(null);

  // Interactive current settings for smooth interpolation
  const currentPreset = useRef<ThreeWeatherPreset>({ ...THREE_WEATHER_PRESETS['dawn'] });

  const [debugText, setDebugText] = useState({
    three: 'THREE loading...',
    water: 'Water loading...',
    sky: 'Sky loading...',
    renderer: 'Renderer offline'
  });

  const [boatProgress, setBoatProgress] = useState<number>(0);
  const [bookProgress, setBookProgress] = useState<number>(0);
  const [cloudProgress, setCloudProgress] = useState<number>(0);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);

  // Sync props to safe local refs for high performance single initialization loop
  const weatherModeRef = useRef(weatherMode);
  const isStormActiveRef = useRef(isStormActive);
  const lightningPulseRef = useRef(lightningPulse);

  useEffect(() => {
    weatherModeRef.current = weatherMode;
  }, [weatherMode]);

  useEffect(() => {
    isStormActiveRef.current = isStormActive;
  }, [isStormActive]);

  useEffect(() => {
    lightningPulseRef.current = lightningPulse;
  }, [lightningPulse]);

  // Generates safe fallback tileable procedural texture offline
  const createFallbackNormalMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#8080ff';
      ctx.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y++) {
        for (let x = 0; x < 128; x++) {
          const r = Math.floor(128 + Math.sin(x * 0.15) * 12 + Math.cos(y * 0.22) * 8);
          const g = Math.floor(128 + Math.cos(x * 0.15) * 12 + Math.sin(y * 0.22) * 8);
          ctx.fillStyle = `rgb(${r},${g},255)`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  useEffect(() => {
    if (!mountRef.current || !canvasRef.current) return;

    try {
      setDebugText(prev => ({ ...prev, three: 'THREE loaded' }));

      // 1. SCENE SETUP
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. FOG SETUP
      scene.fog = new THREE.FogExp2(0x0c0e12, 0.001);

      // 3. CAMERA SETUP - Camera set high,looking slightly down on our float boat
      const camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        1,
        25000
      );
      camera.position.set(35, 25, 95);
      camera.lookAt(0, 2, 0);
      cameraRef.current = camera;

      // 4. RENDERER SETUP
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: !isMobileOS, // Disable antialiasing on mobile to reduce fragment-bound GPU workload
        alpha: false,
        powerPreference: 'high-performance'
      });
      // Set lower device pixel ratio on mobile for substantial framerate improvements
      renderer.setPixelRatio(isMobileOS ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.62; // perfectly balanced cinematic exposure avoids washouts and keeps shadows rich
      rendererRef.current = renderer;

      setDebugText(prev => ({ ...prev, renderer: 'Renderer running' }));

      // 5. WATER SETUP
      // Real infinite ocean geometry matching original code scale
      const waterGeometry = new THREE.PlaneGeometry(12000, 12000);

      // Loading with secure failover
      const textureLoader = new THREE.TextureLoader();
      let normalTexture: THREE.Texture;

      try {
        normalTexture = textureLoader.load(
          "https://threejs.org/examples/textures/waternormals.jpg",
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          },
          undefined,
          (err) => {
            console.warn('Network water normals blocked or failed, switching to high quality procedural normal fallback.');
            normalTexture.copy(createFallbackNormalMap());
          }
        );
      } catch (e) {
        normalTexture = createFallbackNormalMap();
      }

      const water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: normalTexture,
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffd27d,
        waterColor: 0x001e33,
        distortionScale: 4.5,
        fog: scene.fog !== undefined
      });

      water.rotation.x = -Math.PI / 2;
      scene.add(water);
      waterRef.current = water;
      setDebugText(prev => ({ ...prev, water: 'Water loaded' }));

      // 6. SKY DOME SETUP
      const sky = new Sky();
      sky.scale.setScalar(12000);
      scene.add(sky);
      skyRef.current = sky;

      // 6b. STARFIELD SYSTEM (for night sky)
      const starCount = 500;
      const starGeo = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        // distribute randomly on a hemisphere of radius 900
        const theta = Math.random() * 2.0 * Math.PI;
        // high latitude to keep them high above horizon
        const phi = Math.acos(Math.random() * 0.9 + 0.1); 
        const radius = 800 + Math.random() * 150;
        
        starPositions[i * 3] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 1] = radius * Math.cos(phi) + 10; // above horizon
        starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.cos(theta);
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      
      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.5,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
      });
      const starField = new THREE.Points(starGeo, starMat);
      scene.add(starField);
      starFieldRef.current = starField;

      // 6c. SHOOTING STAR SYSTEM SETUP
      const shootingStarGeo = new THREE.BufferGeometry();
      const shootingStarPositions = new Float32Array([0, 0, 0, -20, 10, -20]); // diagonal head-to-tail streak
      shootingStarGeo.setAttribute('position', new THREE.BufferAttribute(shootingStarPositions, 3));
      const shootingStarMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
      });
      const shootingStar = new THREE.Line(shootingStarGeo, shootingStarMat);
      scene.add(shootingStar);
      shootingStarRef.current = shootingStar;

      const skyUniforms = sky.material.uniforms;
      skyUniforms["turbidity"].value = 10;
      skyUniforms["rayleigh"].value = 2;
      skyUniforms["mieCoefficient"].value = 0.005;
      skyUniforms["mieDirectionalG"].value = 0.8;
      setDebugText(prev => ({ ...prev, sky: 'Sky loaded' }));

      // 7. CINEMATIC FLOAT BOAT (Stylized as a luxurious sleek mystic capsule)
      const boatGroup = new THREE.Group();
      
      // Main Deck Body
      const deckGeo = new THREE.BoxGeometry(11, 2.5, 22);
      const deckMat = new THREE.MeshStandardMaterial({ 
        color: 0x0c1e2d, // gorgeous luxury dark navy cyber wood
        roughness: 0.45,
        metalness: 0.7
      });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.y = 1.25;
      boatGroup.add(deck);

      // Bow tip (pointy triangle nose)
      const bowGeo = new THREE.ConeGeometry(5.5, 8, 4);
      bowGeo.rotateX(Math.PI / 2);
      bowGeo.scale(1.0, 0.4, 1.0);
      const bow = new THREE.Mesh(bowGeo, deckMat);
      bow.position.set(0, 1.25, -13);
      boatGroup.add(bow);

      // Cabin Glass (Emitting magical cyan light)
      const cabinGeo = new THREE.BoxGeometry(7, 3, 11);
      const cabinMat = new THREE.MeshStandardMaterial({
        color: 0x081119,
        roughness: 0.15,
        emissive: 0x06b6d4, // gorgeous vibrant cyan emission
        emissiveIntensity: 0.65
      });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 3.5, 1);
      boatGroup.add(cabin);

      // Small dynamic compass navigator beacon light on the top deck
      const beaconGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 5.2, 1);
      boatGroup.add(beacon);

      // ==========================================
      // COZY VINTAGE BOAT LANTERN / CANDLE LIGHT
      // ==========================================
      const lanternGroup = new THREE.Group();
      // Positioned on the boat deck, beautifully resting near the cabin/stern area
      lanternGroup.position.set(2.4, 1.25, 6.0);

      const latBaseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.15, 12);
      const latBrassMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, // gold brass
        roughness: 0.2,
        metalness: 0.8
      });
      const latBase = new THREE.Mesh(latBaseGeo, latBrassMat);
      latBase.position.y = 0.075;
      lanternGroup.add(latBase);

      const latGlassGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12);
      const latGlassMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const latGlass = new THREE.Mesh(latGlassGeo, latGlassMat);
      latGlass.position.y = 0.40;
      lanternGroup.add(latGlass);

      const latCapGeo = new THREE.ConeGeometry(0.32, 0.25, 12);
      const latCap = new THREE.Mesh(latCapGeo, latBrassMat);
      latCap.position.y = 0.775;
      lanternGroup.add(latCap);

      const rodMat = new THREE.MeshStandardMaterial({
        color: 0x3a2c0f,
        roughness: 0.4,
        metalness: 0.8
      });
      const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const rod = new THREE.Mesh(rodGeo, rodMat);
        rod.position.set(Math.cos(angle) * 0.21, 0.40, Math.sin(angle) * 0.21);
        lanternGroup.add(rod);
      }

      const wickGeo = new THREE.SphereGeometry(0.08, 12, 12);
      wickGeo.scale(0.8, 1.4, 0.8);
      const wickMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44
      });
      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.set(0, 0.35, 0);
      lanternGroup.add(wick);
      lanternWickRef.current = wick;

      const cozyPointLight = new THREE.PointLight(0xff6a00, 0.0, 35, 1.5);
      cozyPointLight.position.set(0, 0.45, 0);
      lanternGroup.add(cozyPointLight);
      cozyLightRef.current = cozyPointLight;

      boatGroup.add(lanternGroup);

      // ==========================================
      // DECK-CRATE COZY VINTAGE MARITIME LANTERN
      // ==========================================
      const deckLanternGroup = new THREE.Group();
      // Positioned on the box/crate top beside the book (Z = 2.42, X = 1.15, Y = 3.07 surface height)
      deckLanternGroup.position.set(1.15, 3.07, 2.42);

      const dLatBaseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.16, 12);
      const dLatBrassMat = new THREE.MeshStandardMaterial({
        color: 0x8a703d, // weathered vintage dark brass
        roughness: 0.35,
        metalness: 0.85
      });
      const dLatBase = new THREE.Mesh(dLatBaseGeo, dLatBrassMat);
      dLatBase.position.y = 0.08;
      deckLanternGroup.add(dLatBase);

      const dLatGlassGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.50, 12);
      const dLatGlassMat = new THREE.MeshStandardMaterial({
        color: 0xffeacc,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.45,
        blending: THREE.NormalBlending
      });
      const dLatGlass = new THREE.Mesh(dLatGlassGeo, dLatGlassMat);
      dLatGlass.position.y = 0.41;
      deckLanternGroup.add(dLatGlass);

      const dLatCapGeo = new THREE.CylinderGeometry(0.13, 0.26, 0.13, 12);
      const dLatCap = new THREE.Mesh(dLatCapGeo, dLatBrassMat);
      dLatCap.position.y = 0.725;
      deckLanternGroup.add(dLatCap);

      const dWireMat = new THREE.MeshStandardMaterial({
        color: 0x3d321c,
        roughness: 0.45,
        metalness: 0.9
      });
      const dWireGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.50, 4);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const wire = new THREE.Mesh(dWireGeo, dWireMat);
        wire.position.set(Math.cos(angle) * 0.21, 0.41, Math.sin(angle) * 0.21);
        deckLanternGroup.add(wire);
      }

      const dWickGeo = new THREE.SphereGeometry(0.07, 10, 10);
      dWickGeo.scale(0.7, 1.5, 0.7);
      const dWickMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44
      });
      const dWick = new THREE.Mesh(dWickGeo, dWickMat);
      dWick.position.set(0, 0.32, 0);
      deckLanternGroup.add(dWick);
      deckLanternWickRef.current = dWick;

      // Handle loop
      const dHandleGeo = new THREE.TorusGeometry(0.14, 0.02, 8, 16);
      const dHandle = new THREE.Mesh(dHandleGeo, dLatBrassMat);
      dHandle.position.set(0, 0.905, 0);
      dHandle.rotation.y = Math.PI / 2;
      deckLanternGroup.add(dHandle);

      // Point Light with expanded range and slow decay to wash over the deck and book
      const deckPointLight = new THREE.PointLight(0xffaa44, 0.0, 30, 1.1);
      deckPointLight.position.set(0, 0.41, 0);
      deckLanternGroup.add(deckPointLight);
      deckLanternLightRef.current = deckPointLight;

      // Outer glow mesh
      const dGlowGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const dGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff8c00,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const dGlow = new THREE.Mesh(dGlowGeo, dGlowMat);
      dGlow.position.set(0, 0.41, 0);
      deckLanternGroup.add(dGlow);
      deckLanternGlowRef.current = dGlow;

      boatGroup.add(deckLanternGroup);

      // ==========================================
      // NAGI MODERN LUXURY SAILOR FLAG ASSEMBLY (sitting on top of the boat mast/column)
      // ==========================================
      const flagGroup = new THREE.Group();

      // 1. Sleek, polished mahogany wood pole matching the user's reference image
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 4.5, 16);
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0x663322, // Rich dark polished mahogany wood
        roughness: 0.25,
        metalness: 0.1
      });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 2.25; // bottom of the pole sits exactly at y=0 local-coord of flagGroup
      flagGroup.add(pole);

      // Highly reflective gold brass spherical finial on top of the pole
      const sphereGeo = new THREE.SphereGeometry(0.18, 20, 20);
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, // Bright brassy gold
        roughness: 0.1,
        metalness: 0.95
      });
      const sphere = new THREE.Mesh(sphereGeo, goldMat);
      sphere.position.y = 4.5; // Sitting precisely on top of the flagpole
      flagGroup.add(sphere);

      // 2. Old leather/burlap canvas flag with handwritten "Nagi" in elegant maritime text
      const flagCanvas = document.createElement('canvas');
      flagCanvas.width = 512;
      flagCanvas.height = 256;
      const fCtx = flagCanvas.getContext('2d');
      if (fCtx) {
        // Background: rich antique parchment cream
        const bgGrad = fCtx.createRadialGradient(256, 128, 40, 256, 128, 280);
        bgGrad.addColorStop(0, '#ebdcb9'); // soft warm papyrus core
        bgGrad.addColorStop(0.6, '#decaa0'); // golden tan midpoint
        bgGrad.addColorStop(1, '#c2a877'); // weathered brown-tinted edges
        fCtx.fillStyle = bgGrad;
        fCtx.fillRect(0, 0, 512, 256);

        // ==========================================
        // VINTAGE COMPASS ROSE WATERMARK BACKGROUND
        // ==========================================
        const cx = 256;
        const cy = 128;
        fCtx.save();

        // Draw double outer rings
        fCtx.strokeStyle = 'rgba(27, 46, 71, 0.28)'; // faded sailor slate blue
        fCtx.lineWidth = 2.0;
        fCtx.beginPath();
        fCtx.arc(cx, cy, 76, 0, Math.PI * 2);
        fCtx.stroke();

        fCtx.lineWidth = 0.8;
        fCtx.beginPath();
        fCtx.arc(cx, cy, 71, 0, Math.PI * 2);
        fCtx.stroke();

        fCtx.beginPath();
        fCtx.arc(cx, cy, 46, 0, Math.PI * 2);
        fCtx.stroke();

        fCtx.beginPath();
        fCtx.arc(cx, cy, 14, 0, Math.PI * 2);
        fCtx.stroke();

        // Function to draw a faceted compass pointer blade
        const drawCompassBlade = (angleRad: number, length: number, baseWidth: number) => {
          fCtx.save();
          fCtx.translate(cx, cy);
          fCtx.rotate(angleRad);

          // Left facet (dark shading)
          fCtx.fillStyle = 'rgba(27, 46, 71, 0.38)';
          fCtx.beginPath();
          fCtx.moveTo(0, 0);
          fCtx.lineTo(-baseWidth / 2, 0);
          fCtx.lineTo(0, -length);
          fCtx.closePath();
          fCtx.fill();

          // Right facet (light shading)
          fCtx.fillStyle = 'rgba(27, 46, 71, 0.18)';
          fCtx.beginPath();
          fCtx.moveTo(0, 0);
          fCtx.lineTo(baseWidth / 2, 0);
          fCtx.lineTo(0, -length);
          fCtx.closePath();
          fCtx.fill();

          fCtx.restore();
        };

        // 1. Draw 4 primary cardinal pointer blades (N, S, E, W)
        drawCompassBlade(0, 72, 12);           // North
        drawCompassBlade(Math.PI / 2, 72, 12);  // East
        drawCompassBlade(Math.PI, 72, 12);      // South
        drawCompassBlade(Math.PI * 1.5, 72, 12); // West

        // 2. Draw 4 intermediate secondary pointer blades (NE, SE, SW, NW) - shorter
        drawCompassBlade(Math.PI / 4, 52, 7);      // NE
        drawCompassBlade(Math.PI * 0.75, 52, 7);   // SE
        drawCompassBlade(Math.PI * 1.25, 52, 7);   // SW
        drawCompassBlade(Math.PI * 1.75, 52, 7);   // NW

        // 3. Draw 8 minor ticks/points
        fCtx.strokeStyle = 'rgba(27, 46, 71, 0.12)';
        fCtx.lineWidth = 1.0;
        for (let j = 0; j < 16; j++) {
          if (j % 2 !== 0) {
            const tickAngle = (j * Math.PI) / 8;
            fCtx.beginPath();
            fCtx.moveTo(cx, cy);
            fCtx.lineTo(cx + Math.cos(tickAngle) * 36, cy + Math.sin(tickAngle) * 36);
            fCtx.stroke();
          }
        }

        // 4. Cardinal Letters (N, E, S, W) aligned precisely
        fCtx.font = 'bold 20px "Georgia", "Times New Roman", serif';
        fCtx.fillStyle = 'rgba(27, 46, 71, 0.65)';
        fCtx.textAlign = 'center';
        fCtx.textBaseline = 'middle';
        
        fCtx.fillText('N', cx, cy - 88);
        fCtx.fillText('E', cx + 88, cy + 1);
        fCtx.fillText('S', cx, cy + 90);
        fCtx.fillText('W', cx - 88, cy + 1);

        fCtx.restore();

        // ==========================================
        // MAIN GEORGIA SLAB "NAGI" TYPOGRAPHY
        // ==========================================
        fCtx.font = 'bold 102px "Georgia", "Times New Roman", serif';
        fCtx.fillStyle = '#112235'; // Deep sailor indigo navy
        fCtx.textAlign = 'center';
        fCtx.textBaseline = 'middle';
        // @ts-ignore
        if (typeof fCtx.letterSpacing !== 'undefined') {
          // @ts-ignore
          fCtx.letterSpacing = '8px'; // Wide majestic kerning
        }

        // Gilded text shadow to elevate letters slightly off the fabric
        fCtx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        fCtx.shadowBlur = 8;
        fCtx.shadowOffsetX = 2;
        fCtx.shadowOffsetY = 3;

        fCtx.fillText('NAGI', cx, cy);

        // Reset shadow
        fCtx.shadowBlur = 0;
        fCtx.shadowOffsetX = 0;
        fCtx.shadowOffsetY = 0;

        // ==========================================
        // CANVAS AND WEAVE ROUGH DISTRESS PATTERNS
        // ==========================================
        // 1. Overlay fabric weave texture (fine dual crosshatching lines)
        fCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        fCtx.lineWidth = 1;
        for (let x = 0; x < 512; x += 4) {
          fCtx.beginPath();
          fCtx.moveTo(x, 0); fCtx.lineTo(x, 256);
          fCtx.stroke();
        }
        for (let y = 0; y < 256; y += 4) {
          fCtx.beginPath();
          fCtx.moveTo(0, y); fCtx.lineTo(512, y);
          fCtx.stroke();
        }

        // 2. Weathered speckles and ink-climb textures (giving distressed print look)
        fCtx.fillStyle = 'rgba(222, 202, 160, 0.42)'; // overlay tan tones to simulate speckle aging
        for (let i = 0; i < 400; i++) {
          const rx = Math.random() * 512;
          const ry = Math.random() * 256;
          const rSize = 1.0 + Math.random() * 2.5;
          fCtx.fillRect(rx, ry, rSize, rSize);
        }

        // 3. Faded dirt stains on random patches
        fCtx.fillStyle = 'rgba(110, 85, 50, 0.12)';
        for (let i = 0; i < 6; i++) {
          fCtx.beginPath();
          const rx = Math.random() * 512;
          const ry = Math.random() * 256;
          const rad = 15 + Math.random() * 30;
          fCtx.arc(rx, ry, rad, 0, Math.PI * 2);
          fCtx.fill();
        }

        // ==========================================
        // COMPOSITE OUT: RAGGED TATTERED CLOTH EDGES
        // ==========================================
        fCtx.save();
        fCtx.globalCompositeOperation = 'destination-out';
        fCtx.fillStyle = '#000000';

        // Deep rugged tears on the right (farthest from mast pole)
        fCtx.beginPath();
        fCtx.moveTo(512, 12);
        fCtx.lineTo(494, 25);
        fCtx.lineTo(512, 38);
        fCtx.closePath();
        fCtx.fill();

        fCtx.beginPath();
        fCtx.moveTo(512, 85);
        fCtx.lineTo(501, 100);
        fCtx.lineTo(512, 115);
        fCtx.closePath();
        fCtx.fill();

        fCtx.beginPath();
        fCtx.moveTo(512, 165);
        fCtx.lineTo(486, 182); // deep wedge split
        fCtx.lineTo(512, 198);
        fCtx.closePath();
        fCtx.fill();

        fCtx.beginPath();
        fCtx.moveTo(512, 226);
        fCtx.lineTo(496, 238);
        fCtx.lineTo(512, 250);
        fCtx.closePath();
        fCtx.fill();

        // Small shredded wear holes in sails body near the windy margins
        fCtx.beginPath();
        fCtx.arc(465, 48, 2.0, 0, Math.PI * 2);
        fCtx.arc(485, 132, 2.8, 0, Math.PI * 2);
        fCtx.arc(458, 210, 1.8, 0, Math.PI * 2);
        fCtx.fill();

        fCtx.restore();
      }

      const flagTex = new THREE.CanvasTexture(flagCanvas);
      flagTex.wrapS = flagTex.wrapT = THREE.RepeatWrapping;

      // Subdivided grid plane for clean wind ripples - made significantly bigger as requested!
      const flagGeo = new THREE.PlaneGeometry(6.2, 4.0, 24, 16);
      // Translation: shift vertices so the mast attachment edge lies exactly at x=0
      flagGeo.translate(3.1, 0, 0);

      const flagMat = new THREE.MeshStandardMaterial({
        map: flagTex,
        roughness: 0.95,
        metalness: 0.05,
        side: THREE.DoubleSide,
        depthWrite: true,
        transparent: true, // Enables transparent cutouts for tattered cloth effect
        // @ts-ignore
        flatShading: true // beautiful flat facets represent rugged ancient flag canvas
      });

      const flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(0.06, 2.5, 0); // Positioned elegantly high up on the new flagpole
      flagGroup.add(flagMesh);

      // Save refs for active animation waving
      flagMeshRef.current = flagMesh;
      const originalFlagPositions = flagGeo.attributes.position.array as Float32Array;
      flagOriginalPositionsRef.current = Float32Array.from(originalFlagPositions);

      // Sit the flag assembly directly on the boatGroup (by default on top of fallback cabin roof, and dynamically attached to GLTF mast)
      boatGroup.add(flagGroup);
      flagGroup.position.set(0, 5.0, 1.0); // Procedural default height at top of the cabin

      // ==========================================
      // STYLIZED MYSTICAL PEDESTAL AND CHRONICLE BOOK OF WILO
      // ==========================================
      const bookContainer = new THREE.Group();
      // Placed on the main deck bow, beautifully in front of the active cabin glass
      bookContainer.position.set(0, 1.25, -4.5); 
      
      // A. The Pedestal Column base
      const pedestalBaseGeo = new THREE.CylinderGeometry(0.5, 0.7, 2.2, 16);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x0f1e29,
        roughness: 0.15,
        metalness: 0.95,
        emissive: 0x083b4c, // ambient cyan glow base
        emissiveIntensity: 0.25
      });
      const pedestalCol = new THREE.Mesh(pedestalBaseGeo, pedestalMat);
      pedestalCol.position.y = 1.1; // half height
      bookContainer.add(pedestalCol);

      // A1. An aesthetic glowing golden ring on top of the pedestal
      const pedRingGeo = new THREE.TorusGeometry(0.53, 0.04, 8, 24);
      const pedRingMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // amber gold glow
        roughness: 0.1,
        emissive: 0xd97706,
        emissiveIntensity: 1.5
      });
      const pedRing = new THREE.Mesh(pedRingGeo, pedRingMat);
      pedRing.rotation.x = Math.PI / 2;
      pedRing.position.y = 2.2;
      bookContainer.add(pedRing);

      // B. Structure of the Book Itself
      const bookGroup = new THREE.Group();
      bookGroupRef.current = bookGroup;
      bookGroup.position.set(0.0, 3.25, 2.72); // Default resting position flat on top of the white box/crate on deck, raised high for perfect visibility

      // 1. Handcrafted Masterpiece Closed Book (Exactly matching reference image)
      const bookW = 1.35;  // width (X)
      const bookT = 0.36;  // thickness (Y)
      const bookL = 1.72;  // length (Z)

      // Create Front Cover Texture (High Resolution HTML Canvas)
      const coverCanvas = document.createElement('canvas');
      coverCanvas.width = 1024;
      coverCanvas.height = 1024;
      const ctx = coverCanvas.getContext('2d');
      if (ctx) {
        // Rich desaturated premium dark blue royal leather base
        const grad = ctx.createRadialGradient(512, 512, 10, 512, 512, 720);
        grad.addColorStop(0, '#1c315e'); // rich deep navy sapphire center
        grad.addColorStop(1, '#080e1a'); // weathered deep blackish-blue leather edges
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 1024);

        // Apply dark organic leather grain/pores
        for (let i = 0; i < 30000; i++) {
          const rx = Math.random() * 1024;
          const ry = Math.random() * 1024;
          ctx.fillStyle = `rgba(0, 0, 0, ${0.18 + Math.random() * 0.12})`;
          ctx.fillRect(rx, ry, 1 + Math.random() * 2, 1 + Math.random() * 2);
        }

        // Subtle blue highlights for raw grain texture depth
        for (let i = 0; i < 15000; i++) {
          const rx = Math.random() * 1024;
          const ry = Math.random() * 1024;
          ctx.fillStyle = `rgba(59, 130, 246, ${0.04 + Math.random() * 0.05})`;
          ctx.fillRect(rx, ry, 1, 1);
        }

        // Apply organic vintage leather cracks / deep creases for old book realism
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        for (let i = 0; i < 45; i++) {
          ctx.beginPath();
          ctx.lineWidth = 0.5 + Math.random() * 1.5;
          const sx = Math.random() * 1024;
          const sy = Math.random() * 1024;
          ctx.moveTo(sx, sy);
          ctx.bezierCurveTo(
            sx + (Math.random() - 0.5) * 160, sy + (Math.random() - 0.5) * 160,
            sx + (Math.random() - 0.5) * 160, sy + (Math.random() - 0.5) * 160,
            sx + (Math.random() - 0.5) * 240, sy + (Math.random() - 0.5) * 240
          );
          ctx.stroke();
        }
        
        // Add subtle gold leather dust sparks
        for (let i = 0; i < 6000; i++) {
          const rx = Math.random() * 1024;
          const ry = Math.random() * 1024;
          ctx.fillStyle = `rgba(218, 165, 32, ${0.05 + Math.random() * 0.04})`;
          ctx.fillRect(rx, ry, 1, 1);
        }

        // Draw double-framed antique gold pinstripe margins
        const m1 = 44;
        const m2 = 58;
        ctx.strokeStyle = '#cda143';
        ctx.lineWidth = 4;
        ctx.strokeRect(m1, m1, 1024 - m1*2, 1024 - m1*2);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(m2, m2, 1024 - m2*2, 1024 - m2*2);

        // Draw Ornate Baroque Corner Flourishes
        const corners = [
          { x: m2, y: m2, dx: 1, dy: 1 },
          { x: 1024 - m2, y: m2, dx: -1, dy: 1 },
          { x: m2, y: 1024 - m2, dx: 1, dy: -1 },
          { x: 1024 - m2, y: 1024 - m2, dx: -1, dy: -1 }
        ];
        
        corners.forEach(c => {
          ctx.beginPath();
          ctx.strokeStyle = '#cda143';
          ctx.lineWidth = 3;
          ctx.moveTo(c.x, c.y + c.dy * 85);
          ctx.lineTo(c.x + c.dx * 85, c.y);
          ctx.stroke();

          // Symmetrical corner curve flourishes
          ctx.beginPath();
          ctx.moveTo(c.x, c.y + c.dy * 45);
          ctx.quadraticCurveTo(c.x + c.dx * 35, c.y + c.dy * 35, c.x + c.dx * 45, c.y);
          ctx.stroke();

          // Little gold accent circles
          ctx.beginPath();
          ctx.arc(c.x + c.dx * 55, c.y + c.dy * 55, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#b88930';
          ctx.fill();
          ctx.strokeStyle = '#fad77f';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        // Ornate Center Ring Filigree Frame
        const cx = 512, cy = 512, r = 185;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#cda143';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#b88930';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 16 golden beads wrapped around the filigree frame
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          const dx = cx + Math.cos(a) * (r + 15);
          const dy = cy + Math.sin(a) * (r + 15);
          ctx.fillStyle = '#fad77f';
          ctx.beginPath();
          ctx.arc(dx, dy, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Gilded Whale (Sleek swimming outline matching the image)
        ctx.beginPath();
        ctx.moveTo(345, 520); // Front beak/head
        ctx.bezierCurveTo(345, 460, 465, 435, 575, 470); // Smooth back arch to tail
        ctx.bezierCurveTo(605, 480, 625, 455, 645, 435); // Upper tail fin lobe
        ctx.quadraticCurveTo(640, 490, 608, 500);       // Tail fin wedge/indent
        ctx.quadraticCurveTo(645, 525, 635, 545);       // Lower tail fin lobe
        ctx.bezierCurveTo(610, 520, 590, 510, 565, 510); // Tail stalk belly
        ctx.bezierCurveTo(490, 560, 415, 575, 365, 545); // Deep belly curve back to head
        ctx.closePath();

        const goldGrad = ctx.createLinearGradient(350, 450, 650, 550);
        goldGrad.addColorStop(0, '#fde047');
        goldGrad.addColorStop(0.5, '#b88930');
        goldGrad.addColorStop(1, '#fef08a');

        ctx.fillStyle = goldGrad;
        ctx.fill();
        ctx.strokeStyle = '#5a3d07';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw details: Underbelly ridges / grooves
        ctx.strokeStyle = 'rgba(90, 61, 7, 0.65)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(380 + i * 16, 532 + i * 1);
          ctx.quadraticCurveTo(420 + i * 10, 546 - i * 1, 460 + i * 5, 538 - i * 2);
          ctx.stroke();
        }

        // Distinct elegant pectoral fin
        ctx.beginPath();
        ctx.moveTo(425, 540);
        ctx.bezierCurveTo(445, 580, 480, 575, 490, 542);
        ctx.bezierCurveTo(470, 534, 440, 534, 425, 540);
        ctx.closePath();
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.stroke();

        // Eye spot
        ctx.fillStyle = '#0a1724';
        ctx.beginPath();
        ctx.arc(370, 506, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Tail fin striations
        ctx.strokeStyle = '#5a3d07';
        ctx.beginPath();
        ctx.moveTo(595, 485); ctx.lineTo(628, 458);
        ctx.moveTo(597, 492); ctx.lineTo(632, 478);
        ctx.moveTo(595, 498); ctx.lineTo(626, 515);
        ctx.moveTo(595, 505); ctx.lineTo(624, 532);
        ctx.stroke();

        // Draw Vintage Serif Typography
        ctx.textAlign = 'center';
        ctx.fillStyle = goldGrad;
        ctx.font = "600 68px 'Times New Roman', Georgia, serif";
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        ctx.fillText("WILO BLUE", 512, 280);

        ctx.font = "600 44px 'Times New Roman', Georgia, serif";
        ctx.fillText("NAGI ALAAELDIN", 512, 785);
        
        ctx.shadowBlur = 0; // Reset canvas shadows
        ctx.shadowOffsetY = 0;

        // Beautiful compass ornament lines under title & above author
        ctx.strokeStyle = '#cda143';
        ctx.lineWidth = 2.5;
        // top compass star
        ctx.beginPath();
        ctx.arc(512, 335, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.moveTo(512, 335); ctx.lineTo(425, 335);
        ctx.moveTo(512, 335); ctx.lineTo(599, 335);
        ctx.stroke();

        // bottom compass star
        ctx.beginPath();
        ctx.arc(512, 730, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.moveTo(512, 730); ctx.lineTo(425, 730);
        ctx.moveTo(512, 730); ctx.lineTo(599, 730);
        ctx.stroke();
      }

      const coverTex = new THREE.CanvasTexture(coverCanvas);
      
      // Companion tileable procedural texture for back cover & spine sections
      const leatherTileCanvas = document.createElement('canvas');
      leatherTileCanvas.width = 512;
      leatherTileCanvas.height = 512;
      const tCtx = leatherTileCanvas.getContext('2d');
      if (tCtx) {
        const tGrad = tCtx.createRadialGradient(256, 256, 10, 256, 256, 360);
        tGrad.addColorStop(0, '#16284a'); // rich dark blue center
        tGrad.addColorStop(1, '#070b14'); // weathered midnight edges
        tCtx.fillStyle = tGrad;
        tCtx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 15000; i++) {
          const rx = Math.random() * 512;
          const ry = Math.random() * 512;
          tCtx.fillStyle = `rgba(0, 0, 0, ${0.16 + Math.random() * 0.12})`;
          tCtx.fillRect(rx, ry, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
        }

        // Subtle blue leather highlight speckles
        for (let i = 0; i < 8000; i++) {
          const rx = Math.random() * 512;
          const ry = Math.random() * 512;
          tCtx.fillStyle = `rgba(59, 130, 246, ${0.03 + Math.random() * 0.04})`;
          tCtx.fillRect(rx, ry, 1, 1);
        }

        tCtx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
        for (let i = 0; i < 25; i++) {
          tCtx.beginPath();
          tCtx.lineWidth = 0.4 + Math.random() * 1.0;
          const sx = Math.random() * 512;
          const sy = Math.random() * 512;
          tCtx.moveTo(sx, sy);
          tCtx.bezierCurveTo(
            sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80,
            sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80,
            sx + (Math.random() - 0.5) * 120, sy + (Math.random() - 0.5) * 120
          );
          tCtx.stroke();
        }
      }
      const leatherTex = new THREE.CanvasTexture(leatherTileCanvas);
      leatherTex.wrapS = THREE.RepeatWrapping;
      leatherTex.wrapT = THREE.RepeatWrapping;

      const topCoverMat = new THREE.MeshStandardMaterial({
        map: coverTex,
        roughness: 0.72,
        metalness: 0.42
      });

      const plainCoverMat = new THREE.MeshStandardMaterial({
        map: leatherTex,
        roughness: 0.82,
        metalness: 0.16
      });

      // Front Cover Plate Mesh
      const frontCoverMaterials = [ plainCoverMat, plainCoverMat, topCoverMat, plainCoverMat, plainCoverMat, plainCoverMat ];
      const frontCover = new THREE.Mesh(new THREE.BoxGeometry(bookW, 0.032, bookL), frontCoverMaterials);
      frontCover.position.y = bookT / 2;
      bookGroup.add(frontCover);

      // Back Cover Plate Mesh (Beautiful matching plain navy back)
      const backCover = new THREE.Mesh(new THREE.BoxGeometry(bookW, 0.032, bookL), plainCoverMat);
      backCover.position.y = -bookT / 2;
      bookGroup.add(backCover);

      // Thick Block of Gilded Gold Pages
      const pagesGeo = new THREE.BoxGeometry(bookW - 0.08, bookT - 0.052, bookL - 0.06);
      const goldsMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, // premium brassy luxury gold leaf edge
        roughness: 0.14,
        metalness: 0.98,
        emissive: 0x221a02,
        emissiveIntensity: 0.15
      });
      const pageBlock = new THREE.Mesh(pagesGeo, goldsMat);
      pageBlock.position.set(0.04, 0, 0); // slightly offset from the spine on the left
      bookGroup.add(pageBlock);

      // Rounded Spine Geometry linking front & back covers
      const spineGeo = new THREE.CylinderGeometry(bookT / 2, bookT / 2, bookL, 16, 1, false, -Math.PI/2, Math.PI);
      spineGeo.rotateX(Math.PI / 2);
      const spineMesh = new THREE.Mesh(spineGeo, plainCoverMat);
      spineMesh.position.set(-bookW / 2 + 0.015, 0, 0);
      bookGroup.add(spineMesh);

      // Spinal Ribs (5 decorative gold ridges precisely spaced)
      const ribGeo = new THREE.TorusGeometry(bookT / 2 + 0.014, 0.026, 8, 16, Math.PI);
      const ribMat = new THREE.MeshStandardMaterial({
        color: 0xcda143,
        roughness: 0.18,
        metalness: 0.88
      });
      const step = (bookL - 0.54) / 4;
      for (let i = 0; i < 5; i++) {
        const ribMesh = new THREE.Mesh(ribGeo, ribMat);
        ribMesh.position.set(-bookW / 2 + 0.015, 0, -bookL / 2 + 0.27 + i * step);
        ribMesh.rotation.set(0, Math.PI/2, Math.PI/2);
        bookGroup.add(ribMesh);
      }

      // Elegant hanging ribbon/string bookmark (Rich braided antique-gold silk cord wrapping out of bottom)
      const stringPoints = [
        new THREE.Vector3(0.14, -0.03, bookL / 2 - 0.05), // start deep inside the page block
        new THREE.Vector3(0.17, -0.16, bookL / 2 + 0.08), // curve out and clear the bottom leather cover edge
        new THREE.Vector3(0.21, -0.35, bookL / 2 + 0.20), // swoop down elegantly in an organic gravitational arc 
        new THREE.Vector3(0.25, -0.52, bookL / 2 + 0.30)  // dangle low with gold filament end tip
      ];
      const stringCurve = new THREE.CatmullRomCurve3(stringPoints);
      // Create a smooth tubular geometry representing a gorgeous round flexible braided cord/string
      const ribbonGeo = new THREE.TubeGeometry(stringCurve, 24, 0.016, 8, false);
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: 0xcda143, // matching noble yellow-gold antique braided silk
        roughness: 0.38,
        metalness: 0.8
      });
      const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
      bookGroup.add(ribbonMesh);

      // Hanging gold star compass ornament (the golden medal-like star in the image)
      const starCanvas = document.createElement('canvas');
      starCanvas.width = 128;
      starCanvas.height = 128;
      const sctx = starCanvas.getContext('2d');
      if (sctx) {
        sctx.clearRect(0, 0, 128, 128);
        sctx.strokeStyle = '#fad77f';
        sctx.lineWidth = 4;
        sctx.beginPath();
        sctx.arc(64, 64, 42, 0, Math.PI*2);
        sctx.stroke();

        sctx.fillStyle = '#fde047';
        sctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI) / 8;
          const r = i % 2 === 0 ? 52 : 12;
          const px = 64 + Math.cos(a) * r;
          const py = 64 + Math.sin(a) * r;
          if (i === 0) sctx.moveTo(px, py);
          else sctx.lineTo(px, py);
        }
        sctx.closePath();
        sctx.fill();
        sctx.stroke();
      }

      const starTex = new THREE.CanvasTexture(starCanvas);
      const starPlateGeo = new THREE.PlaneGeometry(0.18, 0.18);
      const starPlateMat = new THREE.MeshStandardMaterial({
        map: starTex,
        transparent: true,
        roughness: 0.18,
        metalness: 0.95,
        side: THREE.DoubleSide
      });
      const starPlate = new THREE.Mesh(starPlateGeo, starPlateMat);
      // Anchor precisely at the ending position tip of our curved braided string
      starPlate.position.set(0.25, -0.53, bookL / 2 + 0.30); 
      starPlate.rotation.set(0.28, 0.0, -0.08);
      bookGroup.add(starPlate);

      // Satisfy clean up references inside the useEffect return block to safely avoid compiler errors
      const coverLeftGeo = new THREE.BufferGeometry();
      const coverRightGeo = new THREE.BufferGeometry();
      const coverMat = new THREE.Material();
      const pageLeftGeo = new THREE.BufferGeometry();
      const pageRightGeo = new THREE.BufferGeometry();
      const pageMat = new THREE.Material();
      const scriptMat = new THREE.Material();
      const runeHaloGeo = new THREE.BufferGeometry();
      const runeHaloMat = new THREE.Material();

      haloRef.current = null;

      // The obsolete pedestal column bookContainer is completely hidden/ignored
      bookContainer.visible = false;

      // Boat position and setup in space
      boatGroup.position.set(0, 0, 0);
      scene.add(boatGroup);
      scene.add(bookGroup);
      // @ts-ignore
      boatRef.current = boatGroup;

      // Localized floating/raining cloud group is completely removed as requested
      const cloudGroup = new THREE.Group();
      cloudGroupRef.current = cloudGroup;

      // Localized cloud rain
      const clRainGeo = new THREE.BufferGeometry();
      const clRainPos = new Float32Array(cloudRainCount * 6);
      const clSpeeds = new Float32Array(cloudRainCount);

      for (let i = 0; i < cloudRainCount; i++) {
        const x = (Math.random() - 0.5) * 26.0; // spread matching massive storm cloud width (~4x wider)
        const y = -Math.random() * 22.0;       // falls up to 22.0 units below the cloud down to ocean waterline
        const z = (Math.random() - 0.5) * 26.0;

        clRainPos[i * 6] = x;
        clRainPos[i * 6 + 1] = y;
        clRainPos[i * 6 + 2] = z;

        clRainPos[i * 6 + 3] = x;
        clRainPos[i * 6 + 4] = y - 0.8;
        clRainPos[i * 6 + 5] = z;

        clSpeeds[i] = 16 + Math.random() * 10;
      }

      clRainGeo.setAttribute('position', new THREE.BufferAttribute(clRainPos, 3));
      const clRainMat = new THREE.LineBasicMaterial({
        color: 0x67e8f9, // gorgeous neon cyan rain lines
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        linewidth: 2
      });

      const clRainLines = new THREE.LineSegments(clRainGeo, clRainMat);
      cloudGroup.add(clRainLines);
      cloudRainRef.current = clRainLines;
      cloudRainPositions.current = clRainPos;
      cloudRainSpeeds.current = clSpeeds;

      // ==========================================
      // FORCE GLTFLOADER TO USE NATIVE TEXTURELOADER (HTML Image Elements)
      // ==========================================
      // Under strict sandbox iframe CSP with restricted connect-src, ImageBitmapLoader's fetch() on blob URLs fails.
      // By hiding/deleting createImageBitmap globally on the window during this scope, we force THREE.js GLTFLoader
      // to cleanly use standard TextureLoader (which uses HTMLImageElement img.src assignment natively).
      // Standard image sources are handled by the browser directly (img-src) and avoid CSP fetch() connect-src restrictions entirely.
      if (typeof window !== 'undefined') {
        try {
          (window as any).createImageBitmap = undefined;
        } catch (e) {
          console.warn("Could not override createImageBitmap:", e);
        }
      }

      const gltfLoader = new GLTFLoader();

      let isBoatDone = false;
      let isBookDone = true;
      let isCloudDone = true;
      let loadedBoatModel: THREE.Group | null = null;
      let loadedBookModel: THREE.Group | null = null;
      let loadedCloudModel: THREE.Group | null = null;

      const evaluateManifestation = () => {
        if (isBoatDone && isBookDone && isCloudDone) {
          setModelsLoaded(true);
        }
      };

      // Load user boat GLTF
      const downloadAndLoadBoat = () => {
        fetch('/wilo_intro_boat.glb')
          .then((res) => {
            if (!res.ok) throw new Error("Boat file not found on server");
            return res.arrayBuffer();
          })
          .then((buffer) => {
            if (buffer.byteLength < 500) {
              throw new Error("GLB file exists but is empty or a placeholder (<500 bytes). Gracefully falling back.");
            }
            gltfLoader.parse(
              buffer,
              '/',
              (gltf) => {
                loadedBoatModel = gltf.scene;

                // Calculate bounding box and size of loaded boat model
                const box = new THREE.Box3().setFromObject(loadedBoatModel);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                // Center and scale boat inside a dedicated scaler group to avoid position collision bugs
                const boatScalerGroup = new THREE.Group();
                loadedBoatModel.position.copy(center).multiplyScalar(-1);
                boatScalerGroup.add(loadedBoatModel);

                // Proportional scaling for camera orbit
                const maxDim = Math.max(size.x, size.z);
                const targetScale = 27 / maxDim;
                boatScalerGroup.scale.setScalar(targetScale);

                // Set perfect buoyancy: only approximately 10-15% of the hull sits below the waterline (~12% draft)
                // This keeps the cabin, roof, deck, and mast fully above the ocean with no hovering.
                const submergeUnscaled = 0.36; 
                boatScalerGroup.position.y = -(box.min.y - center.y + submergeUnscaled) * targetScale;

                // Hide procedural layers
                deck.visible = false;
                bow.visible = false;
                cabin.visible = false;
                beacon.visible = false;

                // Add bookContainer inside the boatScalerGroup to retain positioning context
                boatGroup.add(boatScalerGroup);

                 // Update matrices first so world coordinates of elements inside are perfectly computed
                 boatGroup.updateMatrixWorld(true);

                 let mastNode: THREE.Object3D | null = null;
                 let highestYLocal = -Infinity;
                 let highestMesh: THREE.Object3D | null = null;

                 let foundTent = false;
                 loadedBoatModel.traverse((child) => {
                   if (child instanceof THREE.Mesh) {
                     const nameLower = (child.name || '').toLowerCase();

                     // Check for tent, canopy, awning, cabin, cover, roof
                     if (!foundTent && (
                       nameLower.includes('tent') || 
                       nameLower.includes('canopy') || 
                       nameLower.includes('awning') || 
                       nameLower.includes('cabin') || 
                       nameLower.includes('cover') || 
                       nameLower.includes('roof') ||
                       nameLower.includes('shelter') ||
                       nameLower.includes('bimini')
                     )) {
                       child.updateMatrixWorld(true);
                       const wPos = new THREE.Vector3();
                       child.getWorldPosition(wPos);
                       const lPos = boatGroup.worldToLocal(wPos.clone());
                       
                       // Set local target position comfortably below tent ceiling
                       lPos.y = Math.max(2.4, lPos.y - 0.15);
                       tentLocalPosRef.current.set(0.0, 3.25, 2.72);
                       foundTent = true;
                     }

                     // Check if it's the mast, pole, or rigging structures
                     if (nameLower.includes('mast') || nameLower.includes('pole') || nameLower.includes('spire') || nameLower.includes('rigging')) {
                       mastNode = child;
                     }
                     // Check for highest mesh bounding box max Y
                     const childBox = new THREE.Box3().setFromObject(child);
                     if (childBox.max.y > highestYLocal) {
                       highestYLocal = childBox.max.y;
                       highestMesh = child;
                     }
                   }
                  });

                 const targetNode = mastNode || highestMesh;
                 if (targetNode) {
                   const mesh = targetNode as THREE.Mesh;
                   let localTopPoint: THREE.Vector3 | null = null;
                   
                   if (mesh.geometry) {
                     if (!mesh.geometry.boundingBox) {
                       mesh.geometry.computeBoundingBox();
                     }
                     const localBox = mesh.geometry.boundingBox;
                     if (localBox) {
                       localTopPoint = new THREE.Vector3(
                         (localBox.min.x + localBox.max.x) / 2,
                         localBox.max.y,
                         (localBox.min.z + localBox.max.z) / 2
                       );
                     }
                   }

                   let worldTop: THREE.Vector3;
                   if (localTopPoint) {
                     // Transform local geometric tip directly to world space
                     worldTop = localTopPoint.clone().applyMatrix4(mesh.matrixWorld);
                   } else {
                     // Fallback to world bounding box
                     const nodeBox = new THREE.Box3().setFromObject(targetNode);
                     worldTop = new THREE.Vector3(
                       (nodeBox.min.x + nodeBox.max.x) / 2,
                       nodeBox.max.y,
                       (nodeBox.min.z + nodeBox.max.z) / 2
                     );
                   }
                   
                   // Convert world space coordinates back into boatGroup local space
                   const localTop = boatGroup.worldToLocal(worldTop.clone());
                   
                   // Align flagGroup exactly to sit on top of the boat mast!
                   flagGroup.position.copy(localTop);
                   // Centering adjustment: shift significantly further left along the local X-axis (from 0.15 to 0.65) to perfectly center on the column top
                   flagGroup.position.x -= 0.65;
                   // Adjust slightly on Z for visual center alignment
                   flagGroup.position.z -= 0.10;
                 } else {
                   // Proportional fallback height
                   flagGroup.position.set(0, 11.5, 0.5);
                 }

                isBoatDone = true;
                setBoatProgress(100);
                evaluateManifestation();
              },
              (err) => {
                console.warn('Boat GLB load/parsing failed. Keeping robust procedural elements:', err.message || err);
                isBoatDone = true;
                setBoatProgress(100);
                evaluateManifestation();
              }
            );
          })
          .catch((err) => {
            console.warn('Boat GLB load process failed. Keeping robust procedural elements:', err.message || err);
            isBoatDone = true;
            setBoatProgress(100);
            evaluateManifestation();
          });
      };
      downloadAndLoadBoat();

      // Load new user majestic book GLTF
      const downloadAndLoadBook = () => {
        fetch('/book_new.glb')
          .then((res) => {
            if (!res.ok) throw new Error("Book file not found on server");
            return res.arrayBuffer();
          })
          .then((buffer) => {
            if (buffer.byteLength < 500) {
              throw new Error("GLB file exists but is empty or a placeholder (<500 bytes). Gracefully falling back.");
            }
            gltfLoader.parse(
              buffer,
              '/',
              (gltf) => {
                loadedBookModel = gltf.scene;

                // Center and scale book flat
                const box = new THREE.Box3().setFromObject(loadedBookModel);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                const bookScalerGroup_inner = new THREE.Group();
                loadedBookModel.position.copy(center).multiplyScalar(-1);
                bookScalerGroup_inner.add(loadedBookModel);

                const maxDim = Math.max(size.x, size.y, size.z);
                // Scale it beautifully/majestically so it is clearly visible floating between the boat and cloud
                const targetScale = 5.2 / maxDim; 
                bookScalerGroup_inner.scale.setScalar(targetScale);

                // Keep orientation perfectly horizontal and cover facing upward as requested
                bookScalerGroup_inner.rotation.set(0, 0, 0); 
                bookScalerGroup_inner.position.set(0, 0, 0);

                pedestalCol.visible = false;
                pedRing.visible = false;
                bookContainer.visible = false; // Hide old pedestal system entirely

                // Add loaded book scaler directly inside the floating scene bookGroup container
                bookGroup.add(bookScalerGroup_inner);

                isBookDone = true;
                setBookProgress(100);
                evaluateManifestation();
              },
              (err) => {
                console.warn('Book GLB load/parsing failed. Keeping robust procedural magic:', err.message || err);
                isBookDone = true;
                setBookProgress(100);
                evaluateManifestation();
              }
            );
          })
          .catch((err) => {
            console.warn('Book GLB load process failed. Keeping robust procedural magic:', err.message || err);
            isBookDone = true;
            setBookProgress(100);
            evaluateManifestation();
          });
      };
      downloadAndLoadBook();

      // Fallback procedural puffy clouds generator (in case asset download/parsing fails inside container)
      const createProceduralCloudFallback = () => {
        const fallbackGroup = new THREE.Group();
        fallbackGroup.name = "procedural-cloud-fallback";
        
        // Let's make a cluster of 6 spheres overlapping to create an elegant puffy cloud
        const cloudMaterial = new THREE.MeshStandardMaterial({
          color: 0xe0f2fe, // beautiful pale sky cloud blue
          roughness: 0.9,
          metalness: 0.1,
          transparent: true,
          opacity: 0.85,
          flatShading: true // faceted cartoonish premium polygonal clouds
        });

        const sphereSizes = [5.5, 4.2, 4.8, 3.8, 4.0, 3.0];
        const sphereOffsets = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-4.5, -0.8, -0.5),
          new THREE.Vector3(4.5, -0.6, 0.4),
          new THREE.Vector3(-2.0, 1.2, -1.5),
          new THREE.Vector3(2.0, 1.4, 1.0),
          new THREE.Vector3(0, -1.5, 2.0)
        ];

        sphereSizes.forEach((size, idx) => {
          const geom = new THREE.SphereGeometry(size, 8, 8); // nice low poly faceted look
          const mesh = new THREE.Mesh(geom, cloudMaterial);
          mesh.position.copy(sphereOffsets[idx]);
          fallbackGroup.add(mesh);
        });

        // Scale by 2.55 so that the fallback group matches the size of the 45-unit wide 3D model beautifully
        fallbackGroup.scale.setScalar(2.55);

        cloudGroup.add(fallbackGroup);
      };

      // Load user cloud GLTF
      const downloadAndLoadCloud = () => {
        fetch('/cloud.glb')
          .then((res) => {
            if (!res.ok) throw new Error("Cloud file not found on server");
            return res.arrayBuffer();
          })
          .then((buffer) => {
            if (buffer.byteLength < 500) {
              throw new Error("GLB file exists but is empty or a placeholder (<500 bytes). Gracefully falling back.");
            }
            gltfLoader.parse(
              buffer,
              '/',
              (gltf) => {
                loadedCloudModel = gltf.scene;

                // Traverse the model meshes to ensure materials, textures, and normals are loaded and configured correctly
                loadedCloudModel.traverse((child: any) => {
                  if (child.isMesh) {
                    // Ensure normals are calculated correctly
                    if (child.geometry) {
                      child.geometry.computeVertexNormals();
                    }

                    // Use original materials and texture maps from the asset instead of creating a custom blank material
                    if (child.material) {
                      const materials = Array.isArray(child.material) ? child.material : [child.material];
                      materials.forEach((mat: any) => {
                        mat.transparent = true;
                        mat.side = THREE.DoubleSide; // Mesh uses double-sided rendering
                        mat.depthWrite = false;      // Prevents rectangular sorting clipping boxes on overlapping transparent cloud cards
                        
                        // Enable vertex colors if the model geometry files contain COLOR_0 data attributes
                        if (child.geometry && child.geometry.attributes.color) {
                          mat.vertexColors = true;
                        }

                        mat.needsUpdate = true;
                      });
                    }
                  }
                });

                // Center and scale cloud
                const box = new THREE.Box3().setFromObject(loadedCloudModel);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                const cloudScaler = new THREE.Group();
                loadedCloudModel.position.copy(center).multiplyScalar(-1);
                cloudScaler.add(loadedCloudModel);

                // Make the cloud a massive approaching storm system (3.8 times larger than previous)
                const maxDim = Math.max(size.x, size.z);
                const targetCloudScale = 29.0 / maxDim; 
                cloudScaler.scale.setScalar(targetCloudScale);

                cloudGroup.add(cloudScaler);

                isCloudDone = true;
                setCloudProgress(100);
                evaluateManifestation();
              },
              (err) => {
                console.warn('Cloud GLB load/parsing failed. Constructing gorgeous procedural fallback clouds:', err.message || err);
                createProceduralCloudFallback();
                isCloudDone = true;
                setCloudProgress(100);
                evaluateManifestation();
              }
            );
          })
          .catch((err) => {
            console.warn('Cloud GLB load process failed. Constructing gorgeous procedural fallback clouds:', err.message || err);
            
            // Create the beautiful stylized low-poly cloud fallback!
            createProceduralCloudFallback();

            isCloudDone = true;
            setCloudProgress(100);
            evaluateManifestation();
          });
      };
      // downloadAndLoadCloud();

      // 8. DIRECTIONAL SUN LIGHT
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(120, 120, 50);
      scene.add(dirLight);
      dirLightRef.current = dirLight;

      // 9. AMBIENT SHADOW FILL LIGHT (Adds soft mystic shadows on parts of cabin)
      const ambientLight = new THREE.AmbientLight(0x0a1424, 0.45);
      scene.add(ambientLight);
      ambientLightRef.current = ambientLight;

      // 10. DYNAMIC RAIN GENERATOR
      const rainGeo = new THREE.BufferGeometry();
      const rainPos = new Float32Array(rainCount * 6);
      const speeds = new Float32Array(rainCount);

      for (let i = 0; i < rainCount; i++) {
        // distribute rain around the boat area for maximum performance and gorgeous dense display
        const x = (Math.random() - 0.5) * 180 + 20;
        const y = Math.random() * 80 + 10;
        const z = (Math.random() - 0.5) * 180;

        rainPos[i * 6] = x;
        rainPos[i * 6 + 1] = y;
        rainPos[i * 6 + 2] = z;

        // rain slash geometry segment (top vertex to slightly lower bottom vertex)
        rainPos[i * 6 + 3] = x - 0.15;
        rainPos[i * 6 + 4] = y - 2.5;
        rainPos[i * 6 + 5] = z;

        speeds[i] = 45 + Math.random() * 30; // heavy vertical rain speed
      }

      rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
      const rainMat = new THREE.LineBasicMaterial({
        color: 0x4cc9f0,
        transparent: true,
        opacity: 0.0, // lerps based on weather
        blending: THREE.AdditiveBlending,
        linewidth: 1 // fallback
      });
      const rainLines = new THREE.LineSegments(rainGeo, rainMat);
      scene.add(rainLines);
      rainRef.current = rainLines;
      rainPositions.current = rainPos;
      rainSpeeds.current = speeds;

      onReady();

      // PMREM generator setup for reflecting Sky on water
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      let envMapNeedsUpdate = true;

      // Handle window resize dynamically
      const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Custom high-precision clock class to replace deprecated THREE.Clock and prevent deprecation warnings in the console
      class CustomClock {
        private startTime: number;
        private lastTime: number;
        private elapsed: number;

        constructor() {
          this.startTime = performance.now();
          this.lastTime = this.startTime;
          this.elapsed = 0;
        }

        getDelta(): number {
          const current = performance.now();
          const delta = (current - this.lastTime) / 1000;
          this.lastTime = current;
          return delta;
        }

        getElapsedTime(): number {
          const current = performance.now();
          this.elapsed = (current - this.startTime) / 1000;
          return this.elapsed;
        }
      }

      // Initialize sun coordinates
      const sunVec = new THREE.Vector3();
      const clock = new CustomClock();

      // 11. PRIMARY ANIMATION FRAME LOOP
      const animate = () => {
        if (!scene || !renderer || !camera) return;

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Increment Water Time
        if (water && water.material) {
          water.material.uniforms['time'].value += delta * 0.85; // wave animation speed
        }

        // 11a. Smooth transition interpolation of weather settings toward target preset
        const activeWeather = weatherModeRef.current;
        const target = THREE_WEATHER_PRESETS[activeWeather];
        const lerpSpeed = 1.35 * delta; // fully smooth within ~1.5s

        currentPreset.current.turbidity = lerp(currentPreset.current.turbidity, target.turbidity, lerpSpeed);
        currentPreset.current.rayleigh = lerp(currentPreset.current.rayleigh, target.rayleigh, lerpSpeed);
        currentPreset.current.mieCoefficient = lerp(currentPreset.current.mieCoefficient, target.mieCoefficient, lerpSpeed);
        currentPreset.current.mieDirectionalG = lerp(currentPreset.current.mieDirectionalG, target.mieDirectionalG, lerpSpeed);
        currentPreset.current.sunElevation = lerp(currentPreset.current.sunElevation, target.sunElevation, lerpSpeed);
        currentPreset.current.sunAzimuth = lerp(currentPreset.current.sunAzimuth, target.sunAzimuth, lerpSpeed);
        currentPreset.current.distortionScale = lerp(currentPreset.current.distortionScale, target.distortionScale, lerpSpeed);
        currentPreset.current.fogDensity = lerp(currentPreset.current.fogDensity, target.fogDensity, lerpSpeed);
        currentPreset.current.lightIntensity = lerp(currentPreset.current.lightIntensity, target.lightIntensity, lerpSpeed);
        currentPreset.current.rainOpacity = lerp(currentPreset.current.rainOpacity, target.rainOpacity, lerpSpeed);
        currentPreset.current.ambientIntensity = lerp(currentPreset.current.ambientIntensity, target.ambientIntensity, lerpSpeed);

        // Smooth color interpolations
        const cTargetSun = new THREE.Color(...target.sunColor);
        const cCurrentSun = new THREE.Color(...currentPreset.current.sunColor);
        lerpColor(cCurrentSun, cTargetSun, lerpSpeed);
        currentPreset.current.sunColor = [cCurrentSun.r, cCurrentSun.g, cCurrentSun.b];

        const cTargetLight = new THREE.Color(...target.lightColor);
        const cCurrentLight = new THREE.Color(dirLight.color.getHex());
        lerpColor(cCurrentLight, cTargetLight, lerpSpeed);
        dirLight.color.copy(cCurrentLight);

        const cTargetWater = new THREE.Color(target.waterColor);
        const cCurrentWater = new THREE.Color(water.material.uniforms['waterColor'].value);
        lerpColor(cCurrentWater, cTargetWater, lerpSpeed);
        water.material.uniforms['waterColor'].value.copy(cCurrentWater);

        const cTargetFog = new THREE.Color(target.fogColor);
        const cCurrentFog = new THREE.Color(scene.fog.color.getHex());
        lerpColor(cCurrentFog, cTargetFog, lerpSpeed);
        scene.fog.color.copy(cCurrentFog);

        const cTargetAmbient = new THREE.Color(...target.ambientColor);
        const cCurrentAmbient = new THREE.Color(ambientLight.color.getHex());
        lerpColor(cCurrentAmbient, cTargetAmbient, lerpSpeed);
        ambientLight.color.copy(cCurrentAmbient);
        ambientLight.intensity = currentPreset.current.ambientIntensity;
        
        // Also update renderer clear color to match fog perfectly
        renderer.setClearColor(scene.fog.color);

        // Exposure interpolation to prevent overexposure/blowouts
        const targetExposure = target.exposure ?? 0.62;
        renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, targetExposure, lerpSpeed);

        // Starfield opacity updater with atmospheric scintillation (twinkle)
        if (starFieldRef.current && starFieldRef.current.material) {
          const starMat = starFieldRef.current.material as THREE.PointsMaterial;
          const targetStarOpacity = target.starOpacity ?? 0.0;
          let twinkleFactor = 1.0;
          if (targetStarOpacity > 0.5) {
            // Subtle, high-frequency twinkling animation
            twinkleFactor = 0.76 + Math.sin(elapsed * 5.2 + Math.cos(elapsed * 2.3)) * 0.24;
          }
          starMat.opacity = THREE.MathUtils.lerp(starMat.opacity, targetStarOpacity * twinkleFactor, lerpSpeed);
        }

        // Occasional meteor / shooting star crossing the sky during night mode
        if (shootingStarRef.current) {
          const state = shootingStarStateRef.current;
          const starMat = shootingStarRef.current.material as THREE.LineBasicMaterial;

          if (activeWeather === 'night') {
            if (!state.active) {
              // Approx 1/15 chance per second at 60fps
              if (Math.random() < 0.0012) {
                state.active = true;
                state.progress = 0;
                state.speed = 1.3 + Math.random() * 1.5; // Fast sweep across space
                const angle = Math.random() * Math.PI * 2;
                const radius = 600 + Math.random() * 150;
                state.startPos.set(
                  radius * Math.cos(angle),
                  280 + Math.random() * 120,
                  radius * Math.sin(angle)
                );
                state.dir.set(
                  (Math.random() - 0.5) * 400,
                  -140 - Math.random() * 100,
                  (Math.random() - 0.5) * 400
                ).normalize();
                
                shootingStarRef.current.position.copy(state.startPos);
                starMat.opacity = 0.0;
              }
            } else {
              state.progress += delta * state.speed;
              if (state.progress >= 1.0) {
                state.active = false;
                starMat.opacity = 0.0;
              } else {
                const currentPos = state.startPos.clone().addScaledVector(state.dir, state.progress * 700);
                shootingStarRef.current.position.copy(currentPos);
                
                // Fade in, hold, and fade out smoothly
                if (state.progress < 0.15) {
                  starMat.opacity = state.progress / 0.15;
                } else if (state.progress > 0.70) {
                  starMat.opacity = (1.0 - state.progress) / 0.30;
                } else {
                  starMat.opacity = 0.95;
                }
              }
            }
          } else {
            state.active = false;
            starMat.opacity = 0.0;
          }
        }

        // Dynamic cloud properties updater
        if (cloudGroupRef.current) {
          const targetCloudCol = new THREE.Color(target.cloudColor ?? 0xffffff);
          const targetCloudOpacity = target.cloudOpacity ?? 0.85;
          cloudGroupRef.current.traverse((child: any) => {
            if (child.isMesh && child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((mat: any) => {
                if (mat.color && typeof mat.color.lerp === 'function') {
                  mat.color.lerp(targetCloudCol, lerpSpeed * 1.5);
                }
                if (mat.opacity !== undefined) {
                  mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetCloudOpacity, lerpSpeed);
                }
              });
            }
          });
        }

        // Update basic uniforms in real-time
        skyUniforms['turbidity'].value = currentPreset.current.turbidity;
        skyUniforms['rayleigh'].value = currentPreset.current.rayleigh;
        skyUniforms['mieCoefficient'].value = currentPreset.current.mieCoefficient;
        skyUniforms['mieDirectionalG'].value = currentPreset.current.mieDirectionalG;

        water.material.uniforms['distortionScale'].value = currentPreset.current.distortionScale;
        if (scene.fog && 'density' in scene.fog) {
          (scene.fog as THREE.FogExp2).density = currentPreset.current.fogDensity;
        }

        // 11b. Apply celestial positions (Elevation, Azimuth math spherical conversion)
        const phiCam = THREE.MathUtils.degToRad(90 - currentPreset.current.sunElevation);
        const thetaCam = THREE.MathUtils.degToRad(currentPreset.current.sunAzimuth);
        sunVec.setFromSphericalCoords(1, phiCam, thetaCam);

        // Sync celestial body position to uniforms
        skyUniforms['sunPosition'].value.copy(sunVec);
        water.material.uniforms['sunDirection'].value.copy(sunVec).normalize();

        // Match celestial reflection glint color
        const [scR, scG, scB] = currentPreset.current.sunColor;
        const baseSunLitColor = new THREE.Color().setRGB(scR, scG, scB);
        water.material.uniforms['sunColor'].value.copy(baseSunLitColor);

        // Match DirectionalLight alignment
        dirLight.position.copy(sunVec).multiplyScalar(200);
        
        // Base light intensity
        let activeLightIntensity = currentPreset.current.lightIntensity;

        // 11c. Immersive Storm Lightning flashing logic
        if (activeWeather === 'storm' && lightningPulseRef.current > 0.1) {
          // Flash sky to full bright silver
          skyUniforms['turbidity'].value = 3.0; // momentary clear blast
          skyUniforms['rayleigh'].value = 0.5 + lightningPulseRef.current * 4.0;
          dirLight.color.setHex(0xeef8ff);
          activeLightIntensity = lightningPulseRef.current * 3.5; // mega flash burst

          // flash water reflection
          const lightningCol = new THREE.Color(0xbadaff);
          water.material.uniforms['sunColor'].value.copy(lightningCol.multiplyScalar(lightningPulseRef.current * 3));
          
          // flash fog to silver-grey
          const flashFog = new THREE.Color(0x353a47);
          scene.fog.color.copy(flashFog);
        }
        dirLight.intensity = activeLightIntensity;

        // Update cozy vintage lantern lighting intensity and flickering
        if (cozyLightRef.current && lanternWickRef.current) {
          const currentMode = weatherModeRef.current;
          let targetIntensity = 0.0;
          
          if (currentMode === 'night') {
            targetIntensity = 2.4;
          } else if (currentMode === 'storm') {
            targetIntensity = 2.0;
          } else if (currentMode === 'dawn') {
            targetIntensity = 0.8; // dimming down as sunrise approaches
          } else {
            targetIntensity = 0.0; // turned off during day / cloudy daylight
          }

          // Apply a realistic natural fireplace/candle flicker noise
          let activeIntensity = targetIntensity;
          if (targetIntensity > 0.05) {
            // Use organic Perlin noise multi-octave flicker in night mode for high-fidelity cozy realism
            let perlinFlicker = 0;
            if (currentMode === 'night') {
              // Standard flame flickers exhibit fractal 1/f organic variation. We layer 3 octaves at ~14Hz base frequency.
              perlinFlicker = perlin1D.octave(elapsed * 14.5, 3, 0.6) * 0.38;
            } else {
              // Standard sine/random flicker for other active modes
              perlinFlicker = Math.sin(elapsed * 15) * 0.12 + Math.cos(elapsed * 7) * 0.08 + (Math.random() - 0.5) * 0.15;
            }
            activeIntensity = Math.max(0.1, targetIntensity + perlinFlicker);
            
            // Flicker the flame shape too!
            const wickTimeScale = currentMode === 'night' ? elapsed * 1.5 : elapsed;
            const scaleY = 1.3 + Math.sin(wickTimeScale * 20) * 0.25;
            const scaleXZ = 0.8 + Math.cos(wickTimeScale * 18) * 0.15;
            lanternWickRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
            lanternWickRef.current.visible = true;
          } else {
            lanternWickRef.current.visible = false;
          }

          // Lerp/blend the light intensity over time to feel silky smooth on weather preset shifts
          cozyLightRef.current.intensity = THREE.MathUtils.lerp(cozyLightRef.current.intensity, activeIntensity, 4.5 * delta);
        }

        // Update deck-crate maritime lantern lighting intensity, glow, and flickering
        if (deckLanternLightRef.current && deckLanternWickRef.current && deckLanternGlowRef.current) {
          const currentMode = weatherModeRef.current;
          let targetIntensity = 0.0;
          let targetGlowOpacity = 0.0;
          
          if (currentMode === 'night') {
            targetIntensity = 28.0; // beautiful bright cozy gold warm rays to make the blue book highly legible and cinematic
            targetGlowOpacity = 0.45;
          } else if (currentMode === 'storm') {
            targetIntensity = 22.0;
            targetGlowOpacity = 0.38;
          } else if (currentMode === 'dawn') {
            targetIntensity = 10.0; // soft morning light
            targetGlowOpacity = 0.22;
          } else {
            // Day or cloudy
            targetIntensity = 0.8; // very weak glowing wick just to stay beautifully textured but no strong light-source
            targetGlowOpacity = 0.05;
          }

          let activeIntensity = targetIntensity;
          let activeGlowOpacity = targetGlowOpacity;

          if (targetIntensity > 0.1) {
            // Use organic Perlin noise multi-octave flicker in night mode for high-fidelity cozy realism
            let perlinFlicker = 0;
            if (currentMode === 'night') {
              // Offset time coordinate to prevent synchronization with boat lantern.
              perlinFlicker = perlin1D.octave((elapsed + 150.0) * 16.5, 3, 0.6) * 4.5;
            } else {
              perlinFlicker = Math.sin(elapsed * 22) * 0.15 + Math.cos(elapsed * 10) * 0.1 + (Math.random() - 0.5) * 0.12;
            }
            activeIntensity = Math.max(0.1, targetIntensity + perlinFlicker);
            activeGlowOpacity = Math.max(0.01, targetGlowOpacity + (perlinFlicker / targetIntensity) * targetGlowOpacity * 0.85);

            // Rescale wick shape for natural breathing effect
            const wickTimeScale = currentMode === 'night' ? elapsed * 1.5 : elapsed;
            const scaleY = 1.25 + Math.sin(wickTimeScale * 26) * 0.18;
            const scaleXZ = 0.8 + Math.cos(wickTimeScale * 24) * 0.08;
            deckLanternWickRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
            deckLanternWickRef.current.visible = true;

            // Update external soft glass halo glow
            const glowPulse = 1.0 + Math.sin(wickTimeScale * 15) * 0.06;
            deckLanternGlowRef.current.scale.setScalar(glowPulse);
            // We cast material safely to MeshBasicMaterial
            const mat = deckLanternGlowRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = activeGlowOpacity;
            deckLanternGlowRef.current.visible = true;
          } else {
            deckLanternWickRef.current.visible = false;
            deckLanternGlowRef.current.visible = false;
          }

          // Blended smooth state interpolation over time
          deckLanternLightRef.current.intensity = THREE.MathUtils.lerp(deckLanternLightRef.current.intensity, activeIntensity, 4.5 * delta);
        }

        // 11d. Floating boat physics oscillation
        if (boatGroup) {
          // Retrieve actual wave time from the water shader uniform to perfectly synchronize movement with wave motion
          const waveTime = water ? water.material.uniforms['time'].value : elapsed * 0.85;

          // Gentle bobbing directly mapped to wave phase and frequency
          const waveHeightOffset = Math.sin(waveTime * 1.0) * 0.16 + Math.cos(waveTime * 0.5) * 0.08;
          boatGroup.position.y = waveHeightOffset;
          
          // Subtle pitch and roll rotational sways synced with waves
          boatGroup.rotation.z = Math.cos(waveTime * 1.0) * 0.055; // roll side to side
          boatGroup.rotation.x = Math.sin(waveTime * 0.8) * 0.04;  // pitch front-to-back
          boatGroup.rotation.y = Math.sin(waveTime * 0.15) * 0.03; // slight navigational weave
        }

        // 11d2. Localized floating cloud and floating independent book animation
        if (cloudGroup) {
          // Cloud floats high above and behind the boat (Approaching Storm cloud system)
          const targetCloudX = boatGroup.position.x - 4.0 + Math.sin(elapsed * 0.25) * 2.0;
          const targetCloudZ = boatGroup.position.z - 20.0 + Math.cos(elapsed * 0.2) * 2.0;
          // floats very high in sky
          const targetCloudY = 34.0 + Math.sin(elapsed * 0.45) * 0.60;

          // smoothly slide cloud position to target
          cloudGroup.position.x = THREE.MathUtils.lerp(cloudGroup.position.x, targetCloudX, 0.08);
          cloudGroup.position.y = THREE.MathUtils.lerp(cloudGroup.position.y, targetCloudY, 0.08);
          cloudGroup.position.z = THREE.MathUtils.lerp(cloudGroup.position.z, targetCloudZ, 0.08);

          // Floats the independent book directly underneath the storm cloud or under the boat tent
          if (bookGroup) {
            // Convert local tent coordinate to world space following boat Group rotation & drifting
            const worldTentPos = tentLocalPosRef.current.clone();
            boatGroup.updateMatrixWorld(true);
            worldTentPos.applyMatrix4(boatGroup.matrixWorld);

            let targetBookX = worldTentPos.x;
            let targetBookZ = worldTentPos.z;
            let targetBookY = worldTentPos.y;

            if (inspectModeRef.current === 'book') {
              // Completely decouple the book from the boat's rolling and yawing wave rocking!
              // Float it in stable world space coordinates to ensure absolute stillness and ease of rotation.
              targetBookX = 0.0;
              targetBookZ = 3.6;
              targetBookY = 6.8 + Math.sin(elapsed * 0.8) * 0.035; // gentle ambient mid-air hover raised higher for perfect screen centering
            } else {
              // Sit firmly and flat on the top of the box without hovering or clipping
              targetBookY = worldTentPos.y;
            }

            bookGroup.position.x = THREE.MathUtils.lerp(bookGroup.position.x, targetBookX, 0.08);
            bookGroup.position.y = THREE.MathUtils.lerp(bookGroup.position.y, targetBookY, 0.08);
            bookGroup.position.z = THREE.MathUtils.lerp(bookGroup.position.z, targetBookZ, 0.08);

            if (inspectModeRef.current === 'book') {
              // Smoothly scale book for beautiful close-up inspection fit
              const targetScaleVal = 1.0;
              bookGroup.scale.setScalar(THREE.MathUtils.lerp(bookGroup.scale.x, targetScaleVal, 0.08));

              if (!isDraggingRef.current) {
                // High-fidelity spring-based physical simulation with custom damping coefficients.
                // We model a physical torsional mass-spring-damper for both pitch (X-axis) and yaw (Y-axis).
                
                // Targets: X-axis (Pitch) relaxes back to a comfortable 0.25 radians
                const targetX = 0.25;
                // Y-axis (Yaw) relaxes to the closest clean frontal/backward viewing face (every 180 degrees)
                const yawPos = bookRotationYRef.current;
                const nearestN = Math.round((yawPos - 1.5) / Math.PI);
                const targetY = 1.5 + nearestN * Math.PI;

                // Physics Coefficients
                const kSpringX = 0.08; 
                const kSpringY = 0.06; 
                const dampingX = 0.88;
                const dampingY = 0.94; // slightly higher to allow beautiful persistent spinning glide

                // 1. Calculate pitch spring force & update X-rotation
                const forceX = -kSpringX * (bookRotationXRef.current - targetX);
                bookRotVelXRef.current = (bookRotVelXRef.current + forceX) * dampingX;
                bookRotationXRef.current += bookRotVelXRef.current;

                // 2. Calculate yaw spring force with dynamic speed scaling
                // High-speed spins glide with pure inertia; as it slows, it gets caught and snaps to the nearest cover.
                const speedY = Math.abs(bookRotVelYRef.current);
                const springActivationY = THREE.MathUtils.clamp(1.0 - speedY * 6.0, 0.0, 1.0);
                const forceY = -kSpringY * springActivationY * (bookRotationYRef.current - targetY);
                bookRotVelYRef.current = (bookRotVelYRef.current + forceY) * dampingY;
                bookRotationYRef.current += bookRotVelYRef.current;

                // Simple slow continuous hover spin when there is no drag velocity and it has fully settled
                if (Math.abs(bookRotVelYRef.current) < 0.0012 && Math.abs(bookRotVelXRef.current) < 0.0012) {
                   bookRotationYRef.current += 0.0016; // soft dynamic showcase twist
                }
              }

              // Smoothly interpolate the actual group rotation to match our drag target + inertia values
              bookGroup.rotation.x = THREE.MathUtils.lerp(bookGroup.rotation.x, bookRotationXRef.current, 0.12);
              bookGroup.rotation.y = THREE.MathUtils.lerp(bookGroup.rotation.y, bookRotationYRef.current, 0.12);
              bookGroup.rotation.z = THREE.MathUtils.lerp(bookGroup.rotation.z, 0.0, 0.12);
            } else {
              // Smoothly scale to matching journal dimensions sitting elegantly centered on top of the crate
              const targetScaleVal = 0.95;
              bookGroup.scale.setScalar(THREE.MathUtils.lerp(bookGroup.scale.x, targetScaleVal, 0.08));

              // Align orientation flat with the boat deck's roll, pitch and yaw coordinates
              const targetRotationX = boatGroup.rotation.x;
              const targetRotationY = boatGroup.rotation.y;
              const targetRotationZ = boatGroup.rotation.z;

              bookGroup.rotation.x = THREE.MathUtils.lerp(bookGroup.rotation.x, targetRotationX, 0.08);
              bookGroup.rotation.y = THREE.MathUtils.lerp(bookGroup.rotation.y, targetRotationY, 0.08);
              bookGroup.rotation.z = THREE.MathUtils.lerp(bookGroup.rotation.z, targetRotationZ, 0.08);

              // Seamlessly align manual rotation angles so the transition in handoff is completely perfect
              bookRotationYRef.current = targetRotationY;
              bookRotationXRef.current = targetRotationX;
              bookRotVelYRef.current = 0;
              bookRotVelXRef.current = 0;
            }
          }

          // animate the local rain falling from the cloud down to water waterline
          if (clRainLines && clRainPos && clSpeeds) {
            for (let i = 0; i < cloudRainCount; i++) {
              const speed = clSpeeds[i] * delta * 1.25;
              clRainPos[i * 6 + 1] -= speed; // decrease relative y
              clRainPos[i * 6 + 4] -= speed;

              // Since the cloud is at y ~34, we reset droplets when they fall below waterline (relative y of -34.5 units in cloud space)
              if (clRainPos[i * 6 + 1] < -34.5) {
                const x = (Math.random() - 0.5) * 26.0; // matching massive cloud width
                const y = 0.0; // spawn at cloud bottom (relative y=0)
                const z = (Math.random() - 0.5) * 26.0;

                clRainPos[i * 6] = x;
                clRainPos[i * 6 + 1] = y;
                clRainPos[i * 6 + 2] = z;

                clRainPos[i * 6 + 3] = x;
                clRainPos[i * 6 + 4] = y - 0.8;
                clRainPos[i * 6 + 5] = z;
              }
            }
            clRainLines.geometry.attributes.position.needsUpdate = true;
          }
        }

        // 11e. Rain particle simulation inside camera scope
        if (rainLines && rainPos && rainSpeeds.current) {
          const visible = currentPreset.current.rainOpacity > 0.05;
          rainLines.visible = visible;
          
          if (visible) {
            // update rain opacity
            // @ts-ignore
            rainLines.material.opacity = currentPreset.current.rainOpacity;

            for (let i = 0; i < rainCount; i++) {
              const speed = rainSpeeds.current[i] * delta * 1.5;

              // Fall downwards and slightly drift with storm wind
              rainPos[i * 6] -= 2 * delta; // slight wind slant x
              rainPos[i * 6 + 1] -= speed; // y drop
              
              rainPos[i * 6 + 3] -= 2 * delta;
              rainPos[i * 6 + 4] -= speed;

              // If falls below ocean surface, respawn high above in container scope
              if (rainPos[i * 6 + 1] < -2) {
                const newX = (Math.random() - 0.5) * 180 + camera.position.x;
                const newY = 70 + Math.random() * 30;
                const newZ = (Math.random() - 0.5) * 180 + camera.position.z - 40;

                rainPos[i * 6] = newX;
                rainPos[i * 6 + 1] = newY;
                rainPos[i * 6 + 2] = newZ;

                rainPos[i * 6 + 3] = newX - 0.15;
                rainPos[i * 6 + 4] = newY - 2.5;
                rainPos[i * 6 + 5] = newZ;
              }
            }
            rainLines.geometry.attributes.position.needsUpdate = true;
          }
        }

        // Spin the magical runic halo above the book pages in unison with waves
        if (haloRef.current) {
          haloRef.current.rotation.z += delta * 0.95;
          // Subtly hover up and down above the spell pages
          haloRef.current.position.y = 0.45 + Math.sin(elapsed * 2.5) * 0.05;
        }

        // 11f. Natural old flag wind billow simulation synced to weather speed
        if (flagMeshRef.current && flagOriginalPositionsRef.current) {
          const mesh = flagMeshRef.current;
          const original = flagOriginalPositionsRef.current;
          const posAttr = mesh.geometry.attributes.position;
          const arr = posAttr.array as Float32Array;

          // Align wind parameters dynamically with standard weather states
          const currentMode = weatherModeRef.current;
          let windSpd = 5.5; // average breeze
          let flagAmpY = 0.12;
          let flagAmpZ = 0.35;

          if (currentMode === 'storm') {
            windSpd = 13.0; // intense stormy gales
            flagAmpY = 0.26;
            flagAmpZ = 0.72;
          } else if (currentMode === 'night') {
            windSpd = 3.2;  // serene midnight quietness
            flagAmpY = 0.06;
            flagAmpZ = 0.18;
          } else if (currentMode === 'dawn') {
            windSpd = 4.2;  // refreshing sunrise draft
            flagAmpY = 0.08;
            flagAmpZ = 0.24;
          } else if (currentMode === 'cloudy') {
            windSpd = 6.8;  // gusty overcast wind
            flagAmpY = 0.14;
            flagAmpZ = 0.42;
          }

          const frequency = 1.1; // ripple wave density on the flag fabric
          
          for (let i = 0; i < posAttr.count; i++) {
            const originalX = original[i * 3];
            const originalY = original[i * 3 + 1];
            const originalZ = original[i * 3 + 2];

            // Anchor scaling: Leftmost vertices (originalX near 0) should remain stationary on pole, 
            // while right vertices (originalX close to 6.2) wave in 3D space with full speed.
            const factor = originalX / 6.2;

            // Generate double-layered wavy noise propagation
            const primaryWave = Math.sin(originalX * frequency - elapsed * windSpd);
            const secondaryRipple = Math.cos(originalX * frequency * 2.3 + originalY * 1.6 - elapsed * windSpd * 1.9) * 0.30;
            
            // Translate coordinates to wave-distorted locations
            arr[i * 3 + 2] = originalZ + (primaryWave + secondaryRipple) * flagAmpZ * factor;
            arr[i * 3 + 1] = originalY + Math.sin(originalX * frequency * 1.6 - elapsed * windSpd * 1.5) * flagAmpY * factor;
          }
          posAttr.needsUpdate = true;
          mesh.geometry.computeVertexNormals();
        }

        // Camera target focus coordinates depending on active inspection mode
        const idealFocus = new THREE.Vector3();
        if (inspectModeRef.current === 'book') {
          // Centered precisely on the independent floating blue book in mid-air
          idealFocus.copy(bookGroup.position);
        } else {
          // Centered on the general boat decking hull
          idealFocus.set(0, 1.2, 0); 
          // @ts-ignore
          idealFocus.applyMatrix4(boatGroup.matrixWorld);
        }
        
        // Lerp cameraTarget smoothly towards the active focus point
        cameraTarget.current.lerp(idealFocus, 0.08);

        // Calculate cameras spherical coordinates relative to calculated focus target
        const r = zoomDistRef.current;
        const thetaOrbit = yawRef.current;
        const phiOrbit = pitchRef.current;

        // Dynamic spatial audio volume mapping based on proximity distance from boat
        let proximityMultiplier = 1.0;
        let radioMultiplier = 1.0;
        if (inspectModeRef.current === 'book') {
          // Book inspection mode distance ranges from 1.8 to 8.5
          proximityMultiplier = 0.9;
          radioMultiplier = 1.0;
        } else {
          // Boat mode distance ranges from 12 to 130
          // The ocean sound should be even from far, not only close to the boat.
          // Keep proximity multiplier high, tapering only down to 0.82 at maximum zoom out for grand atmosphere feel.
          if (r <= 15) {
            proximityMultiplier = 1.0;
            radioMultiplier = 1.0;
          } else {
            const ratio = Math.min(1.0, (r - 15) / (95 - 15));
            proximityMultiplier = 1.0 - (ratio * 0.18); // smoothly tape to exactly 0.82

            // Radio fades in when close (r <= 18) and fades out completely when far (r >= 55)
            if (r <= 18) {
              radioMultiplier = 1.0;
            } else if (r >= 55) {
              radioMultiplier = 0.0;
            } else {
              const radioRatio = (r - 18) / (55 - 18);
              radioMultiplier = 1.0 - radioRatio;
            }
          }
        }
        soundEngine.setProximityMultiplier(proximityMultiplier);
        soundEngine.setRadioProximityMultiplier(radioMultiplier);

        const targetPosition = new THREE.Vector3(
          cameraTarget.current.x + r * Math.sin(phiOrbit) * Math.sin(thetaOrbit),
          cameraTarget.current.y + r * Math.cos(phiOrbit),
          cameraTarget.current.z + r * Math.sin(phiOrbit) * Math.cos(thetaOrbit)
        );

        // Smoothly interpolate camera position and update facing vector
        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(cameraTarget.current);

        // update pmrem cycle triggers once during quick weather shifts to refresh reflection environments
        if (envMapNeedsUpdate || Math.abs(elapsed % 4) < 0.05) {
          try {
            const tempSkyScene = new THREE.Scene();
            tempSkyScene.add(sky);
            scene.environment = pmremGenerator.fromScene(tempSkyScene).texture;
            scene.add(sky); // Re-attach back to main scene
            envMapNeedsUpdate = false;
          } catch (e) {}
        }

        renderer.render(scene, camera);
        requestRef.current = requestAnimationFrame(animate);
      };

      // Bind non-passive wheel event to capture mouse-scrolling smoothly
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        
        // Define zoom stride based on active mode
        const stride = inspectModeRef.current === 'book' ? 0.22 : 1.8;
        let nextZoom = zoomDistRef.current + Math.sign(e.deltaY) * stride;

        // Apply mode-specific distance bounds and seamless transition
        if (inspectModeRef.current === 'book') {
          nextZoom = Math.max(1.8, Math.min(8.5, nextZoom));
          if (nextZoom > 8.0 && onInspectModeChangeRef.current) {
            onInspectModeChangeRef.current('boat');
          }
        } else {
          // Allow scrolling all the way close to see the book on deck!
          nextZoom = Math.max(1.8, Math.min(130, nextZoom));
          if (nextZoom < 10.0 && onInspectModeChangeRef.current) {
            onInspectModeChangeRef.current('book');
          }
        }
        zoomDistRef.current = nextZoom;
      };

      const container = mountRef.current;
      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false });
      }

      // Set trigger flag which will recalculate PMREM reflection mappings
      envMapNeedsUpdate = true;

      requestRef.current = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (container) {
          container.removeEventListener('wheel', handleWheel);
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        
        // Clean deep WebGL memory structures
        sky.geometry.dispose();
        sky.material.dispose();

        waterGeometry.dispose();
        water.material.dispose();

        deckGeo.dispose();
        deckMat.dispose();
        bowGeo.dispose();
        cabinGeo.dispose();
        cabinMat.dispose();
        beaconGeo.dispose();
        beaconMat.dispose();

        // Pedestal components and book
        pedestalBaseGeo.dispose();
        pedestalMat.dispose();
        pedRingGeo.dispose();
        pedRingMat.dispose();
        coverLeftGeo.dispose();
        coverRightGeo.dispose();
        coverMat.dispose();
        pageLeftGeo.dispose();
        pageRightGeo.dispose();
        pageMat.dispose();
        scriptMat.dispose();
        runeHaloGeo.dispose();
        runeHaloMat.dispose();

        rainGeo.dispose();
        rainMat.dispose();

        starGeo.dispose();
        starMat.dispose();

        // Cozy vintage lantern disposes
        latBaseGeo.dispose();
        latBrassMat.dispose();
        latGlassGeo.dispose();
        latGlassMat.dispose();
        latCapGeo.dispose();
        rodGeo.dispose();
        rodMat.dispose();
        wickGeo.dispose();
        wickMat.dispose();

        // Deck-crate cozy lantern disposes
        dLatBaseGeo?.dispose();
        dLatBrassMat?.dispose();
        dLatGlassGeo?.dispose();
        dLatGlassMat?.dispose();
        dLatCapGeo?.dispose();
        dWireGeo?.dispose();
        dWireMat?.dispose();
        dWickGeo?.dispose();
        dWickMat?.dispose();
        dHandleGeo?.dispose();
        dGlowGeo?.dispose();
        dGlowMat?.dispose();

        // Clean user GLTFs
        loadedBoatModel?.traverse((child: any) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });

        loadedBookModel?.traverse((child: any) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });

        pmremGenerator.dispose();
        renderer.dispose();
      };

    } catch (err: any) {
      console.error(err);
      onError(err?.message || 'WebGL initialize failed. Please make sure WebGL context and GPU resources are enabled in this view.');
    }
  }, []);

  return (
    <div 
      id="ocean-container" 
      ref={mountRef} 
      className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden select-none z-0"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={() => {
        if (inspectModeRef.current === 'book' && onInspectModeChange) {
          onInspectModeChange('boat');
        }
      }}
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    >
      <canvas id="ocean-canvas" ref={canvasRef} className="w-full h-full block" />
      
      {/* Visual Model Manifestation Progress Panel */}
      {(!modelsLoaded) && (
        <div id="relic-manifest-card" className="absolute top-6 left-6 z-40 bg-slate-950/90 border border-cyan-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-xl max-w-[320px] pointer-events-auto">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-sans tracking-[0.15em] text-cyan-200 uppercase font-semibold">
              Manifesting 3D Relics
            </span>
          </div>
          <div className="flex flex-col gap-3 mt-3 text-xs text-slate-300">
            <div>
              <div className="flex justify-between font-mono text-[11px] text-slate-400 mb-1">
                <span>wilo_intro_boat.glb</span>
                <span className="text-cyan-400 font-bold">{boatProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${boatProgress}%` }}
                ></div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400/90 italic leading-normal">
              Downloading high-fidelity textures and geometries into the browser pipeline.
            </p>
          </div>
        </div>
      )}

      {/* Invisible/Subtle Cinematic debug checklist in the corner */}
      <div id="system-debug-checklist" className="absolute bottom-5 right-5 font-mono text-[10px] text-white/40 tracking-wider flex flex-col gap-1 pointer-events-none text-right z-30">
        <div>THREE loaded</div>
        <div>Water loaded</div>
        <div>Sky loaded</div>
        {modelsLoaded && (
          <div className="text-cyan-300 font-semibold uppercase tracking-[0.1em] text-[8px] mt-0.5 animate-fade-in flex items-center gap-1 justify-end">
            <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
            Relics Active
          </div>
        )}
        <div className="flex items-center gap-1.5 justify-end">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
          <span>Renderer running</span>
        </div>
      </div>
    </div>
  );
};
