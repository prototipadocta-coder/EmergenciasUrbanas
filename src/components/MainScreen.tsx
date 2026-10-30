import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sliders,
  Play,
  Truck,
  Layers,
  Zap,
  Gauge,
  Pause,
  Info,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import bgImage from '../assets/images/landslide_emergency_bg_1790259235783.jpg';
import rescueCranesImg from '../assets/images/rescue_cranes_highway_1790260746948.jpg';
import iglesiaBgImg from '../assets/images/iglesia_san_antonio_prado_1790863165632.jpg';
import { GameSettings } from '../types/game';
import { sound } from '../utils/audio';
import { MiniMap } from './MiniMap';

interface MainScreenProps {
  settings: GameSettings;
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onToggleAudio: () => void;
  isAudioMuted: boolean;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  settings,
  onPlay,
  onOpenGarage,
  onOpenSettings,
  onToggleAudio,
  isAudioMuted,
}) => {
  // HUD states matching reference image
  const [tasksEnabled, setTasksEnabled] = useState<boolean>(true);
  const [objectivesEnabled, setObjectivesEnabled] = useState<boolean>(true);
  const [particlesEnabled, setParticlesEnabled] = useState<boolean>(true);

  // Background toggle: landslide vs cranes vs iglesia san antonio de prado
  const [bgMode, setBgMode] = useState<'landslide' | 'cranes' | 'iglesia'>('iglesia');

  // Top right icon toggles
  const [machineryActive, setMachineryActive] = useState<boolean>(true);
  const [cargoActive, setCargoActive] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [ecoActive, setEcoActive] = useState<boolean>(true);
  const [gaugeOverlay, setGaugeOverlay] = useState<boolean>(true);

  // Modal for tasks / objectives inspection / photo showcase
  const [activeModal, setActiveModal] = useState<'tasks' | 'objectives' | 'info' | 'cranes_photo' | 'church_photo' | null>(null);

  const handlePlayClick = () => {
    sound.playClick();
    onPlay();
  };

  const handleGarageClick = () => {
    sound.playClick();
    onOpenGarage();
  };

  const handleSettingsClick = () => {
    sound.playClick();
    onOpenSettings();
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-black text-white select-none overflow-hidden font-sans">
      {/* Background Landslide / Rescue Cranes Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-[1.01]"
        style={{
          backgroundImage: `url(${
            bgMode === 'iglesia' ? iglesiaBgImg : bgMode === 'cranes' ? rescueCranesImg : bgImage
          })`,
          backgroundPosition: 'center 48%',
        }}
      >
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
      </div>

      {/* TOP-LEFT: MiniMap HUD and Checklists */}
      <div className="absolute top-4 left-4 z-30 max-w-[280px]">
        <MiniMap
          tasksEnabled={tasksEnabled}
          objectivesEnabled={objectivesEnabled}
          particlesEnabled={particlesEnabled}
          onToggleTasks={() => {
            setTasksEnabled(!tasksEnabled);
            setActiveModal('tasks');
          }}
          onToggleObjectives={() => {
            setObjectivesEnabled(!objectivesEnabled);
            setActiveModal('objectives');
          }}
          onToggleParticles={() => setParticlesEnabled(!particlesEnabled)}
        />
      </div>

      {/* TOP-RIGHT: HUD Tool Buttons matching reference screenshot */}
      <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
        {/* Primary Row matching screenshot */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-slate-700/80 shadow-2xl">
          {/* Heavy Machinery / Trailer Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setMachineryActive(!machineryActive);
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center transition-all ${
              machineryActive
                ? 'bg-slate-800 text-slate-100 border border-slate-500 shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                : 'bg-black/60 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
            title="Tren de Rodaje y Maquinaria"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Truck Cargo Icon */}
          <button
            onClick={() => {
              sound.playClick();
              setCargoActive(!cargoActive);
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center transition-all ${
              cargoActive
                ? 'bg-slate-800 text-slate-100 border border-slate-500 shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                : 'bg-black/60 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
            title="Unidad de Acarreo / Volquete"
          >
            <Truck className="w-5 h-5" />
          </button>

          {/* Pause / Quick Menu */}
          <button
            onClick={() => {
              sound.playClick();
              setIsPaused(!isPaused);
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center transition-all ${
              isPaused
                ? 'bg-amber-600 text-black border border-amber-400'
                : 'bg-slate-800 text-slate-100 border border-slate-500 hover:text-white'
            }`}
            title="Pausar / Menú Rápido"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>

          {/* Green Electric / Battery Icon with lightning */}
          <button
            onClick={() => {
              sound.playClick();
              setEcoActive(!ecoActive);
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center transition-all ${
              ecoActive
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500 shadow-[0_0_10px_#10b981]'
                : 'bg-black/60 text-emerald-800 border border-emerald-900'
            }`}
            title="Asistencia Eléctrica / Modo Eco"
          >
            <Zap className="w-5 h-5 fill-current" />
          </button>

          {/* Red Speedometer / Gauge Icon */}
          <button
            onClick={() => {
              sound.playClick();
              setGaugeOverlay(!gaugeOverlay);
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center transition-all ${
              gaugeOverlay
                ? 'bg-rose-950 text-rose-400 border border-rose-500 shadow-[0_0_10px_#f43f5e]'
                : 'bg-black/60 text-rose-800 border border-rose-900'
            }`}
            title="Telemetría y Tacómetro"
          >
            <Gauge className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Row: Audio & Settings Shortcut */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/60 backdrop-blur-md border border-slate-800 text-xs font-mono">
          {/* View Rescue Cranes Photo Button */}
          {/* View Church Photo */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('church_photo');
            }}
            className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center gap-1.5 shadow transition active:scale-95"
            title="Ver Fotografía de la Iglesia de San Antonio de Prado"
          >
            <span>⛪</span>
            <span className="hidden sm:inline text-[10px]">IGLESIA S.A.P.</span>
          </button>

          {/* View Rescue Cranes Photo */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('cranes_photo');
            }}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold flex items-center gap-1.5 border border-slate-700 shadow transition active:scale-95"
            title="Ver Fotografía del Rescate con Grúas"
          >
            <span>📸</span>
            <span className="hidden sm:inline text-[10px]">FOTO GRÚAS</span>
          </button>

          {/* Toggle Background (Cycles between Iglesia, Grúas, Alud) */}
          <button
            onClick={() => {
              sound.playClick();
              setBgMode((prev) => (prev === 'iglesia' ? 'cranes' : prev === 'cranes' ? 'landslide' : 'iglesia'));
            }}
            className="px-2 py-1 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition text-[10px]"
            title="Alternar Imagen de Fondo"
          >
            FONDO: {bgMode === 'iglesia' ? 'IGLESIA' : bgMode === 'cranes' ? 'GRÚAS' : 'ALUD'}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleAudio();
            }}
            className="p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title={isAudioMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('info');
            }}
            className="p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title="Información del Simulador"
          >
            <Info className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* CENTER: Main Menu Brushed Metallic Buttons (Faithful to Reference Mockup) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="pointer-events-auto flex flex-col items-center gap-3.5 w-full max-w-xs sm:max-w-md px-4">
          {/* JUGAR Button: Heavy Brushed Metallic Plaque with 3D Bevel & Drop Shadow */}
          <button
            onClick={handlePlayClick}
            onMouseEnter={() => sound.playHover()}
            className="relative w-full group overflow-hidden rounded-lg transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              padding: '4px',
              background: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 30%, #334155 50%, #94a3b8 70%, #1e293b 100%)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.85), inset 0 2px 2px rgba(255, 255, 255, 0.7), inset 0 -2px 4px rgba(0, 0, 0, 0.9)',
            }}
          >
            {/* Metallic Inner Container */}
            <div
              className="relative w-full py-4 sm:py-5 px-8 rounded-md flex items-center justify-center transition-all"
              style={{
                background: 'linear-gradient(180deg, #64748b 0%, #334155 45%, #1e293b 50%, #0f172a 100%)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.5), inset 0 -2px 5px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Glossy top metallic sheen */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

              {/* JUGAR Typography matching screenshot */}
              <span
                className="relative z-10 text-4xl sm:text-5xl font-black tracking-[0.18em] uppercase text-white font-mono drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] group-hover:text-amber-300 transition-colors"
                style={{
                  fontFamily: "'Oswald', 'Chakra Petch', sans-serif",
                  letterSpacing: '0.14em',
                }}
              >
                JUGAR
              </span>
            </div>
          </button>

          {/* GARAJE Button: Heavy Metallic Frame */}
          <button
            onClick={handleGarageClick}
            onMouseEnter={() => sound.playHover()}
            className="relative w-full group overflow-hidden rounded-lg transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              padding: '2.5px',
              background: 'linear-gradient(135deg, #94a3b8 0%, #475569 50%, #1e293b 100%)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.75)',
            }}
          >
            <div
              className="relative w-full py-2.5 sm:py-3 px-6 rounded-md flex items-center justify-center bg-slate-900/90 group-hover:bg-slate-800 transition-all"
              style={{
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span
                className="text-2xl sm:text-3xl font-black tracking-[0.15em] uppercase text-slate-100 font-mono drop-shadow group-hover:text-amber-300 transition-colors"
                style={{
                  fontFamily: "'Oswald', 'Chakra Petch', sans-serif",
                }}
              >
                GARAJE
              </span>
            </div>
          </button>

          {/* CONFIGURACIÓN Button (Directly opens the 2nd screen requested by user) */}
          <button
            onClick={handleSettingsClick}
            onMouseEnter={() => sound.playHover()}
            className="relative w-full group overflow-hidden rounded-lg transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              padding: '2.5px',
              background: 'linear-gradient(135deg, #94a3b8 0%, #475569 50%, #1e293b 100%)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.75)',
            }}
          >
            <div
              className="relative w-full py-2.5 sm:py-3 px-6 rounded-md flex items-center justify-center bg-slate-900/90 group-hover:bg-slate-800 transition-all"
              style={{
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span
                className="text-2xl sm:text-3xl font-black tracking-[0.12em] uppercase text-slate-100 font-mono drop-shadow group-hover:text-amber-300 transition-colors"
                style={{
                  fontFamily: "'Oswald', 'Chakra Petch', sans-serif",
                }}
              >
                CONFIGURACIÓN
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* BOTTOM-LEFT: Operator Badge (Antonio de Prado) */}
      <div className="absolute bottom-5 left-5 z-30 hidden sm:flex items-center gap-3 p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-amber-500/50 shadow-2xl font-mono select-none">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl shadow">
          👷
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-tight">
            OPERADOR DE MAQUINARIA PESADA
          </span>
          <span className="text-sm font-black text-white tracking-wide">ANTONIO DE PRADO</span>
          <span className="text-[10px] text-slate-400">14 Personas civiles en riesgo • Autopista Km 48</span>
        </div>
      </div>

      {/* BOTTOM-RIGHT: Highway Hazard Warning Signs (Faithful to Reference Mockup) */}
      <div className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-2 max-w-[220px] sm:max-w-[260px] pointer-events-none select-none">
        {/* Blinking Amber Hazard Beacon */}
        <div className="flex items-center gap-1.5 self-end mb-0.5">
          <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300 animate-ping" />
          <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 shadow-[0_0_10px_#f59e0b]" />
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/80 px-1.5 py-0.5 rounded border border-amber-500/40">
            ALERTA AMBER
          </span>
        </div>

        {/* Warning Board 1 */}
        <div className="w-full bg-[#f59e0b] text-black border-2 border-black p-2 rounded shadow-2xl font-mono text-center leading-tight">
          <div className="border border-black p-1 flex flex-col items-center">
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase">
              DERRUMBES Y TRÁFICO
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase">
              OBRA EN LA VÍA
            </span>
          </div>
        </div>

        {/* Warning Board 2 */}
        <div className="w-full bg-[#eab308] text-black border-2 border-black p-1.5 rounded shadow-xl font-mono text-center flex items-center justify-between px-2">
          <span className="text-xs font-black">◄</span>
          <div className="flex flex-col text-[9px] sm:text-[10px] font-black uppercase">
            <span>DERRUMBES</span>
            <span>DESVÍO OBLIGATORIO</span>
          </div>
          <span className="text-xs font-black">►</span>
        </div>
      </div>

      {/* MODAL: Tasks and Emergency Mission Objectives */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl border-2 border-amber-500 bg-slate-950 p-6 flex flex-col gap-4 shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-scaleUp font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-black uppercase text-amber-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                {activeModal === 'tasks' && 'TAREAS DE RUTA - DESPACHO'}
                {activeModal === 'objectives' && 'OBJETIVOS CRÍTICOS DE LA MISIÓN'}
                {activeModal === 'info' && 'ACERCA DEL SIMULADOR'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {activeModal === 'tasks' && (
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block">1. Llegada al Sector Aislado (Km 48)</span>
                    <span className="text-slate-400 text-[11px]">
                      Posicionar cargadora pesada o camión volquete frente a la masa de lodo.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block">2. Rompimiento de Rocas Gigantes</span>
                    <span className="text-slate-400 text-[11px]">
                      Empujar peñascos de más de 8 toneladas hacia el hombrillo para habilitar el carril 1.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block">3. Asistencia a Vehículos Atrapados</span>
                    <span className="text-slate-400 text-[11px]">
                      Acercar la maquinaria para despejar escombros alrededor de los 3 turismos civiles.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'objectives' && (
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/40">
                  <div className="flex justify-between font-bold text-emerald-400 mb-1">
                    <span>Despejar 240 Toneladas</span>
                    <span>0 / 240 T</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-0 h-full bg-emerald-500" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/40">
                  <div className="flex justify-between font-bold text-amber-400 mb-1">
                    <span>Rescate de Turismos Civiles</span>
                    <span>0 / 3 Vehículos</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-0 h-full bg-amber-500" />
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'info' && (
              <div className="flex flex-col gap-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-amber-400">Derrumbes Urbanos - Emergencia</strong> es un simulador táctico de despeje vial y operación de maquinaria pesada.
                </p>
                <p>
                  Inspirado en catástrofes de aluviones y deslaves en carreteras montañosas, el jugador debe operar cargadoras frontales, camiones tolva y retroexcavadoras para reabrir el paso vehicular y salvar vidas.
                </p>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 mt-2">
                  <span className="text-amber-400 font-bold block mb-1">ACCESOS DIRECTOS:</span>
                  <p className="text-[11px] text-slate-400">
                    Pulsa <strong className="text-white">JUGAR</strong> para iniciar la simulación, o pulsa <strong className="text-white">CONFIGURACIÓN</strong> para personalizar gráficos, volumen, controles y dificultad.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'church_photo' && (
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <div className="relative rounded-xl overflow-hidden border-2 border-amber-500 shadow-2xl">
                  <img
                    src={iglesiaBgImg}
                    alt="Iglesia de San Antonio de Prado, Antioquia"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover max-h-72"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 text-white">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                      ⛪ PARROQUIA DE SAN ANTONIO DE PRADO
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Corregimiento de San Antonio de Prado • Medellín, Antioquia • Cordillera de los Andes
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-amber-400">PATRIMONIO ARQUITECTÓNICO Y ESCENARIO:</strong>
                  </p>
                  <p>
                    La icónica Iglesia de San Antonio de Prado con su torre de reloj y fachada de ladrillo colonial domina el valle montañoso. En esta simulación, el deslave masivo ocurre en la vía montañosa que conecta el corregimiento.
                  </p>
                  <p className="text-emerald-400 font-bold">
                    ¡Ahora puedes cambiar la vista de fondo en cualquier momento pulsando el botón de FONDO o la tecla [C] durante la partida!
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'cranes_photo' && (
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <div className="relative rounded-xl overflow-hidden border-2 border-amber-500 shadow-2xl">
                  <img
                    src={rescueCranesImg}
                    alt="Operativo de Grúas y Maquinaria Pesada en Autopista"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover max-h-72"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 text-white">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                      🚨 OPERATIVO VIAL: REMOLQUE DE VEHÍCULOS CON GRÚAS PESADAS
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Sector Autopista Km 48 • 3.8 km de doble calzada y 5 grúas de auxilio en rotación continua
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-emerald-400">NUEVAS MECÁNICAS IMPLEMENTADAS:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>
                      <strong>Super Escudo de Fuerza Titánico [X]:</strong> Mayor duración (60s ampliables a 90s con baterías), +350% potencia hidráulica de empuje, protección total contra daño de rocas y auto-regeneración para que no se acabe rápido.
                    </li>
                    <li>
                      <strong>Cornetas Neumáticas de Tren [H]:</strong> Potente bocina de 5 acordes armónicos que emite ondas de choque acústicas para abrir paso y mover escombros livianos.
                    </li>
                    <li>
                      <strong>Ciclo de Día y Noche [N]:</strong> Transición realista entre luz solar diurna, atardecer dorado y noche cerrada con faros de alta potencia y balizas de emergencia.
                    </li>
                    <li>
                      <strong>Condiciones de Derrota (¡Se puede perder!):</strong> Monitorea el combustible de diésel, la integridad del chasis ante colisiones y el cronómetro de alerta antes del segundo colapso de montaña.
                    </li>
                    <li>
                      <strong>Carretera Espaciosa de 3.8 KM:</strong> 4 carriles anchos y cunetas de desagüe profundo para verter las rocas.
                    </li>
                    <li>
                      <strong>Flota de 5 Grúas Autónomas:</strong> Despacho realista y remolque hacia la Zona Segura con temporizador ETA en vivo.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                CERRAR
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  handlePlayClick();
                }}
                className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase"
              >
                INICIAR DESPEJE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
