import React, { useEffect, useRef } from 'react';
import { GameSettings } from '../types/game';

interface RainCanvasProps {
  settings: GameSettings;
}

export const RainCanvas: React.FC<RainCanvasProps> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!settings.dynamicRain) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Raindrop count depends on graphics quality
    const counts = {
      baja: 90,
      media: 200,
      alta: 380,
      ultra: 600,
    };
    const count = counts[settings.graphicsQuality] || 250;

    interface Drop {
      x: number;
      y: number;
      speed: number;
      len: number;
      opacity: number;
      thickness: number;
    }

    interface Splash {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
    }

    interface WaterDot {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      decay: number;
    }

    const drops: Drop[] = [];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * (width + 300) - 150,
        y: Math.random() * height,
        speed: 18 + Math.random() * 16,
        len: 16 + Math.random() * 24,
        opacity: 0.15 + Math.random() * 0.35,
        thickness: 0.8 + Math.random() * 1.4,
      });
    }

    const splashes: Splash[] = [];
    const waterDots: WaterDot[] = [];
    let lightningIntensity = 0;
    let nextLightningTime = Date.now() + 6000 + Math.random() * 10000;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Lightning flash
      if (settings.lightningEffects) {
        const now = Date.now();
        if (now > nextLightningTime) {
          lightningIntensity = 0.55 + Math.random() * 0.35;
          nextLightningTime = now + 9000 + Math.random() * 14000;
        }
        if (lightningIntensity > 0.01) {
          ctx.fillStyle = `rgba(215, 235, 255, ${lightningIntensity * 0.35})`;
          ctx.fillRect(0, 0, width, height);
          lightningIntensity *= 0.82;
        }
      }

      // Slanted rain angle
      const slant = 3.2;

      // Draw and update drops
      ctx.strokeStyle = 'rgba(210, 230, 255, 0.45)';
      ctx.lineCap = 'round';

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.lineWidth = d.thickness;
        ctx.strokeStyle = `rgba(200, 225, 255, ${d.opacity})`;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + slant * (d.len / 12), d.y + d.len);
        ctx.stroke();

        d.x += slant * (d.speed / 12);
        d.y += d.speed;

        // Ground splash when hitting bottom area
        if (d.y > height - 120 && Math.random() < 0.2) {
          splashes.push({
            x: d.x,
            y: d.y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 3 - 1,
            life: 0,
            maxLife: 10 + Math.random() * 8,
          });
        }

        // Reset drop
        if (d.y > height) {
          d.y = -d.len;
          d.x = Math.random() * (width + 300) - 150;
        }
      }

      // Draw splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.25; // gravity
        s.life++;

        const alpha = Math.max(0, 1 - s.life / s.maxLife) * 0.4;
        ctx.fillStyle = `rgba(220, 240, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx.fill();

        if (s.life >= s.maxLife) {
          splashes.splice(i, 1);
        }
      }

      // Camera lens droplets if enabled
      if (settings.cameraRainDrops) {
        if (Math.random() < 0.04 && waterDots.length < 18) {
          waterDots.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 3 + Math.random() * 9,
            alpha: 0.5 + Math.random() * 0.4,
            decay: 0.0015 + Math.random() * 0.002,
          });
        }

        for (let i = waterDots.length - 1; i >= 0; i--) {
          const wd = waterDots[i];
          wd.alpha -= wd.decay;
          wd.y += 0.15; // slow drip

          if (wd.alpha <= 0) {
            waterDots.splice(i, 1);
            continue;
          }

          // Outer refraction ring
          ctx.beginPath();
          ctx.arc(wd.x, wd.y, wd.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${wd.alpha * 0.35})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Inner highlight
          ctx.beginPath();
          ctx.arc(wd.x - wd.radius * 0.3, wd.y - wd.radius * 0.3, wd.radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${wd.alpha * 0.5})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [settings.dynamicRain, settings.graphicsQuality, settings.cameraRainDrops, settings.lightningEffects]);

  if (!settings.dynamicRain) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
};
