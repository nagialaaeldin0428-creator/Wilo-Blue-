import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  X, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  List,
  Compass,
  Volume2,
  VolumeX,
  Droplet
} from 'lucide-react';
import { WILO_STORY, StoryChapter } from '../data/story';

interface StoryReaderProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sea bubbles interface
interface SeaBubble {
  id: number;
  x: number; // percent left
  y: number; // start offset
  size: number; // diameter in pixels
  speed: number; // upward progress rate
  swayFreq: number; // sway sine frequency
  swayAmp: number; // pixel sway range
}

export const StoryReader: React.FC<StoryReaderProps> = ({ isOpen, onClose }) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [showIndex, setShowIndex] = useState<boolean>(false);
  const [readProgress, setReadProgress] = useState<number[]>([]);
  const [bubbles, setBubbles] = useState<SeaBubble[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Generate original bubbles
  useEffect(() => {
    if (isOpen) {
      const initialBubbles: SeaBubble[] = Array.from({ length: 18 }, (_, idx) => ({
        id: idx,
        x: Math.random() * 100,
        y: 100 + Math.random() * 40,
        size: 5 + Math.random() * 18,
        speed: 0.15 + Math.random() * 0.25,
        swayFreq: 0.8 + Math.random() * 1.5,
        swayAmp: 10 + Math.random() * 20
      }));
      setBubbles(initialBubbles);
    }
  }, [isOpen]);

  // Persistent loop audio element for soundtrack
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!backgroundAudioRef.current) {
        backgroundAudioRef.current = new Audio('/radio.mp3');
        backgroundAudioRef.current.loop = true;
        backgroundAudioRef.current.volume = 0.35; // soft atmospheric ambient volume
      }
      if (soundEnabled) {
        backgroundAudioRef.current.play().catch(e => {
          console.warn('Autoplay blocked initially, will resume on click:', e);
        });
      } else {
        backgroundAudioRef.current.pause();
      }
    } else {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
    };
  }, [isOpen, soundEnabled]);

  // Keep updating bubble motion frames (simple loop)
  useEffect(() => {
    if (!isOpen || bubbles.length === 0) return;

    let frameId: number;
    const updateBubbles = () => {
      setBubbles(prev => 
        prev.map(b => {
          let nextY = b.y - b.speed;
          // Recycle when rising off the screen
          if (nextY < -10) {
            return {
              ...b,
              x: Math.random() * 100,
              y: 110,
              size: 5 + Math.random() * 18,
              speed: 0.15 + Math.random() * 0.25
            };
          }
          return { ...b, y: nextY };
        })
      );
      frameId = requestAnimationFrame(updateBubbles);
    };

    frameId = requestAnimationFrame(updateBubbles);
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, bubbles.length]);

  // Track progress of completed chapters
  useEffect(() => {
    if (isOpen) {
      if (!readProgress.includes(currentChapterIndex)) {
        setReadProgress(prev => [...prev, currentChapterIndex]);
      }
    }
  }, [currentChapterIndex, isOpen]);

  // Self-contained high fidelity synthesizer for sound feedback
  const playSynthesizedSound = (type: 'bubble' | 'page' | 'complete') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const t = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.12, t);
      master.connect(ctx.destination);

      if (type === 'bubble') {
        // High frequency pitch sweep upward with quick exponential decay
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(master);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(1400, t + 0.08);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        osc.start(t);
        osc.stop(t + 0.09);
      } else if (type === 'page') {
        // Beautiful soft water whoosh using lowpass sweep
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(master);

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(110, t);
        osc1.frequency.linearRampToValueAtTime(160, t + 0.2);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(220, t);
        osc2.frequency.exponentialRampToValueAtTime(320, t + 0.3);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc1.start(t);
        osc1.stop(t + 0.35);
        osc2.start(t);
        osc2.stop(t + 0.35);
      } else if (type === 'complete') {
        // Pentatonic magical underwater scale chime
        const frequencies = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // G4, A4, C5, D5, E5, G5
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(master);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.07);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.25, t + idx * 0.07 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.5);

          osc.start(t + idx * 0.07);
          osc.stop(t + idx * 0.07 + 0.6);
        });
      }
    } catch (e) {
      console.warn("Synthesizer bypassed:", e);
    }
  };

  const activeChapter = WILO_STORY[currentChapterIndex] || WILO_STORY[0];

  const handleNext = () => {
    if (currentChapterIndex < WILO_STORY.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
      playSynthesizedSound('page');
    }
  };

  const handlePrev = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
      playSynthesizedSound('page');
    }
  };

  const handleBubbleInteraction = (id: number) => {
    playSynthesizedSound('bubble');
    // Pop animation triggers visual pop sequence by moving y out of frame quickly
    setBubbles(prev => 
      prev.map(b => b.id === id ? { ...b, y: -20, size: b.size * 1.5 } : b)
    );
  };

  // Get dynamic ocean properties for each specific chapter setup
  const getChapterTheme = (id: number) => {
    switch (id) {
      case 1:
        return {
          title: "The Lost Ripple",
          glowColor: "shadow-[0_0_50px_rgba(14,165,233,0.3)] border-sky-500/20",
          accentText: "text-sky-400",
          accentBg: "bg-sky-500/10 border-sky-500/30",
          buttonBg: "from-sky-600 to-sky-400 hover:from-sky-500 hover:to-sky-300",
          skyGlow: "from-sky-500/10 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-sky-950/80 via-slate-900/90 to-blue-950/90",
          characters: ['wilo'],
          quote: "His mother guided him... showing him coral gardens and glowing schools of fish."
        };
      case 2:
        return {
          title: "Echoes of the Deep",
          glowColor: "shadow-[0_0_50px_rgba(20,184,166,0.3)] border-teal-500/20",
          accentText: "text-teal-400",
          accentBg: "bg-teal-500/10 border-teal-500/30",
          buttonBg: "from-teal-600 to-teal-400 hover:from-teal-500 hover:to-teal-300",
          skyGlow: "from-teal-500/10 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-teal-950/70 via-slate-900/95 to-slate-950/95",
          characters: ['wilo', 'rose', 'oli'],
          quote: "The Murmuring Reef does not whisper lies. It whispers what is already true inside you."
        };
      case 3:
        return {
          title: "Into the Breathless Pit",
          glowColor: "shadow-[0_0_50px_rgba(99,102,241,0.25)] border-indigo-500/15",
          accentText: "text-indigo-400",
          accentBg: "bg-indigo-500/10 border-indigo-500/20",
          buttonBg: "from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300",
          skyGlow: "from-indigo-500/5 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-indigo-950/60 via-slate-950 to-neutral-950/95",
          characters: ['wilo', 'rose', 'oli'],
          quote: "He leaves spiral marks burned in stone. He is already ahead."
        };
      case 4:
        return {
          title: "Orkanis Strikes",
          glowColor: "shadow-[0_0_50px_rgba(239,68,68,0.25)] border-red-500/20",
          accentText: "text-rose-400",
          accentBg: "bg-red-500/10 border-red-500/20",
          buttonBg: "from-red-600 to-rose-400 hover:from-red-500 hover:to-rose-300",
          skyGlow: "from-red-500/10 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-red-950/40 via-slate-950 to-slate-950",
          characters: ['wilo', 'rose'],
          quote: "Nothing grows in the Black Bloom - not because the darkness is empty, but because it is full."
        };
      case 5:
        return {
          title: "Beneath the Forgotten Waves",
          glowColor: "shadow-[0_0_50px_rgba(16,185,129,0.3)] border-emerald-500/20",
          accentText: "text-emerald-400",
          accentBg: "bg-emerald-500/10 border-emerald-500/30",
          buttonBg: "from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300",
          skyGlow: "from-emerald-500/10 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-emerald-950/60 via-slate-900/90 to-cyan-950/80",
          characters: ['wilo', 'oli'],
          quote: "To pass, the ocean asks for truth. One you've never told."
        };
      case 6:
        return {
          title: "The Eye of the Abyss",
          glowColor: "shadow-[0_0_50px_rgba(236,72,153,0.3)] border-pink-500/20",
          accentText: "text-pink-400",
          accentBg: "bg-pink-500/10 border-pink-500/30",
          buttonBg: "from-pink-600 to-pink-400 hover:from-pink-500 hover:to-pink-300",
          skyGlow: "from-pink-500/10 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-purple-950/70 via-slate-950 to-black",
          characters: ['wilo', 'rose', 'oli'],
          quote: "Believe? I survived the silence. I thrived in it."
        };
      case 7:
        return {
          title: "The Map of Light",
          glowColor: "shadow-[0_0_50px_rgba(6,182,212,0.35)] border-cyan-500/25",
          accentText: "text-cyan-400",
          accentBg: "bg-cyan-500/10 border-cyan-500/35",
          buttonBg: "from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300",
          skyGlow: "from-cyan-500/15 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-cyan-950/70 via-slate-900/90 to-blue-950/90",
          characters: ['wilo', 'rose', 'oli'],
          quote: "The Coral Tree grew from the first creature that ever looked at the vast sea and wondered."
        };
      case 8:
        return {
          title: "The First Guardian",
          glowColor: "shadow-[0_0_50px_rgba(168,85,247,0.3)] border-purple-500/20",
          accentText: "text-purple-400",
          accentBg: "bg-purple-500/10 border-purple-500/30",
          buttonBg: "from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300",
          skyGlow: "from-purple-500/10 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-purple-950/50 via-slate-900/95 to-slate-950",
          characters: ['wilo'],
          quote: "What did you leave behind to be here? The ocean asks this of those seeking the gift."
        };
      case 9:
        return {
          title: "The Second Guardian",
          glowColor: "shadow-[0_0_50px_rgba(14,165,233,0.35)] border-sky-500/20",
          accentText: "text-sky-300",
          accentBg: "bg-sky-500/15 border-sky-500/30",
          buttonBg: "from-sky-600 to-sky-400 hover:from-sky-500 hover:to-sky-300",
          skyGlow: "from-sky-400/15 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-sky-950/60 via-slate-900/95 to-slate-950",
          characters: ['oli'],
          quote: "I'm not the fastest. I'm not the bravest. But I showed up. Every time."
        };
      case 10:
        return {
          title: "The Third Guardian",
          glowColor: "shadow-[0_0_50px_rgba(139,92,246,0.35)] border-violet-500/25",
          accentText: "text-violet-400",
          accentBg: "bg-violet-500/10 border-violet-500/35",
          buttonBg: "from-violet-600 to-violet-400 hover:from-violet-500 hover:to-violet-300",
          skyGlow: "from-violet-500/15 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-violet-950/60 via-slate-900/95 to-slate-950/95",
          characters: ['rose'],
          quote: "The third Guardian does not judge what you are. It shows you what you could be."
        };
      case 11:
        return {
          title: "The Race to the Plant",
          glowColor: "shadow-[0_0_50px_rgba(245,158,11,0.3)] border-amber-500/20",
          accentText: "text-amber-400",
          accentBg: "bg-amber-500/10 border-amber-500/30",
          buttonBg: "from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300",
          skyGlow: "from-amber-500/15 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-amber-950/50 via-slate-900/90 to-emerald-950/70",
          characters: ['wilo', 'rose', 'oli'],
          quote: "The corridor was built by the ocean for this moment. For these three."
        };
      case 12:
        return {
          title: "What the Ocean Chose",
          glowColor: "shadow-[0_0_55px_rgba(34,211,238,0.35)] border-cyan-400/30",
          accentText: "text-cyan-300",
          accentBg: "bg-cyan-500/15 border-cyan-500/40",
          buttonBg: "from-cyan-500 to-amber-400 hover:from-cyan-400 hover:to-amber-300 text-slate-950",
          skyGlow: "from-cyan-400/25 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-sky-950/80 via-amber-950/40 to-slate-950",
          characters: ['wilo', 'rose', 'oli'],
          quote: "The light that poured from the Plant was not an explosion. It was a release."
        };
      case 13:
        return {
          title: "The Surface",
          glowColor: "shadow-[0_0_60px_rgba(249,115,22,0.4)] border-amber-500/30",
          accentText: "text-amber-400",
          accentBg: "bg-amber-500/15 border-amber-500/40",
          buttonBg: "from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950",
          skyGlow: "from-amber-500/30 via-orange-500/10 to-transparent",
          waterColor: "bg-gradient-to-b from-amber-950/60 via-sky-950/50 to-slate-950/90",
          characters: ['wilo', 'rose', 'oli'],
          quote: "The ocean does not set you free. You set yourself free - and the ocean watches."
        };
      default:
        return {
          title: "The Lost Ripple",
          glowColor: "shadow-[0_0_50px_rgba(14,165,233,0.3)] border-sky-500/20",
          accentText: "text-sky-400",
          accentBg: "bg-sky-500/10 border-sky-500/30",
          buttonBg: "from-sky-600 to-sky-400 hover:from-sky-500 hover:to-sky-300",
          skyGlow: "from-sky-500/10 via-transparent to-transparent",
          waterColor: "bg-gradient-to-b from-slate-950 to-blue-950/40",
          characters: ['wilo'],
          quote: "Searching for home."
        };
    }
  };

  const theme = getChapterTheme(activeChapter.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          id="story-immersion-container" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-8 bg-slate-950/90 backdrop-blur-xl pointer-events-auto select-text overflow-hidden"
        >
        {/* Dynamic Sea Rays floating background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-1/4 left-1/4 right-1/4 h-[80%] rounded-full bg-radial-gradient ${theme.skyGlow} mix-blend-screen opacity-70 blur-3xl`} />
          
          {/* Animated Sunlight Water Caustics */}
          <svg className="absolute inset-0 w-full h-full opacity-15 mix-blend-color-dodge" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="caustics" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path 
              d="M0,40 Q25,60 50,45 T100,50 L100,100 L0,100 Z" 
              fill="url(#caustics)"
              animate={{
                d: [
                  "M0,40 Q25,60 50,45 T100,50 L100,100 L0,100 Z",
                  "M0,45 Q30,40 60,52 T100,42 L100,100 L0,100 Z",
                  "M0,40 Q25,60 50,45 T100,50 L100,100 L0,100 Z"
                ]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </svg>

          {/* Floating Underwater Dust/Plankton */}
          <div className="absolute inset-0">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-cyan-400/40"
                style={{
                  left: `${10 + (i * 7.5)}%`,
                  top: `${20 + (Math.sin(i) * 30)}%`,
                }}
                animate={{
                  y: [0, -40, 0],
                  x: [0, 15, 0],
                  opacity: [0.1, 0.7, 0.1],
                }}
                transition={{
                  duration: 6 + (i % 5) * 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4
                }}
              />
            ))}
          </div>

          {/* Interactive Sea Bubbles Overlay */}
          {bubbles.map(b => {
            const swayValue = Math.sin((b.y / 100) * b.swayFreq * Math.PI) * b.swayAmp;
            return (
              <div
                key={b.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBubbleInteraction(b.id);
                }}
                onMouseEnter={() => handleBubbleInteraction(b.id)}
                className="absolute text-cyan-300 cursor-pointer pointer-events-auto rounded-full border border-white/20 transition-all active:scale-75"
                style={{
                  width: `${b.size}px`,
                  height: `${b.size}px`,
                  left: `${b.x}%`,
                  bottom: `${b.y}%`,
                  transform: `translateX(${swayValue}px)`,
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(34,211,238,0.1) 60%, rgba(34,211,238,0.02) 100%)',
                  boxShadow: '0 0 6px rgba(103,232,249,0.2), inset -1px -1px 3px rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(1px)',
                  transition: 'opacity 0.2s',
                  zIndex: 25
                }}
                title="Pop me!"
              />
            );
          })}
        </div>

        {/* Outer Container with Marine Border ornamentation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 220, filter: "blur(24px) brightness(0.1)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px) brightness(1)" }}
          exit={{ opacity: 0, scale: 0.82, y: 150, filter: "blur(20px) brightness(0.2)" }}
          transition={{ 
            type: "spring", 
            stiffness: 45, 
            damping: 16, 
            mass: 1.2 
          }}
          className={`relative w-full max-w-5xl h-[92vh] md:h-[84vh] ${theme.waterColor} border border-white/10 rounded-[2.5rem] ${theme.glowColor} flex flex-col overflow-hidden transition-all duration-700 pointer-events-auto select-none`}
        >
          {/* Top marine brass navigation track */}
          <div className="w-full h-1 bg-gradient-to-r from-cyan-600/20 via-cyan-400/70 to-blue-600/20 shrink-0" />

          {/* READER HEADERBAR */}
          <motion.header 
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.35, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/5 bg-slate-950/60 backdrop-blur-md select-none shrink-0 z-30"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative w-8.5 h-8.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                <Compass className="w-4 h-4 animate-spin-slow text-cyan-300" />
                <span className="absolute -inset-1 rounded-xl bg-cyan-300/10 blur animate-pulse" />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] tracking-[0.2em] font-sans font-bold uppercase ${theme.accentText}`}>
                    WILOCOSM OCEAN CHRONICLE
                  </span>
                  <Droplet className="w-2.5 h-2.5 text-cyan-400/70 hidden sm:block animate-bounce" />
                </div>
                <span className="text-[11px] text-white/50 font-serif tracking-wider hidden sm:block">
                  Thirteen depths of the lost power plant
                </span>
              </div>
            </div>

            {/* Chapters Progress Pill */}
            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 text-xs font-mono select-none">
              <span className={`${theme.accentText} font-bold`}>CHAPTER {activeChapter.id}</span>
              <span className="text-white/10">|</span>
              <span className="text-slate-400 uppercase tracking-widest text-[10px]">Depth {activeChapter.id} of 13</span>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {/* Synthesized Audio Sound Toggle */}
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) {
                    playSynthesizedSound('bubble');
                  }
                }}
                className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
                  soundEnabled 
                    ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300' 
                    : 'border-white/5 bg-white/[0.02] text-slate-500'
                }`}
                title={soundEnabled ? "Mute aquatic chime pops" : "Enable aquatic chime pops"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Show Index Checklist */}
              <button 
                onClick={() => {
                  setShowIndex(!showIndex);
                  playSynthesizedSound('page');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs tracking-wider uppercase font-medium transition-all duration-300 cursor-pointer ${
                  showIndex 
                    ? 'border-cyan-400/40 bg-cyan-400/20 text-cyan-300' 
                    : 'border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/15'
                }`}
                title="Table of Chapters"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[9px] font-bold">LogBook</span>
              </button>

              {/* Exit/Close Cross */}
              <button
                onClick={() => {
                  playSynthesizedSound('page');
                  onClose();
                }}
                className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-300 cursor-pointer active:scale-95"
                title="Return to Ocean ketch"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.header>

          {/* MAIN INTERNAL DISPLAY */}
          <div className="relative flex flex-1 overflow-hidden">
            
            {/* 1. TABLE OF CHAPTERS SIDEBAR */}
            <AnimatePresence>
              {showIndex && (
                <motion.div
                  initial={{ x: -280, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -280, opacity: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                  className="absolute left-0 top-0 bottom-0 w-72 z-30 bg-slate-950/95 border-r border-cyan-500/15 p-5 flex flex-col justify-between select-none shadow-[24px_0_40px_rgba(0,0,0,0.7)]"
                >
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[82%] pr-2">
                    <div className="flex items-center justify-between pl-1">
                      <h4 className="text-[10px] tracking-[0.25em] font-sans font-black uppercase text-cyan-400/80">
                        OCEAN CHRONOLOGY
                      </h4>
                      <Compass className="w-3 h-3 text-cyan-400/60 animate-spin-slow" />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      {WILO_STORY.map((ch, idx) => {
                        const isRead = readProgress.includes(idx);
                        const isActive = idx === currentChapterIndex;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => {
                              setCurrentChapterIndex(idx);
                              setShowIndex(false);
                              playSynthesizedSound('complete');
                            }}
                            className={`flex items-start gap-3 p-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                              isActive
                                ? 'bg-cyan-500/10 border-cyan-500/25 text-white'
                                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100 hover:bg-cyan-500/5'
                            }`}
                          >
                            <span className={`font-mono text-[9px] py-0.5 px-1.5 rounded-md ${
                              isActive ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-white/5 text-slate-400'
                            }`}>
                              {ch.id.toString().padStart(2, '0')}
                            </span>
                            
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-serif font-medium truncate tracking-wide text-cyan-100">{ch.title}</span>
                              <span className="text-[9px] text-slate-500 truncate mt-0.5">{ch.subtitle}</span>
                            </div>

                            {/* Dot indicator */}
                            {isRead && !isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 shrink-0 self-center ml-auto" title="Read Progress" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progressive indicator */}
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1.5 text-center mt-3 shrink-0">
                    <span className="text-[9px] text-slate-400/80 font-sans tracking-widest uppercase">
                      Ascended Deep: {readProgress.length}/13
                    </span>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                        style={{ width: `${(readProgress.length / 13) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. CORE READING PAGE CONTAINER */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-10 md:px-14 flex justify-center bg-slate-900/10 select-text relative z-10 scrollbar-thin">
              <div className="max-w-2xl w-full flex flex-col justify-between min-h-full">
                
                {/* Active Pages block */}
                <motion.article
                  key={currentChapterIndex}
                  initial={{ opacity: 0, y: 40, filter: "blur(12px) brightness(0.5)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px) brightness(1)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                  transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col select-text"
                >
                  <div className="flex items-center gap-3.5 mb-6 select-none">
                    <span className={`text-[10px] font-sans font-bold uppercase py-1 px-3 rounded-full ${theme.accentBg} ${theme.accentText} tracking-widest`}>
                      DEPTH SECTION {activeChapter.id}
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
                  </div>

                  <h2 className="text-2xl sm:text-3.5xl md:text-4xl font-serif text-white tracking-wide font-normal mb-1 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-snug">
                    {activeChapter.title}
                  </h2>
                  <p className={`text-xs sm:text-sm font-serif italic ${theme.accentText} opacity-85 tracking-wide mb-6 pl-1`}>
                    {activeChapter.subtitle}
                  </p>

                  {/* Poetic Highlight Quote card from selection */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-8 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-400/10 relative overflow-hidden select-none"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-400/40" />
                    <span className="text-[10px] font-mono tracking-widest text-cyan-400/70 block uppercase mb-1">MEMORANDUM CURRENT</span>
                    <p className="text-xs sm:text-sm italic font-serif text-cyan-200/90 leading-relaxed">
                      "{theme.quote}"
                    </p>
                  </motion.div>

                  <div className="flex flex-col gap-6 sm:gap-7 font-serif text-slate-100 md:text-lg leading-relaxed tracking-wide pl-1 select-text">
                    {activeChapter.content.map((p, pIdx) => {
                      if (pIdx === 0) {
                        // First letter drop cap shaped elegantly
                        const firstChar = p.charAt(0);
                        const restOfText = p.slice(1);
                        return (
                          <p key={pIdx} className="first-letter:float-left first-letter:text-5xl md:first-letter:text-6xl first-letter:font-serif first-letter:mr-3.5 first-letter:mt-1.5 first-letter:text-cyan-400 first-letter:font-black first-letter:drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] leading-relaxed text-slate-200">
                            {p}
                          </p>
                        );
                      }
                      return (
                        <p key={pIdx} className="indent-4 sm:indent-6 text-slate-200">
                          {p}
                        </p>
                      );
                    })}
                  </div>
                </motion.article>

                {/* Chapter Characters Focus Indicator Card */}
                <div className="mt-12 p-4.5 rounded-2xl bg-cyan-950/15 border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 select-none">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">ACTIVE FIN SPECIES:</span>
                    <div className="flex gap-1.5">
                      {theme.characters.includes('wilo') && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-sans font-bold uppercase bg-blue-500/10 border border-blue-500/30 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                          🐋 Wilo
                        </span>
                      )}
                      {theme.characters.includes('rose') && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-sans font-bold uppercase bg-pink-500/10 border border-pink-500/30 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                          🌸 Rose
                        </span>
                      )}
                      {theme.characters.includes('oli') && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-sans font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          🐢 Oli
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400/80 font-sans tracking-wide">
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>Click or hover floating bubbles to pop them!</span>
                  </div>
                </div>

                {/* Page Footnotes */}
                <div className="mt-8 pt-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs text-slate-500 font-serif select-none gap-2.5 pb-2">
                  <span>Wilocosm Depths Chronicle • Marine Chapter {activeChapter.id}</span>
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-500/50 animate-spin-slow" />
                    <span>Submerged in the Deep Power Plant Map</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* READER FOOTER PANEL (Navigation controls) */}
          <motion.footer 
            initial={{ opacity: 0, y: 35, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.42, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="px-4 sm:px-6 py-4.5 border-t border-white/5 bg-slate-950/75 backdrop-blur-md flex items-center justify-between select-none shrink-0 z-30"
          >
            {/* Prev button */}
            <button
              onClick={handlePrev}
              disabled={currentChapterIndex === 0}
              className={`flex items-center gap-2 px-3.5 sm:px-4.5 py-2.5 rounded-xl border text-[11px] uppercase tracking-wider font-bold transition-all duration-300 cursor-pointer ${
                currentChapterIndex === 0
                  ? 'border-white/2 bg-white/[0.01] text-slate-700 cursor-not-allowed'
                  : 'bg-white/[0.02] border-white/5 text-slate-300 hover:border-cyan-500/20 hover:text-cyan-300 hover:bg-cyan-500/5 active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Pagination numbers indicator */}
            <div className="text-xs font-mono text-slate-400 tracking-widest">
              <span className="text-white font-black">{currentChapterIndex + 1}</span>
              <span className="text-white/20 px-2">/</span>
              <span className="text-slate-500 font-bold">13</span>
            </div>

            {/* Next or Finish button */}
            {currentChapterIndex === WILO_STORY.length - 1 ? (
              <button
                onClick={() => {
                  playSynthesizedSound('complete');
                  onClose();
                }}
                className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${theme.buttonBg} text-slate-950 rounded-xl text-xs uppercase tracking-widest font-black font-sans shadow-lg transition-all duration-300 active:scale-95 cursor-pointer`}
              >
                <span>Ascend to Sky</span>
                <Sparkles className="w-4 h-4 animate-bounce" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-3.5 sm:px-4.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-slate-300 hover:border-cyan-500/20 hover:text-cyan-300 hover:bg-cyan-500/5 transition-all duration-300 cursor-pointer active:scale-95"
              >
                <span>Deepen</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.footer>

        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
