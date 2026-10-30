import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Monitor,
  Gamepad2,
  Sliders,
  ShieldAlert,
  RotateCcw,
  Check,
  ChevronLeft,
  Sparkles,
  Zap,
  Gauge,
  Radio,
  Flame,
  Globe,
  Eye,
  Activity,
  HardHat,
} from 'lucide-react';
import { GameSettings } from '../types/game';
import { sound } from '../utils/audio';
import { DEFAULT_SETTINGS, saveSettings } from '../utils/storage';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onBack: () => void;
}

type TabType = 'audio' | 'graficos' | 'controles' | 'simulacion' | 'accesibilidad';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('audio');
  const [localSettings, setLocalSettings] = useState<GameSettings>({ ...settings });
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleTabChange = (tab: TabType) => {
    sound.playClick();
    setActiveTab(tab);
  };

  const updateField = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);

    // Apply live audio feedback if volume changed
    if (key === 'masterVolume' || key === 'sfxVolume' || key === 'ambientVolume' || key === 'enableAudio') {
      sound.setVolumes(
        key === 'masterVolume' ? (value as number) : updated.masterVolume,
        key === 'sfxVolume' ? (value as number) : updated.sfxVolume,
        key === 'ambientVolume' ? (value as number) : updated.ambientVolume,
        !updated.enableAudio
      );
    }
  };

  const handleSave = () => {
    sound.playClick();
    saveSettings(localSettings);
    onUpdateSettings(localSettings);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleReset = () => {
    sound.playClick();
    setLocalSettings({ ...DEFAULT_SETTINGS });
    saveSettings(DEFAULT_SETTINGS);
    onUpdateSettings(DEFAULT_SETTINGS);
    sound.setVolumes(
      DEFAULT_SETTINGS.masterVolume,
      DEFAULT_SETTINGS.sfxVolume,
      DEFAULT_SETTINGS.ambientVolume,
      !DEFAULT_SETTINGS.enableAudio
    );
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleTestSfx = (type: 'rock' | 'hydraulics' | 'horn' | 'radio') => {
    if (type === 'rock') sound.playRockImpact();
    else if (type === 'hydraulics') sound.playHydraulics();
    else if (type === 'horn') sound.playHorn();
    else if (type === 'radio') sound.playRadioChirp();
  };

  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      updateField('fullscreen', true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        updateField('fullscreen', false);
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Background industrial grid & lighting */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 20%, #38bdf8 0%, transparent 60%),
                            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
        }}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/80 border-b border-amber-500/50 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all active:scale-95 group font-mono text-sm"
          >
            <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span>VOLVER AL MENÚ</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg border border-amber-300/40">
              <Sliders className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase font-mono text-white flex items-center gap-2">
                CONFIGURACIÓN DEL SISTEMA
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  V.1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                AJUSTES DE OPERACIÓN • MAQUINARIA • RENDIMIENTO • CONTROLES
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono tracking-wider transition-colors active:scale-95"
            title="Restablecer valores predeterminados"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">RESTABLECER</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black font-mono tracking-widest text-xs uppercase shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>GUARDAR CAMBIOS</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar Tabs */}
        <nav className="w-full md:w-64 bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-800 p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible shrink-0 backdrop-blur-md">
          <button
            onClick={() => handleTabChange('audio')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm tracking-wide transition-all text-left whitespace-nowrap ${
              activeTab === 'audio'
                ? 'bg-amber-500/20 text-amber-300 border-l-4 border-amber-500 font-bold shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span>AUDIO & RADIOS</span>
              <span className="text-[10px] text-slate-400">Sonido diésel y ambiente</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('graficos')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm tracking-wide transition-all text-left whitespace-nowrap ${
              activeTab === 'graficos'
                ? 'bg-amber-500/20 text-amber-300 border-l-4 border-amber-500 font-bold shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="flex flex-col">
              <span>GRÁFICOS & CLIMA</span>
              <span className="text-[10px] text-slate-400">Lluvia, partículas, FPS</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('controles')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm tracking-wide transition-all text-left whitespace-nowrap ${
              activeTab === 'controles'
                ? 'bg-amber-500/20 text-amber-300 border-l-4 border-amber-500 font-bold shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span>CONTROLES DE PALAS</span>
              <span className="text-[10px] text-slate-400">Teclado, dirección, tactil</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('simulacion')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm tracking-wide transition-all text-left whitespace-nowrap ${
              activeTab === 'simulacion'
                ? 'bg-amber-500/20 text-amber-300 border-l-4 border-amber-500 font-bold shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex flex-col">
              <span>DIFICULTAD & DESLAVE</span>
              <span className="text-[10px] text-slate-400">Peligro, tráfico, daños</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('accesibilidad')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm tracking-wide transition-all text-left whitespace-nowrap ${
              activeTab === 'accesibilidad'
                ? 'bg-amber-500/20 text-amber-300 border-l-4 border-amber-500 font-bold shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Globe className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="flex flex-col">
              <span>IDIOMA & ACCESIBILIDAD</span>
              <span className="text-[10px] text-slate-400">HUD, daltonismo, textos</span>
            </div>
          </button>

          {/* Quick Info Box in sidebar */}
          <div className="hidden md:flex flex-col mt-auto p-3 rounded-lg bg-black/50 border border-slate-800 text-xs font-mono text-slate-400 gap-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <HardHat className="w-4 h-4" />
              <span>ESTADO DE OBRA</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Ajusta los parámetros para optimizar la fluidez de simulación en tu dispositivo.
            </p>
          </div>
        </nav>

        {/* Tab Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* TAB 1: AUDIO */}
          {activeTab === 'audio' && (
            <div className="max-w-4xl flex flex-col gap-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black font-mono uppercase text-white flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-amber-400" />
                    MEZCLA DE SONIDO & FRECUENCIAS DE EMERGENCIA
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Controla el volumen de la maquinaria pesada, impactos de escombros y clima exterior.
                  </p>
                </div>

                {/* Master Mute Toggle */}
                <button
                  onClick={() => updateField('enableAudio', !localSettings.enableAudio)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs font-bold transition-colors ${
                    localSettings.enableAudio
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-500/50'
                  }`}
                >
                  {localSettings.enableAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{localSettings.enableAudio ? 'SONIDO ACTIVO' : 'SILENCIADO'}</span>
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Master Volume */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-sm font-bold text-slate-200">Volumen General (Maestro)</span>
                    <span className="text-amber-400 font-bold">{localSettings.masterVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.masterVolume}
                    onChange={(e) => updateField('masterVolume', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>0% (Silencio)</span>
                    <span>50%</span>
                    <span>100% (Potencia Máxima)</span>
                  </div>
                </div>

                {/* SFX Volume */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-sm font-bold text-slate-200">Efectos de Maquinaria & Choques</span>
                    <span className="text-amber-400 font-bold">{localSettings.sfxVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.sfxVolume}
                    onChange={(e) => updateField('sfxVolume', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Motores y Orugas</span>
                    <span>Pala Hidráulica</span>
                    <span>Impactos</span>
                  </div>
                </div>

                {/* Ambient Storm Volume */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-sm font-bold text-slate-200">Ambiente & Lluvia Torrencial</span>
                    <span className="text-sky-400 font-bold">{localSettings.ambientVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.ambientVolume}
                    onChange={(e) => updateField('ambientVolume', Number(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Brisa</span>
                    <span>Lluvia Urbana</span>
                    <span>Tormenta Crítica</span>
                  </div>
                </div>

                {/* Radio CB Volume */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-sm font-bold text-slate-200">Central 911 / Radio de Operaciones</span>
                    <span className="text-emerald-400 font-bold">{localSettings.radioVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.radioVolume}
                    onChange={(e) => updateField('radioVolume', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Chirridos</span>
                    <span>Despacho</span>
                    <span>Alertas</span>
                  </div>
                </div>
              </div>

              {/* Sound Test Panel */}
              <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 flex flex-col gap-3">
                <span className="text-xs font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  PRUEBA INTERACTIVA DE EFECTOS DE SONIDO (AUDIO EN TIEMPO REAL)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleTestSfx('rock')}
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>🪨 Impacto Rocas</span>
                  </button>

                  <button
                    onClick={() => handleTestSfx('hydraulics')}
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>⚙️ Hidráulico Pala</span>
                  </button>

                  <button
                    onClick={() => handleTestSfx('horn')}
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>📢 Claxon Camión</span>
                  </button>

                  <button
                    onClick={() => handleTestSfx('radio')}
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>📻 Radio Transmisor</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRÁFICOS */}
          {activeTab === 'graficos' && (
            <div className="max-w-4xl flex flex-col gap-6 animate-fadeIn">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-lg font-black font-mono uppercase text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-sky-400" />
                  MOTOR GRÁFICO, RENDIMIENTO & CLIMA DINÁMICO
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Configura la fidelidad visual, efectos de partículas del deslave y tasa de fotogramas.
                </p>
              </div>

              {/* Quality Preset Buttons */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2.5">
                <span className="text-sm font-bold font-mono text-slate-200">Preajuste de Calidad Gráfica</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['baja', 'media', 'alta', 'ultra'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        sound.playClick();
                        updateField('graphicsQuality', q);
                      }}
                      className={`py-2 px-3 rounded-lg font-mono text-xs uppercase font-bold transition-all border ${
                        localSettings.graphicsQuality === q
                          ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dynamic Rain */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-bold text-slate-200">Lluvia Dinámica en Tiempo Real</span>
                    <span className="text-xs text-slate-400 font-mono">Generación procedural de gotas y salpicaduras</span>
                  </div>
                  <button
                    onClick={() => updateField('dynamicRain', !localSettings.dynamicRain)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      localSettings.dynamicRain ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        localSettings.dynamicRain ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Camera Droplets */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-bold text-slate-200">Gotas de Agua en Lente de Cámara</span>
                    <span className="text-xs text-slate-400 font-mono">Efecto realista de condensación en pantalla</span>
                  </div>
                  <button
                    onClick={() => updateField('cameraRainDrops', !localSettings.cameraRainDrops)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      localSettings.cameraRainDrops ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        localSettings.cameraRainDrops ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Lightning */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-bold text-slate-200">Relámpagos y Resplandores</span>
                    <span className="text-xs text-slate-400 font-mono">Destellos de tormenta en la montaña</span>
                  </div>
                  <button
                    onClick={() => updateField('lightningEffects', !localSettings.lightningEffects)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      localSettings.lightningEffects ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        localSettings.lightningEffects ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Fullscreen Button */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-bold text-slate-200">Modo Pantalla Completa</span>
                    <span className="text-xs text-slate-400 font-mono">Experiencia inmersiva en monitor completo</span>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-sky-400 border border-slate-700 transition"
                  >
                    CAMBIAR
                  </button>
                </div>
              </div>

              {/* Particle Density */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                <span className="text-sm font-bold font-mono text-slate-200">Densidad de Partículas de Lodo y Rocas</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['baja', 'media', 'alta'] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => {
                        sound.playClick();
                        updateField('particleDensity', density);
                      }}
                      className={`py-2 px-3 rounded font-mono text-xs uppercase font-bold transition border ${
                        localSettings.particleDensity === density
                          ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTROLES */}
          {activeTab === 'controles' && (
            <div className="max-w-4xl flex flex-col gap-6 animate-fadeIn">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-lg font-black font-mono uppercase text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  MAPEO DE CONTROLES & DIRECCIÓN HIDRÁULICA
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Personaliza cómo maniobras cargadoras frontales, camiones tolva y retroexcavadoras.
                </p>
              </div>

              {/* Control scheme selector */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                <span className="text-sm font-bold font-mono text-slate-200">Método de Control Primario</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'wasd', label: 'Teclas W-A-S-D', desc: 'Estándar de simuladores' },
                    { id: 'arrows', label: 'Flechas de Dirección', desc: 'Control clásico' },
                    { id: 'touch', label: 'Controles Táctiles en Pantalla', desc: 'Ideal para tablets y pantallas táctiles' },
                  ].map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => {
                        sound.playClick();
                        updateField('controlScheme', scheme.id as GameSettings['controlScheme']);
                      }}
                      className={`p-3 rounded-lg font-mono text-left transition border ${
                        localSettings.controlScheme === scheme.id
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-md'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700/80'
                      }`}
                    >
                      <div className="text-xs font-bold uppercase">{scheme.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{scheme.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Keymap Guide */}
              <div className="p-5 rounded-xl bg-black/70 border border-slate-800 flex flex-col gap-4">
                <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                  ASIGNACIÓN TÁCTICA DE MANDOS (EN PARTIDA)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 p-2.5 rounded bg-slate-900/80 border border-slate-800 font-mono">
                    <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-xs font-bold text-amber-400 shadow">
                      {localSettings.controlScheme === 'wasd' ? 'W' : '↑'}
                    </kbd>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-200">Acelerar / Empujar</span>
                      <span className="text-[10px] text-slate-400">Tracción hacia adelante</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded bg-slate-900/80 border border-slate-800 font-mono">
                    <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-xs font-bold text-amber-400 shadow">
                      {localSettings.controlScheme === 'wasd' ? 'S' : '↓'}
                    </kbd>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-200">Frenar / Reversa</span>
                      <span className="text-[10px] text-slate-400">Marcha atrás neumática</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded bg-slate-900/80 border border-slate-800 font-mono">
                    <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-xs font-bold text-amber-400 shadow">
                      {localSettings.controlScheme === 'wasd' ? 'A / D' : '← / →'}
                    </kbd>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-200">Viraje Hidráulico</span>
                      <span className="text-[10px] text-slate-400">Giro articulado</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded bg-slate-900/80 border border-slate-800 font-mono">
                    <kbd className="px-3 py-1 rounded bg-slate-800 border border-slate-600 text-xs font-bold text-emerald-400 shadow">
                      ESPACIO
                    </kbd>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-200">Accionar Pala / Cuchilla</span>
                      <span className="text-[10px] text-slate-400">Levantar o descargar rocas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded bg-slate-900/80 border border-slate-800 font-mono">
                    <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-xs font-bold text-sky-400 shadow">
                      H
                    </kbd>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-200">Claxon / Alerta</span>
                      <span className="text-[10px] text-slate-400">Avisar a rescatistas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded bg-slate-900/80 border border-slate-800 font-mono">
                    <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-xs font-bold text-rose-400 shadow">
                      ESC
                    </kbd>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-200">Pausa / Menú Rápido</span>
                      <span className="text-[10px] text-slate-400">Detener operación</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steering Sensitivity */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-sm font-bold text-slate-200">Sensibilidad de Dirección y Giro</span>
                  <span className="text-emerald-400 font-bold">{localSettings.steeringSensitivity} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={localSettings.steeringSensitivity}
                  onChange={(e) => updateField('steeringSensitivity', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* TAB 4: SIMULACIÓN & DIFICULTAD */}
          {activeTab === 'simulacion' && (
            <div className="max-w-4xl flex flex-col gap-6 animate-fadeIn">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-lg font-black font-mono uppercase text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  GRAVEDAD DEL DESASTRE & PARÁMETROS DE SIMULACIÓN
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Ajusta la dificultad operativa, la masa del derrumbe y las consecuencias de daño.
                </p>
              </div>

              {/* Disaster severity */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                <span className="text-sm font-bold font-mono text-slate-200">Magnitud del Deslizamiento</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'moderado',
                      label: 'Moderado (Nivel 1)',
                      desc: 'Deslizamiento parcial. Bloqueo de 1 carril. Tráfico paciente.',
                      color: 'border-yellow-500/60 text-yellow-400',
                    },
                    {
                      id: 'critico',
                      label: 'Crítico (Nivel 2)',
                      desc: 'Masa masiva de lodo y rocas. Vehículos civiles atrapados.',
                      color: 'border-amber-500/80 text-amber-400',
                    },
                    {
                      id: 'catastrofico',
                      label: 'Catastrófico (Nivel 3)',
                      desc: 'Colapso total de ladera. Lluvia extrema. Daño severo y tiempo estricto.',
                      color: 'border-rose-500 text-rose-400',
                    },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        sound.playClick();
                        updateField('disasterSeverity', s.id as GameSettings['disasterSeverity']);
                      }}
                      className={`p-3 rounded-lg font-mono text-left transition border ${
                        localSettings.disasterSeverity === s.id
                          ? `bg-slate-900 ${s.color} shadow-lg ring-1 ring-current`
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="text-xs font-bold uppercase">{s.label}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fuel */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-bold text-slate-200">Consumo de Diésel Realista</span>
                    <span className="text-xs text-slate-400 font-mono">El tanque se agota con el esfuerzo del motor</span>
                  </div>
                  <button
                    onClick={() => updateField('fuelConsumption', !localSettings.fuelConsumption)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      localSettings.fuelConsumption ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        localSettings.fuelConsumption ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Damage */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-bold text-slate-200">Daño Mecánico e Hidráulico</span>
                    <span className="text-xs text-slate-400 font-mono">Golpear piedras masivas desgasta la pala</span>
                  </div>
                  <button
                    onClick={() => updateField('machineryDamage', !localSettings.machineryDamage)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      localSettings.machineryDamage ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        localSettings.machineryDamage ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: IDIOMA & ACCESIBILIDAD */}
          {activeTab === 'accesibilidad' && (
            <div className="max-w-4xl flex flex-col gap-6 animate-fadeIn">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-lg font-black font-mono uppercase text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  IDIOMA, ESCALA DE INTERFAZ & ACCESIBILIDAD
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Adapta los textos, tamaño de elementos en pantalla y filtros para daltonismo.
                </p>
              </div>

              {/* Language */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                <span className="text-sm font-bold font-mono text-slate-200">Idioma de Voces e Interfaz</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'es', label: 'Español (América / España)' },
                    { id: 'en', label: 'English (US / UK)' },
                    { id: 'pt', label: 'Português (Brasil)' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        sound.playClick();
                        updateField('language', lang.id as GameSettings['language']);
                      }}
                      className={`p-2.5 rounded font-mono text-xs uppercase font-bold transition border ${
                        localSettings.language === lang.id
                          ? 'bg-purple-900/60 text-purple-300 border-purple-400 shadow-md'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* HUD Scale */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                <span className="text-sm font-bold font-mono text-slate-200">Tamaño del Radar y Marcadores (HUD)</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['pequeño', 'normal', 'grande'] as const).map((scale) => (
                    <button
                      key={scale}
                      onClick={() => {
                        sound.playClick();
                        updateField('hudScale', scale);
                      }}
                      className={`p-2.5 rounded font-mono text-xs uppercase font-bold transition border ${
                        localSettings.hudScale === scale
                          ? 'bg-purple-900/60 text-purple-300 border-purple-400 shadow-md'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colorblind */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
                <span className="text-sm font-bold font-mono text-slate-200">Filtro de Contraste para Daltonismo</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ninguno', label: 'Normal / Desactivado' },
                    { id: 'protanopia', label: 'Protanopía (Rojo)' },
                    { id: 'deuteranopia', label: 'Deuteranopía (Verde)' },
                    { id: 'tritanopia', label: 'Tritanopía (Azul)' },
                  ].map((cb) => (
                    <button
                      key={cb.id}
                      onClick={() => {
                        sound.playClick();
                        updateField('colorblindMode', cb.id as GameSettings['colorblindMode']);
                      }}
                      className={`p-2 rounded font-mono text-xs font-bold transition border ${
                        localSettings.colorblindMode === cb.id
                          ? 'bg-purple-900/60 text-purple-300 border-purple-400 shadow-md'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {cb.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Saved Toast Notification */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg bg-emerald-500 text-slate-950 font-mono font-black text-sm uppercase shadow-2xl animate-bounce">
          <Check className="w-5 h-5 stroke-[3]" />
          <span>CONFIGURACIÓN GUARDADA Y APLICADA CON ÉXITO</span>
        </div>
      )}
    </div>
  );
};
