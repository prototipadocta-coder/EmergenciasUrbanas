export type GameScreen = 'menu' | 'settings' | 'garage' | 'game';

export interface GameSettings {
  // Audio
  masterVolume: number; // 0 - 100
  sfxVolume: number; // 0 - 100
  ambientVolume: number; // 0 - 100
  radioVolume: number; // 0 - 100
  enableAudio: boolean;
  
  // Gráficos & Pantalla
  graphicsQuality: 'baja' | 'media' | 'alta' | 'ultra';
  dynamicRain: boolean;
  particleDensity: 'baja' | 'media' | 'alta';
  cameraRainDrops: boolean;
  lightningEffects: boolean;
  fpsLimit: 30 | 60 | 120 | 'unlimited';
  fullscreen: boolean;
  
  // Jugabilidad & Controles
  controlScheme: 'wasd' | 'arrows' | 'touch';
  steeringSensitivity: number; // 1 - 10
  transmission: 'automatica' | 'manual';
  emergencyBrakeAssist: boolean;
  vibrationFeedback: boolean;
  
  // Dificultad & Simulación
  disasterSeverity: 'moderado' | 'critico' | 'catastrofico';
  emergencyTimer: boolean;
  trafficDensity: 'baja' | 'media' | 'alta';
  fuelConsumption: boolean;
  machineryDamage: boolean;
  
  // Idioma & Accesibilidad
  language: 'es' | 'en' | 'pt';
  hudScale: 'pequeño' | 'normal' | 'grande';
  colorblindMode: 'ninguno' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'cargadora' | 'volquete' | 'excavadora' | 'rescate';
  title: string;
  manufacturer: string;
  powerHp: number;
  capacityM3: number;
  hydraulicForceKn: number;
  weightTons: number;
  topSpeedKmh: number;
  description: string;
  color: string;
  unlocked: boolean;
  upgrades: {
    engine: number; // 1-3
    hydraulics: number; // 1-3
    tires: number; // 1-3
    plow: number; // 1-3
  };
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: number;
  target: number;
  unit: string;
}

export interface GameState {
  score: number;
  debrisCleared: number; // tons
  totalDebris: number;
  vehiclesRescued: number;
  totalVehiclesToRescue: number;
  timeRemainingSeconds: number;
  highwayClearedPercentage: number;
  fuel: number; // 0 - 100
  machineIntegrity: number; // 0 - 100
  hydraulicPressure: number; // 0 - 100
}
