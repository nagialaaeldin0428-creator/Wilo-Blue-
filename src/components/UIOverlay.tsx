import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Play,
  CloudLightning,
  Headphones,
  Sunrise,
  Sun,
  Cloud,
  Moon,
  BookOpen,
  Instagram,
  Sparkles,
  Sliders,
  X
} from 'lucide-react';
import { WeatherMode } from '../types';
import { soundEngine } from '../utils/audio';
import { CompassHUD } from './CompassHUD';
import { Card } from './Card';

interface UIOverlayProps {
  weatherMode: WeatherMode;
  onWeatherChange: (mode: WeatherMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isStormActive: boolean;
  onToggleStorm: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onEnterApp: () => void;
  inspectMode: 'boat' | 'book';
  onInspectModeChange: (mode: 'boat' | 'book') => void;
  onOpenStory?: () => void;
  isStoryOpen?: boolean;
  onOpenGame?: () => void;
}

interface SubtitleSegment {
  text: string;
  start: number;
  end: number;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  weatherMode,
  onWeatherChange,
  isMuted,
  onToggleMute,
  isStormActive,
  onToggleStorm,
  isFullscreen,
  onToggleFullscreen,
  onOpenStory,
  isStoryOpen = false,
  inspectMode,
  onInspectModeChange,
  onOpenGame,
}) => {
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([
    { text: "The ocean does not tell its secrets", start: 0.0, end: 3.4 },
    { text: "to everyone.", start: 3.4, end: 4.5 },
    { text: "It waits.", start: 4.6, end: 5.5 },
    { text: "It listens.", start: 6.3, end: 7.4 },
    { text: "And when the world grows quiet enough,", start: 8.7, end: 11.0 },
    { text: "it begins to speak.", start: 12.0, end: 13.5 },
    { text: "Long before Wylo opened his eyes,", start: 15.6, end: 17.6 },
    { text: "before the currents carried his name,", start: 18.2, end: 20.2 },
    { text: "before the sea knew the path he would follow,", start: 21.0, end: 23.9 },
    { text: "there was a story hidden beneath the waves.", start: 24.5, end: 27.2 },
    { text: "A story of loss,", start: 28.5, end: 29.8 },
    { text: "of friendship,", start: 30.6, end: 31.5 },
    { text: "of courage,", start: 32.3, end: 33.3 },
    { text: "and of a light that no darkness could ever extinguish.", start: 34.3, end: 38.3 },
    { text: "So breathe slowly,", start: 40.0, end: 41.2 },
    { text: "listen closely.", start: 42.4, end: 43.6 },
    { text: "The ocean is calling.", start: 44.9, end: 46.7 },
    { text: "And somewhere beyond the horizon,", start: 48.4, end: 50.3 },
    { text: "where the sea remembers every story it has ever carried", start: 50.8, end: 54.9 },
    { text: "and every dream it has ever touched,", start: 55.4, end: 57.7 },
    { text: "a young whale named Wylo is waiting.", start: 58.9, end: 61.4 },
    { text: "Waiting to discover who he is,", start: 62.6, end: 64.9 },
    { text: "waiting to discover where he belongs,", start: 65.6, end: 68.3 },
    { text: "and perhaps,", start: 70.0, end: 71.4 },
    { text: "waiting for you.", start: 72.1, end: 73.1 },
    { text: "His journey is about to begin.", start: 74.9, end: 77.7 }
  ]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(false);
  
  // Weather Auto-Cycle state
  const [isAutoCycle, setIsAutoCycle] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(20); // 20-seconds dynamic auto-cycle
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  
  // Real-time nautical coordinates that fluctuate beautifully to represent sea waves
  const [coordinates, setCoordinates] = useState({ lat: '24°50\'12.4" N', lon: '78°11\'45.2" W' });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate micro wave motion fluctuations
      const latSec = (12.1 + Math.random() * 0.9).toFixed(1);
      const lonSec = (44.9 + Math.random() * 0.9).toFixed(1);
      setCoordinates({
        lat: `24°50'${latSec}"N`,
        lon: `78°11'${lonSec}"W`
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getSpectrumLabel = (mode: WeatherMode) => {
    switch (mode) {
      case 'dawn':
        return 'AURORA SPECTRUM';
      case 'day':
        return 'SOLAR SPECTRUM';
      case 'cloudy':
        return 'MIST SPECTRUM';
      case 'night':
        return 'COSMIC SPECTRUM';
      case 'storm':
        return 'TEMPEST SPECTRUM';
      default:
        return 'OCEAN SPECTRUM';
    }
  };

  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const rAFRef = useRef<number | null>(null);

  // 1. Fetch dynamic subtitles on mount
  useEffect(() => {
    fetch('/api/subtitles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubtitles(data);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch subtitles from server, fallback subtitles will be used.", err);
      });
  }, []);

  // Weather Automatic random rotation interval
  useEffect(() => {
    if (!isAutoCycle || isStoryOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoCycle, isStoryOpen]);

  // Handle auto-cycle rotation when countdown reaches 0 safely
  useEffect(() => {
    if (isAutoCycle && !isStoryOpen && timeLeft <= 0) {
      const modes: WeatherMode[] = ['dawn', 'day', 'cloudy', 'night', 'storm'];
      const otherModes = modes.filter(m => m !== weatherMode);
      const randomMode = otherModes[Math.floor(Math.random() * otherModes.length)];
      onWeatherChange(randomMode);
      setTimeLeft(20); // reset clock safely
    }
  }, [timeLeft, isAutoCycle, isStoryOpen, weatherMode, onWeatherChange]);

  const handleManualWeatherChange = (mode: WeatherMode) => {
    onWeatherChange(mode);
    setTimeLeft(20); // reset clock for manual adjustments
  };

  // 2. Play intro audio and monitor timing for exact subtitle synchronization
  const playIntro = () => {
    if (isIntroPlaying) {
      // Loop replay or stop
      if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current.currentTime = 0;
      }
      setIsIntroPlaying(false);
      setCurrentSubtitle('');
      soundEngine.setProximityMultiplier(1.0); // restore ambient volumes immediately
      return;
    }

    // Lower ambient environment volume automatically (fades to 10% volume) so the user hears speech clearly!
    soundEngine.setProximityMultiplier(0.1);

    if (!introAudioRef.current) {
      const audio = new Audio('/intro speech.mp3');
      introAudioRef.current = audio;

      audio.onended = () => {
        setIsIntroPlaying(false);
        setCurrentSubtitle('');
        soundEngine.setProximityMultiplier(1.0); // restore ambient on end
      };
    }

    // Playback reset and trigger
    introAudioRef.current.currentTime = 0;
    introAudioRef.current.play()
      .then(() => {
        setIsIntroPlaying(true);
      })
      .catch((err) => {
        console.warn("Audio Context playback failed or blocked. Simulating subtitles visually.", err);
        // Fallback simulation so user still gets full visual narrative even if tab is muted/blocked
        setIsIntroPlaying(true);
        simulateVisualSubtitles();
      });
  };

  // Simulates subtitle track timings if Audio Context fails, keeping user experience perfect
  const simulateVisualSubtitles = () => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 0.1;
      const active = subtitles.find(s => elapsed >= s.start && elapsed <= s.end);
      if (active) {
        setCurrentSubtitle(active.text);
      } else {
        setCurrentSubtitle('');
      }

      // Automatically complete once we pass the list's last duration point (~35s)
      const maxDuration = subtitles.length > 0 ? subtitles[subtitles.length - 1].end : 35;
      if (elapsed >= maxDuration) {
        clearInterval(interval);
        setIsIntroPlaying(false);
        setCurrentSubtitle('');
        soundEngine.setProximityMultiplier(1.0);
      }
    }, 100);

    // Safeguard to stop interval if user toggles/pauses
    const checkStop = setInterval(() => {
      if (!isIntroPlaying) {
        clearInterval(interval);
        clearInterval(checkStop);
      }
    }, 200);
  };

  // 3. Keep subtitles precisely in sync with Audio element time cycles (using high-speed animation ticks)
  useEffect(() => {
    if (!isIntroPlaying || !introAudioRef.current) {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      return;
    }

    const syncSubtitles = () => {
      if (introAudioRef.current) {
        const time = introAudioRef.current.currentTime;
        const active = subtitles.find(s => time >= s.start && time <= s.end);
        if (active) {
          setCurrentSubtitle(active.text);
        } else {
          setCurrentSubtitle('');
        }
      }
      rAFRef.current = requestAnimationFrame(syncSubtitles);
    };

    rAFRef.current = requestAnimationFrame(syncSubtitles);

    return () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, [isIntroPlaying, subtitles]);

  // Clean unmount instances
  useEffect(() => {
    return () => {
      if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current = null;
      }
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, []);

  return (
    <div id="ui-layout-overlay" className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none select-none">
      
      {/* NAUTICAL INSTRUMENT CLUSTER (Compass & Vessel Coordinates) */}
      <CompassHUD weatherMode={weatherMode} isStormActive={isStormActive} />

      {/* 1. TOP BAR */}
      <motion.header 
        initial={{ opacity: 0, y: -45, scale: 0.95, filter: "blur(10px) brightness(0.4)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px) brightness(1)" }}
        transition={{ delay: 0.2, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        id="app-header" 
        className="w-full flex justify-between items-center pointer-events-auto animate-ocean-sway"
      >
        {/* Wilo Blue Branding Logo with advanced aesthetic micro-interactions */}
        <div id="wilo-blue-logo-group" className="flex items-center gap-4 group cursor-pointer">
          {/* Astrolabe navigational circle complex */}
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-slate-950/65 backdrop-blur-md shadow-[0_4px_24px_rgba(34,211,238,0.06)] group-hover:border-cyan-400/40 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all duration-700 select-none">
            
            {/* Outer dynamic astrolabe compass dial permanently rotating backwards */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute inset-[-4px] rounded-full border border-dashed border-cyan-500/20 pointer-events-none opacity-60 group-hover:opacity-100 group-hover:scale-105 group-hover:border-cyan-450/40 transition-all duration-700"
            />
            
            {/* Inner steady compass rose with beautiful hover rotation spin */}
            <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-[360deg] transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] z-10" />
            
            {/* Soft inner core pulsing beacon */}
            <span className="absolute w-2 h-2 rounded-full bg-cyan-400/30 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-750 pointer-events-none"></span>
            
            {/* Flare glow layer */}
            <span className="absolute -inset-0.5 rounded-full bg-cyan-400/10 blur opacity-0 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"></span>
          </div>

          {/* Typography cluster and telemetry data tracking */}
          <div className="flex flex-col select-none">
            <h1 className="text-xl md:text-2xl font-serif tracking-[0.24em] text-white font-semibold transition-all duration-500 group-hover:tracking-[0.3em] group-hover:text-cyan-100 flex items-center">
              WILO
              <span className="text-cyan-400 font-serif drop-shadow-[0_0_8px_rgba(34,211,238,0.35)] group-hover:text-cyan-300 transition-all duration-500 ml-0.5">
                BLUE
              </span>
            </h1>
            
            {/* Telemetry metadata subbar */}
            <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
              <span className="text-[8px] tracking-[0.3em] text-cyan-400/80 uppercase font-medium transition-colors duration-500 group-hover:text-cyan-300">
                {getSpectrumLabel(weatherMode)}
              </span>
              <span className="h-1 w-1 rounded-full bg-cyan-500/40 group-hover:bg-cyan-400 group-hover:scale-115 transition-transform duration-500 animate-pulse" />
              <span className="text-[7.5px] font-mono tracking-widest text-slate-400/60 group-hover:text-slate-350 transition-colors duration-500">
                {coordinates.lat} / {coordinates.lon}
              </span>
            </div>

            {/* Glowing accent visual divider beneath title */}
            <div className="h-[1px] w-0 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent group-hover:w-full transition-all duration-1000 ease-out mt-1" />
          </div>
        </div>

        {/* Global Toolbar (Sound, Instagram & Fullscreen Buttons) */}
        <div id="app-toolbar" className="flex items-center gap-3">
          {/* Audio Mute Trigger */}
          <button
            id="btn-sound-toggle"
            onClick={onToggleMute}
            className={`group relative flex items-center justify-center w-11 h-11 rounded-2xl border backdrop-blur-md transition-all duration-500 cursor-pointer ${
              isMuted 
                ? 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-slate-600/50 hover:text-slate-200' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.25),_inset_0_1px_1px_rgba(255,255,255,0.2)]'
            } active:scale-95 active:translate-y-0.5`}
            title={isMuted ? "Unmute Ambient Sound" : "Mute Ambient Sound"}
          >
            {isMuted ? (
              <VolumeX className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <div className="relative">
                <Volume2 className="w-4.5 h-4.5 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              </div>
            )}
          </button>

          {/* Instagram Button (Wilo.blue - Great-ape-33 theme) */}
          <a
            id="btn-instagram-link"
            href="https://www.instagram.com/wilo.blue"
            target="_blank"
            rel="noopener noreferrer"
            className="wilo-instagram-btn pointer-events-auto"
            title="Follow Wilo.blue on Instagram"
          >
            <span className="wilo-instagram-svg-container">
              <Instagram className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110" />
            </span>
            <span className="wilo-instagram-bg"></span>
          </a>

          {/* Fullscreen Trigger */}
          <button
            id="btn-fullscreen-toggle"
            onClick={onToggleFullscreen}
            className="group relative flex items-center justify-center w-11 h-11 rounded-2xl border border-white/5 bg-slate-950/40 text-slate-300 backdrop-blur-md transition-all duration-500 cursor-pointer hover:border-cyan-500/50 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.15),_inset_0_1px_1px_rgba(255,255,255,0.15)] active:scale-95 active:translate-y-0.5"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <Maximize2 className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110" />
            )}
          </button>
        </div>
      </motion.header>

      {/* WEATHER SPECTRUM FLOATING VERTICAL DOCK (Right Side, Slim Vertical Line, No Outer Frame) */}
      <motion.div 
        initial={{ opacity: 0, y: 150, x: 30, scale: 0.85, filter: "blur(14px) brightness(0.3)" }}
        animate={{ opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px) brightness(1)" }}
        transition={{ delay: 0.4, type: "spring", stiffness: 35, damping: 14, mass: 1.1 }}
        id="weather-floating-dock" 
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-4 md:right-6 pointer-events-auto z-30 flex-col items-center gap-4 bg-transparent select-none"
      >
        <div className="flex flex-col items-center gap-4 animate-ocean-bob-slow w-full">
          {/* Subtle vertical alignment rail */}
        <div className="absolute top-1.5 bottom-1.5 w-[1px] bg-white/[0.08] left-1/2 -translate-x-1/2 pointer-events-none z-0" />

        {/* Toggle for Auto Cycle (Icon-only circle, sleek, sits on top of the line) */}
        <button
          onClick={() => setIsAutoCycle(!isAutoCycle)}
          className={`relative z-10 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border transition-all duration-300 cursor-pointer ${
            isAutoCycle 
              ? 'bg-cyan-500/10 border-cyan-400/20 text-cyan-400 hover:border-cyan-400/50' 
              : 'bg-slate-950/40 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/15'
          } active:scale-90`}
          title={isAutoCycle ? `Weather Auto-rotation: Active (changes in ${timeLeft}s)` : "Weather Auto-rotation: Off (click to enable auto cycle)"}
        >
          <Compass className={`w-3.5 h-3.5 ${isAutoCycle ? 'animate-spin' : ''}`} style={{ animationDuration: '12s' }} />
          {isAutoCycle && (
            <span className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-slate-950 font-mono text-[7px] px-1 rounded-full scale-80 font-bold leading-normal">
              {timeLeft}
            </span>
          )}
        </button>

        {/* Separator */}
        <div className="w-5 h-[1px] bg-white/[0.08] my-0.5 z-10"></div>

        {/* Options */}
        {[
          { mode: 'dawn', label: 'Sunrise', icon: Sunrise, colorClass: 'text-amber-500', glowColor: 'rgba(245,158,11,0.2)' },
          { mode: 'day', label: 'Daylight', icon: Sun, colorClass: 'text-cyan-400', glowColor: 'rgba(34,211,238,0.2)' },
          { mode: 'cloudy', label: 'Overcast', icon: Cloud, colorClass: 'text-sky-300', glowColor: 'rgba(125,211,252,0.15)' },
          { mode: 'night', label: 'Midnight', icon: Moon, colorClass: 'text-indigo-400', glowColor: 'rgba(129,140,248,0.2)' },
          { mode: 'storm', label: 'Tempest', icon: CloudLightning, colorClass: 'text-amber-400', glowColor: 'rgba(245,158,11,0.25)' },
        ].map((item) => {
          const IconComponent = item.icon;
          const isActive = weatherMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => handleManualWeatherChange(item.mode as WeatherMode)}
              className={`relative z-10 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-white/10 text-white border border-white/15 scale-110 shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
                  : 'text-slate-400/80 hover:text-slate-100 hover:scale-110 hover:bg-white/[0.03] border border-transparent'
              } active:scale-95`}
              title={`Switch Atmospheric Spectrum to ${item.label}`}
              style={{
                boxShadow: isActive ? `0 0 12px ${item.glowColor}` : undefined
              }}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? item.colorClass : 'text-slate-400/80'}`} />
            </button>
          )
        })}
        </div>
      </motion.div>

      {/* MOBILE TRIGGER FOR ATMOSPHERIC SPECTRUM DRAWER */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, duration: 1.0, type: "spring" }}
        className="md:hidden absolute bottom-24 right-6 z-30 pointer-events-auto select-none"
      >
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-cyan-500/30 bg-slate-900/85 text-cyan-400 backdrop-blur-md transition-all duration-500 cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] active:scale-95 animate-bounce"
          title="Atmospheric Spectrum"
          style={{ animationDuration: '3s' }}
        >
          <Sliders className="w-4.5 h-4.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-500" />
          <span className="absolute -inset-0.5 rounded-full bg-cyan-400/10 blur opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></span>
          {isAutoCycle && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          )}
        </button>
      </motion.div>

      {/* MOBILE ATMOSPHERIC SPECTRUM DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop cover for smooth tactile immersion */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] z-45 pointer-events-auto"
            />

            {/* Bottom Drawer Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-white/10 rounded-t-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.9)] p-6 pb-8 backdrop-blur-xl pointer-events-auto select-none"
            >
              {/* Pill Handle Indicator */}
              <div 
                className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5 cursor-pointer hover:bg-white/45 transition-colors"
                onClick={() => setIsDrawerOpen(false)}
              />

              {/* Header Container */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-serif tracking-[0.2em] font-semibold text-cyan-400 uppercase">
                    Atmospheric Spectrum
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Select environmental weather cycle or enable auto-lapse
                  </span>
                </div>
                {/* Close Button */}
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Weather Modes Selector Layout Grid */}
              <div className="grid grid-cols-5 gap-2 mb-5">
                {[
                  { mode: 'dawn', label: 'Dawn', icon: Sunrise, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-100' },
                  { mode: 'day', label: 'Day', icon: Sun, colorClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100' },
                  { mode: 'cloudy', label: 'Cloudy', icon: Cloud, colorClass: 'text-sky-300', bgClass: 'bg-sky-500/10 border-sky-500/20 text-sky-100' },
                  { mode: 'night', label: 'Night', icon: Moon, colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100' },
                  { mode: 'storm', label: 'Storm', icon: CloudLightning, colorClass: 'text-amber-450', bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-50 animate-pulse' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = weatherMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      onClick={() => {
                        handleManualWeatherChange(item.mode as WeatherMode);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? `${item.bgClass} text-white font-bold scale-105 shadow-[0_4px_12px_rgba(0,0,0,0.5)]`
                          : 'bg-white/[0.02] border-transparent text-slate-400 hover:text-slate-200'
                      } active:scale-95`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isActive ? item.colorClass : 'text-slate-400/80'}`} />
                      <span className={`text-[8px] tracking-wider uppercase ${isActive ? 'text-white' : 'text-slate-500'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Auto-Cycle Panel Switcher */}
              <div 
                onClick={() => setIsAutoCycle(!isAutoCycle)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isAutoCycle
                    ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/[0.01] border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className={`w-5 h-5 ${isAutoCycle ? 'animate-spin' : 'text-slate-500'}`} style={{ animationDuration: '10s' }} />
                  <div className="flex flex-col">
                    <span className="text-xs font-sans font-bold tracking-wider uppercase text-white">
                      {isAutoCycle ? 'Time-Lapse Active' : 'Automatic Rotation Off'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                      {isAutoCycle 
                        ? `Cycles through conditions automatically`
                        : `Click to resume cycle rotation sequence`
                      }
                    </span>
                  </div>
                </div>

                {isAutoCycle ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
                    <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-wider animate-pulse">
                      {timeLeft}S
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-sans tracking-widest text-slate-550 uppercase font-bold text-slate-400">
                    PAUSED
                  </span>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. DYNAMIC CINEMATIC SUBTITLES */}
      {isIntroPlaying && currentSubtitle && (
        <div 
          id="subtitle-overlay-box" 
          className="absolute bottom-32 md:bottom-36 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl text-center pointer-events-none z-40 animate-fade-in-up"
        >
          <div className="bg-slate-950/65 border border-white/5 rounded-2xl px-8 py-4.5 shadow-[0_12px_45px_rgba(0,0,0,0.85)] backdrop-blur-md inline-block">
            <p className="text-base md:text-lg font-serif tracking-wide text-cyan-50 font-normal leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,1)] selection:bg-cyan-500/30">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM CONTROL PANEL (Play Intro, Read Story) */}
      <motion.footer 
        initial={{ opacity: 0, y: 160, scale: 0.85, filter: "blur(18px) brightness(0.3)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px) brightness(1)" }}
        transition={{ delay: 0.52, type: "spring", stiffness: 30, damping: 12, mass: 1.25 }}
        id="app-footer" 
         className="w-full max-w-lg mx-auto mb-4 md:mb-10 pointer-events-auto flex flex-col items-center gap-4 z-30 px-4"
      >
        <div className="w-full flex flex-col items-center gap-4 animate-ocean-bob">
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 w-full">
          {/* Play Intro Button */}
          <button
            id="btn-play-intro"
            onClick={playIntro}
            className={`relative group flex items-center justify-center gap-3.5 px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl font-sans text-xs tracking-[0.25em] uppercase font-semibold transition-all duration-500 cursor-pointer w-full sm:w-auto ${
              isIntroPlaying
                ? 'bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.35),_inset_0_1px_2px_rgba(255,255,255,0.25)] ring-1 ring-cyan-400/15'
                : 'bg-white/[0.03] border border-white/10 text-white/95 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_8px_32px_rgba(0,0,0,0.45)] hover:border-cyan-500/55 hover:text-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.25),_inset_0_1px_2px_rgba(255,255,255,0.25)] hover:-translate-y-0.5'
            } active:scale-95 active:translate-y-0.5`}
          >
            {isIntroPlaying ? (
              <>
                <div className="flex items-end gap-1 h-3.5">
                  <span className="w-0.5 bg-cyan-400 animate-pulse h-3"></span>
                  <span className="w-0.5 bg-cyan-400 animate-pulse h-1.5" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-0.5 bg-cyan-400 animate-pulse h-4" style={{ animationDelay: '0.3s' }}></span>
                  <span className="w-0.5 bg-cyan-400 animate-pulse h-2.5" style={{ animationDelay: '0.45s' }}></span>
                </div>
                <span>Playing Intro</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-cyan-400 transition-transform duration-300 group-hover:scale-115" />
                <span>Play Intro</span>
              </>
            )}
          </button>
 
          {/* Always Available Read Story Button */}
          {onOpenStory && (
            <button
              id="btn-open-story"
              onClick={onOpenStory}
              className="relative group flex items-center justify-center gap-3.5 px-6 py-3.5 sm:px-8 sm:py-4 bg-amber-500 text-slate-950 font-bold border border-amber-400 rounded-2xl font-sans text-xs tracking-[0.25em] uppercase transition-all duration-500 cursor-pointer shadow-[0_0_35px_rgba(245,158,11,0.5),_inset_0_1px_1px_rgba(255,255,255,0.35)] hover:bg-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.65)] hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
            >
              <BookOpen className="w-4 h-4 text-slate-950 transition-transform duration-300 group-hover:scale-115 animate-pulse" />
              <span>Read Story</span>
            </button>
          )}
 
          {/* Creative Branded Story Website Button */}
          <a
            id="btn-story-website"
            href="/story-site/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="wilo-story-website-btn pointer-events-auto group w-full sm:w-auto"
            title="Open Wilo Blue cinematic story world website"
          >
            <span className="wilo-story-btn-content">
              <Sparkles className="w-4 h-4 text-cyan-400 transition-transform duration-300 group-hover:scale-120 animate-pulse" />
              <span className="wilo-story-btn-text">Story Site</span>
            </span>
            <span className="wilo-story-glow-layer"></span>
          </a>

          {/* Creative Interactive Launch Game Button */}
          {onOpenGame && (
            <button
              id="btn-open-game"
              onClick={onOpenGame}
              className="relative group flex items-center justify-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4 bg-cyan-950/40 text-cyan-300 font-bold border border-cyan-500/25 rounded-2xl font-sans text-xs tracking-[0.25em] uppercase transition-all duration-500 cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.15),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-cyan-400 hover:text-white hover:bg-cyan-900/30 hover:shadow-[0_0_35px_rgba(34,211,238,0.3)] hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto pointer-events-auto"
              title="Launch the 'Wilo Launch' physical slingshot adventure game"
            >
              <Compass className="w-4 h-4 text-cyan-400 transition-transform duration-500 group-hover:rotate-[180deg]" />
              <span>Wilo Launch</span>
            </button>
          )}
        </div>

        {/* Headphones Advisory Message */}
        <div id="headphones-recommendation" className="flex items-center gap-2 px-3 py-1 bg-slate-950/20 border border-white/[0.02] rounded-full drop-shadow-sm select-none">
          <Headphones className="w-3.5 h-3.5 text-cyan-500/70 animate-pulse" />
          <span className="text-[9px] tracking-[0.3em] text-slate-400/60 uppercase font-sans font-medium">
            Use headphones for best experience
          </span>
        </div>
        </div>

      </motion.footer>

      {/* INDEPENDENT HIGH-FIDELITY WALO COMS INTERACTIVE SOUNDTRACK PLAY-DECK */}
      <motion.div 
        initial={{ opacity: 0, y: 180, scale: 0.8, filter: "blur(20px) brightness(0.2)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px) brightness(1)" }}
        transition={{ delay: 0.62, type: "spring", stiffness: 28, damping: 11, mass: 1.3 }}
        className="absolute bottom-28 right-4 md:bottom-32 md:right-12 z-35 pointer-events-auto md:block"
      >
        <div className="animate-ocean-bob-extra-slow">
          <Card />
        </div>
      </motion.div>

    </div>
  );
};
