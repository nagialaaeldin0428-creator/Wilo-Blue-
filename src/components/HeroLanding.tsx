import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Compass, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CloudLightning, 
  Headphones, 
  Map, 
  BookOpen, 
  ArrowRight,
  Anchor,
  HelpCircle
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface HeroLandingProps {
  onEnter: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onEnter,
  isMuted,
  onToggleMute,
}) => {
  const [bubbleList, setBubbleList] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'simulation' | 'characters' | 'lore'>('simulation');

  // Generate pleasant decorative bubbles to drift up the screen
  useEffect(() => {
    const bubbles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      size: 3 + Math.random() * 8,
      duration: 10 + Math.random() * 20,
    }));
    setBubbleList(bubbles);
  }, []);

  const handleBeginOdyssey = async () => {
    // Attempt audio unlock cleanly
    try {
      if (isMuted) {
        await soundEngine.init();
        soundEngine.toggleMute(false);
        onToggleMute(); // synchronize mute toggle in parent
      }
    } catch (e) {
      console.warn("Audio Context unlock bypassed:", e);
    }
    onEnter();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-[14px] text-slate-100 p-6 md:p-12 select-none">
      
      {/* Decorative Drifting Bioluminescent Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {bubbleList.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ y: '110vh', x: `${bubble.x}vw`, opacity: 0.1 }}
            animate={{
              y: '-10vh',
              opacity: [0.1, 0.6, 0.1],
              x: [`${bubble.x}vw`, `${bubble.x + (Math.random() * 6 - 3)}vw`]
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute rounded-full bg-cyan-400/25 blur-[1px] shadow-[0_0_8px_rgba(34,211,238,0.2)]"
            style={{
              width: bubble.size,
              height: bubble.size,
            }}
          />
        ))}
      </div>

      {/* 1. HEADER BRANDING BAR */}
      <header className="w-full flex justify-between items-center z-10 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full border border-cyan-500/30 bg-slate-900/60 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              className="absolute inset-[-3px] rounded-full border border-dashed border-cyan-400/20"
            />
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg tracking-[0.25em] font-medium text-white">
              WILO <span className="text-cyan-400">BLUE</span>
            </span>
            <span className="text-[9px] text-cyan-400/60 font-mono tracking-widest uppercase">
              RESTORATION PROJECT
            </span>
          </div>
        </div>

        {/* Dynamic Spatial Sound Toggle */}
        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 group px-3 py-1.5 rounded-full border border-slate-800 bg-slate-950/40 hover:bg-slate-900/40 hover:border-cyan-500/30 transition-all duration-300 pointer-events-auto cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              <span className="text-[10px] text-slate-500 group-hover:text-cyan-200 transition-colors font-mono tracking-wider">SOUND MUTED</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-[10px] text-cyan-200 font-mono tracking-wider">AUDIO ACTIVE</span>
            </>
          )}
        </button>
      </header>

      {/* 2. CORE HERO EXPERIENCE SECTION */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-12 z-10">
        
        {/* Left Hand: Majestic Narrative Title */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          
          <div className="flex items-center gap-2 px-2.5 py-1 w-fit rounded-full bg-cyan-950/40 border border-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-cyan-300 font-mono tracking-wider uppercase font-medium">
              CRITICAL ACCLAIMED ENGINE v2.4
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight leading-[1.1] font-normal">
            The Ocean remembers <br />
            <span className="italic font-light bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
              what the wind has chosen
            </span> <br />
            to forget.
          </h2>

          <p className="text-base text-slate-300 font-sans max-w-xl leading-relaxed">
            Experience an interactive, real-time 3D marine simulation. Navigate the changing weather spectra, guide Wilo on an emotional quest for identity, and awaken ancient relics lost inside the deep blue.
          </p>

          {/* Interactive Cinematic CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mt-4">
            <button
              id="begin-odyssey-cta"
              onClick={handleBeginOdyssey}
              className="group relative flex items-center justify-center gap-3 px-8 py-4.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold tracking-[0.12em] text-xs uppercase cursor-pointer transition-all duration-300 hover:shadow-[0_0_35px_rgba(34,211,238,0.45)] select-none hover:scale-[1.03] active:scale-[0.98]"
            >
              <Anchor className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform duration-500" />
              <span>Begin Odyssey</span>
              <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1.5 transition-transform duration-300" />

              {/* Glowing decorative rings */}
              <span className="absolute inset-0 rounded-2xl ring-4 ring-cyan-500/10 group-hover:ring-cyan-400/25 transition-all duration-300"></span>
            </button>
            
            <a
              href="/story-site/index.html"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-slate-800 hover:border-slate-600 bg-slate-950/30 hover:bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-300 transition-colors cursor-pointer select-none"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Read Local Chronicles</span>
            </a>
          </div>

          {/* Spatial Audio Advisory */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/45 border border-slate-800/80 w-fit backdrop-blur-sm shadow-md">
            <Headphones className="w-4  h-4 text-cyan-500 shrink-0" />
            <span className="text-[11px] text-slate-400 leading-normal">
              Spatial audio engine active. Wearing <strong>headphones</strong> is highly recommended for full acoustic immersion.
            </span>
          </div>

        </div>

        {/* Right Hand: Feature Bento Showcases & Story Tabs */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Showcase Control Tabs */}
          <div className="flex w-full bg-slate-950/60 p-1 rounded-xl border border-slate-850/60 shadow-lg select-none">
            {(['simulation', 'characters', 'lore'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-slate-800 text-cyan-300 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative min-h-[290px] w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 backdrop-blur-md flex flex-col justify-between overflow-hidden shadow-2xl">
            
            {/* Background ambient circular overlay aura */}
            <div className="absolute -right-16 -bottom-16 w-44 h-44 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

            {activeTab === 'simulation' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cyan-400 font-mono tracking-widest uppercase font-semibold">3D OCEAN SIMULATION</span>
                  <Compass className="w-4 h-4 text-cyan-400/60" />
                </div>
                <h3 className="text-xl font-serif text-white font-medium">Spectral Wave Mechanics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Utilizes detailed heightmap Gerstner wave representations inside specialized Three.js glsl shaders. Wave heights, frequencies, colors, and storm winds dynamically scale as you cycle through diverse environments.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-left">
                    <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-mono">WATER DISPLACEMENT</span>
                    <span className="text-xs font-semibold text-cyan-300 font-mono">DYNAMIC GENERATION</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-left">
                    <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-mono">WEATHER STATES</span>
                    <span className="text-xs font-semibold text-cyan-300 font-mono">5 SPECTRUMS</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'characters' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cyan-400 font-mono tracking-widest uppercase font-semibold">MEET THE COMPANIONS</span>
                  <Sparkles className="w-4 h-4 text-cyan-400/60" />
                </div>
                <h3 className="text-xl font-serif text-white font-medium">Vector Memory Cards</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Discover the hand-crafted, beautifully designed aesthetic vector memory cards representating key ocean figures, fully integrated into the interactive navigation HUD.
                </p>
                <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1 no-scrollbar">
                  {['Wilo', 'Rose', 'Oli', 'Hakmoon', 'Orkanis'].map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-850/80 text-[10px] text-slate-300 font-mono tracking-wide"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'lore' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cyan-400 font-mono tracking-widest uppercase font-semibold">OCEANIC CHRONICLES</span>
                  <BookOpen className="w-4 h-4 text-cyan-400/60" />
                </div>
                <h3 className="text-xl font-serif text-white font-medium">The Power Plant Awakening</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dive deep into the written tales where Wilo learns to face the depths. Experience character interaction, environmental shifts, beautiful audio loops, and unlock hidden secrets in the main story archive.
                </p>
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850/60 text-left">
                  <span className="text-[9px] text-slate-500 font-mono block mb-1">CURRENT CHAPTERS</span>
                  <span className="text-xs font-semibold text-cyan-200">Chapter I: The Beacon of Lost Light</span>
                </div>
              </motion.div>
            )}

            {/* Quick telemetry footer of the frame */}
            <div className="border-t border-slate-800/40 pt-4 flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                SIMULATOR ONLINE
              </span>
              <span>GEO-REF: 24.8N, -78.1W</span>
            </div>

          </div>

        </div>

      </main>

      {/* 3. FOOTER SIGNALS */}
      <footer className="w-full flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-900/60 pt-6 z-10 select-none">
        <div className="text-[10px] font-mono text-slate-400 tracking-wider flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} WILOCOSM PROJECT.</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">ALL RELICS AWAKENED</span>
        </div>

        <div className="flex gap-4 items-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-cyan-950/30 border border-cyan-900/30 px-2.5 py-1 rounded">
            HTML5 WebGL Shading
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded">
            React 19 &amp; Vite
          </span>
        </div>
      </footer>

    </div>
  );
};
