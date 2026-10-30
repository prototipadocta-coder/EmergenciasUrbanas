import React, { useEffect, useState } from 'react';
import { Radio, AlertOctagon, X } from 'lucide-react';
import { sound } from '../utils/audio';

export interface DispatchMessage {
  id: string;
  sender: string;
  callsign: string;
  message: string;
  timestamp: string;
  priority: 'ALERTA ROJA' | 'OPERACIONES' | 'TRÁFICO';
}

const SAMPLE_DISPATCHES: DispatchMessage[] = [
  {
    id: '1',
    sender: 'Central de Emergencias 911',
    callsign: 'CONTROL VIAL SUR',
    message: 'Atención todas las unidades pesadas: Aluvión en km 48. Despejen carril izquierdo prioritario para paso de ambulancias.',
    timestamp: '14:22',
    priority: 'ALERTA ROJA',
  },
  {
    id: '2',
    sender: 'Policía de Carreteras',
    callsign: 'PATRULLA-04',
    message: 'Reportamos 3 vehículos particulares atrapados bajo el talud de lodo. Se requiere retroexcavadora y cabrestante inmediato.',
    timestamp: '14:24',
    priority: 'ALERTA ROJA',
  },
  {
    id: '3',
    sender: 'Supervisor de Obras Públicas',
    callsign: 'INGENIERO VIAL',
    message: 'La lluvia continúa saturando la ladera de la montaña. Mantengan los camiones volqueta en rotación constante para botar escombros.',
    timestamp: '14:26',
    priority: 'OPERACIONES',
  },
];

interface EmergencyRadioHUDProps {
  enabled: boolean;
}

export const EmergencyRadioHUD: React.FC<EmergencyRadioHUDProps> = ({ enabled }) => {
  const [currentMessage, setCurrentMessage] = useState<DispatchMessage | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    // Show initial message after a brief delay
    const timer1 = setTimeout(() => {
      sound.playRadioChirp();
      setCurrentMessage(SAMPLE_DISPATCHES[0]);
    }, 2000);

    // Periodically cycle messages
    const interval = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % SAMPLE_DISPATCHES.length;
        sound.playRadioChirp();
        setCurrentMessage(SAMPLE_DISPATCHES[next]);
        return next;
      });
    }, 18000);

    return () => {
      clearTimeout(timer1);
      clearInterval(interval);
    };
  }, [enabled]);

  if (!enabled || !currentMessage) return null;

  return (
    <div className="fixed bottom-24 left-6 z-40 max-w-sm sm:max-w-md w-full animate-slideUp">
      <div className="bg-black/90 border-2 border-emerald-500/80 rounded-xl p-3.5 shadow-[0_0_20px_rgba(16,185,129,0.25)] backdrop-blur-md font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/40 pb-2 mb-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>RADIO CB CANAL 16 • {currentMessage.callsign}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                currentMessage.priority === 'ALERTA ROJA'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/50'
              }`}
            >
              {currentMessage.priority}
            </span>
            <button
              onClick={() => setCurrentMessage(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <p className="text-slate-200 leading-relaxed text-[11px]">
          <span className="text-emerald-400 font-bold">[{currentMessage.sender}]: </span>
          "{currentMessage.message}"
        </p>

        {/* Audio frequency wave visualizer */}
        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-800">
          <span className="text-[9px] text-slate-500">FREQ 148.520 MHz</span>
          <div className="flex items-center gap-0.5 ml-auto">
            {[4, 12, 8, 16, 10, 6, 14, 8, 4].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-emerald-400 rounded-full animate-pulse"
                style={{
                  height: `${h}px`,
                  animationDuration: `${0.6 + (i % 3) * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
