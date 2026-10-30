import React, { useState } from 'react';
import { Crosshair, MapPin, ZoomIn, ZoomOut, AlertTriangle, Layers } from 'lucide-react';
import radarMapImg from '../assets/images/radar_minimap_img_1790259262033.jpg';
import { sound } from '../utils/audio';

interface MiniMapProps {
  tasksEnabled: boolean;
  objectivesEnabled: boolean;
  particlesEnabled: boolean;
  onToggleTasks: () => void;
  onToggleObjectives: () => void;
  onToggleParticles: () => void;
  playerCoords?: { x: number; y: number; angle: number };
}

export const MiniMap: React.FC<MiniMapProps> = ({
  tasksEnabled,
  objectivesEnabled,
  particlesEnabled,
  onToggleTasks,
  onToggleObjectives,
  onToggleParticles,
  playerCoords = { x: 50, y: 56, angle: 0 },
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleZoomToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setZoom((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  const handleExpandToggle = () => {
    sound.playClick();
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-2 select-none z-30">
      {/* Radar Box */}
      <div
        onClick={handleExpandToggle}
        className={`relative overflow-hidden rounded-md border-2 border-emerald-500/70 bg-black/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-md transition-all duration-300 cursor-pointer ${
          isExpanded ? 'w-72 h-72' : 'w-44 h-44 sm:w-48 sm:h-48'
        }`}
      >
        {/* Satellite Background */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300"
          style={{
            backgroundImage: `url(${radarMapImg})`,
            transform: `scale(${zoom})`,
          }}
        />

        {/* Tactical Dark Overlay */}
        <div className="absolute inset-0 bg-emerald-950/40 mix-blend-multiply" />

        {/* GPS Grid lines */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(16, 185, 129, 0.4) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Radar Circular Sweep */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full rounded-full border border-emerald-400/30 scale-95" />
          <div className="w-2/3 h-2/3 rounded-full border border-emerald-400/20" />
          <div className="w-1/3 h-1/3 rounded-full border border-emerald-400/20" />
          {/* Sweep beam */}
          <div
            className="absolute inset-0 origin-center animate-[spin_4s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 290deg, rgba(52, 211, 153, 0.35) 360deg)',
            }}
          />
        </div>

        {/* Landslide Hazard Area Beacon */}
        <div className="absolute top-[38%] left-[46%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="absolute w-8 h-8 rounded-full bg-amber-500/30 animate-ping" />
          <div className="w-5 h-5 rounded-full border-2 border-dashed border-amber-400 bg-amber-600/40 flex items-center justify-center">
            <AlertTriangle className="w-3 h-3 text-amber-300" />
          </div>
        </div>

        {/* Player Position (Green Tactical Arrow matching reference) */}
        <div
          className="absolute pointer-events-none transition-all duration-150"
          style={{
            top: `${playerCoords.y}%`,
            left: `${playerCoords.x}%`,
            transform: `translate(-50%, -50%) rotate(${playerCoords.angle}deg)`,
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Glow */}
            <div className="absolute w-6 h-6 rounded-full bg-emerald-400/40 blur-xs" />
            {/* Green Arrow */}
            <svg
              className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_#10b981]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="12 2, 22 21, 12 16, 2 21" />
            </svg>
          </div>
        </div>

        {/* Corner HUD labels */}
        <div className="absolute top-1 left-1.5 flex items-center gap-1 text-[9px] font-mono tracking-wider text-emerald-400 bg-black/60 px-1 rounded">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          GPS AUTO
        </div>

        <div className="absolute bottom-1 left-1.5 text-[8px] font-mono text-emerald-300/80 bg-black/60 px-1 rounded">
          KM 48.2 • SECTOR-A
        </div>

        {/* Zoom controls */}
        <div className="absolute top-1 right-1 flex flex-col gap-1">
          <button
            onClick={handleZoomToggle}
            className="p-1 rounded bg-black/70 hover:bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:text-white transition-colors"
            title="Ajustar Zoom"
          >
            {zoom > 1 ? <ZoomOut className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Checklist Toggles Matching Reference Screenshot */}
      <div className="flex flex-col gap-1.5 bg-black/75 backdrop-blur-md p-2 rounded-md border border-slate-700/80 shadow-lg text-[11px] font-bold font-mono tracking-wide">
        {/* TASKS */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleTasks();
          }}
          className="flex items-center gap-2 text-left hover:text-amber-400 transition-colors group"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              tasksEnabled
                ? 'border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_6px_#10b981]'
                : 'border-slate-600 bg-black/60 text-transparent'
            }`}
          >
            <span className="text-[10px]">✓</span>
          </div>
          <span className="text-amber-400 group-hover:text-amber-300">TASKS (TAREAS DE RUTA)</span>
        </button>

        {/* OBJETIVOS */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleObjectives();
          }}
          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors group"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              objectivesEnabled
                ? 'border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_6px_#10b981]'
                : 'border-slate-600 bg-black/60 text-transparent'
            }`}
          >
            <span className="text-[10px]">✓</span>
          </div>
          <span className="text-slate-200 group-hover:text-white">OBJETIVOS DE DESPEJE</span>
        </button>

        {/* DINAMICS PARTICLES */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleParticles();
          }}
          className="flex items-center gap-2 text-left hover:text-emerald-400 transition-colors group"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              particlesEnabled
                ? 'border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_6px_#10b981]'
                : 'border-slate-600 bg-black/60 text-transparent'
            }`}
          >
            <span className="text-[10px]">✓</span>
          </div>
          <span className="text-slate-200 group-hover:text-white">DYNAMICS PARTICLES</span>
        </button>
      </div>

      {/* Main Title Badge Matching Reference Screenshot */}
      <div className="bg-black/85 backdrop-blur-md border-l-4 border-amber-500 px-3 py-1.5 rounded-r shadow-md">
        <h2 className="text-xs sm:text-sm font-black tracking-widest text-slate-100 uppercase font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          DERRUMBES URBANOS - EMERGENCIA
        </h2>
        <p className="text-[10px] text-amber-400/90 font-mono tracking-wider">
          CALZADA PRINCIPAL BLOQUEADA • VÍA SUR-NORTE
        </p>
      </div>
    </div>
  );
};
