import { WeatherMode } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private waveGain: GainNode | null = null;
  private foamGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private bgMusicTrack: HTMLAudioElement | null = null;

  // High-fidelity natural recordings
  private wavesAudio: HTMLAudioElement | null = null;
  private windAudio: HTMLAudioElement | null = null;
  private thunderAudio: HTMLAudioElement | null = null;

  // Web Audio Graph Media Element Source Nodes
  private wavesAudioSource: MediaElementAudioSourceNode | null = null;
  private windAudioSource: MediaElementAudioSourceNode | null = null;
  private thunderAudioSource: MediaElementAudioSourceNode | null = null;
  
  // Buffers
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;
  private brownNoiseBuffer: AudioBuffer | null = null;

  // Active play nodes (soft procedural background sub-layer)
  private waveSource: AudioBufferSourceNode | null = null;
  private foamSource: AudioBufferSourceNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  // Filters and Modulators
  private waveFilter: BiquadFilterNode | null = null;
  private foamFilter: BiquadFilterNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private waveLFO: OscillatorNode | null = null;
  private foamLFO: OscillatorNode | null = null;
  private windLFO: OscillatorNode | null = null;

  private isRunning: boolean = false;
  private currentMode: WeatherMode = 'dawn';
  private targetVolume: number = 0.4;
  private isMuted: boolean = true;
  private proximityMultiplier: number = 1.0;
  private radioProximityMultiplier: number = 1.0;
  
  // Spawner for periodic bird calls
  private gullInterval: any = null;

  constructor() {}

  public async init() {
    if (this.ctx) return;

    try {
      // Setup HTML5 Audio element for MP3 streaming supporting heavy cross-origin frames cleanly
      if (!this.bgMusicTrack) {
        this.bgMusicTrack = new Audio("/radio.mp3");
        this.bgMusicTrack.crossOrigin = "anonymous";
        this.bgMusicTrack.loop = true;
        this.bgMusicTrack.volume = 0.0;

        this.bgMusicTrack.addEventListener('error', (e) => {
          console.warn("Local radio.mp3 not found or failed to load. Falling back to default ambient track.", e);
          if (this.bgMusicTrack) {
            this.bgMusicTrack.src = "/story-site/assets/music/wilo-song.mp3";
            if (this.isRunning && !this.isMuted) {
              this.bgMusicTrack.play().catch(err => console.log("Deferred fallback play:", err));
            }
          }
        });
      }

      // Initialize natural ambient recordings
      if (!this.wavesAudio) {
        this.wavesAudio = new Audio("/story-site/assets/music/waves.mp3");
        this.wavesAudio.crossOrigin = "anonymous";
        this.wavesAudio.loop = true;
      }
      if (!this.windAudio) {
        this.windAudio = new Audio("/story-site/assets/music/wind.mp3");
        this.windAudio.crossOrigin = "anonymous";
        this.windAudio.loop = true;
      }
      if (!this.thunderAudio) {
        this.thunderAudio = new Audio("/story-site/assets/music/thunder.mp3");
        this.thunderAudio.crossOrigin = "anonymous";
      }

      // Create context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      // Setup master volume
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Setup channels for dual-action waves, wind, and rain
      this.waveGain = this.ctx.createGain(); // For Deep Ocean swells
      this.foamGain = this.ctx.createGain(); // For high-freq surface glistening & foam
      this.windGain = this.ctx.createGain();
      this.rainGain = this.ctx.createGain();

      this.waveGain.connect(this.masterGain);
      this.foamGain.connect(this.masterGain);
      this.windGain.connect(this.masterGain);
      this.rainGain.connect(this.masterGain);

      // Route high-fidelity audio loops through our beautiful spatial GainNodes!
      try {
        this.wavesAudioSource = this.ctx.createMediaElementSource(this.wavesAudio);
        this.wavesAudioSource.connect(this.waveGain);
      } catch (err) {
        console.warn("Could not route waves audio through Web Audio graph, direct playback fallback:", err);
      }

      try {
        this.windAudioSource = this.ctx.createMediaElementSource(this.windAudio);
        this.windAudioSource.connect(this.windGain);
      } catch (err) {
        console.warn("Could not route wind audio through Web Audio graph, direct playback fallback:", err);
      }

      try {
        this.thunderAudioSource = this.ctx.createMediaElementSource(this.thunderAudio);
        this.thunderAudioSource.connect(this.masterGain);
      } catch (err) {
        console.warn("Could not route thunder audio through Web Audio graph, direct play fallback:", err);
      }

      // Create noise buffers for soft synthetic support
      this.createNoiseBuffers();

      // Start procedural backdrop layers
      this.startAmbientLoop();
      
      this.isRunning = true;
      this.isMuted = false;
      this.setWeather(this.currentMode, 0);

      // Start the background gull spawner for dynamic cries!
      this.startGullSpawner();

      // Fade in master
      const initialTarget = this.targetVolume * this.proximityMultiplier;
      this.masterGain.gain.linearRampToValueAtTime(initialTarget, this.ctx.currentTime + 1.5);
      
      if (this.bgMusicTrack) {
        this.bgMusicTrack.volume = 1.0 * this.radioProximityMultiplier * this.proximityMultiplier;
      }

      // Trigger standard background files play
      this.wavesAudio.play().catch(e => console.log("Waves autoplay delayed:", e));
      this.windAudio.play().catch(e => console.log("Wind autoplay delayed:", e));
    } catch (e) {
      console.error('Failed to initialize SoundEngine:', e);
    }
  }

  private createNoiseBuffers() {
    if (!this.ctx) return;

    const sampleRate = this.ctx.sampleRate;
    const duration = 4.0;
    const bufferSize = sampleRate * duration;

    // 1. White Noise Buffer
    this.whiteNoiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const whiteData = this.whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
       whiteData[i] = Math.random() * 2 - 1;
    }

    // 2. Pink Noise Buffer (spectral roll-off 3dB/octave)
    this.pinkNoiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const pinkData = this.pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
       const white = Math.random() * 2 - 1;
       b0 = 0.99886 * b0 + white * 0.0555179;
       b1 = 0.99332 * b1 + white * 0.0750759;
       b2 = 0.96900 * b2 + white * 0.1538520;
       b3 = 0.86650 * b3 + white * 0.3104856;
       b4 = 0.55000 * b4 + white * 0.5329522;
       b5 = -0.7616 * b5 - white * 0.0168980;
       pinkData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
       pinkData[i] *= 0.11; // normalise
       b6 = white * 0.115926;
    }

    // 3. Brown Noise Buffer (spectral roll-off 6dB/octave)
    this.brownNoiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const brownData = this.brownNoiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
       const white = Math.random() * 2 - 1;
       brownData[i] = (lastOut + (0.02 * white)) / 1.02;
       lastOut = brownData[i];
       brownData[i] *= 3.5; // normalise
       brownData[i] = Math.max(-1.0, Math.min(1.0, brownData[i]));
    }
  }

  private startAmbientLoop() {
    if (!this.ctx || !this.pinkNoiseBuffer || !this.whiteNoiseBuffer || !this.brownNoiseBuffer) return;

    const t = this.ctx.currentTime;

    // --- Wave Layer 1: Deep Ocean Swell (Subtle sub-bass warm rumbling backup) ---
    this.waveFilter = this.ctx.createBiquadFilter();
    this.waveFilter.type = 'lowpass';
    this.waveFilter.frequency.setValueAtTime(140, t); // deep, warm lowpass
    this.waveFilter.Q.setValueAtTime(0.7, t); 

    const procWaveGain = this.ctx.createGain();
    procWaveGain.gain.setValueAtTime(0.18, t); // Scaled very low so natural waves.mp3 is prominent!

    this.waveSource = this.ctx.createBufferSource();
    this.waveSource.buffer = this.brownNoiseBuffer;
    this.waveSource.loop = true;
    this.waveSource.connect(this.waveFilter);
    this.waveFilter.connect(procWaveGain);
    procWaveGain.connect(this.waveGain!);
    this.waveSource.start(0);

    // LFO 1: Slow swell oscillator (approx 14 seconds) to modulate wave filter frequency
    this.waveLFO = this.ctx.createOscillator();
    this.waveLFO.type = 'sine';
    this.waveLFO.frequency.setValueAtTime(0.07, t);

    // Dynamic gain sweeps to swell wave intensity organically
    const waveLFOGain = this.ctx.createGain();
    waveLFOGain.gain.setValueAtTime(60, t); 

    this.waveLFO.connect(waveLFOGain);
    waveLFOGain.connect(this.waveFilter.frequency);
    this.waveLFO.start(0);


    // --- Wave Layer 2: Soft Surface Foam & Spray (Very low-gain backup) ---
    this.foamFilter = this.ctx.createBiquadFilter();
    this.foamFilter.type = 'highpass';
    this.foamFilter.frequency.setValueAtTime(800, t);
    this.foamFilter.Q.setValueAtTime(0.4, t);

    const procFoamGain = this.ctx.createGain();
    procFoamGain.gain.setValueAtTime(0.20, t); // Subdued glistening fizzes

    this.foamSource = this.ctx.createBufferSource();
    this.foamSource.buffer = this.pinkNoiseBuffer;
    this.foamSource.loop = true;
    this.foamSource.connect(this.foamFilter);
    this.foamFilter.connect(procFoamGain);
    procFoamGain.connect(this.foamGain!);
    this.foamSource.start(0);

    // Foam LFO to gently modulate foam volume for wave break details
    this.foamLFO = this.ctx.createOscillator();
    this.foamLFO.type = 'sine';
    this.foamLFO.frequency.setValueAtTime(0.11, t); 

    const foamLFOGain = this.ctx.createGain();
    foamLFOGain.gain.setValueAtTime(250, t); 

    this.foamLFO.connect(foamLFOGain);
    foamLFOGain.connect(this.foamFilter.frequency);
    this.foamLFO.start(0);


    // --- Wind Synthesizer (Very low-gain background gusting) ---
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(420, t);
    this.windFilter.Q.setValueAtTime(0.35, t); 

    const procWindGain = this.ctx.createGain();
    procWindGain.gain.setValueAtTime(0.12, t); // Keep synthetic gusts as a faint backing!

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = this.pinkNoiseBuffer;
    this.windSource.loop = true;
    this.windSource.connect(this.windFilter);
    this.windFilter.connect(procWindGain);
    procWindGain.connect(this.windGain!);
    this.windSource.start(0);

    // Wind LFO: slow majestic gusts
    this.windLFO = this.ctx.createOscillator();
    this.windLFO.type = 'sine';
    this.windLFO.frequency.setValueAtTime(0.03, t); 

    const windLFOGain = this.ctx.createGain();
    windLFOGain.gain.setValueAtTime(130, t);

    this.windLFO.connect(windLFOGain);
    windLFOGain.connect(this.windFilter.frequency);
    this.windLFO.start(0);


    // --- Rain Synthesizer (Extreme Warm and Cozy Sound Design) ---
    // Lower frequency lowpass filter cutoff creates highly soothing, cozy rain drops on wood deck with ZERO harsh TV-static hiss.
    const rainLowFilter = this.ctx.createBiquadFilter();
    rainLowFilter.type = 'bandpass';
    rainLowFilter.frequency.setValueAtTime(1200, t);
    rainLowFilter.Q.setValueAtTime(0.5, t);

    const rainHighFilter = this.ctx.createBiquadFilter();
    rainHighFilter.type = 'highpass';
    rainHighFilter.frequency.setValueAtTime(2200, t);
    rainHighFilter.Q.setValueAtTime(0.4, t);

    // Absolute lowpass comfort dampener
    const rainCozyLowpass = this.ctx.createBiquadFilter();
    rainCozyLowpass.type = 'lowpass';
    rainCozyLowpass.frequency.setValueAtTime(3200, t); // beautiful wet damp rain atmosphere

    const procRainGain = this.ctx.createGain();
    procRainGain.gain.setValueAtTime(0.38, t); // highly cinematic, gentle volume

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = this.whiteNoiseBuffer;
    this.rainSource.loop = true;

    // Route rain noise layers
    this.rainSource.connect(rainLowFilter);
    rainLowFilter.connect(rainCozyLowpass);

    this.rainSource.connect(rainHighFilter);
    rainHighFilter.connect(rainCozyLowpass);

    rainCozyLowpass.connect(procRainGain);
    procRainGain.connect(this.rainGain!);
    this.rainSource.start(0);
  }

  // Smoothly morphs the ambient polyphonic pad synthesizer on weather shifts
  private transitionPadChord(mode: WeatherMode) {
    // Synth chords disabled for pure natural atmosphere
  }

  // Elegant, fully synthesized bird calls (squeaking seagull cries!)
  public triggerSeagullCall() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    // Seagulls do not fly in tempest storms or midnights
    if (this.currentMode === 'storm' || this.currentMode === 'night') return;

    const t = this.ctx.currentTime;
    
    // Series of 2-4 consecutive small cries ("kak, kak, kak!")
    const cryCount = 2 + Math.floor(Math.random() * 3);
    let startTime = t + Math.random() * 0.4;

    for (let j = 0; j < cryCount; j++) {
      const cryTime = startTime + j * 0.52; // spacing
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const bandpass = this.ctx.createBiquadFilter();

      // Combined triangle & sawtooth elements produce accurate avian screech profiles
      osc1.type = 'triangle';
      osc2.type = 'sawtooth';

      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(3.8, cryTime);
      bandpass.frequency.setValueAtTime(1400, cryTime);

      // Fast organic envelope
      gainNode.gain.setValueAtTime(0.0, cryTime);
      gainNode.gain.linearRampToValueAtTime(0.045, cryTime + 0.05); // quick chirp attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, cryTime + 0.32); // elegant decline

      // Accurate rapid whistling frequency sweep
      osc1.frequency.setValueAtTime(850, cryTime);
      osc1.frequency.exponentialRampToValueAtTime(1750, cryTime + 0.11);
      osc1.frequency.exponentialRampToValueAtTime(750, cryTime + 0.3);

      osc2.frequency.setValueAtTime(855, cryTime);
      osc2.frequency.exponentialRampToValueAtTime(1755, cryTime + 0.11);
      osc2.frequency.exponentialRampToValueAtTime(755, cryTime + 0.3);

      // Connect up
      osc1.connect(bandpass);
      osc2.connect(bandpass);
      bandpass.connect(gainNode);
      gainNode.connect(this.masterGain);

      // Safe triggers
      try {
        osc1.start(cryTime);
        osc1.stop(cryTime + 0.35);
        osc2.start(cryTime);
        osc2.stop(cryTime + 0.35);
      } catch (err) {}
    }
  }

  private startGullSpawner() {
    if (this.gullInterval) clearInterval(this.gullInterval);
    
    this.gullInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      
      // Gulls are highly active in daylight mornings, serene at sunset, absent in tempest & night
      if (this.currentMode === 'storm' || this.currentMode === 'night') return;
      
      const triggerThreshold = this.currentMode === 'day' ? 0.75 : 0.4; // Day is highly active
      if (Math.random() < triggerThreshold) {
        this.triggerSeagullCall();
      }
    }, 13000); // Check every 13s
  }

  public setWeather(mode: WeatherMode, fadeDuration: number = 2.0) {
    this.currentMode = mode;
    if (!this.ctx || !this.waveGain || !this.foamGain || !this.windGain || !this.rainGain) return;

    const t = this.ctx.currentTime;

    // Spectrum specific ambient gain variables
    let targetWaveG = 0.25; // Deep swell gain
    let targetFoamG = 0.04; // Surface spray splash gain
    let targetWindG = 0.08;
    let targetRainG = 0.0;
    
    let waveLFOFreq = 0.12;
    let foamLFOFreq = 0.16;

    switch (mode) {
      case 'dawn':
        // Soft, golden, extremely calm ocean swells
        targetWaveG = 0.12;
        targetFoamG = 0.012;
        targetWindG = 0.035;
        targetRainG = 0.0;
        waveLFOFreq = 0.06;
        foamLFOFreq = 0.10;
        break;
      case 'day':
        // Bright active glistening sparkling day layout
        targetWaveG = 0.20;
        targetFoamG = 0.045; // splashy high frequencies
        targetWindG = 0.06;
        targetRainG = 0.0;
        waveLFOFreq = 0.09;
        foamLFOFreq = 0.15;
        break;
      case 'cloudy':
        // Heavy cold overcast tides
        targetWaveG = 0.28;
        targetFoamG = 0.015; // muffled surface foam
        targetWindG = 0.18; // gusty winds
        targetRainG = 0.0;
        waveLFOFreq = 0.11;
        foamLFOFreq = 0.12;
        break;
      case 'storm':
        // Powerful ferocious crashing waves, raging winds and continuous rainfall
        targetWaveG = 0.50; // Massive crashing deep wave swells
        targetFoamG = 0.12; // Heavy continuous roaring surf foam
        targetWindG = 0.45; // Howling gale force winds
        targetRainG = 0.22; // High heavy drumming storm rain
        waveLFOFreq = 0.18;
        foamLFOFreq = 0.24;
        break;
      case 'night':
        // Peaceful, starry cosmic night tides
        targetWaveG = 0.14;
        targetFoamG = 0.008;
        targetWindG = 0.04;
        targetRainG = 0.0;
        waveLFOFreq = 0.07;
        foamLFOFreq = 0.11;
        break;
    }

    // Apply linear smoothing curves to balance channel transition
    this.waveGain.gain.linearRampToValueAtTime(targetWaveG, t + fadeDuration);
    this.foamGain.gain.linearRampToValueAtTime(targetFoamG, t + fadeDuration);
    this.windGain.gain.linearRampToValueAtTime(targetWindG, t + fadeDuration);
    this.rainGain.gain.linearRampToValueAtTime(targetRainG, t + fadeDuration);

    // Morph synthesizer chords seamlessly
    this.transitionPadChord(mode);

    if (this.waveLFO) {
      this.waveLFO.frequency.setValueAtTime(waveLFOFreq, t);
    }
    if (this.foamLFO) {
      this.foamLFO.frequency.setValueAtTime(foamLFOFreq, t);
    }

    // Trigger one immediate bird call when entering bright day spectrum to signal weather alignment!
    if (mode === 'day') {
      setTimeout(() => {
        this.triggerSeagullCall();
      }, 1000);
    }
  }

  public triggerThunder() {
    if (!this.ctx || !this.thunderAudio || !this.masterGain || this.currentMode !== 'storm') return;

    try {
      this.thunderAudio.currentTime = 0;
      this.thunderAudio.play().catch(e => console.warn("Thunder play error:", e));
    } catch (err) {
      console.warn("Thunder playback failed:", err);
    }
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    this.updateMasterVolume();
  }

  public setProximityMultiplier(multiplier: number) {
    this.proximityMultiplier = Math.max(0, Math.min(1, multiplier));
    this.updateMasterVolume();
  }

  public setRadioProximityMultiplier(multiplier: number) {
    this.radioProximityMultiplier = Math.max(0, Math.min(1, multiplier));
    this.updateMasterVolume();
  }

  public setCustomMusicSrc(src: string) {
    if (!this.bgMusicTrack) {
      this.bgMusicTrack = new Audio();
      this.bgMusicTrack.crossOrigin = "anonymous";
      this.bgMusicTrack.loop = true;
      this.bgMusicTrack.volume = 0.0;
    }
    this.bgMusicTrack.src = src;
    this.updateMasterVolume();
  }

  public getMusicTrack(): HTMLAudioElement | null {
    return this.bgMusicTrack;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private updateMasterVolume() {
    if (!this.ctx || !this.masterGain) return;
    const targetVal = this.isMuted ? 0.0 : (this.targetVolume * this.proximityMultiplier);
    this.masterGain.gain.setTargetAtTime(targetVal, this.ctx.currentTime, 0.1);

    if (this.bgMusicTrack) {
      const musicVolume = this.isMuted ? 0.0 : (1.0 * this.radioProximityMultiplier * this.proximityMultiplier);
      this.bgMusicTrack.volume = musicVolume;

      // Unconditional playback based on user proximity:
      // Play when zooming near boat (when radioProximityMultiplier > 0) and not muted.
      // Pause when zooming away (when radioProximityMultiplier === 0) or muted.
      if (!this.isMuted && this.radioProximityMultiplier > 0) {
        if (this.bgMusicTrack.paused) {
          this.bgMusicTrack.play().catch(e => console.log('Bg music proximity play delayed:', e));
        }
      } else {
        if (!this.bgMusicTrack.paused) {
          this.bgMusicTrack.pause();
        }
      }
    }

    if (!this.isMuted) {
      if (this.wavesAudio && this.wavesAudio.paused) {
        this.wavesAudio.play().catch(e => console.log("Waves play delay:", e));
      }
      if (this.windAudio && this.windAudio.paused) {
        this.windAudio.play().catch(e => console.log("Wind play delay:", e));
      }
    } else {
      if (this.wavesAudio && !this.wavesAudio.paused) {
        this.wavesAudio.pause();
      }
      if (this.windAudio && !this.windAudio.paused) {
        this.windAudio.pause();
      }
      if (this.thunderAudio && !this.thunderAudio.paused) {
        this.thunderAudio.pause();
      }
    }
  }

  public cleanup() {
    if (this.gullInterval) {
      clearInterval(this.gullInterval);
      this.gullInterval = null;
    }
    if (this.bgMusicTrack) {
      try {
        this.bgMusicTrack.pause();
      } catch (e) {}
      this.bgMusicTrack = null;
    }
    if (this.wavesAudio) {
      try { this.wavesAudio.pause(); } catch (e) {}
      this.wavesAudio = null;
    }
    if (this.windAudio) {
      try { this.windAudio.pause(); } catch (e) {}
      this.windAudio = null;
    }
    if (this.thunderAudio) {
      try { this.thunderAudio.pause(); } catch (e) {}
      this.thunderAudio = null;
    }
    if (!this.ctx) return;
    try {
      this.waveSource?.stop();
      this.foamSource?.stop();
      this.windSource?.stop();
      this.rainSource?.stop();
      this.waveLFO?.stop();
      this.foamLFO?.stop();
      this.windLFO?.stop();

      this.ctx.close();
    } catch (e) {}
    this.ctx = null;
    this.isRunning = false;
  }
}

export const soundEngine = new SoundEngine();
