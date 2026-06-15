import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Compass as CompassIcon, Navigation, Waves, AlertTriangle, Minimize2 } from 'lucide-react';
import { WeatherMode } from '../types';

interface CompassHUDProps {
  weatherMode: WeatherMode;
  isStormActive: boolean;
}

export const CompassHUD: React.FC<CompassHUDProps> = ({ weatherMode, isStormActive }) => {
  const [angle, setAngle] = useState<number>(0);
  const [drillNoise, setDrillNoise] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  const compassRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<number>(0);

  // High fidelity coordinate defaults (The heart of Sargasso Sea coordinates, home of mystical tides)
  const baseLat = 24.8541; // 24° 51' 14.76" N
  const baseLng = -76.8062; // 76° 48' 22.32" W

  // Pointer move handler to track coordinates and orient compass needle
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (compassRef.current) {
        const rect = compassRef.current.getBoundingClientRect();
        // Calculate center of compass sphere relative to the viewport
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dy = e.clientY - centerY;
        const dx = e.clientX - centerX;

        // Atan2 math coordinates: 0 is 3 o'clock (right), PI/2 is 6 o'clock (down), etc.
        let valRad = Math.atan2(dy, dx);
        let valDeg = valRad * (180 / Math.PI);

        // Adjust alignment for standard compass orientation where North points UP (12 o'clock / -90 deg)
        let adjustedAngle = valDeg + 90;
        setAngle(adjustedAngle);

        // Standard heading is between 0-360 degrees clockwise from North
        let normalizedHeading = (adjustedAngle % 360);
        if (normalizedHeading < 0) {
          normalizedHeading += 360;
        }
        headingRef.current = normalizedHeading;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Soft drifting of coordinates based on boat's bobbing physics and atmospheric sway
  useEffect(() => {
    let frameId: number;
    let time = 0;

    const cycleTelemetry = () => {
      // Wind speeds and stormy waves accelerate the geographical drift
      const deltaSpeed = isStormActive ? 0.04 : 0.012;
      time += deltaSpeed;

      // Realistic orbital multi-octave noise formula represent drifting
      const latOffset = Math.sin(time) * 0.00014 + Math.cos(time * 0.45) * 0.00007;
      const lngOffset = Math.cos(time * 0.75) * 0.00016 + Math.sin(time * 0.3) * 0.00005;

      setDrillNoise({
        lat: latOffset,
        lng: lngOffset
      });

      frameId = requestAnimationFrame(cycleTelemetry);
    };

    frameId = requestAnimationFrame(cycleTelemetry);
    return () => cancelAnimationFrame(frameId);
  }, [isStormActive]);

  // Translate exact angle degrees to cardinal directions (compass headings)
  const getCardinal = (heading: number) => {
    const sectors = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round((heading / 22.5)) % 16;
    return sectors[idx] || 'N';
  };

  // Degrees, Minutes, Seconds formatting formatter
  const formatDMS = (value: number, isLat: boolean) => {
    const absVal = Math.abs(value);
    const degrees = Math.floor(absVal);
    const minutesDecimal = (absVal - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

    const suffix = isLat 
      ? (value >= 0 ? 'N' : 'S') 
      : (value >= 0 ? 'E' : 'W');

    return `${degrees}° ${minutes}' ${seconds}" ${suffix}`;
  };

  const activeLat = baseLat + drillNoise.lat;
  const activeLng = baseLng + drillNoise.lng;
  const activeHeading = headingRef.current || 0;

  // Swells metrics mapping based on weather preset to enrich interface
  const getOceanSwellMetric = () => {
    switch (weatherMode) {
      case 'storm': return { height: '5.4m', state: 'Severely Surging', speed: '48 kts' };
      case 'cloudy': return { height: '1.8m', state: 'Moderate Chop', speed: '14 kts' };
      case 'night': return { height: '0.8m', state: 'Calm Glass', speed: '6 kts' };
      case 'dawn': return { height: '1.1m', state: 'Slight Ripples', speed: '8 kts' };
      default: return { height: '1.2m', state: 'Clear Shimmer', speed: '10 kts' };
    }
  };

  const swell = getOceanSwellMetric();

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        id="marine-nav-hud-collapsed"
        className="absolute top-24 left-6 md:top-auto md:bottom-12 md:left-12 z-40 pointer-events-auto select-none"
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="group relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl border border-cyan-500/30 bg-slate-950/80 text-cyan-400 backdrop-blur-md transition-all duration-500 cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] active:scale-95"
          title="Open Marine Instruments & Compass"
        >
          <CompassIcon className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-700 ease-out" />
          <span className="absolute -inset-0.5 rounded-2xl bg-cyan-400/10 blur opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></span>
          <span className="absolute -bottom-1.5 -right-1.5 bg-cyan-950 text-cyan-400 font-sans font-black text-[8px] px-1.5 py-0.5 rounded-md border border-cyan-500/20 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {getCardinal(activeHeading)}
          </span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 140, scale: 0.84, filter: "blur(16px) brightness(0.2)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px) brightness(1)" }}
      transition={{ delay: 0.32, type: "spring", stiffness: 32, damping: 13, mass: 1.2 }}
      id="marine-nav-hud"
      className="absolute top-24 left-6 md:top-auto md:bottom-12 md:left-12 z-35 pointer-events-auto select-none"
    >
      <div className="animate-ocean-bob">
        <div 
          id="hud-card"
          className="flex items-center gap-3.5 md:gap-4.5 bg-slate-950/65 border border-white/5 backdrop-blur-md rounded-2xl md:rounded-[2rem] p-3 pr-4 md:p-4.5 md:pr-8 shadow-[0_16px_50px_rgba(0,0,0,0.8)] scale-90 md:scale-100 origin-top-left md:origin-center"
        >
        {/* COMPASS DIAL MECHANIC */}
        <div 
          ref={compassRef}
          id="compass-dial-container" 
          className="relative w-20 h-20 md:w-[5.5rem] md:h-[5.5rem] flex items-center justify-center bg-slate-900/40 rounded-full border border-white/10 shadow-[inner_0_2px_10px_rgba(0,0,0,0.8)] group cursor-pointer"
          title="Nautical Instrument Cluster. Follows mouse movement. Click to collapse."
          onClick={() => setIsCollapsed(true)}
        >
          {/* Outer glowing trace ring */}
          <span className="absolute -inset-1 rounded-full bg-cyan-400/5 blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <svg viewBox="0 0 100 100" className="w-full h-full select-none">
            {/* Compass Card Background */}
            <circle cx="50" cy="50" r="46" className="fill-slate-950/20 stroke-cyan-500/10 stroke-[0.75]" />
            <circle cx="50" cy="50" r="42" className="fill-none stroke-white/5 stroke-[0.5] stroke-dasharray-[1,4]" />
            
            {/* Ticks representation around 360 scale */}
            {Array.from({ length: 12 }).map((_, i) => {
              const deg = i * 30;
              const rad = (deg * Math.PI) / 180;
              const startRad = 38;
              const endRad = 42;
              const x1 = 50 + Math.sin(rad) * startRad;
              const y1 = 50 - Math.cos(rad) * startRad;
              const x2 = 50 + Math.sin(rad) * endRad;
              const y2 = 50 - Math.cos(rad) * endRad;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className={i % 3 === 0 ? "stroke-cyan-400/70 stroke-[1]" : "stroke-white/20 stroke-[0.5]"}
                />
              );
            })}

            {/* Cardinal Markers */}
            <text x="50" y="16" textAnchor="middle" className="fill-cyan-400 text-[10px] font-sans font-black tracking-tight" dy=".3em">N</text>
            <text x="85" y="50" textAnchor="middle" className="fill-slate-500 text-[8px] font-mono font-medium" dy=".3em">E</text>
            <text x="50" y="84" textAnchor="middle" className="fill-slate-500 text-[8px] font-mono font-medium" dy=".3em">S</text>
            <text x="15" y="50" textAnchor="middle" className="fill-slate-500 text-[8px] font-mono font-medium" dy=".3em">W</text>

            {/* Center Cap Base */}
            <circle cx="50" cy="50" r="3.5" className="fill-slate-950 stroke-white/10 stroke-[0.5]" />

            {/* Rotating aligned pointer */}
            <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
              {/* North Pointer (Glowing metallic aqua spear) */}
              <polygon points="50,14 53.5,50 46.5,50" className="fill-cyan-400 filter drop-shadow-[0_0_5px_rgba(6,182,212,0.85)]" />
              {/* South Pointer (Matte cooper rust arrow) */}
              <polygon points="50,86 53.5,50 46.5,50" className="fill-amber-600/90" />
              
              {/* Central Pivot Jewel pin */}
              <circle cx="50" cy="50" r="1.5" className="fill-white" />
            </g>
          </svg>
        </div>

        {/* GEOGRAPHICAL COORDINATE TELEMETRY */}
        <div id="telemetry-readout" className="flex flex-col select-none">
          {/* Header row: Coordinates tracker label and Cardinal */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] tracking-[0.25em] text-cyan-400 font-bold uppercase">
                OCEAN INST
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 font-bold tracking-widest">
                {getCardinal(activeHeading)}
              </span>
            </div>
            {/* COLLAPSE TRIGGER BUTTON */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-slate-500 hover:text-cyan-400 p-0.5 rounded-md hover:bg-white/5 transition-all cursor-pointer"
              title="Minimize Instrument Panel"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Core Lat/Lng display lines with classic terminal monospacing */}
          <div className="flex flex-col font-mono text-[11px] text-slate-100 font-medium leading-relaxed">
            <span className="flex items-center gap-1.5" title="Vessel Latitude">
              <span className="text-slate-500 font-bold">LAT:</span>
              <span className="text-white font-semibold tabular-nums">{formatDMS(activeLat, true)}</span>
            </span>
            <span className="flex items-center gap-1.5" title="Vessel Longitude">
              <span className="text-slate-500 font-bold">LNG:</span>
              <span className="text-white font-semibold tabular-nums">{formatDMS(activeLng, false)}</span>
            </span>
          </div>

          {/* Swell telemetry description block under */}
          <div className="mt-1.5 pt-1.5 border-t border-white/5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] text-slate-400 font-sans tracking-wide">
            <span className="flex items-center gap-1">
              <Waves className="w-3 h-3 text-cyan-400/70" />
              <span>SWELL: <strong className="text-white font-mono">{swell.height}</strong></span>
            </span>
            <span className="text-white/10 hidden sm:inline">|</span>
            <span className="flex items-center gap-1">
              <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">WIND:</span>
              <span className="text-slate-300 font-mono font-semibold">{swell.speed}</span>
            </span>

            {/* Storm weather caution marker */}
            {isStormActive && (
              <span className="flex items-center gap-1 text-[8px] font-bold uppercase text-amber-500 animate-pulse ml-0.5" title="Danger: high weather turbulence">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>HEAVY SWELL</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
};
