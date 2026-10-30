import React, { useState, useEffect } from 'react';
import { GameScreen, GameSettings, Vehicle } from './types/game';
import {
  loadSettings,
  saveSettings,
  loadVehicles,
  saveVehicles,
  getSelectedVehicleId,
  setSelectedVehicleId,
} from './utils/storage';
import { sound } from './utils/audio';
import { RainCanvas } from './components/RainCanvas';
import { MainScreen } from './components/MainScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { GarageScreen } from './components/GarageScreen';
import { GameScreen as PlayableSimulation } from './components/GameScreen';
import { EmergencyRadioHUD } from './components/EmergencyRadioHUD';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [vehicles, setVehicles] = useState<Vehicle[]>(loadVehicles);
  const [selectedVehicleId, setVehicleId] = useState<string>(getSelectedVehicleId);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!settings.enableAudio);

  // Apply sound settings on initial mount
  useEffect(() => {
    sound.setVolumes(
      settings.masterVolume,
      settings.sfxVolume,
      settings.ambientVolume,
      !settings.enableAudio
    );
  }, [settings]);

  // Start ambient storm sound when audio is enabled
  useEffect(() => {
    if (settings.enableAudio && settings.ambientVolume > 0) {
      sound.startAmbientRain();
    } else {
      sound.stopAmbientRain();
    }
    return () => {
      sound.stopAmbientRain();
    };
  }, [settings.enableAudio, settings.ambientVolume]);

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsAudioMuted(!newSettings.enableAudio);
  };

  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    const updated = { ...settings, enableAudio: !nextMuted };
    setSettings(updated);
    saveSettings(updated);
    sound.setVolumes(
      updated.masterVolume,
      updated.sfxVolume,
      updated.ambientVolume,
      nextMuted
    );
  };

  const handleSelectVehicle = (id: string) => {
    setVehicleId(id);
    setSelectedVehicleId(id);
  };

  const handleUpgradeVehicle = (
    vehicleId: string,
    upgradeType: 'engine' | 'hydraulics' | 'tires' | 'plow'
  ) => {
    const updatedVehicles = vehicles.map((v) => {
      if (v.id === vehicleId) {
        const currentLevel = v.upgrades[upgradeType];
        if (currentLevel < 3) {
          return {
            ...v,
            upgrades: {
              ...v.upgrades,
              [upgradeType]: currentLevel + 1,
            },
            powerHp: upgradeType === 'engine' ? v.powerHp + 35 : v.powerHp,
            hydraulicForceKn: upgradeType === 'hydraulics' ? v.hydraulicForceKn + 25 : v.hydraulicForceKn,
            topSpeedKmh: upgradeType === 'tires' ? v.topSpeedKmh + 5 : v.topSpeedKmh,
          };
        }
      }
      return v;
    });

    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);
  };

  const activeVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* Dynamic Rain & Thunder Weather Layer (Configurable in Settings) */}
      <RainCanvas settings={settings} />

      {/* Screen Router */}
      {currentScreen === 'menu' && (
        <>
          <MainScreen
            settings={settings}
            onPlay={() => setCurrentScreen('game')}
            onOpenGarage={() => setCurrentScreen('garage')}
            onOpenSettings={() => setCurrentScreen('settings')}
            onToggleAudio={handleToggleAudio}
            isAudioMuted={isAudioMuted}
          />
          {/* CB Radio Dispatches in Menu */}
          <EmergencyRadioHUD enabled={settings.enableAudio} />
        </>
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => setCurrentScreen('menu')}
        />
      )}

      {currentScreen === 'garage' && (
        <GarageScreen
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
          onUpgradeVehicle={handleUpgradeVehicle}
          onBack={() => setCurrentScreen('menu')}
          onPlay={() => setCurrentScreen('game')}
        />
      )}

      {currentScreen === 'game' && (
        <PlayableSimulation
          settings={settings}
          vehicle={activeVehicle}
          onOpenSettings={() => setCurrentScreen('settings')}
          onBackToMenu={() => setCurrentScreen('menu')}
        />
      )}
    </div>
  );
}
