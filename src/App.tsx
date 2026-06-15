import React, { useState, useEffect, useRef } from 'react';
import { OceanCanvas } from './components/OceanCanvas';
import { UIOverlay } from './components/UIOverlay';
import { StoryReader } from './components/StoryReader';
import { HeroLanding } from './components/HeroLanding';
import { WiloLaunchGame } from './components/WiloLaunchGame';
import { soundEngine } from './utils/audio';
import { WeatherMode } from './types';
import { 
  AlertTriangle, 
  RotateCcw, 
  Info, 
  Compass, 
  X,
  Sparkles,
  Volume2
} from 'lucide-react';

export default function App() {
  const [weatherMode, setWeatherMode] = useState<WeatherMode>('dawn');
  const [inspectMode, setInspectMode] = useState<'boat' | 'book'>('boat');
  const [previousMode, setPreviousMode] = useState<WeatherMode>('day');
  const [isMuted, setIsMuted] = useState(true);
  const [isStormActive, setIsStormActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [hasEntered, setHasEntered] = useState(true);

  // Lightning state pulse (0.0 to 1.0)
  const [lightningPulse, setLightningPulse] = useState(0);

  // App Journey modal state
  const [journeyModalActive, setJourneyModalActive] = useState(false);

  // Keep a ref to tracking weather to avoid outdated closures inside timeouts
  const weatherModeRef = useRef<WeatherMode>(weatherMode);
  useEffect(() => {
    weatherModeRef.current = weatherMode;
  }, [weatherMode]);

  // Synchronise soundEngine weather on change
  useEffect(() => {
    soundEngine.setWeather(weatherMode, 1.8);
  }, [weatherMode]);

  // Auto-initialize sound engine on the very first user interaction gesture (drag, scroll, click)
  useEffect(() => {
    const unlockAudio = async () => {
      try {
        await soundEngine.init();
        soundEngine.toggleMute(false);
        setIsMuted(false);
      } catch (e) {
        console.warn('Audio auto-unlock postponed:', e);
      }
      // Cleanup gesture listeners
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('wheel', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('wheel', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('wheel', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Handle Lightning flashes when storm mode is activated
  useEffect(() => {
    if (weatherMode !== 'storm') {
      setLightningPulse(0);
      return;
    }

    let nextLightningTimeout: NodeJS.Timeout;
    let pulseSeqTimeout1: NodeJS.Timeout;
    let pulseSeqTimeout2: NodeJS.Timeout;
    let pulseSeqTimeout3: NodeJS.Timeout;

    const runLightningStrike = () => {
      if (weatherModeRef.current !== 'storm') return;

      // 1. Initial burst
      setLightningPulse(1.0);
      
      // Trigger synced heavy thunder rumble
      soundEngine.triggerThunder();

      // 2. Clear burst (quick flash sequence)
      pulseSeqTimeout1 = setTimeout(() => {
        setLightningPulse(0.0);
        
        // 3. Faint double strike
        pulseSeqTimeout2 = setTimeout(() => {
          setLightningPulse(0.65);
          
          // 4. Fade to black
          pulseSeqTimeout3 = setTimeout(() => {
            setLightningPulse(0.0);
          }, 110);
        }, 70);
      }, 90);

      // Schedule next strike randomly between 6 and 14 seconds
      const nextDelay = 6000 + Math.random() * 8000;
      nextLightningTimeout = setTimeout(runLightningStrike, nextDelay);
    };

    // First flash starts in 3.5 seconds
    nextLightningTimeout = setTimeout(runLightningStrike, 3500);

    return () => {
      clearTimeout(nextLightningTimeout);
      clearTimeout(pulseSeqTimeout1);
      clearTimeout(pulseSeqTimeout2);
      clearTimeout(pulseSeqTimeout3);
    };
  }, [weatherMode]);

  // Handle Fullscreen tracking changes (clicks, ESC keys, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Web Audio Context initialization handler triggered by click/interaction
  const handleToggleMute = async () => {
    if (isMuted) {
      // User is turning sound on
      await soundEngine.init();
      soundEngine.toggleMute(false);
      setIsMuted(false);
    } else {
      // User is muting
      soundEngine.toggleMute(true);
      setIsMuted(true);
    }
  };

  const handleWeatherChange = (mode: WeatherMode) => {
    setErrorMsg(null); // clear errors on switch
    setWeatherMode(mode);
    if (mode === 'storm') {
      setIsStormActive(true);
      setIsStoryOpen(false); // Ensure the story does not play/open during key tempest events
    } else {
      setIsStormActive(false);
      setPreviousMode(mode); // bookmark previous non-storm weather
    }
  };

  const handleToggleStorm = () => {
    if (isStormActive) {
      // Deactivate storm, return to dawn or the previous bookmarked mode
      setIsStormActive(false);
      setIsStoryOpen(false);
      const prev = previousMode === 'storm' ? 'day' : previousMode;
      setWeatherMode(prev);
    } else {
      // Activate storm
      setPreviousMode(weatherMode);
      setIsStormActive(true);
      setWeatherMode('storm');
      setIsStoryOpen(false); // Ensure the story does not automatically open or stay active when tempest comes
    }
  };

  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch((err) => {
            console.warn('Fullscreen request blocked or failed:', err);
            // safe fallback
            setIsFullscreen(true);
          });
      } else {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch((err) => console.warn(err));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const triggerErrorSimulation = () => {
    setErrorMsg('Simulated Render Error: Canvas WebGL Context was heavily lost due to hardware buffer exception.');
  };

  const handleRetrySetup = () => {
    setErrorMsg(null);
    setCanvasReady(false);
    // Reload canvas component
    setTimeout(() => {
      setCanvasReady(true);
    }, 100);
  };

  return (
    <div id="wilo-blue-app-frame" className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased select-none">
      
      {/* 1. THREE.JS OCEAN CANVAS BACKGROUND */}
      {!errorMsg && (
        <OceanCanvas
          weatherMode={weatherMode}
          onReady={() => setCanvasReady(true)}
          onError={(msg) => setErrorMsg(msg)}
          isStormActive={isStormActive}
          lightningPulse={lightningPulse}
          inspectMode={inspectMode}
          onInspectModeChange={setInspectMode}
        />
      )}

      {/* 2. DYNAMIC FADE LOADING ENTRY COVER */}
      {!canvasReady && !errorMsg && (
        <div id="loader-panel" className="absolute inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center gap-4 transition-opacity duration-1000">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <Compass className="w-10 h-10 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" style={{ animationDuration: '1.2s' }}></span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <h3 className="text-sm font-serif tracking-[0.3em] uppercase text-white/90">
              Wilocosm Ocean Engine
            </h3>
            <span className="text-[10px] text-cyan-500/60 font-mono tracking-widest animate-pulse">
              INITIALIZING SPECTRAL BUFFERS...
            </span>
          </div>
        </div>
      )}

      {/* 3. VISIBLE RED ERROR DIALOG (If ocean failed) */}
      {errorMsg && (
        <div id="error-screen" className="absolute inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-6 text-center select-text">
          <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
            
            <div className="w-14 h-14 bg-red-950/50 border border-red-500/40 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-950/40">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
            </div>

            <h3 className="text-xl font-serif text-white font-medium mb-3 tracking-wide">
              Ocean Shader Core Halted
            </h3>
            <p className="text-xs text-red-400 font-mono px-3 py-2 bg-red-950/30 border border-red-900/30 rounded-xl mb-6 break-all leading-relaxed max-h-[140px] overflow-y-auto">
              {errorMsg}
            </p>

            <div className="text-[11px] text-slate-400 font-sans leading-relaxed text-left mb-8 flex gap-2.5 items-start pl-1">
              <Info className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <span>
                To bypass, please ensure your browser has <strong>WebGL Enabled</strong> and is utilizing GPU hardware acceleration. Otherwise, click reload below to re-init.
              </span>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                id="btn-retry-error"
                onClick={handleRetrySetup}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-red-900/20 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Initialize Canvas</span>
              </button>
              <button
                onClick={() => setErrorMsg(null)}
                className="px-5 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 text-xs uppercase tracking-wider transition-all duration-300"
              >
                Bypass view
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MASTER INTERACTION OVERLAY VIEW */}
      {canvasReady && !errorMsg && (
        !hasEntered ? (
          <HeroLanding
            onEnter={() => setHasEntered(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        ) : (
          <UIOverlay
            weatherMode={weatherMode}
            onWeatherChange={handleWeatherChange}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            isStormActive={isStormActive}
            onToggleStorm={handleToggleStorm}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            onEnterApp={() => {}}
            inspectMode={inspectMode}
            onInspectModeChange={setInspectMode}
            onOpenStory={() => setIsStoryOpen(true)}
            isStoryOpen={isStoryOpen}
            onOpenGame={() => setIsGameOpen(true)}
          />
        )
      )}

      {/* 5. IMMERSIVE STORY REVEALER OVERLAY */}
      <StoryReader 
        isOpen={isStoryOpen} 
        onClose={() => setIsStoryOpen(false)} 
      />

      {/* 6. PHYSICAL SLINGSHOT LAUNCHER MINI GAME */}
      <WiloLaunchGame
        isOpen={isGameOpen}
        onClose={() => setIsGameOpen(false)}
      />

    </div>
  );
}
