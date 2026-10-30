import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Gauge,
  Fuel,
  Shield,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Truck,
  Layers,
  Radio,
  MapPin,
  Compass,
  Zap,
  Award,
  Sparkles,
  Trophy,
  Sun,
  Moon,
  Users,
  UserCheck,
  RotateCw,
} from 'lucide-react';
import { GameSettings, Vehicle } from '../types/game';
import { sound } from '../utils/audio';
import highwayBgImg from '../assets/images/highway_landslide_wide_1790260648525.jpg';
import iglesiaBgImg from '../assets/images/iglesia_san_antonio_prado_1790863165632.jpg';

export type Gear = 'R' | 'N' | '1' | '2' | '3' | '4';

interface SkidMark {
  x: number;
  y: number;
  alpha: number;
}

interface ShieldPickup {
  id: number;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  respawnTimer: number;
}

interface GameScreenProps {
  settings: GameSettings;
  vehicle: Vehicle;
  onOpenSettings: () => void;
  onBackToMenu: () => void;
}

// World Dimensions: Spacious, wide highway corridor
const WORLD_WIDTH = 3800;
const WORLD_HEIGHT = 1600;
const TOTAL_MISSION_TIME = 360; // 6 minutes limit before secondary catastrophic rockslide!

interface Boulder {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  weight: number; // tons
  color: string;
  cleared: boolean;
}

type CarStatus = 'trapped' | 'cleared' | 'waiting_crane' | 'being_hooked' | 'towed' | 'rescued';

interface CivilianCar {
  id: number;
  name: string;
  driverName: string;
  passengerCount: number;
  driverColor: string;
  passengerColor: string;
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  color: string;
  status: CarStatus;
  blockingRocksCount: number;
  assignedCraneId: number | null;
  etaSeconds: number;
  distanceToCrane: number;
  rescuedTimestamp?: number;
}

type CraneState = 'idle' | 'preparing' | 'en_route' | 'hooking' | 'towing' | 'returning';

interface RescueCrane {
  id: number;
  name: string;
  code: string;
  color: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  state: CraneState;
  targetCarId: number | null;
  prepTimer: number;
  hookProgress: number;
  armAngle: number;
  sirenActive: boolean;
  baseX: number;
  baseY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  life: number;
  maxLife: number;
}

type GameOverReason = 'fuel' | 'damage' | 'time' | null;

export const GameScreen: React.FC<GameScreenProps> = ({
  settings,
  vehicle,
  onOpenSettings,
  onBackToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Game state
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [clearedTons, setClearedTons] = useState<number>(0);
  const [targetTons] = useState<number>(180);
  const [carsRescued, setCarsRescued] = useState<number>(0);
  const [totalCars, setTotalCars] = useState<number>(6);
  const [personsRescued, setPersonsRescued] = useState<number>(0);
  const [totalPersons, setTotalPersons] = useState<number>(14);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [fuel, setFuel] = useState<number>(100);
  const [integrity, setIntegrity] = useState<number>(100);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(TOTAL_MISSION_TIME);
  const [isVictorious, setIsVictorious] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null);

  // Manual transmission gear state ('R', 'N', '1', '2', '3', '4')
  const [currentGear, setCurrentGear] = useState<Gear>('1');
  const gearRef = useRef<Gear>('1');
  const [engineRpm, setEngineRpm] = useState<number>(850);

  // 3D Graphics Mode (Perspective 3D rendering)
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  // Engine Brake (Jake Brake / Freno Motor)
  const [isEngineBrakeActive, setIsEngineBrakeActive] = useState<boolean>(false);
  const engineBrakeActiveRef = useRef<boolean>(false);

  // Background scene: Highway vs Iglesia de San Antonio de Prado
  const [bgScene, setBgScene] = useState<'highway' | 'iglesia'>('highway');
  const churchImageRef = useRef<HTMLImageElement | null>(null);

  // Day / Night cycle (game hour: 0 to 24)
  const [gameHour, setGameHour] = useState<number>(14);
  const [isAutoDayNight, setIsAutoDayNight] = useState<boolean>(true);
  const gameHourRef = useRef<number>(14);

  // Screen shake from train horn or heavy collisions
  const screenShakeRef = useRef<number>(0);
  const reverseBeepTimerRef = useRef<number>(0);

  // Super Kinetic Force Shield System ("que el escudo tenga más tiempo y más fuerza, que no se acabe tan rápido")
  const [isShieldActive, setIsShieldActive] = useState<boolean>(true);
  const isShieldActiveRef = useRef<boolean>(true);
  const [shieldTimeLeft, setShieldTimeLeft] = useState<number>(60); // 60 seconds of extended duration!
  const shieldTimeLeftRef = useRef<number>(60);
  const shieldPickupsRef = useRef<ShieldPickup[]>([]);

  const [radioLog, setRadioLog] = useState<{ id: string; text: string; time: string; type: 'alert' | 'crane' | 'info' | 'score' }[]>([
    {
      id: 'init-1',
      text: 'CENTRAL 911: Operador Antonio de Prado en línea. Aluvión masivo en Km 48. Hay personas atrapadas en sus automóviles.',
      time: '14:30',
      type: 'alert',
    },
    {
      id: 'init-2',
      text: 'TRANSMISIÓN: Caja manual de 4 marchas + Reversa. Usa [E] para subir cambio y [Q] para bajar cambio.',
      time: '14:31',
      type: 'info',
    },
  ]);

  // Camera viewport
  const cameraRef = useRef({
    x: 200,
    y: 400,
    targetX: 200,
    targetY: 400,
  });

  // Player physics
  const playerRef = useRef({
    x: 520,
    y: 800,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 0,
    shovelDown: false,
    width: 76,
    height: 44,
    operatorName: 'Antonio de Prado',
  });

  // Keys pressed
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // World objects
  const bouldersRef = useRef<Boulder[]>([]);
  const carsRef = useRef<CivilianCar[]>([]);
  const cranesRef = useRef<RescueCrane[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);
  const skidMarksRef = useRef<SkidMark[]>([]);

  // Preload background images
  useEffect(() => {
    const img = new Image();
    img.src = highwayBgImg;
    img.onload = () => {
      bgImageRef.current = img;
    };

    const churchImg = new Image();
    churchImg.src = iglesiaBgImg;
    churchImg.onload = () => {
      churchImageRef.current = churchImg;
    };
  }, []);

  // Dispatch radio messages
  const pushRadio = useCallback((text: string, type: 'alert' | 'crane' | 'info' | 'score' = 'info') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setRadioLog((prev) => [
      { id: Math.random().toString(), text, time, type },
      ...prev.slice(0, 4),
    ]);
  }, []);

  // Spawn floating score popup on canvas
  const triggerScore = useCallback(
    (points: number, x: number, y: number, label: string, color = '#fbbf24') => {
      setScore((prev) => prev + points);
      floatingScoresRef.current.push({
        id: Math.random(),
        x,
        y: y - 20,
        text: `+${points.toLocaleString()} PTS`,
        subtext: label,
        color,
        alpha: 1,
        scale: 1.2,
        vy: -1.6,
        life: 0,
        maxLife: 70,
      });

      // Confetti / sparkle particles
      for (let i = 0; i < 6; i++) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 2,
          size: 3 + Math.random() * 3,
          color,
          alpha: 1,
          life: 0,
          maxLife: 35,
        });
      }
    },
    []
  );

  // TRIGGER POWERFUL TRAIN AIR HORN ("cornetas de tren")
  const triggerTrainHorn = useCallback(() => {
    sound.playTrainHorn();
    const p = playerRef.current;

    screenShakeRef.current = 14;

    shockwavesRef.current.push({
      x: p.x + Math.cos(p.angle) * 15,
      y: p.y + Math.sin(p.angle) * 15,
      radius: 20,
      maxRadius: 260,
      alpha: 0.9,
      color: '#f59e0b',
    });

    shockwavesRef.current.push({
      x: p.x + Math.cos(p.angle) * 15,
      y: p.y + Math.sin(p.angle) * 15,
      radius: 10,
      maxRadius: 180,
      alpha: 0.8,
      color: '#38bdf8',
    });

    for (let i = 0; i < 16; i++) {
      const pAngle = p.angle + (Math.random() - 0.5) * 0.8;
      particlesRef.current.push({
        x: p.x + Math.cos(p.angle) * 35,
        y: p.y + Math.sin(p.angle) * 35,
        vx: Math.cos(pAngle) * (5 + Math.random() * 5),
        vy: Math.sin(pAngle) * (5 + Math.random() * 5),
        size: 4 + Math.random() * 6,
        color: '#e2e8f0',
        alpha: 0.75,
        life: 0,
        maxLife: 30,
      });
    }

    const blastOriginX = p.x + Math.cos(p.angle) * 30;
    const blastOriginY = p.y + Math.sin(p.angle) * 30;
    bouldersRef.current.forEach((b) => {
      if (b.cleared) return;
      const dx = b.x - blastOriginX;
      const dy = b.y - blastOriginY;
      const dist = Math.hypot(dx, dy);
      if (dist < 180 && dist > 1) {
        const force = (180 - dist) * 0.025;
        b.vx += (dx / dist) * force;
        b.vy += (dy / dist) * force;
      }
    });

    triggerScore(25, p.x, p.y - 45, '🚆 ¡¡HOOOONK!! CORNETAS DE TREN', '#f59e0b');
    pushRadio('📢 ANTONIO DE PRADO: ¡Haciendo sonar las cornetas de tren para despejar la vía!', 'info');
  }, [triggerScore, pushRadio]);

  // Toggle Day / Night manually
  const toggleDayNight = useCallback(() => {
    sound.playClick();
    const current = gameHourRef.current;
    const nextHour = current >= 6 && current < 19 ? 23 : 12;
    gameHourRef.current = nextHour;
    setGameHour(nextHour);
    pushRadio(
      nextHour >= 20 || nextHour < 6
        ? '🌙 NOCHE: Antonio de Prado enciende los proyectores de alta potencia.'
        : '☀️ DÍA: Visibilidad total en la autopista.',
      'alert'
    );
  }, [pushRadio]);

  // Gear sequence: R, N, 1, 2, 3, 4
  const GEARS: Gear[] = ['R', 'N', '1', '2', '3', '4'];

  const shiftGear = useCallback((targetGear: Gear) => {
    sound.playGearShift();
    gearRef.current = targetGear;
    setCurrentGear(targetGear);

    let desc = '';
    if (targetGear === 'R') desc = 'REVERSA (ALARMA AUDIBLE)';
    else if (targetGear === 'N') desc = 'NEUTRO (SIN TRACCIÓN)';
    else if (targetGear === '1') desc = '1ª FUERZA MÁXIMA (EMPUJE DE ROCAS)';
    else if (targetGear === '2') desc = '2ª EMPUJE MEDIO (TRABAJO VIAL)';
    else if (targetGear === '3') desc = '3ª TRÁNSITO NORMAL';
    else if (targetGear === '4') desc = '4ª ALTA VELOCIDAD (CARRETERA)';

    const p = playerRef.current;
    triggerScore(10, p.x, p.y - 40, `⚙️ CAMBIO A ${targetGear}ª • ${desc}`, '#38bdf8');
    pushRadio(`⚙️ TRANSMISIÓN: Antonio de Prado engranó ${targetGear}ª marcha [${desc}].`, 'info');
  }, [triggerScore, pushRadio]);

  const shiftUp = useCallback(() => {
    const idx = GEARS.indexOf(gearRef.current);
    if (idx < GEARS.length - 1) {
      shiftGear(GEARS[idx + 1]);
    }
  }, [shiftGear]);

  const shiftDown = useCallback(() => {
    const idx = GEARS.indexOf(gearRef.current);
    if (idx > 0) {
      shiftGear(GEARS[idx - 1]);
    }
  }, [shiftGear]);

  // Trigger heavy diesel compression brake (Jake Brake / Freno Motor)
  const triggerEngineBrake = useCallback(() => {
    sound.playEngineBrake();
    const p = playerRef.current;
    p.speed *= 0.42; // Aggressive compression deceleration

    screenShakeRef.current = 7;
    setIsEngineBrakeActive(true);
    setTimeout(() => setIsEngineBrakeActive(false), 500);

    // Thick compression exhaust smoke puffs
    for (let i = 0; i < 10; i++) {
      const exhaustX = p.x - Math.cos(p.angle) * 14 - Math.sin(p.angle) * 12;
      const exhaustY = p.y - Math.sin(p.angle) * 14 + Math.cos(p.angle) * 12;
      particlesRef.current.push({
        x: exhaustX,
        y: exhaustY,
        vx: -Math.cos(p.angle) * 2.5 + (Math.random() - 0.5) * 2,
        vy: -Math.sin(p.angle) * 2.5 + (Math.random() - 0.5) * 2,
        size: 5 + Math.random() * 6,
        color: 'rgba(31, 41, 55, 0.85)', // Dark diesel compression smoke
        alpha: 0.9,
        life: 0,
        maxLife: 32,
      });
    }

    triggerScore(15, p.x, p.y - 45, '🛑 FRENO MOTOR ACTIVADO (JAKE BRAKE)', '#f43f5e');
    pushRadio('🛑 CABINA: ¡Freno de motor activado! Retardador neumático desacelerando.', 'info');
  }, [triggerScore, pushRadio]);

  // Blast Train Horns on the Heavy Rescue Tow Cranes ("que la grua tenga cornetas de tren")
  const triggerCraneTrainHorn = useCallback(() => {
    sound.playTrainHorn();
    let blastedAny = false;

    cranesRef.current.forEach((crane) => {
      if (crane.state !== 'idle') {
        blastedAny = true;
        // Expanding sonic shockwaves from the crane cab roof
        shockwavesRef.current.push({
          x: crane.x + Math.cos(crane.angle) * 20,
          y: crane.y + Math.sin(crane.angle) * 20,
          radius: 15,
          maxRadius: 220,
          alpha: 0.85,
          color: '#38bdf8',
        });
      }
    });

    if (!blastedAny && cranesRef.current.length > 0) {
      // Blast lead crane in base
      const lead = cranesRef.current[0];
      shockwavesRef.current.push({
        x: lead.x,
        y: lead.y,
        radius: 15,
        maxRadius: 220,
        alpha: 0.85,
        color: '#f59e0b',
      });
    }

    screenShakeRef.current = 10;
    pushRadio('🚨 FLOTA DE GRÚAS: ¡Haciendo sonar las cornetas de tren para abrir paso en la calzada!', 'crane');
  }, [pushRadio]);

  // Toggle 3D Perspective Graphics
  const toggle3DMode = useCallback(() => {
    sound.playClick();
    setIs3DMode((prev) => {
      const next = !prev;
      pushRadio(
        next
          ? '🎥 MODO 3D ACTIVADO: Perspectiva tridimensional y relieve dinámico.'
          : '🗺️ MODO 2D TÁCTICO: Vista cenital estándar.',
        'info'
      );
      return next;
    });
  }, [pushRadio]);

  // Toggle Background: Highway vs Parroquia San Antonio de Prado
  const toggleBgScene = useCallback(() => {
    sound.playClick();
    setBgScene((prev) => {
      const next = prev === 'highway' ? 'iglesia' : 'highway';
      pushRadio(
        next === 'iglesia'
          ? '⛪ ESCENARIO: Vista panorámica de la Parroquia de San Antonio de Prado activada.'
          : '🛣️ ESCENARIO: Vista de la Autopista Km 48 activada.',
        'info'
      );
      return next;
    });
  }, [pushRadio]);

  // Toggle / Activate Kinetic Force Shield ("que el escudo tenga más tiempo y más fuerza, que no se acabe tan rápido")
  const toggleForceShield = useCallback(() => {
    // If shield has drained, provide emergency energy boost so the player is never out of protection
    if (shieldTimeLeftRef.current <= 0) {
      shieldTimeLeftRef.current = 60;
      setShieldTimeLeft(60);
    }
    const nextState = !isShieldActiveRef.current;
    isShieldActiveRef.current = nextState;
    setIsShieldActive(nextState);

    const p = playerRef.current;
    if (nextState) {
      sound.playShieldActivate();
      screenShakeRef.current = 5;
      shockwavesRef.current.push({
        x: p.x,
        y: p.y,
        radius: 20,
        maxRadius: 180,
        alpha: 0.9,
        color: '#06b6d4',
      });
      triggerScore(150, p.x, p.y - 45, '🛡️ ¡ESCUDO TITÁNICO ACTIVADO! (+350% FUERZA)', '#38bdf8');
      pushRadio(`⚡ ESCUDO DE FUERZA: Activado por Antonio de Prado (${shieldTimeLeftRef.current}s). +350% potencia de empuje e inmunidad total.`, 'score');
    } else {
      sound.playClick();
      pushRadio('🛡️ ESCUDO: Modo ahorro de energía activado.', 'info');
    }
  }, [triggerScore, pushRadio]);

  // Initialize objects in the spacious world
  const initGameWorld = useCallback(() => {
    playerRef.current = {
      x: 520,
      y: 800,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
      shovelDown: false,
      width: 76,
      height: 44,
      operatorName: 'Antonio de Prado',
    };

    cameraRef.current = {
      x: 0,
      y: 400,
      targetX: 0,
      targetY: 400,
    };

    screenShakeRef.current = 0;

    // Fleet of 5 heavy rescue tow cranes stationed at Base de Despacho (x: 220)
    const newCranes: RescueCrane[] = [
      {
        id: 1,
        name: 'GRÚA-01 TITÁN',
        code: 'G-01',
        color: '#f59e0b',
        x: 220,
        y: 540,
        angle: 0,
        speed: 0,
        state: 'idle',
        targetCarId: null,
        prepTimer: 0,
        hookProgress: 0,
        armAngle: 0,
        sirenActive: false,
        baseX: 220,
        baseY: 540,
      },
      {
        id: 2,
        name: 'GRÚA-02 HÉRCULES',
        code: 'G-02',
        color: '#ea580c',
        x: 220,
        y: 670,
        angle: 0,
        speed: 0,
        state: 'idle',
        targetCarId: null,
        prepTimer: 0,
        hookProgress: 0,
        armAngle: 0,
        sirenActive: false,
        baseX: 220,
        baseY: 670,
      },
      {
        id: 3,
        name: 'GRÚA-03 CENTAURO',
        code: 'G-03',
        color: '#dc2626',
        x: 220,
        y: 800,
        angle: 0,
        speed: 0,
        state: 'idle',
        targetCarId: null,
        prepTimer: 0,
        hookProgress: 0,
        armAngle: 0,
        sirenActive: false,
        baseX: 220,
        baseY: 800,
      },
      {
        id: 4,
        name: 'GRÚA-04 HALCÓN',
        code: 'G-04',
        color: '#0284c7',
        x: 220,
        y: 930,
        angle: 0,
        speed: 0,
        state: 'idle',
        targetCarId: null,
        prepTimer: 0,
        hookProgress: 0,
        armAngle: 0,
        sirenActive: false,
        baseX: 220,
        baseY: 930,
      },
      {
        id: 5,
        name: 'GRÚA-05 VULCANO',
        code: 'G-05',
        color: '#16a34a',
        x: 220,
        y: 1060,
        angle: 0,
        speed: 0,
        state: 'idle',
        targetCarId: null,
        prepTimer: 0,
        hookProgress: 0,
        armAngle: 0,
        sirenActive: false,
        baseX: 220,
        baseY: 1060,
      },
    ];
    cranesRef.current = newCranes;

    // 6 Trapped Civilian Vehicles with DRIVERS AND PASSENGERS ("personas manejando el automóvil")
    const newCars: CivilianCar[] = [
      {
        id: 1,
        name: 'Sedán Rojo',
        driverName: 'Carlos Méndez',
        passengerCount: 2,
        driverColor: '#3b82f6',
        passengerColor: '#f43f5e',
        x: 1380,
        y: 620,
        angle: -0.15,
        width: 48,
        height: 26,
        color: '#ef4444',
        status: 'trapped',
        blockingRocksCount: 3,
        assignedCraneId: null,
        etaSeconds: 0,
        distanceToCrane: 0,
      },
      {
        id: 2,
        name: 'SUV Azul 4x4',
        driverName: 'Dra. Sofía Alarcón',
        passengerCount: 1,
        driverColor: '#10b981',
        passengerColor: '#94a3b8',
        x: 1720,
        y: 960,
        angle: 0.22,
        width: 52,
        height: 28,
        color: '#3b82f6',
        status: 'trapped',
        blockingRocksCount: 3,
        assignedCraneId: null,
        etaSeconds: 0,
        distanceToCrane: 0,
      },
      {
        id: 3,
        name: 'Familiar Amarillo',
        driverName: 'Familia Gómez',
        passengerCount: 4,
        driverColor: '#d97706',
        passengerColor: '#8b5cf6',
        x: 2020,
        y: 530,
        angle: -0.08,
        width: 50,
        height: 26,
        color: '#eab308',
        status: 'trapped',
        blockingRocksCount: 4,
        assignedCraneId: null,
        etaSeconds: 0,
        distanceToCrane: 0,
      },
      {
        id: 4,
        name: 'Furgón Comercial',
        driverName: 'Mateo (Repartidor)',
        passengerCount: 2,
        driverColor: '#6366f1',
        passengerColor: '#0ea5e9',
        x: 2320,
        y: 1020,
        angle: 0.18,
        width: 56,
        height: 30,
        color: '#f8fafc',
        status: 'trapped',
        blockingRocksCount: 3,
        assignedCraneId: null,
        etaSeconds: 0,
        distanceToCrane: 0,
      },
      {
        id: 5,
        name: 'Hatchback Verde',
        driverName: 'Lucía Fernández',
        passengerCount: 2,
        driverColor: '#ec4899',
        passengerColor: '#f59e0b',
        x: 2580,
        y: 670,
        angle: -0.28,
        width: 44,
        height: 24,
        color: '#10b981',
        status: 'trapped',
        blockingRocksCount: 3,
        assignedCraneId: null,
        etaSeconds: 0,
        distanceToCrane: 0,
      },
      {
        id: 6,
        name: 'Pick-Up Naranja',
        driverName: 'Marcos (Ingeniero)',
        passengerCount: 3,
        driverColor: '#7c3aed',
        passengerColor: '#14b8a6',
        x: 2840,
        y: 880,
        angle: 0.12,
        width: 54,
        height: 28,
        color: '#f97316',
        status: 'trapped',
        blockingRocksCount: 4,
        assignedCraneId: null,
        etaSeconds: 0,
        distanceToCrane: 0,
      },
    ];
    carsRef.current = newCars;
    setTotalCars(newCars.length);

    const sumPersons = newCars.reduce((acc, c) => acc + c.passengerCount, 0);
    setTotalPersons(sumPersons);
    setPersonsRescued(0);

    // Generate boulders encircling each car plus general rockslide debris
    const newBoulders: Boulder[] = [];
    const colors = ['#57534e', '#44403c', '#78716c', '#292524', '#854d0e', '#3f3f46'];
    let bId = 1;

    newCars.forEach((car) => {
      const rockOffsets = [
        { dx: -46, dy: -32, r: 18, w: 9 },
        { dx: 48, dy: -28, r: 20, w: 11 },
        { dx: -38, dy: 36, r: 19, w: 10 },
        { dx: 52, dy: 34, r: 22, w: 12 },
      ];
      rockOffsets.forEach((off) => {
        newBoulders.push({
          id: bId++,
          x: car.x + off.dx + (Math.random() * 12 - 6),
          y: car.y + off.dy + (Math.random() * 12 - 6),
          vx: 0,
          vy: 0,
          radius: off.r,
          weight: off.w,
          color: colors[Math.floor(Math.random() * colors.length)],
          cleared: false,
        });
      });
    });

    for (let i = 0; i < 45; i++) {
      newBoulders.push({
        id: bId++,
        x: 1200 + Math.random() * 1700,
        y: 420 + Math.random() * 760,
        vx: 0,
        vy: 0,
        radius: 14 + Math.random() * 24,
        weight: Math.round(5 + Math.random() * 15),
        color: colors[Math.floor(Math.random() * colors.length)],
        cleared: false,
      });
    }

    bouldersRef.current = newBoulders;
    particlesRef.current = [];
    shockwavesRef.current = [];
    floatingScoresRef.current = [];

    // Initialize Shield Pickups (Cápsulas de Batería de Escudo)
    shieldPickupsRef.current = [
      { id: 1, x: 880, y: 680, radius: 26, collected: false, respawnTimer: 0 },
      { id: 2, x: 1450, y: 920, radius: 26, collected: false, respawnTimer: 0 },
      { id: 3, x: 2050, y: 620, radius: 26, collected: false, respawnTimer: 0 },
      { id: 4, x: 2650, y: 900, radius: 26, collected: false, respawnTimer: 0 },
      { id: 5, x: 3250, y: 720, radius: 26, collected: false, respawnTimer: 0 },
    ];

    // Reset Super Kinetic Force Shield to full 60s active protection
    isShieldActiveRef.current = true;
    setIsShieldActive(true);
    shieldTimeLeftRef.current = 60;
    setShieldTimeLeft(60);

    setScore(0);
    setClearedTons(0);
    setCarsRescued(0);
    setFuel(100);
    setIntegrity(100);
    setTimeSeconds(0);
    setTimeRemaining(TOTAL_MISSION_TIME);
    setIsVictorious(false);
    setIsGameOver(false);
    setGameOverReason(null);
    gameHourRef.current = 14;
    setGameHour(14);
  }, []);

  // Timer loop & Day/Night progression & Shield management
  useEffect(() => {
    if (isPaused || isVictorious || isGameOver) return;
    const timer = setInterval(() => {
      setTimeSeconds((prev) => prev + 1);

      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsGameOver(true);
          setGameOverReason('time');
          sound.playRockImpact();
        }
        return Math.max(0, next);
      });

      // Super Kinetic Shield timer & recharge management ("más tiempo, más fuerza, que no se acabe tan rápido")
      if (isShieldActiveRef.current && shieldTimeLeftRef.current > 0) {
        shieldTimeLeftRef.current = Math.max(0, shieldTimeLeftRef.current - 1);
        setShieldTimeLeft(shieldTimeLeftRef.current);
        if (shieldTimeLeftRef.current <= 0) {
          isShieldActiveRef.current = false;
          setIsShieldActive(false);
          pushRadio('🛡️ ESCUDO: Energía agotada. Iniciando auto-recarga del generador.', 'info');
        }
      } else if (!isShieldActiveRef.current) {
        // Generous auto-recharge when inactive so it is always ready to protect
        if (shieldTimeLeftRef.current < 60) {
          shieldTimeLeftRef.current = Math.min(60, shieldTimeLeftRef.current + 2);
          setShieldTimeLeft(shieldTimeLeftRef.current);
        }
      }

      // Smooth integrity auto-repair (nanobots) so machinery doesn't break instantly
      setIntegrity((prev) => Math.min(100, prev + 0.35));

      // Shield Pickups Respawn Countdown
      shieldPickupsRef.current.forEach((sp) => {
        if (sp.collected && sp.respawnTimer > 0) {
          sp.respawnTimer -= 1;
          if (sp.respawnTimer <= 0) {
            sp.collected = false;
          }
        }
      });

      if (isAutoDayNight) {
        gameHourRef.current = (gameHourRef.current + 24 / 180) % 24;
        setGameHour(gameHourRef.current);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, isVictorious, isGameOver, isAutoDayNight, pushRadio]);

  // Key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;

      if (e.key === ' ' || e.code === 'Space') {
        playerRef.current.shovelDown = !playerRef.current.shovelDown;
        sound.playHydraulics();
      }
      // Gear shifting keys: [E] Shift Up, [Q] Shift Down
      if (e.key.toLowerCase() === 'e') {
        shiftUp();
      }
      if (e.key.toLowerCase() === 'q') {
        shiftDown();
      }
      // Direct gear selection
      if (e.key === '1') shiftGear('1');
      if (e.key === '2') shiftGear('2');
      if (e.key === '3') shiftGear('3');
      if (e.key === '4') shiftGear('4');
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey) shiftGear('R');
      // Train horn
      if (e.key.toLowerCase() === 'h') {
        triggerTrainHorn();
      }
      // Super Kinetic Shield toggle: [X]
      if (e.key.toLowerCase() === 'x') {
        toggleForceShield();
      }
      // Day / Night toggle
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey) {
        toggleDayNight();
      }
      // Background Church / Highway toggle
      if (e.key.toLowerCase() === 'c') {
        toggleBgScene();
      }
      // Freno Motor / Jake Brake: [B]
      if (e.key.toLowerCase() === 'b') {
        triggerEngineBrake();
      }
      // Toggle 3D Perspective Mode: [V]
      if (e.key.toLowerCase() === 'v') {
        toggle3DMode();
      }
      // Cornetas de Tren de las Grúas: [G]
      if (e.key.toLowerCase() === 'g') {
        triggerCraneTrainHorn();
      }
      if (e.key === 'Escape') {
        setIsPaused((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerTrainHorn, toggleForceShield, toggleDayNight, triggerEngineBrake, triggerCraneTrainHorn, toggle3DMode, toggleBgScene, shiftGear, shiftUp, shiftDown]);

  // Main Simulation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let screenWidth = (canvas.width = window.innerWidth);
    let screenHeight = (canvas.height = window.innerHeight);

    initGameWorld();

    const handleResize = () => {
      if (!canvas) return;
      screenWidth = canvas.width = window.innerWidth;
      screenHeight = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const loop = () => {
      // 1. UPDATE PHYSICS
      if (!isPaused && !isVictorious && !isGameOver) {
        const p = playerRef.current;
        const keys = keysRef.current;

        let throttle = 0;
        let steer = 0;

        const gear = gearRef.current;
        const forwardKey = keys['w'] || keys['arrowup'];
        const reverseKey = keys['s'] || keys['arrowdown'];
        const leftKey = keys['a'] || keys['arrowleft'];
        const rightKey = keys['d'] || keys['arrowright'];

        // Transmission Gear Ratios & Dynamics
        let gearSpeedCap = 3.5;
        let gearTorqueMult = 1.0;

        if (gear === 'N') {
          // Neutral: Engine revs without drive engagement
          gearSpeedCap = 0;
          gearTorqueMult = 0;
          if (forwardKey || reverseKey) throttle = 0;
        } else if (gear === 'R') {
          // Reverse Gear
          gearSpeedCap = 1.6;
          gearTorqueMult = 1.4;
          if (forwardKey) throttle -= 1.0;
          if (reverseKey) throttle += 0.5;

          // Industrial reverse warning beeper
          reverseBeepTimerRef.current++;
          if (reverseBeepTimerRef.current > 45 && Math.abs(p.speed) > 0.05) {
            sound.playReverseBeep();
            reverseBeepTimerRef.current = 0;
          }
        } else if (gear === '1') {
          // 1ª: Low Range Giant Pushing Torque for Heavy Rocks
          gearSpeedCap = 1.4; // ~14 km/h
          gearTorqueMult = 2.6;
          if (forwardKey) throttle += 1.0;
          if (reverseKey) throttle -= 0.5;
        } else if (gear === '2') {
          // 2ª: Medium Pushing & Trench Clearance
          gearSpeedCap = 2.2; // ~24 km/h
          gearTorqueMult = 1.8;
          if (forwardKey) throttle += 1.0;
          if (reverseKey) throttle -= 0.5;
        } else if (gear === '3') {
          // 3ª: Road Transit
          gearSpeedCap = 3.4; // ~38 km/h
          gearTorqueMult = 1.1;
          if (forwardKey) throttle += 1.0;
          if (reverseKey) throttle -= 0.5;
        } else if (gear === '4') {
          // 4ª: High Speed Highway Cruise
          gearSpeedCap = 4.8; // ~52 km/h
          gearTorqueMult = 0.6;
          if (forwardKey) throttle += 1.0;
          if (reverseKey) throttle -= 0.5;
        }

        if (leftKey) steer -= 1;
        if (rightKey) steer += 1;

        const accel = 0.1 * (vehicle.upgrades.engine * 0.35 + 0.8) * (gear === '1' ? 1.4 : 1.0);
        const friction = 0.92;

        p.speed += throttle * accel;
        p.speed = Math.max(-gearSpeedCap, Math.min(gearSpeedCap, p.speed));
        p.speed *= friction;

        // Dynamic Engine RPM calculation
        const targetRpm = Math.round(
          gear === 'N'
            ? (forwardKey ? 2200 : 850)
            : 850 + (Math.abs(p.speed) / (gearSpeedCap || 1)) * 1400 + (throttle !== 0 ? 300 : 0)
        );
        setEngineRpm(targetRpm);

        const turnSpeed = 0.042 * (settings.steeringSensitivity / 6);
        if (Math.abs(p.speed) > 0.04) {
          p.angle += steer * turnSpeed * (p.speed > 0 ? 1 : -1);
        }

        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        p.x = Math.max(120, Math.min(WORLD_WIDTH - 120, p.x));
        p.y = Math.max(280, Math.min(WORLD_HEIGHT - 280, p.y));

        setSpeedKmh(Math.round(Math.abs(p.speed) * 11));

        // REALISTIC GRAPHICS: Tire Skid Marks on asphalt when turning with momentum
        if (Math.abs(p.speed) > 1.4 && Math.abs(steer) > 0.4) {
          skidMarksRef.current.push({
            x: p.x - Math.cos(p.angle) * 20,
            y: p.y - Math.sin(p.angle) * 20,
            alpha: 0.65,
          });
          if (skidMarksRef.current.length > 180) skidMarksRef.current.shift();
        }

        // REALISTIC GRAPHICS: Diesel Exhaust Smoke Plume from Stack
        if (Math.random() < 0.45 || Math.abs(throttle) > 0.1) {
          const exhaustX = p.x - Math.cos(p.angle) * 14 - Math.sin(p.angle) * 12;
          const exhaustY = p.y - Math.sin(p.angle) * 14 + Math.cos(p.angle) * 12;
          particlesRef.current.push({
            x: exhaustX,
            y: exhaustY,
            vx: -Math.cos(p.angle) * 1.5 + (Math.random() - 0.5) * 1.5,
            vy: -Math.sin(p.angle) * 1.5 + (Math.random() - 0.5) * 1.5 - 0.5,
            size: 3 + Math.random() * 4,
            color: throttle !== 0 ? 'rgba(55, 65, 81, 0.65)' : 'rgba(156, 163, 175, 0.4)',
            alpha: 0.7,
            life: 0,
            maxLife: 26,
          });
        }

        if (settings.fuelConsumption && Math.abs(p.speed) > 0.05) {
          setFuel((prev) => {
            const consumptionRate = (p.shovelDown ? 0.007 : 0.0035) * (gear === '1' ? 1.3 : 1.0);
            const next = prev - consumptionRate;
            if (next <= 0) {
              setIsGameOver(true);
              setGameOverReason('fuel');
              pushRadio('🚨 CRÍTICO: Antonio de Prado sin diésel en la máquina. Motor detenido.', 'alert');
            }
            return Math.max(0, next);
          });
        }

        if (screenShakeRef.current > 0) {
          screenShakeRef.current *= 0.88;
          if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
        }

        const cam = cameraRef.current;
        const targetCamX = p.x - screenWidth / 2;
        const targetCamY = p.y - screenHeight / 2;

        cam.x += (targetCamX - cam.x) * 0.08;
        cam.y += (targetCamY - cam.y) * 0.08;

        cam.x = Math.max(0, Math.min(WORLD_WIDTH - screenWidth, cam.x));
        cam.y = Math.max(0, Math.min(WORLD_HEIGHT - screenHeight, cam.y));

        // SHIELD BATTERIES PICKUP LOGIC ("más tiempo, más fuerza, que no se acabe tan rápido")
        shieldPickupsRef.current.forEach((sp) => {
          if (!sp.collected) {
            const d = Math.hypot(p.x - sp.x, p.y - sp.y);
            if (d < p.width * 0.55 + sp.radius) {
              sp.collected = true;
              sp.respawnTimer = 22; // Respawns in 22 seconds
              sound.playShieldPickup();
              screenShakeRef.current = 4;
              shockwavesRef.current.push({
                x: sp.x,
                y: sp.y,
                radius: 15,
                maxRadius: 160,
                alpha: 0.9,
                color: '#38bdf8',
              });
              // Give +30s shield time up to 90s max!
              shieldTimeLeftRef.current = Math.min(90, shieldTimeLeftRef.current + 30);
              setShieldTimeLeft(shieldTimeLeftRef.current);
              isShieldActiveRef.current = true;
              setIsShieldActive(true);
              setIntegrity((prev) => Math.min(100, prev + 35)); // Instant nanobot repair
              triggerScore(250, sp.x, sp.y, '🛡️ ¡BATERÍA DE ESCUDO! (+30s & +FUERZA)', '#38bdf8');
              pushRadio(`⚡ BATERÍA DE ESCUDO: ¡Tiempo extendido a ${shieldTimeLeftRef.current}s! +350% empuje hidráulico.`, 'score');
            }
          }
        });

        // BOULDERS AND SHOVEL PUSHING
        let currentCleared = 0;
        const boulders = bouldersRef.current;
        const isShield = isShieldActiveRef.current && shieldTimeLeftRef.current > 0;

        for (let i = 0; i < boulders.length; i++) {
          const b = boulders[i];
          if (b.cleared) {
            currentCleared += b.weight;
            continue;
          }

          const bladeOffsetX = Math.cos(p.angle) * (p.width * 0.55);
          const bladeOffsetY = Math.sin(p.angle) * (p.width * 0.55);
          const shovelPointX = p.x + bladeOffsetX;
          const shovelPointY = p.y + bladeOffsetY;

          const dx = b.x - shovelPointX;
          const dy = b.y - shovelPointY;
          const dist = Math.hypot(dx, dy);
          const pushRadius = b.radius + (p.shovelDown ? 40 : 24) + (isShield ? 14 : 0);

          if (dist < pushRadius) {
            if (Math.abs(p.speed) > 0.8) {
              if (isShield) {
                // KINETIC SHIELD DEFLECTION: Zero damage, electric repulse boom, shockwaves!
                sound.playShieldDeflect();
                screenShakeRef.current = Math.min(12, screenShakeRef.current + 2);
                shockwavesRef.current.push({
                  x: shovelPointX,
                  y: shovelPointY,
                  radius: 12,
                  maxRadius: 85,
                  alpha: 0.85,
                  color: '#38bdf8',
                });
                for (let k = 0; k < 4; k++) {
                  particlesRef.current.push({
                    x: shovelPointX,
                    y: shovelPointY,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    size: 3 + Math.random() * 3,
                    color: '#38bdf8',
                    alpha: 1,
                    life: 0,
                    maxLife: 20,
                  });
                }
              } else {
                sound.playRockImpact();
                screenShakeRef.current = Math.min(10, screenShakeRef.current + 3);

                if (settings.machineryDamage) {
                  // Greatly reduced base damage so shield/integrity never runs out fast:
                  const damageTaken = p.shovelDown ? 0.03 : 0.12;
                  setIntegrity((prev) => {
                    const next = prev - damageTaken;
                    if (next <= 0) {
                      setIsGameOver(true);
                      setGameOverReason('damage');
                      pushRadio('💥 DESTRUCCIÓN: La cargadora de Antonio de Prado sufrió daño catastrófico.', 'alert');
                    }
                    return Math.max(0, next);
                  });
                }
              }
            }

            // MASSIVE KINETIC SHIELD FORCE (3.5X PUSH MULTIPLIER):
            const shieldMultiplier = isShield ? 3.5 : 1.0;
            const pushMagnitude =
              (Math.abs(p.speed) + 2.5) * (p.shovelDown ? 2.2 : 1.1) * Math.max(0.4, gearTorqueMult) * shieldMultiplier;
            b.vx = Math.cos(p.angle) * pushMagnitude;
            b.vy = Math.sin(p.angle) * pushMagnitude;

            p.speed *= isShield ? 0.98 : (p.shovelDown ? 0.92 : 0.85);

            if (Math.random() < 0.35) {
              particlesRef.current.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 3 + Math.random() * 4,
                color: isShield ? '#38bdf8' : '#78350f',
                alpha: 0.8,
                life: 0,
                maxLife: 25,
              });
            }
          }

          b.x += b.vx;
          b.y += b.vy;
          b.vx *= 0.88;
          b.vy *= 0.88;

          if (b.y < 340 || b.y > 1260 || b.x > WORLD_WIDTH - 200) {
            b.cleared = true;
            currentCleared += b.weight;
            sound.playRockImpact();
            triggerScore(50, b.x, b.y, 'ROCA DESPEJADA', '#f59e0b');
          }
        }
        setClearedTons(currentCleared);

        // CHECK CIVILIAN CARS BLOCKING STATUS & PEOPLE INSIDE
        const cars = carsRef.current;
        const cranes = cranesRef.current;

        cars.forEach((car) => {
          if (car.status === 'rescued' || car.status === 'towed') return;

          const blockingBoulders = boulders.filter(
            (b) => !b.cleared && Math.hypot(b.x - car.x, b.y - car.y) < 85
          );
          car.blockingRocksCount = blockingBoulders.length;

          if (blockingBoulders.length === 0 && car.status === 'trapped') {
            car.status = 'cleared';
            sound.playRadioChirp();
            triggerScore(500, car.x, car.y - 30, `¡VÍA LIBRE (${car.passengerCount} PERSONAS)!`, '#10b981');

            const availableCrane = cranes.find((c) => c.state === 'idle');
            if (availableCrane) {
              availableCrane.state = 'preparing';
              availableCrane.targetCarId = car.id;
              availableCrane.prepTimer = 180;
              availableCrane.sirenActive = true;
              car.assignedCraneId = availableCrane.id;
              car.status = 'waiting_crane';

              sound.playSiren();
              pushRadio(
                `🚨 DESPACHO: ¡Antonio de Prado liberó a ${car.driverName} y sus ${car.passengerCount} ocupantes! ${availableCrane.name} saliendo al rescate.`,
                'crane'
              );
            } else {
              car.status = 'waiting_crane';
              pushRadio(
                `⚠️ ALERTA: ${car.driverName} liberado por Antonio. Todas las grúas ocupadas; en cola de espera.`,
                'alert'
              );
            }
          }

          if (car.assignedCraneId) {
            const crane = cranes.find((c) => c.id === car.assignedCraneId);
            if (crane) {
              const dist = Math.hypot(crane.x - car.x, crane.y - car.y);
              car.distanceToCrane = Math.round(dist);
              car.etaSeconds = Math.max(1, Math.ceil(dist / (2.2 * 60)));
            }
          }
        });

        // AUTONOMOUS RESCUE CRANES AI
        cranes.forEach((crane) => {
          if (crane.state === 'idle') {
            const unassignedCar = cars.find(
              (c) => (c.status === 'cleared' || c.status === 'waiting_crane') && c.assignedCraneId === null
            );
            if (unassignedCar) {
              crane.state = 'preparing';
              crane.targetCarId = unassignedCar.id;
              crane.prepTimer = 180;
              crane.sirenActive = true;
              unassignedCar.assignedCraneId = crane.id;
              sound.playSiren();
              pushRadio(
                `🚨 DESPACHO: ${crane.name} acude al auxilio de ${unassignedCar.driverName}.`,
                'crane'
              );
            }
          } else if (crane.state === 'preparing') {
            crane.prepTimer--;
            if (crane.prepTimer <= 0) {
              crane.state = 'en_route';
              sound.playTrainHorn();
              shockwavesRef.current.push({
                x: crane.x + Math.cos(crane.angle) * 20,
                y: crane.y + Math.sin(crane.angle) * 20,
                radius: 15,
                maxRadius: 200,
                alpha: 0.85,
                color: '#38bdf8',
              });
              pushRadio(`🚒 EN RUTA: ¡${crane.name} despliega con cornetas de tren hacia Km 48!`, 'crane');
            }
          } else if (crane.state === 'en_route') {
            const targetCar = cars.find((c) => c.id === crane.targetCarId);
            if (!targetCar) {
              crane.state = 'idle';
              return;
            }

            const targetX = targetCar.x - 70;
            const targetY = targetCar.y;

            const dx = targetX - crane.x;
            const dy = targetY - crane.y;
            const dist = Math.hypot(dx, dy);
            const targetAngle = Math.atan2(dy, dx);

            // Autonomous periodic train horn blast to clear roadway
            if (dist < 280 && dist > 140 && Math.random() < 0.006) {
              sound.playTrainHorn();
              shockwavesRef.current.push({
                x: crane.x + Math.cos(crane.angle) * 20,
                y: crane.y + Math.sin(crane.angle) * 20,
                radius: 15,
                maxRadius: 210,
                alpha: 0.85,
                color: '#f59e0b',
              });
            }

            let angleDiff = targetAngle - crane.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            crane.angle += angleDiff * 0.055;

            const cruiseSpeed = 2.3;
            crane.speed = Math.min(cruiseSpeed, Math.max(1.0, dist * 0.04));
            crane.x += Math.cos(crane.angle) * crane.speed;
            crane.y += Math.sin(crane.angle) * crane.speed;

            if (dist < 48) {
              crane.state = 'hooking';
              crane.speed = 0;
              crane.hookProgress = 0;
              targetCar.status = 'being_hooked';
              sound.playHydraulics();
              sound.playWinch();

              triggerScore(300, targetCar.x, targetCar.y - 25, 'GRÚA ENGANCHANDO', '#38bdf8');
              pushRadio(
                `⚙️ LLEGADA: ${crane.name} enganchando el vehículo de ${targetCar.driverName}.`,
                'crane'
              );
            }
          } else if (crane.state === 'hooking') {
            crane.hookProgress += 0.008;
            crane.armAngle = Math.sin(crane.hookProgress * Math.PI) * 0.38;

            if (crane.hookProgress >= 1) {
              crane.state = 'towing';
              const targetCar = cars.find((c) => c.id === crane.targetCarId);
              if (targetCar) {
                targetCar.status = 'towed';
                sound.playHorn();
                sound.playSiren();
                pushRadio(
                  `🚛 REMOLQUE: ${targetCar.driverName} y sus acompañantes son trasladados a Zona Segura.`,
                  'crane'
                );
              }
            }
          } else if (crane.state === 'towing') {
            const safeDepotX = 3550;
            const safeDepotY = 760;

            const dx = safeDepotX - crane.x;
            const dy = safeDepotY - crane.y;
            const dist = Math.hypot(dx, dy);
            const targetAngle = Math.atan2(dy, dx);

            let angleDiff = targetAngle - crane.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            crane.angle += angleDiff * 0.05;

            crane.speed = 2.4;
            crane.x += Math.cos(crane.angle) * crane.speed;
            crane.y += Math.sin(crane.angle) * crane.speed;

            const targetCar = cars.find((c) => c.id === crane.targetCarId);
            if (targetCar) {
              const towOffset = 64;
              targetCar.x = crane.x - Math.cos(crane.angle) * towOffset;
              targetCar.y = crane.y - Math.sin(crane.angle) * towOffset;
              targetCar.angle = crane.angle;
            }

            if (dist < 85) {
              if (targetCar) {
                targetCar.status = 'rescued';
                targetCar.rescuedTimestamp = Date.now();
                setCarsRescued((prev) => prev + 1);
                setPersonsRescued((prev) => prev + targetCar.passengerCount);
                sound.playSuccessRescue();

                triggerScore(1500, safeDepotX - 50, safeDepotY - 30, `¡${targetCar.driverName} A SALVO!`, '#10b981');
                pushRadio(
                  `🏆 RESCATE COMPLETADO: ¡${targetCar.driverName} (${targetCar.passengerCount} ocupantes) a salvo! Agradecen a Antonio de Prado (+1,500 PTS).`,
                  'score'
                );
              }

              crane.state = 'returning';
              crane.targetCarId = null;
            }
          } else if (crane.state === 'returning') {
            const dx = crane.baseX - crane.x;
            const dy = crane.baseY - crane.y;
            const dist = Math.hypot(dx, dy);

            const nextCar = cars.find(
              (c) => (c.status === 'cleared' || c.status === 'waiting_crane') && c.assignedCraneId === null
            );
            if (nextCar) {
              crane.state = 'en_route';
              crane.targetCarId = nextCar.id;
              nextCar.assignedCraneId = crane.id;
              sound.playSiren();
              pushRadio(`🚨 REASIGNACIÓN: ${crane.name} acude a auxiliar a ${nextCar.driverName}.`, 'crane');
              return;
            }

            if (dist > 35) {
              const targetAngle = Math.atan2(dy, dx);
              let angleDiff = targetAngle - crane.angle;
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
              crane.angle += angleDiff * 0.05;

              crane.speed = 2.6;
              crane.x += Math.cos(crane.angle) * crane.speed;
              crane.y += Math.sin(crane.angle) * crane.speed;
            } else {
              crane.speed = 0;
              crane.state = 'idle';
              crane.sirenActive = false;
            }
          }
        });

        // Update shockwaves
        for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
          const sw = shockwavesRef.current[i];
          sw.radius += 10;
          sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
          if (sw.radius >= sw.maxRadius) {
            shockwavesRef.current.splice(i, 1);
          }
        }

        // Update floating score texts
        for (let i = floatingScoresRef.current.length - 1; i >= 0; i--) {
          const fs = floatingScoresRef.current[i];
          fs.y += fs.vy;
          fs.life++;
          fs.alpha = Math.max(0, 1 - fs.life / fs.maxLife);
          if (fs.life >= fs.maxLife) {
            floatingScoresRef.current.splice(i, 1);
          }
        }

        // Update particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const pt = particlesRef.current[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life++;
          pt.alpha = 1 - pt.life / pt.maxLife;
          if (pt.life >= pt.maxLife) {
            particlesRef.current.splice(i, 1);
          }
        }

        // Check victory
        const allRescued = cars.every((c) => c.status === 'rescued');
        if (allRescued) {
          setIsVictorious(true);
        }
      }

      // 2. RENDER THE GAME WORLD
      ctx.clearRect(0, 0, screenWidth, screenHeight);

      const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
      const camX = cameraRef.current.x + shakeX;
      const camY = cameraRef.current.y + shakeY;

      ctx.save();

      // 3D PERSPECTIVE GRAPHICS TRANSFORMATION ("y graficos 3d")
      if (is3DMode) {
        const vpCenterX = screenWidth / 2;
        const vpCenterY = screenHeight / 2;
        ctx.translate(vpCenterX, vpCenterY);
        // Tilt camera down in isometric/chase 3D perspective
        ctx.scale(1.04, 0.78);
        ctx.translate(-vpCenterX, -vpCenterY);
      }

      ctx.translate(-camX, -camY);

      // (A) Background Texture: Highway vs Iglesia de San Antonio de Prado
      const currentBg = bgScene === 'iglesia' ? churchImageRef.current : bgImageRef.current;
      if (currentBg && currentBg.complete) {
        ctx.drawImage(currentBg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      } else if (bgImageRef.current && bgImageRef.current.complete) {
        ctx.drawImage(bgImageRef.current, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }

      // NORTHERN HORIZON: Majestic Iglesia de San Antonio de Prado Landmark Panorama
      if (churchImageRef.current && churchImageRef.current.complete) {
        ctx.save();
        // Render church in the mountain horizon overlooking the road
        ctx.drawImage(churchImageRef.current, 1100, 10, 1600, 340);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(1100, 10, 1600, 340);

        // Architectural Landmark Tag
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(1650, 20, 500, 32, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 12px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⛪ PARROQUIA DE SAN ANTONIO DE PRADO • ANTIOQUIA', 1900, 41);
        ctx.restore();
      }

      // (B) Highway Ground Shading with Realistic Asphalt Grain
      ctx.fillStyle = 'rgba(30, 41, 59, 0.78)';
      ctx.fillRect(0, 360, WORLD_WIDTH, 880);

      // (C) Roadside Dirt Ditches
      ctx.fillStyle = 'rgba(69, 26, 3, 0.7)';
      ctx.fillRect(0, 0, WORLD_WIDTH, 360);
      ctx.fillRect(0, 1240, WORLD_WIDTH, 360);

      // REALISTIC GRAPHICS: Tire Skid Marks on Asphalt
      skidMarksRef.current.forEach((sm) => {
        ctx.save();
        ctx.fillStyle = `rgba(15, 23, 42, ${sm.alpha})`;
        ctx.beginPath();
        ctx.ellipse(sm.x, sm.y, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // (D) Guardrails
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 360);
      ctx.lineTo(WORLD_WIDTH, 360);
      ctx.moveTo(0, 1240);
      ctx.lineTo(WORLD_WIDTH, 1240);
      ctx.stroke();

      // 4 Main Traffic Lanes
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.setLineDash([40, 30]);

      [580, 1020].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_WIDTH, y);
        ctx.stroke();
      });

      // Center Divider Dual Yellow Barrier Lines
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([]);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 790);
      ctx.lineTo(WORLD_WIDTH, 790);
      ctx.moveTo(0, 810);
      ctx.lineTo(WORLD_WIDTH, 810);
      ctx.stroke();

      // (E) Base de Grúas y Despacho (Left Side)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(100, 440, 350, 720);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 440, 350, 720);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      for (let sx = 100; sx < 450; sx += 40) {
        ctx.beginPath();
        ctx.moveTo(sx, 440);
        ctx.lineTo(sx + 30, 470);
        ctx.stroke();
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "Chakra Petch", monospace';
      ctx.fillText('🚒 BASE CENTRAL DE GRÚAS Y AUXILIO VIAL', 120, 500);

      // (F) Zona Segura de Evacuación (Right Side)
      ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
      ctx.fillRect(3400, 460, 350, 680);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      ctx.strokeRect(3400, 460, 350, 680);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px "Chakra Petch", monospace';
      ctx.fillText('🏥 ZONA SEGURA • EVACUACIÓN Y TRIAGE', 3420, 510);
      ctx.font = '12px monospace';
      ctx.fillText('+1,500 PUNTOS POR VEHÍCULO ENTREGADO AQUÍ', 3420, 535);

      // (G) Landslide Mud Spread Area in the Center
      ctx.fillStyle = 'rgba(120, 53, 15, 0.55)';
      ctx.beginPath();
      ctx.ellipse(2100, 800, 950, 420, 0, 0, Math.PI * 2);
      ctx.fill();

      // (H) Draw Trapped Civilian Cars WITH VISIBLE DRIVERS AND PASSENGERS ("personas manejando el automóvil")
      carsRef.current.forEach((car) => {
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);

        // Vehicle Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-car.width / 2 + 3, -car.height / 2 + 5, car.width, car.height);

        // Car Metal Body
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(-car.width / 2, -car.height / 2, car.width, car.height, 5);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Windshields & Clear Glass Windows
        // Front Windshield
        ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
        ctx.beginPath();
        ctx.roundRect(car.width * 0.04, -car.height * 0.36, car.width * 0.22, car.height * 0.72, 3);
        ctx.fill();

        // Rear Windshield
        ctx.beginPath();
        ctx.roundRect(-car.width * 0.32, -car.height * 0.36, car.width * 0.18, car.height * 0.72, 3);
        ctx.fill();

        // Cabin Interior Area
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(-car.width * 0.22, -car.height * 0.36, car.width * 0.38, car.height * 0.72);

        // Glass reflection sheen
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-car.width * 0.2, -car.height * 0.3);
        ctx.lineTo(car.width * 0.18, car.height * 0.3);
        ctx.stroke();

        // PEOPLE INSIDE THE AUTOMOBILE:
        // 1. DRIVER (Front-left seat)
        const driverX = car.width * 0.02;
        const driverY = -car.height * 0.16;

        // Driver Torso/Clothes
        ctx.fillStyle = car.driverColor;
        ctx.beginPath();
        ctx.roundRect(driverX - 4, driverY - 5, 8, 10, 2);
        ctx.fill();

        // Driver Head & Hair
        ctx.fillStyle = '#fed7aa'; // Skin tone
        ctx.beginPath();
        ctx.arc(driverX, driverY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#334155'; // Hair
        ctx.beginPath();
        ctx.arc(driverX - 0.5, driverY - 0.8, 3.2, Math.PI * 0.6, Math.PI * 1.8);
        ctx.fill();

        // Steering wheel in driver's hands
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(driverX + 6, driverY, 3, 0, Math.PI * 2);
        ctx.stroke();

        // 2. PASSENGER (Front-right seat)
        if (car.passengerCount >= 2) {
          const passX = car.width * 0.02;
          const passY = car.height * 0.16;

          ctx.fillStyle = car.passengerColor;
          ctx.beginPath();
          ctx.roundRect(passX - 4, passY - 5, 8, 10, 2);
          ctx.fill();

          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.arc(passX, passY, 3.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(passX - 0.5, passY - 0.8, 3.2, Math.PI * 0.5, Math.PI * 1.9);
          ctx.fill();
        }

        // 3. REAR PASSENGERS (Children / Companions in back)
        if (car.passengerCount >= 3) {
          const rear1X = -car.width * 0.16;
          const rear1Y = -car.height * 0.15;
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(rear1X, rear1Y, 2.8, 0, Math.PI * 2);
          ctx.fill();

          if (car.passengerCount >= 4) {
            const rear2X = -car.width * 0.16;
            const rear2Y = car.height * 0.15;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(rear2X, rear2Y, 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 4. ANIMATED WAVING ARMS OUT OF WINDOW
        if (car.status === 'trapped') {
          // Frantic waving arm out of driver's window asking Antonio for help!
          const waveAngle = Math.sin(Date.now() * 0.015 + car.id) * 0.5;
          ctx.save();
          ctx.translate(driverX - 2, driverY - 6);
          ctx.rotate(-Math.PI / 2 + waveAngle);
          ctx.strokeStyle = '#fed7aa';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(8, 0);
          ctx.stroke();
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(9, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (car.status === 'cleared' || car.status === 'waiting_crane' || car.status === 'towed') {
          // Joyful waving thumbs-up to Antonio de Prado!
          const joyWave = Math.sin(Date.now() * 0.01 + car.id) * 0.3;
          ctx.save();
          ctx.translate(driverX - 2, driverY - 6);
          ctx.rotate(-Math.PI / 2 + joyWave);
          ctx.strokeStyle = '#fed7aa';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(9, 0);
          ctx.stroke();
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(10, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Blinking hazard lights
        if (car.status === 'trapped') {
          const blink = Math.floor(Date.now() / 350) % 2 === 0;
          if (blink) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(-car.width / 2, -car.height / 2, 4.5, 0, Math.PI * 2);
            ctx.arc(-car.width / 2, car.height / 2, 4.5, 0, Math.PI * 2);
            ctx.arc(car.width / 2, -car.height / 2, 4.5, 0, Math.PI * 2);
            ctx.arc(car.width / 2, car.height / 2, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();

        // SPEECH BUBBLES & STATUS TAG ABOVE CAR
        ctx.save();
        ctx.translate(car.x, car.y - 42);

        if (car.status === 'trapped') {
          // Distress Speech Bubble asking Antonio for help!
          ctx.fillStyle = 'rgba(225, 29, 72, 0.95)';
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-90, -22, 180, 22, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`🆘 ¡ANTONIO, AYÚDANOS!`, 0, -8);

          // Info tag with driver and passengers
          ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(-85, 3, 170, 20, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`👤 ${car.driverName} (${car.passengerCount} pers.)`, 0, 16);
        } else if (car.status === 'waiting_crane' || car.status === 'cleared') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-100, -24, 200, 44, 8);
          ctx.fill();
          ctx.stroke();

          const ringRadius = 12 + (Date.now() % 1000) * 0.015;
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.beginPath();
          ctx.arc(0, -28, ringRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`🙌 ¡GRACIAS ANTONIO! • GRÚA EN ${car.etaSeconds}s`, 0, -8);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px monospace';
          ctx.fillText(`👤 ${car.driverName} • A ${car.distanceToCrane}m`, 0, 12);
        } else if (car.status === 'being_hooked') {
          ctx.fillStyle = 'rgba(120, 53, 15, 0.95)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-90, -14, 180, 26, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚙️ ENGANCHANDO CABLE DE ARRASTRE', 0, 3);
        } else if (car.status === 'towed') {
          ctx.fillStyle = 'rgba(2, 132, 199, 0.95)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-95, -14, 190, 26, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#bae6fd';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`👋 ¡GRACIAS ANTONIO DE PRADO!`, 0, 3);
        } else if (car.status === 'rescued') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
          ctx.beginPath();
          ctx.roundRect(-75, -14, 150, 26, 6);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`✅ ${car.driverName} A SALVO`, 0, 3);
        }

        ctx.restore();
      });

      // (I) Draw Boulders & Rocks
      bouldersRef.current.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);

        if (b.cleared) {
          ctx.globalAlpha = 0.35;
        }

        // 3D Drop Shadow on Asphalt
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(4, b.radius * 0.45, b.radius * 1.1, b.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Spherical Radial Gradient
        const rockGrad = ctx.createRadialGradient(
          -b.radius * 0.3,
          -b.radius * 0.3,
          b.radius * 0.1,
          0,
          0,
          b.radius
        );
        rockGrad.addColorStop(0, '#a8a29e'); // Light specular crest
        rockGrad.addColorStop(0.5, b.color);
        rockGrad.addColorStop(1, '#1c1917'); // Dark base shadow

        ctx.fillStyle = rockGrad;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(b.radius * 0.3, -b.radius * 0.2, b.radius * 0.45, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
      });

      // (I.2) Draw Shield Batteries Pickups on Highway ("Cápsulas de Escudo")
      shieldPickupsRef.current.forEach((sp) => {
        if (sp.collected) return;
        ctx.save();
        ctx.translate(sp.x, sp.y);

        const bob = Math.sin(Date.now() / 250) * 4;
        const pulse = 0.9 + Math.sin(Date.now() / 180) * 0.12;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, sp.radius * 0.8, sp.radius * 0.9, sp.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing outer aura ring
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, bob, sp.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing shield disc / energy core
        const coreGrad = ctx.createRadialGradient(0, bob, 2, 0, bob, sp.radius);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.35, '#38bdf8');
        coreGrad.addColorStop(0.8, '#0284c7');
        coreGrad.addColorStop(1, 'rgba(3, 105, 161, 0.4)');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, bob, sp.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Shield emblem in center
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, bob - 11);
        ctx.lineTo(8, bob - 5);
        ctx.lineTo(8, bob + 3);
        ctx.quadraticCurveTo(8, bob + 11, 0, bob + 13);
        ctx.quadraticCurveTo(-8, bob + 11, -8, bob + 3);
        ctx.lineTo(-8, bob - 5);
        ctx.closePath();
        ctx.stroke();

        // Floating label
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ ESCUDO +30s', 0, bob - 22);

        ctx.restore();
      });

      // (J) Draw Heavy Rescue Tow Cranes with Driver Inside
      cranesRef.current.forEach((crane) => {
        ctx.save();
        ctx.translate(crane.x, crane.y);
        ctx.rotate(crane.angle);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(-45, -20, 90, 40);

        ctx.fillStyle = crane.color;
        ctx.beginPath();
        ctx.roundRect(-42, -18, 84, 36, 5);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Crane Cabin Glass
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(14, -13, 20, 26);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
        ctx.fillRect(14, -13, 20, 26);

        // Crane Operator in cab
        const crOpX = 22;
        const crOpY = 0;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(crOpX - 4, crOpY - 5, 8, 10, 2);
        ctx.fill();
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(crOpX, crOpY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(crOpX, crOpY - 0.5, 4, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();

        // ROOF-MOUNTED CHROME TRAIN HORNS ON CRANE ("que la grua tenga cornetas de tren")
        ctx.save();
        ctx.fillStyle = '#e2e8f0'; // Chrome silver
        // Left train horn trumpet
        ctx.fillRect(16, -11, 14, 3.5);
        ctx.beginPath();
        ctx.moveTo(30, -13);
        ctx.lineTo(36, -15);
        ctx.lineTo(36, -7);
        ctx.lineTo(30, -9);
        ctx.closePath();
        ctx.fill();
        // Right train horn trumpet
        ctx.fillRect(16, 7.5, 14, 3.5);
        ctx.beginPath();
        ctx.moveTo(30, 5.5);
        ctx.lineTo(36, 3.5);
        ctx.lineTo(36, 11.5);
        ctx.lineTo(30, 9.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Crane Boom Arm
        ctx.fillStyle = '#475569';
        ctx.fillRect(-35, -7, 44, 14);

        ctx.save();
        ctx.translate(-25, 0);
        ctx.rotate(crane.armAngle);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-28, -5, 34, 10);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-28, 0);
        ctx.lineTo(-44, 0);
        ctx.stroke();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-47, 0, 4, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();

        // Dual Emergency Strobes
        if (crane.sirenActive || crane.state !== 'idle') {
          const flash = Math.floor(Date.now() / 140) % 2 === 0;
          ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(8, -14, 5, 0, Math.PI * 2);
          ctx.arc(8, 14, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = flash ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)';
          ctx.beginPath();
          ctx.arc(8, 0, 36, 0, Math.PI * 2);
          ctx.fill();
        }

        // Headlights
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        ctx.moveTo(42, -12);
        ctx.lineTo(240, -50);
        ctx.lineTo(240, 50);
        ctx.lineTo(42, 12);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Crane Label Tag
        ctx.save();
        ctx.translate(crane.x, crane.y - 28);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = crane.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-45, -9, 90, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${crane.code} • ${crane.state === 'en_route' ? 'EN RUTA' : crane.state}`, 0, 3);
        ctx.restore();
      });

      // (K) Draw Sonic Shockwaves from Train Horn ("cornetas de tren")
      shockwavesRef.current.forEach((sw) => {
        ctx.save();
        ctx.globalAlpha = sw.alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // (L) Draw Particles
      particlesRef.current.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // (M) Draw Floating Score Text
      floatingScoresRef.current.forEach((fs) => {
        ctx.save();
        ctx.globalAlpha = fs.alpha;
        ctx.translate(fs.x, fs.y);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.roundRect(-75, -18, 150, fs.subtext ? 36 : 24, 6);
        ctx.fill();
        ctx.strokeStyle = fs.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = fs.color;
        ctx.font = 'bold 14px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = fs.color;
        ctx.shadowBlur = 10;
        ctx.fillText(fs.text, 0, 0);

        if (fs.subtext) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.shadowBlur = 0;
          ctx.fillText(fs.subtext, 0, 13);
        }

        ctx.restore();
      });

      // (N) Draw Player Front Loader Machinery WITH ANTONIO DE PRADO DRIVING
      const p = playerRef.current;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Vehicle Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(-p.width / 2 + 5, -p.height / 2 + 8, p.width, p.height);

      // Main Chassis
      ctx.fillStyle = vehicle.color;
      ctx.beginPath();
      ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 4);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cabin Interior & Glass
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(-p.width * 0.12, -p.height * 0.36, p.width * 0.38, p.height * 0.72);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.fillRect(-p.width * 0.12, -p.height * 0.36, p.width * 0.38, p.height * 0.72);

      // ANTONIO DE PRADO SEATED IN THE CABIN:
      const opX = -p.width * 0.01;
      const opY = 0;

      // High-vis Orange Safety Vest
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(opX - 6, opY - 8, 12, 16, 3);
      ctx.fill();

      // Reflective yellow stripes
      ctx.fillStyle = '#fde047';
      ctx.fillRect(opX - 5, opY - 6, 10, 2);
      ctx.fillRect(opX - 5, opY + 4, 10, 2);

      // Antonio's Head & Face
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(opX, opY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Construction Hard Hat with Safety Visor (Antonio de Prado)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(opX + 0.5, opY, 5.5, Math.PI * 0.7, Math.PI * 2.3);
      ctx.fill();
      ctx.fillRect(opX - 1, opY - 6, 8, 3);

      // Steering Wheel in Antonio's hands
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(opX + 9, opY, 4, 0, Math.PI * 2);
      ctx.stroke();

      // ROOF-MOUNTED TRIPLE TRAIN AIR HORNS ("cornetas de tren")
      ctx.save();
      ctx.translate(p.width * 0.05, 0);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, -11, 14, 22);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-6, -3, 20, 6);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(14, -6);
      ctx.lineTo(20, -9);
      ctx.lineTo(20, 9);
      ctx.lineTo(14, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, -10, 16, 5);
      ctx.beginPath();
      ctx.moveTo(8, -12);
      ctx.lineTo(14, -14);
      ctx.lineTo(14, -2);
      ctx.lineTo(8, -4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, 5, 16, 5);
      ctx.beginPath();
      ctx.moveTo(8, 4);
      ctx.lineTo(14, 2);
      ctx.lineTo(14, 14);
      ctx.lineTo(8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Roof Beacon Strobe
      const pBeacon = Math.floor(Date.now() / 180) % 2 === 0;
      ctx.fillStyle = pBeacon ? '#f59e0b' : '#78350f';
      ctx.beginPath();
      ctx.arc(-8, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Shovel & Hydraulic Arms
      const bladeX = p.width / 2;
      const bladeHeight = p.height * 1.35;
      ctx.fillStyle = p.shovelDown ? '#64748b' : '#94a3b8';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.fillRect(bladeX, -bladeHeight / 2, 16, bladeHeight);
      ctx.strokeRect(bladeX, -bladeHeight / 2, 16, bladeHeight);

      ctx.fillStyle = '#334155';
      ctx.fillRect(bladeX - 18, -bladeHeight * 0.35, 18, 7);
      ctx.fillRect(bladeX - 18, bladeHeight * 0.35 - 7, 18, 7);

      // Headlight Projection Beams
      const hour = gameHourRef.current;
      const isNightTime = hour < 6.5 || hour > 19;
      const headlightAlpha = isNightTime ? 0.75 : 0.3;

      ctx.fillStyle = `rgba(254, 240, 138, ${headlightAlpha})`;
      ctx.beginPath();
      ctx.moveTo(bladeX + 16, -bladeHeight * 0.4);
      ctx.lineTo(bladeX + 380, -bladeHeight * 1.4);
      ctx.lineTo(bladeX + 380, bladeHeight * 1.4);
      ctx.lineTo(bladeX + 16, bladeHeight * 0.4);
      ctx.closePath();
      ctx.fill();

      // KINETIC FORCE SHIELD DOME ("que el escudo tenga más tiempo y más fuerza")
      if (isShieldActiveRef.current && shieldTimeLeftRef.current > 0) {
        const shieldPulse = Math.sin(Date.now() / 140) * 3;
        const shieldWidth = p.width * 1.35 + shieldPulse;
        const shieldHeight = p.height * 1.85 + shieldPulse;

        // Outer pulsing forcefield aura
        const shieldGrad = ctx.createRadialGradient(0, 0, p.width * 0.25, 0, 0, shieldWidth * 0.7);
        shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
        shieldGrad.addColorStop(0.55, 'rgba(6, 182, 212, 0.28)');
        shieldGrad.addColorStop(0.85, 'rgba(14, 165, 233, 0.55)');
        shieldGrad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

        ctx.fillStyle = shieldGrad;
        ctx.beginPath();
        ctx.ellipse(bladeX * 0.15, 0, shieldWidth * 0.65, shieldHeight * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing hexagonal / elliptical perimeter contour
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(bladeX * 0.15, 0, shieldWidth * 0.65, shieldHeight * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Frontal Heavy Deflection Barrier Arc on Blade
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bladeX + 22, 0, bladeHeight * 0.75, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();

        // Hexagonal / energy lattice lines across shield
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.3)';
        ctx.lineWidth = 1;
        for (let a = -28; a <= 28; a += 14) {
          ctx.beginPath();
          ctx.moveTo(-p.width * 0.45, a);
          ctx.lineTo(bladeX + 16, a);
          ctx.stroke();
        }
      }

      ctx.restore();

      // Floating Operator Name Tag and Shield Active Badge above Antonio's machine
      ctx.save();
      ctx.translate(p.x, p.y - 36);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.strokeStyle = isShieldActiveRef.current && shieldTimeLeftRef.current > 0 ? '#38bdf8' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-90, -11, 180, 22, 5);
      ctx.fill();
      ctx.stroke();

      if (isShieldActiveRef.current && shieldTimeLeftRef.current > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`🛡️ ESCUDO TITÁNICO: ${shieldTimeLeftRef.current}s (350% FUERZA)`, 0, 3);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('👷 ANTONIO DE PRADO', 0, 3);
      }
      ctx.restore();

      // (O) DAY / NIGHT ATMOSPHERIC LIGHTING OVERLAY
      let nightDarkness = 0;
      let ambientColor = 'rgba(3, 7, 24, ';

      if (hour >= 6 && hour < 8) {
        const t = (hour - 6) / 2;
        nightDarkness = (1 - t) * 0.75;
        ambientColor = 'rgba(30, 20, 50, ';
      } else if (hour >= 8 && hour < 18) {
        nightDarkness = 0.0;
      } else if (hour >= 18 && hour < 20.5) {
        const t = (hour - 18) / 2.5;
        nightDarkness = t * 0.75;
        ambientColor = 'rgba(70, 25, 10, ';
      } else {
        nightDarkness = 0.85;
        ambientColor = 'rgba(3, 7, 24, ';
      }

      if (nightDarkness > 0.05) {
        ctx.fillStyle = `${ambientColor}${nightDarkness})`;
        ctx.fillRect(camX, camY, screenWidth, screenHeight);

        const pBladeX = p.x + Math.cos(p.angle) * (p.width * 0.6);
        const pBladeY = p.y + Math.sin(p.angle) * (p.width * 0.6);

        const lightGrad = ctx.createRadialGradient(pBladeX, pBladeY, 40, pBladeX, pBladeY, 260);
        lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        lightGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.15)');
        lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.arc(pBladeX, pBladeY, 260, 0, Math.PI * 2);
        ctx.fill();

        const baseGrad = ctx.createRadialGradient(280, 800, 50, 280, 800, 400);
        baseGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        baseGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(280, 800, 400, 0, Math.PI * 2);
        ctx.fill();

        const safeGrad = ctx.createRadialGradient(3550, 800, 50, 3550, 800, 400);
        safeGrad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
        safeGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx.fillStyle = safeGrad;
        ctx.beginPath();
        ctx.arc(3550, 800, 400, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // End World Translation

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [initGameWorld, isPaused, isVictorious, isGameOver, vehicle, settings, pushRadio, triggerScore]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const clearancePercent = Math.min(100, Math.round((clearedTons / targetTons) * 100));

  const isNight = gameHour < 6 || gameHour >= 20;
  const isSunset = gameHour >= 18 && gameHour < 20;
  const isDawn = gameHour >= 6 && gameHour < 8;
  const formattedHour = `${Math.floor(gameHour).toString().padStart(2, '0')}:${Math.floor((gameHour % 1) * 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-white select-none overflow-hidden font-mono">
      {/* Simulation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full block" />

      {/* TOP HUD BAR */}
      <div className="relative z-20 flex items-center justify-between p-3 bg-black/85 backdrop-blur-md border-b border-amber-500/50 shadow-xl">
        {/* Left: Pause, Antonio de Prado Profile & Day/Night Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setIsPaused(true);
            }}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 active:scale-95 transition"
            title="Pausar Operación"
          >
            <Pause className="w-5 h-5" />
          </button>

          {/* ANTONIO DE PRADO BADGE */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/60 shadow">
            <span className="text-base">👷</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-none">
                OPERADOR AL MANDO
              </span>
              <span className="text-xs font-black text-white tracking-wide">ANTONIO DE PRADO</span>
            </div>
          </div>

          {/* DAY / NIGHT TOGGLE BUTTON */}
          <button
            onClick={toggleDayNight}
            className={`px-3 py-1.5 rounded-lg border font-black text-xs flex items-center gap-2 transition active:scale-95 shadow ${
              isNight
                ? 'bg-indigo-950/90 border-indigo-400 text-indigo-300'
                : isSunset
                ? 'bg-amber-950/90 border-amber-400 text-amber-300'
                : 'bg-sky-950/90 border-sky-400 text-sky-200'
            }`}
            title="Alternar Día / Noche [N]"
          >
            {isNight ? (
              <Moon className="w-4 h-4 text-indigo-300 animate-pulse" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
            )}
            <span>
              {formattedHour} {isNight ? 'NOCHE' : isSunset ? 'ATARDECER' : isDawn ? 'AMANECER' : 'DÍA'}
            </span>
          </button>
        </div>

        {/* Center: Score Display & Secondary Avalanche Warning */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            <Trophy className="w-4 h-4 text-amber-300 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">PUNTUACIÓN</span>
              <span className="text-sm sm:text-base font-black text-white tracking-wider font-mono">
                {score.toLocaleString()} <span className="text-amber-400 text-xs">PTS</span>
              </span>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 shadow transition ${
              timeRemaining < 60
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${timeRemaining < 60 ? 'text-rose-400' : 'text-amber-400'}`} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                ALUD SECUNDARIO EN:
              </span>
              <span className="text-sm font-black font-mono">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* SUPER ESCUDO DE FUERZA TITÁNICO STATUS BADGE */}
          <div
            className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 shadow transition ${
              isShieldActive && shieldTimeLeft > 0
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Shield className={`w-4 h-4 ${isShieldActive && shieldTimeLeft > 0 ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-wider text-cyan-400">
                ESCUDO TITÁNICO
              </span>
              <span className="text-xs font-black font-mono text-cyan-200">
                {isShieldActive && shieldTimeLeft > 0 ? `${shieldTimeLeft}s (+350% FUERZA)` : 'RECARGANDO'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Rescued Persons, Rescued Cars, Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PERSONAS RESCATADAS BADGE */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-950/80 border border-sky-500/50 text-xs">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="text-sky-300 font-bold">
              PERSONAS: {personsRescued}/{totalPersons}
            </span>
          </div>

          {/* AUTOS EVACUADOS BADGE */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-xs">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 font-bold">
              AUTOS: {carsRescued}/{totalCars}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setIsPaused(true);
              onOpenSettings();
            }}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Configuración"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* TOP-RIGHT: TACTICAL RADAR MINIMAP */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="w-56 sm:w-64 h-32 rounded-lg bg-black/85 border-2 border-emerald-500/70 p-2 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-950/20" />
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.4) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative z-10 flex items-center justify-between text-[9px] font-bold text-emerald-400 border-b border-emerald-500/30 pb-1 mb-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RADAR GPS • AUTOPISTA 3.8 KM
            </span>
            <span className="text-[8px] text-slate-400">{isNight ? 'MODO NOCTURNO' : 'MODO DIURNO'}</span>
          </div>

          <div className="relative w-full h-20 bg-slate-900/80 rounded border border-slate-800 overflow-hidden">
            <div className="absolute left-[3%] top-[25%] w-[8%] h-[50%] bg-sky-500/30 border border-sky-400 rounded-xs" />
            <div className="absolute right-[3%] top-[25%] w-[8%] h-[50%] bg-emerald-500/30 border border-emerald-400 rounded-xs" />
            <div className="absolute left-[35%] top-[20%] w-[42%] h-[60%] bg-amber-900/40 rounded-full" />

            {/* Cars Markers */}
            {carsRef.current.map((c) => {
              const rx = (c.x / WORLD_WIDTH) * 100;
              const ry = (c.y / WORLD_HEIGHT) * 100;
              return (
                <div
                  key={c.id}
                  className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    c.status === 'rescued'
                      ? 'bg-emerald-400'
                      : c.status === 'towed'
                      ? 'bg-sky-400 animate-ping'
                      : c.status === 'waiting_crane'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-red-500 animate-ping'
                  }`}
                  style={{ left: `${rx}%`, top: `${ry}%` }}
                />
              );
            })}

            {/* Cranes Markers */}
            {cranesRef.current.map((cr) => {
              const rx = (cr.x / WORLD_WIDTH) * 100;
              const ry = (cr.y / WORLD_HEIGHT) * 100;
              return (
                <div
                  key={cr.id}
                  className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 border border-black shadow"
                  style={{ left: `${rx}%`, top: `${ry}%` }}
                  title={cr.name}
                />
              );
            })}

            {/* Player marker (Antonio de Prado) */}
            <div
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-emerald-400 border border-white rounded-full shadow-[0_0_8px_#34d399]"
              style={{
                left: `${(playerRef.current.x / WORLD_WIDTH) * 100}%`,
                top: `${(playerRef.current.y / WORLD_HEIGHT) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* CRANE FLEET DISPATCH MONITOR */}
        <div className="w-56 sm:w-64 rounded-lg bg-black/85 border border-slate-700/80 p-2.5 backdrop-blur-md shadow-xl text-[10px]">
          <div className="flex items-center justify-between text-amber-400 font-bold mb-1.5 border-b border-slate-800 pb-1">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              FLOTA DE GRÚAS (5 UNIDADES)
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {cranesRef.current.map((crane) => (
              <div
                key={crane.id}
                className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-900/60 border border-slate-800/80"
              >
                <span className="font-bold text-slate-300">{crane.code}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                    crane.state === 'idle'
                      ? 'text-slate-400'
                      : crane.state === 'preparing'
                      ? 'text-amber-400 bg-amber-950/60 animate-pulse'
                      : crane.state === 'en_route'
                      ? 'text-yellow-300 bg-yellow-950/60'
                      : crane.state === 'hooking'
                      ? 'text-orange-400 bg-orange-950/60'
                      : crane.state === 'towing'
                      ? 'text-sky-300 bg-sky-950/60'
                      : 'text-emerald-400'
                  }`}
                >
                  {crane.state === 'idle'
                    ? 'EN BASE'
                    : crane.state === 'preparing'
                    ? 'ALISTANDO'
                    : crane.state === 'en_route'
                    ? 'EN RUTA'
                    : crane.state === 'hooking'
                    ? 'ENGANCHE'
                    : crane.state === 'towing'
                    ? 'REMOLCANDO'
                    : 'RETORNO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP-LEFT: RADIO CB DISPATCH LOG */}
      <div className="hidden md:flex absolute top-20 left-4 z-20 max-w-sm flex-col gap-1.5 pointer-events-none">
        <div className="bg-black/85 border border-emerald-500/50 rounded-lg p-2.5 backdrop-blur-md shadow-lg text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-emerald-500/30 pb-1 mb-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>RADIO CB CANAL 16 • CENTRAL DE RESCATE</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-28 overflow-hidden">
            {radioLog.map((log) => (
              <p key={log.id} className="text-slate-300 text-[10px] leading-tight">
                <span className="text-slate-500 font-mono">[{log.time}] </span>
                <span
                  className={
                    log.type === 'alert'
                      ? 'text-rose-400 font-bold'
                      : log.type === 'crane'
                      ? 'text-amber-300 font-bold'
                      : log.type === 'score'
                      ? 'text-yellow-300 font-bold'
                      : 'text-emerald-300'
                  }
                >
                  {log.text}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM COCKPIT & CONTROLS HUD */}
      <div className="fixed bottom-4 left-4 right-4 z-20 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
        {/* Left: Engine gauges (Speed, RPM, Fuel, Integrity) */}
        <div className="pointer-events-auto flex items-center gap-3 p-2.5 rounded-xl bg-black/85 border border-slate-800 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col items-center">
            <Gauge className="w-4 h-4 text-amber-400 mb-0.5" />
            <span className="text-base sm:text-lg font-black text-white">{speedKmh}</span>
            <span className="text-[8px] text-slate-400">KM/H</span>
          </div>

          <div className="flex flex-col items-center">
            <RotateCw className="w-4 h-4 text-sky-400 mb-0.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-base sm:text-lg font-black text-sky-300 font-mono">{engineRpm}</span>
            <span className="text-[8px] text-slate-400">RPM</span>
          </div>

          <div className="h-9 w-px bg-slate-800 mx-0.5" />

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <Fuel className={`w-3.5 h-3.5 ${fuel < 20 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${fuel < 20 ? 'bg-rose-500' : 'bg-amber-400'}`}
                  style={{ width: `${fuel}%` }}
                />
              </div>
              <span className={`text-[10px] ${fuel < 20 ? 'text-rose-300 font-bold' : 'text-slate-300'}`}>
                {Math.round(fuel)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Shield className={`w-3.5 h-3.5 ${integrity < 25 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${integrity < 25 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                  style={{ width: `${integrity}%` }}
                />
              </div>
              <span className={`text-[10px] ${integrity < 25 ? 'text-rose-300 font-bold' : 'text-slate-300'}`}>
                {Math.round(integrity)}%
              </span>
            </div>

            {/* SUPER ESCUDO DE FUERZA TITÁNICO STATUS ("más tiempo, más fuerza") */}
            <div className="flex items-center gap-2" title="Duración y Energía de Escudo de Fuerza Titánico [X]">
              <Zap className={`w-3.5 h-3.5 ${isShieldActive && shieldTimeLeft > 0 ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isShieldActive && shieldTimeLeft > 0
                      ? 'bg-gradient-to-r from-cyan-400 to-sky-300 shadow-[0_0_8px_#38bdf8]'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${Math.min(100, (shieldTimeLeft / 60) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-cyan-300 font-mono font-bold">
                {shieldTimeLeft}s
              </span>
            </div>
          </div>
        </div>

        {/* Center: PALANCA DE CAMBIOS ("meter cambios al carro") */}
        <div className="pointer-events-auto flex items-center gap-2 p-2 rounded-xl bg-black/90 border-2 border-amber-500/70 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col items-center pr-2 border-r border-slate-800">
            <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">TRANSMISIÓN</span>
            <span className="text-xs font-black text-white">MANUAL</span>
          </div>

          {/* Quick Downshift [Q] */}
          <button
            onClick={shiftDown}
            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center justify-center border border-slate-700 active:scale-90 transition"
            title="Bajar Marcha [Q]"
          >
            Q-
          </button>

          {/* Gear buttons: R, N, 1, 2, 3, 4 */}
          <div className="flex items-center gap-1">
            {(['R', 'N', '1', '2', '3', '4'] as Gear[]).map((g) => {
              const isActive = currentGear === g;
              return (
                <button
                  key={g}
                  onClick={() => shiftGear(g)}
                  className={`w-7 h-8 rounded text-xs font-black transition-all flex flex-col items-center justify-center ${
                    isActive
                      ? g === 'R'
                        ? 'bg-rose-600 text-white border-2 border-rose-400 shadow-[0_0_12px_#e11d48] scale-105'
                        : g === 'N'
                        ? 'bg-slate-600 text-white border-2 border-slate-400 shadow scale-105'
                        : 'bg-amber-400 text-black border-2 border-amber-300 shadow-[0_0_12px_#f59e0b] scale-105'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Engranar ${g}ª`}
                >
                  <span>{g}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Upshift [E] */}
          <button
            onClick={shiftUp}
            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center justify-center border border-slate-700 active:scale-90 transition"
            title="Subir Marcha [E]"
          >
            E+
          </button>
        </div>

        {/* Right: Church background toggle, Train Horn, Super Force Shield & Shovel toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* TOGGLE 3D / 2D GRAPHICS MODE */}
          <button
            onClick={toggle3DMode}
            className={`px-3 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition active:scale-95 flex items-center gap-1.5 border ${
              is3DMode
                ? 'bg-indigo-950/90 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Alternar Gráficos 3D / 2D [V]"
          >
            <span>🎥</span>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-black">{is3DMode ? 'MODO 3D ACTIVO' : 'MODO 2D'}</span>
              <span className="text-[8px] text-slate-400 font-normal">TECLA [V]</span>
            </div>
          </button>

          {/* ENGINE BRAKE (FRENO MOTOR / JAKE BRAKE) */}
          <button
            onClick={triggerEngineBrake}
            className={`px-3 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition active:scale-95 flex items-center gap-1.5 border-2 ${
              isEngineBrakeActive
                ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_20px_#e11d48] scale-105 animate-pulse'
                : 'bg-rose-950/80 border-rose-600/80 text-rose-300 hover:bg-rose-900/80'
            }`}
            title="Activar Freno de Motor (Jake Brake) [B]"
          >
            <span>🛑</span>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-black">FRENO MOTOR</span>
              <span className="text-[8px] font-mono font-bold text-rose-400">TECLA [B]</span>
            </div>
          </button>

          {/* CRANE FLEET TRAIN HORN BUTTON */}
          <button
            onClick={triggerCraneTrainHorn}
            className="px-3 py-3 rounded-xl font-black uppercase text-xs tracking-wider bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-500/60 shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-95 transition flex items-center gap-1.5"
            title="Sonar Cornetas de Tren de las Grúas [G]"
          >
            <span className="text-base">🚒</span>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-black">BOCINA GRÚA</span>
              <span className="text-[8px] font-mono text-sky-400 font-bold">[G]</span>
            </div>
          </button>

          {/* TOGGLE FONDO IGLESIA SAN ANTONIO DE PRADO */}
          <button
            onClick={toggleBgScene}
            className={`px-3 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition active:scale-95 flex items-center gap-1.5 border ${
              bgScene === 'iglesia'
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Cambiar Fondo: Autopista / Iglesia San Antonio de Prado [C]"
          >
            <span>⛪</span>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-black">
                {bgScene === 'iglesia' ? 'FONDO: IGLESIA' : 'VER IGLESIA'}
              </span>
              <span className="text-[8px] text-slate-400 font-normal">[C]</span>
            </div>
          </button>

          {/* TRAIN AIR HORN BUTTON */}
          <button
            onClick={triggerTrainHorn}
            className="px-3 py-3 rounded-xl font-black uppercase text-xs tracking-wider bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-90 transition flex items-center gap-1.5 border border-yellow-300"
            title="Sonar Cornetas de Tren [H]"
          >
            <span className="text-base">🚆</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-black">CORNETAS</span>
              <span className="text-[8px] font-mono text-slate-900 font-bold">[H]</span>
            </div>
          </button>

          {/* SUPER ESCUDO DE FUERZA TITÁNICO BUTTON ("que el escudo tenga más tiempo y más fuerza, que no se acabe tan rápido") */}
          <button
            onClick={toggleForceShield}
            className={`px-3.5 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all active:scale-90 flex items-center gap-2 border-2 ${
              isShieldActive && shieldTimeLeft > 0
                ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 text-black border-cyan-300 shadow-[0_0_22px_rgba(6,182,212,0.85)] scale-105 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/50'
            }`}
            title="Activar / Desactivar Escudo de Fuerza Titánico [X] (+TIEMPO +FUERZA)"
          >
            <Shield className={`w-5 h-5 ${isShieldActive && shieldTimeLeft > 0 ? 'text-black' : 'text-cyan-400'}`} />
            <div className="flex flex-col text-left leading-none">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black">
                  {isShieldActive && shieldTimeLeft > 0 ? 'ESCUDO ACTIVO' : 'ACTIVAR ESCUDO'}
                </span>
                <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${
                  isShieldActive && shieldTimeLeft > 0 ? 'bg-black/30 text-slate-900' : 'bg-cyan-950 text-cyan-300'
                }`}>
                  {shieldTimeLeft}s
                </span>
              </div>
              <span className="text-[8px] font-mono font-bold text-cyan-100">
                {isShieldActive && shieldTimeLeft > 0 ? '+350% FUERZA [X]' : 'LISTO [X]'}
              </span>
            </div>
          </button>

          {/* SHOVEL TOGGLE BUTTON */}
          <button
            onClick={() => {
              playerRef.current.shovelDown = !playerRef.current.shovelDown;
              sound.playHydraulics();
            }}
            className={`px-4 py-3 rounded-xl font-black uppercase text-xs tracking-wider shadow-xl active:scale-95 transition flex items-center gap-1.5 ${
              playerRef.current.shovelDown
                ? 'bg-amber-400 text-black shadow-[0_0_20px_#f59e0b]'
                : 'bg-slate-800 text-amber-400 border border-amber-500/50'
            }`}
          >
            <span>⚙️</span>
            <span>{playerRef.current.shovelDown ? 'PALA ABAJO' : 'BAJAR PALA'}</span>
          </button>
        </div>
      </div>

      {/* PAUSE MODAL */}
      {isPaused && !isVictorious && !isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border-2 border-amber-500 bg-slate-950 p-6 flex flex-col gap-5 shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-scaleUp">
            <div className="text-center border-b border-slate-800 pb-3">
              <h2 className="text-2xl font-black uppercase text-amber-400 tracking-wider">
                OPERACIÓN PAUSADA
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                OPERADOR: <strong className="text-white">ANTONIO DE PRADO</strong> • PUNTOS:{' '}
                <strong className="text-amber-400">{score.toLocaleString()} PTS</strong>
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  sound.playClick();
                  setIsPaused(false);
                }}
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-sm tracking-wider transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>REANUDAR OPERACIÓN</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  initGameWorld();
                  setIsPaused(false);
                }}
                className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase text-xs tracking-wider transition active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>REINICIAR MISIÓN</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenSettings();
                }}
                className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold uppercase text-xs tracking-wider transition active:scale-95 border border-slate-800 flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>CONFIGURACIÓN DEL JUEGO</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onBackToMenu();
                }}
                className="w-full py-3 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold uppercase text-xs tracking-wider transition active:scale-95 border border-rose-800/40 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>VOLVER AL MENÚ PRINCIPAL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {isGameOver && !isVictorious && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl border-2 border-rose-600 bg-slate-950 p-6 flex flex-col items-center text-center gap-5 shadow-[0_0_60px_rgba(225,29,72,0.5)] animate-scaleUp">
            <div className="w-20 h-20 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-500 shadow-xl animate-pulse">
              <AlertOctagon className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-rose-400 block mb-1">
                OPERACIÓN FALLIDA • MISIÓN PERDIDA
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wider">
                {gameOverReason === 'fuel' && 'SIN COMBUSTIBLE EN LA ZONA'}
                {gameOverReason === 'damage' && 'MAQUINARIA DESTRUIDA'}
                {gameOverReason === 'time' && 'COLAPSO DE MONTAÑA INMINENTE'}
              </h2>
              <p className="text-xs text-rose-200/80 mt-2 leading-relaxed">
                {gameOverReason === 'fuel' &&
                  'El cargador frontal de Antonio de Prado ha agotado su reserva de diésel. No es posible continuar con las maniobras de auxilio.'}
                {gameOverReason === 'damage' &&
                  'Impactos violentos y continuos contra peñascos de más de 10 toneladas han destrozado el chasis de la cargadora de Antonio de Prado.'}
                {gameOverReason === 'time' &&
                  'El tiempo límite se agotó y un alud secundario catastrófico ha sepultado el tramo de autopista antes de poder evacuar a todos los civiles.'}
              </p>
            </div>

            {/* Failure Statistics */}
            <div className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">PUNTOS</span>
                <span className="text-amber-400 font-black text-base">{score.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">PERSONAS</span>
                <span className="text-sky-400 font-black text-base">{personsRescued}/{totalPersons}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">AUTOS</span>
                <span className="text-emerald-400 font-black text-base">{carsRescued}/{totalCars}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  sound.playClick();
                  initGameWorld();
                }}
                className="flex-1 py-3.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black uppercase text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>REINTENTAR CON ANTONIO</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onBackToMenu();
                }}
                className="flex-1 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase text-xs active:scale-95 transition"
              >
                VOLVER AL MENÚ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL WITH ANTONIO DE PRADO HIGHLIGHT */}
      {isVictorious && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl border-2 border-emerald-500 bg-slate-950 p-6 flex flex-col items-center text-center gap-5 shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-scaleUp">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl">
              <Trophy className="w-12 h-12 text-yellow-400" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
                ¡HÉROE DE LA AUTOPISTA: ANTONIO DE PRADO!
              </span>
              <h2 className="text-2xl font-black uppercase text-white tracking-wider">
                ¡RESCATE VIAL CULMINADO CON ÉXITO!
              </h2>
              <div className="my-3 px-5 py-2.5 rounded-xl bg-amber-500/20 border-2 border-amber-400 inline-block">
                <span className="text-xs text-amber-300 font-bold block uppercase tracking-wider">PUNTUACIÓN FINAL</span>
                <span className="text-3xl font-black text-white font-mono">{score.toLocaleString()} PTS</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                ¡Hazaña heroica de <strong className="text-amber-400">Antonio de Prado</strong>! Has despejado {clearedTons} toneladas de rocas y rescatado con vida a las <strong className="text-white">{totalPersons} personas</strong> que viajaban en los {totalCars} automóviles siniestrados.
              </p>
            </div>

            <div className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-around text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">PERSONAS A SALVO</span>
                <span className="text-sky-400 font-black text-lg">{personsRescued}/{totalPersons}</span>
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px]">AUTOS REMOLCADOS</span>
                <span className="text-emerald-400 font-black text-lg">{carsRescued}/{totalCars}</span>
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px]">TIEMPO TOTAL</span>
                <span className="text-amber-400 font-black text-lg">{formatTime(timeSeconds)}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  sound.playClick();
                  initGameWorld();
                }}
                className="flex-1 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase text-xs active:scale-95 transition"
              >
                JUGAR DE NUEVO
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onBackToMenu();
                }}
                className="flex-1 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black uppercase text-xs shadow-lg active:scale-95 transition"
              >
                VOLVER AL MENÚ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
