import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Truck,
  Gauge,
  Wrench,
  CheckCircle,
  Lock,
  Flame,
  Award,
} from 'lucide-react';
import garageBgImg from '../assets/images/machinery_garage_bg_1790259248166.jpg';
import { Vehicle } from '../types/game';
import { sound } from '../utils/audio';

interface GarageScreenProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onUpgradeVehicle: (vehicleId: string, upgradeType: 'engine' | 'hydraulics' | 'tires' | 'plow') => void;
  onBack: () => void;
  onPlay: () => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onUpgradeVehicle,
  onBack,
  onPlay,
}) => {
  const currentIndex = vehicles.findIndex((v) => v.id === selectedVehicleId);
  const [index, setIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

  const currentVehicle = vehicles[index] || vehicles[0];

  const handleNext = () => {
    sound.playClick();
    setIndex((prev) => (prev + 1) % vehicles.length);
  };

  const handlePrev = () => {
    sound.playClick();
    setIndex((prev) => (prev - 1 + vehicles.length) % vehicles.length);
  };

  const handleSelectCurrent = () => {
    sound.playClick();
    if (currentVehicle.unlocked) {
      onSelectVehicle(currentVehicle.id);
    }
  };

  const isSelected = currentVehicle.id === selectedVehicleId;

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* Garage Background with Ambient Blur & Dark Gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
        style={{ backgroundImage: `url(${garageBgImg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-amber-500/40 bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all font-mono text-sm active:scale-95 group"
          >
            <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span>MENÚ PRINCIPAL</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white uppercase flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-400" />
              GARAJE DE MAQUINARIA PESADA
            </h1>
            <p className="text-xs text-amber-400/80 font-mono">
              UNIDADES DE DESPEJE DE DERRUMBES & RESCATE INDUSTRIAL
            </p>
          </div>
        </div>

        {/* Start Mission with Selected Vehicle */}
        <button
          onClick={() => {
            sound.playClick();
            handleSelectCurrent();
            onPlay();
          }}
          disabled={!currentVehicle.unlocked}
          className={`flex items-center gap-2 px-6 py-2.5 rounded font-black font-mono tracking-widest text-sm uppercase transition-all shadow-lg active:scale-95 ${
            currentVehicle.unlocked
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/30'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <span>OPERAR EN DERRUMBE</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </header>

      {/* Main Showcase & Stats Body */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between p-6 gap-6 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Left Column: Vehicle Selector & Showcase */}
        <div className="w-full lg:w-3/5 flex flex-col items-center justify-center gap-6">
          {/* Vehicle Navigation Carousel Controls */}
          <div className="flex items-center justify-between w-full max-w-md">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-slate-900/90 border border-amber-500/50 hover:bg-amber-500 hover:text-black transition-all shadow-lg active:scale-90"
              title="Vehículo Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase">
                UNIDAD {index + 1} DE {vehicles.length}
              </span>
              <div className="flex gap-1.5 mt-1">
                {vehicles.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-6 bg-amber-400' : 'w-2 bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-slate-900/90 border border-amber-500/50 hover:bg-amber-500 hover:text-black transition-all shadow-lg active:scale-90"
              title="Vehículo Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Central 3D Vehicle Card Box */}
          <div className="relative w-full max-w-lg aspect-16/10 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-slate-900/90 to-black/95 p-6 flex flex-col justify-between shadow-[0_0_35px_rgba(245,158,11,0.15)] overflow-hidden">
            {/* Lock Status overlay if locked */}
            {!currentVehicle.unlocked && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
                <Lock className="w-12 h-12 text-amber-500 animate-pulse" />
                <span className="font-mono font-black text-sm uppercase tracking-widest text-slate-200">
                  DESBLOQUEO AL COMPLETAR MISIÓN NIVEL 2
                </span>
              </div>
            )}

            {/* Top Bar of Card */}
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase">
                {currentVehicle.type}
              </span>
              <span className="text-xs font-mono text-slate-400">{currentVehicle.manufacturer}</span>
            </div>

            {/* Center Vehicle Holographic Graphic & Title */}
            <div className="flex flex-col items-center justify-center my-auto text-center z-10">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-2xl mb-3"
                style={{
                  borderColor: currentVehicle.color,
                  backgroundColor: `${currentVehicle.color}20`,
                }}
              >
                <Truck className="w-12 h-12" style={{ color: currentVehicle.color }} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-wide text-white uppercase drop-shadow">
                {currentVehicle.name}
              </h2>
              <p className="text-xs font-mono text-amber-400 mt-1">{currentVehicle.title}</p>
            </div>

            {/* Bottom Card Actions */}
            <div className="flex items-center justify-between z-10 pt-3 border-t border-slate-800">
              <button
                onClick={handleSelectCurrent}
                disabled={!currentVehicle.unlocked}
                className={`flex items-center gap-2 px-4 py-1.5 rounded font-mono text-xs font-bold uppercase transition ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>EQUIPADO ACTUAL</span>
                  </>
                ) : (
                  <span>EQUIPAR ESTA UNIDAD</span>
                )}
              </button>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 block">PESO EN SERVICIO</span>
                <span className="text-xs font-mono font-bold text-slate-300">{currentVehicle.weightTons} TONS</span>
              </div>
            </div>
          </div>

          {/* Description Paragraph */}
          <p className="text-xs sm:text-sm text-slate-300 font-mono max-w-lg leading-relaxed text-center px-4">
            {currentVehicle.description}
          </p>
        </div>

        {/* Right Column: Technical Specs & Upgrades */}
        <div className="w-full lg:w-2/5 flex flex-col gap-5 bg-black/75 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-mono font-bold text-base text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              FICHA TÉCNICA DE DESPEJE
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Parámetros de empuje y resistencia contra derrumbes
            </span>
          </div>

          {/* Spec Bars */}
          <div className="flex flex-col gap-3 font-mono text-xs">
            {/* Power */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Potencia de Motor Diésel:</span>
                <span className="text-amber-400 font-bold">{currentVehicle.powerHp} HP</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${(currentVehicle.powerHp / 600) * 100}%` }}
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Capacidad de Pala / Tolva:</span>
                <span className="text-sky-400 font-bold">{currentVehicle.capacityM3} m³</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${(currentVehicle.capacityM3 / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Hydraulic Force */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Fuerza Hidráulica de Ruptura:</span>
                <span className="text-emerald-400 font-bold">{currentVehicle.hydraulicForceKn} kN</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${(currentVehicle.hydraulicForceKn / 450) * 100}%` }}
                />
              </div>
            </div>

            {/* Speed */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Velocidad Máxima en Calzada:</span>
                <span className="text-purple-400 font-bold">{currentVehicle.topSpeedKmh} KM/H</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${(currentVehicle.topSpeedKmh / 100) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Upgrades Section */}
          <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-400" />
                MEJORAS EN TALLER
              </span>
              <span className="text-[10px] font-mono text-amber-400">NIVELES MÁX: 3</span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {/* Engine Upgrade */}
              <button
                onClick={() => {
                  sound.playHydraulics();
                  onUpgradeVehicle(currentVehicle.id, 'engine');
                }}
                className="p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500 transition text-left flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold">Motor Turbo</span>
                  <span className="text-amber-400">Nv.{currentVehicle.upgrades.engine}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1.5 flex-1 rounded ${
                        lvl <= currentVehicle.upgrades.engine ? 'bg-amber-400' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </button>

              {/* Hydraulics */}
              <button
                onClick={() => {
                  sound.playHydraulics();
                  onUpgradeVehicle(currentVehicle.id, 'hydraulics');
                }}
                className="p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500 transition text-left flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold">Hidráulica</span>
                  <span className="text-emerald-400">Nv.{currentVehicle.upgrades.hydraulics}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1.5 flex-1 rounded ${
                        lvl <= currentVehicle.upgrades.hydraulics ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </button>

              {/* Tires / Tracks */}
              <button
                onClick={() => {
                  sound.playHydraulics();
                  onUpgradeVehicle(currentVehicle.id, 'tires');
                }}
                className="p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500 transition text-left flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold">Neumáticos OTR</span>
                  <span className="text-sky-400">Nv.{currentVehicle.upgrades.tires}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1.5 flex-1 rounded ${
                        lvl <= currentVehicle.upgrades.tires ? 'bg-sky-400' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </button>

              {/* Plow */}
              <button
                onClick={() => {
                  sound.playHydraulics();
                  onUpgradeVehicle(currentVehicle.id, 'plow');
                }}
                className="p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500 transition text-left flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold">Pala de Acero</span>
                  <span className="text-purple-400">Nv.{currentVehicle.upgrades.plow}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1.5 flex-1 rounded ${
                        lvl <= currentVehicle.upgrades.plow ? 'bg-purple-400' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
