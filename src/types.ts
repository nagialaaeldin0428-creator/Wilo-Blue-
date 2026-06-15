export type WeatherMode = 'dawn' | 'day' | 'cloudy' | 'storm' | 'night';

export interface WeatherSettings {
  sunPosition: [number, number, number];
  sunColor: [number, number, number];
  moonPosition: [number, number, number];
  moonColor: [number, number, number];
  skyTopColor: [number, number, number];
  skyBottomColor: [number, number, number];
  waterBaseColor: [number, number, number];
  waterHighlightColor: [number, number, number];
  waveAmplitude: number;
  waveSpeed: number;
  waveFrequency: number;
  fogColor: [number, number, number];
  fogDensity: number;
  cloudOpacity: number;
  specularIntensity: number;
}

export const WEATHER_PRESETS: Record<WeatherMode, WeatherSettings> = {
  dawn: {
    sunPosition: [30, 8, -40],
    sunColor: [0.95, 0.45, 0.25], // Soft orange
    moonPosition: [-40, 20, 20],
    moonColor: [0.3, 0.4, 0.5],
    skyTopColor: [0.08, 0.12, 0.3], // Deep purple twilight
    skyBottomColor: [0.9, 0.4, 0.3], // Peachy gold dawn
    waterBaseColor: [0.03, 0.08, 0.22], // Deep twilight blue
    waterHighlightColor: [0.85, 0.45, 0.35], // Orange crest highlights
    waveAmplitude: 0.18,
    waveSpeed: 0.5,
    waveFrequency: 0.8,
    fogColor: [0.65, 0.4, 0.35], // Pastel mist
    fogDensity: 0.012,
    cloudOpacity: 0.3,
    specularIntensity: 1.0,
  },
  day: {
    sunPosition: [20, 45, -30],
    sunColor: [1.0, 0.95, 0.8], // Golden white
    moonPosition: [-50, -10, 10],
    moonColor: [0, 0, 0],
    skyTopColor: [0.05, 0.4, 0.8], // Vibrant cyan blue
    skyBottomColor: [0.6, 0.8, 1.0], // Soft skies
    waterBaseColor: [0.01, 0.12, 0.35], // Navy blue
    waterHighlightColor: [0.1, 0.7, 0.75], // Cyan/turquoise crests
    waveAmplitude: 0.22,
    waveSpeed: 0.7,
    waveFrequency: 1.0,
    fogColor: [0.55, 0.75, 0.95], // Cyan blue tint fog
    fogDensity: 0.006,
    cloudOpacity: 0.2,
    specularIntensity: 2.2,
  },
  cloudy: {
    sunPosition: [10, 30, -30],
    sunColor: [0.4, 0.4, 0.45], // Dimmed greyish sun
    moonPosition: [0, -30, 0],
    moonColor: [0, 0, 0],
    skyTopColor: [0.18, 0.22, 0.26], // Cool dark grey
    skyBottomColor: [0.45, 0.48, 0.52], // Silver grey
    waterBaseColor: [0.08, 0.14, 0.2], // Steel teal
    waterHighlightColor: [0.4, 0.48, 0.52], // Silver caps
    waveAmplitude: 0.28,
    waveSpeed: 0.6,
    waveFrequency: 0.9,
    fogColor: [0.35, 0.38, 0.42], // Steel heavy mist
    fogDensity: 0.015,
    cloudOpacity: 0.85,
    specularIntensity: 0.3,
  },
  storm: {
    sunPosition: [5, 20, -30],
    sunColor: [0.15, 0.15, 0.18], // Barely visible Sun
    moonPosition: [0, -40, 0],
    moonColor: [0, 0, 0],
    skyTopColor: [0.05, 0.06, 0.1], // Menacing dark purple dark charcoal
    skyBottomColor: [0.12, 0.14, 0.18], // Dark gloomy silver
    waterBaseColor: [0.02, 0.04, 0.08], // Almost charcoal-black navy
    waterHighlightColor: [0.2, 0.35, 0.38], // Dark foamy cyan
    waveAmplitude: 0.55, // Massive waves!
    waveSpeed: 1.8,    // Raging storm speed
    waveFrequency: 1.25,
    fogColor: [0.08, 0.09, 0.12], // Closed in heavy fog
    fogDensity: 0.028, // Near horizons
    cloudOpacity: 0.95,
    specularIntensity: 0.5,
  },
  night: {
    sunPosition: [0, -30, -10],
    sunColor: [0.0, 0.0, 0.0],
    moonPosition: [-25, 22, -35], // Crisp Moon placement
    moonColor: [0.85, 0.9, 1.0], // Glowing white moon
    skyTopColor: [0.0, 0.02, 0.06], // Deep pitch cosmic
    skyBottomColor: [0.04, 0.07, 0.16], // Dark deep navy horizon
    waterBaseColor: [0.005, 0.02, 0.07], // Absolute deep ocean
    waterHighlightColor: [0.5, 0.7, 0.9], // Bright white-silver moon sheen
    waveAmplitude: 0.16, // Soothing ocean
    waveSpeed: 0.4,
    waveFrequency: 0.75,
    fogColor: [0.01, 0.03, 0.09], // Mystical dark navy mist
    fogDensity: 0.008,
    cloudOpacity: 0.15,
    specularIntensity: 2.8, // Stark, glassy moon reflect
  },
};
