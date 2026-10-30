import { GameSettings, Vehicle } from '../types/game';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 85,
  sfxVolume: 90,
  ambientVolume: 75,
  radioVolume: 85,
  enableAudio: true,

  graphicsQuality: 'alta',
  dynamicRain: true,
  particleDensity: 'alta',
  cameraRainDrops: true,
  lightningEffects: true,
  fpsLimit: 60,
  fullscreen: false,

  controlScheme: 'wasd',
  steeringSensitivity: 6,
  transmission: 'automatica',
  emergencyBrakeAssist: true,
  vibrationFeedback: true,

  disasterSeverity: 'critico',
  emergencyTimer: true,
  trafficDensity: 'alta',
  fuelConsumption: true,
  machineryDamage: true,

  language: 'es',
  hudScale: 'normal',
  colorblindMode: 'ninguno',
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'cat-980m',
    name: 'CAT 980M Front Loader',
    type: 'cargadora',
    title: 'Cargadora Frontal de Despeje Pesado',
    manufacturer: 'Caterpillar Inc.',
    powerHp: 426,
    capacityM3: 5.4,
    hydraulicForceKn: 245,
    weightTons: 30.5,
    topSpeedKmh: 40,
    description: 'La reina del movimiento de tierras. Equipada con pala reforzada de dientes de tungsteno, diseñada para empujar rocas masivas y lodo denso fuera de las vías de emergencia.',
    color: '#eab308',
    unlocked: true,
    upgrades: {
      engine: 2,
      hydraulics: 2,
      tires: 2,
      plow: 2,
    },
  },
  {
    id: 'mercedes-arocs',
    name: 'Mercedes Arocs 8x4 Tipper',
    type: 'volquete',
    title: 'Camión Volquete Tolva Reforzada',
    manufacturer: 'Daimler Truck',
    powerHp: 510,
    capacityM3: 18.0,
    hydraulicForceKn: 180,
    weightTons: 38.0,
    topSpeedKmh: 85,
    description: 'Camión volquete de cuatro ejes para acarreo masivo de escombros. Su tolva blindada evacúa toneladas de material deslave lejos de la calzada principal.',
    color: '#f8fafc',
    unlocked: true,
    upgrades: {
      engine: 2,
      hydraulics: 1,
      tires: 2,
      plow: 1,
    },
  },
  {
    id: 'komatsu-pc490',
    name: 'Komatsu PC490LC-11 Excavator',
    type: 'excavadora',
    title: 'Excavadora Hidráulica de Orugas',
    manufacturer: 'Komatsu Ltd.',
    powerHp: 359,
    capacityM3: 3.2,
    hydraulicForceKn: 320,
    weightTons: 48.8,
    topSpeedKmh: 28,
    description: 'Tracción extrema por orugas de acero blindado para trepar directamente sobre la masa de derrumbe inestable sin perder tracción.',
    color: '#3b82f6',
    unlocked: true,
    upgrades: {
      engine: 2,
      hydraulics: 3,
      tires: 2,
      plow: 2,
    },
  },
  {
    id: 'tractomula-colombia',
    name: 'Kenworth W900 Tractomula',
    type: 'volquete',
    title: 'Tractomula Pesada Colombiana 18 Ruedas',
    manufacturer: 'Kenworth Trucks',
    powerHp: 605,
    capacityM3: 24.0,
    hydraulicForceKn: 380,
    weightTons: 42.0,
    topSpeedKmh: 90,
    description: 'La reina de las carreteras colombianas. Equipada con chimeneas cromadas, cornetas neumáticas de tren Nathan K5LA y enorme fuerza de arrastre para despejar la autopista.',
    color: '#0284c7',
    unlocked: true,
    upgrades: {
      engine: 3,
      hydraulics: 2,
      tires: 3,
      plow: 2,
    },
  },
  {
    id: 'rescue-unit-4x4',
    name: 'Scania Rescue Heavy Winch',
    type: 'rescate',
    title: 'Unidad de Extracción y Rescate Vial',
    manufacturer: 'Scania Rescue Systems',
    powerHp: 580,
    capacityM3: 2.0,
    hydraulicForceKn: 410,
    weightTons: 26.0,
    topSpeedKmh: 95,
    description: 'Cabrestante de doble tambor de 30 toneladas para jalar vehículos civiles aplastados o atrapados en el lodo y despejar el carril de ambulancias.',
    color: '#ef4444',
    unlocked: true,
    upgrades: {
      engine: 2,
      hydraulics: 3,
      tires: 3,
      plow: 2,
    },
  },
];

const SETTINGS_KEY = 'derrumbe_game_settings_v1';
const VEHICLES_KEY = 'derrumbe_game_vehicles_v1';
const SELECTED_VEHICLE_KEY = 'derrumbe_game_selected_vehicle';

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function loadVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (!raw) return INITIAL_VEHICLES;
    return JSON.parse(raw);
  } catch {
    return INITIAL_VEHICLES;
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.error('Error saving vehicles', e);
  }
}

export function getSelectedVehicleId(): string {
  try {
    return localStorage.getItem(SELECTED_VEHICLE_KEY) || 'cat-980m';
  } catch {
    return 'cat-980m';
  }
}

export function setSelectedVehicleId(id: string): void {
  try {
    localStorage.setItem(SELECTED_VEHICLE_KEY, id);
  } catch {
    // Ignore
  }
}
