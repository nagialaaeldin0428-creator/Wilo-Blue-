import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/audio';

const TRACKS = [
  {
    title: "Wilo Blue Theme",
    artist: "Roberto Prado",
    src: "/story-site/assets/music/wilo-song.mp3",
    lengthStr: "3:30",
    maxSeconds: 210
  },
  {
    title: "Maps Without Names",
    artist: "Risian",
    src: "/story-site/assets/music/Risian---Maps-Without-Names.mp3",
    lengthStr: "4:12",
    maxSeconds: 252
  }
];

export const Card: React.FC = () => {
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(210);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTrack = TRACKS[trackIndex];

  // Initialize and handle track transitions
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Build the natural browser Audio element
    const audio = new Audio(activeTrack.src);
    audio.loop = !isShuffle;
    audioRef.current = audio;

    // Synchronization event bindings
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      } else {
        setDuration(activeTrack.maxSeconds);
      }
    };

    const handleEnded = () => {
      if (isShuffle) {
        handleNext();
      } else {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Restart track error:", e));
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // If card is playing when user switches track, automatically play next selection!
    if (isPlaying) {
      audio.play().catch(err => {
        console.warn("Audio Context activation failure on track swap:", err);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [trackIndex]);

  // Synchronise volume fade out of marine swells with high quality theme playback to maintain pristine acoustics
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play()
        .then(() => {
          soundEngine.setProximityMultiplier(0.12); // Turn down environmental wind/waves
        })
        .catch(err => {
          console.warn("Audio context interaction gesture required:", err);
          setIsPlaying(false);
        });
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      soundEngine.setProximityMultiplier(1.0); // Restore environmental ambient natural levels
    }
  }, [isPlaying]);

  // Synchronise shuffle checkbox toggle with audio element repeat property loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = !isShuffle;
    }
  }, [isShuffle]);

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handlePrev = () => {
    setTrackIndex(prev => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const handleNext = () => {
    setTrackIndex(prev => (prev + 1) % TRACKS.length);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const targetSeconds = (percent / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = targetSeconds;
    }
    setCurrentTime(targetSeconds);
  };

  // Convert track time markers correctly to human friendly minutes/seconds format
  const formatTimeStr = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div id="wilo-interactive-music-card" className="flex flex-col items-center group/he select-none pointer-events-auto">
      {/* Vinyl Disc Section representing spatial rotating record - collapses on active menu hovering */}
      <div className="relative z-0 h-10 -mb-1.5 transition-all duration-300 group-hover/he:h-0">
        <svg 
          width={80} 
          height={80} 
          viewBox="0 0 128 128" 
          className={`duration-500 border-2 rounded-full shadow-md border-zinc-400 border-spacing-5 transition-all ${
            isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
          }`}
        >
          <rect width={128} height={128} fill="black" />
          <circle cx={20} cy={20} r={2} fill="white" />
          <circle cx={40} cy={30} r={2} fill="white" />
          <circle cx={60} cy={10} r={2} fill="white" />
          <circle cx={80} cy={40} r={2} fill="white" />
          <circle cx={100} cy={20} r={2} fill="white" />
          <circle cx={120} cy={50} r={2} fill="white" />
          <circle cx={90} cy={30} r={10} fill="white" fillOpacity="0.5" />
          <circle cx={90} cy={30} r={8} fill="white" />
          <path d="M0 128 Q32 64 64 128 T128 128" fill="purple" stroke="black" strokeWidth={1} />
          <path d="M0 128 Q32 48 64 128 T128 128" fill="mediumpurple" stroke="black" strokeWidth={1} />
          <path d="M0 128 Q32 32 64 128 T128 128" fill="rebeccapurple" stroke="black" strokeWidth={1} />
          <path d="M0 128 Q16 64 32 128 T64 128" fill="purple" stroke="black" strokeWidth={1} />
          <path d="M64 128 Q80 64 96 128 T128 128" fill="mediumpurple" stroke="black" strokeWidth={1} />
        </svg>
        <div className="absolute inset-0 m-auto z-10 w-4.5 h-4.5 bg-white border border-zinc-405 rounded-full shadow-sm" />
      </div>

      {/* Main Expander Body Card */}
      <div className="z-30 flex flex-col w-40 h-14 transition-all duration-300 bg-white shadow-md group-hover/he:h-30 group-hover/he:w-68 rounded-xl shadow-zinc-400/80 overflow-hidden">
        {/* Track details headers - shown when cursor hovers & card displays spatial components */}
        <div className="flex flex-row w-full h-0 group-hover/he:h-16 transition-all duration-300 overflow-hidden">
          <div className="relative flex items-center justify-center w-16 h-16 group-hover/he:-top-3 group-hover/he:-left-2 opacity-0 group-hover/he:animate-[spin_4s_linear_infinite] group-hover/he:opacity-100 transition-all duration-300 select-none">
            <svg width={64} height={64} viewBox="0 0 128 128" className="duration-500 border-2 rounded-full shadow-sm border-zinc-400">
              <rect width={128} height={128} fill="black" />
              <circle cx={20} cy={20} r={2} fill="white" />
              <circle cx={40} cy={30} r={2} fill="white" />
              <circle cx={60} cy={10} r={2} fill="white" />
              <circle cx={80} cy={40} r={2} fill="white" />
              <circle cx={100} cy={20} r={2} fill="white" />
              <circle cx={120} cy={50} r={2} fill="white" />
              <circle cx={90} cy={30} r={10} fill="white" fillOpacity="0.5" />
              <circle cx={90} cy={30} r={8} fill="white" />
              <path d="M0 128 Q32 64 64 128 T128 128" fill="purple" stroke="black" strokeWidth={1} />
              <path d="M0 128 Q32 48 64 128 T128 128" fill="mediumpurple" stroke="black" strokeWidth={1} />
              <path d="M0 128 Q32 32 64 128 T128 128" fill="rebeccapurple" stroke="black" strokeWidth={1} />
              <path d="M0 128 Q16 64 32 128 T64 128" fill="purple" stroke="black" strokeWidth={1} />
              <path d="M64 128 Q80 64 96 128 T128 128" fill="mediumpurple" stroke="black" strokeWidth={1} />
            </svg>
            <div className="absolute inset-0 m-auto z-10 w-3.5 h-3.5 bg-white border border-zinc-400 rounded-full shadow-sm" />
          </div>
          <div className="flex flex-col justify-center w-full pl-2 -ml-16 overflow-hidden group-hover/he:-ml-1.5 text-nowrap transition-all duration-300">
            <p className="text-[11px] font-bold text-slate-900 truncate pr-2">{activeTrack.title}</p>
            <p className="text-[9.5px] text-zinc-500 font-medium">{activeTrack.artist}</p>
          </div>
        </div>

        {/* Dynamic Progression Slider Row - compact format floats cleanly, hovers display counters */}
        <div className="flex flex-row items-center mx-2.5 mt-2.5 bg-indigo-50/50 rounded-md min-h-4 group-hover/he:mt-0 transition-all duration-300">
          <span className="hidden pl-1.5 text-[8.5px] font-mono text-zinc-500 group-hover/he:inline-block w-7 text-right shrink-0">
            {formatTimeStr(currentTime)}
          </span>
          <input 
            type="range" 
            min={0} 
            max={100} 
            value={progressPercent} 
            onChange={handleSeek}
            className="w-20 group-hover/he:w-full flex-grow h-0.5 mx-1.5 my-auto bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer cursor-pointer" 
          />
          <span className="hidden pr-1.5 text-[8.5px] font-mono text-zinc-500 group-hover/he:inline-block w-7 text-left shrink-0">
            {formatTimeStr(duration)}
          </span>
        </div>

        {/* Tactile Control Buttons Container Bar - fully connected interactive svgs */}
        <div className="flex flex-row items-center justify-center flex-grow mx-2.5 space-x-2 text-zinc-700">
          {/* Loop/Shuffle Status Toggle button */}
          <button 
            type="button"
            onClick={() => setIsShuffle(prev => !prev)}
            className="flex items-center justify-center w-0 h-full overflow-hidden opacity-0 group-hover/he:opacity-100 group-hover/he:w-6 transition-all duration-300 hover:text-cyan-600"
            title={isShuffle ? "Shuffle On" : "Repeat On"}
          >
            {isShuffle ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" />
                <line x1={4} y1={20} x2={21} y2={3} />
                <polyline points="21 16 21 21 16 21" />
                <line x1={15} y1={15} x2={21} y2={21} />
                <line x1={4} y1={4} x2={9} y2={9} />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            )}
          </button>

          {/* Previous Selection Action Button */}
          <button 
            type="button"
            onClick={handlePrev}
            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-100 transition-colors cursor-pointer hover:text-cyan-600 active:scale-90"
            title="Previous Track"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1={5} y1={19} x2={5} y2={5} />
            </svg>
          </button>

          {/* Main Play / Pause Activation Button */}
          <button 
            type="button"
            onClick={handleTogglePlay}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white hover:bg-cyan-500 hover:text-slate-950 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-cyan-400/30 active:scale-90"
            title={isPlaying ? "Pause Theme" : "Play Theme"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <rect x={6} y={4} width={4} height={16} />
                <rect x={14} y={4} width={4} height={16} />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="translate-x-0.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Next Selection Action Button */}
          <button 
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-100 transition-colors cursor-pointer hover:text-cyan-600 active:scale-90"
            title="Next Track"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1={19} y1={5} x2={19} y2={19} />
            </svg>
          </button>

          {/* Playlist Track Indicator List Icon */}
          <button 
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center w-0 h-full overflow-hidden opacity-0 group-hover/he:opacity-100 group-hover/he:w-6 transition-all duration-300 hover:text-cyan-600"
            title="Switch Tracks Lineup"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1={8} y1={6} x2={21} y2={6} />
              <line x1={8} y1={12} x2={21} y2={12} />
              <line x1={8} y1={18} x2={21} y2={18} />
              <line x1={3} y1={6} x2="3.01" y2={6} />
              <line x1={3} y1={12} x2="3.01" y2={12} />
              <line x1={3} y1={18} x2="3.01" y2={18} />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;
