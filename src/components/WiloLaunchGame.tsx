import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCcw, 
  Play, 
  Trophy, 
  Sparkles, 
  Compass, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Shield, 
  Zap, 
  Heart 
} from 'lucide-react';

// Web Audio synthesizer for self-contained high-fidelity sound effects
class GameAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  constructor() {
    // Lazy initialized
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Failed to initialize game audio synth", e);
    }
  }

  playPop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playStretching() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playLaunch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.35);
    
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playCrash(isHeavy = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    // Simulate explosion/crash noise using a quick brown-noise like filter and frequency drop
    const osc = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();
    
    osc.type = isHeavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isHeavy ? 180 : 250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + (isHeavy ? 0.45 : 0.25));
    
    noiseGain.gain.setValueAtTime(isHeavy ? 0.3 : 0.18, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + (isHeavy ? 0.45 : 0.25));
    
    osc.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + (isHeavy ? 0.46 : 0.26));
  }

  playAbility() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.25);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.25);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.26);
    osc2.stop(this.ctx.currentTime + 0.26);
  }

  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.36);
    });
  }

  playDefeat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [220.00, 196.00, 164.81]; // A3, G3, E3 sad arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.18);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + idx * 0.18);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.18 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.18);
      osc.stop(this.ctx.currentTime + idx * 0.18 + 0.32);
    });
  }
}

const audioService = new GameAudioSynth();

// Core Hero Configuration
interface HeroData {
  id: 'wilo' | 'rose' | 'oli';
  name: string;
  role: string;
  color: string;
  glowColor: string;
  icon: string;
  weight: number; // impact mass
  speed: number;
  specialName: string;
  specialDesc: string;
  specialIcon: React.ReactNode;
}

const HEROES: HeroData[] = [
  {
    id: 'wilo',
    name: 'Wilo',
    role: 'The Whale Hero',
    color: '#0ea5e9',
    glowColor: 'rgba(14,165,233,0.8)',
    icon: '🐳',
    weight: 1.0,
    speed: 1.0,
    specialName: 'Bubble Shield Split',
    specialDesc: 'Splits into three bouncy shockwave bubbles on-tap!',
    specialIcon: <Shield className="w-4 h-4" />
  },
  {
    id: 'rose',
    name: 'Rose',
    role: 'The Fearless Swordfish',
    color: '#f43f5e',
    glowColor: 'rgba(244,63,94,0.8)',
    icon: '🐠',
    weight: 0.8,
    speed: 1.7,
    specialName: 'Sonic Pierce',
    specialDesc: 'Triples speed mid-flight to break heavy oil drums!',
    specialIcon: <Zap className="w-4 h-4" />
  },
  {
    id: 'oli',
    name: 'Oli',
    role: 'The Sonic Shell',
    color: '#10b981',
    glowColor: 'rgba(16,185,129,0.8)',
    icon: '🐢',
    weight: 1.8,
    speed: 0.7,
    specialName: 'Heavy Shell Slam',
    specialDesc: 'Stops trajectory and slams strait down with high gravitational force!',
    specialIcon: <Trash2 className="w-4 h-4" />
  }
];

// Physical object elements
interface PhysObj {
  id: number;
  type: 'crate' | 'barrel' | 'stone' | 'sludge' | 'boss_net';
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number; // for circular barrels/sludges
  angle: number;
  vx: number;
  vy: number;
  elasticity: number;
  density: number;
  health: number;
  maxHealth: number;
  isStatic: boolean;
  color: string;
  label?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'bubble' | 'spark' | 'smoke' | 'star';
}

interface Slingshot {
  x: number;
  y: number;
  radius: number;
}

interface GameLevel {
  themeName: string;
  themeColor: string;
  bgGradients: string[];
  obstacles: Omit<PhysObj, 'vx' | 'vy' | 'angle'>[];
}

const LEVELS: GameLevel[] = [
  {
    themeName: 'Bright Sea Shallows',
    themeColor: 'from-cyan-900/60 via-slate-900 to-slate-950',
    bgGradients: ['#032640', '#010c1a'],
    obstacles: [
      { id: 101, type: 'crate', x: 550, y: 380, w: 45, h: 45, elasticity: 0.15, density: 1.2, health: 60, maxHealth: 60, isStatic: false, color: '#b45309' },
      { id: 102, type: 'crate', x: 550, y: 335, w: 40, h: 40, elasticity: 0.15, density: 1.2, health: 60, maxHealth: 60, isStatic: false, color: '#b45309' },
      { id: 103, type: 'crate', x: 620, y: 380, w: 45, h: 45, elasticity: 0.15, density: 1.2, health: 60, maxHealth: 60, isStatic: false, color: '#b45309' },
      { id: 104, type: 'crate', x: 620, y: 335, w: 40, h: 40, elasticity: 0.15, density: 1.2, health: 60, maxHealth: 60, isStatic: false, color: '#b45309' },
      // Support beam on top of crates
      { id: 105, type: 'stone', x: 585, y: 305, w: 120, h: 20, elasticity: 0.05, density: 2.5, health: 120, maxHealth: 120, isStatic: false, color: '#475569' },
      // Sludge monsters (Targets to pop!)
      { id: 106, type: 'sludge', x: 585, y: 275, w: 32, h: 32, r: 16, elasticity: 0.3, density: 1.0, health: 10, maxHealth: 10, isStatic: false, color: '#84cc16', label: '🤢' },
      { id: 107, type: 'sludge', x: 550, y: 412, w: 30, h: 30, r: 15, elasticity: 0.3, density: 1.0, health: 10, maxHealth: 10, isStatic: false, color: '#84cc16', label: '🤢' },
    ]
  },
  {
    themeName: 'Toxic Shipwreck Cave',
    themeColor: 'from-amber-950/40 via-slate-900 to-slate-950',
    bgGradients: ['#1c0c01', '#010811'],
    obstacles: [
      // Heavy metal barrels that can explode
      { id: 201, type: 'barrel', x: 540, y: 375, w: 45, h: 55, r: 22, elasticity: 0.2, density: 1.7, health: 90, maxHealth: 90, isStatic: false, color: '#ea580c' },
      { id: 202, type: 'barrel', x: 630, y: 375, w: 45, h: 55, r: 22, elasticity: 0.2, density: 1.7, health: 90, maxHealth: 90, isStatic: false, color: '#ea580c' },
      // Horizontal platform
      { id: 203, type: 'stone', x: 585, y: 340, w: 150, h: 18, elasticity: 0.05, density: 2.5, health: 140, maxHealth: 140, isStatic: false, color: '#475569' },
      // Crates on top
      { id: 204, type: 'crate', x: 545, y: 300, w: 40, h: 40, elasticity: 0.15, density: 1.2, health: 60, maxHealth: 60, isStatic: false, color: '#b45309' },
      { id: 205, type: 'crate', x: 625, y: 300, w: 40, h: 40, elasticity: 0.15, density: 1.2, health: 60, maxHealth: 60, isStatic: false, color: '#b45309' },
      // Target sludges
      { id: 206, type: 'sludge', x: 585, y: 305, w: 32, h: 32, r: 16, elasticity: 0.3, density: 1.0, health: 10, maxHealth: 10, isStatic: false, color: '#22c55e', label: '👾' },
      { id: 207, type: 'sludge', x: 545, y: 260, w: 30, h: 30, r: 15, elasticity: 0.3, density: 1.0, health: 10, maxHealth: 10, isStatic: false, color: '#22c55e', label: '👾' },
      { id: 208, type: 'sludge', x: 625, y: 260, w: 30, h: 30, r: 15, elasticity: 0.3, density: 1.0, health: 10, maxHealth: 10, isStatic: false, color: '#22c55e', label: '👾' },
    ]
  },
  {
    themeName: 'The Abyssal Factory Oil-Rig',
    themeColor: 'from-purple-950/40 via-zinc-950 to-slate-950',
    bgGradients: ['#13021f', '#01020d'],
    obstacles: [
      // Tall, complex scaffolding
      // Base pillars
      { id: 301, type: 'stone', x: 500, y: 360, w: 24, h: 90, elasticity: 0.05, density: 3.5, health: 180, maxHealth: 180, isStatic: false, color: '#334155' },
      { id: 302, type: 'stone', x: 580, y: 360, w: 24, h: 90, elasticity: 0.05, density: 3.5, health: 180, maxHealth: 180, isStatic: false, color: '#334155' },
      { id: 303, type: 'stone', x: 660, y: 360, w: 24, h: 90, elasticity: 0.05, density: 3.5, health: 180, maxHealth: 180, isStatic: false, color: '#334155' },
      // Floors
      { id: 304, type: 'stone', x: 580, y: 310, w: 200, h: 16, elasticity: 0.05, density: 3.0, health: 150, maxHealth: 150, isStatic: false, color: '#334155' },
      // Floor 2 barrels & crates
      { id: 305, type: 'crate', x: 530, y: 280, w: 35, h: 35, elasticity: 0.15, density: 1.2, health: 60, maxHealth: 60, isStatic: false, color: '#b45309' },
      { id: 306, type: 'barrel', x: 580, y: 275, w: 40, h: 50, r: 20, elasticity: 0.2, density: 1.7, health: 100, maxHealth: 100, isStatic: false, color: '#ea580c' },
      { id: 307, type: 'crate', x: 630, y: 280, w: 35, h: 35, elasticity: 0.15, density: 1.2, health: 60, maxHealth: 60, isStatic: false, color: '#b45309' },
      // Top platform
      { id: 308, type: 'stone', x: 580, y: 240, w: 140, h: 16, elasticity: 0.05, density: 3.0, health: 150, maxHealth: 150, isStatic: false, color: '#334155' },
      // Targets
      { id: 309, type: 'boss_net', x: 580, y: 200, w: 54, h: 54, r: 27, elasticity: 0.4, density: 2.2, health: 180, maxHealth: 180, isStatic: false, color: '#dc2626', label: '👹' },
      { id: 310, type: 'sludge', x: 500, y: 280, w: 26, h: 26, r: 13, elasticity: 0.3, density: 1.0, health: 10, maxHealth: 10, isStatic: false, color: '#c084fc', label: '🤢' },
      { id: 311, type: 'sludge', x: 660, y: 280, w: 26, h: 26, r: 13, elasticity: 0.3, density: 1.0, health: 10, maxHealth: 10, isStatic: false, color: '#c084fc', label: '🤢' },
    ]
  }
];

interface WiloLaunchGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WiloLaunchGame: React.FC<WiloLaunchGameProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [selectedHero, setSelectedHero] = useState<HeroData>(HEROES[0]);
  const [shotsRemaining, setShotsRemaining] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('wilo_launch_highscore') || '0', 10);
  });
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'ability_ready' | 'victory' | 'defeat'>('lobby');
  const [victoryStars, setVictoryStars] = useState<number>(0);

  // Slingshot variables
  const slingshot: Slingshot = { x: 160, y: 350, radius: 10 };
  
  // Drag physics states (storing on refs to decouple standard React renders from high-speed game clock)
  const dragRef = useRef({
    isDragging: false,
    x: slingshot.x,
    y: slingshot.y,
    startX: 0,
    startY: 0,
  });

  // Main flying ball/hero physical ref
  const ballRef = useRef({
    x: slingshot.x,
    y: slingshot.y,
    vx: 0,
    vy: 0,
    r: 16,
    isFlying: false,
    isLaunched: false,
    hasUsedSpecial: false,
    trail: [] as { x: number; y: number }[],
    cooldown: 0,
    activeHeroId: 'wilo' as 'wilo' | 'rose' | 'oli',
    splitBalls: [] as { x: number; y: number; vx: number; vy: number; r: number; active: boolean }[],
    launchTime: 0,
  });

  // Physical objects collection
  const objectsRef = useRef<PhysObj[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // High score synchronise local storage
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('wilo_launch_highscore', score.toString());
    }
  }, [score, highScore]);

  // Audio muting synchronization
  useEffect(() => {
    audioService.muted = soundMuted;
  }, [soundMuted]);

  // Launch a localized particle blow
  const createExplosion = (x: number, y: number, color: string, type: 'bubble' | 'spark' | 'smoke' | 'star' = 'spark', count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 5.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'bubble' ? 1.0 : 0.0), // bubbles float up
        size: type === 'bubble' ? 3 + Math.random() * 6 : 2 + Math.random() * 4,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: type === 'smoke' ? 40 + Math.random() * 30 : 20 + Math.random() * 20,
        type
      });
    }
  };

  // Sync Level obstacles data on select or reset
  const initLevel = (levelIdx: number) => {
    // Reset hero physical parameters
    ballRef.current = {
      x: slingshot.x,
      y: slingshot.y,
      vx: 0,
      vy: 0,
      r: 16,
      isFlying: false,
      isLaunched: false,
      hasUsedSpecial: false,
      trail: [],
      cooldown: 0,
      activeHeroId: selectedHero.id,
      splitBalls: [],
      launchTime: 0,
    };

    // Deep copy static levels obstacles template config
    const lvlTemplate = LEVELS[levelIdx];
    objectsRef.current = lvlTemplate.obstacles.map(o => ({
      ...o,
      vx: 0,
      vy: 0,
      angle: 0,
    }));

    particlesRef.current = [];
    setShotsRemaining(3);
    setScore(0);
    setGameState('playing');
    
    // Ambient sound trigger
    audioService.playPop();

    // Trigger floating ocean ambient bubbles initial injection
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: Math.random() * 800,
        y: Math.random() * 450 + 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.6,
        size: 1 + Math.random() * 4,
        color: 'rgba(125,214,245,0.4)',
        alpha: 0.3 + Math.random() * 0.5,
        life: 0,
        maxLife: 101,
        type: 'bubble'
      });
    }
  };

  // Handle mid-flight special ability tap
  const triggerSpecialAbility = () => {
    const ball = ballRef.current;
    if (!ball.isFlying || ball.hasUsedSpecial || (Date.now() - ball.launchTime < 150)) return;

    ball.hasUsedSpecial = true;
    audioService.playAbility();

    if (ball.activeHeroId === 'wilo') {
      // Whales split: spawn 2 sister bubble projectile nodes
      createExplosion(ball.x, ball.y, '#38bdf8', 'bubble', 20);
      ball.splitBalls = [
        { x: ball.x, y: ball.y - 12, vx: ball.vx * 1.1, vy: ball.vy - 2.5, r: 12, active: true },
        { x: ball.x, y: ball.y + 12, vx: ball.vx * 1.1, vy: ball.vy + 2.5, r: 12, active: true }
      ];
    } else if (ball.activeHeroId === 'rose') {
      // Swordfish thrust dash: amplify velocity immediately forwards!
      createExplosion(ball.x, ball.y, '#f43f5e', 'spark', 18);
      ball.vx *= 2.0;
      ball.vy *= 1.2;
    } else if (ball.activeHeroId === 'oli') {
      // Turtle Slam: Zero out forward drift, plummet with double gravity drop
      createExplosion(ball.x, ball.y, '#34d399', 'smoke', 15);
      ball.vx = 0.5; // very minor forward momentum
      ball.vy = 18.0; // major downwards smash force
    }
    
    setGameState('playing');
  };

  // Main Loop logic (Runs at ~60fps)
  useEffect(() => {
    if (!isOpen || gameState === 'lobby') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gravity = 0.28; // Water dampened gravity
    const fluidDamping = 0.992; // ocean water resistance factor

    const updatePhysics = () => {
      const ball = ballRef.current;
      const objs = objectsRef.current;

      // 1. Particle life cycles
      particlesRef.current = particlesRef.current.map(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
        if (p.type === 'bubble') {
          p.vy -= 0.005; // float acceleration
        }
        return p;
      }).filter(p => p.life < p.maxLife);

      // Spawn periodic background bubbles
      if (Math.random() < 0.12) {
        particlesRef.current.push({
          x: Math.random() * 800,
          y: 480,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.6 - Math.random() * 0.8,
          size: 1 + Math.random() * 3.5,
          color: 'rgba(125,214,245,0.25)',
          alpha: 0.3 + Math.random() * 0.4,
          life: 0,
          maxLife: 150 + Math.random() * 100,
          type: 'bubble'
        });
      }

      // 2. Playable Hero Physics
      if (ball.isFlying) {
        // Apply physics forces
        ball.vy += gravity * (ball.activeHeroId === 'oli' && ball.hasUsedSpecial ? 2.5 : 1.0);
        ball.vx *= fluidDamping;
        ball.vy *= fluidDamping;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Safety self-destruction backup for stuck states (8 seconds max flight duration)
        if (Date.now() - ball.launchTime > 8000) {
          triggerPostFlightResolution();
          return;
        }

        // Record flight trail path
        if (Math.random() < 0.35) {
          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 25) ball.trail.shift();
        }

        // Spawn dynamic bubble trail
        if (Math.random() < 0.45) {
          particlesRef.current.push({
            x: ball.x,
            y: ball.y,
            vx: -ball.vx * 0.2 + (Math.random() - 0.5) * 0.5,
            vy: -ball.vy * 0.2 + (Math.random() - 0.5) * 0.5,
            size: 2 + Math.random() * 4,
            color: selectedHero.color,
            alpha: 0.7,
            life: 0,
            maxLife: 20 + Math.random() * 15,
            type: 'bubble'
          });
        }

        // Split bubble clones physics tracking
        ball.splitBalls.forEach(sb => {
          if (!sb.active) return;
          sb.vy += gravity;
          sb.vx *= fluidDamping;
          sb.vy *= fluidDamping;
          sb.x += sb.vx;
          sb.y += sb.vy;

          // Boundary checks for split balls
          if (sb.x < 0 || sb.x > 800 || sb.y > 450) {
            sb.active = false;
          }
        });

        // Check floor/ceiling boundaries for main hero
        if (ball.y >= 450) {
          // Bottom collision cushion
          ball.y = 450;
          ball.vy = -ball.vy * 0.4; // heavy bounce loss
          ball.vx *= 0.8;
          if (Math.abs(ball.vx) < 0.2 && Math.abs(ball.vy) < 0.2) {
            triggerPostFlightResolution();
          }
        }
        if (ball.x > 820 || ball.x < -20) {
          triggerPostFlightResolution();
        }
      }

      // Collide Main Ball Hero with Physical obstacles
      if (ball.isFlying) {
        objs.forEach(o => {
          if (o.health <= 0) return;
          
          let hit = false;
          let normalX = 0;
          let normalY = 0;

          if (o.type === 'sludge' || o.type === 'barrel' || o.type === 'boss_net') {
            // Circle to Circle overlapping math
            const radius = o.r || 16;
            const dx = ball.x - o.x;
            const dy = ball.y - o.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = ball.r + radius;

            if (dist < minDist) {
              hit = true;
              normalX = dx / (dist || 1);
              normalY = dy / (dist || 1);
              
              // Resolve overlap position
              ball.x = o.x + normalX * minDist;
              ball.y = o.y + normalY * minDist;
            }
          } else {
            // Circle to Rectangle simple AABB intersection overlap math
            const halfW = o.w / 2;
            const halfH = o.h / 2;
            const closestX = Math.max(o.x - halfW, Math.min(ball.x, o.x + halfW));
            const closestY = Math.max(o.y - halfH, Math.min(ball.y, o.y + halfH));

            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < ball.r) {
              hit = true;
              normalX = dx / (dist || 1);
              normalY = dy / (dist || 1);

              // Push sphere out of bounds
              ball.x = closestX + normalX * ball.r;
              ball.y = closestY + normalY * ball.r;
            }
          }

          if (hit) {
            // Calculate absolute velocity speed delta
            const relativeVelX = ball.vx - o.vx;
            const relativeVelY = ball.vy - o.vy;
            const impulseStrength = Math.sqrt(relativeVelX * relativeVelX + relativeVelY * relativeVelY);
            
            // Apply impact smash damage
            const massMultiplier = selectedHero.weight;
            const damage = Math.floor(impulseStrength * 6.5 * massMultiplier);
            
            if (damage > 8) {
              o.health = Math.max(0, o.health - damage);
              setScore(prev => prev + Math.floor(damage * 1.5));
              
              // Dynamic bouncy deflection reflex
              const impulse = (impulseStrength * 0.35 + 0.5);
              ball.vx = normalX * impulse;
              ball.vy = normalY * impulse - 0.5; // lift spike

              audioService.playCrash(o.type === 'barrel' || o.type === 'boss_net');
              createExplosion(o.x, o.y, o.color, 'spark', 10);

              // Toxic drum chemical chain explosion!
              if (o.type === 'barrel' && o.health <= 0) {
                setScore(prev => prev + 120);
                createExplosion(o.x, o.y, '#ea580c', 'smoke', 25);
                triggerNeighborhoodBlast(o.id, o.x, o.y, 110);
              }
            }
          }
        });

        // Collide Split Bubble Clones with obstacles
        ball.splitBalls.forEach(sb => {
          if (!sb.active) return;
          objs.forEach(o => {
            if (o.health <= 0) return;
            // Simplified check
            const dx = sb.x - o.x;
            const dy = sb.y - o.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = o.r || (o.w / 2);
            if (dist < (sb.r + radius)) {
              o.health = Math.max(0, o.health - 40);
              setScore(prev => prev + 80);
              sb.active = false;
              createExplosion(sb.x, sb.y, '#38bdf8', 'bubble', 12);
              audioService.playCrash(false);

              if (o.type === 'barrel' && o.health <= 0) {
                setScore(prev => prev + 120);
                createExplosion(o.x, o.y, '#ea580c', 'smoke', 25);
                triggerNeighborhoodBlast(o.id, o.x, o.y, 110);
              }
            }
          });
        });
      }

      // 3. Falling obstacles physics (gravity and colliders simulation)
      objs.forEach(o => {
        if (o.health <= 0 || o.isStatic) return;

        // Apply friction and gravity simple translation
        o.vy += gravity * 0.6; // ocean submerged gravity
        o.vx *= 0.96;
        o.vy *= 0.96;

        o.x += o.vx;
        o.y += o.vy;

        // Ground bottom safety threshold
        const radius = o.r || (o.h / 2);
        if (o.y + radius >= 450) {
          o.y = 450 - radius;
          o.vy = -o.vy * 0.15; // mild bounce check
          o.vx *= 0.75; // high ground dirt friction
        }
      });

      // Target Sludges popped checks
      objs.forEach(o => {
        if ((o.type === 'sludge' || o.type === 'boss_net') && o.health > 0) {
          // If knocked down to the extreme edge, they die!
          if (o.y > 440) {
            o.health = 0;
            setScore(p => p + 300);
            createExplosion(o.x, o.y, o.color, 'bubble', 20);
            audioService.playVictory();
          }
        }
      });
    };

    // Oil barrel explosive splash radius
    const triggerNeighborhoodBlast = (originId: number, bx: number, by: number, radius: number) => {
      objectsRef.current.forEach(o => {
        if (o.id === originId || o.health <= 0) return;
        const dx = o.x - bx;
        const dy = o.y - by;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
          const blastMult = (1 - (dist / radius));
          const dmg = Math.floor(blastMult * 100);
          o.health = Math.max(0, o.health - dmg);
          
          // Propagate physics momentum push!
          const pushForce = blastMult * 6.5;
          const angle = Math.atan2(dy, dx);
          o.vx += Math.cos(angle) * pushForce;
          o.vy += Math.sin(angle) * pushForce - 1.5; // shock lift

          if (o.type === 'barrel' && o.health <= 0) {
            // Cascade reaction!
            createExplosion(o.x, o.y, '#ea580c', 'smoke', 20);
            setScore(p => p + 120);
          }
        }
      });
    };

    // Clean up flight state & launch next hero or declare win/loss
    const triggerPostFlightResolution = () => {
      const ball = ballRef.current;
      ball.isFlying = false;
      ball.vx = 0;
      ball.vy = 0;

      // Filter out completed/dead garbage targets
      const remainingTargets = objectsRef.current.filter(o => {
        return (o.type === 'sludge' || o.type === 'boss_net') && o.health > 0;
      });

      if (remainingTargets.length === 0) {
        // Level cleared victory!
        setTimeout(() => {
          setGameState('victory');
          audioService.playVictory();
          // Calculate star index based on shots saved
          const starsEarned = Math.min(3, Math.max(1, shotsRemaining));
          setVictoryStars(starsEarned);
        }, 1000);
        return;
      }

      if (shotsRemaining <= 1) {
        // Slingshot empty, did we crush everything?
        setTimeout(() => {
          const checkAgainTargets = objectsRef.current.filter(o => {
            return (o.type === 'sludge' || o.type === 'boss_net') && o.health > 0;
          });
          if (checkAgainTargets.length === 0) {
            setGameState('victory');
            setVictoryStars(1);
            audioService.playVictory();
          } else {
            setGameState('defeat');
            audioService.playDefeat();
          }
        }, 1500);
      } else {
        // Auto-rearm slingshot next turn
        setTimeout(() => {
          setShotsRemaining(prev => prev - 1);
          ball.x = slingshot.x;
          ball.y = slingshot.y;
          ball.isLaunched = false;
          ball.hasUsedSpecial = false;
          ball.trail = [];
          ball.splitBalls = [];
          setGameState('playing');
        }, 1000);
      }
    };

    // Drawing operations (Runs every loop ticket)
    const draw = () => {
      ctx.clearRect(0, 0, 800, 480);

      // A. Draw underwater backgrounds
      const grad = ctx.createLinearGradient(0, 0, 0, 480);
      const colors = LEVELS[currentLevelIdx].bgGradients;
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 480);

      // Floating dust rays
      ctx.fillStyle = 'rgba(125,214,245,0.03)';
      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(190, 0);
      ctx.lineTo(390, 480);
      ctx.lineTo(220, 480);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(420, 0);
      ctx.lineTo(540, 0);
      ctx.lineTo(690, 480);
      ctx.lineTo(500, 480);
      ctx.closePath();
      ctx.fill();

      // Floor ground dirt layer
      ctx.fillStyle = '#010c14';
      ctx.fillRect(0, 450, 800, 30);
      ctx.fillStyle = '#061c2c';
      ctx.fillRect(0, 450, 800, 3);

      // B. Render slingshot wood branches
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#0c4a6e';
      ctx.lineCap = 'round';
      
      // Slingshot frame
      ctx.beginPath();
      ctx.moveTo(slingshot.x - 12, slingshot.y + 10);
      ctx.quadraticCurveTo(slingshot.x - 10, slingshot.y + 40, slingshot.x, 450);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(slingshot.x + 12, slingshot.y + 10);
      ctx.quadraticCurveTo(slingshot.x + 10, slingshot.y + 40, slingshot.x, 450);
      ctx.stroke();

      // C. Draw elastic slingshot rubber lines on pull gesture
      const drag = dragRef.current;
      const ball = ballRef.current;

      const isAiming = drag.isDragging && !ball.isLaunched;

      if (isAiming) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#38bdf8';
        
        // Elastic band back chord
        ctx.beginPath();
        ctx.moveTo(slingshot.x - 12, slingshot.y + 4);
        ctx.lineTo(drag.x, drag.y);
        ctx.stroke();

        // Trajectory prediction dotted line (projectile equations projection)
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(125,214,245,0.45)';
        ctx.setLineDash([5, 8]);
        
        ctx.beginPath();
        let simX = drag.x;
        let simY = drag.y;
        const dx = slingshot.x - drag.x;
        const dy = slingshot.y - drag.y;
        let simVx = dx * 0.145 * selectedHero.speed;
        let simVy = dy * 0.145 * selectedHero.speed;
        
        ctx.moveTo(simX, simY);
        for (let i = 0; i < 30; i++) {
          simVy += gravity;
          simVx *= 0.992;
          simVy *= 0.992;
          simX += simVx;
          simY += simVy;
          ctx.lineTo(simX, simY);
          if (simY >= 450) break;
        }
        ctx.stroke();
        ctx.setLineDash([]); // clear dash
      }

      // D. Draw Particles
      particlesRef.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.type === 'bubble') {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.lineWidth = 1.0;
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.stroke();
        } else if (p.type === 'star') {
          // simple cross star
          ctx.fillRect(p.x - p.size, p.y - 1, p.size * 2, 2);
          ctx.fillRect(p.x - 1, p.y - p.size, 2, p.size * 2);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // E. Draw Launch trail path
      if (ball.trail.length > 1) {
        ctx.save();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = `${selectedHero.color}25`;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
        for (let i = 1; i < ball.trail.length; i++) {
          ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // F. Draw Physical obstacles
      objectsRef.current.forEach(o => {
        if (o.health <= 0) return;

        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.angle);

        // Core visual design depending on element type
        if (o.type === 'sludge' || o.type === 'boss_net') {
          // Circular floating pollutant/monster target!
          const r = o.r || 16;
          
          // Outer biohazard aura
          const auraGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.5);
          auraGrad.addColorStop(0, o.color);
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
          ctx.fill();

          // Main body glob
          ctx.fillStyle = o.color;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // Border shine
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Text labels for Cute eyes monster
          ctx.fillStyle = '#ffffff';
          ctx.font = `${r * 0.9}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(o.label || '🐳', 0, 1.5);

        } else if (o.type === 'barrel') {
          // Circular heavy drum
          const r = o.r || 20;

          const metalGrad = ctx.createLinearGradient(-r, -r, r, r);
          metalGrad.addColorStop(0, '#ea580c');
          metalGrad.addColorStop(0.5, '#f97316');
          metalGrad.addColorStop(1, '#9a3412');
          ctx.fillStyle = metalGrad;

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // Stripes for industrial look
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-r * 0.8, -r * 0.25);
          ctx.lineTo(r * 0.8, -r * 0.25);
          ctx.moveTo(-r * 0.8, r * 0.25);
          ctx.lineTo(r * 0.8, r * 0.25);
          ctx.stroke();

          // Alert marker exclamation
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px Helvetica';
          ctx.fillText('⚡', -6, 4);

        } else if (o.type === 'crate') {
          // Wooden standard box
          ctx.fillStyle = o.color;
          const w = o.w;
          const h = o.h;
          ctx.fillRect(-w/2, -h/2, w, h);
          
          // Inner diagonal plank
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(-w/2 + 2, -h/2 + 2, w - 4, h - 4);
          ctx.beginPath();
          ctx.moveTo(-w/2 + 3, -h/2 + 3);
          ctx.lineTo(w/2 - 3, h/2 - 3);
          ctx.stroke();

        } else {
          // Heavy Solid stone blocks
          ctx.fillStyle = o.color;
          const w = o.w;
          const h = o.h;
          ctx.fillRect(-w/2, -h/2, w, h);

          // Bevel border shine
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-w/2, -h/2, w, h);
        }

        // Object damage indicators (Cracks layer)
        if (o.health < o.maxHealth * 0.65) {
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const rSize = (o.w || o.r || 10) * 0.4;
          ctx.moveTo(-rSize, -rSize);
          ctx.lineTo(0, 0);
          ctx.lineTo(rSize, -rSize * 0.5);
          ctx.moveTo(0, 0);
          ctx.lineTo(-rSize * 0.25, rSize * 0.6);
          ctx.stroke();
        }

        ctx.restore();
      });

      // G. Draw elastic slingshot front band overlay
      if (isAiming) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(slingshot.x + 12, slingshot.y + 4);
        ctx.lineTo(drag.x, drag.y);
        ctx.stroke();
      }

      // H. Draw Main Ball Hero
      if (!ball.isLaunched || ball.isFlying) {
        ctx.save();
        ctx.translate(ball.x, ball.y);
        
        // Inner ocean creature hero glow
        ctx.shadowBlur = 18;
        ctx.shadowColor = selectedHero.glowColor;

        // Draw body circle
        ctx.fillStyle = selectedHero.color;
        ctx.beginPath();
        ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
        ctx.fill();

        // Shiny reflections
        ctx.shadowBlur = 0; // clear glow for details
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-ball.r * 0.35, -ball.r * 0.35, ball.r * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Eye emoji representation
        ctx.fillStyle = '#000000';
        ctx.font = `${ball.r * 1.1}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(selectedHero.icon, 0.5, 0.5);

        ctx.restore();

        // Draw Split Bubble Clones
        ball.splitBalls.forEach(sb => {
          if (!sb.active) return;
          ctx.save();
          ctx.translate(sb.x, sb.y);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, sb.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.stroke();
          ctx.fillStyle = '#000000';
          ctx.font = '12px Arial';
          ctx.fillText('🫧', -6, 4);
          ctx.restore();
        });
      }

      // Trigger Loop recursive callback
      updatePhysics();
      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isOpen, gameState, currentLevelIdx, selectedHero]);

  // Handle slinging inputs
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Tap-anywhere mid-flight special power handler
    if (ballRef.current.isFlying) {
      if (!ballRef.current.hasUsedSpecial && Date.now() - ballRef.current.launchTime > 150) {
        triggerSpecialAbility();
        if (e.cancelable) {
          e.preventDefault();
        }
      }
      return;
    }

    if (gameState !== 'playing' || ballRef.current.isLaunched) return;

    // Standardize page coords with coordinate system
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Resolve touch vs click
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = 800 / rect.width;
    const scaleY = 480 / rect.height;
    
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    // Check click proximity radius close to slingshot anchor point
    const dx = clickX - slingshot.x;
    const dy = clickY - slingshot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 42) {
      dragRef.current = {
        isDragging: true,
        x: clickX,
        y: clickY,
        startX: clickX,
        startY: clickY,
      };
      audioService.playStretching();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.isDragging || ballRef.current.isLaunched) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = 800 / rect.width;
    const scaleY = 480 / rect.height;

    const moveX = (clientX - rect.left) * scaleX;
    const moveY = (clientY - rect.top) * scaleY;

    // Restrict maximum drag elastic radius (so rubber bands don't stretch forever!)
    const dx = moveX - slingshot.x;
    const dy = moveY - slingshot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxPull = 94;

    if (dist > maxPull) {
      const angle = Math.atan2(dy, dx);
      drag.x = slingshot.x + Math.cos(angle) * maxPull;
      drag.y = slingshot.y + Math.sin(angle) * maxPull;
    } else {
      drag.x = moveX;
      drag.y = moveY;
    }

    // Follow main hero ball position with elastic finger drag anchor
    ballRef.current.x = drag.x;
    ballRef.current.y = drag.y;

    // Micro buzz tension sound
    if (Math.random() < 0.15) {
      audioService.playStretching();
    }
  };

  const handleMouseUp = () => {
    const drag = dragRef.current;
    const ball = ballRef.current;
    if (!drag.isDragging || ball.isLaunched) return;

    drag.isDragging = false;

    // Calculate reverse elastic impulse force vector
    const dx = slingshot.x - drag.x;
    const dy = slingshot.y - drag.y;
    const pullSpeed = Math.sqrt(dx * dx + dy * dy);

    if (pullSpeed > 8) {
      // Slingshot forward launch!
      ball.isLaunched = true;
      ball.isFlying = true;
      ball.launchTime = Date.now();
      
      // Calculate launching speed constant
      const launchFactor = 0.145 * selectedHero.speed;
      ball.vx = dx * launchFactor;
      ball.vy = dy * launchFactor;

      setGameState('ability_ready'); // Trigger special active mid-air prompt
      audioService.playLaunch();
    } else {
      // Snapped back softly without launching
      ball.x = slingshot.x;
      ball.y = slingshot.y;
    }
  };

  // Skip, upgrade and proceed actions
  const selectNextLevel = () => {
    const nextIdx = (currentLevelIdx + 1) % LEVELS.length;
    setCurrentLevelIdx(nextIdx);
    initLevel(nextIdx);
  };

  const currentLevel = LEVELS[currentLevelIdx];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="wilo-launch-game-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4 md:p-6 select-none font-sans"
        >
          
          {/* Main layout card wrapper */}
          <motion.div
            id="launch-game-frame"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="relative w-full max-w-[880px] bg-slate-900 border border-cyan-500/20 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.1)] flex flex-col"
          >
            
            {/* 1. Header Toolbar */}
            <div id="game-header" className="flex items-center justify-between p-5 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center p-2 rounded-xl bg-cyan-950/50 border border-cyan-400/30">
                  <Compass className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-serif tracking-[0.16em] uppercase font-bold text-white flex gap-1.5 items-center">
                    WILO LAUNCH:
                    <span className="text-cyan-400 font-sans tracking-wide">OCEAN DEFENDER</span>
                  </h3>
                  <div className="text-[10px] text-slate-400 tracking-wider">
                    KNOCK DOWN TALL POLLUTION STRUCTURES & TOXIC DRUMS!
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  id="btn-game-mute"
                  onClick={() => setSoundMuted(!soundMuted)}
                  className="p-2.5 rounded-xl border border-white/5 hover:border-cyan-500/30 bg-white/[0.02] text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
                  title={soundMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
                >
                  {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  id="btn-game-close"
                  onClick={onClose}
                  className="p-2.5 rounded-xl border border-white/5 hover:border-red-500/30 bg-white/[0.02] text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                  title="Exit Game"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Main interactive viewport */}
            <div id="game-main-panels" className="relative flex-grow min-h-[300px] md:min-h-[440px] bg-slate-950 flex flex-col md:flex-row items-stretch">
              
              {/* Left Side Lobby/Configs Panel */}
              {gameState === 'lobby' && (
                <div id="game-lobby-panel" className="w-full md:w-80 border-r border-white/5 p-6 flex flex-col justify-between bg-slate-900/60">
                  <div>
                    <h4 className="text-xs font-serif tracking-widest text-cyan-400 uppercase font-bold mb-4">
                      1. SELECT OCEAN hero
                    </h4>
                    
                    <div className="flex flex-col gap-3 mb-6">
                      {HEROES.map(h => (
                        <div
                          key={h.id}
                          onClick={() => {
                            setSelectedHero(h);
                            audioService.playPop();
                          }}
                          className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                            selectedHero.id === h.id
                              ? 'bg-cyan-500/10 border-cyan-400/40 text-white'
                              : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform">
                              {h.icon}
                            </span>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-bold tracking-wide">{h.name}</span>
                              <span className="text-[10px] text-slate-400">{h.role}</span>
                            </div>
                          </div>
                          
                          <div className="text-[10px] font-mono flex flex-col gap-0.5 text-right">
                            <span className="text-cyan-400 font-bold">Mass: {h.weight}X</span>
                            <span className="text-amber-400 font-bold">Launch: {h.speed}X</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1.5 text-xs text-amber-300 font-bold tracking-wider uppercase">
                        {selectedHero.specialIcon}
                        <span>{selectedHero.specialName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 text-left leading-relaxed">
                        {selectedHero.specialDesc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      id="btn-lobby-start"
                      onClick={() => initLevel(currentLevelIdx)}
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl tracking-[0.2em] uppercase text-xs shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
                    >
                      <Play className="w-4 h-4 text-slate-950 stroke-[3px]" />
                      <span>Start Defense</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Gameplay Canvas area */}
              {gameState !== 'lobby' && (
                <div id="gameplay-area" className="flex-grow relative flex flex-col bg-slate-950">
                  
                  {/* Overlay telemetries banner */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-10">
                    {/* Live score */}
                    <div className="bg-slate-950/80 border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-3 backdrop-blur-md">
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] text-slate-500 tracking-wider font-mono">LIVE SCORE</span>
                        <span className="text-xs font-mono font-bold text-cyan-300">{score}</span>
                      </div>
                      <div className="h-5 w-[1px] bg-white/10" />
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] text-slate-500 tracking-wider font-mono">LEVEL RECORD</span>
                        <span className="text-xs font-mono font-bold text-slate-400">{highScore}</span>
                      </div>
                    </div>

                    {/* Ammo shots left bubble */}
                    <div className="bg-slate-950/80 border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-1.5 backdrop-blur-md">
                      <span className="text-[10px] font-sans font-semibold tracking-wider text-slate-300 uppercase">Shots:</span>
                      <div className="flex gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-xs border ${
                              i < shotsRemaining
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse'
                                : 'bg-slate-950 border-white/10 text-slate-600'
                            }`}
                          >
                            🐋
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* HTML5 Physics Canvas */}
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={480}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    className="w-full h-auto aspect-[5/3] bg-slate-950 block cursor-crosshair max-w-full"
                  />

                  {/* Mid flight active Tap button overlay */}
                  {gameState === 'ability_ready' && !ballRef.current.hasUsedSpecial && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                      <button
                        id="btn-activate-special"
                        onClick={triggerSpecialAbility}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer active:scale-95 border border-amber-400 animate-bounce"
                      >
                        {selectedHero.specialIcon}
                        <span>TAP MID-FLIGHT FOR SPECIAL POWER!</span>
                      </button>
                    </div>
                  )}

                  {/* Aiming/launch assist instruction guide */}
                  {!ballRef.current.isLaunched && (
                    <div className="absolute bottom-5 left-5 text-[10px] text-slate-400 font-mono tracking-wider bg-slate-950/70 border border-white/5 rounded-xl px-3 py-1.5 pointer-events-none">
                      🐳 CLICK & DRAG WILO DOWN/LEFT, THEN RELEASE TO LAUNCH!
                    </div>
                  )}
                </div>
              )}

              {/* Lobby Overview placeholder if not playing */}
              {gameState === 'lobby' && (
                <div id="game-lobby-artwork-panel" className="flex-grow flex flex-col justify-between p-8 items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/5 rounded-full blur-[80px]" />
                  
                  {/* Level selector tab strip */}
                  <div className="w-full flex justify-center gap-2 z-10">
                    {LEVELS.map((level, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentLevelIdx(idx);
                          audioService.playPop();
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-sans font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                          currentLevelIdx === idx
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                            : 'bg-white/[0.01] border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Abyss Level {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Level artwork & description card */}
                  <div className="z-10 flex flex-col items-center max-w-sm text-center">
                    <span className="text-4xl filter drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] mb-4 animate-bounce">
                      🦀🗑️🏭
                    </span>
                    <h4 className="text-lg font-serif font-bold text-white tracking-wide mb-2 uppercase">
                      Level {currentLevelIdx + 1}: {currentLevel.themeName}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sling your deep-sea ocean guardians into towers built of heavy trash containers, toxic oil drums, and plastic scaffolding. Popping the poison sludge monsters cleanses the water!
                    </p>
                  </div>

                  {/* Best record */}
                  <div className="z-10 text-[11px] text-slate-500 tracking-wider flex items-center gap-1.5 font-mono">
                    <Trophy className="w-4.5 h-4.5 text-amber-500" />
                    <span>RECORD HIGHSCORE:</span>
                    <strong className="text-slate-300 font-bold">{highScore}PTS</strong>
                  </div>
                </div>
              )}

              {/* End Screen Panels */}
              {(gameState === 'victory' || gameState === 'defeat') && (
                <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                  >
                    {/* Splash spotlight circles */}
                    <div className={`absolute -right-16 -top-16 w-32 h-32 rounded-full blur-2xl ${gameState === 'victory' ? 'bg-cyan-500/15' : 'bg-red-500/15'}`} />

                    <div className="flex justify-center mb-6">
                      {gameState === 'victory' ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 bg-cyan-950/80 border border-cyan-400/40 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-950">
                            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                          </div>
                          
                          {/* Animated Stars */}
                          <div className="flex gap-1.5 mt-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Trophy
                                key={i}
                                className={`w-6 h-6 ${
                                  i < victoryStars ? 'text-amber-400 stroke-[2.5px] scale-110 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-red-950/85 border border-red-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-red-950">
                          <RotateCcw className="w-7 h-7 text-red-400 animate-spin" style={{ animationDuration: '4s' }} />
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-serif text-white uppercase font-bold tracking-wider mb-2">
                      {gameState === 'victory' ? 'OCEAN LEVEL SECURED!' : 'SLINGS BANDS EMPTY!'}
                    </h3>
                    <p className="text-xs text-slate-400 px-6 leading-relaxed mb-6">
                      {gameState === 'victory'
                        ? `Magnificent effort! You have collapsed the chemical pipeline networks to protect the whale migratory paths.`
                        : `The toxic sludge structures survived. Reorganise your ocean heroes and try again!`}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-8 bg-slate-950/50 border border-white/5 rounded-2xl p-4">
                      <div className="flex flex-col text-left pl-3 py-1">
                        <span className="text-[10px] text-slate-500 font-mono tracking-wider">LEVEL SCORE</span>
                        <strong className="text-lg font-mono text-cyan-300 font-bold">{score}PTS</strong>
                      </div>
                      <div className="flex flex-col text-left pl-3 py-1 border-l border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono tracking-wider">ALLTIME BEST</span>
                        <strong className="text-lg font-mono text-slate-300 font-bold">{highScore}PTS</strong>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 justify-center">
                      <button
                        id="btn-game-tryagain"
                        onClick={() => initLevel(currentLevelIdx)}
                        className="flex items-center gap-2 px-5 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer active:scale-95 transition-all shadow-[0_4px_16px_rgba(6,182,212,0.3)]"
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[3px]" />
                        <span>RETRY OCEAN</span>
                      </button>

                      {gameState === 'victory' && currentLevelIdx < LEVELS.length - 1 ? (
                        <button
                          id="btn-game-nextlevel"
                          onClick={selectNextLevel}
                          className="flex items-center gap-2 px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer active:scale-95 transition-all shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
                        >
                          <Play className="w-3.5 h-3.5 stroke-[3px]" />
                          <span>NEXT PATH</span>
                        </button>
                      ) : (
                        <button
                          id="btn-game-exitlobby"
                          onClick={() => setGameState('lobby')}
                          className="px-5 py-3.5 border border-white/10 hover:border-white/20 text-slate-300 rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                        >
                          Lobby menu
                        </button>
                      )}
                    </div>

                  </motion.div>
                </div>
              )}

            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
